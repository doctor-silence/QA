import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appClient } from '@/api/client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Send, Webhook } from 'lucide-react';
import { Switch } from "@/components/ui/switch";

export default function WebhookSettings() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'slack',
    webhook_url: '',
    enabled: true,
    trigger_on: 'plan_completed'
  });
  const queryClient = useQueryClient();

  const { data: webhooks = [] } = useQuery({
    queryKey: ['webhooks'],
    queryFn: () => appClient.entities.WebhookConfig.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => appClient.entities.WebhookConfig.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      setDialogOpen(false);
      setFormData({ name: '', type: 'slack', webhook_url: '', enabled: true, trigger_on: 'plan_completed' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => appClient.entities.WebhookConfig.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['webhooks'] })
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, enabled }) => appClient.entities.WebhookConfig.update(id, { enabled }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['webhooks'] })
  });

  const testWebhook = async (webhook) => {
    try {
      if (webhook.type === 'email') {
        await appClient.integrations.Core.SendEmail({
          to: webhook.webhook_url,
          subject: '🧪 Тестовое уведомление из TestFlow',
          body: '<h2>✅ Email уведомления настроены корректно!</h2><p>Это тестовое письмо из системы управления тестированием TestFlow.</p>'
        });
      } else {
        const message = webhook.type === 'slack' 
          ? { text: "🧪 Тестовое уведомление из TestFlow\n✅ Webhook работает корректно!" }
          : { text: "🧪 Тестовое уведомление из TestFlow\n✅ Webhook работает корректно!" };
        
        await fetch(webhook.webhook_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(message)
        });
      }
      
      alert('Тестовое сообщение отправлено!');
    } catch (error) {
      alert('Ошибка отправки: ' + error.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Уведомления и Webhooks</h3>
          <p className="text-sm text-muted-foreground">Slack, Telegram боты и Email отчеты</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Добавить
        </Button>
      </div>

      <div className="space-y-3">
        {webhooks.map(webhook => (
          <div key={webhook.id} className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Webhook className="w-5 h-5 text-indigo-500" />
                  <h4 className="font-semibold text-foreground">{webhook.name}</h4>
                  <Badge variant="outline" className="text-xs">
                    {webhook.type === 'slack' ? '📢 Slack' : webhook.type === 'telegram' ? '✈️ Telegram' : '📧 Email'}
                  </Badge>
                  {webhook.enabled ? (
                    <Badge className="bg-green-50 text-green-700">Активен</Badge>
                  ) : (
                    <Badge variant="outline" className="text-slate-400">Отключен</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-2">{webhook.webhook_url}</p>
                <p className="text-xs text-muted-foreground">
                  Триггер: {
                    webhook.trigger_on === 'plan_completed' ? 'План завершен' : 
                    webhook.trigger_on === 'plan_failed' ? 'План провален' : 
                    webhook.trigger_on === 'test_assigned' ? 'Назначен тест' :
                    'Все события'
                  }
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={webhook.enabled}
                  onCheckedChange={(checked) => toggleMutation.mutate({ id: webhook.id, enabled: checked })}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => testWebhook(webhook)}
                >
                  <Send className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteMutation.mutate(webhook.id)}
                  className="text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
        {webhooks.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Webhook className="w-12 h-12 mx-auto mb-2" />
            <p>Нет настроенных уведомлений</p>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить Webhook</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Название</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Например: Production Slack"
              />
            </div>
            <div className="space-y-2">
              <Label>Тип</Label>
              <Select value={formData.type} onValueChange={(v) => setFormData(prev => ({ ...prev, type: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="slack">📢 Slack</SelectItem>
                  <SelectItem value="telegram">✈️ Telegram</SelectItem>
                  <SelectItem value="email">📧 Email</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Webhook URL</Label>
              <Input
                value={formData.webhook_url}
                onChange={(e) => setFormData(prev => ({ ...prev, webhook_url: e.target.value }))}
                placeholder={
                  formData.type === 'email' 
                    ? 'manager@company.com' 
                    : 'https://hooks.slack.com/services/...'
                }
              />
              <p className="text-xs text-slate-400">
                {formData.type === 'slack' 
                  ? 'Получите URL в Slack: Incoming Webhooks' 
                  : formData.type === 'telegram'
                  ? 'Получите URL через @BotFather в Telegram'
                  : 'Введите email адрес для получения отчетов'}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Когда отправлять</Label>
              <Select value={formData.trigger_on} onValueChange={(v) => setFormData(prev => ({ ...prev, trigger_on: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="plan_completed">План завершен (с PDF отчетом)</SelectItem>
                  <SelectItem value="plan_failed">План провален</SelectItem>
                  <SelectItem value="test_assigned">Назначен тест</SelectItem>
                  <SelectItem value="all">Все события</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Отмена</Button>
            <Button 
              onClick={() => createMutation.mutate(formData)}
              disabled={!formData.name || !formData.webhook_url}
            >
              Создать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}