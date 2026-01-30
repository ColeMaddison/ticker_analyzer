import React from "react";
import { Card, CardContent, CardHeader, CardTitle, Tooltip } from "../ui";
import { HelpCircle, Activity, Zap, ShieldAlert, Brain, Hammer } from "lucide-react";

export const DoomsdayView = ({ data }: { data: any }) => {
  if (!data) return (
    <div className="h-[60vh] flex flex-col items-center justify-center text-zinc-700 gap-6">
      <div className="p-10 rounded-full bg-zinc-900/30 border border-zinc-800/50">
        <Activity className="w-20 h-20 opacity-20 text-red-500 animate-pulse" />
      </div>
      <p className="text-xs font-black uppercase tracking-[0.3em] opacity-40">Calculating Doomsday Proximity...</p>
    </div>
  );

  const { overall_score: score, verdict, pillars, advice } = data;

  const getColor = (score: number) => {
    if (score <= 40) return "#00FF88"; // STABLE
    if (score <= 70) return "#FFD700"; // WATCH
    return "#FF4C4C"; // CRITICAL
  };

  const statusColor = getColor(score);

  return (
    <div className="space-y-10 max-w-6xl mx-auto">
      {/* Primary Gauge */}
      <div className="flex flex-col items-center justify-center py-10 relative">
        <div className="relative w-80 h-80">
          <svg className="w-full h-full" viewBox="0 0 100 100">
            {/* Background Track */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#18181b"
              strokeWidth="8"
              strokeDasharray="212 282"
              strokeDashoffset="-35"
              transform="rotate(135 50 50)"
            />
            {/* Progress Track */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={statusColor}
              strokeWidth="8"
              strokeDasharray={`${(score / 100) * 212} 282`}
              strokeDashoffset="-35"
              transform="rotate(135 50 50)"
              style={{ transition: 'stroke-dasharray 1s ease-out' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-[10px] font-black text-zinc-500 tracking-[0.4em] uppercase mb-2">Recession Proximity</span>
            <span className="text-7xl font-black font-mono tracking-tighter" style={{ color: statusColor }}>{score}</span>
            <span className="text-sm font-black tracking-widest uppercase mt-2" style={{ color: statusColor }}>{verdict}</span>
          </div>
        </div>
        
        {/* Advice Overlay */}
        <div className="mt-8 bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl max-w-md text-center backdrop-blur-sm">
           <p className="text-xs font-bold text-zinc-400 italic">"{advice}"</p>
        </div>
      </div>

      {/* Moat Sub-Containers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <PillarCard 
            title="Monetary Stress" 
            label="Yield Curve" 
            value={pillars.yield_curve.value} 
            risk={pillars.yield_curve.risk} 
            tip="10Y vs 13W spread. Inversion (negative) is a classic 12-18 month recession warning."
            icon={<Activity className="w-4 h-4" />}
        />
        <PillarCard 
            title="Labor Market" 
            label="Sahm Rule" 
            value={pillars.sahm_rule.value} 
            risk={pillars.sahm_rule.risk} 
            tip="Triggered when the 3-month moving average of the unemployment rate rises by 0.5% or more relative to its low during the previous 12 months."
            icon={<Brain className="w-4 h-4" />}
        />
        <PillarCard 
            title="Liquidity" 
            label="Volatility" 
            value={pillars.credit_stress.value} 
            risk={pillars.credit_stress.risk} 
            tip="Measures market-wide fear via the VIX index. High VIX (>30) indicates systemic stress."
            icon={<ShieldAlert className="w-4 h-4" />}
        />
        <PillarCard 
            title="Capital Rotation" 
            label="Defensives" 
            value={pillars.sector_flow.value} 
            risk={pillars.sector_flow.risk} 
            tip="Smart Money hiding in Utilities (XLU) and Staples (XLP) relative to Tech (XLK) suggests a defensive shift."
            icon={<Zap className="w-4 h-4" />}
        />
        <PillarCard 
            title="Real Economy" 
            label="Dr. Copper" 
            value={pillars.dr_copper?.trend || "N/A"} 
            risk={pillars.dr_copper?.risk || "LOW"} 
            tip="Copper/Gold Ratio. Rising = Global Growth. Falling = Industrial Slowdown & Fear."
            icon={<Hammer className="w-4 h-4" />}
        />
      </div>
    </div>
  );
};

const PillarCard = ({ title, label, value, risk, tip, icon }: any) => {
    const riskColor = risk === "HIGH" ? "text-red-500" : risk === "MEDIUM" ? "text-yellow-500" : "text-green-500";
    return (
        <Card className="bg-[#0A0A0A] border-zinc-800 hover:border-zinc-700 transition-all group">
            <CardHeader className="py-4 border-b border-zinc-800/50 flex flex-row justify-between items-center">
                <CardTitle className="text-[10px] uppercase font-black tracking-widest text-zinc-500 flex items-center gap-2">
                    {icon} {title}
                </CardTitle>
                <Tooltip content={tip}>
                    <HelpCircle className="w-3 h-3 text-zinc-700 hover:text-zinc-500 cursor-help" />
                </Tooltip>
            </CardHeader>
            <CardContent className="pt-6 text-center space-y-2">
                <div className="text-[9px] font-bold text-zinc-600 uppercase tracking-tighter">{label}</div>
                <div className="text-2xl font-black font-mono text-white">{value}</div>
                <div className={`text-[10px] font-black tracking-widest ${riskColor}`}>RISK: {risk}</div>
            </CardContent>
        </Card>
    );
}
