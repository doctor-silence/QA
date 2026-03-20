import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appClient } from '@/api/client';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, XCircle, Clock, Search } from 'lucide-react';
import { cn } from "@/lib/utils";
import { usePermissions } from '@/components/shared/usePermissions';
import TestCaseDrawer from '@/components/repository/TestCaseDrawer';
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

const statusConfig = {
  Draft: { label: "📝 Черновик", color: "bg-slate-100 text-slate-700 border-slate-300" },
  "Under Review": { label: "🔍 На проверке", color: "bg-amber-100 text-amber-700 border-amber-300" },
  Approved: { label: "✓ Утвержден", color: "bg-green-100 text-green-700 border-green-300" },
};

const priorityColors = {
  P1: "bg-red-50 text-red-600 border-red-100",
  P2: "bg-amber-50 text-amber-600 border-amber-100",
  P3: "bg-blue-50 text-blue-600 border-blue-100",
  P4: "bg-slate-50 text-slate-500 border-slate-100",
};

export default function Reviews() {
  const queryClient = useQueryClient();
  const permissions = usePermissions();
  const [selectedCase, setSelectedCase] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('pending');

  const { data: testCases = [], isLoading } = useQuery({
    queryKey: ['testCases'],
    queryFn: () => appClient.entities.TestCase.list()
  });

  const { data: folders = [] } = useQuery({
    queryKey: ['folders'],
    queryFn: () => appClient.entities.Folder.list()
  });

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => appClient.auth.me()
  });

  const updateTestCaseMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      // Create history entry
      const testCase = testCases.find(tc => tc.id === id);
      if (testCase) {
        const currentVersion = await appClient.entities.TestCaseHistory.filter({ test_case_id: id });
        const nextVersion = currentVersion.length + 1;
        
        await appClient.entities.TestCaseHistory.create({
          test_case_id: id,
          version: nextVersion,
          snapshot: testCase,
          changed_by: currentUser?.email
        });
      }
      
      return appClient.entities.TestCase.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testCases'] });
      setIsDrawerOpen(false);
      setSelectedCase(null);
    }
  });

  const handleApprove = async (testCase) => {
    await updateTestCaseMutation.mutateAsync({
      id: testCase.id,
      data: {
        ...testCase,
        status: 'Approved',
        reviewed_at: new Date().toISOString(),
        reviewer: currentUser.email
      }
    });
  };

  const handleReject = async (testCase) => {
    setSelectedCase(testCase);
    setIsDrawerOpen(true);
  };

  const handleSaveCase = (data) => {
    updateTestCaseMutation.mutate({ id: selectedCase.id, data });
  };

  const pendingReviews = testCases.filter(tc => 
    tc.status === 'Under Review' && 
    (permissions.canManageStructure || tc.reviewer === currentUser?.email)
  );

  const myDrafts = testCases.filter(tc => 
    tc.status === 'Draft' && tc.created_by === currentUser?.email
  );

  const approved = testCases.filter(tc => tc.status === 'Approved');

  const filteredCases = (list) => list.filter(tc => 
    !searchQuery || tc.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const TestCaseCard = ({ testCase, showActions = false }) => (
    <div 
      className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-all cursor-pointer"
      onClick={() => {
        setSelectedCase(testCase);
        setIsDrawerOpen(true);
      }}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h4 className="font-semibold text-foreground mb-2">{testCase.title}</h4>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className={cn("text-xs", priorityColors[testCase.priority])}>
                {testCase.priority}
              </Badge>
              <Badge variant="outline" className={cn("text-xs", statusConfig[testCase.status]?.color)}>
                {statusConfig[testCase.status]?.label}
              </Badge>
              {testCase.tags?.slice(0, 2).map(tag => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="space-y-1">
            {testCase.created_by && (
              <p>👤 Автор: {testCase.created_by}</p>
            )}
            {testCase.reviewer && testCase.status === 'Under Review' && (
              <p>🔍 Ревьювер: {testCase.reviewer}</p>
            )}
            {testCase.reviewed_at && testCase.status === 'Approved' && (
              <p>✓ Утвержден: {new Date(testCase.reviewed_at).toLocaleDateString()}</p>
            )}
          </div>
          {testCase.steps?.length > 0 && (
            <span className="text-xs">{testCase.steps.length} шагов</span>
          )}
        </div>

        {showActions && permissions.canManageStructure && testCase.status === 'Under Review' && (
          <div className="flex gap-2 pt-3 border-t border-border" onClick={(e) => e.stopPropagation()}>
            <Button
              size="sm"
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={() => handleApprove(testCase)}
            >
              <CheckCircle2 className="w-4 h-4 mr-1" /> Утвердить
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
              onClick={() => handleReject(testCase)}
            >
              <XCircle className="w-4 h-4 mr-1" /> Вернуть
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Ревью тест-кейсов</h1>
          <p className="text-muted-foreground mt-1">Утверждение и проверка тест-кейсов</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Поиск по названию..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-11"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-amber-600 font-medium">На проверке</p>
              <p className="text-2xl font-bold text-amber-800">{pendingReviews.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
              <span className="text-2xl">📝</span>
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">Мои черновики</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{myDrafts.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-green-600 font-medium">Утверждено</p>
              <p className="text-2xl font-bold text-green-800">{approved.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="pending" className="relative">
            На проверке
            {pendingReviews.length > 0 && (
              <Badge className="ml-2 bg-amber-500 text-white text-xs px-1.5 py-0">
                {pendingReviews.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="drafts">Мои черновики</TabsTrigger>
          <TabsTrigger value="approved">Утвержденные</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {filteredCases(pendingReviews).length === 0 ? (
            <div className="bg-card rounded-2xl border border-border p-12 text-center">
              <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Нет тест-кейсов на проверке</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredCases(pendingReviews).map(tc => (
                <TestCaseCard key={tc.id} testCase={tc} showActions />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="drafts" className="space-y-4">
          {filteredCases(myDrafts).length === 0 ? (
            <div className="bg-card rounded-2xl border border-border p-12 text-center">
              <span className="text-6xl mb-4 block">📝</span>
              <p className="text-muted-foreground">У вас нет черновиков</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredCases(myDrafts).map(tc => (
                <TestCaseCard key={tc.id} testCase={tc} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {filteredCases(approved).length === 0 ? (
            <div className="bg-card rounded-2xl border border-border p-12 text-center">
              <CheckCircle2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Нет утвержденных тест-кейсов</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredCases(approved).map(tc => (
                <TestCaseCard key={tc.id} testCase={tc} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Test Case Drawer */}
      <TestCaseDrawer
        isOpen={isDrawerOpen}
        onClose={() => { setIsDrawerOpen(false); setSelectedCase(null); }}
        testCase={selectedCase}
        onSave={handleSaveCase}
        folders={folders}
      />
    </div>
  );
}