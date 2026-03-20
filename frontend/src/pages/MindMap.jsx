import React, { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appClient } from '@/api/client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Download, 
  Trash2, 
  GitBranch, 
  FolderPlus,
  FileText,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Save,
  Upload,
  Sparkles,
  Play,
  XCircle,
  AlertTriangle,
  FolderTree
} from 'lucide-react';
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
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { motion, useDragControls } from 'framer-motion';
import { usePermissions } from '../components/shared/usePermissions';
import { useModal } from '../components/shared/ModalProvider';

const NODE_TYPES = {
  FOLDER: 'folder',
  TESTCASE: 'testcase',
  PROCESS_START: 'process_start',
  PROCESS_ACTION: 'process_action',
  PROCESS_DECISION: 'process_decision',
  PROCESS_END: 'process_end'
};

const MODES = {
  STRUCTURE: 'structure',
  PROCESS: 'process'
};

export default function MindMap() {
  const permissions = usePermissions();
  const { showAlert } = useModal();
  const queryClient = useQueryClient();
  const canvasRef = useRef(null);
  
  const [nodes, setNodes] = useState([
    { 
      id: '1', 
      type: NODE_TYPES.FOLDER, 
      label: 'Корневая папка', 
      x: 400, 
      y: 200, 
      parentId: null,
      priority: 'P3',
      tags: []
    }
  ]);
  const [connections, setConnections] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [editDialog, setEditDialog] = useState(false);
  const [exportDialog, setExportDialog] = useState(false);
  const [editData, setEditData] = useState({ label: '', type: NODE_TYPES.FOLDER, priority: 'P3', tags: [] });
  const [successMessage, setSuccessMessage] = useState('');
  const [mode, setMode] = useState(MODES.STRUCTURE);
  const [savedProcesses, setSavedProcesses] = useState([]);
  const [saveProcessDialog, setSaveProcessDialog] = useState(false);
  const [loadProcessDialog, setLoadProcessDialog] = useState(false);
  const [processName, setProcessName] = useState('');


  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => appClient.entities.Project.list()
  });

  const addNode = (parentId = null) => {
    const parent = parentId ? nodes.find(n => n.id === parentId) : null;
    const defaultType = mode === MODES.PROCESS ? NODE_TYPES.PROCESS_ACTION : NODE_TYPES.FOLDER;
    const newNode = {
      id: Date.now().toString(),
      type: defaultType,
      label: mode === MODES.PROCESS ? 'Новое действие' : 'Новый узел',
      x: parent ? parent.x + 150 : 400,
      y: parent ? parent.y + 100 : 200,
      parentId,
      priority: 'P3',
      tags: []
    };
    
    setNodes([...nodes, newNode]);
    
    if (parentId) {
      const newConnId = `${parentId}-${newNode.id}`;
      setConnections([...connections, { from: parentId, to: newNode.id, id: newConnId }]);
    }
  };

  const saveProcess = async () => {
    if (!processName.trim()) {
      await showAlert({
        title: 'Нужно название процесса',
        description: 'Введите название процесса перед сохранением.',
        confirmLabel: 'Понятно',
      });
      return;
    }

    const processData = {
      id: Date.now().toString(),
      name: processName,
      nodes: nodes,
      connections: connections,
      createdAt: new Date().toISOString()
    };

    const existing = JSON.parse(localStorage.getItem('testflow_processes') || '[]');
    const updated = [...existing, processData];
    localStorage.setItem('testflow_processes', JSON.stringify(updated));
    setSavedProcesses(updated);
    setSaveProcessDialog(false);
    setProcessName('');
    setSuccessMessage('Процесс успешно сохранен!');
  };

  const loadProcess = (process) => {
    setNodes(process.nodes);
    setConnections(process.connections);
    setLoadProcessDialog(false);
    setSuccessMessage('Процесс загружен!');
  };

  const loadSavedProcesses = () => {
    const saved = JSON.parse(localStorage.getItem('testflow_processes') || '[]');
    setSavedProcesses(saved);
  };

  React.useEffect(() => {
    loadSavedProcesses();
  }, []);



  const deleteNode = (nodeId) => {
    // Delete node and all its children
    const toDelete = [nodeId];
    const findChildren = (id) => {
      const children = nodes.filter(n => n.parentId === id);
      children.forEach(child => {
        toDelete.push(child.id);
        findChildren(child.id);
      });
    };
    findChildren(nodeId);
    
    setNodes(nodes.filter(n => !toDelete.includes(n.id)));
    setConnections(connections.filter(c => !toDelete.includes(c.from) && !toDelete.includes(c.to)));
    setSelectedNode(null);
  };

  const updateNodePosition = (id, x, y) => {
    setNodes(prevNodes => prevNodes.map(n => n.id === id ? { ...n, x, y } : n));
  };

  const openEditDialog = (node) => {
    setEditData({
      label: node.label,
      type: node.type,
      priority: node.priority || 'P3',
      tags: node.tags || []
    });
    setSelectedNode(node);
    setEditDialog(true);
  };

  const saveNodeEdit = () => {
    setNodes(nodes.map(n => 
      n.id === selectedNode.id 
        ? { ...n, ...editData }
        : n
    ));
    setEditDialog(false);
    setSelectedNode(null);
  };

  const exportToRepository = async (projectId) => {
    if (!projectId) {
      await showAlert({
        title: 'Нужно выбрать проект',
        description: 'Выберите проект перед экспортом в Repository.',
        confirmLabel: 'Понятно',
      });
      return;
    }

    try {
      // Build hierarchy
      const rootNodes = nodes.filter(n => n.parentId === null && n.type === NODE_TYPES.FOLDER);
      
      const createFolderAndChildren = async (node, parentFolderId = null) => {
        let folderId = null;
        
        if (node.type === NODE_TYPES.FOLDER) {
          // Create folder
          const folder = await appClient.entities.Folder.create({
            name: node.label,
            parent_id: parentFolderId,
            order: 0
          });
          folderId = folder.id;
        }
        
        // Process children
        const children = nodes.filter(n => n.parentId === node.id);
        for (const child of children) {
          if (child.type === NODE_TYPES.TESTCASE) {
            // Create test case
            await appClient.entities.TestCase.create({
              title: child.label,
              project_id: projectId,
              folder_id: folderId || parentFolderId,
              priority: child.priority || 'P3',
              type: 'Manual',
              status: 'Draft',
              tags: child.tags || [],
              steps: [{ step: '', expected: '' }]
            });
          } else if (child.type === NODE_TYPES.FOLDER) {
            await createFolderAndChildren(child, folderId);
          }
        }
      };
      
      // Process all root nodes
      for (const rootNode of rootNodes) {
        await createFolderAndChildren(rootNode);
      }
      
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      queryClient.invalidateQueries({ queryKey: ['testCases'] });
      
      setExportDialog(false);
      setSuccessMessage('Структура успешно экспортирована в Repository!');
    } catch (error) {
      await showAlert({
        title: 'Ошибка экспорта',
        description: `Ошибка экспорта: ${error.message}`,
        confirmLabel: 'Понятно',
      });
    }
  };

  const generateWithAI = async () => {
    try {
      const prompt = `Создай структуру тест-кейсов для веб-приложения.
Верни JSON массив узлов с полями:
- label (название)
- type ("folder" или "testcase")
- parentId (id родителя или null для корневых)
- priority (P1, P2, P3, P4)
- tags (массив строк: Smoke, Regression, API, UI)

Создай иерархию: 2-3 основные папки (Login, Profile, Settings), в каждой по 3-4 тест-кейса.
Используй последовательные id: "1", "2", "3" и т.д.`;

      const result = await appClient.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            nodes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  label: { type: "string" },
                  type: { type: "string" },
                  parentId: { type: ["string", "null"] },
                  priority: { type: "string" },
                  tags: { type: "array", items: { type: "string" } }
                }
              }
            }
          }
        }
      });

      if (result.nodes && result.nodes.length > 0) {
        // Position nodes automatically
        const positionedNodes = result.nodes.map((node, idx) => {
          const level = result.nodes.filter(n => 
            n.parentId === null ? 0 : getNodeLevel(n, result.nodes)
          );
          const parent = node.parentId ? result.nodes.find(n => n.id === node.parentId) : null;
          
          return {
            ...node,
            x: parent ? (idx % 3) * 200 + 100 : 400,
            y: (idx * 80) + 100
          };
        });
        
        setNodes(positionedNodes);
        
        // Build connections
        const newConnections = result.nodes
          .filter(n => n.parentId)
          .map(n => ({ from: n.parentId, to: n.id, id: `${n.parentId}-${n.id}` }));
        setConnections(newConnections);
      }
    } catch (error) {
      await showAlert({
        title: 'Ошибка генерации',
        description: `Ошибка генерации: ${error.message}`,
        confirmLabel: 'Понятно',
      });
    }
  };

  const getNodeLevel = (node, allNodes) => {
    let level = 0;
    let current = node;
    while (current.parentId) {
      level++;
      current = allNodes.find(n => n.id === current.parentId);
      if (!current) break;
    }
    return level;
  };

  if (!permissions.canManageStructure) {
    return (
      <div className="p-12 text-center">
        <p className="text-muted-foreground">У вас нет доступа к редактору Mind Maps</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Toolbar */}
      <div className="border-b border-border bg-card p-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Mind Map редактор</h1>
            <p className="text-sm text-muted-foreground">Визуализируйте структуру тестов</p>
          </div>
          
          {/* Mode Switcher */}
          <div className="flex items-center gap-2 bg-accent rounded-lg p-1">
            <Button
              variant={mode === MODES.STRUCTURE ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setMode(MODES.STRUCTURE)}
              className={cn(mode === MODES.STRUCTURE && 'bg-primary text-primary-foreground')}
            >
              <FolderTree className="w-4 h-4 mr-2" />
              Структура тестов
            </Button>
            <Button
              variant={mode === MODES.PROCESS ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setMode(MODES.PROCESS)}
              className={cn(mode === MODES.PROCESS && 'bg-primary text-primary-foreground')}
            >
              <GitBranch className="w-4 h-4 mr-2" />
              Процессы тестирования
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground w-16 text-center">{Math.round(zoom * 100)}%</span>
          <Button variant="outline" size="sm" onClick={() => setZoom(z => Math.min(2, z + 0.1))}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setZoom(1); setOffset({ x: 0, y: 0 }); }}>
            <Maximize2 className="w-4 h-4" />
          </Button>
          
          <div className="w-px h-6 bg-border mx-2" />
          
          {mode === MODES.STRUCTURE && (
            <>
              <Button variant="outline" size="sm" onClick={generateWithAI}>
                <Sparkles className="w-4 h-4 mr-2" /> AI генератор
              </Button>
              
              <Button 
                className="bg-indigo-600 hover:bg-indigo-700"
                onClick={() => setExportDialog(true)}
                disabled={nodes.length === 0}
              >
                <Download className="w-4 h-4 mr-2" /> Экспорт в Repository
              </Button>
            </>
          )}

          {mode === MODES.PROCESS && (
            <>
              <Button variant="outline" size="sm" onClick={() => setSaveProcessDialog(true)}>
                <Save className="w-4 h-4 mr-2" /> Сохранить процесс
              </Button>
              <Button variant="outline" size="sm" onClick={() => { loadSavedProcesses(); setLoadProcessDialog(true); }}>
                <Upload className="w-4 h-4 mr-2" /> Загрузить процесс
              </Button>
            </>
          )}
          
          <Button variant="outline" size="sm" onClick={() => addNode(null)}>
            <Plus className="w-4 h-4 mr-2" /> Добавить узел
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div 
        ref={canvasRef}
        className="flex-1 relative overflow-hidden bg-grid-pattern"
        style={{
          backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }}
      >

        <svg
          className="absolute inset-0 pointer-events-none"
          style={{ 
            width: '100%', 
            height: '100%',
            overflow: 'visible'
          }}
        >
          {connections.map((conn, idx) => {
            const from = nodes.find(n => n.id === conn.from);
            const to = nodes.find(n => n.id === conn.to);
            if (!from || !to) return null;
            
            // Calculate center points
            const fromWidth = from.type === NODE_TYPES.FOLDER ? 160 : 
                            from.type === NODE_TYPES.TESTCASE ? 192 : 128;
            const fromHeight = [NODE_TYPES.PROCESS_START, NODE_TYPES.PROCESS_END].includes(from.type) ? 128 : 80;
            
            const toWidth = to.type === NODE_TYPES.FOLDER ? 160 : 
                          to.type === NODE_TYPES.TESTCASE ? 192 : 128;
            const toHeight = [NODE_TYPES.PROCESS_START, NODE_TYPES.PROCESS_END].includes(to.type) ? 128 : 80;
            
            const x1 = (from.x + fromWidth / 2) * zoom + offset.x;
            const y1 = (from.y + fromHeight / 2) * zoom + offset.y;
            const x2 = (to.x + toWidth / 2) * zoom + offset.x;
            const y2 = (to.y + toHeight / 2) * zoom + offset.y;
            
            const dx = x2 - x1;
            const dy = y2 - y1;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Edge detection - stop at node boundaries
            const angle = Math.atan2(dy, dx);
            const fromRadius = Math.max(fromWidth, fromHeight) / 2 * zoom * 0.7;
            const toRadius = Math.max(toWidth, toHeight) / 2 * zoom * 0.7;
            
            const startX = x1 + Math.cos(angle) * fromRadius;
            const startY = y1 + Math.sin(angle) * fromRadius;
            const endX = x2 - Math.cos(angle) * toRadius;
            const endY = y2 - Math.sin(angle) * toRadius;
            
            return (
              <g key={idx}>
                <line
                  x1={startX}
                  y1={startY}
                  x2={endX}
                  y2={endY}
                  stroke="#6366f1"
                  strokeWidth={2}
                  fill="none"
                  opacity="0.5"
                  strokeLinecap="round"
                />
              </g>
            );
          })}
        </svg>

        <div style={{ transform: `scale(${zoom}) translate(${offset.x}px, ${offset.y}px)`, transformOrigin: '0 0' }}>
          {nodes.map(node => (
            <motion.div
              key={node.id}
              drag
              dragMomentum={false}
              dragElastic={0}
              dragConstraints={false}
              onDragEnd={(e, info) => {
                updateNodePosition(node.id, node.x + info.offset.x / zoom, node.y + info.offset.y / zoom);
              }}
              className={cn(
                "absolute border-2 shadow-lg p-4 bg-card cursor-move",
                node.type === NODE_TYPES.FOLDER && "rounded-xl border-indigo-400 w-40",
                node.type === NODE_TYPES.TESTCASE && "rounded-xl border-emerald-400 w-48",
                node.type === NODE_TYPES.PROCESS_START && "rounded-full border-green-500 w-32 h-32 flex items-center justify-center",
                node.type === NODE_TYPES.PROCESS_ACTION && "rounded-lg border-blue-500 w-40",
                node.type === NODE_TYPES.PROCESS_DECISION && "border-amber-500 w-40 h-40",
                node.type === NODE_TYPES.PROCESS_END && "rounded-full border-red-500 w-32 h-32 flex items-center justify-center",
                [NODE_TYPES.PROCESS_DECISION].includes(node.type) && "transform rotate-45"
              )}
              animate={{
                x: node.x,
                y: node.y
              }}
              transition={{ type: "tween", duration: 0 }}
            >
              <div className={cn(
                "flex items-start justify-between gap-2 mb-2",
                node.type === NODE_TYPES.PROCESS_DECISION && "transform -rotate-45"
              )}>
                <div className="flex items-center gap-2">
                  {node.type === NODE_TYPES.FOLDER && <FolderPlus className="w-4 h-4 text-indigo-600" />}
                  {node.type === NODE_TYPES.TESTCASE && <FileText className="w-4 h-4 text-emerald-600" />}
                  {node.type === NODE_TYPES.PROCESS_START && <Play className="w-4 h-4 text-green-600" />}
                  {node.type === NODE_TYPES.PROCESS_ACTION && <GitBranch className="w-4 h-4 text-blue-600" />}
                  {node.type === NODE_TYPES.PROCESS_DECISION && <AlertTriangle className="w-4 h-4 text-amber-600" />}
                  {node.type === NODE_TYPES.PROCESS_END && <XCircle className="w-4 h-4 text-red-600" />}
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-xs",
                      node.type === NODE_TYPES.FOLDER && "bg-indigo-50 text-indigo-600",
                      node.type === NODE_TYPES.TESTCASE && "bg-emerald-50 text-emerald-600",
                      [NODE_TYPES.PROCESS_START, NODE_TYPES.PROCESS_ACTION, NODE_TYPES.PROCESS_DECISION, NODE_TYPES.PROCESS_END].includes(node.type) && "bg-purple-50 text-purple-600"
                    )}
                  >
                    {node.type === NODE_TYPES.FOLDER && 'Папка'}
                    {node.type === NODE_TYPES.TESTCASE && 'Тест'}
                    {node.type === NODE_TYPES.PROCESS_START && 'Старт'}
                    {node.type === NODE_TYPES.PROCESS_ACTION && 'Действие'}
                    {node.type === NODE_TYPES.PROCESS_DECISION && 'Решение'}
                    {node.type === NODE_TYPES.PROCESS_END && 'Конец'}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNode(node.id);
                  }}
                >
                  <Trash2 className="w-3 h-3 text-red-500" />
                </Button>
              </div>
              
              <p 
                className={cn(
                  "text-sm font-medium text-foreground mb-2 cursor-pointer hover:text-primary",
                  node.type === NODE_TYPES.PROCESS_DECISION && "transform -rotate-45 text-center"
                )}
                onClick={() => openEditDialog(node)}
              >
                {node.label}
              </p>
              
              {node.type === NODE_TYPES.TESTCASE && (
                <Badge variant="outline" className="text-xs mb-2">{node.priority}</Badge>
              )}

              {node.tags && node.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {node.tags.map((tag, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">{tag}</Badge>
                  ))}
                </div>
              )}
              
              {![NODE_TYPES.PROCESS_START, NODE_TYPES.PROCESS_END].includes(node.type) && (
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "w-full text-xs",
                    node.type === NODE_TYPES.PROCESS_DECISION && "transform -rotate-45"
                  )}
                  onClick={() => addNode(node.id)}
                >
                  <Plus className="w-3 h-3 mr-1" /> Добавить дочерний
                </Button>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать узел</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Название</Label>
              <Input
                value={editData.label}
                onChange={(e) => setEditData({ ...editData, label: e.target.value })}
                placeholder="Название узла"
              />
            </div>

            <div className="space-y-2">
              <Label>Тип</Label>
              <Select 
                value={editData.type}
                onValueChange={(v) => setEditData({ ...editData, type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {mode === MODES.STRUCTURE && (
                    <>
                      <SelectItem value={NODE_TYPES.FOLDER}>
                        <div className="flex items-center gap-2">
                          <FolderPlus className="w-4 h-4" />
                          Папка
                        </div>
                      </SelectItem>
                      <SelectItem value={NODE_TYPES.TESTCASE}>
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Тест-кейс
                        </div>
                      </SelectItem>
                    </>
                  )}
                  {mode === MODES.PROCESS && (
                    <>
                      <SelectItem value={NODE_TYPES.PROCESS_START}>
                        <div className="flex items-center gap-2">
                          <Play className="w-4 h-4 text-green-600" />
                          Старт процесса
                        </div>
                      </SelectItem>
                      <SelectItem value={NODE_TYPES.PROCESS_ACTION}>
                        <div className="flex items-center gap-2">
                          <GitBranch className="w-4 h-4 text-blue-600" />
                          Действие
                        </div>
                      </SelectItem>
                      <SelectItem value={NODE_TYPES.PROCESS_DECISION}>
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                          Условие/Решение
                        </div>
                      </SelectItem>
                      <SelectItem value={NODE_TYPES.PROCESS_END}>
                        <div className="flex items-center gap-2">
                          <XCircle className="w-4 h-4 text-red-600" />
                          Конец процесса
                        </div>
                      </SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            {editData.type === NODE_TYPES.TESTCASE && (
              <>
                <div className="space-y-2">
                  <Label>Приоритет</Label>
                  <Select 
                    value={editData.priority}
                    onValueChange={(v) => setEditData({ ...editData, priority: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="P1">P1 - Critical</SelectItem>
                      <SelectItem value="P2">P2 - High</SelectItem>
                      <SelectItem value="P3">P3 - Medium</SelectItem>
                      <SelectItem value="P4">P4 - Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Теги (через запятую)</Label>
                  <Input
                    value={editData.tags?.join(', ') || ''}
                    onChange={(e) => setEditData({ 
                      ...editData, 
                      tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                    })}
                    placeholder="Smoke, Regression, API"
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(false)}>Отмена</Button>
            <Button onClick={saveNodeEdit}>Сохранить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={exportDialog} onOpenChange={setExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Экспорт в Repository</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
              <p className="text-sm text-blue-700 dark:text-blue-400">
                Структура Mind Map будет преобразована в папки и тест-кейсы в выбранном проекте.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Выберите проект</Label>
              <Select onValueChange={(projectId) => exportToRepository(projectId)}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите проект" />
                </SelectTrigger>
                <SelectContent>
                  {projects.filter(p => p.status === 'active').map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({p.key})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="bg-slate-500/10 border border-slate-500/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">
                📁 Узлы типа "Папка" станут папками в Repository<br />
                📝 Узлы типа "Тест-кейс" станут черновиками тест-кейсов<br />
                🔗 Иерархия будет сохранена
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExportDialog(false)}>Отмена</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save Process Dialog */}
      <Dialog open={saveProcessDialog} onOpenChange={setSaveProcessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Сохранить процесс</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Название процесса</Label>
              <Input
                value={processName}
                onChange={(e) => setProcessName(e.target.value)}
                placeholder="Например: Процесс регистрации"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveProcessDialog(false)}>Отмена</Button>
            <Button onClick={saveProcess}>Сохранить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Load Process Dialog */}
      <Dialog open={loadProcessDialog} onOpenChange={setLoadProcessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Загрузить процесс</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-4 max-h-96 overflow-y-auto">
            {savedProcesses.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Нет сохраненных процессов
              </p>
            ) : (
              savedProcesses.map(process => (
                <div
                  key={process.id}
                  className="p-4 border border-border rounded-lg hover:bg-accent cursor-pointer"
                  onClick={() => loadProcess(process)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">{process.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(process.createdAt).toLocaleString('ru-RU')} • {process.nodes.length} узлов
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        const updated = savedProcesses.filter(p => p.id !== process.id);
                        localStorage.setItem('testflow_processes', JSON.stringify(updated));
                        setSavedProcesses(updated);
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLoadProcessDialog(false)}>Закрыть</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <AlertDialog open={!!successMessage} onOpenChange={() => setSuccessMessage('')}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Download className="w-5 h-5 text-green-500" />
              Успешно
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              {successMessage}
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