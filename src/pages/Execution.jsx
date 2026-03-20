import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appClient } from '@/api/client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  PlayCircle, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Clock,
  ChevronRight,
  X,
  Sparkles
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import TestRunCard from '@/components/execution/TestRunCard';
import TestRunDrawer from '@/components/execution/TestRunDrawer';
import TimeEstimation from '@/components/execution/TimeEstimation';
import EnvironmentSelector from '@/components/execution/EnvironmentSelector';
import ExploratoryTestingDialog from '@/components/execution/ExploratoryTestingDialog';
import RiskAnalysis from '@/components/execution/RiskAnalysis';
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { usePermissions } from '@/components/shared/usePermissions';

export default function Execution() {
  const queryClient = useQueryClient();
  const permissions = usePermissions();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [newPlanDialog, setNewPlanDialog] = useState(false);
  const [newPlanData, setNewPlanData] = useState({ name: '', description: '' });
  const [addCasesDialog, setAddCasesDialog] = useState(false);
  const [selectedCases, setSelectedCases] = useState([]);
  const [selectedRun, setSelectedRun] = useState(null);
  const [runDrawerOpen, setRunDrawerOpen] = useState(false);
  const [parametrizedMode, setParametrizedMode] = useState(false);
  const [testDataSets, setTestDataSets] = useState([{ label: '', params: {} }]);
  const [environment, setEnvironment] = useState({ browser: 'Chrome', os: 'Windows', version: '' });
  const [exploratoryDialog, setExploratoryDialog] = useState(false);
  const [successDialog, setSuccessDialog] = useState({ open: false, message: '' });

  const { data: testPlans = [], isLoading: loadingPlans } = useQuery({
    queryKey: ['testPlans'],
    queryFn: () => appClient.entities.TestPlan.list('-created_date')
  });

  const { data: testRuns = [], isLoading: loadingRuns } = useQuery({
    queryKey: ['testRuns', selectedPlan?.id],
    queryFn: () => selectedPlan 
      ? appClient.entities.TestRun.filter({ test_plan_id: selectedPlan.id })
      : Promise.resolve([]),
    enabled: !!selectedPlan
  });

  const { data: allTestRuns = [] } = useQuery({
    queryKey: ['allTestRuns'],
    queryFn: () => appClient.entities.TestRun.list()
  });

  const { data: testCases = [] } = useQuery({
    queryKey: ['testCases'],
    queryFn: () => appClient.entities.TestCase.list()
  });

  const createPlanMutation = useMutation({
    mutationFn: (data) => appClient.entities.TestPlan.create({ ...data, status: 'Active' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testPlans'] });
      setNewPlanDialog(false);
      setNewPlanData({ name: '', description: '' });
    }
  });

  const addCasesMutation = useMutation({
    mutationFn: async ({ caseIds, dataSets }) => {
      const runs = [];
      
      for (const caseId of caseIds) {
        const tc = testCases.find(c => c.id === caseId);
        
        if (parametrizedMode && dataSets.length > 0) {
          // Create multiple runs for each data set
          for (const dataSet of dataSets) {
            if (dataSet.label) {
              runs.push({
                test_plan_id: selectedPlan.id,
                test_case_id: caseId,
                snapshot: {
                  title: tc.title,
                  priority: tc.priority,
                  type: tc.type,
                  steps: tc.steps || []
                },
                test_data: {
                  label: dataSet.label,
                  params: dataSet.params || {}
                },
                environment: environment,
                status: 'Pending'
              });
            }
          }
        } else {
          // Single run
          runs.push({
            test_plan_id: selectedPlan.id,
            test_case_id: caseId,
            snapshot: {
              title: tc.title,
              priority: tc.priority,
              type: tc.type,
              steps: tc.steps || []
            },
            environment: environment,
            status: 'Pending'
          });
        }
      }
      
      return appClient.entities.TestRun.bulkCreate(runs);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testRuns'] });
      setAddCasesDialog(false);
      setSelectedCases([]);
      setParametrizedMode(false);
      setTestDataSets([{ label: '', params: {} }]);
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, testRun }) => {
      // Detect flaky behavior
      const allRuns = await appClient.entities.TestRun.filter({ test_case_id: testRun.test_case_id });
      const statusChanges = allRuns.filter(r => r.status !== 'Pending').map(r => r.status);
      
      // If the test has both Pass and Fail statuses, mark as flaky
      if (statusChanges.includes('Pass') && statusChanges.includes('Fail')) {
        const tc = testCases.find(c => c.id === testRun.test_case_id);
        if (tc && !tc.is_flaky) {
          await appClient.entities.TestCase.update(testRun.test_case_id, { 
            is_flaky: true,
            flaky_count: (tc.flaky_count || 0) + 1
          });
        }
      }
      
      return appClient.entities.TestRun.update(id, { 
        status,
        executed_at: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testRuns'] });
      queryClient.invalidateQueries({ queryKey: ['testCases'] });
    }
  });

  const handleStatusChange = (runId, status) => {
    const testRun = testRuns.find(r => r.id === runId);
    updateStatusMutation.mutate({ id: runId, status, testRun });
  };

  const handleRunClick = (run) => {
    setSelectedRun(run);
    setRunDrawerOpen(true);
  };

  const handleRunUpdate = async (updates) => {
    await appClient.entities.TestRun.update(selectedRun.id, updates);
    queryClient.invalidateQueries({ queryKey: ['testRuns'] });
    
    // Check for flaky
    if (updates.status && ['Pass', 'Fail'].includes(updates.status)) {
      const testRun = testRuns.find(r => r.id === selectedRun.id);
      const allRuns = await appClient.entities.TestRun.filter({ test_case_id: testRun.test_case_id });
      const statusChanges = allRuns.filter(r => r.status !== 'Pending').map(r => r.status);
      
      if (statusChanges.includes('Pass') && statusChanges.includes('Fail')) {
        const tc = testCases.find(c => c.id === testRun.test_case_id);
        if (tc && !tc.is_flaky) {
          await appClient.entities.TestCase.update(testRun.test_case_id, { 
            is_flaky: true,
            flaky_count: (tc.flaky_count || 0) + 1
          });
        }
      }
    }
  };

  const toggleCaseSelection = (caseId) => {
    setSelectedCases(prev => 
      prev.includes(caseId) 
        ? prev.filter(id => id !== caseId)
        : [...prev, caseId]
    );
  };

  const getStatusCounts = () => {
    return {
      pass: testRuns.filter(r => r.status === 'Pass').length,
      fail: testRuns.filter(r => r.status === 'Fail').length,
      pending: testRuns.filter(r => r.status === 'Pending').length,
      blocked: testRuns.filter(r => r.status === 'Blocked').length,
    };
  };

  if (loadingPlans) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-4">
            <Skeleton className="h-96 rounded-2xl" />
          </div>
          <div className="col-span-8">
            <Skeleton className="h-96 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Test Execution</h1>
          <p className="text-muted-foreground mt-1">Прогоны тестов</p>
        </div>
        <div className="flex gap-3">
          {permissions.canExecuteTests && (
            <Button 
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              onClick={() => setExploratoryDialog(true)}
            >
              <Sparkles className="w-4 h-4 mr-2" /> Экспресс-тестирование
            </Button>
          )}
          {permissions.canCreateTestPlans && (
            <Button 
              className="bg-indigo-600 hover:bg-indigo-700"
              onClick={() => setNewPlanDialog(true)}
            >
              <Plus className="w-4 h-4 mr-2" /> Новый план
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Test Plans List */}
        <div className="col-span-12 lg:col-span-4">
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold text-foreground">Тест-планы</h3>
            </div>
            <div className="divide-y divide-border">
              {testPlans.map(plan => (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan)}
                  className={cn(
                    "p-4 cursor-pointer transition-colors duration-150 flex items-center justify-between",
                    selectedPlan?.id === plan.id ? "bg-primary/10" : "hover:bg-accent"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <PlayCircle className={cn(
                      "w-5 h-5",
                      plan.status === 'Active' ? "text-indigo-500" : "text-slate-400"
                    )} />
                    <div>
                      <p className="font-medium text-foreground">{plan.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(plan.created_date).toLocaleDateString('ru-RU')}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              ))}
              {testPlans.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  Нет тест-планов
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Test Runs */}
        <div className="col-span-12 lg:col-span-8">
          {selectedPlan ? (
            <div className="space-y-4">
              {/* Plan Header */}
              <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">{selectedPlan.name}</h2>
                    {selectedPlan.description && (
                      <p className="text-muted-foreground mt-1">{selectedPlan.description}</p>
                    )}
                  </div>
                  {permissions.canExecuteTests && (
                    <Button 
                      variant="outline"
                      onClick={() => setAddCasesDialog(true)}
                    >
                      <Plus className="w-4 h-4 mr-2" /> Добавить кейсы
                    </Button>
                  )}
                </div>

                {/* Progress */}
                {testRuns.length > 0 && (
                  <div className="mt-6 flex gap-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm text-foreground">{getStatusCounts().pass} Pass</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-foreground">{getStatusCounts().fail} Fail</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-foreground">{getStatusCounts().pending} Pending</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      <span className="text-sm text-foreground">{getStatusCounts().blocked} Blocked</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Time Estimation */}
              {testRuns.length > 0 && (
                <TimeEstimation testRuns={testRuns} allTestRuns={allTestRuns} />
              )}

              {/* Runs Grid */}
              {loadingRuns ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1,2,3,4].map(i => (
                    <Skeleton key={i} className="h-40 rounded-xl" />
                  ))}
                </div>
              ) : testRuns.length > 0 ? (
                <div className="space-y-4">
                  {/* Group by assigned user */}
                  {['assigned', 'unassigned'].map(group => {
                    const groupRuns = group === 'assigned'
                      ? testRuns.filter(r => r.assigned_to)
                      : testRuns.filter(r => !r.assigned_to);

                    if (groupRuns.length === 0) return null;

                    return (
                      <div key={group}>
                        <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                          {group === 'assigned' ? '👤 Назначенные' : '📋 Не назначенные'}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {groupRuns.map(run => (
                            <TestRunCard
                              key={run.id}
                              testRun={run}
                              onStatusChange={handleStatusChange}
                              onClick={() => handleRunClick(run)}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-card rounded-2xl border border-border p-12 text-center">
                  <PlayCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Добавьте тест-кейсы в план</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-card rounded-2xl border border-border p-12 text-center">
              <PlayCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Выберите тест-план слева</p>
            </div>
          )}
        </div>
      </div>

      {/* New Plan Dialog */}
      <Dialog open={newPlanDialog} onOpenChange={setNewPlanDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Новый тест-план</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="planName">Название</Label>
              <Input
                id="planName"
                value={newPlanData.name}
                onChange={(e) => setNewPlanData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Название тест-плана"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="planDesc">Описание</Label>
              <Textarea
                id="planDesc"
                value={newPlanData.description}
                onChange={(e) => setNewPlanData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Описание..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewPlanDialog(false)}>
              Отмена
            </Button>
            <Button 
              className="bg-indigo-600 hover:bg-indigo-700"
              onClick={() => createPlanMutation.mutate(newPlanData)}
              disabled={!newPlanData.name.trim()}
            >
              Создать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Cases Dialog */}
      <Dialog open={addCasesDialog} onOpenChange={setAddCasesDialog}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Добавить тест-кейсы</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Risk Analysis */}
            <RiskAnalysis 
              onSelectTests={(tests) => setSelectedCases(tests.map(t => t.id))}
              selectedTests={testCases.filter(tc => selectedCases.includes(tc.id))}
            />
            {/* Environment */}
            <div className="bg-accent rounded-lg p-4 border border-border">
              <EnvironmentSelector environment={environment} onChange={setEnvironment} />
            </div>

            {/* Parametrized toggle */}
            <div className="flex items-center gap-3 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
              <input
                type="checkbox"
                id="parametrized"
                checked={parametrizedMode}
                onChange={(e) => setParametrizedMode(e.target.checked)}
                className="w-4 h-4"
              />
              <Label htmlFor="parametrized" className="cursor-pointer text-purple-700 dark:text-purple-400 font-medium">
                📊 Параметризованный запуск (Data-Driven)
              </Label>
            </div>

            {/* Data sets */}
            {parametrizedMode && (
              <div className="bg-accent rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-foreground">Наборы данных</h4>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setTestDataSets([...testDataSets, { label: '', params: {} }])}
                  >
                    <Plus className="w-4 h-4 mr-1" /> Добавить
                  </Button>
                </div>
                {testDataSets.map((dataSet, idx) => (
                  <div key={idx} className="bg-background rounded-lg p-3 space-y-2 border border-border">
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Название (например: Admin, User, Guest)"
                        value={dataSet.label}
                        onChange={(e) => {
                          const updated = [...testDataSets];
                          updated[idx].label = e.target.value;
                          setTestDataSets(updated);
                        }}
                        className="flex-1"
                      />
                      {testDataSets.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setTestDataSets(testDataSets.filter((_, i) => i !== idx))}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <Textarea
                      placeholder='Параметры (JSON): {"username": "admin", "role": "admin"}'
                      value={JSON.stringify(dataSet.params || {})}
                      onChange={(e) => {
                        try {
                          const updated = [...testDataSets];
                          updated[idx].params = JSON.parse(e.target.value || '{}');
                          setTestDataSets(updated);
                        } catch {}
                      }}
                      rows={2}
                      className="font-mono text-xs"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Test cases selection */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {testCases.map(tc => (
                <div
                  key={tc.id}
                  onClick={() => toggleCaseSelection(tc.id)}
                  className={cn(
                    "p-4 rounded-xl border cursor-pointer transition-colors",
                    selectedCases.includes(tc.id)
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card hover:bg-accent"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-5 h-5 rounded border-2 flex items-center justify-center",
                        selectedCases.includes(tc.id)
                          ? "border-primary bg-primary"
                          : "border-border"
                      )}>
                        {selectedCases.includes(tc.id) && (
                          <CheckCircle2 className="w-3 h-3 text-primary-foreground" />
                        )}
                      </div>
                      <span className="font-medium text-foreground">{tc.title}</span>
                    </div>
                    <Badge variant="outline">{tc.priority}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setAddCasesDialog(false);
              setParametrizedMode(false);
              setTestDataSets([{ label: '', params: {} }]);
            }}>
              Отмена
            </Button>
            <Button 
              className="bg-indigo-600 hover:bg-indigo-700"
              onClick={() => addCasesMutation.mutate({ 
                caseIds: selectedCases,
                dataSets: testDataSets
              })}
              disabled={selectedCases.length === 0}
            >
              Добавить ({selectedCases.length})
              {parametrizedMode && testDataSets.filter(d => d.label).length > 0 && 
                ` × ${testDataSets.filter(d => d.label).length}`
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Run Drawer */}
      <TestRunDrawer
        isOpen={runDrawerOpen}
        onClose={() => {
          setRunDrawerOpen(false);
          setSelectedRun(null);
        }}
        testRun={selectedRun}
        onUpdate={handleRunUpdate}
      />

      {/* Exploratory Testing Dialog */}
      <ExploratoryTestingDialog
        isOpen={exploratoryDialog}
        onClose={() => setExploratoryDialog(false)}
        onConvertToTestCase={async (data) => {
          // Create test case from exploratory session
          await appClient.entities.TestCase.create({
            title: data.title,
            steps: data.steps,
            preconditions: data.preconditions,
            priority: 'P3',
            type: 'Manual',
            status: 'Draft'
          });
          queryClient.invalidateQueries({ queryKey: ['testCases'] });
          setExploratoryDialog(false);
          setSuccessDialog({ open: true, message: 'Тест-кейс успешно создан из экспресс-тестирования!' });
        }}
      />

      {/* Success Dialog */}
      <AlertDialog open={successDialog.open} onOpenChange={(open) => setSuccessDialog({ ...successDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              Успешно
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              {successDialog.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>ОК</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}