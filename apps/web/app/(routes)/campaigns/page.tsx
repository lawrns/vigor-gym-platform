"use client";

export default function Page() {
  if (process.env.NEXT_PUBLIC_CAMPAIGNS !== '1') {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Campañas</h1>
        <p className="text-sm text-muted-foreground">Esta función está deshabilitada temporalmente.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Campañas</h1>
      <p className="text-sm text-muted-foreground">Crea campañas básicas (borrador).</p>
    </div>
  );
}
