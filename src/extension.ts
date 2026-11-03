import * as vscode from 'vscode';
import { calculateDetailedDiff } from './core/diffCalculator';
import { parseClipboard } from './core/parser';
import { applyToBuffer } from './editor/bufferManager';
import { tryFormatDocument } from './editor/formatter';
import { Highlighter } from './editor/highlighter';
import { SnapshotProvider } from './editor/snapshotProvider';
import { showControlToast } from './ui/toastManager';

const highlighter = new Highlighter();

/**
 * Activates the extension and registers commands and content providers.
 *
 * @param context - Extension activation context.
 */
export function activate(context: vscode.ExtensionContext): void {
    const snapshotProvider = SnapshotProvider.getInstance();

    context.subscriptions.push(
        vscode.workspace.registerTextDocumentContentProvider(
            SnapshotProvider.scheme,
            snapshotProvider
        )
    );

    const revertHunkCommand = vscode.commands.registerCommand(
        'ai-smart-paste.revertHunk',
        async (hunkId: number) => {
            const entry = highlighter.getHunk(hunkId);
            if (!entry) {
                return;
            }

            const { hunk, documentUri } = entry;
            const uri = vscode.Uri.parse(documentUri);
            const document = await vscode.workspace.openTextDocument(uri);
            const edit = new vscode.WorkspaceEdit();

            if (hunk.type === 'deleted') {
                const insertLine = Math.min(document.lineCount, hunk.newStartLine + 1);
                const position = new vscode.Position(insertLine, 0);
                edit.insert(uri, position, hunk.oldText + '\n');
            }

            highlighter.pause();
            await vscode.workspace.applyEdit(edit);
            await document.save();
            highlighter.resume();

            const originalContent = snapshotProvider.getOriginal(uri);
            if (originalContent !== undefined) {
                const updatedDiff = calculateDetailedDiff(originalContent, document.getText());
                const activeEditor = vscode.window.activeTextEditor;
                if (activeEditor && activeEditor.document.uri.toString() === uri.toString()) {
                    if (updatedDiff.hunks.length === 0) {
                        highlighter.clear();
                    } else {
                        highlighter.highlightDiff(activeEditor, updatedDiff);
                    }
                }
            }

            vscode.window.setStatusBarMessage('$(check) Restored block to original baseline', 3500);
        }
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
            if (buffer.isNewFile) {
                await buffer.document.save();
            }
            showControlToast(buffer.document, buffer.originalContent, null, null, buffer.isNewFile);
            return;
        }

        snapshotProvider.registerSnapshot(buffer.document.uri, buffer.originalContent);

        const formatResult = await tryFormatDocument(buffer.document);
        await buffer.document.save();

        const detailedDiff = calculateDetailedDiff(buffer.originalContent, buffer.document.getText());

        const targetLine = Math.min(detailedDiff.stats.firstChangedLine, Math.max(0, buffer.document.lineCount - 1));
        const targetPosition = new vscode.Position(targetLine, 0);

        buffer.editor.selection = new vscode.Selection(targetPosition, targetPosition);
        buffer.editor.revealRange(
            new vscode.Range(targetPosition, targetPosition),
            vscode.TextEditorRevealType.InCenterIfOutsideViewport
        );

        highlighter.highlightDiff(buffer.editor, detailedDiff);

        showControlToast(buffer.document, buffer.originalContent, detailedDiff.stats, formatResult, buffer.isNewFile);
    });

    context.subscriptions.push(revertHunkCommand, pasteCommand);
}

/**
 * Deactivates the extension and disposes active decorations.
 */
export function deactivate(): void {
    highlighter.clear();
}