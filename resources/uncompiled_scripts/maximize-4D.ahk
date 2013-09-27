;
; AutoHotkey Version: 1.x
; Language:       English
; Platform:       Win9x/NT
; Author:         Evan Sheffield
;
; Script Function:
;	Maximizes the 4D window and brings it to front.
;

#NoEnv  ; Recommended for performance and compatibility with future AutoHotkey releases.
SendMode Input  ; Recommended for new scripts due to its superior speed and reliability.
SetWorkingDir %A_ScriptDir%  ; Ensures a consistent starting directory.

; Title must contain "4D", but cannot be 4D Server
SetTitleMatchMode, 2
WinMaximize,4D,,4D Server
WinActivate,4D,,4D Server

; Sleep for 1 second
Sleep, 1000

; Loop until the window is maximized 
;WinGet, State, MinMax,4D,,4D Server
;while (State <> 1)
;{
;   WinGet, State, MinMax,4D,,4D Server
;}
