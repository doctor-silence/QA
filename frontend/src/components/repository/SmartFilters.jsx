import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, X, Filter } from 'lucide-react';
import { cn } from "@/lib/utils";

const TAGS = ['Smoke', 'Regression', 'API', 'UI', 'Integration', 'E2E'];
const PRIORITIES = ['P1', 'P2', 'P3', 'P4'];

const priorityColors = {
  P1: "bg-red-50 text-red-600 border-red-200 hover:bg-red-100",
  P2: "bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100",
  P3: "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100",
  P4: "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100",
};

export default function SmartFilters({ filters, onChange }) {
  const toggleTag = (tag) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag];
    onChange({ ...filters, tags: newTags });
  };

  const togglePriority = (priority) => {
    const newPriorities = filters.priorities.includes(priority)
      ? filters.priorities.filter(p => p !== priority)
      : [...filters.priorities, priority];
    onChange({ ...filters, priorities: newPriorities });
  };

  const toggleStatus = (status) => {
    const newStatuses = filters.statuses?.includes(status)
      ? filters.statuses.filter(s => s !== status)
      : [...(filters.statuses || []), status];
    onChange({ ...filters, statuses: newStatuses });
  };

  const toggleFlaky = () => {
    onChange({ ...filters, showFlaky: !filters.showFlaky });
  };

  const clearFilters = () => {
    onChange({ tags: [], priorities: [], statuses: [], showFlaky: false });
  };

  const hasActiveFilters = filters.tags.length > 0 || filters.priorities.length > 0 || (filters.statuses?.length > 0) || filters.showFlaky;

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Умные фильтры</h3>
        </div>
        {hasActiveFilters && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={clearFilters}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4 mr-1" /> Сбросить
          </Button>
        )}
      </div>

      {/* Quick Access */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Быстрый доступ</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge
            variant="outline"
            className={cn(
              "cursor-pointer transition-all px-3 py-1.5",
              filters.tags.includes('Smoke')
                ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 shadow-sm"
                : "hover:bg-accent"
            )}
            onClick={() => toggleTag('Smoke')}
          >
            🚀 Smoke набор
          </Badge>
          <Badge
            variant="outline"
            className={cn(
              "cursor-pointer transition-all px-3 py-1.5",
              filters.tags.includes('Regression')
                ? "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border-purple-300 dark:border-purple-800 shadow-sm"
                : "hover:bg-accent"
            )}
            onClick={() => toggleTag('Regression')}
          >
            🔄 Regression
          </Badge>
          <Badge
            variant="outline"
            className={cn(
              "cursor-pointer transition-all px-3 py-1.5",
              filters.showFlaky
                ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800 shadow-sm"
                : "hover:bg-accent"
            )}
            onClick={toggleFlaky}
          >
            <AlertTriangle className="w-3 h-3 mr-1" />
            Флакующие
          </Badge>
        </div>
      </div>

      {/* Tags Filter */}
      <div className="space-y-3">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Теги</span>
        <div className="flex flex-wrap gap-2">
          {TAGS.map(tag => (
            <Badge
              key={tag}
              variant="outline"
              className={cn(
                "cursor-pointer transition-all",
                filters.tags.includes(tag)
                  ? "bg-primary/10 text-primary border-primary/20 shadow-sm"
                  : "hover:bg-accent"
              )}
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      {/* Priority Filter */}
      <div className="space-y-3">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Приоритет</span>
        <div className="flex flex-wrap gap-2">
          {PRIORITIES.map(priority => (
            <Badge
              key={priority}
              variant="outline"
              className={cn(
                "cursor-pointer transition-all font-medium",
                filters.priorities.includes(priority)
                  ? priorityColors[priority] + " shadow-sm"
                  : "hover:bg-accent border-border"
              )}
              onClick={() => togglePriority(priority)}
            >
              {priority}
            </Badge>
          ))}
        </div>
      </div>

      {/* Status Filter */}
      <div className="space-y-3">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Статус</span>
        <div className="flex flex-wrap gap-2">
          <Badge
            variant="outline"
            className={cn(
              "cursor-pointer transition-all",
              filters.statuses?.includes('Draft')
                ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 shadow-sm"
                : "hover:bg-accent"
            )}
            onClick={() => toggleStatus('Draft')}
          >
            📝 Черновик
          </Badge>
          <Badge
            variant="outline"
            className={cn(
              "cursor-pointer transition-all",
              filters.statuses?.includes('Under Review')
                ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800 shadow-sm"
                : "hover:bg-accent"
            )}
            onClick={() => toggleStatus('Under Review')}
          >
            🔍 На проверке
          </Badge>
          <Badge
            variant="outline"
            className={cn(
              "cursor-pointer transition-all",
              filters.statuses?.includes('Approved')
                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-300 dark:border-green-800 shadow-sm"
                : "hover:bg-accent"
            )}
            onClick={() => toggleStatus('Approved')}
          >
            ✓ Утвержден
          </Badge>
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="pt-3 border-t border-border">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium">Активно фильтров:</span>
            <span className="text-primary font-semibold">
              {filters.tags.length + filters.priorities.length + (filters.statuses?.length || 0) + (filters.showFlaky ? 1 : 0)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}