import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { appClient } from '@/api/client';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Database, Copy } from 'lucide-react';
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { value: 'credentials', label: 'Учетные данные', color: 'bg-blue-500/10 text-blue-600 border-blue-500/30' },
  { value: 'api_keys', label: 'API ключи', color: 'bg-purple-500/10 text-purple-600 border-purple-500/30' },
  { value: 'test_data', label: 'Тестовые данные', color: 'bg-green-500/10 text-green-600 border-green-500/30' },
  { value: 'urls', label: 'URL адреса', color: 'bg-amber-500/10 text-amber-600 border-amber-500/30' },
  { value: 'other', label: 'Прочее', color: 'bg-slate-500/10 text-slate-600 border-slate-500/30' }
];

export default function VariableHelper({ onInsert }) {
  const [open, setOpen] = useState(false);
  
  const { data: testData = [] } = useQuery({
    queryKey: ['testData'],
    queryFn: () => appClient.entities.TestData.list()
  });

  const handleInsert = (variableName) => {
    if (onInsert) {
      onInsert(`{{${variableName}}}`);
    }
    setOpen(false);
  };

  const groupedData = CATEGORIES.reduce((acc, cat) => {
    acc[cat.value] = testData.filter(item => item.category === cat.value);
    return acc;
  }, {});

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Database className="w-4 h-4 mr-1" />
          Вставить переменную
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 max-h-96 overflow-y-auto" align="start">
        <div className="space-y-3">
          <div>
            <h4 className="font-semibold text-sm text-foreground mb-1">Доступные переменные</h4>
            <p className="text-xs text-muted-foreground">
              Нажмите на переменную для вставки в текст
            </p>
          </div>
          
          {testData.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground text-sm">
              Нет доступных переменных
            </div>
          ) : (
            <div className="space-y-3">
              {CATEGORIES.map(category => {
                const items = groupedData[category.value];
                if (items.length === 0) return null;
                
                return (
                  <div key={category.value}>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className={cn("text-xs", category.color)}>
                        {category.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">({items.length})</span>
                    </div>
                    <div className="space-y-1">
                      {items.map(item => (
                        <button
                          key={item.id}
                          onClick={() => handleInsert(item.variable_name)}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-accent transition-colors group"
                        >
                          <div className="flex items-center justify-between">
                            <code className="text-xs font-mono text-foreground">
                              {`{{${item.variable_name}}}`}
                            </code>
                            <Copy className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          {item.description && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {item.description}
                            </p>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}