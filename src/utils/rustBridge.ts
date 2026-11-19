import { TWEAKS_CATALOG } from '../data/tweaks';
import { OptimizerState } from '../types/optimizer';
import { buildAutoexecCfg, downloadSingleFile } from './scriptGenerator';

export interface ActionReport {
  ok: boolean;
  summary: string;
  backupPath?: string | null;
  freedMb: number;
  requiresReboot: boolean;
  logs: string[];
  mode: 'desktop-native' | 'web-preview';
}

export interface LiveExecutionSnapshot {
  running: boolean;
  actionType: 'restore' | 'apply';
  logs: string[];
  report: ActionReport | null;
}

interface BackendExecutionSnapshot {
  running: boolean;
  actionType: string;
  logs: string[];
  report: Omit<ActionReport, 'mode'> | null;
}

export function isRunningInDesktopApp(): boolean {
  return typeof window !== 'undefined' && Boolean(window.__TAURI_INTERNALS__?.invoke);
}

export async function pickBackupFolder(currentPath?: string): Promise<string | null> {
  if (isRunningInDesktopApp()) {
    const selected = await window.__TAURI_INTERNALS__!.invoke<string | null>(
      'pick_backup_folder_cmd',
      { initialDir: currentPath?.trim() || null }
    );
    return selected;
  }

  return null;
}

export async function saveExecutionLog(
  logs: string[],
  summary?: string
): Promise<{ saved: boolean; path?: string }> {
  const now = new Date();
  const stamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const defaultName = `WinPulse-Log-${stamp}.txt`;

  const lines = [
    '============================================================',
    'WinPulse CS2 - Log de Execução',
    `Data/Hora: ${now.toLocaleString('pt-BR')}`,
    ...(summary ? [`Resumo: ${summary}`] : []),
    '============================================================',
    '',
    ...logs,
    '',
  ];
  const content = lines.join('\r\n');

  if (isRunningInDesktopApp()) {
    const savedPath = await window.__TAURI_INTERNALS__!.invoke<string | null>(
      'save_log_file_cmd',
      { content, defaultName }
    );
    if (!savedPath) {
      return { saved: false };
    }
    return { saved: true, path: savedPath };
  }

  downloadSingleFile(defaultName, '\uFEFF' + content);
  return { saved: true, path: defaultName };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function pollNativeExecution(
  actionType: 'restore' | 'apply',
  onUpdate: (snapshot: LiveExecutionSnapshot) => void
): Promise<ActionReport> {
  while (true) {
    const snap = await window.__TAURI_INTERNALS__!.invoke<BackendExecutionSnapshot>(
      'get_execution_status_cmd'
    );

    const report: ActionReport | null = snap.report
      ? { ...snap.report, mode: 'desktop-native' }
      : null;

    onUpdate({
      running: snap.running,
      actionType,
      logs: snap.logs,
      report,
    });

    if (!snap.running && report) {
      return report;
    }

    await delay(140);
  }
}

export async function executeRestorePointLive(
  includeFullBackup: boolean,
  backupDestination: string,
  onUpdate: (snapshot: LiveExecutionSnapshot) => void
): Promise<ActionReport> {
  if (isRunningInDesktopApp()) {
    onUpdate({
      running: true,
      actionType: 'restore',
      logs: ['[INICIO] Iniciando operação no Windows...'],
      report: null,
    });

    await window.__TAURI_INTERNALS__!.invoke('start_restore_point_cmd', {
      includeFullBackup,
      backupDestination: backupDestination.trim() || null,
    });

    return pollNativeExecution('restore', onUpdate);
  }

  // Prévia interativa no navegador (não altera o PC nem baixa arquivos automaticamente)
  const destLabel = backupDestination.trim() || '%USERPROFILE%\\Desktop';
  const previewSteps = [
    '[PRÉVIA WEB] Executando simulação das etapas (no .EXE do Windows estes comandos rodam direto no sistema).',
    '[ETAPA] Verificando permissão de Administrador (UAC)...',
    '[ETAPA] Criando Ponto de Restauração: Checkpoint-Computer -Description "WinPulse-CS2-Backup"',
    ...(includeFullBackup
      ? [
          `[ETAPA] Criando pasta de backup em: ${destLabel}\\WinPulse_Backup_...`,
          '[ETAPA] Exportando plano de energia ativo (powercfg /export plano_energia_atual.pow)...',
          '[ETAPA] Exportando 12 chaves do Registro do Windows (.reg)...',
          '[ETAPA] Copiando autoexec.cfg atual da Steam (se existir)...',
          `[OK] Backup completo seria salvo em: ${destLabel}`,
        ]
      : ['[OK] Ponto de Restauração WinPulse-CS2-Backup pronto.']),
  ];

  const logs: string[] = [];
  for (const step of previewSteps) {
    logs.push(step);
    onUpdate({
      running: true,
      actionType: 'restore',
      logs: [...logs],
      report: null,
    });
    await delay(180);
  }

  const report: ActionReport = {
    ok: true,
    summary: includeFullBackup
      ? `Prévia concluída. No aplicativo .EXE o backup completo será gravado em "${destLabel}".`
      : 'Prévia concluída. No aplicativo .EXE o Ponto de Restauração será criado diretamente.',
    backupPath: includeFullBackup ? destLabel : null,
    freedMb: 0,
    requiresReboot: false,
    logs,
    mode: 'web-preview',
  };

  onUpdate({
    running: false,
    actionType: 'restore',
    logs,
    report,
  });

  return report;
}

export async function executeApplyDirectLive(
  state: OptimizerState,
  onUpdate: (snapshot: LiveExecutionSnapshot) => void
): Promise<ActionReport> {
  const autoexecContent = buildAutoexecCfg(state);

  if (isRunningInDesktopApp()) {
    onUpdate({
      running: true,
      actionType: 'apply',
      logs: ['[INICIO] Preparando aplicação direta das configurações no Windows...'],
      report: null,
    });

    await window.__TAURI_INTERNALS__!.invoke('start_apply_optimizations_cmd', {
      payload: {
        activeProfile: state.activeProfile,
        enabledTweaks: state.enabledTweaks,
        createRestorePoint: state.createRestorePoint,
        fullPcBackup: state.fullPcBackup,
        backupDestination: state.backupDestination.trim() || null,
        powerConfig: state.powerConfig,
        autoexecContent,
      },
    });

    return pollNativeExecution('apply', onUpdate);
  }

  // Prévia interativa no navegador
  const destLabel = state.backupDestination.trim() || '%USERPROFILE%\\Desktop';
  const enabledItems = TWEAKS_CATALOG.filter((t) => state.enabledTweaks[t.id]);
  const requiresReboot = enabledItems.some((t) => t.requiresReboot);

  const steps: string[] = [
    `[PRÉVIA WEB] Perfil selecionado: ${state.activeProfile} (${enabledItems.length} ajustes ativos).`,
  ];

  if (state.fullPcBackup) {
    steps.push(`[ETAPA] Criando Backup Completo do PC em: ${destLabel}\\WinPulse_Backup_...`);
    steps.push('[OK] Chaves .reg, plano .pow e autoexec anterior incluídos no backup.');
  }
  if (state.createRestorePoint) {
    steps.push('[ETAPA] Criando Ponto de Restauração WinPulse-CS2-Backup...');
  }
  for (const item of enabledItems) {
    steps.push(`[OK] ${item.title} -> ${item.previewCommand}`);
  }
  steps.push(
    `[OK] Plano de Energia: ${state.powerConfig.plan} (desligar tela em ${state.powerConfig.monitorTimeoutMinutes} min).`
  );
  steps.push('[OK] autoexec.cfg gerado para a pasta csgo/cfg da Steam.');
  steps.push('[CONCLUIDO] Simulação finalizada. Execute pelo WinPulse-CS2.exe para aplicar no Windows.');

  const logs: string[] = [];
  for (const step of steps) {
    logs.push(step);
    onUpdate({
      running: true,
      actionType: 'apply',
      logs: [...logs],
      report: null,
    });
    await delay(75);
  }

  const report: ActionReport = {
    ok: true,
    summary: `Prévia concluída (${enabledItems.length} ajustes prontos para aplicar no Windows).`,
    backupPath: state.fullPcBackup ? destLabel : null,
    freedMb: 0,
    requiresReboot,
    logs,
    mode: 'web-preview',
  };

  onUpdate({
    running: false,
    actionType: 'apply',
    logs,
    report,
  });

  return report;
}
