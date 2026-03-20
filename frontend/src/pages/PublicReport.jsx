import React, { useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { appClient } from '@/api/client';
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertTriangle, Clock, MinusCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { cn } from "@/lib/utils";

const statusColors = {
  Pass: '#10B981',
  Fail: '#EF4444',
  Blocked: '#F59E0B',
  Skip: '#6B7280',
  Pending: '#94A3B8'
};

const statusIcons = {
  Pass: CheckCircle2,
  Fail: XCircle,
  Blocked: AlertTriangle,
  Skip: MinusCircle,
  Pending: Clock
};

export default function PublicReport() {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');

  const { data: report, isLoading, error } = useQuery({
    queryKey: ['publicReport', token],
    queryFn: async () => {
      const reports = await appClient.entities.PublicReport.filter({ token });
      if (reports.length === 0) throw new Error('Отчет не найден');
      return reports[0];
    },
    enabled: !!token
  });

  const incrementViewMutation = useMutation({
    mutationFn: (id) => appClient.entities.PublicReport.update(id, { 
      views_count: (report?.views_count || 0) + 1 
    })
  });

  useEffect(() => {
    if (report && !incrementViewMutation.isSuccess) {
      incrementViewMutation.mutate(report.id);
    }
  }, [report]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Загрузка отчета...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Отчет не найден</h1>
          <p className="text-slate-500">Проверьте правильность ссылки или срок действия</p>
        </div>
      </div>
    );
  }

  const snapshot = report.snapshot || {};
  const stats = snapshot.stats || {};
  const runs = snapshot.runs || [];
  const passRate = stats.total > 0 ? Math.round((stats.pass / stats.total) * 100) : 0;

  const chartData = [
    { name: 'Pass', value: stats.pass, color: statusColors.Pass },
    { name: 'Fail', value: stats.fail, color: statusColors.Fail },
    { name: 'Blocked', value: stats.blocked, color: statusColors.Blocked },
    { name: 'Skip', value: stats.skip, color: statusColors.Skip },
    { name: 'Pending', value: stats.pending, color: statusColors.Pending }
  ].filter(item => item.value > 0);

  const isExpired = new Date(report.expires_at) < new Date();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-lg p-8 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">{report.title}</h1>
              <p className="text-slate-500">{snapshot.plan_description}</p>
            </div>
            {isExpired && (
              <Badge variant="outline" className="text-red-500">Отчет истек</Badge>
            )}
          </div>
          
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="text-sm text-slate-500 mb-1">Всего тестов</div>
              <div className="text-2xl font-bold text-slate-800">{stats.total}</div>
            </div>
            <div className="bg-green-50 rounded-xl p-4">
              <div className="text-sm text-green-600 mb-1">Успешно</div>
              <div className="text-2xl font-bold text-green-700">{stats.pass}</div>
            </div>
            <div className="bg-red-50 rounded-xl p-4">
              <div className="text-sm text-red-600 mb-1">Провалено</div>
              <div className="text-2xl font-bold text-red-700">{stats.fail}</div>
            </div>
            <div className="bg-indigo-50 rounded-xl p-4">
              <div className="text-sm text-indigo-600 mb-1">Pass Rate</div>
              <div className="text-2xl font-bold text-indigo-700">{passRate}%</div>
            </div>
          </div>
        </div>

        {/* Chart */}
        {chartData.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-lg p-8 mb-6">
            <h2 className="text-xl font-bold text-slate-800 mb-6">Распределение статусов</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Test Runs */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-lg p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Результаты тестов</h2>
          <div className="space-y-3">
            {runs.map((run, idx) => {
              const StatusIcon = statusIcons[run.status] || Clock;
              return (
                <div key={idx} className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                  <div className={cn("p-2 rounded-lg", 
                    run.status === 'Pass' && "bg-green-50",
                    run.status === 'Fail' && "bg-red-50",
                    run.status === 'Blocked' && "bg-amber-50",
                    run.status === 'Pending' && "bg-slate-50"
                  )}>
                    <StatusIcon className={cn("w-5 h-5", 
                      run.status === 'Pass' && "text-green-500",
                      run.status === 'Fail' && "text-red-500",
                      run.status === 'Blocked' && "text-amber-500",
                      run.status === 'Pending' && "text-slate-400"
                    )} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-slate-800">{run.title}</h4>
                    {run.comment && (
                      <p className="text-sm text-slate-500 mt-1">{run.comment}</p>
                    )}
                  </div>
                  <Badge variant="outline">{run.priority}</Badge>
                  {run.duration && (
                    <span className="text-sm text-slate-500">
                      ⏱️ {Math.floor(run.duration / 60)}:{String(run.duration % 60).padStart(2, '0')}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-slate-400">
          <p>Сгенерировано {new Date(snapshot.generated_at).toLocaleString('ru-RU')}</p>
          <p>Powered by TestFlow QA Management System</p>
        </div>
      </div>
    </div>
  );
}