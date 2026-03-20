import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appClient } from '@/api/client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Copy,
  RefreshCw,
  Blocks,
  ChevronRight
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";

const CATEGORIES = ['Auth', 'Setup', 'Cleanup', 'Navigation', 'Validation', 'Other'];

export default function SharedSteps() {
  const queryClient = useQueryClient();
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [selectedStep, setSelectedStep] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Other',
    steps: [{ step: '', expected: '' }]
  });

  const { data: sharedSteps = [], isLoading } = useQuery({
    queryKey: ['sharedSteps'],
    queryFn: () => appClient.entities.SharedStep.list('-created_date')
  });

  const createMutation = useMutation({
    mutationFn: (data) => appClient.entities.SharedStep.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sharedSteps'] });
      setEditDrawerOpen(false);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      await appClient.entities.SharedStep.update(id, data);
      
      // Auto-update all test cases that use this shared step
      const allTestCases = await appClient.entities.TestCase.list();
      const casesToUpdate = allTestCases.filter(tc => 
        tc.steps?.some(step => 
          step.shared_step_id === id || 
          step.step?.includes(`[Shared: ${selectedStep?.name}]`)
        )
      );

      for (const testCase of casesToUpdate) {
        const updatedSteps = testCase.steps.map(step => {
          if (step.shared_step_id === id) {
            return { ...step, ...data.steps[0], shared_step_id: id };
          }
          return step;
        });
        await appClient.entities.TestCase.update(testCase.id, { steps: updatedSteps });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sharedSteps'] });
      queryClient.invalidateQueries({ queryKey: ['testCases'] });
      setEditDrawerOpen(false);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => appClient.entities.SharedStep.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sharedSteps'] });
      setDeleteDialog(null);
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'Other',
      steps: [{ step: '', expected: '' }]
    });
    setSelectedStep(null);
  };

  const handleEdit = (step) => {
    setSelectedStep(step);
    setFormData({
      name: step.name,
      description: step.description || '',
      category: step.category || 'Other',
      steps: step.steps || [{ step: '', expected: '' }]
    });
    setEditDrawerOpen(true);
  };

  const handleNew = () => {
    resetForm();
    setEditDrawerOpen(true);
  };

  const handleSave = () => {
    if (selectedStep) {
      updateMutation.mutate({ id: selectedStep.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const addStep = () => {
    setFormData(prev => ({
      ...prev,
      steps: [...prev.steps, { step: '', expected: '' }]
    }));
  };

  const removeStep = (index) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index)
    }));
  };

  const updateStep = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.map((s, i) => i === index ? { ...s, [field]: value } : s)
    }));
  };

  const categoryColors = {
    Auth: 'bg-purple-50 text-purple-600 border-purple-200',
    Setup: 'bg-blue-50 text-blue-600 border-blue-200',
    Cleanup: 'bg-orange-50 text-orange-600 border-orange-200',
    Navigation: 'bg-green-50 text-green-600 border-green-200',
    Validation: 'bg-pink-50 text-pink-600 border-pink-200',
    Other: 'bg-slate-50 text-slate-600 border-slate-200'
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const groupedSteps = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = sharedSteps.filter(s => s.category === cat);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
            <Blocks className="w-8 h-8 text-indigo-500" />
            Библиотека общих шагов
          </h1>
          <p className="text-muted-foreground mt-1">Переиспользуемые блоки для тест-кейсов</p>
        </div>
        <Button 
          className="bg-indigo-600 hover:bg-indigo-700"
          onClick={handleNew}
        >
          <Plus className="w-4 h-4 mr-2" /> Создать блок
        </Button>
      </div>

      {/* Info Banner */}
      <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <RefreshCw className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-indigo-900 dark:text-indigo-100">Автоматическое обновление</h3>
            <p className="text-sm text-indigo-700 dark:text-indigo-300 mt-1">
              При изменении общего шага он автоматически обновится во всех тест-кейсах где используется
            </p>
          </div>
        </div>
      </div>

      {/* Grouped Steps */}
      <div className="space-y-8">
        {CATEGORIES.map(category => {
          const steps = groupedSteps[category];
          if (steps.length === 0) return null;

          return (
            <div key={category}>
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Badge variant="outline" className={categoryColors[category]}>
                  {category}
                </Badge>
                <span className="text-sm text-muted-foreground">({steps.length})</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {steps.map(step => (
                  <div
                    key={step.id}
                    className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground mb-1">{step.name}</h3>
                        {step.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">{step.description}</p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(step)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-600"
                          onClick={() => setDeleteDialog(step)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {step.steps?.slice(0, 3).map((s, idx) => (
                        <div key={idx} className="bg-accent rounded-lg p-2 text-xs">
                          <div className="flex items-start gap-2">
                            <span className="text-primary font-semibold flex-shrink-0">{idx + 1}.</span>
                            <p className="text-foreground line-clamp-1">{s.step}</p>
                          </div>
                        </div>
                      ))}
                      {step.steps?.length > 3 && (
                        <p className="text-xs text-muted-foreground text-center">
                          +{step.steps.length - 3} еще...
                        </p>
                      )}
                    </div>

                    <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
                      {step.steps?.length} {step.steps?.length === 1 ? 'шаг' : 'шагов'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {sharedSteps.length === 0 && (
        <div className="text-center py-16">
          <Blocks className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Нет общих шагов</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={handleNew}
          >
            Создать первый блок
          </Button>
        </div>
      )}

      {/* Edit Drawer */}
      <Sheet open={editDrawerOpen} onOpenChange={setEditDrawerOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader className="border-b border-slate-100 pb-4">
            <SheetTitle>
              {selectedStep ? 'Редактировать блок' : 'Новый общий блок'}
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-6 py-6">
            <div className="space-y-2">
              <Label>Название блока</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Например: Авторизация под админом"
              />
            </div>

            <div className="space-y-2">
              <Label>Описание</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Краткое описание..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Категория</Label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(cat => (
                  <Badge
                    key={cat}
                    variant="outline"
                    className={`cursor-pointer ${
                      formData.category === cat ? categoryColors[cat] : 'hover:bg-slate-50'
                    }`}
                    onClick={() => setFormData(prev => ({ ...prev, category: cat }))}
                  >
                    {cat}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Шаги блока</Label>
                <Button variant="ghost" size="sm" onClick={addStep}>
                  <Plus className="w-4 h-4 mr-1" /> Добавить
                </Button>
              </div>

              {formData.steps.map((step, index) => (
                <div key={index} className="bg-accent rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">Шаг {index + 1}</span>
                    {formData.steps.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => removeStep(index)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                  <Input
                    value={step.step}
                    onChange={(e) => updateStep(index, 'step', e.target.value)}
                    placeholder="Действие"
                  />
                  <Input
                    value={step.expected}
                    onChange={(e) => updateStep(index, 'expected', e.target.value)}
                    placeholder="Ожидаемый результат"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => {
                setEditDrawerOpen(false);
                resetForm();
              }}
            >
              Отмена
            </Button>
            <Button 
              className="flex-1 bg-indigo-600 hover:bg-indigo-700"
              onClick={handleSave}
              disabled={!formData.name.trim() || formData.steps.length === 0}
            >
              Сохранить
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Dialog */}
      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить общий блок?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Блок "{deleteDialog?.name}" будет удален. Тест-кейсы, использующие этот блок, сохранят шаги, но потеряют связь с блоком.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(null)}>
              Отмена
            </Button>
            <Button 
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteMutation.mutate(deleteDialog.id)}
            >
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}