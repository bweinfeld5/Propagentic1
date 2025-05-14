import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { SafeMotion } from "../shared/SafeMotion";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Helper function to get computed CSS variable value
const getCssVariable = (variable) => {
  if (typeof window === 'undefined') return ''; // Return empty string for SSR/build
  return getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
};

/**
 * StatsChart Component
 * 
 * A reusable component for rendering line or bar charts with animations
 * for dashboard statistics and metrics visualization.
 */
const StatsChart = ({
  type = 'line',
  data,
  height = 200,
  showLegend = true,
  animate = true,
  title,
  className = '',
  options = {},
  isLoading = false
}) => {
  const [chartData, setChartData] = useState(null);
  
  // Initialize the chart when data changes
  useEffect(() => {
    if (!data || isLoading) return;
    
    setChartData(data);
  }, [data, isLoading]);
  
  // Memoize options to use CSS variables
  const chartOptions = useMemo(() => {
    // Get computed colors (provide fallbacks for initial render/SSR)
    const textColorMuted = getCssVariable('--chart-text-muted') || '#6B7280'; // gray-500
    const textColorBase = getCssVariable('--chart-text-base') || '#374151'; // gray-700
    const gridColor = getCssVariable('--chart-grid-color') || '#E5E7EB'; // gray-200
    const tooltipBg = getCssVariable('--chart-tooltip-bg') || '#FFFFFF';
    const tooltipBorder = getCssVariable('--chart-tooltip-border') || '#E5E7EB';
    const tooltipTitle = getCssVariable('--chart-tooltip-title') || '#111827';
    const tooltipBody = getCssVariable('--chart-tooltip-body') || '#374151';

    const defaultOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: showLegend,
          position: 'top',
          labels: { color: textColorMuted, usePointStyle: true, boxWidth: 6, font: { size: 12 } }
        },
        title: {
          display: !!title,
          text: title,
          color: textColorBase,
          font: { size: 14, weight: 'normal' }
        },
        tooltip: {
          backgroundColor: tooltipBg,
          titleColor: tooltipTitle,
          bodyColor: tooltipBody,
          borderColor: tooltipBorder,
          borderWidth: 1,
          padding: 10,
          boxPadding: 3,
          usePointStyle: true,
          // Add theme-aware styling to tooltips if needed via external mode
        }
      },
      scales: {
        x: {
          grid: { color: `${gridColor}80`, drawBorder: true }, // Add alpha to grid color
          ticks: { color: textColorMuted, font: { size: 11 } }
        },
        y: {
          grid: { color: `${gridColor}80`, drawBorder: true }, // Add alpha to grid color
          ticks: { color: textColorMuted, font: { size: 11 } }
        }
      },
      // Ensure interaction styles potentially use theme colors if needed
      interaction: {
          mode: 'index',
          intersect: false,
      },
    };

    // Deep merge custom options (implementation depends on project utils or simple spread)
    // For now, simple spread for top-level plugin/scale overrides
    return { 
        ...defaultOptions, 
        ...options, 
        plugins: {...defaultOptions.plugins, ...options.plugins},
        scales: {...defaultOptions.scales, ...options.scales}
    };
    
  }, [showLegend, title, options]); // Only recompute when these props change
  
  // Loading State - Use theme colors
  if (isLoading) {
    return (
      <div className={`w-full ${className}`} style={{ height: `${height}px` }}>
        <div className="w-full h-full flex items-center justify-center bg-neutral-100 dark:bg-neutral-800/50 rounded-lg animate-pulse">
          <svg className="w-10 h-10 text-neutral-300 dark:text-neutral-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </div>
    );
  }
  
  // No Data State - Use theme colors
  if (!chartData) {
    return (
      <div className={`w-full ${className}`} style={{ height: `${height}px` }}>
        <div className="w-full h-full flex items-center justify-center bg-neutral-50 dark:bg-neutral-800/30 rounded-lg">
          <p className="text-content-subtle dark:text-content-darkSubtle text-sm">No data available</p>
        </div>
      </div>
    );
  }
  
  // Render Chart
  const chart = type === 'line' ? (
    <Line data={chartData} options={chartOptions} height={height} />
  ) : (
    <Bar data={chartData} options={chartOptions} height={height} />
  );
  
  // Optional Animation Wrapper
  if (animate) {
    return (
      <SafeMotion.div
        className={`w-full ${className}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {chart}
      </SafeMotion.div>
    );
  }
  
  return <div className={`w-full ${className}`}>{chart}</div>;
};

StatsChart.propTypes = {
  /** Chart type - 'line' or 'bar' */
  type: PropTypes.oneOf(['line', 'bar']),
  /** Chart data conforming to Chart.js format */
  data: PropTypes.object,
  /** Height of the chart in pixels */
  height: PropTypes.number,
  /** Whether to show the legend */
  showLegend: PropTypes.bool,
  /** Whether to animate the chart appearance */
  animate: PropTypes.bool,
  /** Chart title */
  title: PropTypes.string,
  /** Additional CSS classes */
  className: PropTypes.string,
  /** Chart.js options override */
  options: PropTypes.object,
  /** Loading state */
  isLoading: PropTypes.bool
};

export default StatsChart; 