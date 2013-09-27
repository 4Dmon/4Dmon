;
; AutoHotkey Version: 1.x
; Language:       English
; Platform:       Win9x/NT
; Author:         Evan Sheffield
;
; Script Function:
;	Maximized 4D Server window and brings it to front.
;

#NoEnv  ; Recommended for performance and compatibility with future AutoHotkey releases.
SendMode Input  ; Recommended for new scripts due to its superior speed and reliability.
SetWorkingDir %A_ScriptDir%  ; Ensures a consistent starting directory.

; Match exactly
SetTitleMatchMode, 3
WinMaximize 4D Server
WinActivate 4D Server

; Sleep for 1 second
Sleep, 1000

; Loop until the window is maximized
;IfWinExist, 4D Server
;{
;	WinGet, State, MinMax, 4D Server
;	while (State <> 1)
;	{
;		WinGet, State, MinMax,4D Server
;	}
;}

