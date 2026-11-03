import { DiffStats } from './types';

export type HunkType = 'added' | 'deleted';

export interface DiffHunk {
    readonly id: number;
    readonly type: HunkType;
    readonly newStartLine: number;
    readonly newEndLine: number;
    readonly oldText: string;
    readonly isDeletionOnly: boolean;
}

export interface DetailedDiff {
    readonly stats: DiffStats;
    readonly addedLineIndices: number[];
    readonly modifiedLineIndices: number[];
    readonly deletedAnchorIndices: number[];
    readonly hunks: DiffHunk[];
}

/**
 * Backward-compatible helper returning basic line diff metrics.
 *
 * @param oldText - Previous buffer content.
 * @param newText - Target replacement content.
 * @returns Summary diff statistics.
 */
export function calculateDiffStats(oldText: string, newText: string): DiffStats {
    return calculateDetailedDiff(oldText, newText).stats;
}

/**
 * Computes exact line-level diff metrics using pure textbook LCS with quote and whitespace tolerance.
 *
 * @param oldText - Previous buffer content.
 * @param newText - Target replacement content.
 * @returns Detailed line diff indices and interactive restoration hunks.
 */
export function calculateDetailedDiff(oldText: string, newText: string): DetailedDiff {
    const oldLines = oldText ? oldText.split(/\r?\n/) : [];
    const newLines = newText ? newText.split(/\r?\n/) : [];

    const deletedAnchorIndices: number[] = [];
    const rawHunks: DiffHunk[] = [];

    if (oldLines.length === 0) {
        const addedLineIndices = newLines.map((_, i) => i);
        const hunks: DiffHunk[] = newLines.length > 0 ? [{
            id: 0,
            type: 'added',
            newStartLine: 0,
            newEndLine: newLines.length - 1,
            oldText: '',
            isDeletionOnly: false
        }] : [];

        return {
            stats: { added: newLines.length, removed: 0, firstChangedLine: 0 },
            addedLineIndices,
            modifiedLineIndices: [],
            deletedAnchorIndices,
            hunks
        };
    }

    const matches = computeLCS(oldLines, newLines);
    const matchedNewSet = new Set(matches.map(m => m.newIdx));

    let oldIdx = 0;
    let newIdx = 0;
    let firstChangedLine = -1;
    let hunkIdCounter = 0;

    for (let m = 0; m <= matches.length; m++) {
        const matchOld = m < matches.length ? matches[m].oldIdx : oldLines.length;
        const matchNew = m < matches.length ? matches[m].newIdx : newLines.length;

        const deletedSlice = oldLines.slice(oldIdx, matchOld);
        const addedSlice = newLines.slice(newIdx, matchNew);

        if (deletedSlice.length > 0 || addedSlice.length > 0) {
            if (firstChangedLine === -1) {
                firstChangedLine = newIdx;
            }

            if (deletedSlice.length > 0) {
                const anchor = Math.max(0, Math.min(newLines.length - 1, newIdx > 0 ? newIdx - 1 : 0));
                deletedAnchorIndices.push(anchor);
                rawHunks.push({
                    id: hunkIdCounter++,
                    type: 'deleted',
                    newStartLine: anchor,
                    newEndLine: anchor,
                    oldText: deletedSlice.join('\n'),
                    isDeletionOnly: true
                });
            }

            if (addedSlice.length > 0) {
                rawHunks.push({
                    id: hunkIdCounter++,
                    type: 'added',
                    newStartLine: newIdx,
                    newEndLine: newIdx + addedSlice.length - 1,
                    oldText: '',
                    isDeletionOnly: false
                });
            }
        }

        if (m < matches.length) {
            oldIdx = matchOld + 1;
            newIdx = matchNew + 1;
        }
    }

    const hunks = mergeHunks(rawHunks);

    const addedLineIndices: number[] = [];
    for (let j = 0; j < newLines.length; j++) {
        if (!matchedNewSet.has(j)) {
            addedLineIndices.push(j);
        }
    }

    for (const h of hunks) {
        if (h.type === 'added') {
            for (let line = h.newStartLine; line <= h.newEndLine; line++) {
                if (!addedLineIndices.includes(line)) {
                    addedLineIndices.push(line);
                }
            }
        }
    }
    addedLineIndices.sort((a, b) => a - b);

    const lineDelta = newLines.length - oldLines.length;
    const added = lineDelta > 0 ? lineDelta : 0;
    const removed = lineDelta < 0 ? Math.abs(lineDelta) : 0;

    return {
        stats: {
            added,
            removed,
            firstChangedLine: firstChangedLine === -1 ? 0 : firstChangedLine
        },
        addedLineIndices,
        modifiedLineIndices: [],
        deletedAnchorIndices,
        hunks
    };
}

function normalizeForComparison(line: string): string {
    return line.trimEnd().replace(/'/g, '"');
}

function computeLCS(oldLines: string[], newLines: string[]): { oldIdx: number; newIdx: number }[] {
    const n = oldLines.length;
    const m = newLines.length;

    if (n === 0 || m === 0) {
        return [];
    }

    const a = oldLines.map(normalizeForComparison);
    const b = newLines.map(normalizeForComparison);

    const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));

    for (let i = 1; i <= n; i++) {
        for (let j = 1; j <= m; j++) {
            if (a[i - 1] === b[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }

    const matches: { oldIdx: number; newIdx: number }[] = [];
    let i = n;
    let j = m;

    while (i > 0 && j > 0) {
        if (a[i - 1] === b[j - 1]) {
            matches.push({ oldIdx: i - 1, newIdx: j - 1 });
            i--;
            j--;
        } else if (dp[i - 1][j] > dp[i][j - 1]) {
            i--;
        } else {
            j--;
        }
    }

    return matches.reverse();
}

function mergeHunks(hunks: DiffHunk[]): DiffHunk[] {
    if (hunks.length <= 1) {
        return hunks;
    }

    const merged: DiffHunk[] = [];
    let current = hunks[0];

    for (let i = 1; i < hunks.length; i++) {
        const next = hunks[i];
        const gap = next.newStartLine - current.newEndLine - 1;

        if (current.type === 'added' && next.type === 'added' && gap <= 2) {
            current = {
                id: current.id,
                type: 'added',
                newStartLine: current.newStartLine,
                newEndLine: next.newEndLine,
                oldText: '',
                isDeletionOnly: false
            };
        } else {
            merged.push(current);
            current = next;
        }
    }
    merged.push(current);

    return merged;
}