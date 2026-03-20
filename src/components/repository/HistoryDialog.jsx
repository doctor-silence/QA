import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appClient } from '@/api/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, User, RotateCcw, ChevronDown, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function HistoryDialog({ testCase, open, onOpenChange }) {
  const queryClient = useQueryClient();
  const [expandedVersion, setExpandedVersion] = useState(null);
  const [compareWith, setCompareWith] = useState(null);

  const { data: history = [], isLoading } = useQuery({
    queryKey: ['testCaseHistory', testCase?.id],
    queryFn: () => testCase 
      ? appClient.entities.TestCaseHistory.filter({ test_case_id: testCase.id }, '-version')
      : Promise.resolve([]),
    enabled: !!testCase && open
  });

  const restoreMutation = useMutation({
    mutationFn: async (snapshot) => {
      await appClient.entities.TestCase.update(testCase.id, snapshot);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testCases'] });
      onOpenChange(false);
    }
  });

  const handleRestore = (snapshot) => {
    if (confirm('Восстановить эту версию тест-кейса?')) {
      restoreMutation.mutate(snapshot);
    }
  };

  const getDiff = (oldSnapshot, newSnapshot) => {
    const changes = [];
    
    if (oldSnapshot.title !== newSnapshot.title) {
      changes.push({ field: 'Название', old: oldSnapshot.title, new: newSnapshot.title });
    }
    if (oldSnapshot.priority !== newSnapshot.priority) {
      changes.push({ field: 'Приоритет', old: oldSnapshot.priority, new: newSnapshot.priority });
    }
    if (oldSnapshot.type !== newSnapshot.type) {
      changes.push({ field: 'Тип', old: oldSnapshot.type, new: newSnapshot.type });
    }
    if (oldSnapshot.preconditions !== newSnapshot.preconditions) {
      changes.push({ field: 'Предусловия', old: oldSnapshot.preconditions, new: newSnapshot.preconditions });
    }
    if ((oldSnapshot.steps?.length || 0) !== (newSnapshot.steps?.length || 0)) {
      changes.push({ 
        field: 'Количество шагов', 
        old: oldSnapshot.steps?.length || 0, 
        new: newSnapshot.steps?.length || 0 
      });
    }
    
    return changes;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-500" />
            История изменений: {testCase?.title}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[500px] pr-4">
          {isLoading ? (
            <div className="text-center py-8 text-slate-400">Загрузка...</div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              История изменений пуста
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item, index) => {
                const prevItem = history[index + 1];
                const changes = prevItem ? getDiff(prevItem.snapshot, item.snapshot) : [];
                const isExpanded = expandedVersion === item.version;
                
                return (
                  <div key={item.id} className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="p-4 hover:bg-slate-50 cursor-pointer" onClick={() => setExpandedVersion(isExpanded ? null : item.version)}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className={index === 0 ? "bg-indigo-50 text-indigo-600 border-indigo-200" : ""}>
                            v{item.version}
                            {index === 0 && " (текущая)"}
                          </Badge>
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <User className="w-3 h-3" />
                            {item.changed_by || item.created_by}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Clock className="w-3 h-3" />
                            {format(new Date(item.created_date), 'dd.MM.yyyy HH:mm')}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {index > 0 && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRestore(item.snapshot);
                              }}
                            >
                              <RotateCcw className="w-3 h-3 mr-1" /> Восстановить
                            </Button>
                          )}
                          {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                        </div>
                      </div>
                      
                      {item.change_description && (
                        <p className="text-sm text-slate-600 mb-2">{item.change_description}</p>
                      )}
                      
                      {/* Changes Summary */}
                      {changes.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {changes.map((change, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                              {change.field} изменен
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="border-t border-slate-100 bg-slate-50 p-4 space-y-4">
                        {/* Basic Info */}
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-slate-500">Приоритет:</span>
                            <div className="font-medium mt-1">{item.snapshot.priority}</div>
                          </div>
                          <div>
                            <span className="text-slate-500">Тип:</span>
                            <div className="font-medium mt-1">{item.snapshot.type}</div>
                          </div>
                          <div>
                            <span className="text-slate-500">Шагов:</span>
                            <div className="font-medium mt-1">{item.snapshot.steps?.length || 0}</div>
                          </div>
                        </div>
                        
                        {/* Changes Diff */}
                        {changes.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-slate-700">Изменения:</h4>
                            {changes.map((change, idx) => (
                              <div key={idx} className="bg-white rounded-lg p-3 text-sm">
                                <div className="font-medium text-slate-700 mb-2">{change.field}</div>
                                <div className="space-y-1">
                                  <div className="flex items-start gap-2">
                                    <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 flex-shrink-0">Было</Badge>
                                    <span className="text-slate-600 line-through">{change.old || '-'}</span>
                                  </div>
                                  <div className="flex items-start gap-2">
                                    <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200 flex-shrink-0">Стало</Badge>
                                    <span className="text-slate-800 font-medium">{change.new || '-'}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Steps Preview */}
                        {item.snapshot.steps?.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-slate-700 mb-2">Шаги:</h4>
                            <div className="space-y-2">
                              {item.snapshot.steps.slice(0, 3).map((step, idx) => (
                                <div key={idx} className="bg-white rounded-lg p-2 text-xs">
                                  <div className="flex items-start gap-2">
                                    <span className="text-indigo-600 font-semibold">{idx + 1}.</span>
                                    <div className="flex-1">
                                      <p className="text-slate-700">{step.step}</p>
                                      <p className="text-slate-400 mt-1">✓ {step.expected}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                              {item.snapshot.steps.length > 3 && (
                                <p className="text-xs text-slate-400 text-center">+{item.snapshot.steps.length - 3} еще...</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}