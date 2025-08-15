export function ScanProgressCard({ memberId, lastScanAt, deltaFatPct }: { memberId: string; lastScanAt?: string; deltaFatPct?: number }) {
  return (
    <div className="shadow-card rounded-lg bg-white p-4">
      <div className="text-sm text-neutral-500">Miembro</div>
      <div className="font-medium">{memberId}</div>
      <div className="mt-2 text-sm text-neutral-600">Último escaneo: {lastScanAt ? new Date(lastScanAt).toLocaleString('es-MX') : '—'}</div>
      <div className="mt-1 text-sm">
        Cambio de grasa corporal: <span className={deltaFatPct && deltaFatPct < 0 ? 'text-green-600' : 'text-neutral-800'}>{deltaFatPct ?? 0}%</span>
      </div>
    </div>
  );
}




