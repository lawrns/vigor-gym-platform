"use client";
import { useSearchParams } from 'next/navigation';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function Chart({ id, emptyText }: { id: string; emptyText?: string }) {
  const sp = useSearchParams();
  // TODO: fetch data using /api/kpi/overview with from/to (& compare)
  const data: any[] = [];
  
  if (!data.length) {
    return <div className="text-sm text-muted-foreground">{emptyText ?? 'Sin datos'}</div>;
  }
  
  return (
    <div className="w-full h-64">
      <ResponsiveContainer>
        <LineChart data={data}>
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="value" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
