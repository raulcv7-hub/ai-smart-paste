#Requires AutoHotkey v2.0

; Hotkey: Ctrl + <
; Active exclusively when VS Code is NOT the foreground window
#HotIf !WinActive("ahk_exe Code.exe")
^<:: {
    ; Clear clipboard and copy the selected block
    A_Clipboard := ""
    Send "^c"

    ; Wait up to 1 second for clipboard population
    if !ClipWait(1) {
        return
    }

    ; Verify if VS Code is running and activate it
    if WinExist("ahk_exe Code.exe") {
        WinActivate "ahk_exe Code.exe"
        WinWaitActive "ahk_exe Code.exe", , 2

        ; Ensure focus on primary editor group
        Send "^1"
        Sleep 120

        ; Trigger AI Smart Paste command in VS Code
        Send "{F4}"
    } else {
        MsgBox "VS Code is not running.", "AI Smart Paste", 48
    }
}
#HotIf