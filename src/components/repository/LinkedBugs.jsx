import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bug, ExternalLink, Trash2 } from 'lucide-react';
import { cn } from "@/lib/utils";

const trackerColors = {
  jira: "bg-blue-50 text-blue-700 border-blue-200",
  youtrack: "bg-purple-50 text-purple-700 border-purple-200",
  linear: "bg-indigo-50 text-indigo-700 border-indigo-200",
  github: "bg-slate-50 text-slate-700 border-slate-200",
};

export default function LinkedBugs({ bugs = [], onRemove, canEdit = false }) {
  if (!bugs || bugs.length === 0) {
    return (
      <div className="bg-slate-50 rounded-lg p-4 text-center">
        <Bug className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <p className="text-sm text-slate-500">Нет связанных багов</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {bugs.map((bug, idx) => (
        <div 
          key={idx} 
          className="bg-white border border-slate-200 rounded-lg p-3 flex items-center justify-between hover:shadow-sm transition-shadow"
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Bug className="w-4 h-4 text-red-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge 
                  variant="outline" 
                  className={cn("text-xs", trackerColors[bug.tracker_type?.toLowerCase()] || trackerColors.github)}
                >
                  {bug.tracker_type}
                </Badge>
                {bug.bug_id && (
                  <span className="text-xs font-mono text-slate-500">{bug.bug_id}</span>
                )}
              </div>
              <p className="text-sm text-slate-700 truncate">{bug.title}</p>
              {bug.created_at && (
                <p className="text-xs text-slate-400 mt-1">
                  Создан: {new Date(bug.created_at).toLocaleDateString('ru-RU')}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {bug.url && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => window.open(bug.url, '_blank')}
              >
                <ExternalLink className="w-4 h-4 text-slate-500" />
              </Button>
            )}
            {canEdit && onRemove && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-500 hover:text-red-700"
                onClick={() => onRemove(idx)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}