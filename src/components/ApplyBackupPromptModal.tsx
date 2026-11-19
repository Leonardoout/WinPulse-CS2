import {
  Check,
  FolderOpen,
  HardDriveDownload,
  History,
  Play,
  ShieldOff,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface ApplyBackupPromptModalProps {
  open: boolean;
  initialBackupEnabled: boolean;
  initialRestorePointEnabled: boolean;
  initialDestination: string;
  destinationConfiguredInModules: boolean;
  isDesktopNative: boolean;
  onPickFolder: (currentPath: string) => Promise<string | null>;
  onCancel: () => void;
  onConfirm: (
    wantBackup: boolean,
    destination: string,
    wantRestorePoint: boolean
  ) => void;
}

export function ApplyBackupPromptModal({
  open,
  initialBackupEnabled,
  initialRestorePointEnabled,
  initialDestination,
  destinationConfiguredInModules,
  isDesktopNative,
  onPickFolder,
  onCancel,
  onConfirm,
}: ApplyBackupPromptModalProps) {
  const [wantBackup, setWantBackup] = useState(initialBackupEnabled);
  const [wantRestorePoint, setWantRestorePoint] = useState(
    initialRestorePointEnabled
  );
  const [destination, setDestination] = useState(initialDestination);
  const [showDestinationEditor, setShowDestinationEditor] = useState(
    !destinationConfiguredInModules
  );

  useEffect(() => {
    if (open) {
      setWantBackup(initialBackupEnabled);
      setWantRestorePoint(initialRestorePointEnabled);
      setDestination(initialDestination);
      setShowDestinationEditor(!destinationConfiguredInModules);
    }
  }, [
    open,
    initialBackupEnabled,
    initialRestorePointEnabled,
    initialDestination,
    destinationConfiguredInModules,
  ]);

  if (!open) return null;

  const handleBrowse = async () => {
    const picked = await onPickFolder(destination);
    if (picked) {
      setDestination(picked);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="apply-backup-prompt-title"
    >
      <div className="w-full max-w-lg rounded-xl bg-[var(--wp-surface)] wp-glass border border-[var(--wp-border-strong)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[var(--wp-border)] bg-[var(--wp-surface-alt)] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-lg border shrink-0"
              style={{
                backgroundColor: 'var(--wp-accent-soft)',
                borderColor: 'var(--wp-accent-border)',
                color: 'var(--wp-accent-text)',
              }}
            >
              <HardDriveDownload className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h3
                id="apply-backup-prompt-title"
                className="font-display text-base font-semibold text-[var(--wp-text)] truncate"
              >
                Segurança antes de aplicar
              </h3>
              <p className="text-xs text-[var(--wp-text-muted)]">
                Confirme o backup e o ponto de restauração antes de continuar
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            aria-label="Fechar confirmação"
            className="p-2 rounded-lg text-[var(--wp-text-muted)] hover:text-[var(--wp-text)] hover:bg-[var(--wp-surface-hover)] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5 overflow-y-auto">
          {/* 1. Full PC Backup */}
          <div className="space-y-2.5">
            <div className="text-sm font-medium text-[var(--wp-text)]">
              1. Deseja fazer o Backup Completo do seu PC atual antes de aplicar?
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setWantBackup(true)}
                className={`text-left p-3.5 rounded-lg border transition-colors flex flex-col gap-1.5 ${
                  wantBackup
                    ? ''
                    : 'bg-[var(--wp-surface-alt)] border-[var(--wp-border)] hover:bg-[var(--wp-surface-hover)]'
                }`}
                style={
                  wantBackup
                    ? {
                        backgroundColor: 'var(--wp-accent-soft)',
                        borderColor: 'var(--wp-accent)',
                      }
                    : undefined
                }
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[var(--wp-text)]">
                    Sim, fazer backup
                  </span>
                  {wantBackup && (
                    <Check
                      className="h-3.5 w-3.5 text-[var(--wp-accent-text)] shrink-0"
                      aria-hidden="true"
                    />
                  )}
                </div>
                <span className="text-[11px] text-[var(--wp-text-muted)] leading-relaxed">
                  Salva Registro (.reg), Plano de Energia (.pow) e autoexec.cfg anterior.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setWantBackup(false)}
                className={`text-left p-3.5 rounded-lg border transition-colors flex flex-col gap-1.5 ${
                  !wantBackup
                    ? ''
                    : 'bg-[var(--wp-surface-alt)] border-[var(--wp-border)] hover:bg-[var(--wp-surface-hover)]'
                }`}
                style={
                  !wantBackup
                    ? {
                        backgroundColor: 'var(--wp-accent-soft)',
                        borderColor: 'var(--wp-accent)',
                      }
                    : undefined
                }
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[var(--wp-text)]">
                    Não fazer backup
                  </span>
                  {!wantBackup && (
                    <ShieldOff
                      className="h-3.5 w-3.5 text-[var(--wp-accent-text)] shrink-0"
                      aria-hidden="true"
                    />
                  )}
                </div>
                <span className="text-[11px] text-[var(--wp-text-muted)] leading-relaxed">
                  Pula a cópia de arquivos e registro antes da aplicação.
                </span>
              </button>
            </div>
          </div>

          {wantBackup && (
            <div className="p-4 rounded-lg bg-[var(--wp-surface-alt)] border border-[var(--wp-border)] space-y-2.5">
              {showDestinationEditor ? (
                <>
                  <label
                    htmlFor="prompt-backup-dest"
                    className="block text-xs font-semibold text-[var(--wp-text)]"
                  >
                    Onde deseja salvar o Backup Completo?
                  </label>
                  <input
                    id="prompt-backup-dest"
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="Padrão: Área de Trabalho (Desktop)"
                    className="w-full px-3 py-2 rounded-md bg-[var(--wp-input-bg)] border border-[var(--wp-border)] font-mono text-xs text-[var(--wp-text)] placeholder:text-[var(--wp-text-subtle)] focus:outline-none focus:border-[var(--wp-accent)]"
                  />
                  <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    {isDesktopNative && (
                      <button
                        type="button"
                        onClick={handleBrowse}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium border border-[var(--wp-border-strong)] bg-[var(--wp-surface-active)] hover:bg-[var(--wp-surface-hover)] text-[var(--wp-text)] transition-colors"
                      >
                        <FolderOpen
                          className="h-3.5 w-3.5 text-[var(--wp-accent-text)]"
                          aria-hidden="true"
                        />
                        <span>Escolher Pasta...</span>
                      </button>
                    )}
                    {destination.trim() !== '' && (
                      <button
                        type="button"
                        onClick={() => setDestination('')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-[var(--wp-border)] bg-[var(--wp-surface)] hover:bg-[var(--wp-surface-hover)] text-[var(--wp-text-muted)] hover:text-[var(--wp-text)] transition-colors"
                      >
                        <span>Usar Área de Trabalho (Padrão)</span>
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 space-y-0.5">
                    <div className="text-xs font-medium text-[var(--wp-text-muted)]">
                      Pasta configurada nos módulos de backup:
                    </div>
                    <div className="font-mono text-xs text-[var(--wp-accent-text)] truncate">
                      {destination.trim() || 'Área de Trabalho (Padrão)'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDestinationEditor(true)}
                    className="px-2.5 py-1.5 rounded-md text-xs font-medium border border-[var(--wp-border)] bg-[var(--wp-surface)] hover:bg-[var(--wp-surface-hover)] text-[var(--wp-text-secondary)] shrink-0"
                  >
                    Alterar
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 2. Windows Restore Point */}
          <div className="pt-2 border-t border-[var(--wp-border)] space-y-2.5">
            <div className="flex items-center gap-2 text-sm font-medium text-[var(--wp-text)]">
              <History
                className="h-4 w-4 text-[var(--wp-accent-text)] shrink-0"
                aria-hidden="true"
              />
              <span>
                2. Deseja criar um Ponto de Restauração do Windows?
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setWantRestorePoint(true)}
                className={`text-left p-3.5 rounded-lg border transition-colors flex flex-col gap-1.5 ${
                  wantRestorePoint
                    ? ''
                    : 'bg-[var(--wp-surface-alt)] border-[var(--wp-border)] hover:bg-[var(--wp-surface-hover)]'
                }`}
                style={
                  wantRestorePoint
                    ? {
                        backgroundColor: 'var(--wp-accent-soft)',
                        borderColor: 'var(--wp-accent)',
                      }
                    : undefined
                }
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[var(--wp-text)]">
                    Sim, criar ponto
                  </span>
                  {wantRestorePoint && (
                    <Check
                      className="h-3.5 w-3.5 text-[var(--wp-accent-text)] shrink-0"
                      aria-hidden="true"
                    />
                  )}
                </div>
                <span className="text-[11px] text-[var(--wp-text-muted)] leading-relaxed">
                  Executa Checkpoint-Computer para reverter o sistema pelo Windows.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setWantRestorePoint(false)}
                className={`text-left p-3.5 rounded-lg border transition-colors flex flex-col gap-1.5 ${
                  !wantRestorePoint
                    ? ''
                    : 'bg-[var(--wp-surface-alt)] border-[var(--wp-border)] hover:bg-[var(--wp-surface-hover)]'
                }`}
                style={
                  !wantRestorePoint
                    ? {
                        backgroundColor: 'var(--wp-accent-soft)',
                        borderColor: 'var(--wp-accent)',
                      }
                    : undefined
                }
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[var(--wp-text)]">
                    Não criar ponto
                  </span>
                  {!wantRestorePoint && (
                    <ShieldOff
                      className="h-3.5 w-3.5 text-[var(--wp-accent-text)] shrink-0"
                      aria-hidden="true"
                    />
                  )}
                </div>
                <span className="text-[11px] text-[var(--wp-text-muted)] leading-relaxed">
                  Aplica mais rápido sem gerar ponto de restauração agora.
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[var(--wp-border)] bg-[var(--wp-surface-alt)] flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-[var(--wp-border)] bg-[var(--wp-surface)] hover:bg-[var(--wp-surface-hover)] text-[var(--wp-text-secondary)] transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() =>
              onConfirm(
                wantBackup,
                wantBackup ? destination.trim() : destination,
                wantRestorePoint
              )
            }
            className="wp-btn-accent inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            <Play className="h-4 w-4" aria-hidden="true" />
            <span>Confirmar e Aplicar</span>
          </button>
        </div>
      </div>
    </div>
  );
}
