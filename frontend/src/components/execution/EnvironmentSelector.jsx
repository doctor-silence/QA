import React from 'react';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Monitor, Smartphone } from 'lucide-react';

const BROWSERS = ['Chrome', 'Firefox', 'Safari', 'Edge'];
const OS = ['Windows', 'macOS', 'Linux', 'iOS', 'Android'];

export default function EnvironmentSelector({ environment, onChange }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Monitor className="w-4 h-4 text-muted-foreground" />
        <h4 className="text-sm font-semibold text-foreground">Окружение для тестирования</h4>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Браузер</Label>
          <Select 
            value={environment.browser} 
            onValueChange={(v) => onChange({ ...environment, browser: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Выберите браузер" />
            </SelectTrigger>
            <SelectContent>
              {BROWSERS.map(b => (
                <SelectItem key={b} value={b}>{b}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>ОС</Label>
          <Select 
            value={environment.os} 
            onValueChange={(v) => onChange({ ...environment, os: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Выберите ОС" />
            </SelectTrigger>
            <SelectContent>
              {OS.map(o => (
                <SelectItem key={o} value={o}>{o}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Версия (опционально)</Label>
        <Input
          placeholder="например: Chrome 120, iOS 17.2"
          value={environment.version || ''}
          onChange={(e) => onChange({ ...environment, version: e.target.value })}
        />
      </div>
    </div>
  );
}