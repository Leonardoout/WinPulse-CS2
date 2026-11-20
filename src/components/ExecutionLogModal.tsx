import {
  CheckCircle2,
  Loader2,
  Save,
  Terminal,
  X,
  XCircle,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { LiveExecutionSnapshot, saveExecutionLog } from '../utils/rustBridge';

interface ExecutionLogModalProps {
  open: boolean;
  execution: LiveExecutionSnapshot | null;
  onClose: () => void;
}

function getLineStyle(line: string): string {
  if (line.startsWith('[OK]') || line.startsWith('[CONCLUIDO]')) {
    return 'text-[#16A34A] dark:text-[#4ADE80]';
  }
  if (line.startsWith('[ERRO]')) {
    return 'text-[#DC2626] dark:text-[#F87171]';
  }
  if (line.startsWith('[AVISO]') || line.startsWith('[PRÉVIA WEB]')) {
    return 'text-[#D97706] dark:text-[#FBBF24]';
  }
  if (line.startsWith('[ETAPA]') || line.startsWith('[INICIO]')) {
    return 'text-[var(--wp-accent-text)]';
  }
  return 'text-[var(--wp-text-secondary)]';
}

export function ExecutionLogModal({
  open,
  execution,
  onClose,
}: ExecutionLogModalProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setSavedNotice(null);
    }
  }, [open, execution?.actionType]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [execution?.logs.length]);

  if (!open || !execution) return null;

  const { running, actionType, logs, report } = execution;
  const title = running
    ? actionType === 'restore'
      ? 'Criando Ponto de Restauração e Backup...'
      : actionType === 'temp'
        ? 'Executando Limpeza de Temporários...'
        : 'Aplicando Configurações Diretamente...'
    : report?.ok
      ? actionType === 'restore'
        ? 'Backup e Ponto de Restauração Concluídos'
        : actionType === 'temp'
          ? 'Limpeza de Temporários Concluída'
          : 'Otimizações Aplicadas'
      : 'Execução Finalizada com Avisos';

  const handleSaveLog = async () => {
    if (saving || logs.length === 0) return;
    setSaving(true);
    try {
      const res = await saveExecutionLog(logs, report?.summary);
      if (res.saved) {
        setSavedNotice(
          res.path ? `Log salvo em: ${res.path}` : 'Log salvo com sucesso.'
        );
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="execution-log-title"
    >
      <div className="w-full max-w-3xl rounded-xl bg-[var(--wp-surface)] wp-glass border border-[var(--wp-border-strong)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[var(--wp-border)] bg-[var(--wp-surface-alt)] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--wp-surface)] border border-[var(--wp-border)] shrink-0">
              {running ? (
                <Loader2 className="h-4 w-4 text-[var(--wp-accent-text)] animate-spin" aria-hidden="true" />
              ) : report?.ok ? (
                <CheckCircle2 className="h-4 w-4 text-[#22C55E]" aria-hidden="true" />
              ) : (
                <XCircle className="h-4 w-4 text-[#EF4444]" aria-hidden="true" />
              )}
            </span>
            <div className="min-w-0">
              <h3
                id="execution-log-title"
                className="font-display text-base font-semibold text-[var(--wp-text)] truncate"
              >
                {title}
              </h3>
              <p className="text-xs text-[var(--wp-text-muted)]">
                Acompanhamento em tempo real das operações no sistema
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={running}
            aria-label="Fechar janela de log"
            className="p-2 rounded-lg text-[var(--wp-text-muted)] hover:text-[var(--wp-text)] hover:bg-[var(--wp-surface-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Status summary bar */}
        <div className="px-5 py-3 border-b border-[var(--wp-border)] bg-[var(--wp-surface-alt)] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-[var(--wp-text-secondary)]">
            <Terminal className="h-3.5 w-3.5 text-[var(--wp-accent-text)]" aria-hidden="true" />
            <span>
              {running
                ? 'Executando etapas no Windows...'
                : report?.summary ?? 'Pronto.'}
            </span>
          </div>
          <span className="font-mono tabular-nums text-[var(--wp-text-muted)]">
            {logs.length} {logs.length === 1 ? 'registro' : 'registros'}
          </span>
        </div>

        {/* Live Log Viewport */}
        <div
          ref={scrollRef}
          className="flex-1 min-h-[260px] max-h-[420px] overflow-y-auto bg-[var(--wp-code-bg)] p-4 font-mono text-xs leading-6 space-y-1"
        >
          {logs.length === 0 ? (
            <div className="text-[var(--wp-text-subtle)]">Aguardando início da execução...</div>
          ) : (
            logs.map((line, index) => (
              <div
                key={index}
                className={`whitespace-pre-wrap break-words ${getLineStyle(line)}`}
              >
                {line}
              </div>
            ))
          )}
        </div>

        {/* Completion Details (Backup Path / Reboot / Saved Log Notice) */}
        {(report?.backupPath || report?.requiresReboot || savedNotice) && (
          <div className="px-5 py-3 border-t border-[var(--wp-border)] bg-[var(--wp-surface-alt)] space-y-1.5 text-xs">
            {report?.backupPath && (
              <div className="font-mono text-[var(--wp-accent-text)] break-all">
                Pasta do backup: {report.backupPath}
              </div>
            )}
            {report?.requiresReboot && (
              <div className="text-[#D97706] dark:text-[#F59E0B]">
                Reinicie o PC para concluir alterações de GPU, prioridade ou rede (HAGS, Nagle, PriorityControl).
              </div>
            )}
            {savedNotice && (
              <div className="text-[#16A34A] dark:text-[#4ADE80] font-mono break-all">
                {savedNotice}
              </div>
            )}
          </div>
        )}

        {/* Footer: Optional Save Log + Close */}
        <div className="px-5 py-4 border-t border-[var(--wp-border)] bg-[var(--wp-surface-alt)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs text-[var(--wp-text-muted)]">
            O log fica apenas na tela — só é salvo se você clicar em <span className="text-[var(--wp-text)] font-medium">Salvar Log</span>.
          </p>

          <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
            <button
              type="button"
              onClick={handleSaveLog}
              disabled={running || saving || logs.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-[var(--wp-border-strong)] bg-[var(--wp-surface-active)] hover:bg-[var(--wp-surface-hover)] text-[var(--wp-text)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
            >
              <Save className="h-4 w-4 text-[var(--wp-accent-text)]" aria-hidden="true" />
              <span>{saving ? 'Salvando...' : 'Salvar Log (.txt)'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={running}
              className="wp-btn-accent inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
            >
              <span>{running ? 'Aguarde...' : 'Fechar'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
