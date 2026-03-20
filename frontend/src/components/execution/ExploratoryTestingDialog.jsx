import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  Pause, 
  Save, 
  Upload, 
  Trash2, 
  Plus,
  Sparkles,
  FileText,
  Clock,
  Image as ImageIcon,
  CheckCircle2
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { appClient } from '@/api/client';

export default function ExploratoryTestingDialog({ isOpen, onClose, onConvertToTestCase }) {
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState([]);
  const [currentNote, setCurrentNote] = useState('');
  const [screenshots, setScreenshots] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [alertDialog, setAlertDialog] = useState({ open: false, message: '', type: 'error' });

  // Timer
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

  const uploadScreenshot = React.useCallback(async (file) => {
    setUploading(true);
    try {
      const { file_url } = await appClient.integrations.Core.UploadFile({ file });
      setScreenshots(prev => [...prev, file_url]);
    } catch (error) {
      setAlertDialog({ open: true, message: 'Ошибка загрузки: ' + error.message, type: 'error' });
    } finally {
      setUploading(false);
    }
  }, []);

  // Paste screenshot handler
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = async (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            await uploadScreenshot(file);
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen, uploadScreenshot]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadScreenshot(file);
    }
  };

  const handleStart = () => {
    setIsRunning(true);
    setStartTime(new Date());
    setElapsedSeconds(0);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const addNote = () => {
    if (currentNote.trim()) {
      setNotes(prev => [...prev, {
        text: currentNote,
        timestamp: new Date().toISOString(),
        elapsed: elapsedSeconds
      }]);
      setCurrentNote('');
    }
  };

  const removeNote = (index) => {
    setNotes(prev => prev.filter((_, i) => i !== index));
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  const handleConvertToTestCase = async () => {
    if (!title.trim()) {
      setAlertDialog({ open: true, message: 'Введите название тест-кейса', type: 'error' });
      return;
    }

    if (notes.length === 0) {
      setAlertDialog({ open: true, message: 'Добавьте хотя бы одну заметку', type: 'error' });
      return;
    }

    // Convert notes to steps using AI
    const prompt = `Преобразуй эти заметки тестировщика в структурированные шаги тест-кейса.
Название тест-кейса: "${title}"

Заметки тестировщика:
${notes.map((n, i) => `${i + 1}. [${formatTime(n.elapsed)}] ${n.text}`).join('\n')}

Создай массив шагов с полями "step" (действие) и "expected" (ожидаемый результат).
Постарайся логически сгруппировать действия и вывести четкие ожидаемые результаты.`;

    try {
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
            },
            preconditions: {
              type: "string"
            }
          }
        }
      });

      // Pass data to parent to create test case
      onConvertToTestCase({
        title,
        steps: result.steps || [],
        preconditions: result.preconditions || '',
        screenshots
      });

      // Reset state
      handleClose();
    } catch (error) {
      setAlertDialog({ open: true, message: 'Ошибка конвертации: ' + error.message, type: 'error' });
    }
  };

  const handleClose = () => {
    setIsRunning(false);
    setStartTime(null);
    setElapsedSeconds(0);
    setTitle('');
    setNotes([]);
    setCurrentNote('');
    setScreenshots([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-500" />
            Экспресс-тестирование (Exploratory)
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label>Название тестирования</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например: Проверка формы регистрации"
              className="text-lg"
            />
          </div>

          {/* Timer */}
          <div className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-200 dark:border-purple-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <span className="text-sm font-medium text-foreground">Время тестирования</span>
              </div>
              <div className="text-3xl font-mono font-bold text-foreground">
                {formatTime(elapsedSeconds)}
              </div>
            </div>
            <div className="flex gap-2">
              {!isRunning ? (
                <Button 
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                  onClick={handleStart}
                >
                  <Play className="w-4 h-4 mr-2" /> Начать тестирование
                </Button>
              ) : (
                <Button 
                  className="flex-1 bg-amber-600 hover:bg-amber-700"
                  onClick={handlePause}
                >
                  <Pause className="w-4 h-4 mr-2" /> Пауза
                </Button>
              )}
            </div>
          </div>

          {/* Add Note */}
          <div className="space-y-2">
            <Label>Добавить заметку</Label>
            <div className="flex gap-2">
              <Textarea
                value={currentNote}
                onChange={(e) => setCurrentNote(e.target.value)}
                placeholder="Опишите что делаете и что видите..."
                rows={2}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) {
                    addNote();
                  }
                }}
              />
              <Button 
                onClick={addNote}
                disabled={!currentNote.trim()}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">💡 Ctrl + Enter для быстрого добавления</p>
          </div>

          {/* Notes Log */}
          {notes.length > 0 && (
            <div className="space-y-2">
              <Label>Лог действий ({notes.length})</Label>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {notes.map((note, idx) => (
                  <div key={idx} className="bg-accent rounded-lg p-3 border border-border">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {formatTime(note.elapsed)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Заметка {idx + 1}
                          </span>
                        </div>
                        <p className="text-sm text-foreground">{note.text}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeNote(idx)}
                        className="text-muted-foreground hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Screenshots */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Скриншоты ({screenshots.length})</Label>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => document.getElementById('exploratory-screenshot-upload').click()}
                disabled={uploading}
              >
                <Upload className="w-4 h-4 mr-1" /> 
                {uploading ? 'Загрузка...' : 'Загрузить'}
              </Button>
              <input
                id="exploratory-screenshot-upload"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
            <p className="text-xs text-muted-foreground">💡 Ctrl+V для вставки из буфера</p>
            <div className="grid grid-cols-3 gap-2">
              {screenshots.map((url, idx) => (
                <div key={idx} className="relative group">
                  <img 
                    src={url} 
                    alt={`Screenshot ${idx + 1}`}
                    className="w-full h-24 object-cover rounded-lg border border-border"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 bg-background/80 hover:bg-background opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setScreenshots(prev => prev.filter((_, i) => i !== idx))}
                  >
                    <Trash2 className="w-3 h-3 text-red-500" />
                  </Button>
                </div>
              ))}
              {screenshots.length === 0 && (
                <div className="col-span-3 bg-accent rounded-lg p-6 text-center">
                  <ImageIcon className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Скриншотов нет</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-border">
          <Button variant="outline" onClick={handleClose} className="flex-1">
            Отмена
          </Button>
          <Button 
            className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            onClick={handleConvertToTestCase}
            disabled={!title.trim() || notes.length === 0}
          >
            <FileText className="w-4 h-4 mr-2" />
            Превратить в тест-кейс
          </Button>
        </div>
      </DialogContent>

      {/* Alert Dialog */}
      <AlertDialog open={alertDialog.open} onOpenChange={(open) => setAlertDialog({ ...alertDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {alertDialog.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : null}
              {alertDialog.type === 'success' ? 'Успешно' : 'Внимание'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              {alertDialog.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>ОК</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}