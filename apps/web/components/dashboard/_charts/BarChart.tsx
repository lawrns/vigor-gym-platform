"use client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function Chart({ id, emptyText }: { id: string; emptyText?: string }) {
  const data: any[] = [];
  
  if (!data.length) {
    return <div className="text-sm text-muted-foreground">{emptyText ?? 'Sin datos'}</div>;
  }
  
  return (
    <div className="w-full h-64">
      <ResponsiveContainer>
        <BarChart data={data}>
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
