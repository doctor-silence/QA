import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertTriangle, MinusCircle, Clock, Monitor } from 'lucide-react';
import { cn } from "@/lib/utils";

const statusConfig = {
  Pending: { icon: Clock, color: "text-slate-400", bg: "bg-slate-50", label: "Ожидание" },
  Pass: { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50", label: "Пройден" },
  Fail: { icon: XCircle, color: "text-red-500", bg: "bg-red-50", label: "Провален" },
  Blocked: { icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-50", label: "Блокирован" },
  Skip: { icon: MinusCircle, color: "text-slate-400", bg: "bg-slate-50", label: "Пропущен" },
};

const priorityColors = {
  P1: "bg-red-50 text-red-600 border-red-100",
  P2: "bg-amber-50 text-amber-600 border-amber-100",
  P3: "bg-blue-50 text-blue-600 border-blue-100",
  P4: "bg-slate-50 text-slate-500 border-slate-100",
};

export default function TestRunCard({ testRun, onStatusChange, onClick }) {
  const snapshot = testRun.snapshot || {};
  const currentStatus = statusConfig[testRun.status] || statusConfig.Pending;
  const StatusIcon = currentStatus.icon;

  return (
    <div 
      className={cn(
        "bg-card rounded-xl border border-border p-5 transition-all duration-200 hover:shadow-md cursor-pointer",
        testRun.status === 'Pass' && "border-l-4 border-l-emerald-400",
        testRun.status === 'Fail' && "border-l-4 border-l-red-400",
        testRun.status === 'Blocked' && "border-l-4 border-l-amber-400",
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <Badge variant="outline" className={cn("font-medium text-xs", priorityColors[snapshot.priority])}>
              {snapshot.priority}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {snapshot.type}
            </Badge>
            {testRun.test_data?.label && (
              <Badge variant="outline" className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30 text-xs">
                📊 {testRun.test_data.label}
              </Badge>
            )}
            {testRun.environment && (
              <Badge variant="outline" className="text-xs">
                <Monitor className="w-3 h-3 mr-1" />
                {testRun.environment.browser} / {testRun.environment.os}
              </Badge>
            )}
          </div>
          <h4 className="font-medium text-foreground truncate">{snapshot.title}</h4>
          {testRun.assigned_to && (
            <div className="text-xs text-muted-foreground mt-1">
              👤 {testRun.assigned_to}
            </div>
          )}
          
          <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
            {snapshot.steps?.length > 0 && (
              <span>{snapshot.steps.length} шагов</span>
            )}
            {testRun.duration_seconds > 0 && (
              <span>⏱️ {Math.floor(testRun.duration_seconds / 60)}:{String(testRun.duration_seconds % 60).padStart(2, '0')}</span>
            )}
          </div>
        </div>

        <div className={cn("p-2 rounded-lg", currentStatus.bg)}>
          <StatusIcon className={cn("w-5 h-5", currentStatus.color)} />
        </div>
      </div>

      <div className="flex gap-2 mt-4 pt-4 border-t border-border" onClick={(e) => e.stopPropagation()}>
        <Button
          size="sm"
          variant={testRun.status === 'Pass' ? 'default' : 'outline'}
          className={cn(
            "flex-1 h-9",
            testRun.status === 'Pass' && "bg-emerald-500 hover:bg-emerald-600"
          )}
          onClick={() => onStatusChange(testRun.id, 'Pass')}
        >
          <CheckCircle2 className="w-4 h-4 mr-1" /> Pass
        </Button>
        <Button
          size="sm"
          variant={testRun.status === 'Fail' ? 'default' : 'outline'}
          className={cn(
            "flex-1 h-9",
            testRun.status === 'Fail' && "bg-red-500 hover:bg-red-600"
          )}
          onClick={() => onStatusChange(testRun.id, 'Fail')}
        >
          <XCircle className="w-4 h-4 mr-1" /> Fail
        </Button>
        <Button
          size="sm"
          variant={testRun.status === 'Skip' ? 'default' : 'outline'}
          className={cn(
            "flex-1 h-9",
            testRun.status === 'Skip' && "bg-slate-500 hover:bg-slate-600"
          )}
          onClick={() => onStatusChange(testRun.id, 'Skip')}
        >
          <MinusCircle className="w-4 h-4 mr-1" /> Skip
        </Button>
      </div>
    </div>
  );
}