import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appClient } from '@/api/client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Edit3, X } from 'lucide-react';
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
  };

  const toggleSelectId = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Repository</h1>
          <p className="text-muted-foreground mt-1">База тест-кейсов</p>
        </div>
        <div className="flex gap-2">
          {permissions.canManageStructure && (
            <ImportExportButtons 
              testCases={testCases} 
              onImportComplete={() => queryClient.invalidateQueries({ queryKey: ['testCases'] })}
            />
          )}
          {permissions.canManageStructure && (
            bulkMode ? (
              <>
                <Button 
                  variant="outline"
                  onClick={() => setBulkEditDialog(true)}
                  disabled={selectedIds.length === 0}
                >
                  <Edit3 className="w-4 h-4 mr-2" /> Изменить ({selectedIds.length})
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
        <div className="flex items-center gap-2 flex-wrap">
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
              {project.key}
            </Button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-12 gap-6">
        {/* Folder Tree */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          <FolderTree
            folders={folders}
            selectedId={selectedFolder}
            onSelect={setSelectedFolder}
            onAddFolder={handleAddFolder}
          />
          <SmartFilters filters={filters} onChange={setFilters} />
        </div>

        {/* Test Cases Table */}
        <div className="col-span-12 lg:col-span-9">
          <TestCaseTable
            testCases={filteredCases}
            onSelect={handleCaseSelect}
            selectedId={selectedCase?.id}
            bulkMode={bulkMode}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelectId}
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
    </div>
  );
}