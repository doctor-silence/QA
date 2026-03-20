import React, { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appClient } from '@/api/client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Edit3, Trash2, X } from 'lucide-react';
import FolderTree from '@/components/repository/FolderTree';
import TestCaseTable from '@/components/repository/TestCaseTable';
import TestCaseDrawer from '@/components/repository/TestCaseDrawer';
import BulkEditDialog from '@/components/repository/BulkEditDialog';
import ImportExportButtons from '@/components/repository/ImportExportButtons';
import SmartFilters from '@/components/repository/SmartFilters';
import { usePermissions } from '@/components/shared/usePermissions';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

export default function Repository() {
  const queryClient = useQueryClient();
  const permissions = usePermissions();
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedCase, setSelectedCase] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newFolderDialog, setNewFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderParentId, setNewFolderParentId] = useState(null);
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkEditDialog, setBulkEditDialog] = useState(false);
  const [filters, setFilters] = useState({ tags: [], priorities: [], statuses: [], showFlaky: false });
  const [deleteDialog, setDeleteDialog] = useState(null);

  const { data: folders = [], isLoading: loadingFolders } = useQuery({
    queryKey: ['folders'],
    queryFn: () => appClient.entities.Folder.list()
  });

  const { data: testCases = [], isLoading: loadingCases } = useQuery({
    queryKey: ['testCases'],
    queryFn: () => appClient.entities.TestCase.list()
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => appClient.entities.Project.list()
  });

  const createFolderMutation = useMutation({
    mutationFn: (data) => appClient.entities.Folder.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      setNewFolderDialog(false);
      setNewFolderName('');
      setNewFolderParentId(null);
    }
  });

  const saveTestCaseMutation = useMutation({
    mutationFn: async (data) => {
      if (selectedCase?.id) {
        // Create history entry before updating
        const currentVersion = await appClient.entities.TestCaseHistory.filter({ test_case_id: selectedCase.id });
        const nextVersion = currentVersion.length + 1;
        
        await appClient.entities.TestCaseHistory.create({
          test_case_id: selectedCase.id,
          version: nextVersion,
          snapshot: selectedCase,
          changed_by: (await appClient.auth.me()).email
        });
        
        return appClient.entities.TestCase.update(selectedCase.id, data);
      }
      return appClient.entities.TestCase.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testCases'] });
      queryClient.invalidateQueries({ queryKey: ['testCaseHistory'] });
      setIsDrawerOpen(false);
      setSelectedCase(null);
    }
  });

  const deleteTestCaseMutation = useMutation({
    mutationFn: async (ids) => {
      const testCaseIds = Array.isArray(ids) ? ids : [ids];
      for (const id of testCaseIds) {
        await appClient.entities.TestCase.delete(id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testCases'] });
      queryClient.invalidateQueries({ queryKey: ['testCaseHistory'] });
      setSelectedIds([]);
      setBulkMode(false);
      if (selectedCase?.id) {
        setSelectedCase(null);
        setIsDrawerOpen(false);
      }
    }
  });

  const deleteFolderMutation = useMutation({
    mutationFn: async ({ folderId, folderIds }) => {
      const folderIdsToDelete = [];

      const collectDescendants = (currentFolderId) => {
        folderIdsToDelete.push(currentFolderId);

        folders
          .filter((folder) => folder.parent_id === currentFolderId)
          .forEach((childFolder) => collectDescendants(childFolder.id));
      };

      if (Array.isArray(folderIds) && folderIds.length > 0) {
        folderIds.forEach((id) => collectDescendants(id));
      } else if (folderId) {
        collectDescendants(folderId);
      }

      const uniqueFolderIdsToDelete = [...new Set(folderIdsToDelete)];

      const caseIdsToDelete = testCases
        .filter((testCase) => uniqueFolderIdsToDelete.includes(testCase.folder_id))
        .map((testCase) => testCase.id);

      for (const testCaseId of caseIdsToDelete) {
        await appClient.entities.TestCase.delete(testCaseId);
      }

      for (const id of [...uniqueFolderIdsToDelete].reverse()) {
        await appClient.entities.Folder.delete(id);
      }

      return { folderIdsToDelete: uniqueFolderIdsToDelete, caseIdsToDelete };
    },
    onSuccess: ({ folderIdsToDelete, caseIdsToDelete }) => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      queryClient.invalidateQueries({ queryKey: ['testCases'] });
      queryClient.invalidateQueries({ queryKey: ['testCaseHistory'] });

      if (selectedFolder && folderIdsToDelete.includes(selectedFolder)) {
        setSelectedFolder(null);
      }

      if (selectedCase?.id && caseIdsToDelete.includes(selectedCase.id)) {
        setSelectedCase(null);
        setIsDrawerOpen(false);
      }

      setSelectedIds((prev) => prev.filter((id) => !caseIdsToDelete.includes(id)));
      setDeleteDialog(null);
    }
  });

  const filteredCases = testCases.filter(tc => {
    const matchesProject = selectedProject === null || tc.project_id === selectedProject;
    const matchesFolder = selectedFolder === null || tc.folder_id === selectedFolder;
    const matchesSearch = !searchQuery || 
      tc.title?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Tag filter
    const matchesTags = filters.tags.length === 0 || 
      filters.tags.some(tag => tc.tags?.includes(tag));
    
    // Priority filter
    const matchesPriority = filters.priorities.length === 0 || 
      filters.priorities.includes(tc.priority);
    
    // Status filter
    const matchesStatus = filters.statuses.length === 0 || 
      filters.statuses.includes(tc.status || 'Draft');
    
    // Flaky filter
    const matchesFlaky = !filters.showFlaky || tc.is_flaky === true;
    
    return matchesProject && matchesFolder && matchesSearch && matchesTags && matchesPriority && matchesStatus && matchesFlaky;
  });

  const projectVisibleFolders = useMemo(() => {
    if (selectedProject === null) {
      return folders;
    }

    const folderIds = new Set();

    testCases
      .filter((testCase) => testCase.project_id === selectedProject && testCase.folder_id)
      .forEach((testCase) => {
        let currentFolderId = testCase.folder_id;

        while (currentFolderId) {
          folderIds.add(currentFolderId);
          const currentFolder = folders.find((folder) => folder.id === currentFolderId);
          currentFolderId = currentFolder?.parent_id || null;
        }
      });

    return folders.filter((folder) => folderIds.has(folder.id));
  }, [folders, selectedProject, testCases]);

  useEffect(() => {
    if (selectedFolder === null) {
      return;
    }

    const folderStillVisible = projectVisibleFolders.some((folder) => folder.id === selectedFolder);
    if (!folderStillVisible) {
      setSelectedFolder(null);
    }
  }, [projectVisibleFolders, selectedFolder]);

  const handleAddFolder = (parentId = null) => {
    setNewFolderParentId(parentId);
    setNewFolderDialog(true);
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      createFolderMutation.mutate({ 
        name: newFolderName,
        parent_id: newFolderParentId 
      });
    }
  };

  const handleCaseSelect = (tc) => {
    setSelectedCase(tc);
    setIsDrawerOpen(true);
  };

  const handleNewCase = () => {
    setSelectedCase(null);
    setIsDrawerOpen(true);
  };

  const handleSaveCase = (data) => {
    saveTestCaseMutation.mutate(data);
  };

  const toggleBulkMode = () => {
    setBulkMode(!bulkMode);
    setSelectedIds([]);
    setDeleteDialog(null);
  };

  const toggleSelectId = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const visibleCaseIds = filteredCases.map((testCase) => testCase.id);
  const allVisibleSelected = visibleCaseIds.length > 0 && visibleCaseIds.every((id) => selectedIds.includes(id));

  const toggleSelectAllVisible = () => {
    setSelectedIds((prev) => {
      if (allVisibleSelected) {
        return prev.filter((id) => !visibleCaseIds.includes(id));
      }

      return [...new Set([...prev, ...visibleCaseIds])];
    });
  };

  const handleDeleteOne = (testCase) => {
    setDeleteDialog({
      mode: 'single',
      ids: [testCase.id],
      title: testCase.title,
    });
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) {
      return;
    }

    setDeleteDialog({
      mode: 'bulk',
      ids: selectedIds,
      count: selectedIds.length,
    });
  };

  const handleDeleteFolder = (folderId) => {
    const targetFolder = folders.find((folder) => folder.id === folderId);
    if (!targetFolder) {
      return;
    }

    const descendantIds = [];
    const collectDescendants = (currentFolderId) => {
      descendantIds.push(currentFolderId);
      folders
        .filter((folder) => folder.parent_id === currentFolderId)
        .forEach((childFolder) => collectDescendants(childFolder.id));
    };

    collectDescendants(folderId);

    const nestedFoldersCount = Math.max(descendantIds.length - 1, 0);
    const linkedCasesCount = testCases.filter((testCase) => descendantIds.includes(testCase.folder_id)).length;

    setDeleteDialog({
      mode: 'folder',
      folderId,
      title: targetFolder.name,
      count: nestedFoldersCount,
      linkedCasesCount,
    });
  };

  const handleDeleteAllFolders = () => {
    const rootFolderIds = folders.filter((folder) => !folder.parent_id).map((folder) => folder.id);
    if (rootFolderIds.length === 0) {
      return;
    }

    setDeleteDialog({
      mode: 'all-folders',
      folderIds: rootFolderIds,
      count: folders.length,
      linkedCasesCount: testCases.filter((testCase) => testCase.folder_id).length,
    });
  };

  const confirmDelete = () => {
    if (deleteDialog?.mode === 'folder' || deleteDialog?.mode === 'all-folders') {
      if (!deleteDialog.folderId && !deleteDialog.folderIds?.length) {
        return;
      }

      deleteFolderMutation.mutate({
        folderId: deleteDialog.folderId,
        folderIds: deleteDialog.folderIds,
      });
      return;
    }

    if (!deleteDialog?.ids?.length) {
      return;
    }

    deleteTestCaseMutation.mutate(deleteDialog.ids, {
      onSuccess: () => {
        setDeleteDialog(null);
      },
    });
  };

  const isDeletePending = deleteTestCaseMutation.isPending || deleteFolderMutation.isPending;

  const handleBulkEdit = async ({ action, value }) => {
    const updates = {};
    if (action === 'priority') updates.priority = value;
    if (action === 'folder') updates.folder_id = value;
    if (action === 'type') updates.type = value;

    for (const id of selectedIds) {
      await appClient.entities.TestCase.update(id, updates);
    }

    queryClient.invalidateQueries({ queryKey: ['testCases'] });
    setBulkEditDialog(false);
    setSelectedIds([]);
    setBulkMode(false);
  };

  if (loadingFolders || loadingCases) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-3">
            <Skeleton className="h-96 rounded-2xl" />
          </div>
          <div className="col-span-9">
            <Skeleton className="h-96 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between" data-onboarding-repository-actions>
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Repository</h1>
          <p className="text-muted-foreground mt-1">База тест-кейсов</p>
        </div>
        <div className="flex gap-2">
          {permissions.canManageStructure && (
            <ImportExportButtons 
              testCases={testCases} 
              defaultFolderId={selectedFolder}
              defaultProjectId={selectedProject}
              onImportComplete={() => {
                queryClient.invalidateQueries({ queryKey: ['testCases'] });
                queryClient.invalidateQueries({ queryKey: ['folders'] });
                queryClient.invalidateQueries({ queryKey: ['projects'] });
              }}
            />
          )}
          {permissions.canManageStructure && (
            bulkMode ? (
              <>
                <Button 
                  variant="outline"
                  onClick={toggleSelectAllVisible}
                  disabled={visibleCaseIds.length === 0}
                >
                  {allVisibleSelected ? 'Снять выбор' : 'Выбрать все'}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setBulkEditDialog(true)}
                  disabled={selectedIds.length === 0}
                >
                  <Edit3 className="w-4 h-4 mr-2" /> Изменить ({selectedIds.length})
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleDeleteSelected}
                  disabled={selectedIds.length === 0 || deleteTestCaseMutation.isPending}
                  className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Удалить ({selectedIds.length})
                </Button>
                <Button variant="outline" onClick={toggleBulkMode}>
                  <X className="w-4 h-4 mr-2" /> Отмена
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={toggleBulkMode}>
                  <Edit3 className="w-4 h-4 mr-2" /> Массовое
                </Button>
                <Button 
                  className="bg-indigo-600 hover:bg-indigo-700"
                  onClick={handleNewCase}
                >
                  <Plus className="w-4 h-4 mr-2" /> Новый кейс
                </Button>
              </>
            )
          )}
        </div>
      </div>

      {/* Search & Project Filter */}
      <div className="space-y-3">
        {bulkMode && (
          <div className="flex flex-col gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-indigo-700">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded border-2 border-indigo-500 bg-white text-[10px] font-bold leading-none">
                ✓
              </span>
              <span>Режим выбора включён — чекбоксы находятся в первом столбце таблицы.</span>
            </div>
            <span className="font-medium text-indigo-700">Выбрано: {selectedIds.length}</span>
          </div>
        )}

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по названию..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11"
          />
        </div>
        
        {/* Project Filter */}
        <div className="flex items-center gap-2 flex-wrap" data-onboarding-repository-project-filter>
          <Button
            variant={!selectedProject ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedProject(null)}
          >
            Все проекты
          </Button>
          {projects.filter(p => p.status === 'active').map(project => (
            <Button
              key={project.id}
              variant={selectedProject === project.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedProject(project.id)}
              style={{
                backgroundColor: selectedProject === project.id ? project.color : undefined,
                borderColor: project.color
              }}
            >
              {project.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-12 gap-6">
        {/* Folder Tree */}
        <div className="col-span-12 lg:col-span-3 space-y-6" data-onboarding-repository-folders>
          <FolderTree
            folders={projectVisibleFolders}
            selectedId={selectedFolder}
            onSelect={setSelectedFolder}
            onAddFolder={handleAddFolder}
            onDeleteFolder={handleDeleteFolder}
            onDeleteAllFolders={handleDeleteAllFolders}
            canDelete={permissions.canManageStructure}
          />
          <SmartFilters filters={filters} onChange={setFilters} />
        </div>

        {/* Test Cases Table */}
        <div className="col-span-12 lg:col-span-9" data-onboarding-repository-cases>
          <TestCaseTable
            testCases={filteredCases}
            onSelect={handleCaseSelect}
            onDelete={handleDeleteOne}
            selectedId={selectedCase?.id}
            bulkMode={bulkMode}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelectId}
            onToggleSelectAll={toggleSelectAllVisible}
            allSelected={allVisibleSelected}
            canDelete={permissions.canManageStructure}
          />
        </div>
      </div>

      {/* Test Case Drawer */}
      <TestCaseDrawer
        isOpen={isDrawerOpen}
        onClose={() => { setIsDrawerOpen(false); setSelectedCase(null); }}
        testCase={selectedCase}
        onSave={handleSaveCase}
        folders={folders}
        initialProjectId={selectedCase?.project_id || selectedProject || ''}
        initialFolderId={selectedCase?.folder_id || selectedFolder || ''}
      />

      {/* New Folder Dialog */}
      <Dialog open={newFolderDialog} onOpenChange={(open) => {
        setNewFolderDialog(open);
        if (!open) {
          setNewFolderName('');
          setNewFolderParentId(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {newFolderParentId ? 'Новая подпапка' : 'Новая папка'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {newFolderParentId && (
              <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-3 text-sm text-indigo-700 dark:text-indigo-400">
                Будет создана в: {folders.find(f => f.id === newFolderParentId)?.name}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="folderName">Название</Label>
              <Input
                id="folderName"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Введите название папки"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setNewFolderDialog(false);
              setNewFolderName('');
              setNewFolderParentId(null);
            }}>
              Отмена
            </Button>
            <Button 
              className="bg-indigo-600 hover:bg-indigo-700"
              onClick={handleCreateFolder}
              disabled={!newFolderName.trim()}
            >
              Создать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Edit Dialog */}
      <BulkEditDialog
        open={bulkEditDialog}
        onOpenChange={setBulkEditDialog}
        selectedCount={selectedIds.length}
        folders={folders}
        onApply={handleBulkEdit}
      />

      <Dialog open={!!deleteDialog} onOpenChange={(open) => !open && setDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {deleteDialog?.mode === 'single'
                ? 'Удалить тест-кейс?'
                : deleteDialog?.mode === 'folder'
                  ? 'Удалить модуль?'
                  : deleteDialog?.mode === 'all-folders'
                    ? 'Удалить все модули?'
                  : 'Удалить выбранные тест-кейсы?'}
            </DialogTitle>
            <DialogDescription>
              {deleteDialog?.mode === 'single'
                ? `Тест-кейс «${deleteDialog?.title || ''}» будет удалён без возможности восстановления.`
                : deleteDialog?.mode === 'folder'
                  ? `Модуль «${deleteDialog?.title || ''}» будет удалён вместе с ${deleteDialog?.count || 0} подпапками и ${deleteDialog?.linkedCasesCount || 0} тест-кейсами без возможности восстановления.`
                  : deleteDialog?.mode === 'all-folders'
                    ? `Будут удалены все модули (${deleteDialog?.count || 0}), включая подпапки и ${deleteDialog?.linkedCasesCount || 0} тест-кейсов внутри них, без возможности восстановления.`
                  : `Будут удалены ${deleteDialog?.count || 0} выбранных тест-кейсов без возможности восстановления.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(null)} disabled={isDeletePending}>
              Отмена
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={confirmDelete}
              disabled={isDeletePending}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {isDeletePending ? 'Удаление...' : 'Удалить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}