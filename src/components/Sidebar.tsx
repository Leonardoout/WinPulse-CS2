import {
  ChevronDown,
  ChevronRight,
  Cpu,
  Crosshair,
  FolderArchive,
  LayoutDashboard,
  Sliders,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { TWEAKS_CATALOG } from '../data/tweaks';
import {
  NavSection,
  OptimizerState,
  SubSectionSelection,
} from '../types/optimizer';

interface SidebarProps {
  activeSection: NavSection;
  subSections: SubSectionSelection;
  onSelectSection: (section: NavSection) => void;
  onSelectSubSection: <K extends keyof SubSectionSelection>(
    section: K,
    sub: SubSectionSelection[K]
  ) => void;
  state: OptimizerState;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

interface SubNavItem {
  id: string;
  label: string;
}

interface NavItemConfig {
  id: NavSection;
  label: string;
  icon: typeof LayoutDashboard;
  countText?: string;
  subItems?: SubNavItem[];
}

export function Sidebar({
  activeSection,
  subSections,
  onSelectSection,
  onSelectSubSection,
  state,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    temp: false,
    cs2: true,
    power: false,
    windows: false,
  });

  useEffect(() => {
    if (
      activeSection === 'temp' ||
      activeSection === 'cs2' ||
      activeSection === 'power' ||
      activeSection === 'windows'
    ) {
      setExpandedGroups((prev) =>
        prev[activeSection] ? prev : { ...prev, [activeSection]: true }
      );
    }
  }, [activeSection]);

  const countEnabled = (category: string) => {
    const items = TWEAKS_CATALOG.filter((t) => t.category === category);
    const active = items.filter((t) => state.enabledTweaks[t.id]).length;
    return `${active}/${items.length}`;
  };

  const navItems: NavItemConfig[] = [
    { id: 'overview', label: 'Visão Geral', icon: LayoutDashboard },
    {
      id: 'temp',
      label: 'Temporários',
      icon: Trash2,
      countText: countEnabled('temp'),
      subItems: [
        { id: 'all', label: 'Todos os Temporários' },
        { id: 'Arquivos Temporários do Sistema', label: 'Arquivos do Sistema' },
        { id: 'Caches de Shaders e GPU', label: 'Caches GPU & Shader' },
        { id: 'Caches de Atualização e Rede', label: 'Atualização & Rede' },
      ],
    },
    {
      id: 'cs2',
      label: 'Counter-Strike 2',
      icon: Crosshair,
      countText: countEnabled('cs2_sys'),
      subItems: [
        { id: 'launch', label: 'Opções de Inicialização' },
        { id: 'autoexec', label: 'Construtor de autoexec' },
        { id: 'system', label: 'Sistema para cs2.exe' },
      ],
    },
    {
      id: 'power',
      label: 'Plano de Energia',
      icon: Zap,
      countText: countEnabled('power'),
      subItems: [
        { id: 'schemes', label: 'Esquema Principal' },
        { id: 'tweaks', label: 'Parâmetros Avançados' },
      ],
    },
    {
      id: 'windows',
      label: 'Ajustes Windows',
      icon: Sliders,
      countText: countEnabled('windows'),
      subItems: [
        { id: 'all', label: 'Todos os Ajustes' },
        { id: 'Gráficos & Agendamento', label: 'Gráficos & Agendamento' },
        { id: 'Rede & Jitter Competitivo', label: 'Rede & Jitter' },
        { id: 'Sistema, Serviços & Interface', label: 'Sistema, Serviços & UI' },
      ],
    },
    { id: 'export', label: 'Scripts & Auditoria', icon: FolderArchive },
  ];

  const totalEnabled = TWEAKS_CATALOG.filter(
    (t) => state.enabledTweaks[t.id]
  ).length;

  const toggleGroupExpand = (id: NavSection) => {
    setExpandedGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getActiveSubId = (section: NavSection): string | null => {
    if (section === 'temp') return subSections.temp;
    if (section === 'cs2') return subSections.cs2;
    if (section === 'power') return subSections.power;
    if (section === 'windows') return subSections.windows;
    return null;
  };

  const handleSelectSubItem = (section: NavSection, subId: string) => {
    if (section === 'temp') onSelectSubSection('temp', subId);
    else if (section === 'cs2')
      onSelectSubSection('cs2', subId as SubSectionSelection['cs2']);
    else if (section === 'power')
      onSelectSubSection('power', subId as SubSectionSelection['power']);
    else if (section === 'windows') onSelectSubSection('windows', subId);
    onCloseMobile();
  };

  const content = (
    <div className="flex h-full flex-col bg-[var(--wp-sidebar)] wp-glass-chrome border-r border-[var(--wp-border)]">
      {/* Brand header — original Cpu icon */}
      <div className="flex items-center justify-between px-5 h-16 border-b border-[var(--wp-border)]">
        <button
          type="button"
          onClick={() => {
            onSelectSection('overview');
            onCloseMobile();
          }}
          className="flex items-center gap-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wp-accent)] rounded-md"
        >
          <span
            className="flex h-7 w-7 items-center justify-center rounded-md border"
            style={{
              backgroundColor: 'var(--wp-accent-soft)',
              color: 'var(--wp-accent-text)',
              borderColor: 'var(--wp-accent-border)',
            }}
          >
            <Cpu className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="font-display text-base font-bold tracking-tight text-[var(--wp-text)] whitespace-nowrap">
            WinPulse CS2
          </span>
        </button>

        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Fechar menu"
          className="lg:hidden flex h-9 w-9 items-center justify-center rounded-md text-[var(--wp-text-muted)] hover:bg-[var(--wp-surface-hover)] hover:text-[var(--wp-text)]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Navigation with side arrows & separated sub-categories */}
      <nav aria-label="Seções principais" className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          const hasSubItems = Boolean(item.subItems && item.subItems.length > 0);
          const isExpanded = Boolean(expandedGroups[item.id]);
          const activeSubId = getActiveSubId(item.id);

          return (
            <div key={item.id} className="space-y-1">
              <div
                className={`flex items-center rounded-lg transition-colors duration-150 ${
                  isActive
                    ? 'bg-[var(--wp-surface-active)] text-[var(--wp-text)]'
                    : 'text-[var(--wp-text-muted)] hover:bg-[var(--wp-surface-hover)] hover:text-[var(--wp-text)]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    onSelectSection(item.id);
                    if (hasSubItems) {
                      setExpandedGroups((prev) => ({ ...prev, [item.id]: true }));
                    } else {
                      onCloseMobile();
                    }
                  }}
                  className="flex-1 min-w-0 flex items-center justify-between gap-2 pl-3 pr-2 py-2.5 text-sm font-medium text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wp-accent)] rounded-l-lg"
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className="h-4 w-4 shrink-0"
                      style={{
                        color: isActive ? 'var(--wp-accent-text)' : 'var(--wp-text-subtle)',
                      }}
                      aria-hidden="true"
                    />
                    <span className="truncate whitespace-nowrap">{item.label}</span>
                  </span>
                  {item.countText && (
                    <span
                      className="font-mono text-xs tabular-nums shrink-0"
                      style={{
                        color: isActive ? 'var(--wp-accent-text)' : 'var(--wp-text-subtle)',
                      }}
                    >
                      {item.countText}
                    </span>
                  )}
                </button>

                {hasSubItems && (
                  <button
                    type="button"
                    onClick={() => toggleGroupExpand(item.id)}
                    aria-expanded={isExpanded}
                    aria-label={`${isExpanded ? 'Recolher' : 'Expandir'} subseções de ${item.label}`}
                    className="p-2 mr-1 rounded-md text-[var(--wp-text-subtle)] hover:text-[var(--wp-text)] hover:bg-[var(--wp-surface-hover)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wp-accent)]"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                  </button>
                )}
              </div>

              {hasSubItems && isExpanded && item.subItems && (
                <div className="ml-4 pl-2.5 border-l border-[var(--wp-border)] space-y-0.5 py-0.5">
                  {item.subItems.map((sub) => {
                    const subActive = isActive && activeSubId === sub.id;
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => handleSelectSubItem(item.id, sub.id)}
                        className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wp-accent)] ${
                          subActive
                            ? 'bg-[var(--wp-accent-soft)] text-[var(--wp-accent-text)]'
                            : 'text-[var(--wp-text-muted)] hover:bg-[var(--wp-surface-hover)] hover:text-[var(--wp-text)]'
                        }`}
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full shrink-0"
                          style={{
                            backgroundColor: subActive
                              ? 'var(--wp-accent)'
                              : 'var(--wp-text-subtle)',
                            opacity: subActive ? 1 : 0.45,
                          }}
                          aria-hidden="true"
                        />
                        <span className="truncate">{sub.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Bottom concise config summary */}
      <div className="p-4 border-t border-[var(--wp-border)] space-y-2">
        <div className="flex items-center justify-between text-xs text-[var(--wp-text-muted)]">
          <span>Ajustes selecionados</span>
          <span className="font-mono tabular-nums text-[var(--wp-text)] font-medium">
            {totalEnabled} / {TWEAKS_CATALOG.length}
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-[var(--wp-border)] overflow-hidden">
          <div
            className="h-full transition-transform duration-200 origin-left"
            style={{
              backgroundColor: 'var(--wp-accent)',
              transform: `scaleX(${Math.max(0.05, totalEnabled / TWEAKS_CATALOG.length)})`,
            }}
          />
        </div>
        <p className="text-xs text-[var(--wp-text-subtle)]">
          Backup completo do PC:{' '}
          <span className="text-[var(--wp-text-secondary)]">
            {state.fullPcBackup ? 'Ativado' : 'Desativado'}
          </span>
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-[272px] shrink-0 h-screen sticky top-0 z-20">
        {content}
      </aside>

      {/* Mobile slide-over */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/60"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative z-10 w-[272px] max-w-[82vw] h-full">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
