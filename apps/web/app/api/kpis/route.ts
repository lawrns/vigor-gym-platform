import { NextResponse } from 'next/server';

export async function GET() {
  // Placeholder KPIs; wire to real analytics later
  return NextResponse.json({
    mrrMXN: 250000,
    churn30dPct: 2.1,
    attendancePerMember: 2.7,
    scanCompletionPct: 63,
  });
}

