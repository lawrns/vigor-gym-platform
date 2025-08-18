"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Icons } from '../../lib/icons/registry';
import { MAX_DAYS } from '../../lib/constants/kpi';

export function DashboardFilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [compareEnabled, setCompareEnabled] = useState(
    searchParams.has('compareFrom') && searchParams.has('compareTo')
  );
  const [rangeError, setRangeError] = useState<string | null>(null);

  const currentRange = getCurrentRange(searchParams);

  // Validate current date range from URL params
  const validateCurrentRange = () => {
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    if (from && to) {
      const fromDate = new Date(from);
      const toDate = new Date(to);

      if (!isNaN(fromDate.getTime()) && !isNaN(toDate.getTime())) {
        const rangeDays = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
        if (rangeDays > MAX_DAYS) {
          setRangeError(`Current date range (${rangeDays} days) exceeds maximum of ${MAX_DAYS} days`);
          return;
        }
      }
    }

    setRangeError(null);
  };

  // Check range validation when search params change
  useEffect(() => {
    validateCurrentRange();
  }, [searchParams]);

  const setRange = (days: number) => {
    // Validate range doesn't exceed MAX_DAYS
    if (days > MAX_DAYS) {
      setRangeError(`Date range cannot exceed ${MAX_DAYS} days`);
      return;
    }

    // Clear any previous error
    setRangeError(null);

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
    <div
      data-testid="dashboard-filter-bar"
      className="mb-6 flex flex-wrap items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Período:</span>
        <div className="flex gap-1">
          <FilterButton
            active={currentRange === '7d'}
            onClick={() => setRange(7)}
            testId="range-7d"
          >
            7d
          </FilterButton>
          <FilterButton
            active={currentRange === '30d'}
            onClick={() => setRange(30)}
            testId="range-30d"
          >
            30d
          </FilterButton>
          <FilterButton
            active={currentRange === '90d'}
            onClick={() => setRange(90)}
            testId="range-90d"
          >
            90d
          </FilterButton>
        </div>
        {rangeError && (
          <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
            <Icons.AlertCircle className="h-4 w-4" />
            <span>{rangeError}</span>
          </div>
        )}
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
  children,
  testId
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  testId?: string;
}) {
  return (
    <button
      onClick={onClick}
      data-testid={testId}
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
