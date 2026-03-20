import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Link2, Users, BarChart2 } from 'lucide-react';
import { usePermissions } from '@/components/shared/usePermissions';
import AuditLogContent from '@/components/management/AuditLogContent';
import TraceabilityContent from '@/components/management/TraceabilityContent';
import WorkloadContent from '@/components/management/WorkloadContent';
import TeamContent from '@/components/management/TeamContent';

export default function Management() {
  const permissions = usePermissions();
  const [activeTab, setActiveTab] = useState('team');

  const tabs = [
    { value: 'team', label: 'Команда', icon: Users, show: true },
    { value: 'workload', label: 'Workload', icon: BarChart2, show: permissions.isAdmin || permissions.role === 'QA Lead' },
    { value: 'traceability', label: 'Трассируемость', icon: Link2, show: true },
    { value: 'audit', label: 'Аудит', icon: Shield, show: permissions.isAdmin }
  ].filter(tab => tab.show);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Управление</h1>
        <p className="text-muted-foreground mt-1">
          Команда, аудит, трассируемость и распределение нагрузки
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <TabsTrigger 
                key={tab.value} 
                value={tab.value}
                className="flex items-center gap-2 py-3"
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <div className="mt-6">
          <TabsContent value="team" className="m-0">
            <TeamContent />
          </TabsContent>

          {(permissions.isAdmin || permissions.role === 'QA Lead') && (
            <TabsContent value="workload" className="m-0">
              <WorkloadContent />
            </TabsContent>
          )}

          <TabsContent value="traceability" className="m-0">
            <TraceabilityContent />
          </TabsContent>

          {permissions.isAdmin && (
            <TabsContent value="audit" className="m-0">
              <AuditLogContent />
            </TabsContent>
          )}
        </div>
      </Tabs>
    </div>
  );
}