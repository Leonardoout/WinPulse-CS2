import { Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { TWEAKS_CATALOG } from '../data/tweaks';
import { RiskLevel, TweakCategory, TweakItem } from '../types/optimizer';
import { TweakRow } from './TweakRow';

interface TweakListViewProps {
  categories: TweakCategory[];
  title: string;
  description: string;
  enabledTweaks: Record<string, boolean>;
  onToggleTweak: (id: string) => void;
  onSetCategoryEnabled: (categories: TweakCategory[], enabled: boolean) => void;
  subgroupFilter?: string;
}

type RiskFilter = 'all' | RiskLevel;

export function TweakListView({
  categories,
  title,
  description,
  enabledTweaks,
  onToggleTweak,
  onSetCategoryEnabled,
  subgroupFilter = 'all',
}: TweakListViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('all');

  const categoryTweaks = useMemo(
    () =>
      TWEAKS_CATALOG.filter(
        (t) =>
          categories.includes(t.category) &&
          (subgroupFilter === 'all' || t.subgroup === subgroupFilter)
      ),
    [categories, subgroupFilter]
  );

  const filteredTweaks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return categoryTweaks.filter((item) => {
      if (riskFilter !== 'all' && item.risk !== riskFilter) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.subgroup.toLowerCase().includes(q) ||
        item.previewCommand.toLowerCase().includes(q)
      );
    });
  }, [categoryTweaks, riskFilter, searchQuery]);

  const groupedTweaks = useMemo(() => {
    const groups: { subgroup: string; items: TweakItem[] }[] = [];
    for (const item of filteredTweaks) {
      let group = groups.find((g) => g.subgroup === item.subgroup);
      if (!group) {
        group = { subgroup: item.subgroup, items: [] };
        groups.push(group);
      }
      group.items.push(item);
    }
    return groups;
  }, [filteredTweaks]);

  const activeCount = categoryTweaks.filter((t) => enabledTweaks[t.id]).length;

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-mono tabular-nums text-[var(--wp-accent-text)]">
            <span>
              {activeCount} de {categoryTweaks.length} selecionados
            </span>
          </div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-[var(--wp-text)]">
            {title}
          </h2>
          <p className="text-sm text-[var(--wp-text-muted)] leading-relaxed">{description}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onSetCategoryEnabled(categories, true)}
            className="px-3.5 py-2 rounded-lg text-xs font-medium border border-[var(--wp-border)] bg-[var(--wp-surface)] wp-glass hover:bg-[var(--wp-surface-hover)] text-[var(--wp-text-secondary)] transition-colors whitespace-nowrap"
          >
            Marcar Todos
          </button>
          <button
            type="button"
            onClick={() => onSetCategoryEnabled(categories, false)}
            className="px-3.5 py-2 rounded-lg text-xs font-medium border border-[var(--wp-border)] bg-[var(--wp-surface)] wp-glass hover:bg-[var(--wp-surface-hover)] text-[var(--wp-text-muted)] hover:text-[var(--wp-text)] transition-colors whitespace-nowrap"
          >
            Desmarcar Todos
          </button>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--wp-text-subtle)]"
            aria-hidden="true"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filtrar ajustes, registro ou comandos..."
            className="w-full h-10 pl-9 pr-9 rounded-lg bg-[var(--wp-surface)] wp-glass border border-[var(--wp-border)] text-sm text-[var(--wp-text)] placeholder:text-[var(--wp-text-subtle)] focus:outline-none focus:border-[var(--wp-accent)]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Limpar busca"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[var(--wp-text-subtle)] hover:text-[var(--wp-text)]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Segmented Risk Filter Control */}
        <div
          role="group"
          aria-label="Filtrar por nível de risco"
          className="inline-flex items-center p-1 rounded-lg bg-[var(--wp-surface)] wp-glass border border-[var(--wp-border)] self-start"
        >
          {(
            [
              { id: 'all', label: 'Todos' },
              { id: 'seguro', label: 'Seguro' },
              { id: 'moderado', label: 'Moderado' },
              { id: 'avancado', label: 'Avançado' },
            ] as { id: RiskFilter; label: string }[]
          ).map((tab) => {
            const active = riskFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setRiskFilter(tab.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-[var(--wp-surface-active)] text-[var(--wp-text)]'
                    : 'text-[var(--wp-text-muted)] hover:text-[var(--wp-text)]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grouped Settings Lists */}
      {groupedTweaks.length === 0 ? (
        <div className="p-10 rounded-lg bg-[var(--wp-surface)] wp-glass border border-[var(--wp-border)] text-center space-y-3">
          <p className="text-sm text-[var(--wp-text-muted)]">
            Nenhum ajuste encontrado para os filtros aplicados.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setRiskFilter('all');
            }}
            className="px-4 py-2 rounded-lg text-xs font-medium bg-[var(--wp-surface-active)] hover:bg-[var(--wp-surface-hover)] text-[var(--wp-text)] transition-colors"
          >
            Limpar Filtros
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedTweaks.map((group) => (
            <section key={group.subgroup} className="space-y-2.5">
              <h3 className="text-xs font-semibold tracking-wide text-[var(--wp-text-muted)]">
                {group.subgroup}
              </h3>
              <div className="bg-[var(--wp-surface)] wp-glass border border-[var(--wp-border)] rounded-lg divide-y divide-[var(--wp-border)] overflow-hidden">
                {group.items.map((item) => (
                  <TweakRow
                    key={item.id}
                    tweak={item}
                    enabled={!!enabledTweaks[item.id]}
                    onToggle={onToggleTweak}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
