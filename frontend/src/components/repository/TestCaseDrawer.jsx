import React, { useState, useEffect, useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, GripVertical, Save, X, Clock, AlertTriangle, Sparkles, Table } from 'lucide-react';
import { cn } from "@/lib/utils";
import RequirementsSection from './RequirementsSection';
import HistoryDialog from './HistoryDialog';
import SharedStepsManager from '../shared/SharedStepsManager';
import CommentsSection from '../shared/CommentsSection';
import LinkedBugs from './LinkedBugs';
import VariableHelper from './VariableHelper';
import { appClient } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { usePermissions } from '../shared/usePermissions';
import { useModal } from '../shared/ModalProvider';

const TAGS = ['Smoke', 'Regression', 'API', 'UI', 'Integration', 'E2E'];

export default function TestCaseDrawer({ isOpen, onClose, testCase, onSave, folders, initialProjectId = '', initialFolderId = '' }) {
  const permissions = usePermissions();
  const { showAlert } = useModal();
  const [formData, setFormData] = useState({
    title: '',
    project_id: initialProjectId || '',
    folder_id: '',
    priority: 'P3',
    type: 'Manual',
    status: 'Draft',
    reviewer: '',
    review_comment: '',
    bugs: [],
    tags: [],
    preconditions: '',
    steps: [{ step: '', expected: '' }],
    requirements: [],
    is_flaky: false,
    is_data_driven: false,
    test_data_sets: []
  });
  const [showHistory, setShowHistory] = useState(false);
  const [generatingSteps, setGeneratingSteps] = useState(false);

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => appClient.entities.User.list()
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => appClient.entities.Project.list()
  });

  const { data: testCases = [] } = useQuery({
    queryKey: ['testCases'],
    queryFn: () => appClient.entities.TestCase.list()
  });

  useEffect(() => {
    if (testCase) {
      setFormData({
        title: testCase.title || '',
        project_id: testCase.project_id || '',
        folder_id: testCase.folder_id || '',
        priority: testCase.priority || 'P3',
        type: testCase.type || 'Manual',
        status: testCase.status || 'Draft',
        reviewer: testCase.reviewer || '',
        review_comment: testCase.review_comment || '',
        bugs: testCase.bugs || [],
        tags: testCase.tags || [],
        preconditions: testCase.preconditions || '',
        steps: testCase.steps?.length > 0 ? testCase.steps : [{ step: '', expected: '' }],
        requirements: testCase.requirements || [],
        is_flaky: testCase.is_flaky || false,
        is_data_driven: testCase.is_data_driven || false,
        test_data_sets: testCase.test_data_sets || []
      });
    } else {
      setFormData({
        title: '',
        project_id: initialProjectId || '',
        folder_id: initialFolderId || '',
        priority: 'P3',
        type: 'Manual',
        status: 'Draft',
        reviewer: '',
        review_comment: '',
        bugs: [],
        tags: [],
        preconditions: '',
        steps: [{ step: '', expected: '' }],
        requirements: [],
        is_flaky: false,
        is_data_driven: false,
        test_data_sets: []
      });
    }
  }, [initialFolderId, initialProjectId, testCase]);

  const availableFolders = useMemo(() => {
    if (!formData.project_id) {
      return [];
    }

    const folderIds = new Set();

    testCases
      .filter((item) => item.project_id === formData.project_id && item.folder_id)
      .forEach((item) => {
        let currentFolderId = item.folder_id;

        while (currentFolderId) {
          folderIds.add(currentFolderId);
          const currentFolder = folders.find((folder) => folder.id === currentFolderId);
          currentFolderId = currentFolder?.parent_id || null;
        }
      });

    if (testCase?.folder_id) {
      let currentFolderId = testCase.folder_id;

      while (currentFolderId) {
        folderIds.add(currentFolderId);
        const currentFolder = folders.find((folder) => folder.id === currentFolderId);
        currentFolderId = currentFolder?.parent_id || null;
      }
    }

    if (initialFolderId) {
      let currentFolderId = initialFolderId;

      while (currentFolderId) {
        folderIds.add(currentFolderId);
        const currentFolder = folders.find((folder) => folder.id === currentFolderId);
        currentFolderId = currentFolder?.parent_id || null;
      }
    }

    return folders.filter((folder) => folderIds.has(folder.id));
  }, [folders, formData.project_id, initialFolderId, testCase?.folder_id, testCases]);

  useEffect(() => {
    if (!formData.project_id) {
      if (formData.folder_id) {
        setFormData((prev) => ({ ...prev, folder_id: '' }));
      }
      return;
    }

    if (formData.folder_id && !availableFolders.some((folder) => folder.id === formData.folder_id)) {
      setFormData((prev) => ({ ...prev, folder_id: '' }));
    }
  }, [availableFolders, formData.folder_id, formData.project_id]);

  const addStep = () => {
    setFormData(prev => ({
      ...prev,
      steps: [...prev.steps, { step: '', expected: '' }]
    }));
  };

  const insertSharedSteps = (sharedSteps) => {
    setFormData(prev => ({
      ...prev,
      steps: [...prev.steps, ...sharedSteps]
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

  const toggleTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) 
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const handleSave = () => {
    onSave(formData);
  };

  const handleSendToReview = async () => {
    if (!formData.reviewer) {
      await showAlert({
        title: 'Нужно выбрать ревьювера',
        description: 'Перед отправкой на проверку выберите ревьювера.',
        confirmLabel: 'Понятно',
      });
      return;
    }
    onSave({ ...formData, status: 'Under Review' });
  };

  const handleApprove = async () => {
    const user = await appClient.auth.me();
    onSave({
      ...formData,
      status: 'Approved',
      reviewed_at: new Date().toISOString(),
      reviewer: user.email
    });
  };

  const handleReject = async () => {
    if (!formData.review_comment) {
      await showAlert({
        title: 'Нужен комментарий',
        description: 'Добавьте комментарий для отклонения тест-кейса.',
        confirmLabel: 'Понятно',
      });
      return;
    }
    onSave({ ...formData, status: 'Draft' });
  };

  const generateStepsWithAI = async () => {
    if (!formData.title.trim()) {
      await showAlert({
        title: 'Нужно название тест-кейса',
        description: 'Сначала введите название тест-кейса, а потом запускайте генерацию шагов.',
        confirmLabel: 'Понятно',
      });
      return;
    }
    
    setGeneratingSteps(true);
    try {
      const prompt = `Ты QA инженер. Создай детальные шаги тестирования для тест-кейса: "${formData.title}".
Верни массив объектов с полями "step" (действие) и "expected" (ожидаемый результат).
Должно быть 4-7 шагов. Будь конкретным и практичным.`;

      const result = await appClient.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            steps: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  step: { type: "string" },
                  expected: { type: "string" }
                }
              }
            }
          }
        }
      });

      if (result.steps && result.steps.length > 0) {
        setFormData(prev => ({ ...prev, steps: result.steps }));
      }
    } catch (error) {
      await showAlert({
        title: 'Ошибка генерации',
        description: `Ошибка генерации: ${error.message}`,
        confirmLabel: 'Понятно',
      });
    } finally {
      setGeneratingSteps(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="border-b border-slate-100 pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl font-semibold text-slate-800">
              {testCase ? 'Редактировать кейс' : 'Новый тест-кейс'}
            </SheetTitle>
            {testCase && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowHistory(true)}
              >
                <Clock className="w-4 h-4 mr-1" /> История
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Заголовок</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Введите название тест-кейса"
              className="h-11"
            />
          </div>

          {/* Project */}
          <div className="space-y-2">
            <Label>Проект</Label>
            <Select 
              value={formData.project_id} 
              onValueChange={(v) => setFormData(prev => ({ ...prev, project_id: v, folder_id: '' }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите проект" />
              </SelectTrigger>
              <SelectContent>
                {projects.filter(p => p.status === 'active').map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} ({p.key})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Folder, Priority, Type */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Папка</Label>
              <Select 
                value={formData.folder_id} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, folder_id: v }))}
                disabled={!formData.project_id}
              >
                <SelectTrigger>
                  <SelectValue placeholder={formData.project_id ? "Выберите" : "Сначала выберите проект"} />
                </SelectTrigger>
                <SelectContent>
                  {availableFolders.map(f => (
                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Приоритет</Label>
              <Select 
                value={formData.priority} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, priority: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="P1">P1 - Critical</SelectItem>
                  <SelectItem value="P2">P2 - High</SelectItem>
                  <SelectItem value="P3">P3 - Medium</SelectItem>
                  <SelectItem value="P4">P4 - Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Тип</Label>
              <Select 
                value={formData.type} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, type: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Manual">Ручной</SelectItem>
                  <SelectItem value="Automated">Автоматизированный</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Status and Review */}
          <div className="bg-accent rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Label>Статус утверждения</Label>
              {testCase?.status === 'Approved' && testCase?.reviewed_at && (
                <span className="text-xs text-slate-500">
                  Утвержден {new Date(testCase.reviewed_at).toLocaleDateString()}
                </span>
              )}
            </div>
            
            <div className="flex gap-2">
              <Badge 
                variant="outline" 
                className={cn(
                  "flex-1 justify-center py-2",
                  formData.status === 'Draft' && "bg-slate-100 text-slate-700 border-slate-300"
                )}
              >
                📝 Черновик
              </Badge>
              <Badge 
                variant="outline" 
                className={cn(
                  "flex-1 justify-center py-2",
                  formData.status === 'Under Review' && "bg-amber-100 text-amber-700 border-amber-300"
                )}
              >
                🔍 На проверке
              </Badge>
              <Badge 
                variant="outline" 
                className={cn(
                  "flex-1 justify-center py-2",
                  formData.status === 'Approved' && "bg-green-100 text-green-700 border-green-300"
                )}
              >
                ✓ Утвержден
              </Badge>
            </div>

            {formData.status === 'Draft' && permissions.canCreateTestCases && (
              <div className="space-y-2">
                <Label>Отправить на ревью</Label>
                <Select 
                  value={formData.reviewer} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, reviewer: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите ревьювера" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.filter(u => u.qa_role === 'QA Lead' || u.role === 'admin').map(user => (
                      <SelectItem key={user.id} value={user.email}>
                        {user.full_name || user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.status === 'Under Review' && testCase?.reviewer && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  👤 Ревьювер: <strong>{testCase.reviewer}</strong>
                </p>
              </div>
            )}

            {(formData.status === 'Under Review' || formData.status === 'Approved') && (
              <div className="space-y-2">
                <Label>Комментарий ревьювера</Label>
                <Textarea
                  value={formData.review_comment}
                  onChange={(e) => setFormData(prev => ({ ...prev, review_comment: e.target.value }))}
                  placeholder="Добавьте комментарий..."
                  rows={2}
                  disabled={formData.status === 'Approved' && !permissions.canManageStructure}
                />
              </div>
            )}
          </div>

          {/* Linked Bugs */}
          <div className="space-y-2">
            <Label>Связанные баги</Label>
            <LinkedBugs 
              bugs={formData.bugs} 
              onRemove={(idx) => {
                const newBugs = formData.bugs.filter((_, i) => i !== idx);
                setFormData(prev => ({ ...prev, bugs: newBugs }));
              }}
              canEdit={permissions.canCreateTestCases}
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Теги</Label>
            <div className="flex flex-wrap gap-2">
              {TAGS.map(tag => (
                <Badge
                  key={tag}
                  variant="outline"
                  className={cn(
                    "cursor-pointer transition-colors",
                    formData.tags.includes(tag) 
                      ? "bg-indigo-50 text-indigo-600 border-indigo-200" 
                      : "hover:bg-slate-50"
                  )}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* Flaky Flag */}
          {testCase && (
            <div className="flex items-center gap-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <input
                type="checkbox"
                id="is_flaky"
                checked={formData.is_flaky}
                onChange={(e) => setFormData(prev => ({ ...prev, is_flaky: e.target.checked }))}
                className="w-4 h-4"
              />
              <Label htmlFor="is_flaky" className="flex items-center gap-2 cursor-pointer text-amber-700 dark:text-amber-400">
                <AlertTriangle className="w-4 h-4" />
                Нестабильный тест (флакает)
              </Label>
            </div>
          )}

          {/* Requirements */}
          <RequirementsSection
            requirements={formData.requirements}
            onChange={(reqs) => setFormData(prev => ({ ...prev, requirements: reqs }))}
          />

          {/* Preconditions */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="preconditions">Предусловия</Label>
              <VariableHelper onInsert={(v) => setFormData(prev => ({ 
                ...prev, 
                preconditions: (prev.preconditions || '') + v 
              }))} />
            </div>
            <Textarea
              id="preconditions"
              value={formData.preconditions}
              onChange={(e) => setFormData(prev => ({ ...prev, preconditions: e.target.value }))}
              placeholder="Опишите предусловия... Используйте {{variable_name}} для вставки переменных"
              rows={3}
            />
          </div>

          {/* Data-Driven Testing */}
          <div className="space-y-3 p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_data_driven"
                checked={formData.is_data_driven}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setFormData(prev => ({
                    ...prev,
                    is_data_driven: checked,
                    test_data_sets: checked && prev.test_data_sets.length === 0 
                      ? [{ label: '', params: {} }]
                      : prev.test_data_sets
                  }));
                }}
                className="w-4 h-4"
              />
              <Label htmlFor="is_data_driven" className="flex items-center gap-2 cursor-pointer text-purple-700 dark:text-purple-400 font-medium">
                <Table className="w-4 h-4" />
                Параметризация (Data-Driven)
              </Label>
            </div>

            {formData.is_data_driven && (
              <div className="space-y-3 mt-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-purple-700 dark:text-purple-400">Наборы данных для тестирования:</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      test_data_sets: [...prev.test_data_sets, { label: '', params: {} }]
                    }))}
                  >
                    <Plus className="w-4 h-4 mr-1" /> Добавить набор
                  </Button>
                </div>

                <div className="space-y-2">
                  {formData.test_data_sets.map((dataSet, idx) => (
                    <div key={idx} className="bg-background rounded-lg p-3 space-y-2 border border-border">
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="Название набора (например: Валидный пароль)"
                          value={dataSet.label}
                          onChange={(e) => {
                            const updated = [...formData.test_data_sets];
                            updated[idx].label = e.target.value;
                            setFormData(prev => ({ ...prev, test_data_sets: updated }));
                          }}
                          className="flex-1"
                        />
                        {formData.test_data_sets.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setFormData(prev => ({
                              ...prev,
                              test_data_sets: prev.test_data_sets.filter((_, i) => i !== idx)
                            }))}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      <Textarea
                        placeholder='Параметры (JSON): {"username": "admin", "password": "123456"}'
                        value={JSON.stringify(dataSet.params || {})}
                        onChange={(e) => {
                          try {
                            const updated = [...formData.test_data_sets];
                            updated[idx].params = JSON.parse(e.target.value || '{}');
                            setFormData(prev => ({ ...prev, test_data_sets: updated }));
                          } catch {}
                        }}
                        rows={2}
                        className="font-mono text-xs"
                      />
                    </div>
                  ))}
                </div>

                <div className="bg-purple-500/20 rounded-lg p-3 text-xs text-purple-700 dark:text-purple-400">
                  💡 При запуске тест-кейса будет создано {formData.test_data_sets.filter(d => d.label).length} прогонов с разными данными
                </div>
              </div>
            )}
          </div>

          {/* Shared Steps */}
          <SharedStepsManager onInsert={insertSharedSteps} />

          {/* Steps */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Шаги</Label>
              <div className="flex gap-2">
                <VariableHelper onInsert={(v) => {
                  // Insert into the last step
                  const lastIdx = formData.steps.length - 1;
                  if (lastIdx >= 0) {
                    updateStep(lastIdx, 'step', (formData.steps[lastIdx].step || '') + v);
                  }
                }} />
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={generateStepsWithAI}
                  disabled={generatingSteps || !formData.title.trim()}
                >
                  <Sparkles className="w-4 h-4 mr-1" /> 
                  {generatingSteps ? 'Генерация...' : 'AI генератор'}
                </Button>
                <Button variant="ghost" size="sm" onClick={addStep}>
                  <Plus className="w-4 h-4 mr-1" /> Добавить
                </Button>
              </div>
            </div>
            
            <div className="space-y-3">
              {formData.steps.map((step, index) => (
                <div key={index} className="flex gap-3 p-4 bg-accent rounded-xl">
                  <div className="flex items-center text-muted-foreground">
                    <GripVertical className="w-4 h-4" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-muted-foreground uppercase">Шаг {index + 1}</span>
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
                  {formData.steps.length > 1 && (
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="text-muted-foreground hover:text-red-500"
                      onClick={() => removeStep(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="space-y-2 pt-4 border-t border-slate-100">
          {formData.status === 'Draft' && permissions.canCreateTestCases && formData.reviewer && (
            <Button 
              className="w-full bg-amber-600 hover:bg-amber-700" 
              onClick={handleSendToReview}
            >
              🔍 Отправить на ревью
            </Button>
          )}

          {formData.status === 'Under Review' && permissions.canManageStructure && (
            <div className="grid grid-cols-2 gap-2">
              <Button 
                className="bg-green-600 hover:bg-green-700" 
                onClick={handleApprove}
              >
                ✓ Утвердить
              </Button>
              <Button 
                variant="outline" 
                className="border-red-200 text-red-600 hover:bg-red-50"
                onClick={handleReject}
              >
                ✗ Вернуть
              </Button>
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              <X className="w-4 h-4 mr-2" /> Отмена
            </Button>
            <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700" onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" /> Сохранить
            </Button>
          </div>
        </div>

        {/* History Dialog */}
        <HistoryDialog 
          testCase={testCase}
          open={showHistory}
          onOpenChange={setShowHistory}
        />
      </SheetContent>
    </Sheet>
  );
}