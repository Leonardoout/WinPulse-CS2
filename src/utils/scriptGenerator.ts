import JSZip from 'jszip';
import { TWEAKS_CATALOG } from '../data/tweaks';
import { Cs2Config, ExportFileKey, OptimizerState, PowerPlanType } from '../types/optimizer';

function toUtf8Base64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function escapeCsString(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\r?\n/g, ' ');
}

export function buildSteamLaunchOptions(cs2: Cs2Config): string {
  const args: string[] = [];
  if (cs2.launchHighPriority) args.push('-high');
  if (cs2.launchNoJoy) args.push('-nojoy');
  if (cs2.launchFullscreen) args.push('-fullscreen');
  if (cs2.launchThreadsEnabled && cs2.launchThreadsCount > 0) {
    args.push(`-threads ${cs2.launchThreadsCount}`);
  }
  if (cs2.launchRefreshRateEnabled && cs2.launchRefreshRate > 0) {
    args.push(`-refresh ${cs2.launchRefreshRate}`);
  }
  if (cs2.launchExecAutoexec) args.push('+exec autoexec.cfg');
  if (cs2.launchExtraArgs.trim()) {
    args.push(cs2.launchExtraArgs.trim());
  }
  return args.join(' ');
}

export function buildAutoexecCfg(state: OptimizerState): string {
  const { cs2Config: c } = state;
  const voiceKey = (c.bindVoiceKey || 'v').trim().replace(/"/g, '').toLowerCase() || 'v';

  const lines: string[] = [
    '// ============================================================================',
    '// WinPulse CS2 — autoexec.cfg (Counter-Strike 2 / Source 2)',
    `// Perfil ativo: ${state.activeProfile}`,
    '// Local de instalacao:',
    '//   Steam\\steamapps\\common\\Counter-Strike Global Offensive\\game\\csgo\\cfg\\autoexec.cfg',
    '// ============================================================================',
    '',
    '// 1. Desempenho, Frametime e Video',
    `fps_max "${c.fpsMax}"`,
    `fps_max_ui "${c.fpsMaxUi}"`,
    `engine_low_latency_sleep_after_client_tick "${c.lowLatencySleep ? 'true' : 'false'}"`,
    `r_fullscreen_gamma "${c.fullscreenGamma.toFixed(1)}"`,
    `r_show_build_info "${c.hideBuildInfo ? 'false' : 'true'}"`,
    '',
    '// 2. Rede e Sub-tick',
    `rate "${c.rate}"`,
    `cl_net_buffer_ticks "${c.netBufferTicks}"`,
    `mm_dedicated_search_maxping "${c.maxPing}"`,
    '',
    '// 3. Telemetria Nativa do CS2 (0=Nunca, 1=Se houver problema, 2=Sempre)',
    `cl_hud_telemetry_frametime_show "${c.telemetryFrametime}"`,
    `cl_hud_telemetry_ping_show "${c.telemetryPing}"`,
    `cl_hud_telemetry_net_misdelivery_show "${c.telemetryPacketLoss}"`,
    '',
    '// 4. Audio Competitivo',
    `snd_headphone_eq "${c.headphoneEq}"`,
    `snd_steamaudio_enable_perspective_correction "${c.perspectiveCorrection ? 'true' : 'false'}"`,
    '',
    '// 5. Viewmodel & FOV (todas as coordenadas e presets)',
    `viewmodel_presetpos "${c.viewmodelPresetPos}"`,
    `viewmodel_fov "${c.viewmodelFov}"`,
    `viewmodel_offset_x "${c.viewmodelOffsetX.toFixed(2)}"`,
    `viewmodel_offset_y "${c.viewmodelOffsetY.toFixed(2)}"`,
    `viewmodel_offset_z "${c.viewmodelOffsetZ.toFixed(2)}"`,
    '',
    '// 6. Interface & HUD Completo do CS2',
    `cl_hud_color "${c.hudColor}"`,
    `hud_scaling "${c.hudScaling.toFixed(2)}"`,
    `safezonex "${c.hudSafezoneX.toFixed(2)}"`,
    `safezoney "${c.hudSafezoneY.toFixed(2)}"`,
    `cl_hud_playercount_pos "${c.hudPlayerCountPos}"`,
    `cl_hud_playercount_showcount "${c.hudPlayerCountShowCount}"`,
    `cl_showloadout "${c.hudShowLoadout ? 'true' : 'false'}"`,
    `cl_allow_animated_avatars "${c.hudAllowAnimatedAvatars ? 'true' : 'false'}"`,
    `cl_show_equipped_character_for_player_avatars "${c.hudShowEquippedCharacterAvatars ? 'true' : 'false'}"`,
    `cl_sanitize_player_names "${c.hudSanitizePlayerNames ? 'true' : 'false'}"`,
    `cl_use_opens_buy_menu "${c.useOpensBuyMenu ? 'true' : 'false'}"`,
    '',
    '// 7. Radar Completo do CS2',
    `cl_hud_radar_scale "${c.radarHudScale.toFixed(2)}"`,
    `cl_radar_scale "${c.radarScale.toFixed(2)}"`,
    `cl_radar_icon_scale_min "${c.radarIconScaleMin.toFixed(2)}"`,
    `cl_hud_radar_background_alpha "${c.radarBackgroundAlpha.toFixed(2)}"`,
    `cl_radar_always_centered "${c.radarAlwaysCentered ? 'true' : 'false'}"`,
    `cl_radar_rotate "${c.radarRotate ? 'true' : 'false'}"`,
    `cl_radar_square_always "${c.radarSquareAlways ? 'true' : 'false'}"`,
    `cl_radar_square_with_scoreboard "${c.radarSquareWithScoreboard ? 'true' : 'false'}"`,
    `cl_hud_radar_map_additive "${c.radarMapAdditive ? 'true' : 'false'}"`,
    `cl_teammate_colors_show "${c.teammateColorsShow}"`,
  ];

  if (c.applySensitivityInAutoexec) {
    lines.push(
      '',
      '// 8. Mouse & Sensibilidade',
      `sensitivity "${c.mouseSensitivity.toFixed(2)}"`,
      `zoom_sensitivity_ratio "${c.zoomSensitivityRatio.toFixed(2)}"`
    );
  }

  const hasBinds =
    c.bindVoiceEnabled || c.bindScrollJump || c.bindRadarZoom || c.bindClutchMute;
  if (hasBinds) {
    lines.push('', '// 9. Binds Competitivas Seguras (100% dentro das regras da Valve)');
    if (c.bindVoiceEnabled) {
      lines.push(`bind "${voiceKey}" "+voicerecord"`);
    }
    if (c.bindScrollJump) {
      lines.push('bind "mwheeldown" "+jump"');
      lines.push('bind "mwheelup" "+jump"');
    }
    if (c.bindRadarZoom) {
      lines.push('bind "x" "toggle cl_radar_scale 0.40 0.70"');
    }
    if (c.bindClutchMute) {
      lines.push('bind "j" "toggle voice_modenable 1 0"');
    }
  }

  lines.push(
    '',
    'host_writeconfig',
    'echo "[WinPulse CS2] autoexec.cfg carregado com sucesso."',
    ''
  );

  return lines.join('\n');
}

export function buildPcBackupPowerShellScript(state: OptimizerState): string {
  const lines: string[] = [
    '# ============================================================================',
    '# WinPulse CS2 — Backup Completo do PC Atual antes da Otimizacao',
    '# Exporta: Registro (.reg), Plano de Energia (.pow), Servicos e autoexec.cfg',
    '# ============================================================================',
    '',
    '$ErrorActionPreference = "Continue"',
    '$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)',
    'if (-not $isAdmin) {',
    '  Write-Host "[ERRO] Execute este backup como Administrador!" -ForegroundColor Red',
    '  exit 1',
    '}',
    '',
    '$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"',
    '$backupDir = Join-Path $PSScriptRoot ("Backup_PC_" + $timestamp)',
    'New-Item -Path $backupDir -ItemType Directory -Force | Out-Null',
    '',
    'Write-Host ""',
    'Write-Host "=== WinPulse CS2 — Criando Backup Completo do PC Atual ===" -ForegroundColor Cyan',
    'Write-Host "Destino: $backupDir" -ForegroundColor Gray',
    'Write-Host ""',
  ];

  if (state.createRestorePoint) {
    lines.push(
      'Write-Host "[1/5] Criando Ponto de Restauracao do Windows..." -ForegroundColor Cyan',
      'try {',
      '  Enable-ComputerRestore -Drive "$env:SystemDrive\\" -ErrorAction SilentlyContinue',
      '  Checkpoint-Computer -Description "WinPulse-CS2-Backup" -RestorePointType "MODIFY_SETTINGS" -ErrorAction Stop',
      '  Write-Host "  -> Ponto de restauracao criado." -ForegroundColor Green',
      '} catch {',
      '  Write-Host "  -> Aviso: nao foi possivel criar ponto agora (limite 24h ou Protecao do Sistema desativada)." -ForegroundColor Yellow',
      '}'
    );
  } else {
    lines.push('Write-Host "[1/5] Ponto de Restauracao omitido pelo usuario." -ForegroundColor DarkGray');
  }

  lines.push(
    '',
    'Write-Host "[2/5] Exportando Plano de Energia atual (.pow)..." -ForegroundColor Cyan',
    '$activeSchemeLine = (powercfg /getactivescheme) -join " "',
    'if ($activeSchemeLine -match "([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})") {',
    '  $activeGuid = $Matches[1]',
    '  $activeGuid | Out-File -FilePath (Join-Path $backupDir "plano_ativo_guid.txt") -Encoding UTF8',
    '  powercfg /export (Join-Path $backupDir "plano_energia_atual.pow") $activeGuid | Out-Null',
    '  Write-Host "  -> Plano ativo salvo: $activeGuid" -ForegroundColor Green',
    '}',
    '',
    'Write-Host "[3/5] Exportando chaves do Registro do Windows (.reg)..." -ForegroundColor Cyan',
    '$regExports = @(',
    '  @{ Key = "HKCU\\Software\\Microsoft\\GameBar"; File = "reg_GameBar.reg" },',
    '  @{ Key = "HKCU\\System\\GameConfigStore"; File = "reg_GameConfigStore.reg" },',
    '  @{ Key = "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\GameDVR"; File = "reg_GameDVR_User.reg" },',
    '  @{ Key = "HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\GameDVR"; File = "reg_GameDVR_Policy.reg" },',
    '  @{ Key = "HKLM\\SYSTEM\\CurrentControlSet\\Control\\GraphicsDrivers"; File = "reg_GraphicsDrivers.reg" },',
    '  @{ Key = "HKLM\\SYSTEM\\CurrentControlSet\\Control\\PriorityControl"; File = "reg_PriorityControl.reg" },',
    '  @{ Key = "HKCU\\Control Panel\\Mouse"; File = "reg_Mouse.reg" },',
    '  @{ Key = "HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile"; File = "reg_Multimedia_SystemProfile.reg" },',
    '  @{ Key = "HKLM\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters\\Interfaces"; File = "reg_Tcpip_Interfaces.reg" },',
    '  @{ Key = "HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\AppPrivacy"; File = "reg_AppPrivacy.reg" },',
    '  @{ Key = "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize"; File = "reg_Personalize.reg" },',
    '  @{ Key = "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\VisualEffects"; File = "reg_VisualEffects.reg" }',
    ')',
    'foreach ($item in $regExports) {',
    '  $outFile = Join-Path $backupDir $item.File',
    '  reg export $item.Key $outFile /y 2>$null | Out-Null',
    '}',
    'Write-Host "  -> Chaves do registro exportadas." -ForegroundColor Green',
    '',
    'Write-Host "[4/5] Salvando estado atual dos servicos..." -ForegroundColor Cyan',
    '$svcNames = @("DiagTrack", "SysMain", "WSearch", "wuauserv")',
    '$svcSnapshot = foreach ($name in $svcNames) {',
    '  $s = Get-Service -Name $name -ErrorAction SilentlyContinue',
    '  if ($s) { [PSCustomObject]@{ Name = $s.Name; Status = $s.Status.ToString(); StartType = $s.StartType.ToString() } }',
    '}',
    '$svcSnapshot | ConvertTo-Json | Out-File -FilePath (Join-Path $backupDir "servicos_originais.json") -Encoding UTF8',
    'Write-Host "  -> Snapshot de servicos salvo." -ForegroundColor Green',
    '',
    'Write-Host "[5/5] Verificando autoexec.cfg atual do CS2..." -ForegroundColor Cyan',
    '$steamPath = (Get-ItemProperty -Path "HKCU:\\Software\\Valve\\Steam" -ErrorAction SilentlyContinue).SteamPath',
    'if ($steamPath) {',
    '  $cfgFile = Join-Path $steamPath "steamapps\\common\\Counter-Strike Global Offensive\\game\\csgo\\cfg\\autoexec.cfg"',
    '  if (Test-Path $cfgFile) {',
    '    Copy-Item -Path $cfgFile -Destination (Join-Path $backupDir "autoexec_anterior.cfg") -Force',
    '    Write-Host "  -> autoexec.cfg anterior copiado para o backup." -ForegroundColor Green',
    '  } else {',
    '    Write-Host "  -> Nenhum autoexec.cfg anterior encontrado." -ForegroundColor DarkGray',
    '  }',
    '}',
    '',
    'Write-Host ""',
    'Write-Host "Backup completo finalizado em: $backupDir" -ForegroundColor Green',
    'Write-Host ""'
  );

  return lines.join('\n');
}

function getPowerPlanScriptBlock(plan: PowerPlanType, monitorTimeoutMinutes: number): string {
  const planLines: string[] = [
    'Write-Host "[2/4] Configurando Plano de Energia..." -ForegroundColor Cyan',
  ];

  if (plan === 'ultimate') {
    planLines.push(
      '$ultimateGuid = "e9a42b02-d5df-448d-aa00-03f14749eb61"',
      '$existingUltimate = powercfg /list | Select-String -Pattern "Desempenho M|Ultimate Performance"',
      'if (-not $existingUltimate) {',
      '  Write-Host "  -> Criando plano Desempenho Maximo (Ultimate Performance)..." -ForegroundColor Gray',
      '  powercfg -duplicatescheme $ultimateGuid | Out-Null',
      '}',
      '$targetLine = (powercfg /list | Select-String -Pattern "Desempenho M|Ultimate Performance" | Select-Object -First 1).ToString()',
      'if ($targetLine -match "([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})") {',
      '  powercfg -setactive $Matches[1]',
      '  Write-Host "  -> Plano Desempenho Maximo ativado ($($Matches[1]))." -ForegroundColor Green',
      '} else {',
      '  powercfg -setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c',
      '  Write-Host "  -> Fallback para Alto Desempenho ativado." -ForegroundColor Yellow',
      '}'
    );
  } else if (plan === 'high') {
    planLines.push(
      'powercfg -setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c',
      'Write-Host "  -> Plano Alto Desempenho ativado." -ForegroundColor Green'
    );
  } else {
    planLines.push(
      'powercfg -setactive 381b4222-f694-41f0-9685-ff5bb260df2e',
      'Write-Host "  -> Plano Equilibrado ativado." -ForegroundColor Green'
    );
  }

  planLines.push(
    `powercfg /change monitor-timeout-ac ${monitorTimeoutMinutes}`,
    'powercfg /change standby-timeout-ac 0'
  );

  return planLines.join('\n');
}

export function buildMainPowerShellScript(state: OptimizerState): string {
  const activeTweaks = TWEAKS_CATALOG.filter((t) => state.enabledTweaks[t.id]);
  const tempTweaks = activeTweaks.filter((t) => t.category === 'temp');
  const powerTweaks = activeTweaks.filter((t) => t.category === 'power');
  const cs2AndWinTweaks = activeTweaks.filter(
    (t) => t.category === 'cs2_sys' || t.category === 'windows'
  );
  const needsReboot = activeTweaks.some((t) => t.requiresReboot);

  const sections: string[] = [
    '# ============================================================================',
    '# WinPulse CS2 — Script de Otimizacao Windows 11 & Counter-Strike 2',
    `# Perfil: ${state.activeProfile} | Ajustes selecionados: ${activeTweaks.length}`,
    '# Execute via "WinPulseCS2.exe" ou "executar_como_admin.bat".',
    '# ============================================================================',
    '',
    '$ErrorActionPreference = "Continue"',
    '',
    '$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)',
    'if (-not $isAdmin) {',
    '  Write-Host "[ERRO] Execute este script como Administrador!" -ForegroundColor Red',
    '  exit 1',
    '}',
    '',
    'Write-Host ""',
    'Write-Host "=== WinPulse CS2 — Aplicando Otimizacoes ===" -ForegroundColor Cyan',
    'Write-Host ""',
  ];

  if (state.createRestorePoint && !state.fullPcBackup) {
    sections.push(
      'Write-Host "[0/4] Criando Ponto de Restauracao do Windows..." -ForegroundColor Cyan',
      'try {',
      '  Enable-ComputerRestore -Drive "$env:SystemDrive\\" -ErrorAction SilentlyContinue',
      '  Checkpoint-Computer -Description "WinPulse-CS2-Backup" -RestorePointType "MODIFY_SETTINGS" -ErrorAction Stop',
      '  Write-Host "  -> Ponto de restauracao criado com sucesso." -ForegroundColor Green',
      '} catch {',
      '  Write-Host "  -> Nao foi possivel criar o ponto de restauracao agora (limite de 24h ou Protecao do Sistema desativada)." -ForegroundColor Yellow',
      '}',
      ''
    );
  }

  sections.push('Write-Host "[1/4] Limpeza de Arquivos Temporarios e Caches..." -ForegroundColor Cyan');
  if (tempTweaks.length === 0) {
    sections.push('Write-Host "  -> Nenhum item de limpeza selecionado." -ForegroundColor DarkGray');
  } else {
    sections.push(
      '$driveBefore = (Get-PSDrive ($env:SystemDrive.TrimEnd(":"))).Free',
      ...tempTweaks.map((t) => t.applyScript),
      '$driveAfter = (Get-PSDrive ($env:SystemDrive.TrimEnd(":"))).Free',
      '$freedMB = [math]::Round(($driveAfter - $driveBefore) / 1MB, 1)',
      'if ($freedMB -gt 0) { Write-Host "  -> Espaco liberado nesta sessao: $freedMB MB" -ForegroundColor Green }'
    );
  }
  sections.push('');

  sections.push(
    getPowerPlanScriptBlock(state.powerConfig.plan, state.powerConfig.monitorTimeoutMinutes)
  );
  if (powerTweaks.length > 0) {
    sections.push(...powerTweaks.map((t) => t.applyScript));
  }
  sections.push('');

  sections.push('Write-Host "[3/4] Aplicando Otimizacoes de Baixa Latencia (Windows + CS2)..." -ForegroundColor Cyan');
  if (cs2AndWinTweaks.length === 0) {
    sections.push('Write-Host "  -> Nenhum ajuste de sistema/CS2 selecionado." -ForegroundColor DarkGray');
  } else {
    sections.push(...cs2AndWinTweaks.map((t) => t.applyScript));
  }
  sections.push('');

  sections.push(
    'Write-Host "[4/4] Concluido!" -ForegroundColor Cyan',
    'Write-Host ""',
    'Write-Host "Todas as otimizacoes selecionadas foram aplicadas." -ForegroundColor Green',
    needsReboot
      ? 'Write-Host "AVISO: Alguns ajustes (como HAGS, Nagle ou PriorityControl) exigem REINICIAR o PC para entrar em vigor." -ForegroundColor Yellow'
      : 'Write-Host "Se desejar desfazer as alteracoes de sistema, execute o arquivo reverter_padroes.ps1." -ForegroundColor Gray',
    'Write-Host ""'
  );

  return sections.join('\n');
}

export function buildBatLauncher(state: OptimizerState): string {
  const lines: string[] = [
    '@echo off',
    'title WinPulse CS2 - Otimizacao Windows 11 & CS2',
    'setlocal',
    '',
    'set "SELF_BAT=%~f0"',
    'set "SELF_ARGS=%*"',
    'net session >nul 2>&1',
    'if %errorlevel% neq 0 (',
    '  echo Solicitando permissao de Administrador...',
    '  if "%SELF_ARGS%"=="" (',
    '    powershell -NoProfile -Command "Start-Process -FilePath $env:SELF_BAT -Verb RunAs"',
    '  ) else (',
    '    powershell -NoProfile -Command "Start-Process -FilePath $env:SELF_BAT -ArgumentList $env:SELF_ARGS -Verb RunAs"',
    '  )',
    '  exit /b',
    ')',
    '',
    'cd /d "%~dp0"',
  ];

  if (state.fullPcBackup) {
    lines.push(
      'if /i "%~1"=="--skip-backup" goto :RUN_OPTIMIZE',
      'if exist "%~dp0fazer_backup_pc.ps1" (',
      '  powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0fazer_backup_pc.ps1"',
      ')',
      ':RUN_OPTIMIZE'
    );
  }

  lines.push(
    'powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0otimizar_win_cs2.ps1"',
    'echo.',
    'pause',
    ''
  );

  return lines.join('\r\n');
}

export function buildWinPulseLauncherCs(state: OptimizerState): string {
  const launchStr = buildSteamLaunchOptions(state.cs2Config);
  const autoexecB64 = toUtf8Base64(buildAutoexecCfg(state));

  const tweakEntries = TWEAKS_CATALOG.map((t) => {
    const checked = state.enabledTweaks[t.id] ? 'true' : 'false';
    const b64 = toUtf8Base64(t.applyScript);
    return `      new TweakEntry("${escapeCsString(t.id)}", "${escapeCsString(t.category)}", "${escapeCsString(t.title)}", "${escapeCsString(t.frametimeBenefit)}", "${escapeCsString(t.risk)}", ${checked}, "${b64}")`;
  }).join(',\r\n');

  const initPlan = state.powerConfig.plan;
  const initFullBackup = state.fullPcBackup ? 'true' : 'false';
  const initRestorePoint = state.createRestorePoint ? 'true' : 'false';

  return [
    'using System;',
    'using System.Collections.Generic;',
    'using System.Diagnostics;',
    'using System.Drawing;',
    'using System.IO;',
    'using System.Security.Principal;',
    'using System.Text;',
    'using System.Threading;',
    'using System.Windows.Forms;',
    'using Microsoft.Win32;',
    '',
    'namespace WinPulseDesktop {',
    '  public class TweakEntry {',
    '    public string Id;',
    '    public string Category;',
    '    public string Title;',
    '    public string Benefit;',
    '    public string Risk;',
    '    public bool Enabled;',
    '    public string ScriptB64;',
    '    public CheckBox Box;',
    '',
    '    public TweakEntry(string id, string cat, string title, string benefit, string risk, bool enabled, string b64) {',
    '      Id = id; Category = cat; Title = title; Benefit = benefit; Risk = risk; Enabled = enabled; ScriptB64 = b64;',
    '    }',
    '  }',
    '',
    '  public class MainForm : Form {',
    '    private string baseDir;',
    '    private List<TweakEntry> tweaks;',
    '    private Dictionary<string, Panel> pages = new Dictionary<string, Panel>();',
    '    private Dictionary<string, Button> navButtons = new Dictionary<string, Button>();',
    '    private Label lblHeaderTitle;',
    '    private Label lblStats;',
    '    private TextBox txtLog;',
    '    private Button btnRestore;',
    '    private Button btnApply;',
    '    private CheckBox chkFullBackup;',
    '    private CheckBox chkRestorePoint;',
    '    private CheckBox chkAutoexec;',
    '    private RadioButton rbUltimate;',
    '    private RadioButton rbHigh;',
    '    private RadioButton rbBalanced;',
    '    private string autoexecB64 = "' + autoexecB64 + '";',
    '    private string steamLaunch = "' + escapeCsString(launchStr) + '";',
    '    private bool isBusy = false;',
    '',
    '    private readonly Color BgCanvas = Color.FromArgb(17, 19, 23);',
    '    private readonly Color BgSidebar = Color.FromArgb(20, 22, 26);',
    '    private readonly Color BgCard = Color.FromArgb(24, 27, 32);',
    '    private readonly Color BgElevated = Color.FromArgb(35, 39, 47);',
    '    private readonly Color BorderCol = Color.FromArgb(43, 48, 58);',
    '    private readonly Color AccentBlue = Color.FromArgb(59, 130, 246);',
    '    private readonly Color TextMain = Color.FromArgb(241, 243, 245);',
    '    private readonly Color TextMuted = Color.FromArgb(156, 163, 175);',
    '',
    '    public MainForm() {',
    '      baseDir = AppDomain.CurrentDomain.BaseDirectory;',
    '      InitCatalog();',
    '      BuildWindow();',
    '      ShowPage("overview", "Visao Geral");',
    '      UpdateStatsLabel();',
    '    }',
    '',
    '    private void InitCatalog() {',
    '      tweaks = new List<TweakEntry>(new TweakEntry[] {',
    tweakEntries,
    '      });',
    '    }',
    '',
    '    private void BuildWindow() {',
    '      this.Text = "WinPulse CS2 — Otimizador Windows 11 e Counter-Strike 2";',
    '      this.Size = new Size(1020, 680);',
    '      this.MinimumSize = new Size(880, 580);',
    '      this.StartPosition = FormStartPosition.CenterScreen;',
    '      this.BackColor = BgCanvas;',
    '      this.ForeColor = TextMain;',
    '      this.Font = new Font("Segoe UI", 9.5F);',
    '',
    '      // Sidebar',
    '      Panel sidebar = new Panel();',
    '      sidebar.Width = 225;',
    '      sidebar.Dock = DockStyle.Left;',
    '      sidebar.BackColor = BgSidebar;',
    '      this.Controls.Add(sidebar);',
    '',
    '      Panel brandPanel = new Panel();',
    '      brandPanel.Height = 56;',
    '      brandPanel.Dock = DockStyle.Top;',
    '      brandPanel.Padding = new Padding(18, 16, 12, 10);',
    '      Label lblBrand = new Label();',
    '      lblBrand.Text = "WinPulse CS2";',
    '      lblBrand.Font = new Font("Segoe UI", 12F, FontStyle.Bold);',
    '      lblBrand.ForeColor = TextMain;',
    '      lblBrand.Dock = DockStyle.Fill;',
    '      brandPanel.Controls.Add(lblBrand);',
    '      sidebar.Controls.Add(brandPanel);',
    '',
    '      Panel navList = new Panel();',
    '      navList.Dock = DockStyle.Fill;',
    '      navList.Padding = new Padding(10, 12, 10, 10);',
    '      sidebar.Controls.Add(navList);',
    '      navList.BringToFront();',
    '',
    '      AddNavButton(navList, "windows", "Ajustes Windows", 4);',
    '      AddNavButton(navList, "power", "Plano de Energia", 3);',
    '      AddNavButton(navList, "cs2", "Counter-Strike 2", 2);',
    '      AddNavButton(navList, "temp", "Temporarios", 1);',
    '      AddNavButton(navList, "overview", "Visao Geral", 0);',
    '',
    '      // Main Right Container',
    '      Panel rightCol = new Panel();',
    '      rightCol.Dock = DockStyle.Fill;',
    '      rightCol.BackColor = BgCanvas;',
    '      this.Controls.Add(rightCol);',
    '      rightCol.BringToFront();',
    '',
    '      // Top Header',
    '      Panel header = new Panel();',
    '      header.Height = 56;',
    '      header.Dock = DockStyle.Top;',
    '      header.BackColor = BgCanvas;',
    '      header.Padding = new Padding(24, 12, 24, 12);',
    '      rightCol.Controls.Add(header);',
    '',
    '      lblHeaderTitle = new Label();',
    '      lblHeaderTitle.Text = "WinPulse CS2 / Visao Geral";',
    '      lblHeaderTitle.Font = new Font("Segoe UI", 11F, FontStyle.Bold);',
    '      lblHeaderTitle.ForeColor = TextMain;',
    '      lblHeaderTitle.AutoSize = true;',
    '      lblHeaderTitle.Location = new Point(24, 16);',
    '      header.Controls.Add(lblHeaderTitle);',
    '',
    '      Panel contentHost = new Panel();',
    '      contentHost.Dock = DockStyle.Fill;',
    '      contentHost.Padding = new Padding(24, 8, 24, 24);',
    '      rightCol.Controls.Add(contentHost);',
    '      contentHost.BringToFront();',
    '',
    '      BuildOverviewPage(contentHost);',
    '      BuildCategoryPage(contentHost, "temp", "Limpeza de Arquivos Temporarios e Caches", "temp");',
    '      BuildCs2Page(contentHost);',
    '      BuildPowerPage(contentHost);',
    '      BuildCategoryPage(contentHost, "windows", "Otimizacoes Gerais do Windows 11", "windows");',
    '    }',
    '',
    '    private void AddNavButton(Panel parent, string key, string text, int order) {',
    '      Button btn = new Button();',
    '      btn.Text = "  " + text;',
    '      btn.TextAlign = ContentAlignment.MiddleLeft;',
    '      btn.Dock = DockStyle.Top;',
    '      btn.Height = 40;',
    '      btn.FlatStyle = FlatStyle.Flat;',
    '      btn.FlatAppearance.BorderSize = 0;',
    '      btn.BackColor = BgSidebar;',
    '      btn.ForeColor = TextMuted;',
    '      btn.Cursor = Cursors.Hand;',
    '      btn.Click += delegate(object s, EventArgs e) { ShowPage(key, text); };',
    '      parent.Controls.Add(btn);',
    '      navButtons[key] = btn;',
    '    }',
    '',
    '    private void ShowPage(string key, string label) {',
    '      lblHeaderTitle.Text = "WinPulse CS2 / " + label;',
    '      foreach (KeyValuePair<string, Panel> kv in pages) {',
    '        kv.Value.Visible = (kv.Key == key);',
    '      }',
    '      foreach (KeyValuePair<string, Button> kv in navButtons) {',
    '        bool active = (kv.Key == key);',
    '        kv.Value.BackColor = active ? BgElevated : BgSidebar;',
    '        kv.Value.ForeColor = active ? TextMain : TextMuted;',
    '      }',
    '      UpdateStatsLabel();',
    '    }',
    '',
    '    private void BuildOverviewPage(Panel host) {',
    '      Panel page = new Panel();',
    '      page.Dock = DockStyle.Fill;',
    '      page.AutoScroll = true;',
    '      host.Controls.Add(page);',
    '      pages["overview"] = page;',
    '',
    '      Label h2 = new Label();',
    '      h2.Text = "Centro de Otimizacao Windows 11 e Counter-Strike 2";',
    '      h2.Font = new Font("Segoe UI", 15F, FontStyle.Bold);',
    '      h2.Location = new Point(0, 6);',
    '      h2.Size = new Size(730, 30);',
    '      page.Controls.Add(h2);',
    '',
    '      Label sub = new Label();',
    '      sub.Text = "Crie um Ponto de Restauracao por seguranca e aplique todas as configuracoes diretamente como Administrador.";',
    '      sub.ForeColor = TextMuted;',
    '      sub.Location = new Point(0, 38);',
    '      sub.Size = new Size(730, 22);',
    '      page.Controls.Add(sub);',
    '',
    '      // Action Box',
    '      Panel actionCard = new Panel();',
    '      actionCard.Location = new Point(0, 72);',
    '      actionCard.Size = new Size(730, 146);',
    '      actionCard.BackColor = BgCard;',
    '      actionCard.BorderStyle = BorderStyle.FixedSingle;',
    '      page.Controls.Add(actionCard);',
    '',
    '      chkFullBackup = new CheckBox();',
    '      chkFullBackup.Text = "Fazer backup completo do PC atual (Registro .reg, Plano .pow e autoexec) antes de aplicar";',
    '      chkFullBackup.Checked = ' + initFullBackup + ';',
    '      chkFullBackup.Location = new Point(16, 14);',
    '      chkFullBackup.Size = new Size(690, 22);',
    '      actionCard.Controls.Add(chkFullBackup);',
    '',
    '      chkRestorePoint = new CheckBox();',
    '      chkRestorePoint.Text = "Criar Ponto de Restauracao do Windows (WinPulse-CS2-Backup)";',
    '      chkRestorePoint.Checked = ' + initRestorePoint + ';',
    '      chkRestorePoint.Location = new Point(16, 40);',
    '      chkRestorePoint.Size = new Size(690, 22);',
    '      actionCard.Controls.Add(chkRestorePoint);',
    '',
    '      chkAutoexec = new CheckBox();',
    '      chkAutoexec.Text = "Instalar autoexec.cfg automaticamente na pasta do CS2 na Steam";',
    '      chkAutoexec.Checked = true;',
    '      chkAutoexec.Location = new Point(16, 66);',
    '      chkAutoexec.Size = new Size(690, 22);',
    '      actionCard.Controls.Add(chkAutoexec);',
    '',
    '      btnRestore = new Button();',
    '      btnRestore.Text = "Criar Ponto de Restauracao";',
    '      btnRestore.Font = new Font("Segoe UI", 9.5F, FontStyle.Bold);',
    '      btnRestore.BackColor = BgElevated;',
    '      btnRestore.ForeColor = TextMain;',
    '      btnRestore.FlatStyle = FlatStyle.Flat;',
    '      btnRestore.FlatAppearance.BorderColor = BorderCol;',
    '      btnRestore.Location = new Point(16, 98);',
    '      btnRestore.Size = new Size(235, 36);',
    '      btnRestore.Cursor = Cursors.Hand;',
    '      btnRestore.Click += delegate(object s, EventArgs e) { RunRestoreAction(); };',
    '      actionCard.Controls.Add(btnRestore);',
    '',
    '      btnApply = new Button();',
    '      btnApply.Text = "Aplicar Configuracoes Diretamente";',
    '      btnApply.Font = new Font("Segoe UI", 9.5F, FontStyle.Bold);',
    '      btnApply.BackColor = AccentBlue;',
    '      btnApply.ForeColor = Color.White;',
    '      btnApply.FlatStyle = FlatStyle.Flat;',
    '      btnApply.FlatAppearance.BorderSize = 0;',
    '      btnApply.Location = new Point(264, 98);',
    '      btnApply.Size = new Size(275, 36);',
    '      btnApply.Cursor = Cursors.Hand;',
    '      btnApply.Click += delegate(object s, EventArgs e) { RunApplyAction(); };',
    '      actionCard.Controls.Add(btnApply);',
    '',
    '      lblStats = new Label();',
    '      lblStats.Location = new Point(0, 232);',
    '      lblStats.Size = new Size(730, 24);',
    '      lblStats.ForeColor = Color.FromArgb(147, 197, 253);',
    '      lblStats.Font = new Font("Segoe UI", 9.5F, FontStyle.Bold);',
    '      page.Controls.Add(lblStats);',
    '',
    '      Label lblLogTitle = new Label();',
    '      lblLogTitle.Text = "Saida de execucao em tempo real:";',
    '      lblLogTitle.ForeColor = TextMuted;',
    '      lblLogTitle.Location = new Point(0, 266);',
    '      lblLogTitle.Size = new Size(730, 20);',
    '      page.Controls.Add(lblLogTitle);',
    '',
    '      txtLog = new TextBox();',
    '      txtLog.Multiline = true;',
    '      txtLog.ReadOnly = true;',
    '      txtLog.ScrollBars = ScrollBars.Vertical;',
    '      txtLog.BackColor = Color.FromArgb(15, 17, 21);',
    '      txtLog.ForeColor = Color.FromArgb(209, 213, 219);',
    '      txtLog.BorderStyle = BorderStyle.FixedSingle;',
    '      txtLog.Font = new Font("Consolas", 9F);',
    '      txtLog.Location = new Point(0, 290);',
    '      txtLog.Size = new Size(730, 240);',
    '      txtLog.Text = "Pronto. Ajuste as abas ao lado se desejar e clique em Criar Ponto de Restauracao ou Aplicar Configuracoes Diretamente.";',
    '      page.Controls.Add(txtLog);',
    '    }',
    '',
    '    private void BuildCategoryPage(Panel host, string pageKey, string title, string categoryFilter) {',
    '      Panel page = new Panel();',
    '      page.Dock = DockStyle.Fill;',
    '      page.AutoScroll = true;',
    '      page.Visible = false;',
    '      host.Controls.Add(page);',
    '      pages[pageKey] = page;',
    '',
    '      Label h = new Label();',
    '      h.Text = title;',
    '      h.Font = new Font("Segoe UI", 14F, FontStyle.Bold);',
    '      h.Location = new Point(0, 6);',
    '      h.Size = new Size(730, 28);',
    '      page.Controls.Add(h);',
    '',
    '      int y = 46;',
    '      foreach (TweakEntry item in tweaks) {',
    '        if (item.Category != categoryFilter) continue;',
    '        Panel row = new Panel();',
    '        row.Location = new Point(0, y);',
    '        row.Size = new Size(710, 58);',
    '        row.BackColor = BgCard;',
    '        row.BorderStyle = BorderStyle.FixedSingle;',
    '',
    '        CheckBox cb = new CheckBox();',
    '        cb.Text = item.Title + "  [" + item.Risk.ToUpper() + "]";',
    '        cb.Checked = item.Enabled;',
    '        cb.Font = new Font("Segoe UI", 9.5F, FontStyle.Bold);',
    '        cb.ForeColor = TextMain;',
    '        cb.Location = new Point(12, 8);',
    '        cb.Size = new Size(680, 22);',
    '        TweakEntry captured = item;',
    '        cb.CheckedChanged += delegate(object s, EventArgs e) { captured.Enabled = cb.Checked; UpdateStatsLabel(); };',
    '        item.Box = cb;',
    '        row.Controls.Add(cb);',
    '',
    '        Label desc = new Label();',
    '        desc.Text = item.Benefit;',
    '        desc.ForeColor = TextMuted;',
    '        desc.Font = new Font("Segoe UI", 8.5F);',
    '        desc.Location = new Point(30, 32);',
    '        desc.Size = new Size(660, 18);',
    '        row.Controls.Add(desc);',
    '',
    '        page.Controls.Add(row);',
    '        y += 66;',
    '      }',
    '    }',
    '',
    '    private void BuildCs2Page(Panel host) {',
    '      Panel page = new Panel();',
    '      page.Dock = DockStyle.Fill;',
    '      page.AutoScroll = true;',
    '      page.Visible = false;',
    '      host.Controls.Add(page);',
    '      pages["cs2"] = page;',
    '',
    '      Label h = new Label();',
    '      h.Text = "Counter-Strike 2 — Inicializacao, autoexec.cfg e Sistema";',
    '      h.Font = new Font("Segoe UI", 14F, FontStyle.Bold);',
    '      h.Location = new Point(0, 6);',
    '      h.Size = new Size(730, 28);',
    '      page.Controls.Add(h);',
    '',
    '      Label lblLaunch = new Label();',
    '      lblLaunch.Text = "Opcoes de Inicializacao da Steam:";',
    '      lblLaunch.ForeColor = TextMuted;',
    '      lblLaunch.Location = new Point(0, 44);',
    '      lblLaunch.Size = new Size(400, 20);',
    '      page.Controls.Add(lblLaunch);',
    '',
    '      TextBox txtLaunch = new TextBox();',
    '      txtLaunch.Text = steamLaunch;',
    '      txtLaunch.ReadOnly = true;',
    '      txtLaunch.BackColor = BgCard;',
    '      txtLaunch.ForeColor = Color.FromArgb(147, 197, 253);',
    '      txtLaunch.BorderStyle = BorderStyle.FixedSingle;',
    '      txtLaunch.Font = new Font("Consolas", 9.5F);',
    '      txtLaunch.Location = new Point(0, 68);',
    '      txtLaunch.Size = new Size(570, 26);',
    '      page.Controls.Add(txtLaunch);',
    '',
    '      Button btnCopyLaunch = new Button();',
    '      btnCopyLaunch.Text = "Copiar Linha";',
    '      btnCopyLaunch.BackColor = BgElevated;',
    '      btnCopyLaunch.ForeColor = TextMain;',
    '      btnCopyLaunch.FlatStyle = FlatStyle.Flat;',
    '      btnCopyLaunch.Location = new Point(580, 66);',
    '      btnCopyLaunch.Size = new Size(130, 28);',
    '      btnCopyLaunch.Click += delegate(object s, EventArgs e) {',
    '        if (!string.IsNullOrEmpty(txtLaunch.Text)) Clipboard.SetText(txtLaunch.Text);',
    '        AppendLog("[OK] Opcoes de inicializacao da Steam copiadas.");',
    '      };',
    '      page.Controls.Add(btnCopyLaunch);',
    '',
    '      int y = 112;',
    '      foreach (TweakEntry item in tweaks) {',
    '        if (item.Category != "cs2_sys") continue;',
    '        Panel row = new Panel();',
    '        row.Location = new Point(0, y);',
    '        row.Size = new Size(710, 58);',
    '        row.BackColor = BgCard;',
    '        row.BorderStyle = BorderStyle.FixedSingle;',
    '        CheckBox cb = new CheckBox();',
    '        cb.Text = item.Title + "  [" + item.Risk.ToUpper() + "]";',
    '        cb.Checked = item.Enabled;',
    '        cb.Font = new Font("Segoe UI", 9.5F, FontStyle.Bold);',
    '        cb.ForeColor = TextMain;',
    '        cb.Location = new Point(12, 8);',
    '        cb.Size = new Size(680, 22);',
    '        TweakEntry captured = item;',
    '        cb.CheckedChanged += delegate(object s, EventArgs e) { captured.Enabled = cb.Checked; UpdateStatsLabel(); };',
    '        item.Box = cb;',
    '        row.Controls.Add(cb);',
    '        Label desc = new Label();',
    '        desc.Text = item.Benefit;',
    '        desc.ForeColor = TextMuted;',
    '        desc.Font = new Font("Segoe UI", 8.5F);',
    '        desc.Location = new Point(30, 32);',
    '        desc.Size = new Size(660, 18);',
    '        row.Controls.Add(desc);',
    '        page.Controls.Add(row);',
    '        y += 66;',
    '      }',
    '    }',
    '',
    '    private void BuildPowerPage(Panel host) {',
    '      Panel page = new Panel();',
    '      page.Dock = DockStyle.Fill;',
    '      page.AutoScroll = true;',
    '      page.Visible = false;',
    '      host.Controls.Add(page);',
    '      pages["power"] = page;',
    '',
    '      Label h = new Label();',
    '      h.Text = "Plano de Energia e Parametros powercfg";',
    '      h.Font = new Font("Segoe UI", 14F, FontStyle.Bold);',
    '      h.Location = new Point(0, 6);',
    '      h.Size = new Size(730, 28);',
    '      page.Controls.Add(h);',
    '',
    '      Panel planBox = new Panel();',
    '      planBox.Location = new Point(0, 44);',
    '      planBox.Size = new Size(710, 96);',
    '      planBox.BackColor = BgCard;',
    '      planBox.BorderStyle = BorderStyle.FixedSingle;',
    '      page.Controls.Add(planBox);',
    '',
    '      rbUltimate = new RadioButton();',
    '      rbUltimate.Text = "Desempenho Maximo (Ultimate Performance — recomendado para desktop/baixa latencia)";',
    '      rbUltimate.Checked = ("' + initPlan + '" == "ultimate");',
    '      rbUltimate.Location = new Point(14, 10);',
    '      rbUltimate.Size = new Size(680, 22);',
    '      planBox.Controls.Add(rbUltimate);',
    '',
    '      rbHigh = new RadioButton();',
    '      rbHigh.Text = "Alto Desempenho (High Performance)";',
    '      rbHigh.Checked = ("' + initPlan + '" == "high");',
    '      rbHigh.Location = new Point(14, 36);',
    '      rbHigh.Size = new Size(680, 22);',
    '      planBox.Controls.Add(rbHigh);',
    '',
    '      rbBalanced = new RadioButton();',
    '      rbBalanced.Text = "Equilibrado (recomendado para Ryzen X3D Dual-CCD / uso silencioso)";',
    '      rbBalanced.Checked = ("' + initPlan + '" == "balanced");',
    '      rbBalanced.Location = new Point(14, 62);',
    '      rbBalanced.Size = new Size(680, 22);',
    '      planBox.Controls.Add(rbBalanced);',
    '',
    '      int y = 154;',
    '      foreach (TweakEntry item in tweaks) {',
    '        if (item.Category != "power") continue;',
    '        Panel row = new Panel();',
    '        row.Location = new Point(0, y);',
    '        row.Size = new Size(710, 58);',
    '        row.BackColor = BgCard;',
    '        row.BorderStyle = BorderStyle.FixedSingle;',
    '        CheckBox cb = new CheckBox();',
    '        cb.Text = item.Title + "  [" + item.Risk.ToUpper() + "]";',
    '        cb.Checked = item.Enabled;',
    '        cb.Font = new Font("Segoe UI", 9.5F, FontStyle.Bold);',
    '        cb.ForeColor = TextMain;',
    '        cb.Location = new Point(12, 8);',
    '        cb.Size = new Size(680, 22);',
    '        TweakEntry captured = item;',
    '        cb.CheckedChanged += delegate(object s, EventArgs e) { captured.Enabled = cb.Checked; UpdateStatsLabel(); };',
    '        item.Box = cb;',
    '        row.Controls.Add(cb);',
    '        Label desc = new Label();',
    '        desc.Text = item.Benefit;',
    '        desc.ForeColor = TextMuted;',
    '        desc.Font = new Font("Segoe UI", 8.5F);',
    '        desc.Location = new Point(30, 32);',
    '        desc.Size = new Size(660, 18);',
    '        row.Controls.Add(desc);',
    '        page.Controls.Add(row);',
    '        y += 66;',
    '      }',
    '    }',
    '',
    '    private void UpdateStatsLabel() {',
    '      int active = 0;',
    '      foreach (TweakEntry t in tweaks) { if (t.Enabled) active++; }',
    '      lblStats.Text = "Ajustes selecionados: " + active + " de " + tweaks.Count;',
    '    }',
    '',
    '    private void AppendLog(string line) {',
    '      if (this.InvokeRequired) {',
    '        this.Invoke((MethodInvoker)delegate { AppendLog(line); });',
    '        return;',
    '      }',
    '      txtLog.AppendText(line + Environment.NewLine);',
    '    }',
    '',
    '    private void SetBusy(bool busy) {',
    '      if (this.InvokeRequired) {',
    '        this.Invoke((MethodInvoker)delegate { SetBusy(busy); });',
    '        return;',
    '      }',
    '      isBusy = busy;',
    '      btnRestore.Enabled = !busy;',
    '      btnApply.Enabled = !busy;',
    '    }',
    '',
    '    private static string DecodeB64(string b64) {',
    '      return Encoding.UTF8.GetString(Convert.FromBase64String(b64));',
    '    }',
    '',
    '    private void RunRestoreAction() {',
    '      if (isBusy) return;',
    '      SetBusy(true);',
    '      txtLog.Clear();',
    '      AppendLog("=== Criando Ponto de Restauracao e Backup ===");',
    '      bool doFull = chkFullBackup.Checked;',
    '      Thread t = new Thread(delegate() {',
    '        try {',
    '          string backupScript = Path.Combine(baseDir, "fazer_backup_pc.ps1");',
    '          if (doFull && File.Exists(backupScript)) {',
    '            RunPsFile(backupScript);',
    '          } else {',
    '            string cmd = "Enable-ComputerRestore -Drive ($env:SystemDrive + \'\\\\\') -ErrorAction SilentlyContinue; Checkpoint-Computer -Description \'WinPulse-CS2-Backup\' -RestorePointType \'MODIFY_SETTINGS\'";',
    '            RunPsCommand(cmd);',
    '            AppendLog("[OK] Ponto de Restauracao criado com sucesso.");',
    '          }',
    '        } catch (Exception ex) {',
    '          AppendLog("[AVISO] " + ex.Message);',
    '        } finally {',
    '          SetBusy(false);',
    '        }',
    '      });',
    '      t.IsBackground = true;',
    '      t.Start();',
    '    }',
    '',
    '    private void RunApplyAction() {',
    '      if (isBusy) return;',
    '      SetBusy(true);',
    '      txtLog.Clear();',
    '      AppendLog("=== Iniciando Otimizacao WinPulse CS2 ===");',
    '      bool doBackup = chkFullBackup.Checked;',
    '      bool doRestore = chkRestorePoint.Checked;',
    '      bool doAutoexec = chkAutoexec.Checked;',
    '      string selectedPlan = rbUltimate.Checked ? "ultimate" : (rbHigh.Checked ? "high" : "balanced");',
    '',
    '      Thread t = new Thread(delegate() {',
    '        try {',
    '          if (doBackup) {',
    '            string backupScript = Path.Combine(baseDir, "fazer_backup_pc.ps1");',
    '            if (File.Exists(backupScript)) {',
    '              AppendLog("[1/4] Executando backup completo do PC atual...");',
    '              RunPsFile(backupScript);',
    '            }',
    '          } else if (doRestore) {',
    '            AppendLog("[1/4] Criando Ponto de Restauracao...");',
    '            RunPsCommand("Enable-ComputerRestore -Drive ($env:SystemDrive + \'\\\\\') -ErrorAction SilentlyContinue; Checkpoint-Computer -Description \'WinPulse-CS2-Backup\' -RestorePointType \'MODIFY_SETTINGS\'");',
    '          }',
    '',
    '          if (doAutoexec) {',
    '            CopyAutoexecToSteam();',
    '          }',
    '',
    '          StringBuilder ps = new StringBuilder();',
    '          ps.AppendLine("$ErrorActionPreference = \'Continue\'");',
    '          if (selectedPlan == "ultimate") {',
    '            ps.AppendLine("$ug = \'e9a42b02-d5df-448d-aa00-03f14749eb61\'");',
    '            ps.AppendLine("if (-not (powercfg /list | Select-String -Pattern \'Desempenho M|Ultimate Performance\')) { powercfg -duplicatescheme $ug | Out-Null }");',
    '            ps.AppendLine("$ln = (powercfg /list | Select-String -Pattern \'Desempenho M|Ultimate Performance\' | Select-Object -First 1).ToString()");',
    '            ps.AppendLine("if ($ln -match \'([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})\') { powercfg -setactive $Matches[1]; Write-Host \'[OK] Plano Desempenho Maximo ativado.\' }");',
    '          } else if (selectedPlan == "high") {',
    '            ps.AppendLine("powercfg -setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c; Write-Host \'[OK] Plano Alto Desempenho ativado.\'");',
    '          } else {',
    '            ps.AppendLine("powercfg -setactive 381b4222-f694-41f0-9685-ff5bb260df2e; Write-Host \'[OK] Plano Equilibrado ativado.\'");',
    '          }',
    '          foreach (TweakEntry item in tweaks) {',
    '            if (item.Enabled) {',
    '              ps.AppendLine(DecodeB64(item.ScriptB64));',
    '            }',
    '          }',
    '          ps.AppendLine("Write-Host \'[CONCLUIDO] Todas as otimizacoes selecionadas foram aplicadas.\'");',
    '',
    '          string tempPs = Path.Combine(Path.GetTempPath(), "winpulse_apply_temp.ps1");',
    '          File.WriteAllText(tempPs, ps.ToString(), new UTF8Encoding(true));',
    '          AppendLog("[2/4] Aplicando ajustes selecionados...");',
    '          RunPsFile(tempPs);',
    '          try { File.Delete(tempPs); } catch { }',
    '          AppendLog("[SUCESSO] Processo finalizado! Reinicie o PC se ajustou HAGS, Rede ou PriorityControl.");',
    '        } catch (Exception ex) {',
    '          AppendLog("[ERRO] " + ex.Message);',
    '        } finally {',
    '          SetBusy(false);',
    '        }',
    '      });',
    '      t.IsBackground = true;',
    '      t.Start();',
    '    }',
    '',
    '    private void RunPsFile(string scriptPath) {',
    '      ProcessStartInfo psi = new ProcessStartInfo();',
    '      psi.FileName = "powershell.exe";',
    '      psi.Arguments = "-NoProfile -ExecutionPolicy Bypass -File \\"" + scriptPath + "\\"";',
    '      psi.UseShellExecute = false;',
    '      psi.CreateNoWindow = true;',
    '      psi.RedirectStandardOutput = true;',
    '      psi.RedirectStandardError = true;',
    '      Process p = new Process();',
    '      p.StartInfo = psi;',
    '      p.OutputDataReceived += delegate(object s, DataReceivedEventArgs e) { if (!string.IsNullOrWhiteSpace(e.Data)) AppendLog(e.Data); };',
    '      p.ErrorDataReceived += delegate(object s, DataReceivedEventArgs e) { if (!string.IsNullOrWhiteSpace(e.Data)) AppendLog("[AVISO] " + e.Data); };',
    '      p.Start();',
    '      p.BeginOutputReadLine();',
    '      p.BeginErrorReadLine();',
    '      p.WaitForExit();',
    '    }',
    '',
    '    private void RunPsCommand(string command) {',
    '      ProcessStartInfo psi = new ProcessStartInfo();',
    '      psi.FileName = "powershell.exe";',
    '      psi.Arguments = "-NoProfile -ExecutionPolicy Bypass -Command \\"" + command.Replace("\\"", "\\\\\\"") + "\\"";',
    '      psi.UseShellExecute = false;',
    '      psi.CreateNoWindow = true;',
    '      psi.RedirectStandardOutput = true;',
    '      psi.RedirectStandardError = true;',
    '      Process p = Process.Start(psi);',
    '      string outStr = p.StandardOutput.ReadToEnd();',
    '      string errStr = p.StandardError.ReadToEnd();',
    '      p.WaitForExit();',
    '      if (!string.IsNullOrWhiteSpace(outStr)) AppendLog(outStr.Trim());',
    '      if (!string.IsNullOrWhiteSpace(errStr)) AppendLog("[AVISO] " + errStr.Trim());',
    '    }',
    '',
    '    private void CopyAutoexecToSteam() {',
    '      try {',
    '        string cfgText = DecodeB64(autoexecB64);',
    '        object steamObj = Registry.GetValue(@"HKEY_CURRENT_USER\\Software\\Valve\\Steam", "SteamPath", null);',
    '        if (steamObj == null) {',
    '          AppendLog("[AVISO] Steam nao encontrada no Registro; salve autoexec.cfg manualmente.");',
    '          return;',
    '        }',
    '        string steamPath = steamObj.ToString().Replace("/", "\\\\");',
    '        string targetDir = Path.Combine(steamPath, @"steamapps\\common\\Counter-Strike Global Offensive\\game\\csgo\\cfg");',
    '        if (Directory.Exists(targetDir)) {',
    '          string targetFile = Path.Combine(targetDir, "autoexec.cfg");',
    '          File.WriteAllText(targetFile, cfgText, Encoding.UTF8);',
    '          AppendLog("[OK] autoexec.cfg instalado em: " + targetFile);',
    '        } else {',
    '          AppendLog("[AVISO] Pasta cfg do CS2 nao encontrada em " + targetDir);',
    '        }',
    '      } catch (Exception ex) {',
    '        AppendLog("[AVISO] Erro ao copiar autoexec.cfg: " + ex.Message);',
    '      }',
    '    }',
    '',
    '    [STAThread]',
    '    public static void Main() {',
    '      WindowsIdentity id = WindowsIdentity.GetCurrent();',
    '      WindowsPrincipal p = new WindowsPrincipal(id);',
    '      if (!p.IsInRole(WindowsBuiltInRole.Administrator)) {',
    '        try {',
    '          ProcessStartInfo self = new ProcessStartInfo(Application.ExecutablePath);',
    '          self.Verb = "runas";',
    '          self.UseShellExecute = true;',
    '          Process.Start(self);',
    '          return;',
    '        } catch { return; }',
    '      }',
    '      Application.EnableVisualStyles();',
    '      Application.SetCompatibleTextRenderingDefault(false);',
    '      Application.Run(new MainForm());',
    '    }',
    '  }',
    '}',
    '',
  ].join('\r\n');
}

export function buildExeBuilderBat(): string {
  return [
    '@echo off',
    'title WinPulse CS2 - Compilar WinPulseCS2.exe',
    'setlocal',
    'cd /d "%~dp0"',
    '',
    'set "CSC=%SystemRoot%\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe"',
    'if not exist "%CSC%" set "CSC=%SystemRoot%\\Microsoft.NET\\Framework\\v4.0.30319\\csc.exe"',
    'if not exist "%CSC%" (',
    '  echo [ERRO] Compilador .NET Framework 4.x ^(csc.exe^) nao encontrado neste Windows.',
    '  pause',
    '  exit /b 1',
    ')',
    '',
    'if not exist "%~dp0WinPulseLauncher.cs" (',
    '  echo [ERRO] Arquivo WinPulseLauncher.cs nao encontrado na pasta.',
    '  echo Extraia TODOS os arquivos do .ZIP antes de executar.',
    '  pause',
    '  exit /b 1',
    ')',
    '',
    'echo Compilando WinPulseCS2.exe com interface completa...',
    '"%CSC%" /nologo /target:winexe /out:"%~dp0WinPulseCS2.exe" /reference:System.Windows.Forms.dll /reference:System.Drawing.dll "%~dp0WinPulseLauncher.cs"',
    'if %errorlevel% neq 0 (',
    '  echo.',
    '  echo [ERRO] Falha ao compilar WinPulseCS2.exe.',
    '  pause',
    '  exit /b 1',
    ')',
    '',
    'echo [OK] WinPulseCS2.exe criado com sucesso!',
    'set "TARGET_EXE=%~dp0WinPulseCS2.exe"',
    'powershell -NoProfile -Command "Start-Process -FilePath $env:TARGET_EXE -Verb RunAs"',
    'exit /b 0',
    '',
  ].join('\r\n');
}

export function buildRevertPowerShellScript(state: OptimizerState): string {
  const revertableTweaks = TWEAKS_CATALOG.filter(
    (t) => state.enabledTweaks[t.id] && t.revertScript
  );

  const lines: string[] = [
    '# ============================================================================',
    '# WinPulse CS2 — Script de Reversao para Padroes do Windows',
    '# Execute no PowerShell como Administrador.',
    '# ============================================================================',
    '',
    '$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)',
    'if (-not $isAdmin) {',
    '  Write-Host "[ERRO] Execute este script como Administrador!" -ForegroundColor Red',
    '  exit 1',
    '}',
    '',
    'Write-Host "Restaurando configuracoes padrao do Windows..." -ForegroundColor Cyan',
    'powercfg -setactive 381b4222-f694-41f0-9685-ff5bb260df2e',
    'Write-Host "  -> Plano de energia restaurado para Equilibrado." -ForegroundColor Gray',
    '',
  ];

  if (revertableTweaks.length === 0) {
    lines.push('Write-Host "  -> Nenhuma alteracao de registro/servico ativa para reverter." -ForegroundColor Gray');
  } else {
    for (const tweak of revertableTweaks) {
      lines.push(`# Reverter: ${tweak.title}`);
      lines.push(tweak.revertScript!);
      lines.push('');
    }
  }

  lines.push(
    'Write-Host "Reversao concluida! Reinicie o computador para aplicar todos os padroes." -ForegroundColor Green'
  );

  return lines.join('\n');
}

export function buildReadmeTxt(state: OptimizerState): string {
  const launchStr = buildSteamLaunchOptions(state.cs2Config);
  const activeCount = TWEAKS_CATALOG.filter((t) => state.enabledTweaks[t.id]).length;

  return [
    '====================================================================',
    'WinPulse CS2 — Guia Rápido de Aplicação (.EXE, Backup e .BAT)',
    '====================================================================',
    '',
    `Perfil selecionado: ${state.activeProfile}`,
    `Total de otimizações ativas: ${activeCount}`,
    `Backup completo do PC antes da otimização: ${state.fullPcBackup ? 'Ativado' : 'Desativado'}`,
    '',
    'OPÇÃO A — Gerar e abrir o executável WinPulseCS2.exe (Recomendado)',
    '1. Extraia TODOS os arquivos deste .ZIP para uma pasta.',
    '2. Dê um clique duplo em "gerar_exe_nativo.bat".',
    '3. O Windows compilará "WinPulseCS2.exe" com barra lateral, abas',
    '   (Visão Geral, Temporários, CS2, Plano de Energia, Ajustes Windows)',
    '   e os botões "Criar Ponto de Restauração" e "Aplicar Configurações Diretamente".',
    '',
    'OPÇÃO B — Executar diretamente via .BAT como Administrador',
    '1. Dê um clique duplo em "executar_como_admin.bat" e aceite o prompt UAC.',
    '2. Se o Backup Completo estiver ativo, ele salvará Registro (.reg), Plano de Energia (.pow),',
    '   serviços e Ponto de Restauração na pasta "Backup_PC_<data>" antes de otimizar.',
    '',
    'PASSO FINAL — Steam e Counter-Strike 2',
    '1. Caso não tenha usado o WinPulseCS2.exe para copiar automaticamente, copie "autoexec.cfg" para:',
    '   C:\\Program Files (x86)\\Steam\\steamapps\\common\\Counter-Strike Global Offensive\\game\\csgo\\cfg\\',
    '2. Na Steam > Counter-Strike 2 > Propriedades > Opções de Inicialização, cole:',
    `   ${launchStr || '+exec autoexec.cfg'}`,
    '',
    'COMO REVERTER',
    'Use os arquivos .reg/.pow salvos na pasta "Backup_PC_<data>", execute "reverter_padroes.ps1"',
    'como Administrador, ou restaure pelo Ponto de Restauração "WinPulse-CS2-Backup".',
    '',
  ].join('\r\n');
}

export function getGeneratedFiles(
  state: OptimizerState
): Record<ExportFileKey, { filename: string; content: string; language: string }> {
  return {
    ps1: {
      filename: 'otimizar_win_cs2.ps1',
      content: buildMainPowerShellScript(state),
      language: 'PowerShell',
    },
    bat: {
      filename: 'executar_como_admin.bat',
      content: buildBatLauncher(state),
      language: 'Batch',
    },
    backup: {
      filename: 'fazer_backup_pc.ps1',
      content: buildPcBackupPowerShellScript(state),
      language: 'PowerShell',
    },
    exe_builder: {
      filename: 'gerar_exe_nativo.bat',
      content: buildExeBuilderBat(),
      language: 'Batch',
    },
    cs_launcher: {
      filename: 'WinPulseLauncher.cs',
      content: buildWinPulseLauncherCs(state),
      language: 'C# (.NET 4)',
    },
    autoexec: {
      filename: 'autoexec.cfg',
      content: buildAutoexecCfg(state),
      language: 'Source 2 CFG',
    },
    revert: {
      filename: 'reverter_padroes.ps1',
      content: buildRevertPowerShellScript(state),
      language: 'PowerShell',
    },
    readme: {
      filename: 'LEIA-ME.txt',
      content: buildReadmeTxt(state),
      language: 'Texto',
    },
  };
}

export function downloadSingleFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export async function downloadZipPackage(state: OptimizerState): Promise<void> {
  const zip = new JSZip();
  const files = getGeneratedFiles(state);

  const utf8Bom = '\uFEFF';
  zip.file(files.ps1.filename, utf8Bom + files.ps1.content);
  zip.file(files.bat.filename, files.bat.content);
  zip.file(files.backup.filename, utf8Bom + files.backup.content);
  zip.file(files.exe_builder.filename, files.exe_builder.content);
  zip.file(files.cs_launcher.filename, utf8Bom + files.cs_launcher.content);
  zip.file(files.autoexec.filename, files.autoexec.content);
  zip.file(files.revert.filename, utf8Bom + files.revert.content);
  zip.file(files.readme.filename, files.readme.content);

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `WinPulse-CS2-${state.activeProfile}.zip`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
