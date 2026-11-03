import * as vscode from "vscode";

/**
 * In-memory virtual document provider serving unmodified baselines for side-by-side diffing and hunk restores.
 */
export class SnapshotProvider implements vscode.TextDocumentContentProvider {
  public static readonly scheme = "smartpaste-snapshot";
  private static instance: SnapshotProvider;

  private readonly snapshots = new Map<string, string>();
  private readonly onDidChangeEmitter = new vscode.EventEmitter<vscode.Uri>();
  public readonly onDidChange = this.onDidChangeEmitter.event;

  /**
   * Retrieves the singleton provider instance.
   *
   * @returns SnapshotProvider instance.
   */
  public static getInstance(): SnapshotProvider {
    if (!SnapshotProvider.instance) {
      SnapshotProvider.instance = new SnapshotProvider();
    }
    return SnapshotProvider.instance;
  }

  /**
   * Registers a baseline snapshot for a given file URI.
   *
   * @param uri - Target document file URI.
   * @param content - Snapshot content to store.
   * @returns Virtual URI corresponding to the snapshot.
   */
  public registerSnapshot(uri: vscode.Uri, content: string): vscode.Uri {
    const virtualUri = uri.with({ scheme: SnapshotProvider.scheme });
    this.snapshots.set(virtualUri.toString(), content);
    this.onDidChangeEmitter.fire(virtualUri);
    return virtualUri;
  }

  /**
   * Retrieves the stored original baseline content for a file URI.
   *
   * @param uri - Target document file URI.
   * @returns Stored baseline content or undefined if not present.
   */
  public getOriginal(uri: vscode.Uri): string | undefined {
    const virtualUri = uri.with({ scheme: SnapshotProvider.scheme });
    return this.snapshots.get(virtualUri.toString());
  }

  /**
   * Provides text content for virtual diff document requests.
   *
   * @param uri - Virtual document URI.
   * @returns Content string.
   */
  public provideTextDocumentContent(uri: vscode.Uri): string {
    return this.snapshots.get(uri.toString()) ?? "";
  }
}
