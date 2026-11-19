import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { useState } from 'react';
import { RiskLevel, TweakItem } from '../types/optimizer';

interface TweakRowProps {
  tweak: TweakItem;
  enabled: boolean;
  onToggle: (id: string) => void;
}

const RISK_META: Record<
  RiskLevel,
  { label: string; textColor: string; Icon: typeof ShieldCheck }
> = {
  seguro: {
    label: 'Seguro',
    textColor: 'text-[#16A34A] dark:text-[#22C55E]',
    Icon: ShieldCheck,
  },
  moderado: {
    label: 'Moderado',
    textColor: 'text-[#D97706] dark:text-[#F59E0B]',
    Icon: AlertTriangle,
  },
  avancado: {
    label: 'Avançado',
    textColor: 'text-[#DC2626] dark:text-[#EF4444]',
    Icon: ShieldAlert,
  },
};

export function TweakRow({ tweak, enabled, onToggle }: TweakRowProps) {
  const [expanded, setExpanded] = useState(false);
  const risk = RISK_META[tweak.risk];
  const RiskIcon = risk.Icon;

  return (
    <div className="px-5 py-4 transition-colors duration-150 hover:bg-[var(--wp-surface-hover)]">
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <h3 className="text-sm font-semibold text-[var(--wp-text)]">
              {tweak.title}
            </h3>
          </div>

          <p className="text-sm text-[var(--wp-text-muted)] leading-relaxed max-w-3xl">
            {tweak.description}
          </p>

          {/* Zero-pill unboxed metadata line */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 pt-0.5 text-xs text-[var(--wp-text-subtle)]">
            <span className={`inline-flex items-center gap-1 font-medium ${risk.textColor}`}>
              <RiskIcon className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{risk.label}</span>
            </span>
            <span aria-hidden="true">·</span>
            <span className="text-[var(--wp-text-muted)]">{tweak.frametimeBenefit}</span>
            {tweak.requiresReboot && (
              <>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1 text-[var(--wp-text-secondary)]">
                  <RotateCcw className="h-3 w-3" aria-hidden="true" />
                  <span>Requer reinício</span>
                </span>
              </>
            )}
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => setExpanded((prev) => !prev)}
              className="inline-flex items-center gap-1 text-[var(--wp-accent-text)] hover:underline transition-colors focus-visible:outline-none focus-visible:underline"
            >
              <span>{expanded ? 'Ocultar comando' : 'Ver comando PowerShell'}</span>
              {expanded ? (
                <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Native Windows 11 style toggle switch with 44px touch area */}
        <div className="shrink-0 flex items-center pt-0.5">
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            aria-label={`Alternar ${tweak.title}`}
            onClick={() => onToggle(tweak.id)}
            className="group inline-flex items-center justify-center min-w-[48px] min-h-[40px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wp-accent)] rounded-lg"
          >
            <span
              className="relative inline-flex h-6 w-11 items-center rounded-full border transition-colors duration-150"
              style={{
                backgroundColor: enabled ? 'var(--wp-accent)' : 'var(--wp-switch-off)',
                borderColor: enabled ? 'var(--wp-accent)' : 'var(--wp-border-strong)',
              }}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-150 ${
                  enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </span>
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-[var(--wp-border)] space-y-2">
          <div className="text-xs font-medium text-[var(--wp-text-muted)]">
            Comando incluído no PowerShell:
          </div>
          <pre className="p-3 rounded-md bg-[var(--wp-code-bg)] border border-[var(--wp-border)] text-xs font-mono text-[var(--wp-text-secondary)] overflow-x-auto whitespace-pre-wrap break-all">
            {tweak.applyScript}
          </pre>
          {tweak.revertScript && (
            <div className="text-xs text-[var(--wp-text-subtle)]">
              Reversão automática incluída em{' '}
              <span className="font-mono text-[var(--wp-text-muted)]">reverter_padroes.ps1</span>.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
