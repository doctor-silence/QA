import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appClient } from '@/api/client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Share2, Copy, ExternalLink, Trash2, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useModal } from '../shared/ModalProvider';

export default function PublicReportGenerator({ testPlan, testRuns }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [expiryDays, setExpiryDays] = useState(7);
  const queryClient = useQueryClient();
  const { showAlert } = useModal();

  const { data: reports = [] } = useQuery({
    queryKey: ['publicReports', testPlan?.id],
    queryFn: () => testPlan 
      ? appClient.entities.PublicReport.filter({ test_plan_id: testPlan.id })
      : Promise.resolve([]),
    enabled: !!testPlan
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiryDays);

      const stats = {
        total: testRuns.length,
        pass: testRuns.filter(r => r.status === 'Pass').length,
        fail: testRuns.filter(r => r.status === 'Fail').length,
        blocked: testRuns.filter(r => r.status === 'Blocked').length,
        skip: testRuns.filter(r => r.status === 'Skip').length,
        pending: testRuns.filter(r => r.status === 'Pending').length
      };

      const snapshot = {
        plan_name: testPlan.name,
        plan_description: testPlan.description,
        generated_at: new Date().toISOString(),
        stats,
        runs: testRuns.map(r => ({
          title: r.snapshot?.title,
          status: r.status,
          priority: r.snapshot?.priority,
          duration: r.duration_seconds,
          executed_by: r.executed_by,
          comment: r.comment
        }))
      };

      return appClient.entities.PublicReport.create({
        test_plan_id: testPlan.id,
        token,
        title: title || `Отчет: ${testPlan.name}`,
        snapshot,
        expires_at: expiresAt.toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publicReports'] });
      setDialogOpen(false);
      setTitle('');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => appClient.entities.PublicReport.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['publicReports'] })
  });

  const copyLink = async (token) => {
    const url = `${window.location.origin}${window.location.pathname}?page=PublicReport&token=${token}`;
    await navigator.clipboard.writeText(url);
    await showAlert({
      title: 'Ссылка скопирована',
      description: 'Публичная ссылка на отчёт скопирована в буфер обмена.',
      confirmLabel: 'OK',
    });
  };

  if (!testPlan) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Публичные отчеты</h3>
          <p className="text-sm text-slate-500">Создайте ссылку для просмотра без логина</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Share2 className="w-4 h-4 mr-2" /> Создать отчет
        </Button>
      </div>

      <div className="space-y-2">
        {reports.map(report => {
          const isExpired = new Date(report.expires_at) < new Date();
          return (
            <div key={report.id} className="bg-white rounded-xl border border-slate-100 p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-slate-800">{report.title}</h4>
                    {isExpired && <Badge variant="outline" className="text-red-500">Истек</Badge>}
                  </div>
                  <p className="text-xs text-slate-500">
                    Создан {formatDistanceToNow(new Date(report.created_date), { addSuffix: true, locale: ru })}
                  </p>
                  <p className="text-xs text-slate-500">
                    Истекает {formatDistanceToNow(new Date(report.expires_at), { addSuffix: true, locale: ru })}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <Eye className="w-3 h-3 text-slate-400" />
                    <span className="text-xs text-slate-400">{report.views_count || 0} просмотров</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyLink(report.token)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => window.open(`?page=PublicReport&token=${report.token}`, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMutation.mutate(report.id)}
                    className="text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
        {reports.length === 0 && (
          <div className="text-center py-8 text-slate-400">
            <Share2 className="w-12 h-12 mx-auto mb-2 text-slate-300" />
            <p>Нет публичных отчетов</p>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Создать публичный отчет</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Название отчета</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={`Отчет: ${testPlan.name}`}
              />
            </div>
            <div className="space-y-2">
              <Label>Срок действия (дней)</Label>
              <Input
                type="number"
                value={expiryDays}
                onChange={(e) => setExpiryDays(parseInt(e.target.value) || 7)}
                min={1}
                max={365}
              />
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              💡 Отчет будет содержать текущий снимок всех тест-ранов и статистику
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Отмена</Button>
            <Button onClick={() => generateMutation.mutate()}>
              Создать отчет
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}