import * as vscode from 'vscode';

/**
 * Manages transient line decorations that auto-dismiss upon user interaction or timeout.
 */
export class Highlighter {
    private decorationType: vscode.TextEditorDecorationType | null = null;
    private cleanupTimer: NodeJS.Timeout | null = null;
    private interactionListeners: vscode.Disposable[] = [];

    /**
     * Highlights line range with visible green tint and overview ruler marker.
     */
    public highlight(editor: vscode.TextEditor, startLine: number, endLine: number, durationMs = 3000): void {
        this.clear();

        this.decorationType = vscode.window.createTextEditorDecorationType({
            isWholeLine: true,
            backgroundColor: 'rgba(46, 160, 67, 0.22)',
            overviewRulerColor: 'rgba(46, 160, 67, 0.8)',
            overviewRulerLane: vscode.OverviewRulerLane.Right
        });

        const range = new vscode.Range(
            new vscode.Position(startLine, 0),
            new vscode.Position(endLine, 0)
        );

        editor.setDecorations(this.decorationType, [range]);

        // Se descarta si el usuario teclea
        this.interactionListeners.push(
            vscode.workspace.onDidChangeTextDocument((event) => {
                if (event.document === editor.document) {
                    this.clear();
                }
            })
        );

        // Margen de gracia de 500ms para evitar que el foco inicial de VS Code limpie el color
        setTimeout(() => {
            if (this.decorationType) {
                this.interactionListeners.push(
                    vscode.window.onDidChangeTextEditorSelection((event) => {
                        if (event.textEditor === editor) {
                            this.clear();
                        }
                    })
                );
            }
        }, 500);

        if (durationMs > 0) {
            this.cleanupTimer = setTimeout(() => this.clear(), durationMs);
        }
    }

    public clear(): void {
        if (this.cleanupTimer) {
            clearTimeout(this.cleanupTimer);
            this.cleanupTimer = null;
        }

        for (const listener of this.interactionListeners) {
            listener.dispose();
        }
        this.interactionListeners = [];

        if (this.decorationType) {
            this.decorationType.dispose();
            this.decorationType = null;
        }
    }
}