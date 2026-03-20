import React from 'react';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { FileText, Zap, AlertTriangle, Table, Bug } from 'lucide-react';
import { Checkbox } from "@/components/ui/checkbox";

const priorityColors = {
  P1: "bg-red-50 text-red-600 border-red-100",
  P2: "bg-amber-50 text-amber-600 border-amber-100",
  P3: "bg-blue-50 text-blue-600 border-blue-100",
  P4: "bg-slate-50 text-slate-500 border-slate-100",
};

const statusConfig = {
  Draft: { label: "📝 Черновик", color: "bg-slate-100 text-slate-600 border-slate-200" },
  "Under Review": { label: "🔍 На проверке", color: "bg-amber-100 text-amber-700 border-amber-200" },
  Approved: { label: "✓ Утвержден", color: "bg-green-100 text-green-700 border-green-200" },
};

export default function TestCaseTable({ testCases, onSelect, selectedId, selectedIds = [], onToggleSelect, bulkMode = false }) {
  if (testCases.length === 0) {
    return (
      <div className="bg-card rounded-2xl border border-border shadow-sm p-12 text-center">
        <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Нет тест-кейсов в этой папке</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-accent/50">
            {bulkMode && (
              <th className="px-6 py-4 w-12"></th>
            )}
            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">ID</th>
            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Название</th>
            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Статус</th>
            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Приоритет</th>
            <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Тип</th>
          </tr>
        </thead>
        <tbody>
          {testCases.map((tc, idx) => (
            <tr 
              key={tc.id}
              onClick={() => !bulkMode && onSelect(tc)}
              className={cn(
                "border-b border-border transition-colors duration-150",
                !bulkMode && "cursor-pointer",
                selectedId === tc.id ? "bg-primary/10" : "hover:bg-accent",
                bulkMode && selectedIds.includes(tc.id) && "bg-primary/10"
              )}
            >
              {bulkMode && (
                <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedIds.includes(tc.id)}
                    onCheckedChange={() => onToggleSelect(tc.id)}
                  />
                </td>
              )}
              <td className="px-6 py-4">
                <span className="text-sm font-mono text-muted-foreground">TC-{String(idx + 1).padStart(4, '0')}</span>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{tc.title}</span>
                  {tc.is_flaky && (
                    <AlertTriangle className="w-3 h-3 text-amber-500" title="Нестабильный тест" />
                  )}
                  {tc.is_data_driven && (
                    <Table className="w-3 h-3 text-purple-500" title="Параметризованный тест" />
                  )}
                  {tc.bugs && tc.bugs.length > 0 && (
                    <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 text-xs">
                      <Bug className="w-3 h-3 mr-1" />
                      {tc.bugs.length}
                    </Badge>
                  )}
                  {tc.is_data_driven && tc.test_data_sets?.length > 0 && (
                    <Badge variant="outline" className="bg-purple-50 text-purple-600 border-purple-200 text-xs">
                      {tc.test_data_sets.length} наборов
                    </Badge>
                  )}
                </div>
              </td>
              <td className="px-6 py-4">
                <Badge 
                  variant="outline" 
                  className={cn("text-xs font-medium", statusConfig[tc.status || 'Draft']?.color)}
                >
                  {statusConfig[tc.status || 'Draft']?.label}
                </Badge>
              </td>
              <td className="px-6 py-4">
                <Badge variant="outline" className={cn("font-medium", priorityColors[tc.priority])}>
                  {tc.priority}
                </Badge>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  {tc.type === 'Automated' ? (
                    <Zap className="w-4 h-4 text-amber-500" />
                  ) : (
                    <FileText className="w-4 h-4 text-slate-400" />
                  )}
                  <span className="text-sm text-muted-foreground">{tc.type}</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}