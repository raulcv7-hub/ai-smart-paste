import * as vscode from 'vscode';

/**
 * In-memory virtual document provider serving unmodified baselines for side-by-side diffing.
 */
export class SnapshotProvider implements vscode.TextDocumentContentProvider {
    public static readonly scheme = 'smartpaste-snapshot';
    private static instance: SnapshotProvider;

    private readonly snapshots = new Map<string, string>();
    private readonly onDidChangeEmitter = new vscode.EventEmitter<vscode.Uri>();
    public readonly onDidChange = this.onDidChangeEmitter.event;

    public static getInstance(): SnapshotProvider {
        if (!SnapshotProvider.instance) {
            SnapshotProvider.instance = new SnapshotProvider();
        }
        return SnapshotProvider.instance;
    }

    public registerSnapshot(uri: vscode.Uri, content: string): vscode.Uri {
        const virtualUri = uri.with({ scheme: SnapshotProvider.scheme });
        this.snapshots.set(virtualUri.toString(), content);
        this.onDidChangeEmitter.fire(virtualUri);
        return virtualUri;
    }

    public provideTextDocumentContent(uri: vscode.Uri): string {
        return this.snapshots.get(uri.toString()) ?? '';
    }
}