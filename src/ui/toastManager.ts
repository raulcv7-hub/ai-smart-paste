import * as path from 'path';
import * as vscode from 'vscode';
import { DiffStats } from '../core/types';
import { FormatResult } from '../editor/formatter';
import { SnapshotProvider } from '../editor/snapshotProvider';

/**
 * Emits a concise, dashboard-style status toast acting as the single source of truth.
 * All messaging and action triggers are strictly in English.
 */
export function showControlToast(
    document: vscode.TextDocument,
    originalContent: string,
    stats: DiffStats | null,
    formatResult: FormatResult | null,
    isNewFile: boolean
): void {
    const fileName = path.basename(document.uri.fsPath);
    const isTouch = stats === null;

    let message = '';
    const actions: string[] = [];

    if (isTouch) {
        message = isNewFile
            ? `Touch: ${fileName} (created)`
            : `Touch: ${fileName} (opened)`;
    } else {
        const delta = `+${stats.added}/-${stats.removed} loc`;
        
        let formatStatus = '';
        if (formatResult?.formatted) {
            formatStatus = ' | Formatted';
        } else if (formatResult?.noFormatter) {
            formatStatus = ' | No formatter';
            actions.push('Find Formatter');
        }

        message = isNewFile
            ? `Created: ${fileName} (+${stats.added} loc)${formatStatus}`
            : `Modified: ${fileName} (${delta})${formatStatus}`;

        actions.unshift('View Diff');
        actions.push('Undo');
    }

    vscode.window.showInformationMessage(message, ...actions).then(async (selectedAction) => {
        if (selectedAction === 'View Diff') {
            const provider = SnapshotProvider.getInstance();
            const baselineUri = provider.registerSnapshot(document.uri, originalContent);
            vscode.commands.executeCommand(
                'vscode.diff',
                baselineUri,
                document.uri,
                `${fileName} (Original ↔ Saved)`
            );
        } else if (selectedAction === 'Find Formatter') {
            vscode.commands.executeCommand(
                'workbench.extensions.search',
                `@category:formatters ${document.languageId}`
            );
        } else if (selectedAction === 'Undo') {
            await vscode.commands.executeCommand('undo');
            if (formatResult?.formatted) {
                await vscode.commands.executeCommand('undo');
            }
            await document.save();
        }
    });
}