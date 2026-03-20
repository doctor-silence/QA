import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { appClient } from '@/api/client';
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link2, ExternalLink, Search, AlertTriangle, CheckCircle2, Grid3x3, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export default function Traceability() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('coverage');

  const { data: testCases = [], isLoading } = useQuery({
    queryKey: ['testCases'],
    queryFn: () => appClient.entities.TestCase.list()
  });

  const { data: testRuns = [] } = useQuery({
    queryKey: ['testRuns'],
    queryFn: () => appClient.entities.TestRun.list()
  });

  // Группировка по требованиям
  const requirementsCoverage = useMemo(() => {
    const map = new Map();
    
    testCases.forEach(tc => {
      if (tc.requirements?.length) {
        tc.requirements.forEach(req => {
          const key = req.name;
          if (!map.has(key)) {
            map.set(key, {
              ...req,
              testCases: [],
              passedTests: 0,
              failedTests: 0,
              totalTests: 0
            });
          }
          
          const coverage = map.get(key);
          coverage.testCases.push(tc);
          
          // Подсчет результатов последних прогонов
          const runs = testRuns.filter(r => r.test_case_id === tc.id);
          if (runs.length > 0) {
            const lastRun = runs[runs.length - 1];
            coverage.totalTests++;
            if (lastRun.status === 'Pass') coverage.passedTests++;
            if (lastRun.status === 'Fail') coverage.failedTests++;
          }
        });
      }
    });
    
    return Array.from(map.values());
  }, [testCases, testRuns]);

  const filteredCoverage = requirementsCoverage.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Статистика
  const stats = useMemo(() => {
    const totalReqs = requirementsCoverage.length;
    const coveredReqs = requirementsCoverage.filter(r => r.testCases.length > 0).length;
    const fullyTested = requirementsCoverage.filter(r => r.totalTests > 0 && r.failedTests === 0).length;
    
    return {
      total: totalReqs,
      covered: coveredReqs,
      coveragePercent: totalReqs > 0 ? Math.round((coveredReqs / totalReqs) * 100) : 0,
      fullyTested,
      testingPercent: totalReqs > 0 ? Math.round((fullyTested / totalReqs) * 100) : 0
    };
  }, [requirementsCoverage]);

  // Нестабильные тесты
  const flakyTests = testCases.filter(tc => tc.is_flaky);

  // Матрица покрытия
  const traceabilityMatrix = useMemo(() => {
    // Собираем все уникальные требования
    const allRequirements = new Map();
    testCases.forEach(tc => {
      tc.requirements?.forEach(req => {
        if (!allRequirements.has(req.name)) {
          allRequirements.set(req.name, { ...req, testCases: [] });
        }
        allRequirements.get(req.name).testCases.push({
          id: tc.id,
          title: tc.title,
          priority: tc.priority,
          type: tc.type,
          status: getTestCaseStatus(tc.id)
        });
      });
    });

    return Array.from(allRequirements.values());
  }, [testCases, testRuns]);

  const getTestCaseStatus = (testCaseId) => {
    const runs = testRuns.filter(r => r.test_case_id === testCaseId);
    if (runs.length === 0) return 'not_run';
    const lastRun = runs[runs.length - 1];
    if (lastRun.status === 'Pass') return 'pass';
    if (lastRun.status === 'Fail') return 'fail';
    return 'other';
  };

  // Находим требования без покрытия (белые пятна)
  const uncoveredRequirements = useMemo(() => {
    // Это требования, у которых нет ни одного теста
    return traceabilityMatrix.filter(req => req.testCases.length === 0);
  }, [traceabilityMatrix]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Трассируемость</h1>
        <p className="text-muted-foreground mt-1">Покрытие требований и анализ нестабильных тестов</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Всего требований</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Покрыто тестами</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-indigo-600">{stats.covered}</div>
            <p className="text-xs text-muted-foreground mt-1">{stats.coveragePercent}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Успешно протестировано</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">{stats.fullyTested}</div>
            <p className="text-xs text-muted-foreground mt-1">{stats.testingPercent}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Нестабильные тесты</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">{flakyTests.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="coverage" className="flex items-center gap-2">
            <Link2 className="w-4 h-4" />
            Покрытие
          </TabsTrigger>
          <TabsTrigger value="matrix" className="flex items-center gap-2">
            <Grid3x3 className="w-4 h-4" />
            Матрица
          </TabsTrigger>
        </TabsList>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={activeTab === 'matrix' ? "Поиск по требованиям..." : "Поиск по требованиям..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

      {/* Flaky Tests Warning */}
      {flakyTests.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="w-5 h-5" />
              Нестабильные тесты ({flakyTests.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {flakyTests.slice(0, 5).map(tc => (
                <div key={tc.id} className="flex items-center justify-between p-2 bg-card rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-medium">{tc.title}</span>
                  </div>
                  <Badge variant="outline" className="text-amber-600">
                    Флакает {tc.flaky_count || 0}x
                  </Badge>
                </div>
              ))}
              {flakyTests.length > 5 && (
                <p className="text-xs text-muted-foreground text-center pt-2">
                  И еще {flakyTests.length - 5} тестов...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

        {/* Tab: Coverage View */}
        <TabsContent value="coverage" className="space-y-6">
          <div className="bg-card rounded-2xl border border-border shadow-sm">
            <div className="p-6 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Link2 className="w-5 h-5 text-indigo-500" />
                Покрытие требований
              </h3>
            </div>
            
            <div className="divide-y divide-border">
              {isLoading ? (
                <div className="p-8 text-center text-muted-foreground">Загрузка...</div>
              ) : filteredCoverage.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  Нет связанных требований
                </div>
              ) : (
                filteredCoverage.map((req, index) => {
              const coveragePercent = req.totalTests > 0 
                ? Math.round((req.passedTests / req.totalTests) * 100)
                : 0;
              
              return (
                <div key={index} className="p-6 hover:bg-accent transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={
                          req.type === 'Feature' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                          req.type === 'Bug' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
                          'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                        }>
                          {req.type}
                        </Badge>
                        <h4 className="font-semibold text-foreground">{req.name}</h4>
                        {req.link && (
                          <a 
                            href={req.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-indigo-500 hover:text-indigo-700"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Покрыто {req.testCases.length} тест-кейсами
                      </p>
                    </div>
                    
                    {req.totalTests > 0 && (
                      <div className="flex items-center gap-2">
                        {coveragePercent === 100 ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        ) : req.failedTests > 0 ? (
                          <AlertTriangle className="w-5 h-5 text-red-500" />
                        ) : null}
                        <span className="text-sm font-medium text-foreground">
                          {req.passedTests}/{req.totalTests} Pass
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {req.totalTests > 0 && (
                    <div className="space-y-1">
                      <Progress value={coveragePercent} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{coveragePercent}% успешно</span>
                        <span>{req.failedTests} провалов</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </TabsContent>

    {/* Tab: Traceability Matrix */}
    <TabsContent value="matrix" className="space-y-6">
      {/* White Spots Warning */}
      {uncoveredRequirements.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="w-5 h-5" />
              Белые пятна: {uncoveredRequirements.length} требований без тестов
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {uncoveredRequirements.slice(0, 5).map((req, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-card rounded-lg">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-red-500" />
                    <span className="text-sm font-medium">{req.name}</span>
                  </div>
                  <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
                    {req.type}
                  </Badge>
                </div>
              ))}
              {uncoveredRequirements.length > 5 && (
                <p className="text-xs text-muted-foreground text-center pt-2">
                  И еще {uncoveredRequirements.length - 5} требований...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Matrix Table */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Grid3x3 className="w-5 h-5 text-indigo-500" />
            Матрица трассируемости
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Связь требований с тест-кейсами
          </p>
        </div>
        
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Загрузка...</div>
          ) : traceabilityMatrix.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              Нет требований для отображения
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-accent border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider sticky left-0 bg-accent">
                    Требование
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Тип
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Кол-во тестов
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Тест-кейсы
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Статус
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {traceabilityMatrix
                  .filter(req => req.name.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((req, idx) => {
                    const hasTests = req.testCases.length > 0;
                    const passedTests = req.testCases.filter(tc => tc.status === 'pass').length;
                    const failedTests = req.testCases.filter(tc => tc.status === 'fail').length;
                    const notRunTests = req.testCases.filter(tc => tc.status === 'not_run').length;
                    
                    return (
                      <tr key={idx} className={cn(
                        "hover:bg-accent transition-colors",
                        !hasTests && "bg-red-50/50 dark:bg-red-900/10"
                      )}>
                        <td className="px-6 py-4 sticky left-0 bg-card">
                          <div className="flex items-center gap-2">
                            {!hasTests && (
                              <div className="w-2 h-2 rounded-full bg-red-500" title="Белое пятно" />
                            )}
                            <div>
                              <div className="font-medium text-foreground text-sm">
                                {req.name}
                              </div>
                              {req.link && (
                                <a 
                                  href={req.link} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-xs text-indigo-500 hover:text-indigo-700 flex items-center gap-1 mt-1"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  Ссылка
                                </a>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className={cn(
                            "text-xs",
                            req.type === 'Feature' && 'bg-blue-50 text-blue-600 border-blue-200',
                            req.type === 'Bug' && 'bg-red-50 text-red-600 border-red-200',
                            req.type === 'Story' && 'bg-purple-50 text-purple-600 border-purple-200'
                          )}>
                            {req.type}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={cn(
                            "font-semibold",
                            hasTests ? "text-foreground" : "text-red-600"
                          )}>
                            {req.testCases.length}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {hasTests ? (
                            <div className="space-y-1">
                              {req.testCases.slice(0, 3).map(tc => (
                                <div key={tc.id} className="flex items-center gap-2 text-xs">
                                  <div className={cn(
                                    "w-2 h-2 rounded-full",
                                    tc.status === 'pass' && "bg-emerald-500",
                                    tc.status === 'fail' && "bg-red-500",
                                    tc.status === 'not_run' && "bg-slate-300 dark:bg-slate-600"
                                  )} />
                                  <span className="text-foreground truncate max-w-xs">
                                    {tc.title}
                                  </span>
                                  <Badge variant="outline" className="text-xs">
                                    {tc.priority}
                                  </Badge>
                                </div>
                              ))}
                              {req.testCases.length > 3 && (
                                <div className="text-xs text-muted-foreground pl-4">
                                  +{req.testCases.length - 3} еще...
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-red-500 font-medium">
                              ⚠️ Нет тестов
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {hasTests ? (
                            <div className="flex flex-col gap-1 items-center">
                              <div className="flex gap-2">
                                {passedTests > 0 && (
                                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                                    ✓ {passedTests}
                                  </Badge>
                                )}
                                {failedTests > 0 && (
                                  <Badge className="bg-red-50 text-red-700 border-red-200 text-xs">
                                    ✗ {failedTests}
                                  </Badge>
                                )}
                                {notRunTests > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    - {notRunTests}
                                  </Badge>
                                )}
                              </div>
                              {failedTests === 0 && passedTests > 0 && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              )}
                            </div>
                          ) : (
                            <Badge className="bg-red-50 text-red-600 border-red-200 text-xs">
                              Не покрыто
                            </Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </TabsContent>
  </Tabs>
    </div>
  );
}