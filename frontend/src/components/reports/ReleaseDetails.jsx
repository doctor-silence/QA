import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Clock,
  Edit,
  ExternalLink
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

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

export default function ReleaseDetails({ release, testPlan, testRuns, onEdit, onClose }) {
  if (!release) return null;

  const stats = {
    total: testRuns.length,
    pass: testRuns.filter(r => r.status === 'Pass').length,
    fail: testRuns.filter(r => r.status === 'Fail').length,
    blocked: testRuns.filter(r => r.status === 'Blocked').length,
    skip: testRuns.filter(r => r.status === 'Skip').length,
    pending: testRuns.filter(r => r.status === 'Pending').length,
  };

  const passRate = stats.total > 0 
    ? Math.round((stats.pass / (stats.total - stats.pending)) * 100) || 0
    : 0;

  const criticalFailures = testRuns.filter(
    r => r.status === 'Fail' && ['P1', 'P2'].includes(r.snapshot?.priority)
  );

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-6" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 p-6 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-slate-800">{release.name}</h2>
              {release.version && (
                <Badge variant="outline" className="text-sm">
                  v{release.version}
                </Badge>
              )}
              <Badge variant="outline" className={cn("font-medium", statusColors[release.status])}>
                {statusLabels[release.status]}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <Calendar className="w-4 h-4" />
              {format(new Date(release.release_date), 'dd.MM.yyyy')}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="w-4 h-4 mr-2" /> Редактировать
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Test Plan Link */}
          {testPlan && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  <div>
                    <p className="text-sm text-slate-500">Связанный тест-план</p>
                    <p className="font-semibold text-slate-800">{testPlan.name}</p>
                  </div>
                </div>
                <Link to={createPageUrl('Execution')}>
                  <Button variant="ghost" size="sm">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* Summary Stats */}
          {stats.total > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <span className="text-sm text-slate-500">Успешно</span>
                </div>
                <p className="text-2xl font-bold text-slate-800">{stats.pass}</p>
              </div>

              <div className="bg-slate-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="w-5 h-5 text-red-500" />
                  <span className="text-sm text-slate-500">Ошибка</span>
                </div>
                <p className="text-2xl font-bold text-slate-800">{stats.fail}</p>
              </div>

              <div className="bg-slate-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <span className="text-sm text-slate-500">Заблокировано</span>
                </div>
                <p className="text-2xl font-bold text-slate-800">{stats.blocked}</p>
              </div>

              <div className="bg-slate-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-slate-400" />
                  <span className="text-sm text-slate-500">Процент прохождения</span>
                </div>
                <p className={cn(
                  "text-2xl font-bold",
                  passRate >= 80 ? "text-emerald-600" : passRate >= 50 ? "text-amber-600" : "text-red-600"
                )}>{passRate}%</p>
              </div>
            </div>
          )}

          {/* Summary */}
          {release.summary && (
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-3">Краткое описание</h3>
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-slate-700 whitespace-pre-wrap">{release.summary}</p>
              </div>
            </div>
          )}

          {/* Critical Failures */}
          {criticalFailures.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <h3 className="text-lg font-semibold text-slate-800">
                  Критические провалы ({criticalFailures.length})
                </h3>
              </div>
              <div className="space-y-2">
                {criticalFailures.map(run => (
                  <div key={run.id} className="bg-red-50 border border-red-100 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200">
                        {run.snapshot?.priority}
                      </Badge>
                      <span className="font-medium text-slate-700">{run.snapshot?.title}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {release.notes && (
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-3">Дополнительные заметки</h3>
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-slate-700 whitespace-pre-wrap">{release.notes}</p>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="pt-4 border-t border-slate-100">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500">Создан:</span>
                <span className="ml-2 text-slate-700">
                  {format(new Date(release.created_date), 'dd.MM.yyyy HH:mm')}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Автор:</span>
                <span className="ml-2 text-slate-700">{release.created_by}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}