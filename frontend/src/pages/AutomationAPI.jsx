import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appClient } from '@/api/client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Copy, 
  Plus, 
  Trash2, 
  Key,
  CheckCircle2,
  Code,
  Bot,
  AlertCircle
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { usePermissions } from '@/components/shared/usePermissions';

export default function AutomationAPI() {
  const queryClient = useQueryClient();
  const permissions = usePermissions();
  const [createDialog, setCreateDialog] = useState(false);
  const [tokenName, setTokenName] = useState('');

  const { data: tokens = [] } = useQuery({
    queryKey: ['automationTokens'],
    queryFn: () => appClient.entities.AutomationToken.list('-created_date')
  });

  const createTokenMutation = useMutation({
    mutationFn: async (name) => {
      const token = `testflow_${Math.random().toString(36).substr(2, 32)}`;
      return appClient.entities.AutomationToken.create({ name, token });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automationTokens'] });
      setCreateDialog(false);
      setTokenName('');
      toast.success('Токен создан');
    }
  });

  const deleteTokenMutation = useMutation({
    mutationFn: (id) => appClient.entities.AutomationToken.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automationTokens'] });
      toast.success('Токен удален');
    }
  });

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Скопировано в буфер обмена');
  };

  const apiEndpoint = window.location.origin + '/api/automation/report';

  if (!permissions.canManageIntegrations) {
    return (
      <div className="p-12 text-center">
        <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">У вас нет доступа к настройкам автоматизации</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
            <Bot className="w-8 h-8 text-indigo-600" />
            Automation API
          </h1>
          <p className="text-muted-foreground mt-1">Интеграция с автотестами</p>
        </div>
        <Button 
          className="bg-indigo-600 hover:bg-indigo-700"
          onClick={() => setCreateDialog(true)}
        >
          <Plus className="w-4 h-4 mr-2" /> Создать токен
        </Button>
      </div>

      <Tabs defaultValue="tokens" className="space-y-6">
        <TabsList>
          <TabsTrigger value="tokens">
            <Key className="w-4 h-4 mr-2" />
            Токены
          </TabsTrigger>
          <TabsTrigger value="docs">
            <Code className="w-4 h-4 mr-2" />
            Документация
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tokens" className="space-y-4">
          {/* Endpoint Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">API Endpoint</CardTitle>
              <CardDescription>Используйте этот URL для отправки результатов</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-muted px-4 py-2 rounded-lg text-sm font-mono">
                  POST {apiEndpoint}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(apiEndpoint)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tokens List */}
          <div className="grid gap-4">
            {tokens.map(token => (
              <Card key={token.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{token.name}</CardTitle>
                      <CardDescription className="mt-1">
                        Создан: {new Date(token.created_date).toLocaleDateString('ru-RU')}
                        {token.last_used_at && (
                          <> • Использован: {new Date(token.last_used_at).toLocaleDateString('ru-RU')}</>
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={token.enabled ? "default" : "secondary"}>
                        {token.enabled ? 'Активен' : 'Отключен'}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteTokenMutation.mutate(token.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Токен</Label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-muted px-3 py-2 rounded text-sm font-mono overflow-x-auto">
                        {token.token}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(token.token)}
                      >
                        <Copy className="w-4 h-4 mr-1" /> Копировать
                      </Button>
                    </div>
                    {token.usage_count > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Использований: {token.usage_count}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {tokens.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Key className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Нет токенов. Создайте первый токен для начала работы.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="docs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Отправка результатов автотестов</CardTitle>
              <CardDescription>
                Ваши автотесты могут отправлять результаты выполнения в TestFlow
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Request Format */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  Формат запроса
                </h3>
                <pre className="bg-slate-900 text-slate-100 rounded-lg p-4 overflow-x-auto text-sm">
{`POST ${apiEndpoint}
Headers:
  Authorization: Bearer YOUR_TOKEN_HERE
  Content-Type: application/json

Body:
{
  "test_run_id": "run_123",
  "steps": [
    {
      "step_index": 0,
      "status": "pass",
      "duration_ms": 1523,
      "automation_tool": "playwright"
    },
    {
      "step_index": 1,
      "status": "pass",
      "duration_ms": 890,
      "screenshot_url": "https://...",
      "automation_tool": "playwright"
    }
  ]
}`}
                </pre>
              </div>

              {/* Python Example */}
              <div>
                <h3 className="font-semibold mb-3">Пример: Python + Pytest</h3>
                <pre className="bg-slate-900 text-slate-100 rounded-lg p-4 overflow-x-auto text-sm">
{`import requests

def report_to_testflow(test_run_id, steps):
    response = requests.post(
        "${apiEndpoint}",
        headers={
            "Authorization": "Bearer YOUR_TOKEN",
            "Content-Type": "application/json"
        },
        json={
            "test_run_id": test_run_id,
            "steps": steps
        }
    )
    return response.json()

# В вашем тесте:
steps = [
    {"step_index": 0, "status": "pass", "duration_ms": 1200, "automation_tool": "pytest"},
    {"step_index": 1, "status": "fail", "duration_ms": 890, "error": "Element not found", "automation_tool": "pytest"}
]
report_to_testflow("run_abc123", steps)`}
                </pre>
              </div>

              {/* JavaScript Example */}
              <div>
                <h3 className="font-semibold mb-3">Пример: JavaScript + Playwright</h3>
                <pre className="bg-slate-900 text-slate-100 rounded-lg p-4 overflow-x-auto text-sm">
{`const reportToTestFlow = async (testRunId, steps) => {
  const response = await fetch("${apiEndpoint}", {
    method: "POST",
    headers: {
      "Authorization": "Bearer YOUR_TOKEN",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ test_run_id: testRunId, steps })
  });
  return response.json();
};

// В вашем тесте Playwright:
const steps = [
  { step_index: 0, status: "pass", duration_ms: 1100, automation_tool: "playwright" },
  { step_index: 1, status: "pass", duration_ms: 750, automation_tool: "playwright" }
];
await reportToTestFlow("run_xyz789", steps);`}
                </pre>
              </div>

              {/* Status codes */}
              <div>
                <h3 className="font-semibold mb-3">Статусы шагов</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Badge className="bg-green-100 text-green-700">pass</Badge>
                    <span className="text-sm">Шаг выполнен успешно</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-red-100 text-red-700">fail</Badge>
                    <span className="text-sm">Шаг провален</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-slate-100 text-slate-700">skip</Badge>
                    <span className="text-sm">Шаг пропущен</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Token Dialog */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Создать API токен</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Название</Label>
              <Input
                value={tokenName}
                onChange={(e) => setTokenName(e.target.value)}
                placeholder="CI/CD Pipeline, Jenkins, GitHub Actions..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialog(false)}>
              Отмена
            </Button>
            <Button 
              onClick={() => createTokenMutation.mutate(tokenName)}
              disabled={!tokenName.trim()}
            >
              Создать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}