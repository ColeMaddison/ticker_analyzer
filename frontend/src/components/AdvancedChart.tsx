"use client";

import { ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine, Cell } from 'recharts';

export const AdvancedChart = ({ data }: { data: any[] }) => {
  if (!data || data.length === 0) return <div>No Chart Data</div>;

  // Format data for Recharts
  const chartData = data.map((d: any) => {
    const close = d.close ?? d.Close ?? 0;
    const vwap = d.vwap_weekly ?? d.VWAP_Weekly;
    const upper = d.bb_upper ?? d.BB_Upper;
    const lower = d.bb_lower ?? d.BB_Lower;
    const macd_hist = d.macd_hist ?? d.MACD_Hist ?? 0;
    const sqz_mom = d.sqz_mom ?? d.SQZ_MOM ?? 0;
    const sqz_on = d.sqz_on ?? d.SQZ_ON ?? false;

    return {
      ...d,
      date: new Date(d.time ?? d.Date).toLocaleDateString(),
      // Standardized keys for chart
      displayClose: close,
      displayVWAP: vwap,
      displayUpper: upper,
      displayLower: lower,
      displaySMI: d.smi ?? d.SMI,
      displaySMISignal: d.smi_signal ?? d.SMI_SIGNAL,
      displayMACDHist: macd_hist,
      displaySQZMom: sqz_mom,
      // Colors
      macdColor: macd_hist >= 0 ? '#22c55e' : '#ef4444',
      sqzColor: sqz_mom >= 0 ? '#22c55e' : '#ef4444',
      // Squeeze dot Y-position
      squeezeDot: sqz_on ? close : null
    };
  });

  return (
    <div className="flex flex-col h-[800px] bg-[#0A0A0A] rounded-lg border border-zinc-800 p-4">
      
      {/* Row 1: Price, VWAP, Breakout (40% height) */}
      <div className="flex-1 min-h-0 border-b border-zinc-800 pb-2">
        <p className="text-xs text-zinc-500 font-bold mb-1">PRICE / VWAP / BANDS</p>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData}>
            <CartesianGrid stroke="#333" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" hide />
            <YAxis domain={['auto', 'auto']} orientation="right" tick={{fontSize: 12, fill:'#a1a1aa'}} />
            <Tooltip contentStyle={{backgroundColor: '#111', border: '1px solid #333', color: '#fff', fontSize: '12px'}} itemStyle={{color: '#fff'}} />
            
            {/* Bollinger Cloud Area */}
            <Line type="monotone" dataKey="displayUpper" stroke="#93c5fd" strokeWidth={1} dot={false} strokeOpacity={0.3} />
            <Line type="monotone" dataKey="displayLower" stroke="#93c5fd" strokeWidth={1} dot={false} strokeOpacity={0.3} />
            
            {/* VWAP */}
            <Line type="monotone" dataKey="displayVWAP" stroke="#fbbf24" strokeWidth={2} dot={false} />
            
            {/* Price Line */}
            <Line type="monotone" dataKey="displayClose" stroke="#fff" strokeWidth={1.5} dot={false} />
            
            {/* Squeeze Dots */}
            <Line type="monotone" dataKey="squeezeDot" stroke="#ffffff" strokeWidth={0} dot={{fill: 'white', r: 3}} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Row 2: Squeeze Momentum (20%) */}
      <div className="h-[150px] border-b border-zinc-800 py-2">
        <p className="text-xs text-zinc-500 font-bold mb-1">SQUEEZE MOMENTUM</p>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData}>
            <CartesianGrid stroke="#333" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" hide />
            <YAxis orientation="right" tick={{fontSize: 12, fill:'#a1a1aa'}} />
            <Tooltip contentStyle={{backgroundColor: '#111', border: '1px solid #333', color: '#fff', fontSize: '12px'}} itemStyle={{color: '#fff'}} />
            <Bar dataKey="displaySQZMom">
              {chartData.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={entry.sqzColor} />
              ))}
            </Bar>
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Row 3: SMI (20%) */}
      <div className="h-[150px] border-b border-zinc-800 py-2">
        <p className="text-xs text-zinc-500 font-bold mb-1">STOCHASTIC MOMENTUM (SMI)</p>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData}>
            <CartesianGrid stroke="#333" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" hide />
            <YAxis domain={[-60, 60]} orientation="right" tick={{fontSize: 12, fill:'#a1a1aa'}} />
            <Tooltip contentStyle={{backgroundColor: '#111', border: '1px solid #333', color: '#fff', fontSize: '12px'}} itemStyle={{color: '#fff'}} />
            <ReferenceLine y={40} stroke="gray" strokeDasharray="3 3" />
            <ReferenceLine y={-40} stroke="gray" strokeDasharray="3 3" />
            <Line type="monotone" dataKey="displaySMI" stroke="#06b6d4" dot={false} strokeWidth={1.5} />
            <Line type="monotone" dataKey="displaySMISignal" stroke="#ef4444" dot={false} strokeWidth={1} strokeDasharray="3 3" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Row 4: MACD (20%) */}
      <div className="h-[150px] pt-2">
        <p className="text-xs text-zinc-500 font-bold mb-1">MACD HISTOGRAM</p>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData}>
            <CartesianGrid stroke="#333" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" tick={{fontSize: 12, fill:'#a1a1aa'}} minTickGap={30} />
            <YAxis orientation="right" tick={{fontSize: 12, fill:'#a1a1aa'}} />
            <Tooltip contentStyle={{backgroundColor: '#111', border: '1px solid #333', color: '#fff', fontSize: '12px'}} itemStyle={{color: '#fff'}} />
            <Bar dataKey="displayMACDHist">
              {chartData.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={entry.macdColor} />
              ))}
            </Bar>
          </ComposedChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
};
