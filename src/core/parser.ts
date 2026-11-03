import { ParseMode, ParseResult } from './types';

const COMMON_UI_LABELS = new Set([
    'code', 'copy code', 'typescript', 'javascript',
    'python', 'html', 'css', 'json', 'yaml', 'bash', 'sh', 'sql'
]);

/**
 * Extracts and sanitizes the target file path from the initial line.
 * Supports standard paths, dotfiles (.env), extensionless files (Makefile), and quoted spaces.
 *
 * @param line - Raw line containing the candidate path.
 * @returns Cleaned relative or absolute path.
 */
export function extractPath(line: string): string {
    let sanitized = line.trim();
    
    sanitized = sanitized.replace(/^[#\-*]+\s*/, '');
    sanitized = sanitized.replace(/<[^>]+>/g, '');
    sanitized = sanitized.replace(/^(File|Ruta|Path|Archivo|Source):\s*/i, '');

    const quotedMatch = sanitized.match(/["'`]([^"'`]+)["'`]/);
    if (quotedMatch) {
        return quotedMatch[1].trim();
    }

    return sanitized.split(/[\s()]/)[0].trim();
}

/**
 * Parses raw clipboard text according to strict isolated path directives and code fences.
 *
 * @param rawText - Raw text directly extracted from clipboard.
 * @returns Parsed result indicating operation mode and sanitized content.
 */
export function parseClipboard(rawText: string): ParseResult | null {
    if (!rawText || rawText.trim().length === 0) {
        return null;
    }

    const lines = rawText.trim().split(/\r?\n/);
    const targetPath = extractPath(lines[0]);

    if (!targetPath) {
        return null;
    }

    // Si solo hay una línea, o las líneas siguientes están vacías -> MODO TOUCH
    const remainingText = lines.slice(1).join('\n').trim();
    if (remainingText.length === 0) {
        return { mode: 'TOUCH', relativePath: targetPath, content: '' };
    }

    let codeStartIndex = -1;
    let codeEndIndex = lines.length;

    for (let i = 1; i < lines.length; i++) {
        const trimmed = lines[i].trim().toLowerCase();

        if (trimmed.startsWith('```')) {
            codeStartIndex = i + 1;
            break;
        }

        if (COMMON_UI_LABELS.has(trimmed)) {
            const nextLine = lines[i + 1]?.trim().toLowerCase();
            if (nextLine && COMMON_UI_LABELS.has(nextLine)) {
                codeStartIndex = i + 2;
            } else {
                codeStartIndex = i + 1;
            }
            break;
        }
    }

    if (codeStartIndex === -1) {
        codeStartIndex = 1;
    }

    for (let i = lines.length - 1; i >= codeStartIndex; i--) {
        const trimmed = lines[i].trim();
        if (trimmed.startsWith('```')) {
            codeEndIndex = i;
            break;
        }
    }

    const contentLines = lines.slice(codeStartIndex, codeEndIndex);
    const rawContent = contentLines.join('\n').trim();

    if (rawContent.length === 0) {
        return { mode: 'TOUCH', relativePath: targetPath, content: '' };
    }

    return {
        mode: 'CONTENT',
        relativePath: targetPath,
        content: rawContent + '\n'
    };
}