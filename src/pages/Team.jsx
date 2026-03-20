import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appClient } from '@/api/client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Mail, UserPlus, Search, Shield, Eye, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from "@/lib/utils";
import RoleBadge from '../components/shared/RoleBadge';
import { usePermissions } from '../components/shared/usePermissions';

const QA_ROLES = [
  { value: 'Viewer', label: 'Viewer', icon: Eye, color: 'text-slate-500' },
  { value: 'Tester', label: 'Tester', icon: CheckCircle2, color: 'text-blue-500' },
  { value: 'QA Lead', label: 'QA Lead', icon: Shield, color: 'text-indigo-500' }
];

export default function Team() {
  const permissions = usePermissions();
  const queryClient = useQueryClient();
  const [inviteDialog, setInviteDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [inviteData, setInviteData] = useState({
    email: '',
    full_name: '',
    qa_role: 'Tester'
  });
  const [successDialog, setSuccessDialog] = useState(false);

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => appClient.entities.User.list()
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => appClient.entities.Project.list()
  });

  const { data: testCases = [] } = useQuery({
    queryKey: ['testCases'],
    queryFn: () => appClient.entities.TestCase.list()
  });

  const { data: testRuns = [] } = useQuery({
    queryKey: ['testRuns'],
    queryFn: () => appClient.entities.TestRun.list()
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }) => appClient.entities.User.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });

  const sendInviteMutation = useMutation({
    mutationFn: async (inviteData) => {
      // Send invitation email
      const appUrl = window.location.origin;
      return appClient.integrations.Core.SendEmail({
        to: inviteData.email,
        subject: 'Приглашение в TestFlow QA',
        body: `Здравствуйте, ${inviteData.full_name}!
        
Вы приглашены присоединиться к команде TestFlow QA в роли ${inviteData.qa_role}.

Перейдите по ссылке для регистрации: ${appUrl}

После регистрации вам будет назначена роль ${inviteData.qa_role}.

С уважением,
Команда TestFlow`
      });
    },
    onSuccess: () => {
      setInviteDialog(false);
      setInviteData({ email: '', full_name: '', qa_role: 'Tester' });
      setSuccessDialog(true);
    }
  });

  const getUserProjects = (userEmail) => {
    const userCases = testCases.filter(tc => tc.created_by === userEmail);
    const projectIds = [...new Set(userCases.map(tc => tc.project_id).filter(Boolean))];
    return projects.filter(p => projectIds.includes(p.id));
  };

  const getUserStats = (userEmail) => {
    const createdCases = testCases.filter(tc => tc.created_by === userEmail).length;
    const assignedRuns = testRuns.filter(tr => tr.assigned_to === userEmail).length;
    const executedRuns = testRuns.filter(tr => tr.executed_by === userEmail).length;
    return { createdCases, assignedRuns, executedRuns };
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchQuery ||
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.qa_role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const roleStats = QA_ROLES.map(role => ({
    ...role,
    count: users.filter(u => u.qa_role === role.value).length
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Команда</h1>
          <p className="text-muted-foreground mt-1">Управление тестировщиками и пользователями</p>
        </div>
        {permissions.isAdmin && (
          <Button onClick={() => setInviteDialog(true)}>
            <UserPlus className="w-4 h-4 mr-2" /> Пригласить пользователя
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Всего пользователей</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-muted-foreground" />
              <span className="text-2xl font-bold text-foreground">{users.length}</span>
            </div>
          </CardContent>
        </Card>

        {roleStats.map(role => (
          <Card key={role.value}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">{role.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <role.icon className={cn("w-5 h-5", role.color)} />
                <span className="text-2xl font-bold text-foreground">{role.count}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по имени или email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedRole} onValueChange={setSelectedRole}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все роли</SelectItem>
            {QA_ROLES.map(role => (
              <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Users List */}
      <div className="space-y-3">
        {filteredUsers.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Пользователи не найдены</p>
            </CardContent>
          </Card>
        ) : (
          filteredUsers.map(user => {
            const userProjects = getUserProjects(user.email);
            const stats = getUserStats(user.email);
            
            return (
              <Card key={user.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                          {(user.full_name || user.email)?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">
                            {user.full_name || user.email}
                          </h3>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mb-3">
                        <RoleBadge role={user.qa_role || 'Viewer'} size="sm" />
                        {user.role === 'admin' && (
                          <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30">
                            <Shield className="w-3 h-3 mr-1" />
                            Admin
                          </Badge>
                        )}
                      </div>

                      {/* Projects */}
                      {userProjects.length > 0 && (
                        <div className="mb-3">
                          <span className="text-xs text-muted-foreground mr-2">Проекты:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {userProjects.map(project => (
                              <Badge 
                                key={project.id} 
                                variant="outline" 
                                className="text-xs"
                                style={{ 
                                  backgroundColor: `${project.color}20`,
                                  borderColor: `${project.color}50`
                                }}
                              >
                                {project.key}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-4 pt-3 border-t border-border">
                        <div>
                          <p className="text-xs text-muted-foreground">Создано тестов</p>
                          <p className="text-lg font-semibold text-foreground">{stats.createdCases}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Назначено</p>
                          <p className="text-lg font-semibold text-foreground">{stats.assignedRuns}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Выполнено</p>
                          <p className="text-lg font-semibold text-foreground">{stats.executedRuns}</p>
                        </div>
                      </div>
                    </div>

                    {/* Role Selector */}
                    {permissions.isAdmin && user.email !== permissions.user?.email && (
                      <div className="w-48">
                        <Label className="text-xs text-muted-foreground mb-1 block">QA Роль</Label>
                        <Select 
                          value={user.qa_role || 'Viewer'}
                          onValueChange={(role) => updateUserMutation.mutate({ 
                            id: user.id, 
                            data: { qa_role: role } 
                          })}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {QA_ROLES.map(role => (
                              <SelectItem key={role.value} value={role.value}>
                                <div className="flex items-center gap-2">
                                  <role.icon className={cn("w-4 h-4", role.color)} />
                                  {role.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Invite Dialog */}
      <Dialog open={inviteDialog} onOpenChange={setInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Пригласить нового пользователя</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                <p className="text-xs text-blue-700 dark:text-blue-400">
                  После отправки приглашения пользователь получит email с ссылкой для регистрации
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={inviteData.email}
                onChange={(e) => setInviteData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="user@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label>Полное имя</Label>
              <Input
                value={inviteData.full_name}
                onChange={(e) => setInviteData(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="Иван Иванов"
              />
            </div>

            <div className="space-y-2">
              <Label>QA Роль</Label>
              <Select 
                value={inviteData.qa_role}
                onValueChange={(v) => setInviteData(prev => ({ ...prev, qa_role: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {QA_ROLES.map(role => (
                    <SelectItem key={role.value} value={role.value}>
                      <div className="flex items-center gap-2">
                        <role.icon className={cn("w-4 h-4", role.color)} />
                        {role.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="bg-slate-500/10 border border-slate-500/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">
                <strong>Viewer:</strong> Только просмотр<br />
                <strong>Tester:</strong> Выполнение тестов, создание багов<br />
                <strong>QA Lead:</strong> Полный доступ к управлению тестами
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteDialog(false)}>Отмена</Button>
            <Button
              onClick={() => sendInviteMutation.mutate(inviteData)}
              disabled={!inviteData.email || !inviteData.full_name}
            >
              <Mail className="w-4 h-4 mr-2" />
              Отправить приглашение
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <AlertDialog open={successDialog} onOpenChange={setSuccessDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              Приглашение отправлено
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Пользователь получит письмо с инструкциями для регистрации.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>ОК</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}