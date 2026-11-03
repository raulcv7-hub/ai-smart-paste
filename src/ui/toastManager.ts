import * as path from 'path';
import * as vscode from 'vscode';
import { DiffStats } from '../core/types';
import { SnapshotProvider } from '../editor/snapshotProvider';

/**
 * Emits semantic toast notifications with interactive diff/undo triggers.
 */
export function showSemanticToast(
    document: vscode.TextDocument,
    originalContent: string,
    stats: DiffStats | null,
    isNewFile: boolean
): void {
    const fileName = path.basename(document.uri.fsPath);
    const isTouch = stats === null;

    let message = '';
    const actions: string[] = [];

    if (isTouch) {
        message = isNewFile
            ? `Touch: ${fileName} (creado vacío)`
            : `Touch: ${fileName} (abierto sin cambios)`;
    } else {
        const deltaText = `+${stats.added} / -${stats.removed} líneas`;
        message = isNewFile
            ? `Smart Paste: ${fileName} (${stats.added} líneas)`
            : `Smart Paste: ${fileName} (${deltaText})`;

        // Si el archivo ya existía y tenía código, mostramos "Ver Diff"
        if (!isNewFile && originalContent.trim().length > 0) {
            actions.push('Ver Diff');
        }
        actions.push('Deshacer');
    }

    vscode.window.showInformationMessage(message, ...actions).then((selectedAction) => {
        if (selectedAction === 'Ver Diff') {
            const provider = SnapshotProvider.getInstance();
            const baselineUri = provider.registerSnapshot(document.uri, originalContent);
            vscode.commands.executeCommand(
                'vscode.diff',
                baselineUri,
                document.uri,
                `${fileName} (Antes ↔ Ahora editable)`
            );
        } else if (selectedAction === 'Deshacer') {
            vscode.commands.executeCommand('undo');
        }
    });
}