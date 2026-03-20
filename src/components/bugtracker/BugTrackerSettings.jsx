import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appClient } from '@/api/client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Bug } from 'lucide-react';

const trackerTypes = {
  jira: { name: 'Jira', color: 'bg-blue-500' },
  youtrack: { name: 'YouTrack', color: 'bg-purple-500' },
  linear: { name: 'Linear', color: 'bg-slate-500' },
  github: { name: 'GitHub Issues', color: 'bg-slate-800' }
};

export default function BugTrackerSettings() {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'jira',
    api_url: '',
    api_token: '',
    project_key: '',
    default_priority: 'Medium',
    enabled: true
  });

  const { data: configs = [] } = useQuery({
    queryKey: ['bugTrackerConfigs'],
    queryFn: () => appClient.entities.BugTrackerConfig.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => appClient.entities.BugTrackerConfig.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bugTrackerConfigs'] });
      setShowDialog(false);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => appClient.entities.BugTrackerConfig.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bugTrackerConfigs'] });
    }
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, enabled }) => appClient.entities.BugTrackerConfig.update(id, { enabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bugTrackerConfigs'] });
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'jira',
      api_url: '',
      api_token: '',
      project_key: '',
      default_priority: 'Medium',
      enabled: true
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <Bug className="w-5 h-5" />
          Bug-трекеры
        </h3>
        <Button size="sm" onClick={() => setShowDialog(true)}>
          <Plus className="w-4 h-4 mr-1" /> Добавить
        </Button>
      </div>

      <div className="space-y-3">
        {configs.map(config => {
          const tracker = trackerTypes[config.type];
          return (
            <Card key={config.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${tracker.color}`} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-800">{config.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {tracker.name}
                      </Badge>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {config.project_key && `Проект: ${config.project_key} • `}
                      {config.api_url}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Switch
                    checked={config.enabled}
                    onCheckedChange={(enabled) => toggleMutation.mutate({ id: config.id, enabled })}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMutation.mutate(config.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}

        {configs.length === 0 && (
          <div className="text-center py-8 text-slate-400">
            Нет настроенных bug-трекеров
          </div>
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить Bug-трекер</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Название</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Например: Main Jira"
              />
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
                  {Object.entries(trackerTypes).map(([key, { name }]) => (
                    <SelectItem key={key} value={key}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>API URL</Label>
              <Input
                value={formData.api_url}
                onChange={(e) => setFormData(prev => ({ ...prev, api_url: e.target.value }))}
                placeholder="https://company.atlassian.net"
              />
            </div>

            <div className="space-y-2">
              <Label>API Token</Label>
              <Input
                type="password"
                value={formData.api_token}
                onChange={(e) => setFormData(prev => ({ ...prev, api_token: e.target.value }))}
                placeholder="Ваш API токен"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Проект</Label>
                <Input
                  value={formData.project_key}
                  onChange={(e) => setFormData(prev => ({ ...prev, project_key: e.target.value }))}
                  placeholder="PROJ"
                />
              </div>

              <div className="space-y-2">
                <Label>Приоритет</Label>
                <Select 
                  value={formData.default_priority}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, default_priority: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Critical">Critical</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Отмена
            </Button>
            <Button 
              onClick={() => createMutation.mutate(formData)}
              disabled={!formData.name || !formData.api_url}
            >
              Создать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}