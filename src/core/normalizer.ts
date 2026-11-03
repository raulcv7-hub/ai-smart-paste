export const EOL_LF = 1;
export const EOL_CRLF = 2;

/**
 * Normalizes text line endings to match the target document EOL convention.
 * Compatible with vscode.EndOfLine without requiring runtime imports.
 *
 * @param content - Input text to normalize.
 * @param eol - Target EOL convention (1 for LF, 2 for CRLF).
 * @returns Unified line ending content.
 */
export function normalizeLineEndings(content: string, eol: number): string {
    const targetSeparator = eol === EOL_CRLF ? '\r\n' : '\n';
    return content.replace(/\r?\n/g, targetSeparator);
}