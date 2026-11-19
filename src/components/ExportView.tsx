import {
  Check,
  Copy,
  Download,
  FolderOpen,
  HardDriveDownload,
  Play,
  ShieldCheck,
} from 'lucide-react';
import { useState } from 'react';
import { TWEAKS_CATALOG } from '../data/tweaks';
import { ExportFileKey, OptimizerState } from '../types/optimizer';
import {
  downloadSingleFile,
  getGeneratedFiles,
} from '../utils/scriptGenerator';

interface ExportViewProps {
  state: OptimizerState;
  onToggleRestorePoint: () => void;
  onToggleFullPcBackup: () => void;
  onChangeBackupDestination: (path: string) => void;
  onPickBackupFolder: () => void;
  onApplyDirect: () => void;
  runningAction: 'restore' | 'apply' | null;
  isDesktopNative: boolean;
}

const FILE_TABS: { key: ExportFileKey; label: string }[] = [
  { key: 'ps1', label: 'otimizar_win_cs2.ps1' },
  { key: 'backup', label: 'fazer_backup_pc.ps1' },
  { key: 'autoexec', label: 'autoexec.cfg' },
  { key: 'revert', label: 'reverter_padroes.ps1' },
  { key: 'readme', label: 'LEIA-ME.txt' },
];

export function ExportView({
  state,
  onToggleRestorePoint,
  onToggleFullPcBackup,
  onChangeBackupDestination,
  onPickBackupFolder,
  onApplyDirect,
  runningAction,
  isDesktopNative,
}: ExportViewProps) {
  const [activeTab, setActiveTab] = useState<ExportFileKey>('ps1');
  const [copiedFile, setCopiedFile] = useState(false);

  const files = getGeneratedFiles(state);
  const currentFile = files[activeTab];
  const lines = currentFile.content.split('\n');
  const activeCount = TWEAKS_CATALOG.filter(
    (t) => state.enabledTweaks[t.id]
  ).length;

  const handleCopyCurrent = async () => {
    await navigator.clipboard.writeText(currentFile.content);
    setCopiedFile(true);
    setTimeout(() => setCopiedFile(false), 1800);
  };

  return (
    <div className="space-y-8">
      {/* Header & Single Direct Apply CTA */}
      <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <h2 className="font-display text-2xl font-bold tracking-tight text-[var(--wp-text)]">
            Auditoria de Scripts e Reversão
          </h2>
          <p className="text-sm text-[var(--wp-text-muted)] leading-relaxed">
            Inspecione exatamente os comandos e arquivos gerados para os{' '}
            <span className="font-mono text-[var(--wp-text)] tabular-nums">{activeCount}</span>{' '}
            ajustes ativos ou aplique todas as configurações diretamente com log em tempo real.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onApplyDirect}
            disabled={runningAction !== null}
            className="wp-btn-accent inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap disabled:opacity-60"
          >
            <Play className="h-4 w-4" aria-hidden="true" />
            <span>
              {runningAction === 'apply'
                ? 'Aplicando...'
                : 'Aplicar Configurações Diretamente'}
            </span>
          </button>
        </div>
      </section>

      {/* Backup & Safety Options */}
      <section className="bg-[var(--wp-surface)] wp-glass border border-[var(--wp-border)] rounded-lg divide-y divide-[var(--wp-border)]">
        <div className="p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <HardDriveDownload
                className="h-5 w-5 text-[var(--wp-accent-text)] shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <div className="space-y-0.5">
                <div className="text-sm font-semibold text-[var(--wp-text)]">
                  Backup Completo do PC Atual antes de aplicar
                </div>
                <div className="text-xs text-[var(--wp-text-muted)] leading-relaxed">
                  Exporta chaves do Registro (<span className="font-mono text-[var(--wp-text-secondary)]">.reg</span>), Plano de Energia ativo (<span className="font-mono text-[var(--wp-text-secondary)]">.pow</span>) e <span className="font-mono text-[var(--wp-text-secondary)]">autoexec.cfg</span> anterior antes das alterações.
                </div>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={state.fullPcBackup}
              aria-label="Fazer Backup Completo do PC Atual"
              onClick={onToggleFullPcBackup}
              className="group inline-flex items-center gap-2.5 shrink-0 self-start sm:self-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wp-accent)] rounded-lg px-1 py-1"
            >
              <span className="text-xs font-medium text-[var(--wp-text-secondary)]">
                {state.fullPcBackup ? 'Ativado' : 'Desativado'}
              </span>
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

          <div className="p-3.5 rounded-lg bg-[var(--wp-surface-alt)] border border-[var(--wp-border)] flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1 min-w-0 space-y-1">
              <label
                htmlFor="backup-dest-export"
                className="block text-xs font-medium text-[var(--wp-text-secondary)]"
              >
                Pasta de destino do Backup Completo
              </label>
              <input
                id="backup-dest-export"
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

        <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-[#22C55E] shrink-0 mt-0.5" aria-hidden="true" />
            <div className="space-y-0.5">
              <div className="text-sm font-semibold text-[var(--wp-text)]">
                Criar Ponto de Restauração do Windows
              </div>
              <div className="text-xs text-[var(--wp-text-muted)]">
                Cria o ponto <span className="font-mono text-[var(--wp-text-secondary)]">WinPulse-CS2-Backup</span> via <span className="font-mono text-[var(--wp-text-secondary)]">Checkpoint-Computer</span> antes das otimizações.
              </div>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={state.createRestorePoint}
            aria-label="Incluir Ponto de Restauração"
            onClick={onToggleRestorePoint}
            className="group inline-flex items-center gap-2.5 shrink-0 self-start sm:self-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wp-accent)] rounded-lg px-1 py-1"
          >
            <span className="text-xs font-medium text-[var(--wp-text-secondary)]">
              {state.createRestorePoint ? 'Incluído' : 'Omitido'}
            </span>
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
      </section>

      {/* File Inspector */}
      <section className="bg-[var(--wp-surface)] wp-glass border border-[var(--wp-border)] rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--wp-border)] bg-[var(--wp-surface-alt)] flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          <div
            role="tablist"
            aria-label="Arquivos auditáveis"
            className="flex items-center gap-1 overflow-x-auto pb-1 xl:pb-0"
          >
            {FILE_TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-3 py-1.5 rounded-md font-mono text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-[var(--wp-surface-active)] text-[var(--wp-text)]'
                      : 'text-[var(--wp-text-muted)] hover:text-[var(--wp-text)] hover:bg-[var(--wp-surface-hover)]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-[var(--wp-text-subtle)] font-mono tabular-nums mr-2 hidden sm:inline">
              {currentFile.language} · {lines.length} linhas
            </span>
            <button
              type="button"
              onClick={handleCopyCurrent}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-[var(--wp-border)] bg-[var(--wp-surface)] hover:bg-[var(--wp-surface-hover)] text-[var(--wp-text-secondary)] transition-colors whitespace-nowrap"
            >
              {copiedFile ? (
                <>
                  <Check className="h-3.5 w-3.5 text-[#22C55E]" aria-hidden="true" />
                  <span>Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-[var(--wp-text-muted)]" aria-hidden="true" />
                  <span>Copiar</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() =>
                downloadSingleFile(currentFile.filename, currentFile.content)
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-[var(--wp-border)] bg-[var(--wp-surface-active)] hover:bg-[var(--wp-surface-hover)] text-[var(--wp-text)] transition-colors whitespace-nowrap"
            >
              <Download className="h-3.5 w-3.5 text-[var(--wp-accent-text)]" aria-hidden="true" />
              <span>Baixar Arquivo</span>
            </button>
          </div>
        </div>

        <div className="max-h-[460px] overflow-auto bg-[var(--wp-code-bg)] p-4 font-mono text-xs leading-6">
          <table className="w-full border-collapse">
            <tbody>
              {lines.map((line, idx) => (
                <tr key={idx} className="hover:bg-[var(--wp-surface-hover)]">
                  <td className="select-none pr-4 text-right text-[var(--wp-text-subtle)] tabular-nums w-10 align-top">
                    {idx + 1}
                  </td>
                  <td className="text-[var(--wp-text-secondary)] whitespace-pre">{line || ' '}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 3-Step Transparency Summary */}
      <section className="space-y-3">
        <h3 className="font-display text-lg font-semibold text-[var(--wp-text)]">
          Como funciona a aplicação direta
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 bg-[var(--wp-surface)] wp-glass border border-[var(--wp-border)] rounded-lg divide-y md:divide-y-0 md:divide-x divide-[var(--wp-border)]">
          <div className="p-5 space-y-1.5">
            <div className="font-mono text-xs text-[var(--wp-accent-text)]">01. Segurança Primeiro</div>
            <div className="text-sm font-semibold text-[var(--wp-text)]">
              Backup na pasta escolhida
            </div>
            <p className="text-xs text-[var(--wp-text-muted)] leading-relaxed">
              Antes de mexer no sistema, salva Registro (<span className="font-mono text-[var(--wp-text-secondary)]">.reg</span>), Plano de Energia (<span className="font-mono text-[var(--wp-text-secondary)]">.pow</span>) e <span className="font-mono text-[var(--wp-text-secondary)]">autoexec.cfg</span> no destino que você selecionar.
            </p>
          </div>

          <div className="p-5 space-y-1.5">
            <div className="font-mono text-xs text-[var(--wp-accent-text)]">02. Log em Tempo Real</div>
            <div className="text-sm font-semibold text-[var(--wp-text)]">
              Acompanhamento linha a linha
            </div>
            <p className="text-xs text-[var(--wp-text-muted)] leading-relaxed">
              Ao clicar em Aplicar Configurações Diretamente, a tela de log mostra cada etapa concluída e só grava arquivo de log se você clicar em Salvar Log.
            </p>
          </div>

          <div className="p-5 space-y-1.5">
            <div className="font-mono text-xs text-[var(--wp-accent-text)]">03. Controle Total</div>
            <div className="text-sm font-semibold text-[var(--wp-text)]">
              Reversão a qualquer momento
            </div>
            <p className="text-xs text-[var(--wp-text-muted)] leading-relaxed">
              Você pode restaurar o Ponto de Restauração do Windows ou usar o script <span className="font-mono text-[var(--wp-text-secondary)]">reverter_padroes.ps1</span> para desfazer os ajustes.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
