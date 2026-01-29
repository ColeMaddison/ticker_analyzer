"use client";

import { useState, useMemo, useEffect } from 'react';
import { ResponsiveContainer, ComposedChart, Line, Area, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine, Cell, Brush, AreaChart } from 'recharts';
import { Layers, Activity } from 'lucide-react';

export const AdvancedChart = ({ data }: { data: any[] }) => {
  const [timeRange, setTimeRange] = useState("1Y");
  const [chartType, setChartType] = useState<"line" | "area">("area");
  const [mounted, setMounted] = useState(false);
  const [range, setRange] = useState({ start: 0, end: 0 });

  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. Process All Data (Memoized)
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    return data.map((d: any) => {
      const close = d.close ?? d.Close ?? 0;
      const open = d.open ?? d.Open ?? 0;
      const volume = d.volume ?? d.Volume ?? d.value ?? 0;
      const vwap = d.vwap_weekly ?? d.VWAP_Weekly;
      const upper = d.bb_upper ?? d.BB_Upper;
      const lower = d.bb_lower ?? d.BB_Lower;
      const macd_hist = d.macd_hist ?? d.MACD_Hist ?? 0;
      const sqz_mom = d.sqz_mom ?? d.SQZ_MOM ?? 0;
      const sqz_on = d.sqz_on ?? d.SQZ_ON ?? false;
      const isUpDay = close >= open;

      return {
        ...d,
        date: new Date(d.time ?? d.Date).toLocaleDateString(),
        // Standardized keys for chart
        displayClose: close,
        displayVolume: volume,
        displayVWAP: vwap,
        displayUpper: upper,
        displayLower: lower,
        displaySMI: d.smi ?? d.SMI,
        displaySMISignal: d.smi_signal ?? d.SMI_SIGNAL,
        displayMACDHist: macd_hist,
        displaySQZMom: sqz_mom,
        // Colors
        volumeColor: isUpDay ? '#22c55e' : '#ef4444',
        macdColor: macd_hist >= 0 ? '#22c55e' : '#ef4444',
        sqzColor: sqz_mom >= 0 ? '#22c55e' : '#ef4444',
        // Squeeze dot Y-position
        squeezeDot: sqz_on ? close : null
      };
    });
  }, [data]);

  // 2. Initialize Range when data loads
  useEffect(() => {
    if (processedData.length > 0) {
        // Default to 1Y
        const count = 252;
        const start = Math.max(0, processedData.length - count);
        const end = processedData.length - 1;
        setRange({ start, end });
        setTimeRange("1Y");
    }
  }, [processedData.length]); // Depend on length to reset on new data

  // Handle Time Range Buttons
  const handleTimeRange = (r: string) => {
    setTimeRange(r);
    if (processedData.length === 0) return;
    
    const ranges: Record<string, number> = {
      "1M": 21,
      "3M": 63,
      "6M": 126,
      "1Y": 252,
      "ALL": processedData.length
    };
    
    const count = ranges[r] || 252;
    const start = Math.max(0, processedData.length - count);
    const end = processedData.length - 1;
    setRange({ start, end });
  };

  const handleBrushChange = (e: any) => {
    if (e.startIndex !== undefined && e.endIndex !== undefined) {
        setRange({ start: e.startIndex, end: e.endIndex });
        // Clear preset highlight if user manually zooms
        if (timeRange !== "Custom") setTimeRange("Custom");
    }
  };

  // 3. Slice Data for View
  const visibleData = useMemo(() => {
    if (processedData.length === 0) return [];
    // Slice is exclusive on end, so +1
    return processedData.slice(range.start, range.end + 1);
  }, [processedData, range]);

  // Performance Optimization: Disable heavy dots on long timeframes
  const showDots = visibleData.length < 100;

  if (!data || data.length === 0) return <div>No Chart Data</div>;
  if (!mounted) return <div className="h-[850px] bg-[#0A0A0A] rounded-lg border border-zinc-800" />;

  const ranges = ["1M", "3M", "6M", "1Y", "ALL"];

  return (
    <div className="flex flex-col h-[900px] bg-[#0A0A0A] rounded-lg border border-zinc-800 p-4 relative">
      
      {/* Chart Controls Toolbar */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-4 bg-zinc-900/80 backdrop-blur p-1 rounded-lg border border-zinc-800">
         <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded">
            {ranges.map(r => (
                <button 
                    key={r}
                    onClick={() => handleTimeRange(r)}
                    className={`px-3 py-1 text-[10px] font-bold rounded transition-colors ${timeRange === r ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                    {r}
                </button>
            ))}
         </div>
         <div className="h-4 w-px bg-zinc-700 mx-1"></div>
         <div className="flex items-center gap-1">
            <button 
                onClick={() => setChartType("area")}
                className={`p-1.5 rounded transition-colors ${chartType === 'area' ? 'bg-zinc-700 text-green-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                title="Area Chart"
            >
                <Layers className="w-3.5 h-3.5" />
            </button>
            <button 
                onClick={() => setChartType("line")}
                className={`p-1.5 rounded transition-colors ${chartType === 'line' ? 'bg-zinc-700 text-blue-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                title="Line Chart"
            >
                <Activity className="w-3.5 h-3.5" />
            </button>
         </div>
      </div>

      {/* Row 1: Price, VWAP, Breakout (40% height) */}
      <div className="flex-1 min-h-0 border-b border-zinc-800 pb-2">
        <p className="text-xs text-zinc-500 font-bold mb-1">PRICE / VWAP / BANDS</p>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={visibleData} syncId="advanced-group">
            <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                </linearGradient>
            </defs>
            <CartesianGrid stroke="#333" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" hide />
            <YAxis domain={['auto', 'auto']} orientation="right" tick={{fontSize: 12, fill:'#a1a1aa'}} />
            <YAxis yAxisId="volume" domain={['0', 'dataMax * 4']} orientation="left" hide />
            <Tooltip animationDuration={300} contentStyle={{backgroundColor: '#111', border: '1px solid #333', color: '#fff', fontSize: '12px'}} itemStyle={{color: '#fff'}} />
            
            {/* Volume Bars */}
            <Bar dataKey="displayVolume" yAxisId="volume" barSize={4} isAnimationActive={false}>
                {visibleData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.volumeColor} fillOpacity={0.3} />
                ))}
            </Bar>

            {/* Bollinger Cloud Area */}
            <Line animationDuration={300} type="monotone" dataKey="displayUpper" name="Upper Band" stroke="#93c5fd" strokeWidth={1} dot={false} strokeOpacity={0.3} isAnimationActive={false} />
            <Line animationDuration={300} type="monotone" dataKey="displayLower" name="Lower Band" stroke="#93c5fd" strokeWidth={1} dot={false} strokeOpacity={0.3} isAnimationActive={false} />
            
            {/* VWAP */}
            <Line animationDuration={300} type="monotone" dataKey="displayVWAP" name="VWAP" stroke="#fbbf24" strokeWidth={2} dot={false} isAnimationActive={false} />
            
            {/* Price Line/Area */}
            {chartType === 'area' ? (
                <Area animationDuration={300} type="monotone" dataKey="displayClose" name="Price" stroke="#22c55e" fillOpacity={1} fill="url(#colorPrice)" strokeWidth={1.5} isAnimationActive={false} />
            ) : (
                <Line animationDuration={300} type="monotone" dataKey="displayClose" name="Price" stroke="#fff" strokeWidth={1.5} dot={false} isAnimationActive={false} />
            )}
            
            {/* Squeeze Dots */}
            <Line animationDuration={300} type="monotone" dataKey="squeezeDot" name="Squeeze" stroke="#ffffff" strokeWidth={0} dot={showDots ? {fill: 'white', r: 3} : false} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Row 2: Squeeze Momentum (15%) */}
      <div className="h-[120px] border-b border-zinc-800 py-2">
        <p className="text-xs text-zinc-500 font-bold mb-1">SQUEEZE MOMENTUM</p>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={visibleData} syncId="advanced-group">
            <CartesianGrid stroke="#333" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" hide />
            <YAxis orientation="right" tick={{fontSize: 12, fill:'#a1a1aa'}} />
            <Tooltip animationDuration={300} contentStyle={{backgroundColor: '#111', border: '1px solid #333', color: '#fff', fontSize: '12px'}} itemStyle={{color: '#fff'}} />
            <Bar animationDuration={300} dataKey="displaySQZMom" name="Momentum" isAnimationActive={false}>
              {visibleData.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={entry.sqzColor} />
              ))}
            </Bar>
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Row 3: SMI (15%) */}
      <div className="h-[120px] border-b border-zinc-800 py-2">
        <p className="text-xs text-zinc-500 font-bold mb-1">STOCHASTIC MOMENTUM (SMI)</p>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={visibleData} syncId="advanced-group">
            <CartesianGrid stroke="#333" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" hide />
            <YAxis domain={[-60, 60]} orientation="right" tick={{fontSize: 12, fill:'#a1a1aa'}} />
            <Tooltip animationDuration={300} contentStyle={{backgroundColor: '#111', border: '1px solid #333', color: '#fff', fontSize: '12px'}} itemStyle={{color: '#fff'}} />
            <ReferenceLine y={40} stroke="gray" strokeDasharray="3 3" />
            <ReferenceLine y={-40} stroke="gray" strokeDasharray="3 3" />
            <Line animationDuration={300} type="monotone" dataKey="displaySMI" name="SMI" stroke="#06b6d4" dot={false} strokeWidth={1.5} isAnimationActive={false} />
            <Line animationDuration={300} type="monotone" dataKey="displaySMISignal" name="Signal" stroke="#ef4444" dot={false} strokeWidth={1} strokeDasharray="3 3" isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Row 4: MACD (15%) */}
      <div className="h-[120px] pt-2 border-b border-zinc-800 pb-2">
        <p className="text-xs text-zinc-500 font-bold mb-1">MACD HISTOGRAM</p>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={visibleData} syncId="advanced-group">
            <CartesianGrid stroke="#333" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" hide />
            <YAxis orientation="right" tick={{fontSize: 12, fill:'#a1a1aa'}} />
            <Tooltip animationDuration={300} contentStyle={{backgroundColor: '#111', border: '1px solid #333', color: '#fff', fontSize: '12px'}} itemStyle={{color: '#fff'}} />
            <Bar animationDuration={300} dataKey="displayMACDHist" name="MACD" isAnimationActive={false}>
              {visibleData.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={entry.macdColor} />
              ))}
            </Bar>
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Row 5: Navigator / Brush (10%) */}
      <div className="h-[60px] pt-2">
         <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={processedData}>
                <defs>
                    <linearGradient id="brushGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <Area type="monotone" dataKey="displayClose" stroke="#22c55e" fill="url(#brushGradient)" strokeWidth={1} isAnimationActive={false} />
                <Brush 
                    height={30} 
                    stroke="#52525b" 
                    fill="#18181b" 
                    tickFormatter={() => ""} 
                    startIndex={range.start} 
                    endIndex={range.end} 
                    onChange={handleBrushChange}
                    alwaysShowText={false}
                />
            </AreaChart>
         </ResponsiveContainer>
      </div>

    </div>
  );
};
