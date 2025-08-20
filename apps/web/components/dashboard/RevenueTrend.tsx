"use client";
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function RevenueTrend() {
  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">Ingresos</h3>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground">Sin datos - Gráfico próximamente</div>
      </CardContent>
    </Card>
  );
}
