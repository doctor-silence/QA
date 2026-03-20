import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appClient } from '@/api/client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Edit2, Copy } from 'lucide-react';

export default function SharedStepsManager({ onInsert }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    steps: [{ step: '', expected: '' }]
  });
  const queryClient = useQueryClient();

  const { data: sharedSteps = [] } = useQuery({
    queryKey: ['sharedSteps'],
    queryFn: () => appClient.entities.SharedStep.list()
  });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (editMode) {
        return appClient.entities.SharedStep.update(editMode, data);
      }
      return appClient.entities.SharedStep.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sharedSteps'] });
      setDialogOpen(false);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => appClient.entities.SharedStep.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sharedSteps'] })
  });

  const resetForm = () => {
    setFormData({ name: '', description: '', category: '', steps: [{ step: '', expected: '' }] });
    setEditMode(null);
  };

  const handleEdit = (sharedStep) => {
    setFormData({
      name: sharedStep.name,
      description: sharedStep.description || '',
      category: sharedStep.category || '',
      steps: sharedStep.steps
    });
    setEditMode(sharedStep.id);
    setDialogOpen(true);
  };

  const handleInsert = (sharedStep) => {
    if (onInsert) {
      onInsert(sharedStep.steps);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground">Общие шаги (Shared Steps)</h4>
        <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-1" /> Создать
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
        {sharedSteps.map(shared => (
          <div key={shared.id} className="bg-accent rounded-lg p-3 flex items-start justify-between gap-2 border border-border">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h5 className="text-sm font-medium text-foreground">{shared.name}</h5>
                {shared.category && (
                  <Badge variant="outline" className="text-xs">{shared.category}</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{shared.steps?.length || 0} шагов</p>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => handleInsert(shared)}
              >
                <Copy className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => handleEdit(shared)}
              >
                <Edit2 className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-red-500"
                onClick={() => deleteMutation.mutate(shared.id)}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
        {sharedSteps.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">Общих шагов нет</p>
        )}
      </div>

      {/* Edit/Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editMode ? 'Редактировать' : 'Создать'} общий блок шагов</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="Название (например: Авторизация)"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
              <Input
                placeholder="Категория (Auth, Setup, Cleanup)"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              />
            </div>
            
            <Textarea
              placeholder="Описание блока..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={2}
            />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">Шаги</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    steps: [...prev.steps, { step: '', expected: '' }]
                  }))}
                >
                  <Plus className="w-4 h-4 mr-1" /> Добавить
                </Button>
              </div>
              
              {formData.steps.map((step, idx) => (
                <div key={idx} className="bg-accent rounded-lg p-3 space-y-2 border border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">Шаг {idx + 1}</span>
                    {formData.steps.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          steps: prev.steps.filter((_, i) => i !== idx)
                        }))}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                  <Input
                    placeholder="Действие"
                    value={step.step}
                    onChange={(e) => {
                      const updated = [...formData.steps];
                      updated[idx].step = e.target.value;
                      setFormData(prev => ({ ...prev, steps: updated }));
                    }}
                  />
                  <Input
                    placeholder="Ожидаемый результат"
                    value={step.expected}
                    onChange={(e) => {
                      const updated = [...formData.steps];
                      updated[idx].expected = e.target.value;
                      setFormData(prev => ({ ...prev, steps: updated }));
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setDialogOpen(false);
              resetForm();
            }}>
              Отмена
            </Button>
            <Button
              onClick={() => saveMutation.mutate(formData)}
              disabled={!formData.name.trim() || formData.steps.length === 0}
            >
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}