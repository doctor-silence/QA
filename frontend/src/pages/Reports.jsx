import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appClient } from '@/api/client';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { 
  FileText, 
  Download, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Plus,
  Rocket,
  BarChart3
} from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import ReleaseCard from '@/components/reports/ReleaseCard';
import ReleaseDialog from '@/components/reports/ReleaseDialog';
import ReleaseDetails from '@/components/reports/ReleaseDetails';
import WebhookSettings from '@/components/reports/WebhookSettings';
import PublicReportGenerator from '@/components/reports/PublicReportGenerator';
import BugTrackerSettings from '@/components/bugtracker/BugTrackerSettings';
import DefectMappingSection from '@/components/reports/DefectMappingSection';
import { usePermissions } from '@/components/shared/usePermissions';

const COLORS = {
  Pass: '#10B981',
  Fail: '#EF4444',
  Blocked: '#F59E0B',
  Skip: '#6B7280',
  Pending: '#CBD5E1'
};

export default function Reports() {
  const queryClient = useQueryClient();
  const permissions = usePermissions();
  const [selectedPlan, setSelectedPlan] = useState('all');
  const [releaseDialog, setReleaseDialog] = useState(false);
  const [selectedRelease, setSelectedRelease] = useState(null);
  const [detailsRelease, setDetailsRelease] = useState(null);

  const { data: testPlans = [], isLoading: loadingPlans } = useQuery({
    queryKey: ['testPlans'],
    queryFn: () => appClient.entities.TestPlan.list('-created_date')
  });

  const { data: testRuns = [], isLoading: loadingRuns } = useQuery({
    queryKey: ['testRuns'],
    queryFn: () => appClient.entities.TestRun.list()
  });

  const { data: releases = [], isLoading: loadingReleases } = useQuery({
    queryKey: ['releases'],
    queryFn: () => appClient.entities.Release.list('-release_date')
  });

  const { data: testCases = [] } = useQuery({
    queryKey: ['testCases'],
    queryFn: () => appClient.entities.TestCase.list()
  });

  const saveReleaseMutation = useMutation({
    mutationFn: (data) => {
      if (selectedRelease?.id) {
        return appClient.entities.Release.update(selectedRelease.id, data);
      }
      return appClient.entities.Release.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['releases'] });
      setReleaseDialog(false);
      setSelectedRelease(null);
    }
  });

  const filteredRuns = selectedPlan === 'all' 
    ? testRuns 
    : testRuns.filter(r => r.test_plan_id === selectedPlan);

  // Calculate statistics
  const stats = {
    total: filteredRuns.length,
    pass: filteredRuns.filter(r => r.status === 'Pass').length,
    fail: filteredRuns.filter(r => r.status === 'Fail').length,
    blocked: filteredRuns.filter(r => r.status === 'Blocked').length,
    skip: filteredRuns.filter(r => r.status === 'Skip').length,
    pending: filteredRuns.filter(r => r.status === 'Pending').length,
  };

  const passRate = stats.total > 0 
    ? Math.round((stats.pass / (stats.total - stats.pending)) * 100) || 0
    : 0;

  const pieData = [
    { name: 'Pass', value: stats.pass },
    { name: 'Fail', value: stats.fail },
    { name: 'Blocked', value: stats.blocked },
    { name: 'Skip', value: stats.skip },
  ].filter(d => d.value > 0);

  // Group by priority
  const priorityData = ['P1', 'P2', 'P3', 'P4'].map(priority => {
    const runs = filteredRuns.filter(r => r.snapshot?.priority === priority);
    return {
      priority,
      Pass: runs.filter(r => r.status === 'Pass').length,
      Fail: runs.filter(r => r.status === 'Fail').length,
      Blocked: runs.filter(r => r.status === 'Blocked').length,
    };
  });

  // Critical failures (P1/P2)
  const criticalFailures = filteredRuns.filter(
    r => r.status === 'Fail' && ['P1', 'P2'].includes(r.snapshot?.priority)
  );

  // Group by environment
  const environments = [...new Set(filteredRuns.filter(r => r.environment).map(r => 
    `${r.environment.browser} / ${r.environment.os}`
  ))];
  
  const environmentData = environments.map(env => {
    const [browser, os] = env.split(' / ');
    const runs = filteredRuns.filter(r => 
      r.environment?.browser === browser && r.environment?.os === os
    );
    return {
      name: env,
      Pass: runs.filter(r => r.status === 'Pass').length,
      Fail: runs.filter(r => r.status === 'Fail').length,
      Blocked: runs.filter(r => r.status === 'Blocked').length,
    };
  });

  const handleNewRelease = () => {
    setSelectedRelease(null);
    setReleaseDialog(true);
  };

  const handleEditRelease = (release) => {
    setSelectedRelease(release);
    setReleaseDialog(true);
  };

  const handleSaveRelease = (data) => {
    saveReleaseMutation.mutate(data);
  };

  const handleReleaseClick = (release) => {
    setDetailsRelease(release);
  };

  const getReleaseStats = (release) => {
    if (!release.test_plan_id) return { total: 0, pass: 0, fail: 0 };
    const runs = testRuns.filter(r => r.test_plan_id === release.test_plan_id);
    return {
      total: runs.length,
      pass: runs.filter(r => r.status === 'Pass').length,
      fail: runs.filter(r => r.status === 'Fail').length,
    };
  };

  if (loadingPlans || loadingRuns || loadingReleases) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Отчёты</h1>
          <p className="text-muted-foreground mt-1">Отчетность и аналитика</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="releases" className="w-full">
        <div className="flex items-center justify-between mb-6">
          <TabsList className="bg-card border border-border" data-onboarding-reports-tabs>
            <TabsTrigger value="releases" className="gap-2">
              <Rocket className="w-4 h-4" />
              Релизы
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Аналитика
            </TabsTrigger>
            <TabsTrigger value="integrations" className="gap-2">
              <Download className="w-4 h-4" />
              Интеграции
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-3" data-onboarding-reports-plan-filter>
            <Select value={selectedPlan} onValueChange={setSelectedPlan}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Выберите план" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все планы</SelectItem>
                {testPlans.map(plan => (
                  <SelectItem key={plan.id} value={plan.id}>{plan.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {permissions.canManageReleases && (
              <Button 
                className="bg-indigo-600 hover:bg-indigo-700"
                onClick={handleNewRelease}
              >
                <Plus className="w-4 h-4 mr-2" /> Новый релиз
              </Button>
            )}
          </div>
        </div>

        {/* Releases Tab */}
        <TabsContent value="releases" className="space-y-6" data-onboarding-reports-content>
          {releases.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {releases.map(release => {
                const plan = testPlans.find(p => p.id === release.test_plan_id);
                const stats = getReleaseStats(release);
                return (
                  <ReleaseCard
                    key={release.id}
                    release={release}
                    testPlan={plan}
                    stats={stats}
                    onClick={() => handleReleaseClick(release)}
                  />
                );
              })}
            </div>
          ) : (
            <div className="bg-card rounded-2xl border border-border p-12 text-center">
              <Rocket className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">Нет релизов</p>
              <p className="text-sm text-muted-foreground mb-4">Создайте первый релиз для отчетности</p>
              <Button variant="outline" onClick={handleNewRelease}>
                <Plus className="w-4 h-4 mr-2" /> Создать релиз
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6" data-onboarding-reports-content>
          
          {/* Defect Mapping Section */}
          <DefectMappingSection testCases={testCases} testRuns={testRuns} />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Всего тестов</span>
            <FileText className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-3xl font-bold text-foreground mt-2">{stats.total}</p>
        </div>
        
        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Процент прохождения</span>
            {passRate >= 80 ? (
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-500" />
            )}
          </div>
          <p className={cn(
            "text-3xl font-bold mt-2",
            passRate >= 80 ? "text-emerald-600 dark:text-emerald-400" : 
            passRate >= 50 ? "text-amber-600 dark:text-amber-400" : 
            "text-red-600 dark:text-red-400"
          )}>{passRate}%</p>
        </div>

        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Пройдено</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">{stats.pass}</p>
        </div>

        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Провалено</span>
            <XCircle className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-2">{stats.fail}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
          <h3 className="text-lg font-semibold text-foreground mb-4">Распределение статусов</h3>
          {pieData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.name]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-400">
              Нет данных
            </div>
          )}
        </div>

        {/* Bar Chart by Priority */}
        <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
          <h3 className="text-lg font-semibold text-foreground mb-4">По приоритетам</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={priorityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="priority" />
                <YAxis />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
                  }}
                />
                <Bar dataKey="Pass" fill={COLORS.Pass} radius={[4,4,0,0]} />
                <Bar dataKey="Fail" fill={COLORS.Fail} radius={[4,4,0,0]} />
                <Bar dataKey="Blocked" fill={COLORS.Blocked} radius={[4,4,0,0]} />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* By Environment */}
      {environmentData.length > 0 && (
        <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
          <h3 className="text-lg font-semibold text-foreground mb-4">По окружениям</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={environmentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
                  }}
                />
                <Bar dataKey="Pass" fill={COLORS.Pass} radius={[4,4,0,0]} />
                <Bar dataKey="Fail" fill={COLORS.Fail} radius={[4,4,0,0]} />
                <Bar dataKey="Blocked" fill={COLORS.Blocked} radius={[4,4,0,0]} />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Critical Failures */}
      {criticalFailures.length > 0 && (
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h3 className="text-lg font-semibold text-foreground">Критические провалы (P1/P2)</h3>
          </div>
          <div className="divide-y divide-border">
            {criticalFailures.map(run => (
              <div key={run.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Badge variant="outline" className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30">
                    {run.snapshot?.priority}
                  </Badge>
                  <span className="font-medium text-foreground">{run.snapshot?.title}</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {run.executed_at && new Date(run.executed_at).toLocaleDateString('ru-RU')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

          {/* Empty State */}
          {stats.total === 0 && (
            <div className="bg-card rounded-2xl border border-border p-12 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Нет данных для отображения</p>
              <p className="text-sm text-muted-foreground mt-1">Запустите тесты чтобы увидеть отчеты</p>
            </div>
          )}
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-6" data-onboarding-reports-content>
          {permissions.canManageIntegrations ? (
            <div className="space-y-6">
              <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
                <BugTrackerSettings />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
                  <WebhookSettings />
                </div>
                <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
                  <PublicReportGenerator 
                    testPlan={testPlans.find(p => p.id === selectedPlan)} 
                    testRuns={filteredRuns}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-card rounded-2xl border border-border p-12 text-center">
              <p className="text-muted-foreground">У вас нет доступа к настройке интеграций</p>
              <p className="text-sm text-muted-foreground mt-1">Обратитесь к QA Lead</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Release Dialog */}
      <ReleaseDialog
        isOpen={releaseDialog}
        onClose={() => {
          setReleaseDialog(false);
          setSelectedRelease(null);
        }}
        release={selectedRelease}
        onSave={handleSaveRelease}
        testPlans={testPlans}
      />

      {/* Release Details */}
      {detailsRelease && (
        <ReleaseDetails
          release={detailsRelease}
          testPlan={testPlans.find(p => p.id === detailsRelease.test_plan_id)}
          testRuns={testRuns.filter(r => r.test_plan_id === detailsRelease.test_plan_id)}
          onEdit={() => {
            setSelectedRelease(detailsRelease);
            setDetailsRelease(null);
            setReleaseDialog(true);
          }}
          onClose={() => setDetailsRelease(null)}
        />
      )}
    </div>
  );
}