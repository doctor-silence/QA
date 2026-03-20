import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { appClient } from '@/api/client';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Sparkles, TrendingUp, Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function RiskAnalysis({ onSelectTests, selectedTests = [] }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [recommendations, setRecommendations] = useState(null);

  const { data: testCases = [] } = useQuery({
    queryKey: ['testCases'],
    queryFn: () => appClient.entities.TestCase.list()
  });

  const { data: testRuns = [] } = useQuery({
    queryKey: ['testRuns'],
    queryFn: () => appClient.entities.TestRun.list()
  });

  // Анализ рисков на основе исторических данных
  const riskData = useMemo(() => {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    // Фильтруем раны за последние 3 месяца
    const recentRuns = testRuns.filter(run => {
      const runDate = new Date(run.completed_at || run.created_date);
      return runDate >= threeMonthsAgo;
    });

    // Анализ по каждому тест-кейсу
    const testCaseRisks = testCases.map(tc => {
      const runs = recentRuns.filter(r => r.test_case_id === tc.id);
      const totalRuns = runs.length;
      const failedRuns = runs.filter(r => r.status === 'Fail').length;
      const bugCount = tc.bugs?.length || 0;
      
      const failRate = totalRuns > 0 ? (failedRuns / totalRuns) * 100 : 0;
      
      // Расчет риска: частота падений + количество багов + флакаистость
      const riskScore = 
        (failRate * 2) + 
        (bugCount * 10) + 
        (tc.is_flaky ? 20 : 0) +
        (tc.priority === 'P1' ? 15 : tc.priority === 'P2' ? 10 : 0);

      return {
        testCase: tc,
        totalRuns,
        failedRuns,
        failRate,
        bugCount,
        riskScore,
        isFlaky: tc.is_flaky
      };
    });

    // Сортируем по риску
    testCaseRisks.sort((a, b) => b.riskScore - a.riskScore);

    return {
      highRisk: testCaseRisks.filter(t => t.riskScore >= 30),
      mediumRisk: testCaseRisks.filter(t => t.riskScore >= 15 && t.riskScore < 30),
      total: testCaseRisks
    };
  }, [testCases, testRuns]);

  const analyzeWithAI = async () => {
    setAnalyzing(true);
    try {
      const topRisks = riskData.total.slice(0, 20);
      
      const prompt = `Проанализируй риски для тестирования на основе данных:

${topRisks.map((risk, idx) => `
${idx + 1}. "${risk.testCase.title}"
   - Приоритет: ${risk.testCase.priority}
   - Прогонов: ${risk.totalRuns}, Провалов: ${risk.failedRuns} (${risk.failRate.toFixed(1)}%)
   - Найдено багов: ${risk.bugCount}
   - Флакает: ${risk.isFlaky ? 'Да' : 'Нет'}
   - Риск-скор: ${risk.riskScore.toFixed(1)}
`).join('\n')}

Верни JSON с рекомендациями: какие 10-15 тестов КРИТИЧЕСКИ важно включить в следующий план, почему, и какие модули в зоне риска.`;

      const result = await appClient.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            recommended_test_ids: {
              type: "array",
              items: { type: "string" },
              description: "ID рекомендуемых тестов"
            },
            risk_modules: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  reason: { type: "string" }
                }
              }
            },
            summary: { type: "string" }
          }
        }
      });

      setRecommendations(result);
    } catch (error) {
      console.error('AI analysis failed:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSelectRecommended = () => {
    if (recommendations?.recommended_test_ids) {
      const recommended = testCases.filter(tc => 
        recommendations.recommended_test_ids.includes(tc.id)
      );
      onSelectTests(recommended);
    } else {
      // Fallback: выбираем топ-15 по риску
      const top15 = riskData.total.slice(0, 15).map(r => r.testCase);
      onSelectTests(top15);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-indigo-900">
            <Sparkles className="w-5 h-5" />
            Риск-ориентированное тестирование с ИИ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-indigo-700 mb-4">
            Анализ тестов с высоким риском багов за последние 3 месяца
          </p>
          
          <div className="flex gap-2">
            <Button
              onClick={analyzeWithAI}
              disabled={analyzing}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Анализирую...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Запустить AI-анализ
                </>
              )}
            </Button>

            <Button
              onClick={handleSelectRecommended}
              variant="outline"
              disabled={riskData.highRisk.length === 0}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Выбрать топ-15 рисковых
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-red-600 mb-1">Высокий риск</p>
                <p className="text-2xl font-bold text-red-700">{riskData.highRisk.length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-amber-600 mb-1">Средний риск</p>
                <p className="text-2xl font-bold text-amber-700">{riskData.mediumRisk.length}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-emerald-600 mb-1">Низкий риск</p>
                <p className="text-2xl font-bold text-emerald-700">
                  {riskData.total.length - riskData.highRisk.length - riskData.mediumRisk.length}
                </p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Recommendations */}
      {recommendations && (
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="text-purple-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Рекомендации AI
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-purple-700 mb-3">{recommendations.summary}</p>
              
              {recommendations.risk_modules?.length > 0 && (
                <div className="bg-card rounded-lg p-3 mb-3">
                  <p className="text-xs font-semibold text-purple-900 mb-2">⚠️ Модули в зоне риска:</p>
                  <div className="space-y-2">
                    {recommendations.risk_modules.map((module, idx) => (
                      <div key={idx} className="text-xs">
                        <span className="font-medium text-purple-900">{module.name}:</span>
                        <span className="text-purple-700 ml-1">{module.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-xs text-purple-600">
                ✨ Рекомендовано: {recommendations.recommended_test_ids?.length || 0} тестов
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Risk Tests */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Топ тестов по риску</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {riskData.total.slice(0, 15).map((risk, idx) => {
              const isSelected = selectedTests.some(t => t.id === risk.testCase.id);
              const isRecommended = recommendations?.recommended_test_ids?.includes(risk.testCase.id);
              
              return (
                <div
                  key={risk.testCase.id}
                  className={cn(
                    "flex items-start justify-between p-3 rounded-lg border transition-colors",
                    isSelected && "bg-indigo-50 border-indigo-300",
                    isRecommended && !isSelected && "bg-purple-50 border-purple-200"
                  )}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-muted-foreground">#{idx + 1}</span>
                      <p className="text-sm font-medium text-foreground">{risk.testCase.title}</p>
                      {isRecommended && (
                        <Badge variant="outline" className="bg-purple-100 text-purple-700 text-xs">
                          <Sparkles className="w-3 h-3 mr-1" />
                          AI
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>Приоритет: {risk.testCase.priority}</span>
                      {risk.totalRuns > 0 && (
                        <span className="text-red-600">
                          Провалов: {risk.failedRuns}/{risk.totalRuns} ({risk.failRate.toFixed(0)}%)
                        </span>
                      )}
                      {risk.bugCount > 0 && (
                        <span className="text-amber-600">Багов: {risk.bugCount}</span>
                      )}
                      {risk.isFlaky && (
                        <Badge variant="outline" className="bg-amber-50 text-amber-600 text-xs">
                          Флакает
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        "font-semibold",
                        risk.riskScore >= 30 && "bg-red-100 text-red-700 border-red-300",
                        risk.riskScore >= 15 && risk.riskScore < 30 && "bg-amber-100 text-amber-700 border-amber-300",
                        risk.riskScore < 15 && "bg-emerald-100 text-emerald-700 border-emerald-300"
                      )}
                    >
                      {risk.riskScore.toFixed(0)}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}