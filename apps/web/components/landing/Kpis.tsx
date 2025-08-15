"use client";
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

type Kpis = {
  mrrMXN: number;
  churn30dPct: number;
  attendancePerMember: number;
  scanCompletionPct: number;
};

export function Kpis() {
  const [data, setData] = useState<Kpis | null>(null);

  useEffect(() => {
    fetch('/api/kpis')
      .then((r) => r.json())
      .then((d: Kpis) => setData(d))
      .catch(() => setData(null));
  }, []);

  return (
    <section className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="MRR" value={data ? new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(data.mrrMXN) : '—'} />
        <KpiCard label="Churn 30d" value={data ? `${data.churn30dPct}%` : '—'} />
        <KpiCard label="Asist./miembro" value={data ? `${data.attendancePerMember}` : '—'} />
        <KpiCard label="Escaneo completado" value={data ? `${data.scanCompletionPct}%` : '—'} />
      </div>
    </section>
  );
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35 }}
      className="rounded-xl border border-neutral-200 bg-white p-4"
    >
      <div className="text-xs text-neutral-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </motion.div>
  );
}




