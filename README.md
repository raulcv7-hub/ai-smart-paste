# AI Smart Paste: Prompt to Code

Instant file creation, directory synthesis, and in-memory code injection from AI assistants (Gemini, ChatGPT, Claude, DeepSeek) into VS Code with zero syntax corruption and native undo.

---

## The Problem

Transferring generated code from large language models into local projects causes recurring friction:
1. Navigating file trees and manually creating intermediate directories.
2. Creating empty files matching target paths.
3. Destructive overwrites from unreviewed clipboard payloads.
4. Auto-formatters corrupting tab-sensitive files such as Makefiles, Python, and YAML.
5. Unsaved dirty buffers leading to stale execution errors.
6. Web UIs injecting artifacts like isolated language identifiers, "code", or copy labels.

AI Smart Paste addresses this in a single atomic action via F4 (or globally via Ctrl + < using the companion automation script).

---

## Architectural Principles

* **Touch Mode:** When the clipboard contains only a file path, it focuses the existing file or creates an empty baseline on disk and reveals it in the VS Code Explorer.
* **Auto-Persisted Buffer Ingestion with Full Undo (Ctrl + Z):** Changes are applied in memory and persisted directly to disk to prevent stale executions. The native undo stack (`Ctrl + Z`) remains fully intact, allowing instant reversion to original state.
* **Pure Git-Style Inline Diff:** Renders additions cleanly in green and deletions as inline red badges (`🔻 [-N lines deleted]`) with targeted hover cards displaying the exact deleted code and one-click restoration triggers. Untouched lines remain completely unhighlighted.
* **Native Side-by-Side Diff:** Provides an interactive split diff (`Original vs Saved`) allowing inspection of syntax-colored additions and deletions before further edits.
* **Whitespace and Syntax Integrity:** Zero automated re-formatting on sensitive files. Strict tab indentations in Makefiles, Python scripts, or Dockerfiles are preserved byte-for-byte.
* **Noise Sanitization:** Strips markdown code fences and over 180 web chat UI artifacts while retaining 100% of functional code and documentation comments.
* **Persistent Visual Feedback:** Visual decorations persist indefinitely while reading and dismiss automatically only upon the first physical keystroke.

---

## Supported Formats

The parser handles standard raw markdown as well as rich web-rendered clipboard formats:

### 1. Standard Markdown Code Blocks
```text
src/core/logger.ts
```typescript
export const log = (msg: string) => console.log(msg);
```

### 2. Rendered Web Chats (Gemini / Claude / ChatGPT)
```text
src/components/Button.tsx
code
TypeScript
export function Button() {
    return <button>Click</button>;
}
```

### 3. Direct Code Blocks Without Fences
```text
src/types/user.ts
export interface User {
    id: string;
    email: string;
}
```

### 4. Touch Mode (Empty File Initialization)
```text
config/credentials/secrets.env
```

### 5. Extensionless and Dotfiles
```text
Makefile
build:
	go build -o bin/app main.go
```

---

## Keybindings and Workflow

### Native Workflow (Cross-Platform)
1. Copy the code block from your AI assistant.
2. Switch to VS Code.
3. Press **F4**.

| Command | Keybinding (Win / Linux) | Keybinding (macOS) | Description |
|---|:---:|:---:|---|
| `ai-smart-paste.paste` | `F4` | `F4` | Parse clipboard, touch/open file, inject code, and persist to disk. |

---

### Accelerated Workflow (Windows via AutoHotkey)
For instantaneous handoffs on Windows, a companion script (`smartCopy.ahk`) is included in the repository.

1. Select the code block inside your browser (AI Studio, Gemini, ChatGPT).
2. Press `Ctrl + <` directly in the browser.
3. The script copies the selection, switches window focus to VS Code, focuses the editor, and triggers `F4` automatically.

---

## Development and Build Scripts

This project relies exclusively on standard Node.js and npm scripts. No external tools like make, grep, or awk are required.

```bash
# Install dependencies
npm install

# Compile TypeScript source code
npm run compile

# Run compiler in watch mode
npm run watch

# Run test suite
npm run test

# Package extension into a production .vsix archive
npm run package
```

---

## System Instructions Recommendation for AI Chats

To ensure deterministic compatibility, instruct your LLM with the following structural directive:

```text
Isolated Path Directive:
Just before emitting any code block, write the relative target path on a single isolated line immediately above the code fence:

path/to/file.ext
```language
... code ...
```

---

## License

MIT License. Authored by [raulcv7-hub](https://github.com/raulcv7-hub/ai-smart-paste).
