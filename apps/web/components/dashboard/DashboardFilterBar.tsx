"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function DashboardFilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [compareEnabled, setCompareEnabled] = useState(
    searchParams.has('compareFrom') && searchParams.has('compareTo')
  );

  const currentRange = getCurrentRange(searchParams);

  const setRange = (days: number) => {
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - days + 1);
    
    // Set to end of day for 'to' and start of day for 'from'
    to.setHours(23, 59, 59, 999);
    from.setHours(0, 0, 0, 0);

    const params = new URLSearchParams(searchParams.toString());
    params.set("from", from.toISOString());
    params.set("to", to.toISOString());

    // If compare is enabled, set comparison period (previous period)
    if (compareEnabled) {
      const compareFrom = new Date(from);
      const compareTo = new Date(from);
      compareFrom.setDate(compareFrom.getDate() - days);
      compareTo.setDate(compareTo.getDate() - 1);
      compareTo.setHours(23, 59, 59, 999);
      compareFrom.setHours(0, 0, 0, 0);
      
      params.set("compareFrom", compareFrom.toISOString());
      params.set("compareTo", compareTo.toISOString());
    } else {
      params.delete("compareFrom");
      params.delete("compareTo");
    }

    router.push(`/dashboard?${params.toString()}`);
  };

  const toggleCompare = () => {
    const newCompareEnabled = !compareEnabled;
    setCompareEnabled(newCompareEnabled);

    const params = new URLSearchParams(searchParams.toString());

    if (newCompareEnabled) {
      // Add comparison for current range
      const from = searchParams.get('from');
      const to = searchParams.get('to');

      if (from && to) {
        const fromDate = new Date(from);
        const toDate = new Date(to);
        const rangeDays = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));

        const compareFrom = new Date(fromDate);
        const compareTo = new Date(fromDate);
        compareFrom.setDate(compareFrom.getDate() - rangeDays);
        compareTo.setDate(compareTo.getDate() - 1);
        compareTo.setHours(23, 59, 59, 999);
        compareFrom.setHours(0, 0, 0, 0);

        params.set("compareFrom", compareFrom.toISOString());
        params.set("compareTo", compareTo.toISOString());
      } else {
        // If no current range, set a default 7-day comparison
        const to = new Date();
        const from = new Date();
        from.setDate(to.getDate() - 6);
        to.setHours(23, 59, 59, 999);
        from.setHours(0, 0, 0, 0);

        const compareFrom = new Date(from);
        const compareTo = new Date(from);
        compareFrom.setDate(compareFrom.getDate() - 7);
        compareTo.setDate(compareTo.getDate() - 1);
        compareTo.setHours(23, 59, 59, 999);
        compareFrom.setHours(0, 0, 0, 0);

        params.set("from", from.toISOString());
        params.set("to", to.toISOString());
        params.set("compareFrom", compareFrom.toISOString());
        params.set("compareTo", compareTo.toISOString());
      }
    } else {
      params.delete("compareFrom");
      params.delete("compareTo");
    }

    router.push(`/dashboard?${params.toString()}`);
  };

  return (
    <div className="mb-6 flex flex-wrap items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Período:</span>
        <div className="flex gap-1">
          <FilterButton 
            active={currentRange === '7d'} 
            onClick={() => setRange(7)}
          >
            7d
          </FilterButton>
          <FilterButton 
            active={currentRange === '30d'} 
            onClick={() => setRange(30)}
          >
            30d
          </FilterButton>
          <FilterButton 
            active={currentRange === '90d'} 
            onClick={() => setRange(90)}
          >
            90d
          </FilterButton>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            checked={compareEnabled}
            onChange={toggleCompare}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Comparar con período anterior
        </label>
      </div>
      
      {searchParams.get('from') && searchParams.get('to') && (
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {formatDateRange(searchParams.get('from')!, searchParams.get('to')!)}
          {compareEnabled && searchParams.get('compareFrom') && searchParams.get('compareTo') && (
            <span className="ml-2">
              vs {formatDateRange(searchParams.get('compareFrom')!, searchParams.get('compareTo')!)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function FilterButton({ 
  active, 
  onClick, 
  children 
}: { 
  active: boolean; 
  onClick: () => void; 
  children: React.ReactNode; 
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 text-sm rounded-md transition-colors ${
        active
          ? 'bg-blue-600 text-white'
          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
      }`}
    >
      {children}
    </button>
  );
}

function getCurrentRange(searchParams: URLSearchParams): string | null {
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  
  if (!from || !to) return null;
  
  const fromDate = new Date(from);
  const toDate = new Date(to);
  const days = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (days <= 7) return '7d';
  if (days <= 30) return '30d';
  if (days <= 90) return '90d';
  return 'custom';
}

function formatDateRange(from: string, to: string): string {
  const fromDate = new Date(from);
  const toDate = new Date(to);
  
  const options: Intl.DateTimeFormatOptions = { 
    month: 'short', 
    day: 'numeric' 
  };
  
  return `${fromDate.toLocaleDateString('es-MX', options)} - ${toDate.toLocaleDateString('es-MX', options)}`;
}
