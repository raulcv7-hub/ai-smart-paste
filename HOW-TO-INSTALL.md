# How to Install AI Smart Paste & AutoHotkey on Windows 11

This guide covers the complete setup to achieve the seamless **one-key handoff (`Ctrl + <`)** between your web browser (AI Studio, Gemini, ChatGPT, Claude) and VS Code on Windows 11.

---

## Prerequisites
* **Windows 11** (64-bit)
* **Visual Studio Code** (v1.80.0 or higher)
* **Node.js** (v18+ recommended)

---

## Part 1: Install the VS Code Extension

### Option A: Build and Install from Source (Recommended)
1. Open your terminal in the repository root directory.
2. Install dependencies and compile the extension:
   ```bash
   npm install
   npm run package
   ```
   *This command outputs a production package: `ai-smart-paste-2.0.0.vsix`.*

3. Install the package directly into VS Code:
   * **Via PowerShell:**
     ```powershell
     code --install-extension ai-smart-paste-2.0.0.vsix --force
     ```
   * **Via VS Code Interface:**
     1. Press `Ctrl + Shift + P` to open the Command Palette.
     2. Type `Extensions: Install from VSIX...` and hit `Enter`.
     3. Select the generated `ai-smart-paste-2.0.0.vsix` file.

---

## Part 2: Install AutoHotkey v2 on Windows 11

The companion script requires **AutoHotkey v2**.

1. Go to the official website: [autohotkey.com](https://www.autohotkey.com/).
2. Click **Download** $\rightarrow$ Select **Download v2 (current version)**.
3. Run the downloaded installer (`AutoHotkey_2.X.X_setup.exe`).
4. Select **Install for all users** (or Current User) and complete the standard wizard.

---

## Part 3: Configure `smartCopy.ahk`

1. Locate the file `smartCopy.ahk` included in this repository:
   ```autohotkey
   #Requires AutoHotkey v2.0

   #HotIf !WinActive("ahk_exe Code.exe")
   ^<:: {
       A_Clipboard := ""
       Send "^c"

       if !ClipWait(1) {
           return
       }

       if WinExist("ahk_exe Code.exe") {
           WinActivate "ahk_exe Code.exe"
           WinWaitActive "ahk_exe Code.exe", , 2
           Send "^1"
           Sleep 120
           Send "{F4}"
       } else {
           MsgBox "VS Code is not running.", "AI Smart Paste", 48
       }
   }
   #HotIf
   ```
2. Double-click `smartCopy.ahk`.
3. Look at your Windows 11 System Tray (bottom-right taskbar arrow $\wedge$): you will see a green icon with an **"H"**, indicating the script is running actively in the background.

---

## Part 4: Run AutoHotkey Automatically on Windows Boot

To ensure the shortcut works every time you start your computer without manual execution:

1. Press **`Win + R`** on your keyboard to open the Windows Run dialog.
2. Type `shell:startup` and press **Enter**.  
   *(This opens the folder: `AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup`)*.
3. Right-click inside the folder $\rightarrow$ **New** $\rightarrow$ **Shortcut**.
4. Click **Browse...**, navigate to your `smartCopy.ahk` file location, and select it.
5. Click **Next**, name the shortcut `AI Smart Paste Bridge`, and click **Finish**.

*Now, every time you log into Windows 11, the script will initialize silently in the background.*

---

## Part 5: End-to-End Verification

1. Ensure **VS Code** is open with your target project workspace folder loaded.
2. Open your browser (Google Chrome, Edge, Brave) and navigate to your AI assistant.
3. Highlight a code snippet including its isolated path:
   ```text
   src/hello.ts
   ```typescript
   export const message = "AI Smart Paste is working!";
   ```
4. Press **`Ctrl + <`** directly in the browser.
5. **Result:**  
   Windows will automatically bring VS Code to the foreground, focus the editor, inject the code into `src/hello.ts`, apply the ephemeral green highlight, and show the line modification toast notification.
