import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock,
  Play,
  Pause,
  Image as ImageIcon,
  Trash2,
  Upload,
  Bug,
  Focus,
  Bot,
  Zap
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { appClient } from '@/api/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import CommentsSection from '../shared/CommentsSection';
import CreateBugDialog from '../bugtracker/CreateBugDialog';
import { usePermissions } from '../shared/usePermissions';
import { sendTestAssignedNotification } from './NotificationHelper';

const statusConfig = {
  Pending: { icon: Clock, color: "text-slate-400", bg: "bg-slate-50", label: "Pending" },
  InProgress: { icon: Play, color: "text-blue-500", bg: "bg-blue-50", label: "В процессе" },
  Pass: { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50", label: "Pass" },
  Fail: { icon: XCircle, color: "text-red-500", bg: "bg-red-50", label: "Fail" },
  Blocked: { icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-50", label: "Blocked" },
  Skip: { icon: Clock, color: "text-slate-400", bg: "bg-slate-50", label: "Skip" },
};

export default function TestRunDrawer({ isOpen, onClose, testRun, onUpdate }) {
  const permissions = usePermissions();
  const [comment, setComment] = useState('');
  const [screenshots, setScreenshots] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showBugDialog, setShowBugDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [assignedTo, setAssignedTo] = useState('');
  const [focusMode, setFocusMode] = useState(false);

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => appClient.entities.User.list()
  });

  useEffect(() => {
    if (testRun) {
      setComment(testRun.comment || '');
      setScreenshots(testRun.screenshots || []);
      setIsRunning(testRun.status === 'InProgress');
      setAssignedTo(testRun.assigned_to || '');
      
      if (testRun.started_at && testRun.status === 'InProgress') {
        setStartTime(new Date(testRun.started_at));
      } else {
        setStartTime(null);
        setElapsedSeconds(testRun.duration_seconds || 0);
      }
    }
  }, [testRun]);

  // Timer effect
  useEffect(() => {
    let interval;
    if (isRunning && startTime) {
      interval = setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor((now - startTime) / 1000);
        setElapsedSeconds(elapsed);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, startTime]);

  // Paste screenshot handler
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = async (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            await uploadScreenshot(file);
          }
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  const uploadScreenshot = async (file) => {
    setUploading(true);
    try {
      const { file_url } = await appClient.integrations.Core.UploadFile({ file });
      setScreenshots(prev => [...prev, file_url]);
    } catch (error) {
      alert('Ошибка загрузки: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadScreenshot(file);
    }
  };

  const removeScreenshot = (url) => {
    setScreenshots(prev => prev.filter(s => s !== url));
  };

  const handleStart = async () => {
    const now = new Date();
    setIsRunning(true);
    setStartTime(now);
    setElapsedSeconds(0);
    
    await onUpdate({
      status: 'InProgress',
      started_at: now.toISOString(),
      assigned_to: assignedTo
    });
  };

  const handleAssignChange = async (email) => {
    setAssignedTo(email);
    await onUpdate({ assigned_to: email });
    
    // Send notification
    if (email) {
      await sendTestAssignedNotification(testRun, email);
    }
  };

  const handleComplete = async (status) => {
    const now = new Date();
    const duration = startTime ? Math.floor((now - startTime) / 1000) : elapsedSeconds;
    
    setIsRunning(false);
    
    await onUpdate({
      status,
      completed_at: now.toISOString(),
      duration_seconds: duration,
      comment,
      screenshots
    });
    
    onClose();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  if (!testRun) return null;

  const StatusIcon = statusConfig[testRun.status]?.icon || Clock;

  // Focus Mode rendering
  if (focusMode && isRunning) {
    return (
      <div className="fixed inset-0 bg-background z-[100] flex flex-col">
        {/* Minimal Header */}
        <div className="border-b border-border p-6">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-foreground mb-1">
                {testRun.snapshot?.title}
              </h2>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className={cn("text-xs", statusConfig[testRun.status]?.bg)}>
                  {statusConfig[testRun.status]?.label}
                </Badge>
                {testRun.test_data?.label && (
                  <Badge variant="outline" className="bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800">
                    📊 {testRun.test_data.label}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-3xl font-mono font-bold text-foreground">
                  {formatTime(elapsedSeconds)}
                </div>
                <div className="text-xs text-muted-foreground">Время выполнения</div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFocusMode(false)}
                className="text-muted-foreground"
              >
                <Focus className="w-4 h-4 mr-2" />
                Выйти из Focus Mode
              </Button>
            </div>
          </div>
        </div>

        {/* Steps - Large and Clear */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-4">
            {testRun.snapshot?.steps?.map((step, idx) => (
              <div key={idx} className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-lg font-bold flex-shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex-1 space-y-3">
                    <p className="text-lg text-foreground leading-relaxed">{step.step}</p>
                    <div className="bg-accent/50 rounded-lg p-3 border-l-4 border-primary">
                      <p className="text-sm text-muted-foreground">✓ Ожидаемый результат:</p>
                      <p className="text-base text-foreground mt-1">{step.expected}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions - Large and Accessible */}
        <div className="border-t border-border p-6">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-4 gap-4">
              <Button 
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-700 h-16 text-lg"
                onClick={() => handleComplete('Pass')}
              >
                <CheckCircle2 className="w-6 h-6 mr-2" /> Pass
              </Button>
              <Button 
                size="lg"
                className="bg-red-600 hover:bg-red-700 h-16 text-lg"
                onClick={() => handleComplete('Fail')}
              >
                <XCircle className="w-6 h-6 mr-2" /> Fail
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="h-16 text-lg"
                onClick={() => handleComplete('Blocked')}
              >
                <AlertTriangle className="w-6 h-6 mr-2" /> Blocked
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="h-16 text-lg"
                onClick={() => handleComplete('Skip')}
              >
                <Clock className="w-6 h-6 mr-2" /> Skip
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="border-b border-border pb-4">
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle className="text-xl font-semibold text-foreground">
                {testRun.snapshot?.title}
              </SheetTitle>
              {testRun.test_data?.label && (
                <Badge variant="outline" className="mt-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800">
                  📊 {testRun.test_data.label}
                </Badge>
              )}
            </div>
            <div className={cn("flex items-center gap-2 px-3 py-1 rounded-lg", statusConfig[testRun.status]?.bg)}>
              <StatusIcon className={cn("w-4 h-4", statusConfig[testRun.status]?.color)} />
              <span className={cn("text-sm font-medium", statusConfig[testRun.status]?.color)}>
                {statusConfig[testRun.status]?.label}
              </span>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Assignment */}
          <div className="space-y-2">
            <Label>Назначен на</Label>
            <Select value={assignedTo} onValueChange={handleAssignChange}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите тестировщика" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>Не назначено</SelectItem>
                {users.map(user => (
                  <SelectItem key={user.id} value={user.email}>
                    {user.full_name || user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Timer */}
          <div className="bg-accent rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-foreground">Время выполнения</span>
              <span className="text-2xl font-mono font-bold text-foreground">
                {formatTime(elapsedSeconds)}
              </span>
            </div>
            {testRun.status === 'Pending' && !isRunning && (
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={handleStart}
              >
                <Play className="w-4 h-4 mr-2" /> Начать выполнение
              </Button>
            )}
            {isRunning && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                  Таймер запущен
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setFocusMode(true)}
                >
                  <Focus className="w-4 h-4 mr-2" />
                  Focus Mode
                </Button>
              </div>
            )}
          </div>

          {/* Test Data Parameters */}
          {testRun.test_data?.params && Object.keys(testRun.test_data.params).length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">Параметры теста</h3>
              <div className="bg-accent rounded-xl p-4 space-y-2">
                {Object.entries(testRun.test_data.params).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{key}:</span>
                    <span className="text-sm font-medium text-foreground">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Steps */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Шаги теста</h3>
            <div className="space-y-3">
              {testRun.snapshot?.steps?.map((step, idx) => {
                const automatedStep = testRun.automated_steps?.find(s => s.step_index === idx);
                return (
                  <div 
                    key={idx} 
                    className={cn(
                      "rounded-xl p-4",
                      automatedStep ? "bg-purple-50/50 dark:bg-purple-950/20 border border-purple-300 dark:border-purple-700" : "bg-accent"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0",
                        automatedStep ? "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400" : "bg-primary/10 text-primary"
                      )}>
                        {idx + 1}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {automatedStep && (
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900/30 border border-purple-300 dark:border-purple-700">
                              <Bot className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                              <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                                {automatedStep.automation_tool || 'autotest'}
                              </span>
                            </div>
                          )}
                          {automatedStep?.status === 'pass' && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                          )}
                          {automatedStep?.status === 'fail' && (
                            <XCircle className="w-3.5 h-3.5 text-red-500" />
                          )}
                          {automatedStep?.duration_ms && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Zap className="w-3 h-3" />
                              {automatedStep.duration_ms}ms
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-foreground">{step.step}</p>
                        <p className="text-xs text-muted-foreground">✓ {step.expected}</p>
                        {automatedStep?.error && (
                          <div className="mt-2 p-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-400">
                            ⚠️ {automatedStep.error}
                          </div>
                        )}
                        {automatedStep?.screenshot_url && (
                          <a
                            href={automatedStep.screenshot_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-purple-600 hover:underline inline-flex items-center gap-1"
                          >
                            <ImageIcon className="w-3 h-3" />
                            Скриншот автотеста
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Screenshots */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">Скриншоты</h3>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => document.getElementById('screenshot-upload').click()}
                  disabled={uploading}
                >
                  <Upload className="w-4 h-4 mr-1" /> 
                  {uploading ? 'Загрузка...' : 'Загрузить'}
                </Button>
                <input
                  id="screenshot-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>
            <div className="text-xs text-muted-foreground mb-3">
              💡 Подсказка: нажмите Ctrl+V чтобы вставить скриншот из буфера
            </div>
            <div className="grid grid-cols-2 gap-3">
              {screenshots.map((url, idx) => (
                <div key={idx} className="relative group">
                  <img 
                    src={url} 
                    alt={`Screenshot ${idx + 1}`}
                    className="w-full h-32 object-cover rounded-lg border border-border"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 bg-background/80 hover:bg-background opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeScreenshot(url)}
                  >
                    <Trash2 className="w-3 h-3 text-red-500" />
                  </Button>
                </div>
              ))}
              {screenshots.length === 0 && (
                <div className="col-span-2 bg-accent rounded-lg p-8 text-center">
                  <ImageIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Скриншотов нет</p>
                </div>
              )}
            </div>
          </div>

          {/* Comment */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">Комментарий</h3>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Добавьте комментарий к результату..."
              rows={4}
            />
          </div>

          {/* Comments Section */}
          <CommentsSection entityType="TestRun" entityId={testRun.id} />
        </div>

        {/* Actions */}
        {(testRun.status === 'Pending' || testRun.status === 'InProgress') && (
          <div className="border-t border-border pt-4 pb-2 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Button 
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={() => handleComplete('Pass')}
                disabled={!isRunning && testRun.status === 'Pending'}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" /> Pass
              </Button>
              <Button 
                className="bg-red-600 hover:bg-red-700"
                onClick={() => handleComplete('Fail')}
                disabled={!isRunning && testRun.status === 'Pending'}
              >
                <XCircle className="w-4 h-4 mr-2" /> Fail
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline"
                onClick={() => handleComplete('Blocked')}
                disabled={!isRunning && testRun.status === 'Pending'}
              >
                <AlertTriangle className="w-4 h-4 mr-2" /> Blocked
              </Button>
              <Button 
                variant="outline"
                onClick={() => handleComplete('Skip')}
                disabled={!isRunning && testRun.status === 'Pending'}
              >
                <Clock className="w-4 h-4 mr-2" /> Skip
              </Button>
            </div>
          </div>
        )}

        {/* Bug Creation */}
        {testRun.status === 'Fail' && permissions.canCreateBugs && (
          <div className="border-t border-border pt-4 pb-2">
            <Button 
              variant="outline"
              className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() => setShowBugDialog(true)}
            >
              <Bug className="w-4 h-4 mr-2" /> Создать баг в трекере
            </Button>
          </div>
        )}
      </SheetContent>

      <CreateBugDialog
        open={showBugDialog}
        onOpenChange={setShowBugDialog}
        testRun={testRun}
      />
    </Sheet>
  );
}