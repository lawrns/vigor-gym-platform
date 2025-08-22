"use client";

export default function Page() {
  if (process.env.NEXT_PUBLIC_JOURNEYS !== '1') {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Journeys</h1>
        <p className="text-sm text-muted-foreground">Esta función está deshabilitada temporalmente.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Journeys</h1>
      <p className="text-sm text-muted-foreground">Define flujos automatizados (borrador).</p>
    </div>
  );
}
