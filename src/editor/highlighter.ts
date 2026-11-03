import * as vscode from 'vscode';
import { DetailedDiff, DiffHunk } from '../core/diffCalculator';

/**
 * Manages Git-style inline ghost diff decorations directly in the active text editor.
 */
export class Highlighter {
    private addedType: vscode.TextEditorDecorationType | null = null;
    private deletedType: vscode.TextEditorDecorationType | null = null;
    private interactionListeners: vscode.Disposable[] = [];
    private activeHunks = new Map<number, { hunk: DiffHunk; documentUri: string }>();
    private isPaused = false;

    /**
     * Temporarily suppresses document change listeners during programmatic edits.
     */
    public pause(): void {
        this.isPaused = true;
    }

    /**
     * Resumes document change listeners.
     */
    public resume(): void {
        this.isPaused = false;
    }

    /**
     * Retrieves an active hunk by its numeric identifier.
     *
     * @param hunkId - Target hunk identifier.
     * @returns Hunk data and associated document URI, or undefined.
     */
    public getHunk(hunkId: number): { hunk: DiffHunk; documentUri: string } | undefined {
        return this.activeHunks.get(hunkId);
    }

    /**
     * Applies additions and inline deletion badges with targeted hover previews.
     *
     * @param editor - Target active text editor.
     * @param diff - Calculated line differences and deletion anchors.
     */
    public highlightDiff(editor: vscode.TextEditor, diff: DetailedDiff): void {
        this.clear();

        try {
            if (editor.document.lineCount === 0) {
                return;
            }

            this.addedType = vscode.window.createTextEditorDecorationType({
                isWholeLine: true,
                backgroundColor: 'rgba(46, 160, 67, 0.18)',
                overviewRulerColor: 'rgba(46, 160, 67, 0.8)',
                overviewRulerLane: vscode.OverviewRulerLane.Right
            });

            this.deletedType = vscode.window.createTextEditorDecorationType({
                isWholeLine: true,
                borderWidth: '0 0 2px 0',
                borderStyle: 'solid',
                borderColor: 'rgba(248, 81, 73, 0.85)',
                overviewRulerColor: 'rgba(248, 81, 73, 0.8)',
                overviewRulerLane: vscode.OverviewRulerLane.Right
            });

            const maxLineIndex = editor.document.lineCount - 1;
            const languageId = editor.document.languageId;
            const uriStr = editor.document.uri.toString();

            for (const hunk of diff.hunks) {
                this.activeHunks.set(hunk.id, { hunk, documentUri: uriStr });
            }

            const addedOptions: vscode.DecorationOptions[] = [];
            for (const line of diff.addedLineIndices) {
                if (line < 0 || line > maxLineIndex) {
                    continue;
                }
                const hunk = diff.hunks.find(h => h.type === 'added' && h.newStartLine === line);
                let renderOptions: vscode.DecorationInstanceRenderOptions | undefined;

                if (hunk) {
                    const count = hunk.newEndLine - hunk.newStartLine + 1;
                    renderOptions = {
                        after: {
                            contentText: `  🟢 [+${count} lines]`,
                            color: 'rgba(46, 160, 67, 0.90)',
                            backgroundColor: 'rgba(46, 160, 67, 0.12)',
                            fontStyle: 'italic',
                            fontWeight: '500'
                        }
                    };
                }

                const lineLength = editor.document.lineAt(line).text.length;
                addedOptions.push({
                    range: new vscode.Range(line, lineLength, line, lineLength),
                    renderOptions
                });
            }

            const deletedOptions: vscode.DecorationOptions[] = diff.deletedAnchorIndices
                .map(rawLine => Math.max(0, Math.min(rawLine, maxLineIndex)))
                .map(line => {
                    const hunk = diff.hunks.find(h => h.type === 'deleted' && h.newStartLine === line);
                    const lineLength = editor.document.lineAt(line).text.length;
                    const range = new vscode.Range(line, lineLength, line, lineLength);

                    let badgeText = '  🔻 [Deleted lines]';
                    let hoverMessage: vscode.MarkdownString | undefined;

                    if (hunk && hunk.oldText) {
                        const oldLines = hunk.oldText.split(/\r?\n/).filter(l => l.trim().length > 0);
                        const count = Math.max(1, oldLines.length);
                        badgeText = `  🔻 [-${count} lines deleted]`;

                        hoverMessage = new vscode.MarkdownString();
                        hoverMessage.isTrusted = true;
                        hoverMessage.appendMarkdown(`#### 🔴 **Deleted Code (${count} lines)**\n`);
                        hoverMessage.appendCodeblock(hunk.oldText, languageId);
                        hoverMessage.appendMarkdown(`\n[↺ Restore deleted lines](command:ai-smart-paste.revertHunk?${hunk.id})`);
                    }

                    return {
                        range,
                        hoverMessage,
                        renderOptions: {
                            after: {
                                contentText: badgeText,
                                color: 'rgba(248, 81, 73, 0.90)',
                                backgroundColor: 'rgba(248, 81, 73, 0.12)',
                                fontStyle: 'italic',
                                fontWeight: '500'
                            }
                        }
                    };
                });

            editor.setDecorations(this.addedType, addedOptions);
            editor.setDecorations(this.deletedType, deletedOptions);

            this.interactionListeners.push(
                vscode.workspace.onDidChangeTextDocument((event) => {
                    if (this.isPaused) {
                        return;
                    }
                    if (event.document === editor.document) {
                        this.clear();
                    }
                })
            );
        } catch {
            this.clear();
        }
    }

    /**
     * Clears all active decorations and releases event listeners.
     */
    public clear(): void {
        for (const listener of this.interactionListeners) {
            listener.dispose();
        }
        this.interactionListeners = [];

        this.activeHunks.clear();
        this.addedType?.dispose();
        this.deletedType?.dispose();
        this.addedType = null;
        this.deletedType = null;
    }
}