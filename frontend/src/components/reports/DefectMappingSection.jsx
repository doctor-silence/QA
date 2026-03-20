import React from 'react';
import { Bug, TrendingUp, AlertCircle, ExternalLink } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const priorityColors = {
  P1: "bg-red-50 text-red-600 border-red-100",
  P2: "bg-amber-50 text-amber-600 border-amber-100",
  P3: "bg-blue-50 text-blue-600 border-blue-100",
  P4: "bg-slate-50 text-slate-500 border-slate-100",
};

export default function DefectMappingSection({ testCases = [], testRuns = [] }) {
  // Calculate bug statistics per test case
  const testCaseBugStats = testCases
    .filter(tc => tc.bugs && tc.bugs.length > 0)
    .map(tc => {
      const failedRuns = testRuns.filter(
        r => r.test_case_id === tc.id && r.status === 'Fail'
      );
      return {
        ...tc,
        bugCount: tc.bugs.length,
        failCount: failedRuns.length,
        defectRate: failedRuns.length
      };
    })
    .sort((a, b) => b.bugCount - a.bugCount)
    .slice(0, 10);

  const totalBugs = testCases.reduce((sum, tc) => sum + (tc.bugs?.length || 0), 0);
  const testCasesWithBugs = testCases.filter(tc => tc.bugs && tc.bugs.length > 0).length;
  const avgBugsPerCase = testCasesWithBugs > 0 ? (totalBugs / testCasesWithBugs).toFixed(1) : 0;

  if (testCaseBugStats.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
          <Bug className="w-5 h-5 text-red-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Анализ корреляции багов (Defect Mapping)</h3>
          <p className="text-sm text-slate-500">Связь между багами и тест-кейсами</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-500">Всего багов</span>
            <Bug className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-2xl font-bold text-slate-800">{totalBugs}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-500">Тест-кейсов с багами</span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-slate-800">{testCasesWithBugs}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-500">Среднее багов/кейс</span>
            <TrendingUp className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-bold text-slate-800">{avgBugsPerCase}</p>
        </div>
      </div>

      {/* Top Buggy Test Cases */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h4 className="text-md font-semibold text-slate-800 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            Самые "бажные" тест-кейсы
          </h4>
          <p className="text-sm text-slate-500 mt-1">
            Тест-кейсы с наибольшим количеством связанных багов - слабые места приложения
          </p>
        </div>

        <div className="divide-y divide-slate-50">
          {testCaseBugStats.map((tc, idx) => (
            <div key={tc.id} className="p-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-mono text-slate-400">#{idx + 1}</span>
                    <Badge variant="outline" className={cn("text-xs", priorityColors[tc.priority])}>
                      {tc.priority}
                    </Badge>
                    <Badge className="bg-red-500 text-white text-xs">
                      <Bug className="w-3 h-3 mr-1" />
                      {tc.bugCount} {tc.bugCount === 1 ? 'баг' : 'багов'}
                    </Badge>
                    {tc.failCount > 0 && (
                      <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 text-xs">
                        {tc.failCount} провалов
                      </Badge>
                    )}
                  </div>
                  <h5 className="font-medium text-slate-800 mb-2">{tc.title}</h5>
                  
                  {/* Bugs List */}
                  <div className="space-y-1 mt-2">
                    {tc.bugs.slice(0, 3).map((bug, bugIdx) => (
                      <div key={bugIdx} className="flex items-center gap-2 text-xs text-slate-600">
                        <Bug className="w-3 h-3 text-red-500" />
                        <span className="font-mono">{bug.bug_id || 'N/A'}</span>
                        <span className="truncate">{bug.title}</span>
                        {bug.url && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 p-0"
                            onClick={() => window.open(bug.url, '_blank')}
                          >
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                    {tc.bugs.length > 3 && (
                      <p className="text-xs text-slate-400 pl-5">
                        + еще {tc.bugs.length - 3} {tc.bugs.length - 3 === 1 ? 'баг' : 'багов'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Visual Indicator */}
                <div className="flex flex-col items-center gap-1">
                  <div 
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg",
                      tc.bugCount >= 5 ? "bg-red-100 text-red-700" :
                      tc.bugCount >= 3 ? "bg-amber-100 text-amber-700" :
                      "bg-orange-100 text-orange-700"
                    )}
                  >
                    {tc.bugCount}
                  </div>
                  <span className="text-xs text-slate-400">багов</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}