import * as path from 'path';
import * as vscode from 'vscode';
import { normalizeLineEndings } from '../core/normalizer';
import { ParseResult } from '../core/types';

export interface PreparedBuffer {
    readonly document: vscode.TextDocument;
    readonly editor: vscode.TextEditor;
    readonly originalContent: string;
    readonly isNewFile: boolean;
}

/**
 * Applies changes strictly in memory via WorkspaceEdit to preserve native undo stack.
 */
export async function applyToBuffer(parseResult: ParseResult): Promise<PreparedBuffer | null> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showErrorMessage('AI Smart Paste requires an open workspace folder.');
        return null;
    }

    const rootPath = workspaceFolders[0].uri.fsPath;
    const targetPath = path.isAbsolute(parseResult.relativePath)
        ? parseResult.relativePath
        : path.join(rootPath, parseResult.relativePath);

    const targetUri = vscode.Uri.file(targetPath);
    await vscode.workspace.fs.createDirectory(vscode.Uri.file(path.dirname(targetPath)));

    let isNewFile = false;
    try {
        await vscode.workspace.fs.stat(targetUri);
    } catch {
        isNewFile = true;
        await vscode.workspace.fs.writeFile(targetUri, new Uint8Array());
    }

    const document = await vscode.workspace.openTextDocument(targetUri);
    const editor = await vscode.window.showTextDocument(document, { preview: false });

    if (isNewFile) {
        await vscode.commands.executeCommand('workbench.files.action.showActiveFileInExplorer');
    }

    const originalContent = document.getText();

    // EN MODO TOUCH: Jamás se modifica el contenido del archivo
    if (parseResult.mode === 'TOUCH') {
        return { document, editor, originalContent, isNewFile };
    }

    // MODO CONTENT: Inyección atómica en memoria (queda en estado dirty ●)
    const normalizedContent = normalizeLineEndings(parseResult.content, document.eol);
    const fullRange = new vscode.Range(
        document.positionAt(0),
        document.positionAt(originalContent.length)
    );

    const edit = new vscode.WorkspaceEdit();
    edit.replace(targetUri, fullRange, normalizedContent);
    await vscode.workspace.applyEdit(edit);

    return { document, editor, originalContent, isNewFile };
}