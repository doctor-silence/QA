import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExternalLink, Plus, X, Link2 } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

const typeColors = {
  Feature: "bg-blue-100 text-blue-700",
  Bug: "bg-red-100 text-red-700",
  Story: "bg-purple-100 text-purple-700"
};

export default function RequirementsSection({ requirements = [], onChange }) {
  const [showForm, setShowForm] = useState(false);
  const [newReq, setNewReq] = useState({ name: '', link: '', type: 'Feature' });

  const addRequirement = () => {
    if (!newReq.name.trim()) return;
    onChange([...requirements, newReq]);
    setNewReq({ name: '', link: '', type: 'Feature' });
    setShowForm(false);
  };

  const removeRequirement = (index) => {
    onChange(requirements.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          <Link2 className="w-4 h-4" />
          Связанные требования
        </Label>
        {!showForm && (
          <Button 
            type="button" 
            size="sm" 
            variant="ghost"
            onClick={() => setShowForm(true)}
          >
            <Plus className="w-3 h-3 mr-1" /> Добавить
          </Button>
        )}
      </div>

      {requirements.length > 0 && (
        <div className="space-y-2">
          {requirements.map((req, index) => (
            <div key={index} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
              <Badge className={typeColors[req.type]}>{req.type}</Badge>
              <span className="text-sm flex-1 truncate">{req.name}</span>
              {req.link && (
                <a 
                  href={req.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-indigo-500 hover:text-indigo-700"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              <button
                type="button"
                onClick={() => removeRequirement(index)}
                className="text-slate-400 hover:text-red-500"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="p-3 border border-slate-200 rounded-lg space-y-3">
          <div className="space-y-2">
            <Label className="text-xs">Тип</Label>
            <Select value={newReq.type} onValueChange={(v) => setNewReq({...newReq, type: v})}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Feature">Feature</SelectItem>
                <SelectItem value="Bug">Bug</SelectItem>
                <SelectItem value="Story">Story</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Название</Label>
            <Input
              value={newReq.name}
              onChange={(e) => setNewReq({...newReq, name: e.target.value})}
              placeholder="Например: AUTH-123 Авторизация пользователей"
              className="h-8"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Ссылка (опционально)</Label>
            <Input
              value={newReq.link}
              onChange={(e) => setNewReq({...newReq, link: e.target.value})}
              placeholder="https://jira.company.com/..."
              className="h-8"
            />
          </div>
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={addRequirement}>
              Добавить
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setShowForm(false)}>
              Отмена
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}