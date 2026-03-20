import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ExternalLink, FileText, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from "@/lib/utils";
import { format } from 'date-fns';

const statusColors = {
  Planned: "bg-blue-50 text-blue-600 border-blue-100",
  InProgress: "bg-amber-50 text-amber-600 border-amber-100",
  Released: "bg-emerald-50 text-emerald-600 border-emerald-100",
  Cancelled: "bg-slate-50 text-slate-500 border-slate-100",
};

const statusLabels = {
  Planned: "Запланирован",
  InProgress: "В работе",
  Released: "Выпущен",
  Cancelled: "Отменён",
};

export default function ReleaseCard({ release, testPlan, stats, onClick }) {
  const passRate = stats?.total > 0 
    ? Math.round((stats.pass / stats.total) * 100) 
    : 0;

  return (
    <div 
      className="bg-card rounded-xl border border-border p-5 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-foreground">{release.name}</h3>
            {release.version && (
              <Badge variant="outline" className="text-xs">
                v{release.version}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            {format(new Date(release.release_date), 'dd.MM.yyyy')}
          </div>
        </div>
        <Badge variant="outline" className={cn("font-medium", statusColors[release.status])}>
          {statusLabels[release.status]}
        </Badge>
      </div>

      {testPlan && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-accent rounded-lg">
          <FileText className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-foreground">{testPlan.name}</span>
        </div>
      )}

      {stats && stats.total > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Результаты тестирования</span>
            <span className={cn(
              "font-semibold",
              passRate >= 80 ? "text-emerald-600 dark:text-emerald-400" : 
              passRate >= 50 ? "text-amber-600 dark:text-amber-400" : 
              "text-red-600 dark:text-red-400"
            )}>
              {passRate}% прохождения
            </span>
          </div>
          
          <div className="h-2 bg-accent rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-500"
              style={{ width: `${passRate}%` }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span className="text-xs text-foreground">{stats.pass} успешно</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500" />
              <span className="text-xs text-foreground">{stats.fail} с ошибкой</span>
            </div>
          </div>
        </div>
      )}

      {release.summary && (
        <p className="mt-4 text-sm text-muted-foreground line-clamp-2">{release.summary}</p>
      )}
    </div>
  );
}