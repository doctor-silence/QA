import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { appClient } from '@/api/client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { Bug, Copy, CheckCircle2, Loader2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export default function CreateBugDialog({ open, onOpenChange, testRun }) {
  const queryClient = useQueryClient();
  const [selectedTracker, setSelectedTracker] = useState('');
  const [bugTitle, setBugTitle] = useState('');
  const [bugDescription, setBugDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [creating, setCreating] = useState(false);
  const [createdBugUrl, setCreatedBugUrl] = useState('');
  const [createdBugId, setCreatedBugId] = useState('');

  const { data: configs = [] } = useQuery({
    queryKey: ['bugTrackerConfigs'],
    queryFn: () => appClient.entities.BugTrackerConfig.list()
  });

  const enabledConfigs = configs.filter(c => c.enabled);

  React.useEffect(() => {
    if (testRun && open) {
      const snapshot = testRun.snapshot || {};
      setBugTitle(`Bug: ${snapshot.title || 'Test Failed'}`);
      
      // Auto-generate description
      let description = `**Test Case:** ${snapshot.title}\n\n`;
      description += `**Priority:** ${snapshot.priority}\n`;
      description += `**Test Type:** ${snapshot.type}\n\n`;
      
      if (testRun.test_data?.label) {
        description += `**Test Data Set:** ${testRun.test_data.label}\n`;
        if (testRun.test_data.params && Object.keys(testRun.test_data.params).length > 0) {
          description += `**Parameters:** ${JSON.stringify(testRun.test_data.params, null, 2)}\n`;
        }
        description += `\n`;
      }
      
      description += `**Steps to Reproduce:**\n`;
      snapshot.steps?.forEach((step, idx) => {
        description += `${idx + 1}. ${step.step}\n`;
        description += `   *Expected:* ${step.expected}\n`;
      });
      
      description += `\n**Actual Result:** Test failed\n`;
      
      if (testRun.comment) {
        description += `\n**Additional Notes:**\n${testRun.comment}\n`;
      }
      
      if (testRun.screenshots && testRun.screenshots.length > 0) {
        description += `\n**Screenshots:**\n`;
        testRun.screenshots.forEach((url, idx) => {
          description += `- [Screenshot ${idx + 1}](${url})\n`;
        });
      }
      
      setBugDescription(description);
      
      if (enabledConfigs.length > 0) {
        setSelectedTracker(enabledConfigs[0].id);
        setPriority(enabledConfigs[0].default_priority || 'Medium');
      }
    }
  }, [testRun, open, enabledConfigs]);

  const createBug = async () => {
    if (!selectedTracker) {
      toast.error('Выберите bug-трекер');
      return;
    }

    const config = configs.find(c => c.id === selectedTracker);
    if (!config) return;

    setCreating(true);
    setCreatedBugUrl('');

    try {
      // Use LLM to create bug via API
      const prompt = `You are a bug tracker API integration tool.
Create a bug/issue in ${config.type} using the following information:

API URL: ${config.api_url}
Project Key: ${config.project_key}
API Token: ${config.api_token}

Bug Title: ${bugTitle}
Priority: ${priority}
Description:
${bugDescription}

Please make an HTTP POST request to create this issue and return the created issue URL.
If you cannot make the actual API call, return a formatted JSON with the bug details that can be copied.`;

      const result = await appClient.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            bug_url: { type: "string" },
            bug_key: { type: "string" },
            message: { type: "string" }
          }
        }
      });

      if (result.success && result.bug_url) {
        setCreatedBugUrl(result.bug_url);
        setCreatedBugId(result.bug_key || '');
        
        // Link bug to test case
        if (testRun?.test_case_id) {
          const testCase = await appClient.entities.TestCase.filter({ id: testRun.test_case_id });
          if (testCase.length > 0) {
            const tc = testCase[0];
            const bugs = tc.bugs || [];
            bugs.push({
              bug_id: result.bug_key || '',
              tracker_type: config.type,
              url: result.bug_url,
              title: bugTitle,
              created_at: new Date().toISOString()
            });
            await appClient.entities.TestCase.update(tc.id, { bugs });
            queryClient.invalidateQueries({ queryKey: ['testCases'] });
          }
        }
        
        toast.success(`Bug ${result.bug_key || ''} создан и привязан к тест-кейсу!`);
      } else {
        toast.info('Скопируйте описание бага для ручного создания');
      }
    } catch (error) {
      toast.error('Ошибка создания бага: ' + error.message);
    } finally {
      setCreating(false);
    }
  };

  const copyToClipboard = () => {
    const text = `${bugTitle}\n\n${bugDescription}`;
    navigator.clipboard.writeText(text);
    toast.success('Скопировано в буфер обмена');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bug className="w-5 h-5" />
            Создать баг
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {enabledConfigs.length === 0 ? (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
              <p className="text-amber-800">
                Нет настроенных bug-трекеров. Настройте интеграцию в разделе Reports → Integrations
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Bug-трекер</Label>
                <Select value={selectedTracker} onValueChange={setSelectedTracker}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите трекер" />
                  </SelectTrigger>
                  <SelectContent>
                    {enabledConfigs.map(config => (
                      <SelectItem key={config.id} value={config.id}>
                        {config.name} ({config.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Приоритет</Label>
                <Select value={priority} onValueChange={setPriority}>
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

              <div className="space-y-2">
                <Label>Заголовок</Label>
                <Input
                  value={bugTitle}
                  onChange={(e) => setBugTitle(e.target.value)}
                  placeholder="Краткое описание бага"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Описание</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyToClipboard}
                  >
                    <Copy className="w-4 h-4 mr-1" /> Копировать
                  </Button>
                </div>
                <Textarea
                  value={bugDescription}
                  onChange={(e) => setBugDescription(e.target.value)}
                  rows={12}
                  className="font-mono text-xs"
                />
              </div>

              {createdBugUrl && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Баг создан успешно!</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(createdBugUrl, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-1" /> Открыть
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Закрыть
          </Button>
          {enabledConfigs.length > 0 && !createdBugUrl && (
            <Button 
              onClick={createBug}
              disabled={creating || !bugTitle || !selectedTracker}
            >
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Создание...
                </>
              ) : (
                <>
                  <Bug className="w-4 h-4 mr-2" />
                  Создать баг
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}