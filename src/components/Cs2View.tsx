import { Check, Copy, Download, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  Cs2Config,
  Cs2SubSection,
  OptimizerState,
  TweakCategory,
} from '../types/optimizer';
import {
  buildAutoexecCfg,
  buildSteamLaunchOptions,
  downloadSingleFile,
} from '../utils/scriptGenerator';
import { TweakListView } from './TweakListView';

interface Cs2ViewProps {
  state: OptimizerState;
  onChangeCs2Config: (next: Cs2Config) => void;
  onToggleTweak: (id: string) => void;
  onSetCategoryEnabled: (categories: TweakCategory[], enabled: boolean) => void;
  subSection: Cs2SubSection;
}

const HUD_COLORS: { value: number; label: string; swatch: string }[] = [
  { value: 0, label: '0 — Cor da Equipe (Padrão)', swatch: '#94A3B8' },
  { value: 1, label: '1 — Branco Suave', swatch: '#E2E8F0' },
  { value: 2, label: '2 — Branco Brilhante', swatch: '#FFFFFF' },
  { value: 3, label: '3 — Azul Claro', swatch: '#7DD3FC' },
  { value: 4, label: '4 — Azul Escuro', swatch: '#3B82F6' },
  { value: 5, label: '5 — Roxo', swatch: '#A855F7' },
  { value: 6, label: '6 — Vermelho', swatch: '#EF4444' },
  { value: 7, label: '7 — Laranja', swatch: '#F97316' },
  { value: 8, label: '8 — Amarelo', swatch: '#EAB308' },
  { value: 9, label: '9 — Verde', swatch: '#22C55E' },
  { value: 10, label: '10 — Ciano / Aqua', swatch: '#2DD4BF' },
  { value: 11, label: '11 — Rosa', swatch: '#EC4899' },
  { value: 12, label: '12 — Amarelo Claro (Colegas)', swatch: '#FDE047' },
];

const QUICK_HZ_OPTIONS = [60, 144, 165, 240, 360];
const QUICK_VOICE_KEYS = ['v', 'c', 'k', 'mouse4', 'mouse5', 'alt'];

export function Cs2View({
  state,
  onChangeCs2Config,
  onToggleTweak,
  onSetCategoryEnabled,
  subSection,
}: Cs2ViewProps) {
  const [copiedLaunch, setCopiedLaunch] = useState(false);
  const [copiedAutoexec, setCopiedAutoexec] = useState(false);
  const [showAutoexecPreview, setShowAutoexecPreview] = useState(false);
  const cs2 = state.cs2Config;

  const [refreshInput, setRefreshInput] = useState(String(cs2.launchRefreshRate));
  const [sensInput, setSensInput] = useState(String(cs2.mouseSensitivity));
  const [zoomSensInput, setZoomSensInput] = useState(String(cs2.zoomSensitivityRatio));

  useEffect(() => {
    setRefreshInput(String(cs2.launchRefreshRate));
  }, [cs2.launchRefreshRate]);

  useEffect(() => {
    setSensInput(String(cs2.mouseSensitivity));
  }, [cs2.mouseSensitivity]);

  useEffect(() => {
    setZoomSensInput(String(cs2.zoomSensitivityRatio));
  }, [cs2.zoomSensitivityRatio]);

  const launchString = buildSteamLaunchOptions(cs2);
  const autoexecText = buildAutoexecCfg(state);
  const selectedHudColor =
    HUD_COLORS.find((c) => c.value === cs2.hudColor) ?? HUD_COLORS[0];

  const update = <K extends keyof Cs2Config>(key: K, value: Cs2Config[K]) => {
    onChangeCs2Config({ ...cs2, [key]: value });
  };

  const updateCustomViewmodel = (
    patch: Partial<
      Pick<
        Cs2Config,
        'viewmodelFov' | 'viewmodelOffsetX' | 'viewmodelOffsetY' | 'viewmodelOffsetZ'
      >
    >
  ) => {
    onChangeCs2Config({
      ...cs2,
      viewmodelPresetPos: 0,
      ...patch,
    });
  };

  const applyViewmodelPreset = (preset: 0 | 1 | 2 | 3, fov: number, x: number, y: number, z: number) => {
    onChangeCs2Config({
      ...cs2,
      viewmodelPresetPos: preset,
      viewmodelFov: fov,
      viewmodelOffsetX: x,
      viewmodelOffsetY: y,
      viewmodelOffsetZ: z,
    });
  };

  const applyRadarPreset = (mode: 'competitive' | 'square' | 'valve') => {
    if (mode === 'competitive') {
      onChangeCs2Config({
        ...cs2,
        radarHudScale: 1.15,
        radarScale: 0.45,
        radarIconScaleMin: 0.85,
        radarBackgroundAlpha: 0.63,
        radarAlwaysCentered: false,
        radarRotate: true,
        radarSquareAlways: false,
        radarSquareWithScoreboard: true,
        radarMapAdditive: true,
        teammateColorsShow: 2,
      });
    } else if (mode === 'square') {
      onChangeCs2Config({
        ...cs2,
        radarHudScale: 1.15,
        radarScale: 0.40,
        radarIconScaleMin: 0.90,
        radarBackgroundAlpha: 0.70,
        radarAlwaysCentered: false,
        radarRotate: true,
        radarSquareAlways: true,
        radarSquareWithScoreboard: true,
        radarMapAdditive: true,
        teammateColorsShow: 2,
      });
    } else {
      onChangeCs2Config({
        ...cs2,
        radarHudScale: 1.0,
        radarScale: 0.70,
        radarIconScaleMin: 0.60,
        radarBackgroundAlpha: 0.63,
        radarAlwaysCentered: true,
        radarRotate: true,
        radarSquareAlways: false,
        radarSquareWithScoreboard: true,
        radarMapAdditive: true,
        teammateColorsShow: 1,
      });
    }
  };

  const handleCopyLaunch = async () => {
    await navigator.clipboard.writeText(launchString);
    setCopiedLaunch(true);
    setTimeout(() => setCopiedLaunch(false), 1800);
  };

  const handleCopyAutoexec = async () => {
    await navigator.clipboard.writeText(autoexecText);
    setCopiedAutoexec(true);
    setTimeout(() => setCopiedAutoexec(false), 1800);
  };

  return (
    <div className="space-y-8">
      {/* 1. Steam Launch Options */}
      {subSection === 'launch' && (
      <section className="space-y-4">
        <div className="space-y-1.5 max-w-2xl">
          <h2 className="font-display text-2xl font-bold tracking-tight text-[var(--wp-text)]">
            Opções de Inicialização da Steam
          </h2>
          <p className="text-sm text-[var(--wp-text-muted)] leading-relaxed">
            Cole a linha gerada em{' '}
            <span className="text-[var(--wp-text-secondary)]">
              Steam &gt; Counter-Strike 2 &gt; Propriedades &gt; Opções de Inicialização
            </span>
            .
          </p>
        </div>

        <div className="bg-[var(--wp-surface)] wp-glass border border-[var(--wp-border)] rounded-lg overflow-hidden divide-y divide-[var(--wp-border)]">
          {/* Preview bar */}
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--wp-surface-alt)]">
            <code className="font-mono text-sm text-[var(--wp-accent-text)] break-all">
              {launchString || '(nenhuma opção selecionada)'}
            </code>
            <button
              type="button"
              onClick={handleCopyLaunch}
              disabled={!launchString}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium border border-[var(--wp-border)] bg-[var(--wp-surface-active)] hover:bg-[var(--wp-surface-hover)] text-[var(--wp-text)] transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
            >
              {copiedLaunch ? (
                <>
                  <Check className="h-3.5 w-3.5 text-[#22C55E]" aria-hidden="true" />
                  <span>Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-[var(--wp-text-muted)]" aria-hidden="true" />
                  <span>Copiar Linha</span>
                </>
              )}
            </button>
          </div>

          {/* Launch Flags */}
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={cs2.launchExecAutoexec}
                onChange={(e) => update('launchExecAutoexec', e.target.checked)}
                className="wp-accent-check mt-1 h-4 w-4 rounded"
              />
              <div>
                <div className="text-sm font-medium text-[var(--wp-text)]">
                  <span className="font-mono text-[var(--wp-accent-text)]">+exec autoexec.cfg</span>
                </div>
                <div className="text-xs text-[var(--wp-text-muted)]">
                  Garante carregamento automático do seu arquivo de configuração ao abrir o jogo.
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={cs2.launchNoJoy}
                onChange={(e) => update('launchNoJoy', e.target.checked)}
                className="wp-accent-check mt-1 h-4 w-4 rounded"
              />
              <div>
                <div className="text-sm font-medium text-[var(--wp-text)]">
                  <span className="font-mono text-[var(--wp-accent-text)]">-nojoy</span>
                </div>
                <div className="text-xs text-[var(--wp-text-muted)]">
                  Desativa leitura de controles/joysticks para reduzir uso de memória e latência de input.
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={cs2.launchHighPriority}
                onChange={(e) => update('launchHighPriority', e.target.checked)}
                className="wp-accent-check mt-1 h-4 w-4 rounded"
              />
              <div>
                <div className="text-sm font-medium text-[var(--wp-text)]">
                  <span className="font-mono text-[var(--wp-accent-text)]">-high</span>
                </div>
                <div className="text-xs text-[var(--wp-text-muted)]">
                  Solicita prioridade alta de CPU na inicialização do Source 2.
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={cs2.launchFullscreen}
                onChange={(e) => update('launchFullscreen', e.target.checked)}
                className="wp-accent-check mt-1 h-4 w-4 rounded"
              />
              <div>
                <div className="text-sm font-medium text-[var(--wp-text)]">
                  <span className="font-mono text-[var(--wp-accent-text)]">-fullscreen</span>
                </div>
                <div className="text-xs text-[var(--wp-text-muted)]">
                  Força modo tela cheia exclusivo na inicialização para menor latência de exibição.
                </div>
              </div>
            </label>

            {/* Optional Threads */}
            <div className="flex items-start gap-3">
              <input
                id="launch-threads-chk"
                type="checkbox"
                checked={cs2.launchThreadsEnabled}
                onChange={(e) => update('launchThreadsEnabled', e.target.checked)}
                className="wp-accent-check mt-1 h-4 w-4 rounded"
              />
              <div className="flex-1 space-y-1.5">
                <label
                  htmlFor="launch-threads-chk"
                  className="text-sm font-medium text-[var(--wp-text)] cursor-pointer block"
                >
                  <span className="font-mono text-[var(--wp-accent-text)]">-threads</span> (CPUs Híbridas Intel P-Core)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={2}
                    max={32}
                    disabled={!cs2.launchThreadsEnabled}
                    value={cs2.launchThreadsCount}
                    onChange={(e) =>
                      update('launchThreadsCount', Math.max(2, Number(e.target.value) || 8))
                    }
                    className="w-20 h-8 px-2.5 rounded-md bg-[var(--wp-input-bg)] border border-[var(--wp-border)] font-mono text-xs text-[var(--wp-text)] disabled:opacity-40 focus:outline-none focus:border-[var(--wp-accent)]"
                  />
                  <span className="text-xs text-[var(--wp-text-subtle)]">
                    Use nº de núcleos físicos/P-cores + 1 (ex: 9 em 8 P-cores).
                  </span>
                </div>
              </div>
            </div>

            {/* Editable Refresh Rate (Hz) */}
            <div className="flex items-start gap-3">
              <input
                id="launch-refresh-chk"
                type="checkbox"
                checked={cs2.launchRefreshRateEnabled}
                onChange={(e) => update('launchRefreshRateEnabled', e.target.checked)}
                className="wp-accent-check mt-1 h-4 w-4 rounded"
              />
              <div className="flex-1 space-y-2">
                <label
                  htmlFor="launch-refresh-chk"
                  className="text-sm font-medium text-[var(--wp-text)] cursor-pointer block"
                >
                  <span className="font-mono text-[var(--wp-accent-text)]">-refresh</span> (Digite os Hz do seu monitor)
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={30}
                      max={1000}
                      disabled={!cs2.launchRefreshRateEnabled}
                      value={refreshInput}
                      onChange={(e) => {
                        const raw = e.target.value;
                        setRefreshInput(raw);
                        if (raw.trim() === '') return;
                        const parsed = Math.round(Number(raw));
                        if (Number.isFinite(parsed) && parsed >= 30 && parsed <= 1000) {
                          update('launchRefreshRate', parsed);
                        }
                      }}
                      onBlur={() => {
                        const parsed = Math.round(Number(refreshInput));
                        const clamped = Number.isFinite(parsed)
                          ? Math.min(1000, Math.max(30, parsed))
                          : 144;
                        update('launchRefreshRate', clamped);
                        setRefreshInput(String(clamped));
                      }}
                      placeholder="Ex: 165"
                      className="w-24 h-8 px-2.5 rounded-md bg-[var(--wp-input-bg)] border border-[var(--wp-border)] font-mono text-xs text-[var(--wp-text)] disabled:opacity-40 focus:outline-none focus:border-[var(--wp-accent)]"
                    />
                    <span className="font-mono text-xs text-[var(--wp-text-muted)]">Hz</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    {QUICK_HZ_OPTIONS.map((hz) => (
                      <button
                        key={hz}
                        type="button"
                        disabled={!cs2.launchRefreshRateEnabled}
                        onClick={() => update('launchRefreshRate', hz)}
                        className={`px-2 py-1 rounded text-[11px] font-mono border transition-colors disabled:opacity-40 ${
                          cs2.launchRefreshRate === hz && cs2.launchRefreshRateEnabled
                            ? 'bg-[var(--wp-accent-soft)] border-[var(--wp-accent)] text-[var(--wp-accent-text)]'
                            : 'bg-[var(--wp-surface-alt)] border-[var(--wp-border)] text-[var(--wp-text-muted)] hover:text-[var(--wp-text)]'
                        }`}
                      >
                        {hz}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      )}

      {/* 2. autoexec.cfg Builder */}
      {subSection === 'autoexec' && (
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <h2 className="font-display text-2xl font-bold tracking-tight text-[var(--wp-text)]">
              Construtor de autoexec.cfg
            </h2>
            <p className="text-sm text-[var(--wp-text-muted)] leading-relaxed">
              Comandos nativos Source 2 para menor latência, FOV completo, cor do HUD, sensibilidade, bind de voz e áudio posicional.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowAutoexecPreview((prev) => !prev)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium border border-[var(--wp-border)] bg-[var(--wp-surface)] hover:bg-[var(--wp-surface-hover)] text-[var(--wp-text-secondary)] transition-colors whitespace-nowrap"
            >
              <span>{showAutoexecPreview ? 'Ocultar CFG' : 'Visualizar CFG'}</span>
            </button>
            <button
              type="button"
              onClick={handleCopyAutoexec}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium border border-[var(--wp-border)] bg-[var(--wp-surface)] hover:bg-[var(--wp-surface-hover)] text-[var(--wp-text-secondary)] transition-colors whitespace-nowrap"
            >
              {copiedAutoexec ? (
                <>
                  <Check className="h-3.5 w-3.5 text-[#22C55E]" aria-hidden="true" />
                  <span>CFG Copiada</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-[var(--wp-text-muted)]" aria-hidden="true" />
                  <span>Copiar autoexec.cfg</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => downloadSingleFile('autoexec.cfg', autoexecText)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium border border-[var(--wp-border)] bg-[var(--wp-surface-active)] hover:bg-[var(--wp-surface-hover)] text-[var(--wp-text)] transition-colors whitespace-nowrap"
            >
              <Download className="h-3.5 w-3.5 text-[var(--wp-accent-text)]" aria-hidden="true" />
              <span>Baixar autoexec.cfg</span>
            </button>
          </div>
        </div>

        <div className="bg-[var(--wp-surface)] wp-glass border border-[var(--wp-border)] rounded-lg divide-y divide-[var(--wp-border)]">
          {/* Desempenho & Frametime */}
          <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="space-y-1.5">
              <label htmlFor="fps-max" className="block text-xs font-medium text-[var(--wp-text-secondary)]">
                Limite de FPS em Partida (<span className="font-mono text-[var(--wp-accent-text)]">fps_max</span>)
              </label>
              <select
                id="fps-max"
                value={cs2.fpsMax}
                onChange={(e) => update('fpsMax', Number(e.target.value))}
                className="w-full h-10 px-3 rounded-lg bg-[var(--wp-input-bg)] border border-[var(--wp-border)] font-mono text-xs text-[var(--wp-text)] focus:outline-none focus:border-[var(--wp-accent)]"
              >
                <option value={0}>0 — Ilimitado (menor latência)</option>
                <option value={240}>240 FPS</option>
                <option value={300}>300 FPS</option>
                <option value={400}>400 FPS</option>
                <option value={500}>500 FPS</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="fps-max-ui" className="block text-xs font-medium text-[var(--wp-text-secondary)]">
                Limite de FPS no Menu (<span className="font-mono text-[var(--wp-accent-text)]">fps_max_ui</span>)
              </label>
              <select
                id="fps-max-ui"
                value={cs2.fpsMaxUi}
                onChange={(e) => update('fpsMaxUi', Number(e.target.value))}
                className="w-full h-10 px-3 rounded-lg bg-[var(--wp-input-bg)] border border-[var(--wp-border)] font-mono text-xs text-[var(--wp-text)] focus:outline-none focus:border-[var(--wp-accent)]"
              >
                <option value={60}>60 FPS (frio no lobby)</option>
                <option value={120}>120 FPS</option>
                <option value={144}>144 FPS</option>
                <option value={240}>240 FPS</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="gamma-range" className="block text-xs font-medium text-[var(--wp-text-secondary)]">
                Brilho / Gama (<span className="font-mono text-[var(--wp-accent-text)]">r_fullscreen_gamma</span>):{' '}
                <span className="font-mono text-[var(--wp-text)]">{cs2.fullscreenGamma.toFixed(1)}</span>
              </label>
              <input
                id="gamma-range"
                type="range"
                min={1.6}
                max={2.6}
                step={0.1}
                value={cs2.fullscreenGamma}
                onChange={(e) => update('fullscreenGamma', Number(e.target.value))}
                className="wp-accent-check w-full h-10 cursor-pointer"
              />
            </div>
          </div>

          {/* FOV & Viewmodel Completo (todas as formas) */}
          <div className="p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-[var(--wp-text)]">
                  Ajuste Completo de FOV &amp; Viewmodel (Posição da Arma)
                </h3>
                <p className="text-xs text-[var(--wp-text-muted)]">
                  Controle o campo de visão da arma (<span className="font-mono text-[var(--wp-accent-text)]">viewmodel_fov</span>), presets oficiais e os 3 eixos X / Y / Z.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => applyViewmodelPreset(0, 68, 2.5, 2.0, -1.5)}
                  className="px-2.5 py-1 rounded-md text-xs font-medium border border-[var(--wp-border)] bg-[var(--wp-surface-alt)] hover:bg-[var(--wp-surface-hover)] text-[var(--wp-text-secondary)] transition-colors"
                >
                  Competitivo Aberto
                </button>
                <button
                  type="button"
                  onClick={() => applyViewmodelPreset(0, 68, -2.0, 2.0, -2.0)}
                  className="px-2.5 py-1 rounded-md text-xs font-medium border border-[var(--wp-border)] bg-[var(--wp-surface-alt)] hover:bg-[var(--wp-surface-hover)] text-[var(--wp-text-secondary)] transition-colors"
                >
                  Centralizado
                </button>
                <button
                  type="button"
                  onClick={() => applyViewmodelPreset(1, 60, 1.0, 1.0, -1.0)}
                  className="px-2.5 py-1 rounded-md text-xs font-medium border border-[var(--wp-border)] bg-[var(--wp-surface-alt)] hover:bg-[var(--wp-surface-hover)] text-[var(--wp-text-secondary)] transition-colors"
                >
                  Desktop (1)
                </button>
                <button
                  type="button"
                  onClick={() => applyViewmodelPreset(3, 68, 2.5, 0.0, -1.5)}
                  className="px-2.5 py-1 rounded-md text-xs font-medium border border-[var(--wp-border)] bg-[var(--wp-surface-alt)] hover:bg-[var(--wp-surface-hover)] text-[var(--wp-text-secondary)] transition-colors"
                >
                  Clássico (3)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
              {/* Preset Pos */}
              <div className="space-y-1.5">
                <label htmlFor="vm-preset" className="block text-xs font-medium text-[var(--wp-text-secondary)]">
                  Preset (<span className="font-mono text-[var(--wp-accent-text)]">viewmodel_presetpos</span>)
                </label>
                <select
                  id="vm-preset"
                  value={cs2.viewmodelPresetPos}
                  onChange={(e) => {
                    const p = Number(e.target.value) as 0 | 1 | 2 | 3;
                    if (p === 1) applyViewmodelPreset(1, 60, 1.0, 1.0, -1.0);
                    else if (p === 2) applyViewmodelPreset(2, 54, 0.0, 0.0, 0.0);
                    else if (p === 3) applyViewmodelPreset(3, 68, 2.5, 0.0, -1.5);
                    else update('viewmodelPresetPos', 0);
                  }}
                  className="w-full h-10 px-3 rounded-lg bg-[var(--wp-input-bg)] border border-[var(--wp-border)] font-mono text-xs text-[var(--wp-text)] focus:outline-none focus:border-[var(--wp-accent)]"
                >
                  <option value={0}>0 — Personalizado</option>
                  <option value={1}>1 — Desktop</option>
                  <option value={2}>2 — Couch</option>
                  <option value={3}>3 — Clássico</option>
                </select>
              </div>

              {/* viewmodel_fov */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-medium text-[var(--wp-text-secondary)]">
                  <label htmlFor="vm-fov">
                    FOV (<span className="font-mono text-[var(--wp-accent-text)]">viewmodel_fov</span>)
                  </label>
                  <input
                    type="number"
                    min={54}
                    max={68}
                    step={1}
                    value={cs2.viewmodelFov}
                    onChange={(e) =>
                      updateCustomViewmodel({
                        viewmodelFov: Math.min(68, Math.max(54, Number(e.target.value) || 54)),
                      })
                    }
                    className="w-14 h-6 px-1.5 rounded bg-[var(--wp-input-bg)] border border-[var(--wp-border)] font-mono text-xs text-right text-[var(--wp-text)]"
                  />
                </div>
                <input
                  id="vm-fov"
                  type="range"
                  min={54}
                  max={68}
                  step={1}
                  value={cs2.viewmodelFov}
                  onChange={(e) =>
                    updateCustomViewmodel({ viewmodelFov: Number(e.target.value) })
                  }
                  className="wp-accent-check w-full h-8 cursor-pointer"
                />
              </div>

              {/* offset_x */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-medium text-[var(--wp-text-secondary)]">
                  <label htmlFor="vm-x">
                    Eixo X (<span className="font-mono text-[var(--wp-accent-text)]">offset_x</span>)
                  </label>
                  <input
                    type="number"
                    min={-2.5}
                    max={2.5}
                    step={0.1}
                    value={cs2.viewmodelOffsetX}
                    onChange={(e) =>
                      updateCustomViewmodel({
                        viewmodelOffsetX: Math.min(2.5, Math.max(-2.5, Number(e.target.value) || 0)),
                      })
                    }
                    className="w-16 h-6 px-1.5 rounded bg-[var(--wp-input-bg)] border border-[var(--wp-border)] font-mono text-xs text-right text-[var(--wp-text)]"
                  />
                </div>
                <input
                  id="vm-x"
                  type="range"
                  min={-2.5}
                  max={2.5}
                  step={0.1}
                  value={cs2.viewmodelOffsetX}
                  onChange={(e) =>
                    updateCustomViewmodel({ viewmodelOffsetX: Number(e.target.value) })
                  }
                  className="wp-accent-check w-full h-8 cursor-pointer"
                />
              </div>

              {/* offset_y */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-medium text-[var(--wp-text-secondary)]">
                  <label htmlFor="vm-y">
                    Eixo Y (<span className="font-mono text-[var(--wp-accent-text)]">offset_y</span>)
                  </label>
                  <input
                    type="number"
                    min={-2.0}
                    max={2.0}
                    step={0.1}
                    value={cs2.viewmodelOffsetY}
                    onChange={(e) =>
                      updateCustomViewmodel({
                        viewmodelOffsetY: Math.min(2, Math.max(-2, Number(e.target.value) || 0)),
                      })
                    }
                    className="w-16 h-6 px-1.5 rounded bg-[var(--wp-input-bg)] border border-[var(--wp-border)] font-mono text-xs text-right text-[var(--wp-text)]"
                  />
                </div>
                <input
                  id="vm-y"
                  type="range"
                  min={-2.0}
                  max={2.0}
                  step={0.1}
                  value={cs2.viewmodelOffsetY}
                  onChange={(e) =>
                    updateCustomViewmodel({ viewmodelOffsetY: Number(e.target.value) })
                  }
                  className="wp-accent-check w-full h-8 cursor-pointer"
                />
              </div>

              {/* offset_z */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-medium text-[var(--wp-text-secondary)]">
                  <label htmlFor="vm-z">
                    Eixo Z (<span className="font-mono text-[var(--wp-accent-text)]">offset_z</span>)
                  </label>
                  <input
                    type="number"
                    min={-2.0}
                    max={2.0}
                    step={0.1}
                    value={cs2.viewmodelOffsetZ}
                    onChange={(e) =>
                      updateCustomViewmodel({
                        viewmodelOffsetZ: Math.min(2, Math.max(-2, Number(e.target.value) || 0)),
                      })
                    }
                    className="w-16 h-6 px-1.5 rounded bg-[var(--wp-input-bg)] border border-[var(--wp-border)] font-mono text-xs text-right text-[var(--wp-text)]"
                  />
                </div>
                <input
                  id="vm-z"
                  type="range"
                  min={-2.0}
                  max={2.0}
                  step={0.1}
                  value={cs2.viewmodelOffsetZ}
                  onChange={(e) =>
                    updateCustomViewmodel({ viewmodelOffsetZ: Number(e.target.value) })
                  }
                  className="wp-accent-check w-full h-8 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Cor do HUD, Sensibilidade & Bind para Falar */}
          <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Cor do HUD */}
            <div className="space-y-2">
              <label htmlFor="hud-color" className="block text-xs font-medium text-[var(--wp-text-secondary)]">
                Cor do HUD (<span className="font-mono text-[var(--wp-accent-text)]">cl_hud_color</span>)
              </label>
              <div className="flex items-center gap-2.5">
                <span
                  className="h-5 w-5 rounded-full shrink-0 border border-black/25"
                  title={
                    cs2.hudColor === 0
                      ? 'CT (Azul) / TR (Amarelo-Laranja)'
                      : selectedHudColor.label
                  }
                  style={{
                    background:
                      cs2.hudColor === 0
                        ? 'linear-gradient(135deg, #4B96EB 0%, #4B96EB 49%, #E5A038 51%, #E5A038 100%)'
                        : selectedHudColor.swatch,
                  }}
                  aria-hidden="true"
                />
                <select
                  id="hud-color"
                  value={cs2.hudColor}
                  onChange={(e) => update('hudColor', Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-lg bg-[var(--wp-input-bg)] border border-[var(--wp-border)] font-mono text-xs text-[var(--wp-text)] focus:outline-none focus:border-[var(--wp-accent)]"
                >
                  {HUD_COLORS.map((color) => (
                    <option key={color.value} value={color.value}>
                      {color.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sensibilidade */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-medium text-[var(--wp-text-secondary)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={cs2.applySensitivityInAutoexec}
                  onChange={(e) => update('applySensitivityInAutoexec', e.target.checked)}
                  className="wp-accent-check h-3.5 w-3.5 rounded"
                />
                <span>
                  Sensibilidade (<span className="font-mono text-[var(--wp-accent-text)]">sensitivity</span>)
                </span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <input
                    type="number"
                    min={0.05}
                    max={20}
                    step={0.05}
                    disabled={!cs2.applySensitivityInAutoexec}
                    value={sensInput}
                    onChange={(e) => {
                      const raw = e.target.value;
                      setSensInput(raw);
                      if (raw.trim() === '') return;
                      const parsed = Number(raw);
                      if (Number.isFinite(parsed) && parsed >= 0.05 && parsed <= 20) {
                        update('mouseSensitivity', parsed);
                      }
                    }}
                    onBlur={() => {
                      const parsed = Number(sensInput);
                      const clamped = Number.isFinite(parsed)
                        ? Math.min(20, Math.max(0.05, parsed))
                        : 1.5;
                      update('mouseSensitivity', clamped);
                      setSensInput(String(clamped));
                    }}
                    aria-label="Sensibilidade do mouse"
                    className="w-full h-10 px-3 rounded-lg bg-[var(--wp-input-bg)] border border-[var(--wp-border)] font-mono text-xs text-[var(--wp-text)] disabled:opacity-40 focus:outline-none focus:border-[var(--wp-accent)]"
                  />
                  <span className="block text-[11px] text-[var(--wp-text-subtle)]">Geral</span>
                </div>
                <div className="space-y-1">
                  <input
                    type="number"
                    min={0.1}
                    max={3}
                    step={0.05}
                    disabled={!cs2.applySensitivityInAutoexec}
                    value={zoomSensInput}
                    onChange={(e) => {
                      const raw = e.target.value;
                      setZoomSensInput(raw);
                      if (raw.trim() === '') return;
                      const parsed = Number(raw);
                      if (Number.isFinite(parsed) && parsed >= 0.1 && parsed <= 3) {
                        update('zoomSensitivityRatio', parsed);
                      }
                    }}
                    onBlur={() => {
                      const parsed = Number(zoomSensInput);
                      const clamped = Number.isFinite(parsed)
                        ? Math.min(3, Math.max(0.1, parsed))
                        : 1.0;
                      update('zoomSensitivityRatio', clamped);
                      setZoomSensInput(String(clamped));
                    }}
                    aria-label="Sensibilidade com zoom (AWP/Scout)"
                    className="w-full h-10 px-3 rounded-lg bg-[var(--wp-input-bg)] border border-[var(--wp-border)] font-mono text-xs text-[var(--wp-text)] disabled:opacity-40 focus:outline-none focus:border-[var(--wp-accent)]"
                  />
                  <span className="block text-[11px] text-[var(--wp-text-subtle)]">Zoom AWP</span>
                </div>
              </div>
            </div>

            {/* Bind para falar */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-medium text-[var(--wp-text-secondary)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={cs2.bindVoiceEnabled}
                  onChange={(e) => update('bindVoiceEnabled', e.target.checked)}
                  className="wp-accent-check h-3.5 w-3.5 rounded"
                />
                <span>
                  Bind para Falar (<span className="font-mono text-[var(--wp-accent-text)]">+voicerecord</span>)
                </span>
              </label>
              <div className="space-y-1.5">
                <input
                  type="text"
                  disabled={!cs2.bindVoiceEnabled}
                  value={cs2.bindVoiceKey}
                  onChange={(e) => update('bindVoiceKey', e.target.value)}
                  placeholder="Ex: v, k, mouse4, mouse5"
                  aria-label="Tecla para falar no microfone"
                  className="w-full h-10 px-3 rounded-lg bg-[var(--wp-input-bg)] border border-[var(--wp-border)] font-mono text-xs text-[var(--wp-text)] disabled:opacity-40 focus:outline-none focus:border-[var(--wp-accent)]"
                />
                <div className="flex flex-wrap gap-1">
                  {QUICK_VOICE_KEYS.map((keyName) => (
                    <button
                      key={keyName}
                      type="button"
                      disabled={!cs2.bindVoiceEnabled}
                      onClick={() => update('bindVoiceKey', keyName)}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono border transition-colors disabled:opacity-40 ${
                        cs2.bindVoiceKey.toLowerCase() === keyName && cs2.bindVoiceEnabled
                          ? 'bg-[var(--wp-accent-soft)] border-[var(--wp-accent)] text-[var(--wp-accent-text)]'
                          : 'bg-[var(--wp-surface-alt)] border-[var(--wp-border)] text-[var(--wp-text-muted)] hover:text-[var(--wp-text)]'
                      }`}
                    >
                      {keyName.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Engine Low Latency & Rede */}
          <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="space-y-1.5">
              <label htmlFor="rate-select" className="block text-xs font-medium text-[var(--wp-text-secondary)]">
                Taxa Máxima de Rede (<span className="font-mono text-[var(--wp-accent-text)]">rate</span>)
              </label>
              <select
                id="rate-select"
                value={cs2.rate}
                onChange={(e) => update('rate', Number(e.target.value))}
                className="w-full h-10 px-3 rounded-lg bg-[var(--wp-input-bg)] border border-[var(--wp-border)] font-mono text-xs text-[var(--wp-text)] focus:outline-none focus:border-[var(--wp-accent)]"
              >
                <option value={1000000}>1000000 (Máximo — Fibra / 8+ Mbps)</option>
                <option value={786432}>786432 (Padrão Competitivo)</option>
                <option value={524288}>524288 (Conexão Moderada)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="net-buffer" className="block text-xs font-medium text-[var(--wp-text-secondary)]">
                Buffer de Pacotes (<span className="font-mono text-[var(--wp-accent-text)]">cl_net_buffer_ticks</span>)
              </label>
              <select
                id="net-buffer"
                value={cs2.netBufferTicks}
                onChange={(e) => update('netBufferTicks', Number(e.target.value))}
                className="w-full h-10 px-3 rounded-lg bg-[var(--wp-input-bg)] border border-[var(--wp-border)] font-mono text-xs text-[var(--wp-text)] focus:outline-none focus:border-[var(--wp-accent)]"
              >
                <option value={0}>0 — Menor latência (Cabo Ethernet estável)</option>
                <option value={1}>1 — Suaviza 1 tick de jitter</option>
                <option value={2}>2 — Conexão instável / Wi-Fi</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="max-ping" className="block text-xs font-medium text-[var(--wp-text-secondary)]">
                Ping Máximo Matchmaking (<span className="font-mono text-[var(--wp-accent-text)]">mm_dedicated_search_maxping</span>)
              </label>
              <input
                id="max-ping"
                type="number"
                min={25}
                max={150}
                value={cs2.maxPing}
                onChange={(e) => update('maxPing', Math.min(150, Math.max(25, Number(e.target.value) || 55)))}
                className="w-full h-10 px-3 rounded-lg bg-[var(--wp-input-bg)] border border-[var(--wp-border)] font-mono text-xs text-[var(--wp-text)] focus:outline-none focus:border-[var(--wp-accent)]"
              />
            </div>
          </div>

          {/* Audio e Telemetria */}
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label htmlFor="headphone-eq" className="block text-xs font-medium text-[var(--wp-text-secondary)]">
                Perfil de Áudio (<span className="font-mono text-[var(--wp-accent-text)]">snd_headphone_eq</span>)
              </label>
              <select
                id="headphone-eq"
                value={cs2.headphoneEq}
                onChange={(e) => update('headphoneEq', e.target.value as '0' | '1' | '2')}
                className="w-full h-10 px-3 rounded-lg bg-[var(--wp-input-bg)] border border-[var(--wp-border)] font-mono text-xs text-[var(--wp-text)] focus:outline-none focus:border-[var(--wp-accent)]"
              >
                <option value="0">0 — Natural</option>
                <option value="1">1 — Nítido (Crisp — destaca passos)</option>
                <option value="2">2 — Suave (Smooth)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="telemetry-ft" className="block text-xs font-medium text-[var(--wp-text-secondary)]">
                Telemetria de FPS/Frametime
              </label>
              <select
                id="telemetry-ft"
                value={cs2.telemetryFrametime}
                onChange={(e) => update('telemetryFrametime', e.target.value as '0' | '1' | '2')}
                className="w-full h-10 px-3 rounded-lg bg-[var(--wp-input-bg)] border border-[var(--wp-border)] font-mono text-xs text-[var(--wp-text)] focus:outline-none focus:border-[var(--wp-accent)]"
              >
                <option value="2">2 — Mostrar sempre no canto</option>
                <option value="1">1 — Mostrar apenas se houver queda</option>
                <option value="0">0 — Oculto</option>
              </select>
            </div>
          </div>

          {/* Radar Completo do CS2 */}
          <div className="p-5 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-[var(--wp-text)]">
                  Configuração Completa do Radar
                </h3>
                <p className="text-xs text-[var(--wp-text-muted)]">
                  Todas as variáveis oficiais do minimapa no CS2: tamanho no HUD, zoom, ícones, opacidade, formato quadrado, rotação e cores dos aliados.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => applyRadarPreset('competitive')}
                  className="px-2.5 py-1 rounded-md text-xs font-medium border border-[var(--wp-border)] bg-[var(--wp-surface-alt)] hover:bg-[var(--wp-surface-hover)] text-[var(--wp-text-secondary)] transition-colors"
                >
                  Competitivo Visão Total
                </button>
                <button
                  type="button"
                  onClick={() => applyRadarPreset('square')}
                  className="px-2.5 py-1 rounded-md text-xs font-medium border border-[var(--wp-border)] bg-[var(--wp-surface-alt)] hover:bg-[var(--wp-surface-hover)] text-[var(--wp-text-secondary)] transition-colors"
                >
                  Quadrado Sempre
                </button>
                <button
                  type="button"
                  onClick={() => applyRadarPreset('valve')}
                  className="px-2.5 py-1 rounded-md text-xs font-medium border border-[var(--wp-border)] bg-[var(--wp-surface-alt)] hover:bg-[var(--wp-surface-hover)] text-[var(--wp-text-secondary)] transition-colors"
                >
                  Padrão Valve
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
              {/* Tamanho no HUD */}
              <div className="space-y-1.5">
                <label htmlFor="radar-hud-scale" className="block text-xs font-medium text-[var(--wp-text-secondary)]">
                  Tamanho no HUD (<span className="font-mono text-[var(--wp-accent-text)]">cl_hud_radar_scale</span>):{' '}
                  <span className="font-mono text-[var(--wp-text)]">{cs2.radarHudScale.toFixed(2)}</span>
                </label>
                <input
                  id="radar-hud-scale"
                  type="range"
                  min={0.8}
                  max={1.3}
                  step={0.05}
                  value={cs2.radarHudScale}
                  onChange={(e) => update('radarHudScale', Number(e.target.value))}
                  className="wp-accent-check w-full h-9 cursor-pointer"
                />
              </div>

              {/* Zoom do Mapa */}
              <div className="space-y-1.5">
                <label htmlFor="radar-scale" className="block text-xs font-medium text-[var(--wp-text-secondary)]">
                  Zoom do Mapa (<span className="font-mono text-[var(--wp-accent-text)]">cl_radar_scale</span>):{' '}
                  <span className="font-mono text-[var(--wp-text)]">{cs2.radarScale.toFixed(2)}</span>
                </label>
                <input
                  id="radar-scale"
                  type="range"
                  min={0.25}
                  max={1.0}
                  step={0.05}
                  value={cs2.radarScale}
                  onChange={(e) => update('radarScale', Number(e.target.value))}
                  className="wp-accent-check w-full h-9 cursor-pointer"
                />
              </div>

              {/* Tamanho dos Icones */}
              <div className="space-y-1.5">
                <label htmlFor="radar-icon-scale" className="block text-xs font-medium text-[var(--wp-text-secondary)]">
                  Tamanho Ícones (<span className="font-mono text-[var(--wp-accent-text)]">icon_scale_min</span>):{' '}
                  <span className="font-mono text-[var(--wp-text)]">{cs2.radarIconScaleMin.toFixed(2)}</span>
                </label>
                <input
                  id="radar-icon-scale"
                  type="range"
                  min={0.4}
                  max={1.25}
                  step={0.05}
                  value={cs2.radarIconScaleMin}
                  onChange={(e) => update('radarIconScaleMin', Number(e.target.value))}
                  className="wp-accent-check w-full h-9 cursor-pointer"
                />
              </div>

              {/* Opacidade de Fundo */}
              <div className="space-y-1.5">
                <label htmlFor="radar-bg-alpha" className="block text-xs font-medium text-[var(--wp-text-secondary)]">
                  Opacidade Fundo (<span className="font-mono text-[var(--wp-accent-text)]">background_alpha</span>):{' '}
                  <span className="font-mono text-[var(--wp-text)]">{cs2.radarBackgroundAlpha.toFixed(2)}</span>
                </label>
                <input
                  id="radar-bg-alpha"
                  type="range"
                  min={0.0}
                  max={1.0}
                  step={0.05}
                  value={cs2.radarBackgroundAlpha}
                  onChange={(e) => update('radarBackgroundAlpha', Number(e.target.value))}
                  className="wp-accent-check w-full h-9 cursor-pointer"
                />
              </div>

              {/* Cores dos Aliados */}
              <div className="space-y-1.5">
                <label htmlFor="teammate-colors" className="block text-xs font-medium text-[var(--wp-text-secondary)]">
                  Aliados (<span className="font-mono text-[var(--wp-accent-text)]">cl_teammate_colors_show</span>)
                </label>
                <select
                  id="teammate-colors"
                  value={cs2.teammateColorsShow}
                  onChange={(e) =>
                    update('teammateColorsShow', Number(e.target.value) as 0 | 1 | 2)
                  }
                  className="w-full h-9 px-2.5 rounded-lg bg-[var(--wp-input-bg)] border border-[var(--wp-border)] font-mono text-xs text-[var(--wp-text)] focus:outline-none focus:border-[var(--wp-accent)]"
                >
                  <option value={2}>2 — Cores + Letras</option>
                  <option value={1}>1 — Apenas Cores</option>
                  <option value={0}>0 — Desativado</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cs2.radarAlwaysCentered}
                  onChange={(e) => update('radarAlwaysCentered', e.target.checked)}
                  className="wp-accent-check mt-0.5 h-4 w-4 rounded"
                />
                <div>
                  <div className="text-xs font-medium text-[var(--wp-text)]">
                    Centralizar no Jogador (<span className="font-mono text-[var(--wp-accent-text)]">cl_radar_always_centered</span>)
                  </div>
                  <div className="text-[11px] text-[var(--wp-text-muted)]">
                    Desative para ver mais mapa ao encostar em bordas.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cs2.radarRotate}
                  onChange={(e) => update('radarRotate', e.target.checked)}
                  className="wp-accent-check mt-0.5 h-4 w-4 rounded"
                />
                <div>
                  <div className="text-xs font-medium text-[var(--wp-text)]">
                    Rotacionar Radar (<span className="font-mono text-[var(--wp-accent-text)]">cl_radar_rotate</span>)
                  </div>
                  <div className="text-[11px] text-[var(--wp-text-muted)]">
                    Gira o minimapa conforme a direção da sua mira.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cs2.radarSquareAlways}
                  onChange={(e) => update('radarSquareAlways', e.target.checked)}
                  className="wp-accent-check mt-0.5 h-4 w-4 rounded"
                />
                <div>
                  <div className="text-xs font-medium text-[var(--wp-text)]">
                    Radar Sempre Quadrado (<span className="font-mono text-[var(--wp-accent-text)]">cl_radar_square_always</span>)
                  </div>
                  <div className="text-[11px] text-[var(--wp-text-muted)]">
                    Mantém formato quadrado para mostrar mais cantos do mapa.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cs2.radarSquareWithScoreboard}
                  onChange={(e) => update('radarSquareWithScoreboard', e.target.checked)}
                  className="wp-accent-check mt-0.5 h-4 w-4 rounded"
                />
                <div>
                  <div className="text-xs font-medium text-[var(--wp-text)]">
                    Expandir no TAB (<span className="font-mono text-[var(--wp-accent-text)]">square_with_scoreboard</span>)
                  </div>
                  <div className="text-[11px] text-[var(--wp-text-muted)]">
                    Amplia o radar quadrado ao segurar o placar (TAB).
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cs2.radarMapAdditive}
                  onChange={(e) => update('radarMapAdditive', e.target.checked)}
                  className="wp-accent-check mt-0.5 h-4 w-4 rounded"
                />
                <div>
                  <div className="text-xs font-medium text-[var(--wp-text)]">
                    Mapa Aditivo (<span className="font-mono text-[var(--wp-accent-text)]">cl_hud_radar_map_additive</span>)
                  </div>
                  <div className="text-[11px] text-[var(--wp-text-muted)]">
                    Mistura a transparência do mapa com a iluminação do jogo.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Toggles e Binds Seguras */}
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cs2.lowLatencySleep}
                  onChange={(e) => update('lowLatencySleep', e.target.checked)}
                  className="wp-accent-check mt-1 h-4 w-4 rounded"
                />
                <div>
                  <div className="text-sm font-medium text-[var(--wp-text)]">
                    Low Latency Sleep (<span className="font-mono text-[var(--wp-accent-text)]">engine_low_latency_sleep_after_client_tick</span>)
                  </div>
                  <div className="text-xs text-[var(--wp-text-muted)]">
                    Reduz atraso entre o tick do cliente e o quadro exibido quando a GPU tem folga.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cs2.perspectiveCorrection}
                  onChange={(e) => update('perspectiveCorrection', e.target.checked)}
                  className="wp-accent-check mt-1 h-4 w-4 rounded"
                />
                <div>
                  <div className="text-sm font-medium text-[var(--wp-text)]">
                    Correção de Perspectiva Steam Audio
                  </div>
                  <div className="text-xs text-[var(--wp-text-muted)]">
                    Melhora precisão direcional de passos na vertical (ex: Nuke e Vertigo).
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cs2.hideBuildInfo}
                  onChange={(e) => update('hideBuildInfo', e.target.checked)}
                  className="wp-accent-check mt-1 h-4 w-4 rounded"
                />
                <div>
                  <div className="text-sm font-medium text-[var(--wp-text)]">
                    Ocultar marca d&apos;água de build (<span className="font-mono text-[var(--wp-accent-text)]">r_show_build_info false</span>)
                  </div>
                  <div className="text-xs text-[var(--wp-text-muted)]">
                    Remove o texto técnico da versão no canto inferior esquerdo da tela.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!cs2.useOpensBuyMenu}
                  onChange={(e) => update('useOpensBuyMenu', !e.target.checked)}
                  className="wp-accent-check mt-1 h-4 w-4 rounded"
                />
                <div>
                  <div className="text-sm font-medium text-[var(--wp-text)]">
                    Impedir tecla E de abrir menu de compras
                  </div>
                  <div className="text-xs text-[var(--wp-text-muted)]">
                    Evita abrir a loja por acidente ao tentar pegar armas dropadas no spawn.
                  </div>
                </div>
              </label>
            </div>

            <div className="pt-4 border-t border-[var(--wp-border)] space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-semibold text-[var(--wp-text-secondary)]">
                  Binds Competitivas Seguras
                </div>
                <div className="inline-flex items-center gap-1.5 text-xs text-[#16A34A] dark:text-[#22C55E]">
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Sem automação multi-tecla / Snap Tap (100% permitido pela Valve)</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <label className="flex items-center gap-2.5 text-xs text-[var(--wp-text-secondary)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cs2.bindScrollJump}
                    onChange={(e) => update('bindScrollJump', e.target.checked)}
                    className="wp-accent-check h-4 w-4 rounded"
                  />
                  <span>Pulo no Scroll (<span className="font-mono text-[var(--wp-text-muted)]">mwheeldown/up</span>)</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs text-[var(--wp-text-secondary)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cs2.bindRadarZoom}
                    onChange={(e) => update('bindRadarZoom', e.target.checked)}
                    className="wp-accent-check h-4 w-4 rounded"
                  />
                  <span>Zoom do Radar na tecla <span className="font-mono text-[var(--wp-text-muted)]">X</span></span>
                </label>

                <label className="flex items-center gap-2.5 text-xs text-[var(--wp-text-secondary)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cs2.bindClutchMute}
                    onChange={(e) => update('bindClutchMute', e.target.checked)}
                    className="wp-accent-check h-4 w-4 rounded"
                  />
                  <span>Mutar voz (Clutch) na tecla <span className="font-mono text-[var(--wp-text-muted)]">J</span></span>
                </label>
              </div>
            </div>
          </div>

          {showAutoexecPreview && (
            <div className="p-4 bg-[var(--wp-code-bg)] space-y-2">
              <div className="text-xs font-medium text-[var(--wp-text-muted)]">
                Prévia do arquivo <span className="font-mono text-[var(--wp-text)]">autoexec.cfg</span>:
              </div>
              <pre className="max-h-72 overflow-auto font-mono text-xs leading-6 text-[var(--wp-text-secondary)] whitespace-pre">
                {autoexecText}
              </pre>
            </div>
          )}
        </div>
      </section>
      )}

      {/* 3. Windows-level CS2 Tweaks */}
      {subSection === 'system' && (
        <TweakListView
          categories={['cs2_sys']}
          title="Otimizações de Sistema para cs2.exe"
          description="Ajustes no Registro do Windows e pipeline gráfico aplicados especificamente para priorizar o Counter-Strike 2."
          enabledTweaks={state.enabledTweaks}
          onToggleTweak={onToggleTweak}
          onSetCategoryEnabled={onSetCategoryEnabled}
        />
      )}
    </div>
  );
}
