import { Menu, Moon, Palette, Play, Sparkles, Sun } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
  AccentColorId,
  AppearanceConfig,
  NavSection,
  SubSectionSelection,
} from '../types/optimizer';
import { ACCENT_PRESETS, getAccentPreset } from '../utils/theme';

interface HeaderProps {
  activeSection: NavSection;
  subSections: SubSectionSelection;
  onOpenMobileMenu: () => void;
  onApplyDirect: () => void;
  runningAction: 'restore' | 'apply' | 'temp' | null;
  appearance: AppearanceConfig;
  onToggleThemeMode: () => void;
  onSelectAccentColor: (color: AccentColorId) => void;
  onToggleStarfield: () => void;
}

const SECTION_LABELS: Record<NavSection, string> = {
  overview: 'Visão Geral',
  temp: 'Limpeza de Temporários',
  cs2: 'Counter-Strike 2',
  power: 'Plano de Energia',
  windows: 'Otimizações do Windows',
  export: 'Scripts & Auditoria',
};

const SUBSECTION_LABELS: Record<string, string> = {
  launch: 'Opções de Inicialização',
  autoexec: 'Construtor de autoexec',
  system: 'Sistema para cs2.exe',
  schemes: 'Esquema Principal',
  tweaks: 'Parâmetros Avançados',
  'Arquivos Temporários do Sistema': 'Arquivos do Sistema',
  'Caches de Shaders e GPU': 'Caches GPU & Shader',
  'Caches de Atualização e Rede': 'Atualização & Rede',
  'Gráficos & Agendamento': 'Gráficos & Agendamento',
  'Rede & Jitter Competitivo': 'Rede & Jitter',
  'Sistema, Serviços & Interface': 'Sistema, Serviços & UI',
};

function getSubLabel(section: NavSection, subSections: SubSectionSelection): string | null {
  if (section === 'cs2') return SUBSECTION_LABELS[subSections.cs2] ?? null;
  if (section === 'power') return SUBSECTION_LABELS[subSections.power] ?? null;
  if (section === 'temp' && subSections.temp !== 'all') {
    return SUBSECTION_LABELS[subSections.temp] ?? subSections.temp;
  }
  if (section === 'windows' && subSections.windows !== 'all') {
    return SUBSECTION_LABELS[subSections.windows] ?? subSections.windows;
  }
  return null;
}

export function Header({
  activeSection,
  subSections,
  onOpenMobileMenu,
  onApplyDirect,
  runningAction,
  appearance,
  onToggleThemeMode,
  onSelectAccentColor,
  onToggleStarfield,
}: HeaderProps) {
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const activePreset = getAccentPreset(appearance.accentColor);
  const activeSubLabel = getSubLabel(activeSection, subSections);

  useEffect(() => {
    if (!appearanceOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setAppearanceOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [appearanceOpen]);

  return (
    <header className="sticky top-0 z-30 h-16 bg-[var(--wp-header)] wp-glass-chrome border-b border-[var(--wp-border)] px-4 sm:px-8 flex items-center justify-between gap-4">
      {/* Contextual breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Abrir navegação"
          className="lg:hidden flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--wp-border)] bg-[var(--wp-surface)] text-[var(--wp-text-secondary)] hover:bg-[var(--wp-surface-hover)]"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2 text-sm min-w-0">
          <span className="text-[var(--wp-text-subtle)] whitespace-nowrap hidden sm:inline">
            WinPulse CS2
          </span>
          <span className="text-[var(--wp-border-strong)] hidden sm:inline" aria-hidden="true">
            /
          </span>
          <h1 className="font-display text-base font-semibold text-[var(--wp-text)] truncate">
            {SECTION_LABELS[activeSection]}
          </h1>
          {activeSubLabel && (
            <>
              <span className="text-[var(--wp-border-strong)] hidden md:inline" aria-hidden="true">
                /
              </span>
              <span className="text-xs font-medium text-[var(--wp-accent-text)] truncate hidden md:inline">
                {activeSubLabel}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Appearance Controls + Primary CTA */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Quick Light / Dark Toggle */}
        <button
          type="button"
          onClick={onToggleThemeMode}
          aria-label={
            appearance.themeMode === 'dark'
              ? 'Alternar para tema claro'
              : 'Alternar para tema escuro'
          }
          title={
            appearance.themeMode === 'dark' ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro'
          }
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-medium border border-[var(--wp-border)] bg-[var(--wp-surface)] wp-glass hover:bg-[var(--wp-surface-hover)] text-[var(--wp-text-secondary)] transition-colors whitespace-nowrap"
        >
          {appearance.themeMode === 'dark' ? (
            <>
              <Sun className="h-3.5 w-3.5 text-[var(--wp-accent-text)]" aria-hidden="true" />
              <span className="hidden md:inline">Claro</span>
            </>
          ) : (
            <>
              <Moon className="h-3.5 w-3.5 text-[var(--wp-accent-text)]" aria-hidden="true" />
              <span className="hidden md:inline">Escuro</span>
            </>
          )}
        </button>

        {/* Appearance Popover (7 Preset Colors + Starfield) */}
        <div className="relative" ref={popoverRef}>
          <button
            type="button"
            onClick={() => setAppearanceOpen((prev) => !prev)}
            aria-expanded={appearanceOpen}
            aria-label="Personalizar cores e fundo"
            className="inline-flex items-center gap-2 h-9 px-3 rounded-lg text-xs font-medium border border-[var(--wp-border)] bg-[var(--wp-surface)] wp-glass hover:bg-[var(--wp-surface-hover)] text-[var(--wp-text-secondary)] transition-colors whitespace-nowrap"
          >
            <span
              className="h-3 w-3 rounded-full shrink-0 border border-black/20"
              style={{ backgroundColor: activePreset.swatch }}
              aria-hidden="true"
            />
            <Palette className="h-3.5 w-3.5 hidden sm:block text-[var(--wp-text-muted)]" aria-hidden="true" />
            <span className="hidden sm:inline">Cores</span>
          </button>

          {appearanceOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-xl bg-[var(--wp-surface)] wp-glass border border-[var(--wp-border-strong)] p-4 space-y-4 z-50">
              <div className="space-y-2">
                <div className="text-xs font-semibold text-[var(--wp-text)]">
                  Tonalidade do Programa
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {ACCENT_PRESETS.map((preset) => {
                    const selected = appearance.accentColor === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => onSelectAccentColor(preset.id)}
                        title={preset.label}
                        aria-label={`Cor ${preset.label}`}
                        aria-pressed={selected}
                        className={`h-7 w-7 rounded-full transition-transform duration-150 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wp-accent)] ${
                          selected
                            ? 'scale-110 ring-2 ring-offset-2 ring-[var(--wp-text)] ring-offset-[var(--wp-bg)]'
                            : 'hover:scale-105 opacity-85 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: preset.swatch }}
                      />
                    );
                  })}
                </div>
                <div className="text-[11px] text-[var(--wp-text-muted)]">
                  Cor ativa: <span className="font-medium text-[var(--wp-text)]">{activePreset.label}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-[var(--wp-border)] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-medium text-[var(--wp-text)]">
                  <Sparkles className="h-3.5 w-3.5 text-[var(--wp-accent-text)]" aria-hidden="true" />
                  <span>Fundo Estrelado</span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={appearance.starfieldEnabled}
                  aria-label="Alternar fundo estrelado animado"
                  onClick={onToggleStarfield}
                  className="relative inline-flex h-5 w-10 items-center rounded-full border transition-colors duration-150"
                  style={{
                    backgroundColor: appearance.starfieldEnabled
                      ? 'var(--wp-accent)'
                      : 'var(--wp-switch-off)',
                    borderColor: appearance.starfieldEnabled
                      ? 'var(--wp-accent)'
                      : 'var(--wp-border-strong)',
                  }}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform duration-150 ${
                      appearance.starfieldEnabled ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Single primary CTA */}
        <button
          type="button"
          onClick={onApplyDirect}
          disabled={runningAction !== null}
          className="wp-btn-accent inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150 whitespace-nowrap shrink-0 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wp-accent)]"
        >
          <Play className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">
            {runningAction === 'apply'
              ? 'Aplicando...'
              : 'Aplicar Configurações Diretamente'}
          </span>
          <span className="sm:hidden">
            {runningAction === 'apply' ? 'Aplicando...' : 'Aplicar'}
          </span>
        </button>
      </div>
    </header>
  );
}
