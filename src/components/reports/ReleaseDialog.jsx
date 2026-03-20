import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save, X } from 'lucide-react';

export default function ReleaseDialog({ 
  isOpen, 
  onClose, 
  release, 
  onSave, 
  testPlans 
}) {
  const [formData, setFormData] = useState({
    name: '',
    version: '',
    release_date: '',
    test_plan_id: '',
    status: 'Planned',
    summary: '',
    notes: ''
  });

  useEffect(() => {
    if (release) {
      setFormData({
        name: release.name || '',
        version: release.version || '',
        release_date: release.release_date || '',
        test_plan_id: release.test_plan_id || '',
        status: release.status || 'Planned',
        summary: release.summary || '',
        notes: release.notes || ''
      });
    } else {
      setFormData({
        name: '',
        version: '',
        release_date: new Date().toISOString().split('T')[0],
        test_plan_id: '',
        status: 'Planned',
        summary: '',
        notes: ''
      });
    }
  }, [release, isOpen]);

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {release ? 'Редактировать релиз' : 'Новый релиз'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Название релиза *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Sprint 15 Release"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="version">Версия</Label>
              <Input
                id="version"
                value={formData.version}
                onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
                placeholder="2.0.1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="release_date">Дата релиза *</Label>
              <Input
                id="release_date"
                type="date"
                value={formData.release_date}
                onChange={(e) => setFormData(prev => ({ ...prev, release_date: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Статус</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Planned">Запланирован</SelectItem>
                  <SelectItem value="InProgress">В работе</SelectItem>
                  <SelectItem value="Released">Выпущен</SelectItem>
                  <SelectItem value="Cancelled">Отменён</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="test_plan_id">Тест-план</Label>
            <Select 
              value={formData.test_plan_id} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, test_plan_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите тест-план" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>Без тест-плана</SelectItem>
                {testPlans.map(plan => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="summary">Краткое описание</Label>
            <Textarea
              id="summary"
              value={formData.summary}
              onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
              placeholder="Основные изменения и результаты тестирования..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Дополнительные заметки</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Известные проблемы, замечания..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-2" /> Отмена
          </Button>
          <Button 
            className="bg-indigo-600 hover:bg-indigo-700"
            onClick={handleSave}
            disabled={!formData.name.trim() || !formData.release_date}
          >
            <Save className="w-4 h-4 mr-2" /> Сохранить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}