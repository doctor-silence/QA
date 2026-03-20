import React, { useState } from 'react';
import { ChevronRight, Folder, FolderOpen, Plus } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

function FolderItem({ folder, folders, selectedId, onSelect, onAddSubfolder, level = 0 }) {
  const [isOpen, setIsOpen] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const children = folders.filter(f => f.parent_id === folder.id);
  const hasChildren = children.length > 0;
  const isSelected = selectedId === folder.id;

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all duration-150 group",
          isSelected ? "bg-primary/10 text-primary" : "hover:bg-accent text-foreground"
        )}
        style={{ paddingLeft: `${12 + level * 16}px` }}
        onClick={() => onSelect(folder.id)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {hasChildren ? (
          <button 
            onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
            className="p-0.5 hover:bg-accent rounded"
          >
            <ChevronRight className={cn("w-4 h-4 transition-transform", isOpen && "rotate-90")} />
          </button>
        ) : (
          <span className="w-5" />
        )}
        {isOpen && hasChildren ? (
          <FolderOpen className="w-4 h-4 text-amber-500" />
        ) : (
          <Folder className="w-4 h-4 text-amber-500" />
        )}
        <span className="text-sm font-medium truncate flex-1">{folder.name}</span>
        
        {isHovered && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddSubfolder(folder.id);
            }}
            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-accent rounded transition-opacity"
            title="Добавить подпапку"
          >
            <Plus className="w-3 h-3" />
          </button>
        )}
      </div>
      
      {isOpen && hasChildren && (
        <div>
          {children.map(child => (
            <FolderItem
              key={child.id}
              folder={child}
              folders={folders}
              selectedId={selectedId}
              onSelect={onSelect}
              onAddSubfolder={onAddSubfolder}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function FolderTree({ folders, selectedId, onSelect, onAddFolder }) {
  const rootFolders = folders.filter(f => !f.parent_id);

  const handleAddSubfolder = (parentId) => {
    onAddFolder(parentId);
  };

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Модули</h3>
        <Button 
          size="sm" 
          variant="ghost" 
          className="h-8 w-8 p-0"
          onClick={() => onAddFolder(null)}
          title="Добавить корневую папку"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      <div className="p-2 max-h-[calc(100vh-280px)] overflow-y-auto">
        <div
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all duration-150",
            selectedId === null ? "bg-primary/10 text-primary" : "hover:bg-accent text-foreground"
          )}
          onClick={() => onSelect(null)}
        >
          <Folder className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Все кейсы</span>
        </div>
        {rootFolders.map(folder => (
          <FolderItem
            key={folder.id}
            folder={folder}
            folders={folders}
            selectedId={selectedId}
            onSelect={onSelect}
            onAddSubfolder={handleAddSubfolder}
          />
        ))}
      </div>
    </div>
  );
}