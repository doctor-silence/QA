import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Eye, TestTube, Crown } from 'lucide-react';
import { cn } from "@/lib/utils";

const roleConfig = {
  Viewer: {
    icon: Eye,
    label: 'Viewer',
    color: 'bg-slate-50 text-slate-600 border-slate-200'
  },
  Tester: {
    icon: TestTube,
    label: 'Тестировщик',
    color: 'bg-blue-50 text-blue-600 border-blue-200'
  },
  'QA Lead': {
    icon: Crown,
    label: 'Лид',
    color: 'bg-purple-50 text-purple-600 border-purple-200'
  },
  Admin: {
    icon: Crown,
    label: 'Admin',
    color: 'bg-red-50 text-red-600 border-red-200'
  }
};

export default function RoleBadge({ role, size = 'default' }) {
  const config = roleConfig[role] || roleConfig.Tester;
  const Icon = config.icon;

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "font-medium",
        config.color,
        size === 'sm' && "text-xs px-2 py-0.5"
      )}
    >
      <Icon className={cn("mr-1", size === 'sm' ? "w-3 h-3" : "w-4 h-4")} />
      {config.label}
    </Badge>
  );
}