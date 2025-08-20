"use client";
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function FailedPayments() {
  // TODO: fetch /api/billing/failed?days=7
  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">Pagos fallidos (7d)</h3>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground">Sin datos</div>
      </CardContent>
    </Card>
  );
}
