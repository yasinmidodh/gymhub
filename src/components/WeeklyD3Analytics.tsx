import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { DailyCaloriePoint } from '../utils/calorieAnalytics';
import { processWeeklyD3Data, WeeklyD3Datum } from '../utils/d3AnalyticsUtils';
import { ThemeSettings, hexToRgb } from '../utils/theme';
import { triggerHaptic } from '../utils/media';
import { playButtonClickSound } from '../utils/soundEffects';
import { 
  Flame, 
  Activity, 
  Calendar, 
  TrendingUp, 
  Award, 
  Layers, 
  BarChart2, 
  CheckCircle2, 
  Eye, 
  Table as TableIcon,
  Zap,
  Info
} from 'lucide-react';

interface WeeklyD3AnalyticsProps {
  history: DailyCaloriePoint[];
  dailyCalorieGoal?: number;
  onOpenGoalSettings?: () => void;
  themeSettings?: ThemeSettings;
  className?: string;
  id?: string;
}

export type D3ViewMode = 'combo' | 'calories' | 'frequency';

export const WeeklyD3Analytics: React.FC<WeeklyD3AnalyticsProps> = ({
  history,
  dailyCalorieGoal,
  onOpenGoalSettings,
  themeSettings,
  className = '',
  id,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [viewMode, setViewMode] = useState<D3ViewMode>('combo');
  const [hoveredPoint, setHoveredPoint] = useState<WeeklyD3Datum | null>(null);
  const [showDataTable, setShowDataTable] = useState(false);

  // Process data using tested pure logic, factoring in custom daily calorie goal
  const { data, summary } = useMemo(
    () => processWeeklyD3Data(history, dailyCalorieGoal),
    [history, dailyCalorieGoal]
  );

  const isDark = themeSettings ? themeSettings.mode !== 'light' : true;
  const accentColor = themeSettings?.accentHex || '#00E5FF';
  const accentRgb = hexToRgb(accentColor);
  const secondaryColor = '#F59E0B'; // Amber for session frequency

  // D3 Chart Drawing Effect
  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clean redraw

    const width = 760;
    const height = 340;
    const margin = { top: 35, right: 60, bottom: 45, left: 65 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Defs for gradients and shadow filters
    const defs = svg.append('defs');

    // Calorie Area Gradient
    const calorieGradient = defs.append('linearGradient')
      .attr('id', 'calorie-area-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    calorieGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', accentColor)
      .attr('stop-opacity', isDark ? 0.45 : 0.35);

    calorieGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', accentColor)
      .attr('stop-opacity', 0.0);

    // Session Bar Gradient
    const sessionBarGradient = defs.append('linearGradient')
      .attr('id', 'session-bar-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    sessionBarGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', secondaryColor)
      .attr('stop-opacity', 0.85);

    sessionBarGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', secondaryColor)
      .attr('stop-opacity', 0.35);

    // Glow filter
    const filter = defs.append('filter')
      .attr('id', 'd3-glow')
      .attr('x', '-20%')
      .attr('y', '-20%')
      .attr('width', '140%')
      .attr('height', '140%');

    filter.append('feGaussianBlur')
      .attr('stdDeviation', '3')
      .attr('result', 'coloredBlur');

    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3.scaleBand()
      .domain(data.map(d => d.dayLabel))
      .range([0, chartWidth])
      .padding(0.38);

    const yScaleCalories = d3.scaleLinear()
      .domain([0, summary.calorieDomain[1]])
      .range([chartHeight, 0])
      .nice();

    const yScaleSessions = d3.scaleLinear()
      .domain([0, summary.sessionDomain[1]])
      .range([chartHeight, 0])
      .nice();

    // Horizontal Grid Lines
    const gridColor = isDark ? '#1E293B' : '#E2E8F0';
    g.append('g')
      .attr('class', 'grid')
      .call(
        d3.axisLeft(yScaleCalories)
          .ticks(5)
          .tickSize(-chartWidth)
          .tickFormat(() => '')
      )
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick line')
        .attr('stroke', gridColor)
        .attr('stroke-dasharray', '3,3')
        .attr('stroke-opacity', 0.6)
      );

    // Daily Calorie Target Reference Line
    const targetCalories = dailyCalorieGoal || data[0]?.targetCalories || 500;
    if (viewMode !== 'frequency' && targetCalories <= summary.calorieDomain[1]) {
      const targetY = yScaleCalories(targetCalories);
      
      const targetGroup = g.append('g').attr('class', 'target-line-group');

      targetGroup.append('line')
        .attr('x1', 0)
        .attr('x2', chartWidth)
        .attr('y1', targetY)
        .attr('y2', targetY)
        .attr('stroke', '#10B981')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,4')
        .attr('opacity', 0.95);

      const badgeWidth = 118;
      targetGroup.append('rect')
        .attr('x', chartWidth - badgeWidth - 4)
        .attr('y', targetY - 10)
        .attr('width', badgeWidth)
        .attr('height', 20)
        .attr('rx', 6)
        .attr('fill', isDark ? '#064E3B' : '#D1FAE5')
        .attr('stroke', '#10B981')
        .attr('stroke-width', 1);

      targetGroup.append('text')
        .attr('x', chartWidth - badgeWidth / 2 - 4)
        .attr('y', targetY + 3.5)
        .attr('text-anchor', 'middle')
        .attr('fill', isDark ? '#A7F3D0' : '#047857')
        .attr('font-size', '10px')
        .attr('font-weight', '700')
        .attr('font-family', 'monospace')
        .text(`Goal ${targetCalories} kcal`);
    }

    // 1. RENDER CALORIE LAYER (Bars or Area)
    if (viewMode === 'combo' || viewMode === 'calories') {
      // Calorie Area Flow
      const areaGenerator = d3.area<WeeklyD3Datum>()
        .x(d => (xScale(d.dayLabel) || 0) + xScale.bandwidth() / 2)
        .y0(chartHeight)
        .y1(d => yScaleCalories(d.calories))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(data)
        .attr('fill', 'url(#calorie-area-gradient)')
        .attr('d', areaGenerator);

      // Calorie Line
      const calorieLine = d3.line<WeeklyD3Datum>()
        .x(d => (xScale(d.dayLabel) || 0) + xScale.bandwidth() / 2)
        .y(d => yScaleCalories(d.calories))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', accentColor)
        .attr('stroke-width', 2.5)
        .attr('d', calorieLine);

      // Calorie Bars (underneath in combo mode, or primary in calories mode)
      g.selectAll('.calorie-bar')
        .data(data)
        .enter()
        .append('rect')
        .attr('class', 'calorie-bar')
        .attr('x', d => (xScale(d.dayLabel) || 0) + (viewMode === 'combo' ? xScale.bandwidth() * 0.1 : 0))
        .attr('width', viewMode === 'combo' ? xScale.bandwidth() * 0.8 : xScale.bandwidth())
        .attr('y', d => yScaleCalories(d.calories))
        .attr('height', d => Math.max(0, chartHeight - yScaleCalories(d.calories)))
        .attr('rx', 4)
        .attr('fill', d => {
          if (d.calories === 0) return isDark ? '#1E293B' : '#E2E8F0';
          if (d.isToday) return accentColor;
          return `rgba(${accentRgb}, ${viewMode === 'combo' ? 0.35 : 0.85})`;
        })
        .attr('stroke', d => d.isToday ? accentColor : 'transparent')
        .attr('stroke-width', 1.5)
        .style('cursor', 'pointer');
    }

    // 2. RENDER SESSION FREQUENCY LAYER
    if (viewMode === 'combo' || viewMode === 'frequency') {
      if (viewMode === 'frequency') {
        // Lollipop Bars for Frequency Focus
        const lollipops = g.selectAll('.frequency-lollipop')
          .data(data)
          .enter()
          .append('g')
          .attr('class', 'frequency-lollipop');

        lollipops.append('line')
          .attr('x1', d => (xScale(d.dayLabel) || 0) + xScale.bandwidth() / 2)
          .attr('x2', d => (xScale(d.dayLabel) || 0) + xScale.bandwidth() / 2)
          .attr('y1', chartHeight)
          .attr('y2', d => yScaleSessions(d.sessions))
          .attr('stroke', secondaryColor)
          .attr('stroke-width', 3)
          .attr('stroke-dasharray', d => d.sessions === 0 ? '2,2' : 'none')
          .attr('opacity', d => d.sessions === 0 ? 0.3 : 0.9);

        lollipops.append('circle')
          .attr('cx', d => (xScale(d.dayLabel) || 0) + xScale.bandwidth() / 2)
          .attr('cy', d => yScaleSessions(d.sessions))
          .attr('r', d => d.sessions > 0 ? 8 : 4)
          .attr('fill', d => d.sessions > 0 ? secondaryColor : (isDark ? '#334155' : '#CBD5E1'))
          .attr('stroke', isDark ? '#090D16' : '#FFFFFF')
          .attr('stroke-width', 2);

        // Session count numbers above
        lollipops.filter(d => d.sessions > 0)
          .append('text')
          .attr('x', d => (xScale(d.dayLabel) || 0) + xScale.bandwidth() / 2)
          .attr('y', d => yScaleSessions(d.sessions) - 12)
          .attr('text-anchor', 'middle')
          .attr('fill', secondaryColor)
          .attr('font-size', '11px')
          .attr('font-weight', '800')
          .attr('font-family', 'monospace')
          .text(d => `${d.sessions} ${d.sessions === 1 ? 'sess' : 'sess'}`);

      } else {
        // Combo Mode: Frequency Line with Markers overlaid on Calorie flow
        const sessionLine = d3.line<WeeklyD3Datum>()
          .x(d => (xScale(d.dayLabel) || 0) + xScale.bandwidth() / 2)
          .y(d => yScaleSessions(d.sessions))
          .curve(d3.curveMonotoneX);

        g.append('path')
          .datum(data)
          .attr('fill', 'none')
          .attr('stroke', secondaryColor)
          .attr('stroke-width', 2)
          .attr('stroke-dasharray', '5,3')
          .attr('d', sessionLine)
          .attr('opacity', 0.9);

        // Frequency Nodes
        const nodes = g.selectAll('.session-node')
          .data(data)
          .enter()
          .append('g')
          .attr('class', 'session-node');

        nodes.append('circle')
          .attr('cx', d => (xScale(d.dayLabel) || 0) + xScale.bandwidth() / 2)
          .attr('cy', d => yScaleSessions(d.sessions))
          .attr('r', d => d.sessions > 0 ? 5 : 3)
          .attr('fill', d => d.sessions > 0 ? secondaryColor : (isDark ? '#1E293B' : '#94A3B8'))
          .attr('stroke', isDark ? '#000000' : '#FFFFFF')
          .attr('stroke-width', 1.5);

        // Small badge showing frequency if > 0
        nodes.filter(d => d.sessions > 0)
          .append('text')
          .attr('x', d => (xScale(d.dayLabel) || 0) + xScale.bandwidth() / 2)
          .attr('y', d => yScaleSessions(d.sessions) - 9)
          .attr('text-anchor', 'middle')
          .attr('fill', secondaryColor)
          .attr('font-size', '10px')
          .attr('font-weight', '700')
          .attr('font-family', 'monospace')
          .text(d => `${d.sessions}s`);
      }
    }

    // 3. AXES
    const axisColor = isDark ? '#94A3B8' : '#64748B';

    // X Axis
    const xAxis = d3.axisBottom(xScale).tickSize(0);
    const xAxisGroup = g.append('g')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(xAxis);

    xAxisGroup.select('.domain').attr('stroke', isDark ? '#334155' : '#CBD5E1');
    xAxisGroup.selectAll('.tick text')
      .attr('fill', (d) => {
        const datum = data.find(item => item.dayLabel === d);
        if (datum?.isToday) return accentColor;
        return axisColor;
      })
      .attr('font-size', '11px')
      .attr('font-weight', (d) => {
        const datum = data.find(item => item.dayLabel === d);
        return datum?.isToday ? '800' : '600';
      })
      .attr('dy', '14px');

    // Left Axis (Calories)
    if (viewMode !== 'frequency') {
      const yAxisLeft = d3.axisLeft(yScaleCalories)
        .ticks(5)
        .tickFormat(d => `${d}k`);
      
      const leftAxisGroup = g.append('g').call(yAxisLeft);
      leftAxisGroup.select('.domain').remove();
      leftAxisGroup.selectAll('.tick text')
        .attr('fill', accentColor)
        .attr('font-size', '10px')
        .attr('font-weight', '600')
        .attr('font-family', 'monospace');
      leftAxisGroup.selectAll('.tick line').remove();

      // Axis label
      g.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', -45)
        .attr('x', -chartHeight / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', accentColor)
        .attr('font-size', '10px')
        .attr('font-weight', '700')
        .text('Calorie Burn (kcal)');
    }

    // Right Axis (Session Frequency)
    if (viewMode !== 'calories') {
      const yAxisRight = d3.axisRight(yScaleSessions)
        .ticks(summary.sessionDomain[1])
        .tickFormat(d => `${d}`);

      const rightAxisGroup = g.append('g')
        .attr('transform', `translate(${chartWidth},0)`)
        .call(yAxisRight);

      rightAxisGroup.select('.domain').remove();
      rightAxisGroup.selectAll('.tick text')
        .attr('fill', secondaryColor)
        .attr('font-size', '10px')
        .attr('font-weight', '700')
        .attr('font-family', 'monospace');
      rightAxisGroup.selectAll('.tick line').remove();

      // Axis label
      g.append('text')
        .attr('transform', 'rotate(90)')
        .attr('y', -chartWidth - 42)
        .attr('x', chartHeight / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', secondaryColor)
        .attr('font-size', '10px')
        .attr('font-weight', '700')
        .text('Sessions / Day');
    }

    // 4. INTERACTIVE HOVER OVERLAY (D3 POINTER LISTENER)
    const overlay = g.append('rect')
      .attr('class', 'interactive-overlay')
      .attr('width', chartWidth)
      .attr('height', chartHeight)
      .attr('fill', 'transparent')
      .style('cursor', 'crosshair');

    // Crosshair Guide Line
    const crosshair = g.append('line')
      .attr('class', 'crosshair-line')
      .attr('y1', 0)
      .attr('y2', chartHeight)
      .attr('stroke', isDark ? '#E2E8F0' : '#0F172A')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '3,3')
      .attr('opacity', 0);

    // Hover marker on calorie line
    const hoverCircle = g.append('circle')
      .attr('r', 6)
      .attr('fill', accentColor)
      .attr('stroke', isDark ? '#000000' : '#FFFFFF')
      .attr('stroke-width', 2)
      .attr('opacity', 0);

    // Hover marker on session line
    const hoverSessionCircle = g.append('circle')
      .attr('r', 5)
      .attr('fill', secondaryColor)
      .attr('stroke', isDark ? '#000000' : '#FFFFFF')
      .attr('stroke-width', 2)
      .attr('opacity', 0);

    overlay
      .on('mousemove', function (event) {
        const [mouseX] = d3.pointer(event, this);
        
        // Find closest band
        const bandWidth = xScale.step();
        const index = Math.min(
          data.length - 1, 
          Math.max(0, Math.floor(mouseX / bandWidth))
        );
        const d = data[index];
        if (!d) return;

        const xPos = (xScale(d.dayLabel) || 0) + xScale.bandwidth() / 2;

        crosshair
          .attr('x1', xPos)
          .attr('x2', xPos)
          .attr('opacity', 0.85);

        if (viewMode !== 'frequency') {
          hoverCircle
            .attr('cx', xPos)
            .attr('cy', yScaleCalories(d.calories))
            .attr('opacity', 1);
        } else {
          hoverCircle.attr('opacity', 0);
        }

        if (viewMode !== 'calories') {
          hoverSessionCircle
            .attr('cx', xPos)
            .attr('cy', yScaleSessions(d.sessions))
            .attr('opacity', 1);
        } else {
          hoverSessionCircle.attr('opacity', 0);
        }

        setHoveredPoint(d);
      })
      .on('mouseleave', function () {
        crosshair.attr('opacity', 0);
        hoverCircle.attr('opacity', 0);
        hoverSessionCircle.attr('opacity', 0);
        setHoveredPoint(null);
      });

  }, [data, summary, viewMode, isDark, accentColor, accentRgb, dailyCalorieGoal]);

  return (
    <div 
      id={id}
      ref={containerRef}
      className={`rounded-2xl p-5 sm:p-6 shadow-xl border space-y-5 transition-colors ${
        isDark ? 'bg-[#000000] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      } ${className}`}
    >
      {/* 1. Header with Title & Mode Switcher */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 ${
        isDark ? 'border-slate-900' : 'border-slate-100'
      }`}>
        <div className="flex items-center gap-3">
          <div 
            className="p-2.5 rounded-xl shadow-md text-slate-950 font-bold"
            style={{ backgroundColor: accentColor }}
          >
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
                <span>Weekly Analytics</span>
              </h2>
              <span 
                className="text-[11px] font-mono font-bold px-2 py-0.5 rounded border flex items-center gap-1"
                style={{
                  color: accentColor,
                  borderColor: accentColor,
                  backgroundColor: `rgba(${accentRgb}, 0.1)`
                }}
              >
                <span>D3.js Visualization</span>
              </span>
            </div>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Interactive dual-axis analysis of total calorie burn and session frequency over the past 7 days
            </p>
          </div>
        </div>

        {/* View Mode Controls & Data Table Toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className={`p-1 rounded-xl border flex items-center gap-1 ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              onClick={() => {
                triggerHaptic(20);
                playButtonClickSound();
                setViewMode('combo');
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'combo'
                  ? 'text-slate-950 shadow-sm'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
              style={viewMode === 'combo' ? { backgroundColor: accentColor } : {}}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Dual Axis (Combo)</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic(20);
                playButtonClickSound();
                setViewMode('calories');
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'calories'
                  ? 'text-slate-950 shadow-sm'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
              style={viewMode === 'calories' ? { backgroundColor: accentColor } : {}}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Calorie Flow</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic(20);
                playButtonClickSound();
                setViewMode('frequency');
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'frequency'
                  ? 'text-slate-950 shadow-sm'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
              style={viewMode === 'frequency' ? { backgroundColor: accentColor } : {}}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Session Frequency</span>
            </button>
          </div>

          <button
            onClick={() => {
              triggerHaptic(25);
              playButtonClickSound();
              setShowDataTable(!showDataTable);
            }}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              showDataTable
                ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                : isDark ? 'bg-slate-900 text-slate-400 hover:text-white border-slate-800' : 'bg-slate-100 text-slate-600 hover:text-slate-900 border-slate-200'
            }`}
            title="Toggle tabular data breakdown"
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{showDataTable ? 'Hide Table' : 'Data Table'}</span>
          </button>

          {onOpenGoalSettings && (
            <button
              onClick={() => {
                triggerHaptic(20);
                playButtonClickSound();
                onOpenGoalSettings();
              }}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                isDark 
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800 hover:bg-emerald-900/60' 
                  : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
              }`}
              title="Click to set or adjust your Daily Calorie Goal in User Settings"
              aria-label="Set Daily Calorie Goal in User Settings"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Goal: <strong>{dailyCalorieGoal || data[0]?.targetCalories || 500} kcal</strong></span>
            </button>
          )}
        </div>
      </div>

      {/* 2. KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Calorie Burn */}
        <div className={`p-3.5 rounded-xl border transition-colors ${
          isDark ? 'bg-[#090D16] border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
            <span>7-Day Calorie Burn</span>
            <Flame className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold font-mono tabular-nums mt-1" style={{ color: accentColor }}>
            {summary.totalCalories} <span className="text-xs font-normal">kcal</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Avg: {summary.dailyAvgCalories} kcal / day
          </div>
        </div>

        {/* Total Sessions & Frequency */}
        <div className={`p-3.5 rounded-xl border transition-colors ${
          isDark ? 'bg-[#090D16] border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
            <span>Session Frequency</span>
            <Activity className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold font-mono tabular-nums mt-1 text-amber-400">
            {summary.totalSessions} <span className="text-xs font-normal">sessions</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {summary.activeDaysCount} of 7 active days
          </div>
        </div>

        {/* Peak Burn Day */}
        <div className={`p-3.5 rounded-xl border transition-colors ${
          isDark ? 'bg-[#090D16] border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
            <span>Peak Training Day</span>
            <Award className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold font-mono tabular-nums mt-1 text-emerald-400">
            {summary.peakDay.dayLabel} <span className="text-xs font-normal">({summary.peakDay.calories}k)</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5 truncate">
            {summary.peakDay.sessions} session{summary.peakDay.sessions === 1 ? '' : 's'} on {summary.peakDay.displayDate || 'today'}
          </div>
        </div>

        {/* Training Consistency */}
        <div className={`p-3.5 rounded-xl border transition-colors ${
          isDark ? 'bg-[#090D16] border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
            <span>Consistency Score</span>
            <Zap className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold font-mono tabular-nums mt-1 text-purple-400">
            {summary.consistencyPercent}%
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
            <div 
              className="h-full bg-purple-500 rounded-full transition-all"
              style={{ width: `${summary.consistencyPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. D3 SVG Canvas & Live Interactive Tooltip */}
      <div className={`relative p-3 sm:p-4 rounded-xl border overflow-hidden ${
        isDark ? 'bg-[#050810] border-slate-900' : 'bg-slate-50/70 border-slate-200'
      }`}>
        {/* Dynamic Legend and Instructions */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2 text-xs font-mono">
          <div className="flex items-center gap-4 flex-wrap">
            {viewMode !== 'frequency' && (
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded" style={{ backgroundColor: accentColor }} />
                <span className="font-semibold text-slate-300">Total Calorie Burn (kcal)</span>
              </div>
            )}
            {viewMode !== 'calories' && (
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1.5 rounded-full bg-amber-500" />
                <span className="font-semibold text-amber-400">Session Frequency (count)</span>
              </div>
            )}
            {viewMode !== 'frequency' && (
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 border-b-2 border-dashed border-emerald-500" />
                <span className="text-emerald-400">Daily Target ({data[0]?.targetCalories || 500} kcal)</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <Info className="w-3.5 h-3.5" />
            <span>Hover / tap chart to inspect daily breakdown</span>
          </div>
        </div>

        {/* Hover Inspector Card */}
        {hoveredPoint && (
          <div className={`p-3 rounded-xl border text-xs font-mono mb-2 flex items-center justify-between gap-4 flex-wrap shadow-lg ${
            isDark ? 'bg-[#090D16] border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold">{hoveredPoint.dayLabel} ({hoveredPoint.displayDate})</span>
              {hoveredPoint.isToday && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  Today
                </span>
              )}
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-cyan-400" />
                <span>Burn:</span>
                <strong className="text-cyan-400 font-extrabold">{hoveredPoint.calories} kcal</strong>
                <span className="text-slate-400 text-[10px]">
                  ({Math.round((hoveredPoint.calories / hoveredPoint.targetCalories) * 100)}% of goal)
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-amber-400" />
                <span>Frequency:</span>
                <strong className="text-amber-400 font-extrabold">
                  {hoveredPoint.sessions} {hoveredPoint.sessions === 1 ? 'session' : 'sessions'}
                </strong>
              </div>

              {hoveredPoint.sessions > 0 && (
                <div className="text-slate-400 text-[11px] hidden sm:block">
                  Intensity: <span className="text-emerald-400 font-bold">{hoveredPoint.burnPerSession} kcal/sess</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Responsive D3 SVG Container */}
        <div className="w-full overflow-x-auto">
          <svg
            ref={svgRef}
            viewBox="0 0 760 340"
            className="w-full h-auto min-w-[580px] max-w-full select-none"
            role="img"
            aria-label="Weekly analytics D3 visualization of total calorie burn and session frequency over 7 days"
          />
        </div>
      </div>

      {/* 4. Accessible Tabular Data Table (Toggleable) */}
      {showDataTable && (
        <div className={`p-4 rounded-xl border text-xs font-mono overflow-x-auto ${
          isDark ? 'bg-[#090D16] border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span>7-Day Workout & Calorie Breakdown</span>
            </h3>
            <span className="text-[11px] text-slate-400">D3 data snapshot</span>
          </div>

          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`border-b ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-300 text-slate-600'}`}>
                <th className="py-2 px-3 font-semibold">Day</th>
                <th className="py-2 px-3 font-semibold">Date</th>
                <th className="py-2 px-3 font-semibold">Calories Burned</th>
                <th className="py-2 px-3 font-semibold">Goal Target</th>
                <th className="py-2 px-3 font-semibold">Session Frequency</th>
                <th className="py-2 px-3 font-semibold">Burn / Session</th>
                <th className="py-2 px-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr 
                  key={row.date} 
                  className={`border-b transition-colors ${
                    isDark ? 'border-slate-800/60 hover:bg-slate-800/40' : 'border-slate-200 hover:bg-slate-100'
                  } ${row.isToday ? (isDark ? 'bg-cyan-950/20' : 'bg-cyan-50') : ''}`}
                >
                  <td className="py-2 px-3 font-bold flex items-center gap-1.5">
                    <span>{row.dayLabel}</span>
                    {row.isToday && (
                      <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-500 text-slate-950 font-extrabold">
                        TODAY
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-slate-400">{row.displayDate}</td>
                  <td className="py-2 px-3 font-bold text-cyan-400 tabular-nums">{row.calories} kcal</td>
                  <td className="py-2 px-3 text-slate-400 tabular-nums">{row.targetCalories} kcal</td>
                  <td className="py-2 px-3 font-bold text-amber-400 tabular-nums">
                    {row.sessions} {row.sessions === 1 ? 'session' : 'sessions'}
                  </td>
                  <td className="py-2 px-3 text-emerald-400 tabular-nums">
                    {row.sessions > 0 ? `${row.burnPerSession} kcal` : '—'}
                  </td>
                  <td className="py-2 px-3">
                    {row.sessions > 0 ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Active</span>
                      </span>
                    ) : (
                      <span className="text-slate-500 text-[11px]">Rest</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
