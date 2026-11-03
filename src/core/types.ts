/**
 * Operating mode determined by the parser based on clipboard payload.
 */
export type ParseMode = 'TOUCH' | 'CONTENT';

/**
 * Result contract returned by the clipboard parser.
 */
export interface ParseResult {
    readonly mode: ParseMode;
    readonly relativePath: string;
    readonly content: string;
}

/**
 * Line diff statistics comparing previous buffer content with new payload.
 */
export interface DiffStats {
    readonly added: number;
    readonly removed: number;
    readonly firstChangedLine: number;
}