import * as vscode from 'vscode';

const EXCLUDED_LANGUAGES = new Set(['makefile', 'plaintext']);

export interface FormatResult {
    readonly formatted: boolean;
    readonly noFormatter: boolean;
}

/**
 * Defensively applies formatting edits via code to eradicate modal popups.
 * Returns formatting status to inform the control toast.
 */
export async function tryFormatDocument(document: vscode.TextDocument): Promise<FormatResult> {
    const languageId = document.languageId;

    if (EXCLUDED_LANGUAGES.has(languageId)) {
        return { formatted: false, noFormatter: false };
    }

    try {
        const edits = await vscode.commands.executeCommand<vscode.TextEdit[]>(
            'vscode.executeFormatDocumentProvider',
            document.uri,
            { tabSize: 4, insertSpaces: true }
        );

        if (edits === undefined) {
            return { formatted: false, noFormatter: true };
        }

        if (edits.length > 0) {
            const formatEdit = new vscode.WorkspaceEdit();
            formatEdit.set(document.uri, edits);
            await vscode.workspace.applyEdit(formatEdit);
            return { formatted: true, noFormatter: false };
        }

        return { formatted: true, noFormatter: false };
    } catch {
        return { formatted: false, noFormatter: true };
    }
}