/**
 * Revenue Sparkline Component
 *
 * Pure SVG sparkline chart for revenue trends visualization.
 * Lightweight, responsive, and accessible.
 */

interface RevenueSparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
}

export function RevenueSparkline({
  data,
  width = 120,
  height = 40,
  color = '#10b981', // green-500
  strokeWidth = 2,
  className = '',
}: RevenueSparklineProps) {
  if (!data || data.length < 2) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ width, height }}>
        <span className="text-xs text-gray-400">No data</span>
      </div>
    );
  }

  // Calculate min/max for scaling
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1; // Avoid division by zero

  // Generate SVG path
  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');

  const pathData = `M ${points}`;

  // Calculate trend
  const firstValue = data[0];
  const lastValue = data[data.length - 1];
  const isPositive = lastValue >= firstValue;
  const trendColor = isPositive ? '#10b981' : '#ef4444'; // green-500 : red-500

  return (
    <div className={`relative ${className}`}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-visible"
        role="img"
        aria-label={`Revenue trend chart showing ${isPositive ? 'positive' : 'negative'} trend`}
      >
        {/* Background grid (subtle) */}
        <defs>
          <pattern id="sparkline-grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path
              d="M 10 0 L 0 0 0 10"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              opacity="0.1"
            />
          </pattern>
        </defs>
        <rect width={width} height={height} fill="url(#sparkline-grid)" />

        {/* Main trend line */}
        <path
          d={pathData}
          fill="none"
          stroke={trendColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-colors duration-200"
        />

        {/* Data points */}
        {data.map((value, index) => {
          const x = (index / (data.length - 1)) * width;
          const y = height - ((value - min) / range) * height;

          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="2"
              fill={trendColor}
              className="transition-colors duration-200"
            />
          );
        })}

        {/* Highlight last point */}
        {(() => {
          const lastIndex = data.length - 1;
          const x = (lastIndex / (data.length - 1)) * width;
          const y = height - ((data[lastIndex] - min) / range) * height;

          return (
            <circle
              cx={x}
              cy={y}
              r="3"
              fill={trendColor}
              stroke="white"
              strokeWidth="1"
              className="transition-colors duration-200"
            />
          );
        })()}
      </svg>

      {/* Trend indicator */}
      <div className="absolute -top-1 -right-1">
        <div
          className={`w-2 h-2 rounded-full ${isPositive ? 'bg-green-500' : 'bg-red-500'}`}
          title={`Trend: ${isPositive ? 'Up' : 'Down'}`}
        />
      </div>
    </div>
  );
}

// Hook for generating revenue trend data
export function useRevenueTrendData(days: number = 7): number[] {
  // Simulate revenue data with realistic patterns
  const baseRevenue = 2000;
  const data: number[] = [];

  for (let i = 0; i < days; i++) {
    // Add some realistic variance
    const dayOfWeek = i % 7;
    const weekendMultiplier = dayOfWeek === 0 || dayOfWeek === 6 ? 1.3 : 1.0; // Weekend boost
    const randomVariance = 0.8 + Math.random() * 0.4; // ±20% variance
    const trendFactor = 1 + i * 0.02; // Slight upward trend

    const revenue = Math.floor(baseRevenue * weekendMultiplier * randomVariance * trendFactor);

    data.push(revenue);
  }

  return data;
}
