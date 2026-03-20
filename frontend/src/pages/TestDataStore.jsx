import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appClient } from '@/api/client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit2, Eye, EyeOff, Copy, Database, Search } from 'lucide-react';
import { cn } from "@/lib/utils";
import { usePermissions } from '../components/shared/usePermissions';

const CATEGORIES = [
  { value: 'credentials', label: 'Учетные данные', color: 'bg-blue-500/10 text-blue-600 border-blue-500/30' },
  { value: 'api_keys', label: 'API ключи', color: 'bg-purple-500/10 text-purple-600 border-purple-500/30' },
  { value: 'test_data', label: 'Тестовые данные', color: 'bg-green-500/10 text-green-600 border-green-500/30' },
  { value: 'urls', label: 'URL адреса', color: 'bg-amber-500/10 text-amber-600 border-amber-500/30' },
  { value: 'other', label: 'Прочее', color: 'bg-slate-500/10 text-slate-600 border-slate-500/30' }
];

export default function TestDataStore() {
  const permissions = usePermissions();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingData, setEditingData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [revealedItems, setRevealedItems] = useState([]);
  const [formData, setFormData] = useState({
    variable_name: '',
    description: '',
    value: '',
    category: 'test_data',
    is_sensitive: false,
    project_id: ''
  });

  const { data: testData = [] } = useQuery({
    queryKey: ['testData'],
    queryFn: () => appClient.entities.TestData.list()
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => appClient.entities.Project.list()
  });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (editingData) {
        return appClient.entities.TestData.update(editingData.id, data);
      }
      return appClient.entities.TestData.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testData'] });
      handleClose();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => appClient.entities.TestData.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['testData'] })
  });

  const handleClose = () => {
    setDialogOpen(false);
    setEditingData(null);
    setFormData({
      variable_name: '',
      description: '',
      value: '',
      category: 'test_data',
      is_sensitive: false,
      project_id: ''
    });
  };

  const handleEdit = (data) => {
    setEditingData(data);
    setFormData({
      variable_name: data.variable_name,
      description: data.description || '',
      value: data.value,
      category: data.category || 'test_data',
      is_sensitive: data.is_sensitive || false,
      project_id: data.project_id || ''
    });
    setDialogOpen(true);
  };

  const toggleReveal = (id) => {
    setRevealedItems(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // Could add toast notification here
  };

  const filteredData = testData.filter(item => {
    const matchesSearch = !searchQuery ||
      item.variable_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const groupedByCategory = CATEGORIES.reduce((acc, cat) => {
    acc[cat.value] = filteredData.filter(item => item.category === cat.value);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Хранилище тестовых данных</h1>
          <p className="text-muted-foreground mt-1">
            Централизованное управление переменными для тестов
          </p>
        </div>
        {permissions.canManageStructure && (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Добавить переменную
          </Button>
        )}
      </div>

      {/* Info Banner */}
      <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Database className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-indigo-700 dark:text-indigo-400">
              Использование переменных в тест-кейсах
            </p>
            <p className="text-xs text-indigo-600 dark:text-indigo-500 mt-1">
              Используйте формат {`{{variable_name}}`} в описании теста, шагах или ожидаемых результатах. 
              Например: {`{{test_user_login}}`} или {`{{api_key}}`}
            </p>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Поиск переменных..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все категории</SelectItem>
            {CATEGORIES.map(cat => (
              <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Data Table */}
      <div className="space-y-6">
        {CATEGORIES.map(category => {
          const items = groupedByCategory[category.value];
          if (items.length === 0 && selectedCategory !== 'all' && selectedCategory !== category.value) return null;
          
          return (
            <div key={category.value} className="space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-foreground">{category.label}</h3>
                <Badge variant="outline" className="text-xs">{items.length}</Badge>
              </div>
              
              {items.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Нет переменных в этой категории
                </div>
              ) : (
                <div className="grid gap-3">
                  {items.map(item => {
                    const isRevealed = revealedItems.includes(item.id);
                    const project = item.project_id ? projects.find(p => p.id === item.project_id) : null;
                    
                    return (
                      <div key={item.id} className="bg-card rounded-xl border border-border p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                              <code className="text-sm font-mono bg-accent px-2 py-1 rounded">
                                {`{{${item.variable_name}}}`}
                              </code>
                              <Badge variant="outline" className={cn("text-xs", category.color)}>
                                {category.label}
                              </Badge>
                              {item.is_sensitive && (
                                <Badge variant="outline" className="text-xs bg-red-500/10 text-red-600 border-red-500/30">
                                  🔒 Конфиденциально
                                </Badge>
                              )}
                              {project && (
                                <Badge variant="outline" className="text-xs">
                                  {project.key}
                                </Badge>
                              )}
                            </div>
                            
                            {item.description && (
                              <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                            )}
                            
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">Значение:</span>
                              {item.is_sensitive && !isRevealed ? (
                                <span className="text-sm font-mono">••••••••</span>
                              ) : (
                                <span className="text-sm font-mono text-foreground">{item.value}</span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex gap-1">
                            {item.is_sensitive && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => toggleReveal(item.id)}
                              >
                                {isRevealed ? (
                                  <EyeOff className="w-4 h-4" />
                                ) : (
                                  <Eye className="w-4 h-4" />
                                )}
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => copyToClipboard(`{{${item.variable_name}}}`)}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            {permissions.canManageStructure && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleEdit(item)}
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-500"
                                  onClick={() => {
                                    if (confirm('Удалить переменную?')) {
                                      deleteMutation.mutate(item.id);
                                    }
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingData ? 'Редактировать переменную' : 'Добавить переменную'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Имя переменной</Label>
              <Input
                value={formData.variable_name}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  variable_name: e.target.value.replace(/\s+/g, '_').toLowerCase() 
                }))}
                placeholder="test_user_login"
              />
              <p className="text-xs text-muted-foreground">
                Используйте только латиницу, цифры и подчеркивания
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>Описание</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Тестовый логин для авторизации..."
                rows={2}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Значение</Label>
              <Textarea
                value={formData.value}
                onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                placeholder="testuser@example.com"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Категория</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Проект (опционально)</Label>
                <Select 
                  value={formData.project_id} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, project_id: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Все проекты" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>Все проекты</SelectItem>
                    {projects.filter(p => p.status === 'active').map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} ({p.key})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <input
                type="checkbox"
                id="is_sensitive"
                checked={formData.is_sensitive}
                onChange={(e) => setFormData(prev => ({ ...prev, is_sensitive: e.target.checked }))}
                className="w-4 h-4"
              />
              <Label htmlFor="is_sensitive" className="flex items-center gap-2 cursor-pointer text-red-700 dark:text-red-400">
                🔒 Конфиденциальные данные (скрывать по умолчанию)
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>Отмена</Button>
            <Button
              onClick={() => saveMutation.mutate(formData)}
              disabled={!formData.variable_name.trim() || !formData.value.trim()}
            >
              {editingData ? 'Сохранить' : 'Создать'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}