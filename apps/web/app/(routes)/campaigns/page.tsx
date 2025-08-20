"use client";

if (process.env.NEXT_PUBLIC_CAMPAIGNS !== '1') {
  throw new Error('Campaigns disabled');
}

export default function Page() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Campañas</h1>
      <p className="text-sm text-muted-foreground">Crea campañas básicas (borrador).</p>
    </div>
  );
}
