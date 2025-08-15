import { NextResponse } from 'next/server';

export async function GET() {
  // Mock dataset for membership management UI
  const members = [
    { id: 'mem_001', name: 'María López', email: 'maria@sportia.mx', status: 'Activa', plan: 'TP PRO', lastVisit: '2025-08-10', attendance30d: 7 },
    { id: 'mem_002', name: 'Carlos Pérez', email: 'carlos@fuerzafit.mx', status: 'Activa', plan: 'TP ON', lastVisit: '2025-08-12', attendance30d: 4 },
    { id: 'mem_003', name: 'Ana Torres', email: 'ana@ritmo.mx', status: 'En riesgo', plan: 'TP PRO', lastVisit: '2025-07-28', attendance30d: 1 },
    { id: 'mem_004', name: 'Javier Ruiz', email: 'javier@vitalis.mx', status: 'Inactiva', plan: 'TP+', lastVisit: '2025-06-01', attendance30d: 0 }
  ];
  return NextResponse.json({ members });
}




