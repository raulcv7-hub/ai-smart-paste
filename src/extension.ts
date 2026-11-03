import * as vscode from 'vscode';
import { calculateDiffStats } from './core/diffCalculator';
import { parseClipboard } from './core/parser';
import { applyToBuffer } from './editor/bufferManager';
import { Highlighter } from './editor/highlighter';
import { SnapshotProvider } from './editor/snapshotProvider';
import { showSemanticToast } from './ui/toastManager';

const highlighter = new Highlighter();

/**
 * Extension entrypoint registering commands and virtual diff snapshot providers.
 */
export function activate(context: vscode.ExtensionContext): void {
    const snapshotProvider = SnapshotProvider.getInstance();

    context.subscriptions.push(
        vscode.workspace.registerTextDocumentContentProvider(
            SnapshotProvider.scheme,
            snapshotProvider
        )
    );

    const pasteCommand = vscode.commands.registerCommand('ai-smart-paste.paste', async () => {
        const clipboardText = await vscode.env.clipboard.readText();
        const parseResult = parseClipboard(clipboardText);

        if (!parseResult) {
            vscode.window.setStatusBarMessage('$(alert) No valid path detected in clipboard', 3000);
            return;
        }

        const buffer = await applyToBuffer(parseResult);
        if (!buffer) {
            return;
        }

        if (parseResult.mode === 'TOUCH') {
            showSemanticToast(buffer.document, buffer.originalContent, null, buffer.isNewFile);
            return;
        }

        const stats = calculateDiffStats(buffer.originalContent, buffer.document.getText());

        const targetLine = Math.min(stats.firstChangedLine, Math.max(0, buffer.document.lineCount - 1));
        const targetPosition = new vscode.Position(targetLine, 0);

        buffer.editor.selection = new vscode.Selection(targetPosition, targetPosition);
        buffer.editor.revealRange(
            new vscode.Range(targetPosition, targetPosition),
            vscode.TextEditorRevealType.InCenterIfOutsideViewport
        );

        highlighter.highlight(
            buffer.editor,
            stats.firstChangedLine,
            buffer.document.lineCount - 1
        );

        // El Toast se muestra INMEDIATAMENTE sin nada que lo bloquee
        showSemanticToast(buffer.document, buffer.originalContent, stats, buffer.isNewFile);
    });

    context.subscriptions.push(pasteCommand);
}

/**
 * Releases UI resources on deactivation.
 */
export function deactivate(): void {
    highlighter.clear();
}