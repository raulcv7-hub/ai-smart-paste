# AI Smart Paste: Comprehensive Manual Test Battery

This document provides a systematic, end-to-end verification suite for **AI Smart Paste**.  
Follow each test case sequentially by copying the provided clipboard payload and triggering the extension in an active VS Code instance (**F4** or `AI Smart Paste: Create or Update File`).

---

## Pre-flight Checklist
1. Open a clean testing workspace in VS Code (`[Extension Development Host]` via `F5` or your primary editor).
2. Ensure no conflicting legacy extensions are installed.
3. Open an integrated terminal or keep the editor in focus.

---

## Test Cases Matrix

### Group 1: Touch Mode (File & Directory Setup)

#### TC-01: Touch Mode - Brand New Empty File
* **Description:** Verifies that copying an isolated path creates the file empty on disk and focuses it.
* **Clipboard Payload:**
```text
src/domain/models/account.ts
```
* **Action:** Press **F4**.
* **Expected Outcome:**
  * Directory hierarchy `src/domain/models/` is synthesized automatically.
  * Empty file `account.ts` is created and focused in the editor.
  * Notification toast appears: `Touch: account.ts (creado vacío)`.
  * Document has zero lines and no unsaved dirty state (`●`).

---

#### TC-02: Touch Mode - Existing File Content Shield
* **Description:** Verifies that triggering Touch mode on an existing file opens it without overwriting or clearing its content.
* **Precondition:** In `src/domain/models/account.ts`, type `export interface Account { id: string; }` and save (`Ctrl + S`).
* **Clipboard Payload:**
```text
src/domain/models/account.ts
```
* **Action:** Press **F4**.
* **Expected Outcome:**
  * File remains focused.
  * The existing interface `export interface Account { ... }` is **not modified or wiped**.
  * Notification toast appears: `Touch: account.ts (abierto sin cambios)`.

---

#### TC-03: Touch Mode - Quoted Path with Whitespace
* **Description:** Verifies path extraction handles filenames and folder names with spaces.
* **Clipboard Payload:**
```text
"src/components/Primary Navigation Bar.tsx"
```
* **Action:** Press **F4**.
* **Expected Outcome:**
  * Creates folder `src/components/` and file `Primary Navigation Bar.tsx` without truncating at spaces.

---

#### TC-04: Touch Mode - Extensionless Files & Dotfiles
* **Description:** Verifies system and configuration files with non-standard naming are supported.
* **Clipboard Payload:**
```text
.env.production
```
* **Action:** Press **F4**.
* **Expected Outcome:**
  * Creates and opens `.env.production` in the project root.

---

### Group 2: Code Injection & Sanitization

#### TC-05: Standard Markdown Code Fence
* **Description:** Verifies standard markdown output with explicit language tags.
* **Clipboard Payload:**
```text
src/utils/math.ts
```typescript
export function add(a: number, b: number): number {
    return a + b;
}
```

* **Action:** Press **F4**.
* **Expected Outcome:**
  * Injects the `add` function cleanly into `src/utils/math.ts`.
  * Markdown fences (```` ``` ````) are stripped completely.
  * Tab has an unsaved dirty marker (`●`).
  * Toast displays: `Smart Paste: math.ts (3 líneas)`.

---

#### TC-06: Web Rendered Chat Artifacts (Gemini Format)
* **Description:** Verifies that UI artifacts like `code` and isolated language labels are discarded.
* **Clipboard Payload:**
```text
src/api/client.ts
code
TypeScript
export const API_URL = "https://api.example.com";

export async function getClient() {
    return null;
}
```
* **Action:** Press **F4**.
* **Expected Outcome:**
  * Words `code` and `TypeScript` are completely eliminated.
  * Only `export const API_URL...` is injected into the editor buffer.

---

#### TC-07: Direct Code Output Without Fences (ChatGPT Format)
* **Description:** Verifies code blocks delivered without any markdown fences.
* **Clipboard Payload:**
```text
src/types/session.ts
export interface UserSession {
    token: string;
    expiresIn: number;
    roles: string[];
}
```
* **Action:** Press **F4**.
* **Expected Outcome:**
  * Extracts path from line 1 and injects the remaining interface cleanly.

---

#### TC-08: Trailing Conversational Noise Stripping
* **Description:** Verifies that polite closing remarks after the closing fence are ignored.
* **Clipboard Payload:**
```text
src/services/auth.ts
```typescript
export const authenticate = () => true;

Hope this helps! Let me know if you need unit tests for this service.
```
* **Action:** Press **F4**.
* **Expected Outcome:**
  * `src/services/auth.ts` contains strictly `export const authenticate = () => true;`.
  * The closing conversational sentence is **not written** to the buffer.

---

### Group 3: Whitespace & Syntax Integrity

#### TC-09: Makefile Real Tab Preservation
* **Description:** Verifies tab characters (`\t`) are preserved byte-for-byte without space conversion.
* **Clipboard Payload:**
```text
Makefile
build:
	@echo "Compiling application..."
	@go build -o bin/app
```
* **Action:** Press **F4**.
* **Expected Outcome:**
  * Indentations under `build:` remain pure tab characters (`\t`).
  * No syntax corruptions or auto-formatter conflicts occur.

---

#### TC-10: Python Indentation Rigor
* **Description:** Verifies exact 4-space indentation is preserved in Python blocks.
* **Clipboard Payload:**
```text
scripts/worker.py
def process_batch(items):
    for item in items:
        if item.is_valid():
            yield item.compute()
```
* **Action:** Press **F4**.
* **Expected Outcome:**
  * Indentation levels (4 spaces and 8 spaces) remain mathematically identical.

---

### Group 4: Native Diff, Undo, and UI Feedback

#### TC-11: Native Side-by-Side Split Diff Verification
* **Precondition:** Ensure `src/utils/math.ts` has been saved (`Ctrl + S`) with the `add` function from TC-05.
* **Clipboard Payload:**
```text
src/utils/math.ts
```typescript
export function add(a: number, b: number): number {
    return a + b;
}

export function subtract(a: number, b: number): number {
    return a - b;
}
```

* **Action:** Press **F4**.
* **Expected Outcome:**
  * Notification toast displays: `Smart Paste: math.ts (+4 / -0 líneas)`.
  * Buttons **[Ver Diff]** and **[Deshacer]** are displayed.
  * Click **[Ver Diff]**:
    * Native split view opens.
    * Left side shows snapshot baseline (`math.ts (Antes)`).
    * Right side shows live editable buffer (`math.ts (Ahora editable)`).
    * Green addition highlighting indicates the new `subtract` function.

---

#### TC-12: Atomic Undo Verification (`Ctrl + Z`)
* **Precondition:** Complete TC-11 so `subtract` is currently present.
* **Action:** Focus editor and press **`Ctrl + Z`**.
* **Expected Outcome:**
  * The `subtract` function vanishes immediately.
  * Buffer returns to the exact baseline state with only `add`.

---

#### TC-13: Transient Line Highlight Lifecycle
* **Clipboard Payload:**
```text
src/test_highlight.ts
```typescript
const visualCheck = "Testing green decoration";
```

* **Action:** Press **F4**.
* **Expected Outcome:**
  * The injected line is coated in subtle translucent green (`rgba(46, 160, 67, 0.22)`).
  * Green marker is visible on the scrollbar overview ruler.
  * If left idle: highlight automatically expires after **3 seconds**.
  * If typed into or clicked after 0.5s: highlight vanishes **instantly**.

---

### Group 5: Error Boundaries

#### TC-14: Empty Clipboard Resilience
* **Precondition:** Clear clipboard or copy an empty string.
* **Action:** Press **F4**.
* **Expected Outcome:**
  * Status bar displays: `$(alert) No valid path detected in clipboard`.
  * No file system mutations occur.

#### TC-15: Non-Path Text Payload
* **Clipboard Payload:**
```text
Just a general question: Can you explain how async/await works?
```
* **Action:** Press **F4**.
* **Expected Outcome:**
  * No file is created.
  * Status bar safely reports no path detected.
