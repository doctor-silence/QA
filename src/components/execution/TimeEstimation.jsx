import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Clock, TrendingUp, Brain } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function TimeEstimation({ testRuns, allTestRuns }) {
  // Calculate average time per test from historical data
  const calculateEstimation = () => {
    // Group completed runs by test_case_id
    const caseTimings = {};
    
    allTestRuns
      .filter(r => r.status !== 'Pending' && r.duration_seconds > 0)
      .forEach(run => {
        if (!caseTimings[run.test_case_id]) {
          caseTimings[run.test_case_id] = [];
        }
        caseTimings[run.test_case_id].push(run.duration_seconds);
      });

    // Calculate average time for each test case
    const averages = Object.entries(caseTimings).reduce((acc, [caseId, times]) => {
      const avg = times.reduce((sum, t) => sum + t, 0) / times.length;
      acc[caseId] = Math.round(avg);
      return acc;
    }, {});

    // Estimate total time for current plan
    let totalEstimated = 0;
    let estimatedCount = 0;
    let pendingCount = 0;

    testRuns.forEach(run => {
      if (run.status === 'Pending') {
        pendingCount++;
        if (averages[run.test_case_id]) {
          totalEstimated += averages[run.test_case_id];
          estimatedCount++;
        }
      }
    });

    // If some tests don't have history, use overall average
    if (pendingCount > estimatedCount) {
      const allAvgTimes = Object.values(averages);
      const overallAvg = allAvgTimes.length > 0
        ? allAvgTimes.reduce((sum, t) => sum + t, 0) / allAvgTimes.length
        : 300; // 5 min default
      
      totalEstimated += (pendingCount - estimatedCount) * overallAvg;
    }

    return {
      totalSeconds: Math.round(totalEstimated),
      confidence: estimatedCount / pendingCount || 0,
      pendingCount
    };
  };

  const estimation = calculateEstimation();
  
  if (estimation.pendingCount === 0) {
    return null;
  }

  const hours = Math.floor(estimation.totalSeconds / 3600);
  const minutes = Math.floor((estimation.totalSeconds % 3600) / 60);
  const confidencePercent = Math.round(estimation.confidence * 100);

  return (
    <div className={cn(
      "rounded-xl p-4 border-2 bg-card",
      confidencePercent >= 70 ? "border-blue-500/30" :
      confidencePercent >= 30 ? "border-purple-500/30" :
      "border-border"
    )}>
      <div className="flex items-start gap-3">
        <div className={cn(
          "p-2 rounded-lg",
          confidencePercent >= 70 ? "bg-blue-500/10" :
          confidencePercent >= 30 ? "bg-purple-500/10" :
          "bg-accent"
        )}>
          <Brain className={cn(
            "w-5 h-5",
            confidencePercent >= 70 ? "text-blue-600 dark:text-blue-400" :
            confidencePercent >= 30 ? "text-purple-600 dark:text-purple-400" :
            "text-muted-foreground"
          )} />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-foreground">AI Прогноз времени</h4>
            <Badge variant="outline" className="text-xs">
              {confidencePercent}% точность
            </Badge>
          </div>
          
          <div className="flex items-baseline gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-2xl font-bold text-foreground">
              {hours > 0 && `${hours}ч `}
              {minutes}мин
            </span>
          </div>
          
          <p className="text-sm text-muted-foreground mt-1">
            {estimation.pendingCount} тестов ожидают выполнения
          </p>

          {confidencePercent < 70 && (
            <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="w-3 h-3" />
              Прогноз улучшится после выполнения большего количества тестов
            </div>
          )}
        </div>
      </div>
    </div>
  );
}