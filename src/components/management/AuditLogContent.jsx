import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { appClient } from '@/api/client';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Download, Eye } from 'lucide-react';
import { cn } from "@/lib/utils";
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const ACTION_COLORS = {
  create: 'bg-green-100 text-green-700 border-green-300',
  update: 'bg-blue-100 text-blue-700 border-blue-300',
  delete: 'bg-red-100 text-red-700 border-red-300',
  execute: 'bg-purple-100 text-purple-700 border-purple-300',
  login: 'bg-slate-100 text-slate-700 border-slate-300',
  export: 'bg-amber-100 text-amber-700 border-amber-300'
};

const ACTION_LABELS = {
  create: 'Создание',
  update: 'Изменение',
  delete: 'Удаление',
  execute: 'Выполнение',
  login: 'Вход',
  export: 'Экспорт'
};

export default function AuditLogContent() {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [entityFilter, setEntityFilter] = useState('all');
  const [selectedLog, setSelectedLog] = useState(null);

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['auditLogs'],
    queryFn: () => appClient.entities.AuditLog.list('-created_date', 500)
  });

  const filteredLogs = logs.filter(log => {
    const matchSearch = !search || 
      log.user_email?.toLowerCase().includes(search.toLowerCase()) ||
      log.user_name?.toLowerCase().includes(search.toLowerCase()) ||
      log.entity_title?.toLowerCase().includes(search.toLowerCase());
    
    const matchAction = actionFilter === 'all' || log.action === actionFilter;
    const matchEntity = entityFilter === 'all' || log.entity_type === entityFilter;

    return matchSearch && matchAction && matchEntity;
  });

  const exportLogs = () => {
    const csv = [
      ['Дата', 'Пользователь', 'Email', 'Действие', 'Тип сущности', 'Название', 'IP'],
      ...filteredLogs.map(log => [
        format(new Date(log.created_date), 'dd.MM.yyyy HH:mm:ss', { locale: ru }),
        log.user_name || '-',
        log.user_email,
        ACTION_LABELS[log.action] || log.action,
        log.entity_type,
        log.entity_title || '-',
        log.ip_address || '-'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `audit_log_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">Полный лог всех действий в системе</p>
        <Button onClick={exportLogs} disabled={filteredLogs.length === 0} size="sm">
          <Download className="w-4 h-4 mr-2" />
          Экспорт в CSV
        </Button>
      </div>

      <div className="bg-card rounded-xl border border-border p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по пользователю или сущности..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Тип действия" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все действия</SelectItem>
              <SelectItem value="create">Создание</SelectItem>
              <SelectItem value="update">Изменение</SelectItem>
              <SelectItem value="delete">Удаление</SelectItem>
              <SelectItem value="execute">Выполнение</SelectItem>
            </SelectContent>
          </Select>

          <Select value={entityFilter} onValueChange={setEntityFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Тип сущности" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все сущности</SelectItem>
              <SelectItem value="TestCase">Тест-кейсы</SelectItem>
              <SelectItem value="TestRun">Тест-раны</SelectItem>
              <SelectItem value="TestPlan">Тест-планы</SelectItem>
              <SelectItem value="Project">Проекты</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {(search || actionFilter !== 'all' || entityFilter !== 'all') && (
          <div className="flex items-center gap-2 mt-3">
            <Badge variant="outline" className="text-xs">
              Найдено: {filteredLogs.length} из {logs.length}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch('');
                setActionFilter('all');
                setEntityFilter('all');
              }}
            >
              Сбросить фильтры
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(ACTION_LABELS).map(([action, label]) => {
          const count = logs.filter(log => log.action === action).length;
          return (
            <div key={action} className="bg-card rounded-lg border border-border p-4">
              <p className="text-sm text-muted-foreground mb-1">{label}</p>
              <p className="text-2xl font-bold text-foreground">{count}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Дата и время</TableHead>
              <TableHead>Пользователь</TableHead>
              <TableHead>Действие</TableHead>
              <TableHead>Тип сущности</TableHead>
              <TableHead>Название</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Загрузка...
                </TableCell>
              </TableRow>
            ) : filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Нет записей
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => (
                <TableRow key={log.id} className="hover:bg-accent">
                  <TableCell className="font-mono text-sm">
                    {format(new Date(log.created_date), 'dd.MM.yyyy HH:mm:ss', { locale: ru })}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-foreground">{log.user_name || 'Неизвестно'}</p>
                      <p className="text-xs text-muted-foreground">{log.user_email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline"
                      className={cn("font-medium", ACTION_COLORS[log.action] || 'bg-slate-100 text-slate-700')}
                    >
                      {ACTION_LABELS[log.action] || log.action}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{log.entity_type}</Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {log.entity_title || '-'}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedLog(log)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {selectedLog && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setSelectedLog(null)}
        >
          <div 
            className="bg-card rounded-xl border border-border p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-foreground">Детали действия</h3>
              <Button variant="ghost" size="sm" onClick={() => setSelectedLog(null)}>✕</Button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Дата и время</p>
                <p className="font-medium text-foreground">
                  {format(new Date(selectedLog.created_date), 'dd MMMM yyyy, HH:mm:ss', { locale: ru })}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Пользователь</p>
                <p className="font-medium text-foreground">{selectedLog.user_name || 'Неизвестно'}</p>
                <p className="text-sm text-muted-foreground">{selectedLog.user_email}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Действие</p>
                <Badge className={ACTION_COLORS[selectedLog.action]}>
                  {ACTION_LABELS[selectedLog.action] || selectedLog.action}
                </Badge>
              </div>

              {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Дополнительные детали</p>
                  <pre className="bg-accent rounded-lg p-3 text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}