import { useEffect, useState } from 'react';
import { ApplyBackupPromptModal } from './components/ApplyBackupPromptModal';
import { Cs2View } from './components/Cs2View';
import { ExecutionLogModal } from './components/ExecutionLogModal';
import { ExportView } from './components/ExportView';
import { Header } from './components/Header';
import { OverviewView } from './components/OverviewView';
import { PowerPlanView } from './components/PowerPlanView';
import { Sidebar } from './components/Sidebar';
import { StarfieldBackground } from './components/StarfieldBackground';
import { TweakListView } from './components/TweakListView';
import {
  getDefaultCs2ConfigForProfile,
  getDefaultPowerConfigForProfile,
  getDefaultTweaksForProfile,
  TWEAKS_CATALOG,
} from './data/tweaks';
import {
  AccentColorId,
  AppearanceConfig,
  Cs2Config,
  NavSection,
  OptimizerState,
  PowerConfig,
  ProfileId,
  SubSectionSelection,
  TweakCategory,
} from './types/optimizer';
import {
  ActionReport,
  executeApplyDirectLive,
  executeRestorePointLive,
  isRunningInDesktopApp,
  LiveExecutionSnapshot,
  pickBackupFolder,
} from './utils/rustBridge';
import {
  applyAppearanceToDocument,
  DEFAULT_APPEARANCE,
  isValidAccentColor,
  isValidThemeMode,
} from './utils/theme';

const STORAGE_KEY = 'winpulse_cs2_state_v1';
const APPEARANCE_STORAGE_KEY = 'winpulse_cs2_appearance_v1';

function createInitialState(profile: ProfileId = 'low-latency'): OptimizerState {
  return {
    activeProfile: profile,
    enabledTweaks: getDefaultTweaksForProfile(profile),
    createRestorePoint: true,
    fullPcBackup: true,
    backupDestination: '',
    powerConfig: getDefaultPowerConfigForProfile(profile),
    cs2Config: getDefaultCs2ConfigForProfile(profile),
  };
}

function loadPersistedState(): OptimizerState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState('low-latency');
    const parsed = JSON.parse(raw) as Partial<OptimizerState>;
    const profile: ProfileId =
      parsed.activeProfile === 'balanced' ||
      parsed.activeProfile === 'max-fps' ||
      parsed.activeProfile === 'low-latency'
        ? parsed.activeProfile
        : 'low-latency';

    return {
      activeProfile: profile,
      enabledTweaks: {
        ...getDefaultTweaksForProfile(profile),
        ...(parsed.enabledTweaks ?? {}),
      },
      createRestorePoint:
        typeof parsed.createRestorePoint === 'boolean'
          ? parsed.createRestorePoint
          : true,
      fullPcBackup:
        typeof parsed.fullPcBackup === 'boolean'
          ? parsed.fullPcBackup
          : true,
      backupDestination:
        typeof parsed.backupDestination === 'string'
          ? parsed.backupDestination
          : '',
      powerConfig: {
        ...getDefaultPowerConfigForProfile(profile),
        ...(parsed.powerConfig ?? {}),
      },
      cs2Config: {
        ...getDefaultCs2ConfigForProfile(profile),
        ...(parsed.cs2Config ?? {}),
      },
    };
  } catch {
    return createInitialState('low-latency');
  }
}

function loadAppearance(): AppearanceConfig {
  try {
    const raw = localStorage.getItem(APPEARANCE_STORAGE_KEY);
    if (!raw) return DEFAULT_APPEARANCE;
    const parsed = JSON.parse(raw) as Partial<AppearanceConfig>;
    return {
      themeMode: isValidThemeMode(parsed.themeMode)
        ? parsed.themeMode
        : DEFAULT_APPEARANCE.themeMode,
      accentColor: isValidAccentColor(parsed.accentColor)
        ? parsed.accentColor
        : DEFAULT_APPEARANCE.accentColor,
      starfieldEnabled:
        typeof parsed.starfieldEnabled === 'boolean'
          ? parsed.starfieldEnabled
          : DEFAULT_APPEARANCE.starfieldEnabled,
    };
  } catch {
    return DEFAULT_APPEARANCE;
  }
}

export default function App() {
  const [state, setState] = useState<OptimizerState>(loadPersistedState);
  const [appearance, setAppearance] = useState<AppearanceConfig>(loadAppearance);
  const [activeSection, setActiveSection] = useState<NavSection>('overview');
  const [subSections, setSubSections] = useState<SubSectionSelection>({
    temp: 'all',
    cs2: 'launch',
    power: 'schemes',
    windows: 'all',
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [runningAction, setRunningAction] = useState<'restore' | 'apply' | null>(null);
  const [actionReport, setActionReport] = useState<ActionReport | null>(null);
  const [liveExecution, setLiveExecution] = useState<LiveExecutionSnapshot | null>(null);
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [applyPromptOpen, setApplyPromptOpen] = useState(false);
  const [backupDestConfiguredInModules, setBackupDestConfiguredInModules] = useState(
    () => state.backupDestination.trim() !== ''
  );

  const handleSelectSubSection = <K extends keyof SubSectionSelection>(
    section: K,
    sub: SubSectionSelection[K]
  ) => {
    setActiveSection(section);
    setSubSections((prev) => ({ ...prev, [section]: sub }));
  };

  const isDesktopNative = isRunningInDesktopApp();

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota issues
    }
  }, [state]);

  useEffect(() => {
    applyAppearanceToDocument(appearance);
    try {
      localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(appearance));
    } catch {
      // Ignore storage quota issues
    }
  }, [appearance]);

  const handleToggleThemeMode = () => {
    setAppearance((prev) => ({
      ...prev,
      themeMode: prev.themeMode === 'dark' ? 'light' : 'dark',
    }));
  };

  const handleSelectAccentColor = (accentColor: AccentColorId) => {
    setAppearance((prev) => ({ ...prev, accentColor }));
  };

  const handleToggleStarfield = () => {
    setAppearance((prev) => ({
      ...prev,
      starfieldEnabled: !prev.starfieldEnabled,
    }));
  };

  const handleSelectProfile = (profile: ProfileId) => {
    setState((prev) => ({
      ...createInitialState(profile),
      createRestorePoint: prev.createRestorePoint,
      fullPcBackup: prev.fullPcBackup,
      backupDestination: prev.backupDestination,
    }));
  };

  const handleResetProfile = () => {
    setState((prev) => ({
      ...createInitialState(prev.activeProfile),
      createRestorePoint: prev.createRestorePoint,
      fullPcBackup: prev.fullPcBackup,
      backupDestination: prev.backupDestination,
    }));
  };

  const handleSelectSafeOnly = () => {
    const safeMap: Record<string, boolean> = {};
    for (const item of TWEAKS_CATALOG) {
      safeMap[item.id] = item.risk === 'seguro';
    }
    setState((prev) => ({
      ...prev,
      enabledTweaks: safeMap,
    }));
  };

  const handleToggleTweak = (id: string) => {
    setState((prev) => ({
      ...prev,
      enabledTweaks: {
        ...prev.enabledTweaks,
        [id]: !prev.enabledTweaks[id],
      },
    }));
  };

  const handleSetCategoryEnabled = (
    categories: TweakCategory[],
    enabled: boolean
  ) => {
    setState((prev) => {
      const next = { ...prev.enabledTweaks };
      for (const item of TWEAKS_CATALOG) {
        if (categories.includes(item.category)) {
          next[item.id] = enabled;
        }
      }
      return { ...prev, enabledTweaks: next };
    });
  };

  const handleChangePowerConfig = (powerConfig: PowerConfig) => {
    setState((prev) => ({ ...prev, powerConfig }));
  };

  const handleChangeCs2Config = (cs2Config: Cs2Config) => {
    setState((prev) => ({ ...prev, cs2Config }));
  };

  const handleToggleRestorePoint = () => {
    setState((prev) => ({
      ...prev,
      createRestorePoint: !prev.createRestorePoint,
    }));
  };

  const handleToggleFullPcBackup = () => {
    setState((prev) => ({
      ...prev,
      fullPcBackup: !prev.fullPcBackup,
    }));
  };

  const handleChangeBackupDestination = (backupDestination: string) => {
    setBackupDestConfiguredInModules(true);
    setState((prev) => ({
      ...prev,
      backupDestination,
    }));
  };

  const handlePickBackupFolder = async () => {
    const chosen = await pickBackupFolder(state.backupDestination);
    if (chosen) {
      handleChangeBackupDestination(chosen);
    }
  };

  const handleCreateRestorePoint = async () => {
    if (runningAction) return;
    setRunningAction('restore');
    setLogModalOpen(true);
    try {
      const report = await executeRestorePointLive(
        state.fullPcBackup,
        state.backupDestination,
        (snapshot) => setLiveExecution(snapshot)
      );
      setActionReport(report);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      const failReport: ActionReport = {
        ok: false,
        summary: `Erro ao criar ponto de restauração: ${errorMsg}`,
        freedMb: 0,
        requiresReboot: false,
        logs: [`[ERRO] ${errorMsg}`],
        mode: isDesktopNative ? 'desktop-native' : 'web-preview',
      };
      setLiveExecution({
        running: false,
        actionType: 'restore',
        logs: failReport.logs,
        report: failReport,
      });
      setActionReport(failReport);
    } finally {
      setRunningAction(null);
    }
  };

  const handleApplyDirect = () => {
    if (runningAction) return;
    setApplyPromptOpen(true);
  };

  const executeApplyAfterPrompt = async (
    wantBackup: boolean,
    chosenDestination: string,
    wantRestorePoint: boolean
  ) => {
    if (runningAction) return;
    const nextState: OptimizerState = {
      ...state,
      fullPcBackup: wantBackup,
      backupDestination: chosenDestination,
      createRestorePoint: wantRestorePoint,
    };
    setState(nextState);
    if (wantBackup) {
      setBackupDestConfiguredInModules(true);
    }
    setApplyPromptOpen(false);
    setRunningAction('apply');
    setLogModalOpen(true);
    try {
      const report = await executeApplyDirectLive(nextState, (snapshot) =>
        setLiveExecution(snapshot)
      );
      setActionReport(report);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      const failReport: ActionReport = {
        ok: false,
        summary: `Erro ao aplicar otimizações: ${errorMsg}`,
        freedMb: 0,
        requiresReboot: false,
        logs: [`[ERRO] ${errorMsg}`],
        mode: isDesktopNative ? 'desktop-native' : 'web-preview',
      };
      setLiveExecution({
        running: false,
        actionType: 'apply',
        logs: failReport.logs,
        report: failReport,
      });
      setActionReport(failReport);
    } finally {
      setRunningAction(null);
    }
  };

  return (
    <div className="relative min-h-screen flex bg-[var(--wp-bg)] text-[var(--wp-text)] transition-colors duration-200">
      <StarfieldBackground
        themeMode={appearance.themeMode}
        accentColor={appearance.accentColor}
        enabled={appearance.starfieldEnabled}
      />

      <div className="relative z-10 flex w-full min-h-screen">
        <Sidebar
          activeSection={activeSection}
          subSections={subSections}
          onSelectSection={setActiveSection}
          onSelectSubSection={handleSelectSubSection}
          state={state}
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        <div className="flex-1 min-w-0 flex flex-col">
          <Header
            activeSection={activeSection}
            subSections={subSections}
            onOpenMobileMenu={() => setMobileMenuOpen(true)}
            onApplyDirect={handleApplyDirect}
            runningAction={runningAction}
            appearance={appearance}
            onToggleThemeMode={handleToggleThemeMode}
            onSelectAccentColor={handleSelectAccentColor}
            onToggleStarfield={handleToggleStarfield}
          />

          <main className="flex-1 px-4 sm:px-8 py-8 max-w-[1200px] w-full mx-auto">
            {activeSection === 'overview' && (
              <OverviewView
                state={state}
                onSelectProfile={handleSelectProfile}
                onResetProfile={handleResetProfile}
                onSelectSafeOnly={handleSelectSafeOnly}
                onNavigate={setActiveSection}
                onToggleRestorePoint={handleToggleRestorePoint}
                onToggleFullPcBackup={handleToggleFullPcBackup}
                onChangeBackupDestination={handleChangeBackupDestination}
                onPickBackupFolder={handlePickBackupFolder}
                onCreateRestorePoint={handleCreateRestorePoint}
                onApplyDirect={handleApplyDirect}
                runningAction={runningAction}
                actionReport={actionReport}
                onClearReport={() => setActionReport(null)}
                onOpenLastLog={() => setLogModalOpen(true)}
                isDesktopNative={isDesktopNative}
              />
            )}

            {activeSection === 'temp' && (
              <TweakListView
                categories={['temp']}
                title="Limpeza de Arquivos Temporários e Caches"
                description="Remova lixo acumulado de pastas temporárias, caches antigos de shaders DirectX/NVIDIA/AMD, Windows Update e DNS para eliminar gargalos de disco e stuttering."
                enabledTweaks={state.enabledTweaks}
                onToggleTweak={handleToggleTweak}
                onSetCategoryEnabled={handleSetCategoryEnabled}
                subgroupFilter={subSections.temp}
              />
            )}

            {activeSection === 'cs2' && (
              <Cs2View
                state={state}
                onChangeCs2Config={handleChangeCs2Config}
                onToggleTweak={handleToggleTweak}
                onSetCategoryEnabled={handleSetCategoryEnabled}
                subSection={subSections.cs2}
              />
            )}

            {activeSection === 'power' && (
              <PowerPlanView
                powerConfig={state.powerConfig}
                onChangePowerConfig={handleChangePowerConfig}
                enabledTweaks={state.enabledTweaks}
                onToggleTweak={handleToggleTweak}
                onSetCategoryEnabled={handleSetCategoryEnabled}
                subSection={subSections.power}
              />
            )}

            {activeSection === 'windows' && (
              <TweakListView
                categories={['windows']}
                title="Otimizações Gerais do Windows 11"
                description="Ajuste agendamento de GPU (HAGS), Game Mode, desativação de Game DVR, latência de rede (Nagle/Throttling), efeitos visuais e serviços em segundo plano."
                enabledTweaks={state.enabledTweaks}
                onToggleTweak={handleToggleTweak}
                onSetCategoryEnabled={handleSetCategoryEnabled}
                subgroupFilter={subSections.windows}
              />
            )}

            {activeSection === 'export' && (
              <ExportView
                state={state}
                onToggleRestorePoint={handleToggleRestorePoint}
                onToggleFullPcBackup={handleToggleFullPcBackup}
                onChangeBackupDestination={handleChangeBackupDestination}
                onPickBackupFolder={handlePickBackupFolder}
                onApplyDirect={handleApplyDirect}
                runningAction={runningAction}
                isDesktopNative={isDesktopNative}
              />
            )}
          </main>
        </div>
      </div>

      <ApplyBackupPromptModal
        open={applyPromptOpen}
        initialBackupEnabled={state.fullPcBackup}
        initialRestorePointEnabled={state.createRestorePoint}
        initialDestination={state.backupDestination}
        destinationConfiguredInModules={backupDestConfiguredInModules}
        isDesktopNative={isDesktopNative}
        onPickFolder={pickBackupFolder}
        onCancel={() => setApplyPromptOpen(false)}
        onConfirm={executeApplyAfterPrompt}
      />

      <ExecutionLogModal
        open={logModalOpen}
        execution={liveExecution}
        onClose={() => {
          if (!runningAction) setLogModalOpen(false);
        }}
      />
    </div>
  );
}
