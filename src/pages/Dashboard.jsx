import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { appClient } from '@/api/client';
import { FileText, Zap, CheckCircle2, TrendingUp, Clock } from 'lucide-react';
import StatCard from '@/components/dashboard/StatCard';
import StatusChart from '@/components/dashboard/StatusChart';
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data: testCases = [], isLoading: loadingCases } = useQuery({
    queryKey: ['testCases'],
    queryFn: () => appClient.entities.TestCase.list()
  });

  const { data: testRuns = [], isLoading: loadingRuns } = useQuery({
    queryKey: ['testRuns'],
    queryFn: () => appClient.entities.TestRun.list()
  });

  const { data: testPlans = [], isLoading: loadingPlans } = useQuery({
    queryKey: ['testPlans'],
    queryFn: () => appClient.entities.TestPlan.list()
  });

  const isLoading = loadingCases || loadingRuns || loadingPlans;

  // Calculate stats
  const totalCases = testCases.length;
  const automatedCases = testCases.filter(tc => tc.type === 'Automated').length;
  const automationRate = totalCases > 0 ? Math.round((automatedCases / totalCases) * 100) : 0;

  // Last week runs
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const weekRuns = testRuns.filter(tr => new Date(tr.created_date) >= oneWeekAgo);
  const passedThisWeek = weekRuns.filter(tr => tr.status === 'Pass').length;

  // Average execution time
  const completedRuns = testRuns.filter(r => r.duration_seconds > 0);
  const avgTime = completedRuns.length > 0
    ? Math.round(completedRuns.reduce((sum, r) => sum + r.duration_seconds, 0) / completedRuns.length)
    : 0;
  const avgMinutes = Math.floor(avgTime / 60);
  const avgSeconds = avgTime % 60;

  // Status distribution
  const statusCounts = {
    Pass: testRuns.filter(tr => tr.status === 'Pass').length,
    Fail: testRuns.filter(tr => tr.status === 'Fail').length,
    Blocked: testRuns.filter(tr => tr.status === 'Blocked').length,
    Skip: testRuns.filter(tr => tr.status === 'Skip').length,
    Pending: testRuns.filter(tr => tr.status === 'Pending').length,
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-5 w-72" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Обзор состояния тестирования</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Всего кейсов"
          value={totalCases}
          subtitle={`${testPlans.length} тест-планов`}
          icon={FileText}
          color="indigo"
        />
        <StatCard
          title="Автоматизация"
          value={`${automationRate}%`}
          subtitle={`${automatedCases} из ${totalCases} кейсов`}
          icon={Zap}
          color="amber"
        />
        <StatCard
          title="Пройдено за неделю"
          value={passedThisWeek}
          subtitle={`Из ${weekRuns.length} запусков`}
          icon={CheckCircle2}
          color="green"
        />
        <StatCard
          title="Среднее время"
          value={avgTime > 0 ? `${avgMinutes}:${String(avgSeconds).padStart(2, '0')}` : 'N/A'}
          subtitle="На один тест"
          icon={Clock}
          color="purple"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StatusChart data={statusCounts} />
        
        {/* Recent Activity */}
        <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
          <h3 className="text-lg font-semibold text-foreground mb-4">Последние прогоны</h3>
          <div className="space-y-3">
            {testRuns.slice(0, 5).map((run, idx) => (
              <div key={run.id} className="flex items-center justify-between p-3 bg-accent rounded-xl">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    run.status === 'Pass' ? 'bg-emerald-500' :
                    run.status === 'Fail' ? 'bg-red-500' :
                    run.status === 'Blocked' ? 'bg-amber-500' :
                    'bg-slate-400'
                  }`} />
                  <span className="text-sm font-medium text-foreground truncate max-w-[200px]">
                    {run.snapshot?.title || 'Тест-кейс'}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(run.created_date).toLocaleDateString('ru-RU')}
                </span>
              </div>
            ))}
            {testRuns.length === 0 && (
              <p className="text-center text-muted-foreground py-8">Нет данных о прогонах</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}