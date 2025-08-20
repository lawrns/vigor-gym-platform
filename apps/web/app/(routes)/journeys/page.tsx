"use client";

if (process.env.NEXT_PUBLIC_JOURNEYS !== '1') {
  throw new Error('Journeys disabled');
}

export default function Page() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Journeys</h1>
      <p className="text-sm text-muted-foreground">Define flujos automatizados (borrador).</p>
    </div>
  );
}
