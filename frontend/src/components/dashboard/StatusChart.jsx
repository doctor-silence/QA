import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = {
  Pass: '#10B981',
  Fail: '#EF4444',
  Blocked: '#F59E0B',
  Skip: '#6B7280',
  Pending: '#CBD5E1'
};

export default function StatusChart({ data }) {
  const chartData = Object.entries(data).map(([name, value]) => ({ name, value }));
  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return (
      <div className="bg-card rounded-2xl p-6 border border-border shadow-sm h-full flex flex-col">
        <h3 className="text-lg font-semibold text-foreground mb-4">Статусы тестов</h3>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Нет данных для отображения</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
      <h3 className="text-lg font-semibold text-foreground mb-4">Статусы тестов</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.name]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                borderRadius: '12px', 
                border: 'none', 
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
              }} 
            />
            <Legend 
              verticalAlign="bottom" 
              iconType="circle"
              formatter={(value) => <span className="text-muted-foreground text-sm">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}