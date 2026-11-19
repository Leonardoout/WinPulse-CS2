import { Check, Info } from 'lucide-react';
import {
  PowerConfig,
  PowerPlanType,
  PowerSubSection,
  TweakCategory,
} from '../types/optimizer';
import { TweakListView } from './TweakListView';

interface PowerPlanViewProps {
  powerConfig: PowerConfig;
  onChangePowerConfig: (next: PowerConfig) => void;
  enabledTweaks: Record<string, boolean>;
  onToggleTweak: (id: string) => void;
  onSetCategoryEnabled: (categories: TweakCategory[], enabled: boolean) => void;
  subSection: PowerSubSection;
}

const POWER_PLANS: {
  id: PowerPlanType;
  title: string;
  guid: string;
  description: string;
  bestFor: string;
}[] = [
  {
    id: 'ultimate',
    title: 'Desempenho Máximo (Ultimate Performance)',
    guid: 'e9a42b02-d5df-448d-aa00-03f14749eb61',
    description:
      'Elimina micro-latências de transição de energia no kernel e mantém resposta máxima em CPU e barramento. Se oculto no Windows, o aplicativo duplica e ativa automaticamente.',
    bestFor: 'Ideal para desktops gamers e baixa latência no CS2',
  },
  {
    id: 'high',
    title: 'Alto Desempenho',
    guid: '8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c',
    description:
      'Plano clássico de alto clock sem economia agressiva, compatível com praticamente todos os notebooks e desktops Windows 11.',
    bestFor: 'Ideal para notebooks na tomada e sistemas mistos',
  },
  {
    id: 'balanced',
    title: 'Equilibrado (Padrão / Ryzen X3D)',
    guid: '381b4222-f694-41f0-9685-ff5bb260df2e',
    description:
      'Permite gerenciamento dinâmico de clock e CPPC. Útil em processadores AMD Ryzen Dual-CCD (7900X3D/7950X3D) ou quando se busca menor temperatura ociosa.',
    bestFor: 'Ideal para Ryzen X3D Dual-CCD e uso silencioso',
  },
];

export function PowerPlanView({
  powerConfig,
  onChangePowerConfig,
  enabledTweaks,
  onToggleTweak,
  onSetCategoryEnabled,
  subSection,
}: PowerPlanViewProps) {
  return (
    <div className="space-y-8">
      {/* Power Scheme Selector */}
      {subSection === 'schemes' && (
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <h2 className="font-display text-2xl font-bold tracking-tight text-[var(--wp-text)]">
              Plano de Energia do Sistema
            </h2>
            <p className="text-sm text-[var(--wp-text-muted)] leading-relaxed">
              Selecione o esquema principal aplicado via{' '}
              <span className="font-mono text-[var(--wp-text-secondary)]">powercfg</span> e ajuste os parâmetros finos de CPU, USB e PCIe logo abaixo.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <label
              htmlFor="monitor-timeout"
              className="text-xs font-medium text-[var(--wp-text-muted)] whitespace-nowrap"
            >
              Desligar tela na tomada:
            </label>
            <select
              id="monitor-timeout"
              value={powerConfig.monitorTimeoutMinutes}
              onChange={(e) =>
                onChangePowerConfig({
                  ...powerConfig,
                  monitorTimeoutMinutes: Number(e.target.value),
                })
              }
              className="h-9 px-3 rounded-lg bg-[var(--wp-surface)] border border-[var(--wp-border)] text-xs font-medium text-[var(--wp-text)] focus:outline-none focus:border-[var(--wp-accent)]"
            >
              <option value={0}>Nunca (0 min)</option>
              <option value={10}>10 minutos</option>
              <option value={15}>15 minutos</option>
              <option value={30}>30 minutos</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {POWER_PLANS.map((plan) => {
            const active = powerConfig.plan === plan.id;
            return (
              <button
                key={plan.id}
                type="button"
                onClick={() =>
                  onChangePowerConfig({ ...powerConfig, plan: plan.id })
                }
                className={`text-left p-5 rounded-lg border wp-glass transition-colors duration-150 flex flex-col justify-between gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wp-accent)] ${
                  active
                    ? ''
                    : 'bg-[var(--wp-surface)] border-[var(--wp-border)] hover:bg-[var(--wp-surface-hover)] hover:border-[var(--wp-border-strong)]'
                }`}
                style={
                  active
                    ? {
                        backgroundColor: 'var(--wp-accent-soft)',
                        borderColor: 'var(--wp-accent)',
                      }
                    : undefined
                }
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="font-display text-base font-semibold text-[var(--wp-text)]">
                      {plan.title}
                    </div>
                    <span
                      className="h-5 w-5 rounded-full flex items-center justify-center shrink-0 border"
                      style={
                        active
                          ? {
                              backgroundColor: 'var(--wp-accent)',
                              borderColor: 'var(--wp-accent)',
                              color: 'var(--wp-accent-fg)',
                            }
                          : { borderColor: 'var(--wp-border-strong)' }
                      }
                    >
                      {active && <Check className="h-3 w-3" aria-hidden="true" />}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--wp-text-muted)] leading-relaxed">
                    {plan.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-[var(--wp-border)] space-y-1">
                  <div className="text-xs text-[var(--wp-accent-text)]">{plan.bestFor}</div>
                  <div className="font-mono text-[11px] text-[var(--wp-text-subtle)] truncate">
                    GUID: {plan.guid}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Helpful technical note */}
        <div className="flex items-start gap-3 p-4 rounded-lg bg-[var(--wp-surface)] wp-glass border border-[var(--wp-border)] text-xs text-[var(--wp-text-muted)]">
          <Info className="h-4 w-4 text-[var(--wp-accent-text)] shrink-0 mt-0.5" aria-hidden="true" />
          <p className="leading-relaxed">
            Em hardware moderno (Intel Core 12ª–14ª gen, Core Ultra ou AMD Ryzen 7000/9000), o maior ganho de{' '}
            <span className="text-[var(--wp-text-secondary)]">frametime</span> vem de desativar a suspensão seletiva USB e o Core Parking para evitar micro-pausas no polling rate do mouse e na subida de boost.
          </p>
        </div>
      </section>
      )}

      {/* Granular Powercfg Tweaks */}
      {subSection === 'tweaks' && (
        <TweakListView
          categories={['power']}
          title="Parâmetros Avançados de Energia"
          description="Subconfigurações aplicadas diretamente no esquema ativo via powercfg -setacvalueindex."
          enabledTweaks={enabledTweaks}
          onToggleTweak={onToggleTweak}
          onSetCategoryEnabled={onSetCategoryEnabled}
        />
      )}
    </div>
  );
}
