import {
  ArrowRight,
  Check,
  CheckCircle2,
  Crosshair,
  FileCode2,
  FolderOpen,
  History,
  Play,
  RotateCcw,
  ShieldCheck,
  Sliders,
  Terminal,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import { PROFILES, TWEAKS_CATALOG } from '../data/tweaks';
import { NavSection, OptimizerState, ProfileId } from '../types/optimizer';
import { ActionReport } from '../utils/rustBridge';
import { buildAutoexecCfg } from '../utils/scriptGenerator';

interface OverviewViewProps {
  state: OptimizerState;
  onSelectProfile: (profile: ProfileId) => void;
  onResetProfile: () => void;
  onSelectSafeOnly: () => void;
  onNavigate: (section: NavSection) => void;
  onToggleRestorePoint: () => void;
  onToggleFullPcBackup: () => void;
  onChangeBackupDestination: (path: string) => void;
  onPickBackupFolder: () => void;
  onCreateRestorePoint: () => void;
  onApplyDirect: () => void;
  runningAction: 'restore' | 'apply' | null;
  actionReport: ActionReport | null;
  onClearReport: () => void;
  onOpenLastLog: () => void;
  isDesktopNative: boolean;
}

const POWER_PLAN_NAMES: Record<OptimizerState['powerConfig']['plan'], string> = {
  ultimate: 'Desempenho Máximo',
  high: 'Alto Desempenho',
  balanced: 'Equilibrado',
};

export function OverviewView({
  state,
  onSelectProfile,
  onResetProfile,
  onSelectSafeOnly,
  onNavigate,
  onToggleRestorePoint,
  onToggleFullPcBackup,
  onChangeBackupDestination,
  onPickBackupFolder,
  onCreateRestorePoint,
  onApplyDirect,
  runningAction,
  actionReport,
  onClearReport,
  onOpenLastLog,
  isDesktopNative,
}: OverviewViewProps) {
  const activeTweaks = TWEAKS_CATALOG.filter((t) => state.enabledTweaks[t.id]);
  const activeTempCount = activeTweaks.filter((t) => t.category === 'temp').length;
  const activeWinCount = activeTweaks.filter(
    (t) => t.category === 'windows' || t.category === 'cs2_sys'
  ).length;
  const autoexecLines = buildAutoexecCfg(state)
    .split('\n')
    .filter((line) => line.trim() && !line.trim().startsWith('//')).length;

  const moduleRows: {
    id: NavSection;
    title: string;
    subtitle: string;
    stat: string;
    icon: typeof Trash2;
  }[] = [
    {
      id: 'temp',
      title: 'Limpeza de Arquivos Temporários',
      subtitle:
        'TEMP do usuário, Windows\\Temp, DirectX/NVIDIA/AMD Shader Cache, Windows Update e Flush DNS.',
      stat: `${activeTempCount} alvos ativos`,
      icon: Trash2,
    },
    {
      id: 'cs2',
      title: 'Counter-Strike 2 & Baixa Latência',
      subtitle:
        'Construtor de autoexec.cfg (FOV, HUD, sensibilidade, voz), inicialização Steam (-refresh) e prioridade de cs2.exe.',
      stat: `${autoexecLines} comandos CFG`,
      icon: Crosshair,
    },
    {
      id: 'power',
      title: 'Plano de Energia do Windows',
      subtitle:
        'Ativação de Desempenho Máximo (Ultimate Performance), Core Parking OFF, USB e PCIe ASPM.',
      stat: POWER_PLAN_NAMES[state.powerConfig.plan],
      icon: Zap,
    },
    {
      id: 'windows',
      title: 'Otimizações Gerais do Windows 11',
      subtitle:
        'Game Mode, HAGS, Game DVR OFF, Win32PrioritySeparation 0x26, rede sem throttling e serviços.',
      stat: `${activeWinCount} ajustes ativos`,
      icon: Sliders,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Intro + Clear Start Action Buttons */}
      <section className="space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[var(--wp-text)] [text-wrap:balance]">
              Centro de Otimização Windows 11 e Counter-Strike 2
            </h2>
            <p className="text-sm sm:text-base text-[var(--wp-text-muted)] leading-relaxed">
              Crie um Ponto de Restauração por segurança antes de começar e aplique todas as otimizações selecionadas acompanhando o log ao vivo.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onSelectSafeOnly}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium border border-[var(--wp-border)] bg-[var(--wp-surface)] wp-glass text-[var(--wp-text-secondary)] hover:bg-[var(--wp-surface-hover)] transition-colors whitespace-nowrap"
            >
              <ShieldCheck className="h-4 w-4 text-[#22C55E]" aria-hidden="true" />
              <span>Apenas Seguros</span>
            </button>
            <button
              type="button"
              onClick={onResetProfile}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium border border-[var(--wp-border)] bg-[var(--wp-surface)] wp-glass text-[var(--wp-text-secondary)] hover:bg-[var(--wp-surface-hover)] transition-colors whitespace-nowrap"
            >
              <RotateCcw className="h-4 w-4 text-[var(--wp-text-muted)]" aria-hidden="true" />
              <span>Restaurar Perfil</span>
            </button>
          </div>
        </div>

        {/* Clear Initial Action Bar: Restore Point + Direct Apply */}
        <div className="p-5 rounded-lg bg-[var(--wp-surface)] wp-glass border border-[var(--wp-border)] flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1">
            <div className="text-sm font-semibold text-[var(--wp-text)]">
              Ações Rápidas do Sistema
            </div>
            <p className="text-xs text-[var(--wp-text-muted)] leading-relaxed">
              {isDesktopNative
                ? 'Execução direta ativa com permissão de Administrador: acompanhe todas as alterações na tela de log em tempo real.'
                : 'Ao clicar em aplicar, a janela de log exibe cada etapa configurada e permite salvar o log apenas se você desejar.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onCreateRestorePoint}
              disabled={runningAction !== null}
              className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-lg text-sm font-semibold border border-[var(--wp-border-strong)] bg-[var(--wp-surface-active)] hover:bg-[var(--wp-surface-hover)] text-[var(--wp-text)] transition-colors whitespace-nowrap disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wp-accent)]"
            >
              <History className="h-4 w-4 text-[var(--wp-accent-text)]" aria-hidden="true" />
              <span>
                {runningAction === 'restore'
                  ? 'Criando Ponto...'
                  : 'Criar Ponto de Restauração'}
              </span>
            </button>

            <button
              type="button"
              onClick={onApplyDirect}
              disabled={runningAction !== null}
              className="wp-btn-accent inline-flex items-center gap-2.5 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wp-accent)]"
            >
              <Play className="h-4 w-4" aria-hidden="true" />
              <span>
                {runningAction === 'apply'
                  ? 'Aplicando...'
                  : 'Aplicar Configurações Diretamente'}
              </span>
            </button>
          </div>
        </div>

        {/* Last Action Summary Strip */}
        {actionReport && (
          <div className="p-4 sm:p-5 rounded-lg bg-[var(--wp-surface-alt)] wp-glass border border-[var(--wp-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-2.5 min-w-0">
              <CheckCircle2
                className={`h-5 w-5 shrink-0 mt-0.5 ${
                  actionReport.ok ? 'text-[#22C55E]' : 'text-[#EF4444]'
                }`}
                aria-hidden="true"
              />
              <div className="space-y-0.5 min-w-0">
                <div className="text-sm font-semibold text-[var(--wp-text)]">
                  {actionReport.summary}
                </div>
                {actionReport.backupPath && (
                  <div className="text-xs font-mono text-[var(--wp-accent-text)] break-all">
                    Backup salvo em: {actionReport.backupPath}
                  </div>
                )}
                {actionReport.requiresReboot && (
                  <div className="text-xs text-[#D97706] dark:text-[#F59E0B]">
                    Reinicie o computador para concluir ajustes de GPU/Rede (HAGS, Nagle ou PriorityControl).
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={onOpenLastLog}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-[var(--wp-border)] bg-[var(--wp-surface)] hover:bg-[var(--wp-surface-hover)] text-[var(--wp-text-secondary)] transition-colors whitespace-nowrap"
              >
                <Terminal className="h-3.5 w-3.5 text-[var(--wp-accent-text)]" aria-hidden="true" />
                <span>Ver Log</span>
              </button>
              <button
                type="button"
                onClick={onClearReport}
                aria-label="Fechar aviso"
                className="p-1.5 rounded-md text-[var(--wp-text-subtle)] hover:text-[var(--wp-text)] hover:bg-[var(--wp-surface-hover)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 4-column verifiable configuration summary strip */}
      <section
        aria-label="Resumo da configuração atual"
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 bg-[var(--wp-surface)] wp-glass border border-[var(--wp-border)] rounded-lg divide-y sm:divide-y-0 sm:divide-x divide-[var(--wp-border)]"
      >
        <div className="p-5 space-y-1">
          <div className="text-xs font-medium text-[var(--wp-text-muted)]">Ajustes Ativos</div>
          <div className="font-mono text-2xl font-semibold tabular-nums text-[var(--wp-text)]">
            {activeTweaks.length} / {TWEAKS_CATALOG.length}
          </div>
          <div className="text-xs text-[var(--wp-text-subtle)]">Selecionados para aplicar</div>
        </div>

        <div className="p-5 space-y-1">
          <div className="text-xs font-medium text-[var(--wp-text-muted)]">Alvos de Limpeza</div>
          <div className="font-mono text-2xl font-semibold tabular-nums text-[var(--wp-text)]">
            {activeTempCount}
          </div>
          <div className="text-xs text-[var(--wp-text-subtle)]">Pastas temporárias e caches</div>
        </div>

        <div className="p-5 space-y-1">
          <div className="text-xs font-medium text-[var(--wp-text-muted)]">Plano de Energia</div>
          <div className="font-display text-lg font-semibold text-[var(--wp-text)] truncate pt-0.5">
            {POWER_PLAN_NAMES[state.powerConfig.plan]}
          </div>
          <div className="text-xs text-[var(--wp-text-subtle)]">Aplicado via powercfg</div>
        </div>

        <div className="p-5 space-y-1">
          <div className="text-xs font-medium text-[var(--wp-text-muted)]">Configuração CS2</div>
          <div className="font-mono text-2xl font-semibold tabular-nums text-[var(--wp-text)]">
            {autoexecLines} linhas
          </div>
          <div className="text-xs text-[var(--wp-text-subtle)]">Prontas no autoexec.cfg</div>
        </div>
      </section>

      {/* Profile Selector */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="font-display text-lg font-semibold text-[var(--wp-text)]">
              Perfil de Otimização
            </h3>
            <p className="text-sm text-[var(--wp-text-muted)]">
              Escolha um ponto de partida compatível com seu hardware ou ajuste cada opção manualmente.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {PROFILES.map((profile) => {
            const isSelected = state.activeProfile === profile.id;
            return (
              <button
                key={profile.id}
                type="button"
                onClick={() => onSelectProfile(profile.id)}
                className={`text-left p-5 rounded-lg border wp-glass transition-colors duration-150 flex flex-col justify-between gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wp-accent)] ${
                  isSelected
                    ? ''
                    : 'bg-[var(--wp-surface)] border-[var(--wp-border)] hover:bg-[var(--wp-surface-hover)] hover:border-[var(--wp-border-strong)]'
                }`}
                style={
                  isSelected
                    ? {
                        backgroundColor: 'var(--wp-accent-soft)',
                        borderColor: 'var(--wp-accent)',
                      }
                    : undefined
                }
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="font-display text-base font-semibold text-[var(--wp-text)]">
                        {profile.title}
                      </div>
                      <div className="text-xs text-[var(--wp-accent-text)]">
                        {profile.subtitle}
                      </div>
                    </div>
                    <span
                      className="h-5 w-5 rounded-full flex items-center justify-center shrink-0 border"
                      style={
                        isSelected
                          ? {
                              backgroundColor: 'var(--wp-accent)',
                              borderColor: 'var(--wp-accent)',
                              color: 'var(--wp-accent-fg)',
                            }
                          : { borderColor: 'var(--wp-border-strong)' }
                      }
                    >
                      {isSelected && <Check className="h-3 w-3" aria-hidden="true" />}
                    </span>
                  </div>

                  <p className="text-sm text-[var(--wp-text-muted)] leading-relaxed">
                    {profile.description}
                  </p>
                </div>

                <ul className="space-y-1.5 pt-3 border-t border-[var(--wp-border)] text-xs text-[var(--wp-text-secondary)]">
                  {profile.highlights.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="text-[var(--wp-accent-text)] shrink-0" aria-hidden="true">
                        —
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>
      </section>

      {/* Modules Quick Access + Backup Destination & Safety Restore Point toggle */}
      <section className="space-y-4">
        <h3 className="font-display text-lg font-semibold text-[var(--wp-text)]">
          Módulos de Configuração e Backup
        </h3>

        <div className="bg-[var(--wp-surface)] wp-glass border border-[var(--wp-border)] rounded-lg divide-y divide-[var(--wp-border)]">
          {moduleRows.map((mod) => {
            const Icon = mod.icon;
            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => onNavigate(mod.id)}
                className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left hover:bg-[var(--wp-surface-hover)] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--wp-accent)]"
              >
                <div className="flex items-start gap-4 min-w-0">
                  <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--wp-surface-alt)] border border-[var(--wp-border)] text-[var(--wp-accent-text)] shrink-0">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <div className="text-sm font-semibold text-[var(--wp-text)]">
                      {mod.title}
                    </div>
                    <div className="text-sm text-[var(--wp-text-muted)] truncate max-w-2xl">
                      {mod.subtitle}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <span className="hidden sm:inline font-mono text-xs tabular-nums text-[var(--wp-text-muted)]">
                    {mod.stat}
                  </span>
                  <ArrowRight className="h-4 w-4 text-[var(--wp-text-subtle)]" aria-hidden="true" />
                </div>
              </button>
            );
          })}

          {/* Full PC Backup toggle + destination picker row */}
          <div className="px-5 py-4 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <div className="text-sm font-semibold text-[var(--wp-text)]">
                  Fazer Backup Completo do PC Atual antes de aplicar
                </div>
                <div className="text-sm text-[var(--wp-text-muted)]">
                  Salva chaves do Registro (<span className="font-mono text-[var(--wp-text-secondary)]">.reg</span>), Plano de Energia (<span className="font-mono text-[var(--wp-text-secondary)]">.pow</span>) e <span className="font-mono text-[var(--wp-text-secondary)]">autoexec.cfg</span> anterior antes das alterações.
                </div>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={state.fullPcBackup}
                aria-label="Fazer Backup Completo do PC Atual"
                onClick={onToggleFullPcBackup}
                className="group inline-flex items-center justify-center min-w-[48px] min-h-[40px] shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wp-accent)] rounded-lg"
              >
                <span
                  className="relative inline-flex h-6 w-11 items-center rounded-full border transition-colors duration-150"
                  style={{
                    backgroundColor: state.fullPcBackup ? 'var(--wp-accent)' : 'var(--wp-switch-off)',
                    borderColor: state.fullPcBackup ? 'var(--wp-accent)' : 'var(--wp-border-strong)',
                  }}
                >
                  <span
                    className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-150 ${
                      state.fullPcBackup ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </span>
              </button>
            </div>

            {/* Destination folder picker */}
            <div className="p-3.5 rounded-lg bg-[var(--wp-surface-alt)] border border-[var(--wp-border)] flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0 space-y-1">
                <label
                  htmlFor="backup-dest-overview"
                  className="block text-xs font-medium text-[var(--wp-text-secondary)]"
                >
                  Pasta onde o Backup Completo será salvo
                </label>
                <input
                  id="backup-dest-overview"
                  type="text"
                  value={state.backupDestination}
                  onChange={(e) => onChangeBackupDestination(e.target.value)}
                  placeholder="Padrão: Área de Trabalho (Desktop)"
                  className="w-full px-3 py-2 rounded-md bg-[var(--wp-input-bg)] border border-[var(--wp-border)] font-mono text-xs text-[var(--wp-text)] placeholder:text-[var(--wp-text-subtle)] focus:outline-none focus:border-[var(--wp-accent)]"
                />
              </div>

              <div className="flex items-center gap-2 shrink-0 sm:pt-5">
                {isDesktopNative && (
                  <button
                    type="button"
                    onClick={onPickBackupFolder}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-medium border border-[var(--wp-border-strong)] bg-[var(--wp-surface-active)] hover:bg-[var(--wp-surface-hover)] text-[var(--wp-text)] transition-colors whitespace-nowrap"
                  >
                    <FolderOpen className="h-3.5 w-3.5 text-[var(--wp-accent-text)]" aria-hidden="true" />
                    <span>Escolher Pasta...</span>
                  </button>
                )}
                {state.backupDestination.trim() !== '' && (
                  <button
                    type="button"
                    onClick={() => onChangeBackupDestination('')}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium border border-[var(--wp-border)] bg-[var(--wp-surface)] hover:bg-[var(--wp-surface-hover)] text-[var(--wp-text-muted)] hover:text-[var(--wp-text)] transition-colors whitespace-nowrap"
                  >
                    <span>Usar Padrão</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Safety toggle row */}
          <div className="px-5 py-4 flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="text-sm font-semibold text-[var(--wp-text)]">
                Incluir Ponto de Restauração do Windows ao aplicar
              </div>
              <div className="text-sm text-[var(--wp-text-muted)]">
                Executa <span className="font-mono text-[var(--wp-text-secondary)]">Checkpoint-Computer</span> automaticamente antes das modificações.
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={state.createRestorePoint}
              aria-label="Criar Ponto de Restauração"
              onClick={onToggleRestorePoint}
              className="group inline-flex items-center justify-center min-w-[48px] min-h-[40px] shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wp-accent)] rounded-lg"
            >
              <span
                className="relative inline-flex h-6 w-11 items-center rounded-full border transition-colors duration-150"
                style={{
                  backgroundColor: state.createRestorePoint ? 'var(--wp-accent)' : 'var(--wp-switch-off)',
                  borderColor: state.createRestorePoint ? 'var(--wp-accent)' : 'var(--wp-border-strong)',
                }}
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-150 ${
                    state.createRestorePoint ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Bottom CTA row for script auditing */}
      <section className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-lg bg-[var(--wp-surface)] wp-glass border border-[var(--wp-border)]">
        <div className="space-y-1">
          <div className="text-sm font-semibold text-[var(--wp-text)]">
            Auditoria de Comandos e Script de Reversão
          </div>
          <div className="text-sm text-[var(--wp-text-muted)]">
            Inspecione todas as linhas de otimização, <span className="font-mono text-[var(--wp-text-secondary)]">autoexec.cfg</span> e <span className="font-mono text-[var(--wp-text-secondary)]">reverter_padroes.ps1</span> antes de aplicar.
          </div>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('export')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-[var(--wp-border)] bg-[var(--wp-surface-active)] hover:bg-[var(--wp-surface-hover)] text-[var(--wp-text)] transition-colors whitespace-nowrap shrink-0"
        >
          <FileCode2 className="h-4 w-4 text-[var(--wp-accent-text)]" aria-hidden="true" />
          <span>Inspecionar Scripts</span>
        </button>
      </section>
    </div>
  );
}
