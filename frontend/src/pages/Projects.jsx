import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appClient } from '@/api/client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Folder, Archive, Edit2, Trash2 } from 'lucide-react';
import { cn, plainTextFromMarkdown, textPreview } from "@/lib/utils";
import { usePermissions } from '../components/shared/usePermissions';
import { useModal } from '../components/shared/ModalProvider';

const COLORS = [
  { name: 'Индиго', value: '#6366f1' },
  { name: 'Синий', value: '#3b82f6' },
  { name: 'Зеленый', value: '#10b981' },
  { name: 'Желтый', value: '#f59e0b' },
  { name: 'Красный', value: '#ef4444' },
  { name: 'Пурпурный', value: '#a855f7' },
  { name: 'Розовый', value: '#ec4899' },
];

export default function Projects() {
  const permissions = usePermissions();
  const { showAlert, showConfirm } = useModal();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    key: '',
    description: '',
    color: '#6366f1',
    status: 'active'
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => appClient.entities.Project.list()
  });

  const { data: testCases = [] } = useQuery({
    queryKey: ['testCases'],
    queryFn: () => appClient.entities.TestCase.list()
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => appClient.auth.me()
  });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      const normalizedData = {
        ...data,
        description: plainTextFromMarkdown(data.description || ''),
      };

      if (editingProject) {
        return appClient.entities.Project.update(editingProject.id, normalizedData);
      }

      return appClient.entities.Project.create(normalizedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      handleClose();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => appClient.entities.Project.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] })
  });

  const handleClose = () => {
    setDialogOpen(false);
    setEditingProject(null);
    setFormData({
      name: '',
      key: '',
      description: '',
      color: '#6366f1',
      status: 'active'
    });
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      key: project.key,
      description: plainTextFromMarkdown(project.description || ''),
      color: project.color || '#6366f1',
      status: project.status || 'active'
    });
    setDialogOpen(true);
  };

  const handleCreate = async () => {
    const activeProjectsCount = projects.filter((project) => project.status === 'active').length;
    const currentPlan = user?.subscription_plan || 'free';

    if (currentPlan === 'free' && activeProjectsCount >= 3) {
      await showAlert({
        title: 'Лимит проектов достигнут',
        description: 'Достигнут лимит проектов для Free тарифа (3 проекта). Обновите тариф для создания большего количества проектов.',
        confirmLabel: 'Понятно',
      });
      return;
    }

    setDialogOpen(true);
  };

  const getProjectStats = (projectId) => {
    const projectCases = testCases.filter((testCase) => testCase.project_id === projectId);
    return {
      total: projectCases.length,
      approved: projectCases.filter((testCase) => testCase.status === 'Approved').length,
    };
  };

  const activeProjects = projects.filter((project) => project.status === 'active');
  const archivedProjects = projects.filter((project) => project.status === 'archived');
  const currentPlan = user?.subscription_plan || 'free';
  const projectLimit = currentPlan === 'free' ? 3 : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Проекты</h1>
          <p className="text-muted-foreground mt-1">
            Управление проектами и их тест-кейсами
          </p>
        </div>
        {permissions.canManageStructure && (
          <Button onClick={handleCreate} data-onboarding-projects-create>
            <Plus className="w-4 h-4 mr-2" /> Создать проект
          </Button>
        )}
      </div>

      {projectLimit && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                Free тариф: {activeProjects.length} / {projectLimit} проектов
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
                Обновите до Team или Business для безлимитных проектов
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Активные проекты</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-onboarding-projects-list>
          {activeProjects.map((project) => {
            const stats = getProjectStats(project.id);

            return (
              <div
                key={project.id}
                className="bg-card rounded-xl border border-border p-5 hover:shadow-lg transition-all"
                style={{ borderLeftWidth: '4px', borderLeftColor: project.color }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${project.color}20` }}
                    >
                      <Folder className="w-5 h-5" style={{ color: project.color }} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{project.name}</h3>
                      <Badge variant="outline" className="text-xs mt-1">{project.key}</Badge>
                    </div>
                  </div>
                  {permissions.canManageStructure && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEdit(project)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500"
                        onClick={async () => {
                          const confirmed = await showConfirm({
                            title: 'Удалить проект?',
                            description: 'Все тест-кейсы останутся без проекта.',
                            confirmLabel: 'Удалить',
                            cancelLabel: 'Отмена',
                            confirmClassName: 'bg-red-600 hover:bg-red-700',
                          });

                          if (confirmed) {
                            deleteMutation.mutate(project.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {project.description && (
                  <p className="text-sm text-muted-foreground mb-3 leading-6">
                    {textPreview(project.description, 280)}
                  </p>
                )}

                <div className="flex items-center gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Тест-кейсов: </span>
                    <span className="font-semibold text-foreground">{stats.total}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Утверждено: </span>
                    <span className="font-semibold text-green-600">{stats.approved}</span>
                  </div>
                </div>
              </div>
            );
          })}

          {activeProjects.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              <Folder className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Нет активных проектов</p>
            </div>
          )}
        </div>
      </div>

      {archivedProjects.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Archive className="w-5 h-5" />
            Архивные проекты
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {archivedProjects.map((project) => {
              const stats = getProjectStats(project.id);

              return (
                <div
                  key={project.id}
                  className="bg-accent rounded-xl border border-border p-5 opacity-60"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Archive className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <h3 className="font-semibold text-foreground">{project.name}</h3>
                      <Badge variant="outline" className="text-xs mt-1">{project.key}</Badge>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {stats.total} тест-кейсов
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProject ? 'Редактировать проект' : 'Создать проект'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Название проекта</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Например: Мобильное приложение"
              />
            </div>
            <div className="space-y-2">
              <Label>Ключ проекта</Label>
              <Input
                value={formData.key}
                onChange={(e) => setFormData((prev) => ({ ...prev, key: e.target.value.toUpperCase() }))}
                placeholder="Например: MOBILE"
                maxLength={10}
              />
              <p className="text-xs text-muted-foreground">
                Короткий уникальный идентификатор (например: MOBILE, WEB, API)
              </p>
            </div>
            <div className="space-y-2">
              <Label>Описание</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Краткое описание проекта..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Цвет</Label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    className={cn(
                      "w-10 h-10 rounded-lg border-2 transition-all",
                      formData.color === color.value ? "border-foreground scale-110" : "border-transparent"
                    )}
                    style={{ backgroundColor: color.value }}
                    onClick={() => setFormData((prev) => ({ ...prev, color: color.value }))}
                  />
                ))}
              </div>
            </div>
            {editingProject && (
              <div className="space-y-2">
                <Label>Статус</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={formData.status === 'active' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFormData((prev) => ({ ...prev, status: 'active' }))}
                  >
                    Активный
                  </Button>
                  <Button
                    type="button"
                    variant={formData.status === 'archived' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFormData((prev) => ({ ...prev, status: 'archived' }))}
                  >
                    Архивный
                  </Button>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>Отмена</Button>
            <Button
              onClick={() => saveMutation.mutate(formData)}
              disabled={!formData.name.trim() || !formData.key.trim()}
            >
              {editingProject ? 'Сохранить' : 'Создать'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
