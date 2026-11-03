import { DiffStats } from './types';

/**
 * Calculates line-level difference and identifies the first modified line index.
 *
 * @param oldText - Previous buffer content.
 * @param newText - Target replacement content.
 * @returns Calculated metrics for feedback and cursor positioning.
 */
export function calculateDiffStats(oldText: string, newText: string): DiffStats {
    const oldLines = oldText ? oldText.split(/\r?\n/) : [];
    const newLines = newText ? newText.split(/\r?\n/) : [];

    let firstChangedLine = 0;
    const minLength = Math.min(oldLines.length, newLines.length);

    while (firstChangedLine < minLength && oldLines[firstChangedLine] === newLines[firstChangedLine]) {
        firstChangedLine++;
    }

    const lineDelta = newLines.length - oldLines.length;
    const added = lineDelta > 0 ? lineDelta : 0;
    const removed = lineDelta < 0 ? Math.abs(lineDelta) : 0;

    return {
        added,
        removed,
        firstChangedLine: Math.max(0, firstChangedLine)
    };
}