@echo off
title WinPulse CS2 - Compilar Executavel Rust (.EXE)
setlocal
cd /d "%~dp0"

where cargo >nul 2>&1
if %errorlevel% neq 0 (
  echo [ERRO] Rust/Cargo nao encontrado neste PC.
  echo Instale o Rust em: https://rustup.rs ^(com Visual Studio C++ Build Tools^).
  pause
  exit /b 1
)

where npm >nul 2>&1
if %errorlevel% neq 0 (
  echo [ERRO] Node.js/npm nao encontrado neste PC.
  echo Instale o Node.js LTS em: https://nodejs.org
  pause
  exit /b 1
)

echo [1/4] Instalando dependencias do projeto...
call npm install --legacy-peer-deps
if %errorlevel% neq 0 (
  echo [ERRO] Falha no npm install.
  pause
  exit /b 1
)

echo [2/4] Limpando cache de recursos e icone do executavel anterior...
if exist "src-tauri\target\release\winpulse-cs2.exe" del /f /q "src-tauri\target\release\winpulse-cs2.exe" >nul 2>&1
if exist "src-tauri\target\release\winpulse-cs2.pdb" del /f /q "src-tauri\target\release\winpulse-cs2.pdb" >nul 2>&1
if exist "WinPulse-CS2.exe" del /f /q "WinPulse-CS2.exe" >nul 2>&1
for /d %%D in ("src-tauri\target\release\build\winpulse-cs2-*") do rmdir /s /q "%%D" >nul 2>&1

echo [3/4] Compilando interface web e binario nativo em Rust ^(WinPulse-CS2.exe^)...
call npx --yes @tauri-apps/cli@^2 build
if %errorlevel% neq 0 (
  echo.
  echo [AVISO] O empacotador NSIS falhou ou foi interrompido. Tentando gerar apenas o executavel portatil...
  call npx --yes @tauri-apps/cli@^2 build --no-bundle
  if %errorlevel% neq 0 (
    echo [ERRO] Falha ao compilar com Tauri/Rust. Verifique se o Visual Studio C++ Build Tools esta instalado.
    pause
    exit /b 1
  )
)

echo [4/4] Preparando executavel final e atualizando cache de icones do Windows...
if exist "src-tauri\target\release\winpulse-cs2.exe" (
  copy /Y "src-tauri\target\release\winpulse-cs2.exe" "WinPulse-CS2.exe" >nul
  ie4uinit.exe -ClearIconCache >nul 2>&1
  ie4uinit.exe -show >nul 2>&1
  powershell -NoProfile -Command "Add-Type -TypeDefinition 'using System; using System.Runtime.InteropServices; public class ShellIcon { [DllImport(\"shell32.dll\")] public static extern void SHChangeNotify(int wEventId, int uFlags, IntPtr dwItem1, IntPtr dwItem2); }'; [ShellIcon]::SHChangeNotify(0x08000000, 0x0000, [IntPtr]::Zero, [IntPtr]::Zero)" >nul 2>&1
  echo.
  echo [SUCESSO] Executavel nativo pronto em: %~dp0WinPulse-CS2.exe
  echo [DICA] Se o Windows Explorer ainda mostrar o icone antigo em cache, pressione F5 na pasta ou renomeie o .exe.
) else (
  echo [ERRO] Binario winpulse-cs2.exe nao encontrado em src-tauri\target\release\.
  pause
  exit /b 1
)

if exist "src-tauri\target\release\bundle\nsis\" (
  echo [INFO] Instalador NSIS tambem gerado em: src-tauri\target\release\bundle\nsis\
)
pause
