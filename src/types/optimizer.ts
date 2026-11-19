export type ProfileId = 'low-latency' | 'balanced' | 'max-fps';

export type ThemeMode = 'dark' | 'light';

export type AccentColorId =
  | 'roxo'
  | 'vermelho'
  | 'amarelo'
  | 'laranja'
  | 'verde'
  | 'azul'
  | 'rosa';

export interface AppearanceConfig {
  themeMode: ThemeMode;
  accentColor: AccentColorId;
  starfieldEnabled: boolean;
}

export type NavSection =
  | 'overview'
  | 'temp'
  | 'cs2'
  | 'power'
  | 'windows'
  | 'export';

export type Cs2SubSection = 'launch' | 'autoexec' | 'system';
export type PowerSubSection = 'schemes' | 'tweaks';

export interface SubSectionSelection {
  temp: string;
  cs2: Cs2SubSection;
  power: PowerSubSection;
  windows: string;
}

export type RiskLevel = 'seguro' | 'moderado' | 'avancado';

export type TweakCategory = 'temp' | 'cs2_sys' | 'power' | 'windows';

export interface TweakItem {
  id: string;
  category: TweakCategory;
  subgroup: string;
  title: string;
  description: string;
  frametimeBenefit: string;
  risk: RiskLevel;
  requiresReboot?: boolean;
  defaultProfiles: ProfileId[];
  previewCommand: string;
  applyScript: string;
  revertScript?: string;
}

export type PowerPlanType = 'ultimate' | 'high' | 'balanced';

export interface PowerConfig {
  plan: PowerPlanType;
  monitorTimeoutMinutes: number;
}

export interface Cs2Config {
  // Steam Launch Options
  launchHighPriority: boolean;
  launchNoJoy: boolean;
  launchExecAutoexec: boolean;
  launchFullscreen: boolean;
  launchThreadsEnabled: boolean;
  launchThreadsCount: number;
  launchRefreshRateEnabled: boolean;
  launchRefreshRate: number;
  launchExtraArgs: string;

  // autoexec.cfg settings
  fpsMax: number;
  fpsMaxUi: number;
  lowLatencySleep: boolean;
  rate: number;
  netBufferTicks: number;
  maxPing: number;
  fullscreenGamma: number;
  hideBuildInfo: boolean;
  telemetryFrametime: '0' | '1' | '2';
  telemetryPing: '0' | '1' | '2';
  telemetryPacketLoss: '0' | '1' | '2';
  headphoneEq: '0' | '1' | '2';
  perspectiveCorrection: boolean;
  radarScale: number;
  radarHudScale: number;
  radarIconScaleMin: number;
  radarBackgroundAlpha: number;
  radarAlwaysCentered: boolean;
  radarRotate: boolean;
  radarSquareAlways: boolean;
  radarSquareWithScoreboard: boolean;
  radarMapAdditive: boolean;
  teammateColorsShow: 0 | 1 | 2;
  useOpensBuyMenu: boolean;

  // Viewmodel / FOV (todas as formas)
  viewmodelPresetPos: 0 | 1 | 2 | 3;
  viewmodelFov: number;
  viewmodelOffsetX: number;
  viewmodelOffsetY: number;
  viewmodelOffsetZ: number;

  // Cor do HUD (0..12)
  hudColor: number;

  // Mouse & Sensibilidade
  applySensitivityInAutoexec: boolean;
  mouseSensitivity: number;
  zoomSensitivityRatio: number;

  // Bind para falar (+voicerecord)
  bindVoiceEnabled: boolean;
  bindVoiceKey: string;

  // Safe competitive binds
  bindScrollJump: boolean;
  bindRadarZoom: boolean;
  bindClutchMute: boolean;
}

export interface OptimizerState {
  activeProfile: ProfileId;
  enabledTweaks: Record<string, boolean>;
  createRestorePoint: boolean;
  fullPcBackup: boolean;
  backupDestination: string;
  powerConfig: PowerConfig;
  cs2Config: Cs2Config;
}

export type ExportFileKey =
  | 'ps1'
  | 'bat'
  | 'backup'
  | 'exe_builder'
  | 'cs_launcher'
  | 'autoexec'
  | 'revert'
  | 'readme';
