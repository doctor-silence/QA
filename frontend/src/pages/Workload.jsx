import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { appClient } from '@/api/client';
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  TrendingUp,
  AlertCircle,
  User
} from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Workload() {
  const [selectedPlan, setSelectedPlan] = useState('all');

  const { data: testPlans = [], isLoading: loadingPlans } = useQuery({
    queryKey: ['testPlans'],
    queryFn: () => appClient.entities.TestPlan.list('-created_date')
  });

  const { data: testRuns = [], isLoading: loadingRuns } = useQuery({
    queryKey: ['testRuns'],
    queryFn: () => appClient.entities.TestRun.list()
  });

  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['users'],
    queryFn: () => appClient.entities.User.list()
  });

  const isLoading = loadingPlans || loadingRuns || loadingUsers;

  // Filter runs by selected plan
  const filteredRuns = selectedPlan === 'all' 
    ? testRuns 
    : testRuns.filter(r => r.test_plan_id === selectedPlan);

  // Calculate workload per user
  const workloadData = users.map(user => {
    const assignedRuns = filteredRuns.filter(r => r.assigned_to === user.email);
    const completed = assignedRuns.filter(r => ['Pass', 'Fail', 'Skip', 'Blocked'].includes(r.status));
    const pending = assignedRuns.filter(r => r.status === 'Pending');
    const inProgress = assignedRuns.filter(r => r.status === 'InProgress');
    
    const passed = assignedRuns.filter(r => r.status === 'Pass');
    const failed = assignedRuns.filter(r => r.status === 'Fail');
    
    const completionRate = assignedRuns.length > 0 
      ? Math.round((completed.length / assignedRuns.length) * 100) 
      : 0;

    // Calculate average time
    const completedWithTime = completed.filter(r => r.duration_seconds > 0);
    const avgTime = completedWithTime.length > 0
      ? Math.round(completedWithTime.reduce((sum, r) => sum + r.duration_seconds, 0) / completedWithTime.length)
      : 0;

    return {
      user,
      total: assignedRuns.length,
      completed: completed.length,
      pending: pending.length,
      inProgress: inProgress.length,
      passed: passed.length,
      failed: failed.length,
      completionRate,
      avgTime
    };
  }).filter(w => w.total > 0); // Only show users with assigned tests

  // Sort by completion rate (least completed first)
  workloadData.sort((a, b) => a.completionRate - b.completionRate);

  // Overall stats
  const totalAssigned = filteredRuns.filter(r => r.assigned_to).length;
  const totalCompleted = filteredRuns.filter(r => r.assigned_to && ['Pass', 'Fail', 'Skip', 'Blocked'].includes(r.status)).length;
  const unassigned = filteredRuns.filter(r => !r.assigned_to).length;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-3 gap-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Нагрузка</h1>
          <p className="text-muted-foreground mt-1">Загрузка команды и планирование ресурсов</p>
        </div>
        <Select value={selectedPlan} onValueChange={setSelectedPlan}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Выберите план" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все планы</SelectItem>
            {testPlans.map(plan => (
              <SelectItem key={plan.id} value={plan.id}>{plan.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Назначено</span>
            <Users className="w-5 h-5 text-indigo-500" />
          </div>
          <p className="text-3xl font-bold text-foreground mt-2">{totalAssigned}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {workloadData.length} {workloadData.length === 1 ? 'тестировщик' : 'тестировщиков'}
          </p>
        </div>

        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Выполнено</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-3xl font-bold text-emerald-600 mt-2">{totalCompleted}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {totalAssigned > 0 ? Math.round((totalCompleted / totalAssigned) * 100) : 0}% от назначенных
          </p>
        </div>

        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Не назначено</span>
            <AlertCircle className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-3xl font-bold text-amber-600 mt-2">{unassigned}</p>
          <p className="text-sm text-muted-foreground mt-1">Требуют распределения</p>
        </div>
      </div>

      {/* Workload by Tester */}
      {workloadData.length > 0 ? (
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-semibold text-foreground">Загрузка по тестировщикам</h3>
          </div>
          <div className="divide-y divide-border">
            {workloadData.map(({ user, total, completed, pending, inProgress, passed, failed, completionRate, avgTime }) => (
              <div key={user.id} className="p-6 hover:bg-accent transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">
                        {user.full_name || user.email}
                      </p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "font-semibold",
                      completionRate >= 80 ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                      completionRate >= 50 ? "bg-blue-50 text-blue-600 border-blue-200" :
                      completionRate >= 20 ? "bg-amber-50 text-amber-600 border-amber-200" :
                      "bg-red-50 text-red-600 border-red-200"
                    )}
                  >
                    {completionRate}%
                  </Badge>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-foreground font-medium">
                      {completed}/{total} тестов выполнено
                    </span>
                    {inProgress > 0 && (
                      <span className="text-blue-600 text-xs">
                        {inProgress} в процессе
                      </span>
                    )}
                  </div>
                  <Progress 
                    value={completionRate} 
                    className="h-3"
                  />
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="flex items-center gap-2 bg-accent rounded-lg px-3 py-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Ожидают</p>
                      <p className="text-sm font-semibold text-foreground">{pending}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg px-3 py-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <div>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400">Пройдено</p>
                      <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">{passed}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <div>
                      <p className="text-xs text-red-600 dark:text-red-400">Провалено</p>
                      <p className="text-sm font-semibold text-red-700 dark:text-red-300">{failed}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg px-3 py-2">
                    <TrendingUp className="w-4 h-4 text-purple-500" />
                    <div>
                      <p className="text-xs text-purple-600 dark:text-purple-400">Ср. время</p>
                      <p className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                        {avgTime > 0 ? `${Math.floor(avgTime / 60)}м ${avgTime % 60}с` : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Нет назначенных тестов</p>
          <p className="text-sm text-muted-foreground mt-1">Назначьте тесты на исполнителей в разделе Execution</p>
        </div>
      )}
    </div>
  );
}