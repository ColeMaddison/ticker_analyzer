import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, Progress, Tabs, TabsContent, TabsList, TabsTrigger, Tooltip } from "../ui";
import { AdvancedChart } from "../AdvancedChart";
import { Zap, ShieldAlert, Brain, HelpCircle, CheckSquare, Square } from "lucide-react";
import { parseMarkdown } from "../../lib/utils";
import { TickerData } from "../../types";

const Metric = React.memo(({ label, value, sub, tip, color = "text-white" }: any) => (
  <Card className="bg-zinc-900/30 border-zinc-800/50 backdrop-blur-sm group hover:border-zinc-700 transition-all overflow-visible">
    <CardContent className="p-5 text-center relative">
      <div className="text-xs font-bold text-zinc-500 uppercase tracking-[0.1em] mb-2 flex justify-center items-center gap-1">
        {label}
        {tip && (
          <Tooltip content={tip}>
            <HelpCircle className="w-3 h-3 text-zinc-600 hover:text-zinc-400 cursor-help" />
          </Tooltip>
        )}
      </div>
      <div className={`text-2xl font-black font-mono tracking-tight ${color}`}>{value}</div>
      {sub && <div className="text-[10px] font-bold text-zinc-600 mt-1 uppercase">{sub}</div>}
    </CardContent>
  </Card>
));

const Row = React.memo(({ label, val }: any) => (
  <div className="flex justify-between items-center group py-1">
    <span className="text-xs font-bold uppercase tracking-wide text-zinc-500 group-hover:text-zinc-300 transition-colors">{label}</span>
    <span className="font-mono text-sm font-bold text-white bg-zinc-800 px-2 py-0.5 rounded">{val}</span>
  </div>
));

export const AnalysisView = React.memo(({ data, onTickerSelect, backtestResult, isBacktesting }: { data: TickerData, onTickerSelect: (t: string) => void, backtestResult: any, isBacktesting: boolean }) => {
  const { score, score_breakdown: sb } = data;
  
  const beast = useMemo(() => {
    if (score >= 90) return { label: "STRONG BUY", color: "#27ae60", desc: "All engines firing. High conviction." };
    if (score >= 75) return { label: "BUY", color: "#2ecc71", desc: "Strong trend & fundamentals." };
    if (score >= 40) return { label: "HOLD / WATCH", color: "orange", desc: "Conflicting signals. Wait for edge." };
    return { label: "SELL / AVOID", color: "#e74c3c", desc: "Deteriorating momentum & risk." };
  }, [score]);

  const [selectedPeers, setSelectedPeers] = useState<string[]>([]);

  useEffect(() => {
    if (data.peers) {
      setSelectedPeers(data.peers.map((p: any) => p.Ticker));
    }
  }, [data.peers]);

  const togglePeer = (ticker: string) => {
    setSelectedPeers(prev => 
      prev.includes(ticker) ? prev.filter(t => t !== ticker) : [...prev, ticker]
    );
  };

  const peerStats = useMemo(() => {
    if (!data.peers || selectedPeers.length === 0) return null;
    const selected = data.peers.filter((p: any) => selectedPeers.includes(p.Ticker));
    if (selected.length === 0) return null;

    const validPE = selected.filter((p: any) => p["P/E"] && p["P/E"] > 0);
    const validPEG = selected.filter((p: any) => p.PEG && p.PEG > 0);
    
    const avgPe = validPE.length ? validPE.reduce((acc: number, p: any) => acc + p["P/E"], 0) / validPE.length : 0;
    const avgPeg = validPEG.length ? validPEG.reduce((acc: number, p: any) => acc + p.PEG, 0) / validPEG.length : 0;

    return { avgPe, avgPeg, count: selected.length };
  }, [data.peers, selectedPeers]);

  const getRecColor = (rec: string) => {
    if (!rec) return "text-zinc-500 bg-zinc-800";
    const r = rec.toLowerCase();
    if (r.includes('strong buy')) return "text-green-400 bg-green-400/10 border-green-400/20";
    if (r.includes('buy')) return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
    if (r.includes('sell')) return "text-red-400 bg-red-400/10 border-red-400/20";
    return "text-zinc-400 bg-zinc-400/10 border-zinc-400/20";
  };

  return (
    <div className="space-y-6">
      {/* 1. Global Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <Metric 
            label="Asset" 
            value={data.ticker} 
            color="text-green-500" 
            tip={`Full Name: ${data.info.company_name || 'N/A'}\nSector: ${data.info.sector || 'N/A'}\nMkt Cap: $${(data.info.market_cap / 1e9).toFixed(2)}B\nBeta: ${data.info.beta?.toFixed(2) || 'N/A'}`} 
        />
        <Metric label="Price" value={`$${data.price?.toFixed(2) ?? "N/A"}`} tip="Current real-time price." />
        <Metric label="Rel Strength" value={`${(data.signals.rel_strength*100).toFixed(1)}%`} tip="Leader vs Laggard check. Stock performance vs its Sector ETF over 3 months." />
        <Metric label="ADX" value={data.signals.adx?.toFixed(1) ?? "N/A"} tip="Average Directional Index. Measures trend strength. > 25 is strong, < 20 is choppy/non-trending." />
        <Metric label="RSI" value={data.signals.rsi?.toFixed(1) ?? "N/A"} tip="Relative Strength Index. We watch 40 as Bull Market Support and 60 as Bear Market Resistance." />
        <Metric label="P/C Ratio" value={data.options_data?.pcr.toFixed(2) || "N/A"} tip="Put/Call Volume Ratio. > 1.2 suggests extreme fear (contrarian buy), < 0.6 suggests extreme greed (hedge/sell)." />
        <Metric label="Consensus" value={data.info.recommendation?.replace('_',' ').toUpperCase()} color="text-blue-400" tip="Wall Street analyst consensus rating." />
        <Metric label="Upside" value={`${data.metrics.upside?.toFixed(1) ?? "N/A"}%`} color={(data.metrics.upside || 0)>0?"text-green-400":"text-red-400"} tip="Distance from current price to average analyst price target." />
      </div>

      {/* 2. Primary Decision Maker Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* THE BEAST SCORE */}
        <div className="lg:col-span-3">
            <Card className="bg-[#0A0A0A] border-zinc-800 h-full relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 p-2 opacity-10"><Zap className="w-12 h-12 rotate-12" /></div>
                <CardHeader className="py-3 border-b border-zinc-800/50 bg-zinc-900/20 flex flex-row justify-between items-center">
                    <CardTitle className="text-[10px] uppercase font-black tracking-[0.2em] text-zinc-400 flex items-center gap-2">
                        THE BEAST SCORE
                        <Tooltip content="Aggregated multi-engine tactical score (1-2 month horizon) factoring in Technicals, Smart Money, and Quality.">
                            <HelpCircle className="w-3 h-3 text-zinc-600 hover:text-zinc-400 cursor-help" />
                        </Tooltip>
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                    <div className="text-center">
                        <div className="text-5xl font-black font-mono tracking-tighter mb-1" style={{ color: beast.color }}>{score}</div>
                        <div className="text-xs font-black tracking-widest uppercase mb-2" style={{ color: beast.color }}>{beast.label}</div>
                        <p className="text-[9px] text-zinc-500 font-bold leading-tight px-4">{beast.desc}</p>
                    </div>
                    
                    <div className="flex justify-center gap-1.5 py-3 border-y border-zinc-800/50">
                        {[
                            { n: 'T', l: 'Technicals', s: sb.technical_score, d: 'RSI regimes, MACD divergence, and SMI momentum.' },
                            { n: 'M', l: 'Momentum', s: sb.momentum_score, d: 'Trend strength via ADX, RS vs Sector, and VWAP.' },
                            { n: 'S', l: 'Smart Money', s: sb.smart_money_score, d: 'Institutional flow, insider buying, and short interest.' },
                            { n: 'Q', l: 'Quality', s: sb.quality_score, d: 'Growth valuation (PEG), cash flow, and safety scores.' },
                            { n: 'E', l: 'Edge', s: sb.edge_score, d: 'Sector rotation, news velocity, and market-wide VIX panic.' }
                        ].map(engine => (
                            <Tooltip key={engine.n} content={`${engine.l.toUpperCase()} (${engine.s}/100): ${engine.d}`}>
                                <div className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-black border transition-all ${engine.s >= 75 ? 'bg-green-500/20 border-green-500 text-green-400' : engine.s >= 40 ? 'bg-zinc-800 border-zinc-700 text-zinc-500' : 'bg-red-500/20 border-red-500 text-red-400'}`}>
                                    {engine.n}
                                </div>
                            </Tooltip>
                        ))}
                    </div>

                    <div className="space-y-1">
                        <Row label="Tech Engine" val={sb.technical_score} />
                        <Row label="Smart Money" val={sb.smart_money_score} />
                        <Row label="Quality Engine" val={sb.quality_score} />
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* BEAST BACKTESTER */}
        <div className="lg:col-span-9">
            <Card className="bg-[#0A0A0A] border-zinc-800 h-full shadow-2xl relative overflow-hidden">
                <CardHeader className="py-3 border-b border-zinc-800/50 bg-zinc-900/20 flex flex-row justify-between items-center">
                    <CardTitle className="text-[10px] uppercase font-black tracking-[0.2em] text-zinc-400 flex items-center gap-2">
                        Strategy Backtest (12-Month Performance)
                        <Tooltip content="Historical simulation using Veteran Rules: Entry only if Price > SMA200. Exit on Trend Breakdown (Price < SMA50) or Parabolic Overbought (RSI > 80).">
                            <HelpCircle className="w-3 h-3 text-zinc-600 hover:text-zinc-400 cursor-help" />
                        </Tooltip>
                    </CardTitle>
                    {isBacktesting && <div className="text-[8px] font-black text-green-500 animate-pulse uppercase tracking-widest">Simulating...</div>}
                </CardHeader>
                <CardContent className="pt-6">
                    {backtestResult ? (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 h-full">
                            <div className="md:col-span-1 flex flex-col justify-center border-r border-zinc-800/50 pr-8">
                                <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                                    Total Beast Return
                                    <Tooltip content="Net cumulative profit generated by the Beast strategy signals during the period.">
                                        <HelpCircle className="w-2.5 h-2.5 text-zinc-600" />
                                    </Tooltip>
                                </div>
                                <div className={`text-5xl font-black font-mono tracking-tighter ${backtestResult.total_beast_return > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {backtestResult.total_beast_return > 0 ? '+' : ''}{backtestResult.total_beast_return}%
                                </div>
                                <div className={`mt-2 text-[10px] font-bold px-2 py-1 rounded w-fit ${backtestResult.trade_count === 0 ? 'bg-zinc-800 text-zinc-500' : backtestResult.performance_vs_market > 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                    {backtestResult.trade_count === 0 ? 'No Trades Found' : backtestResult.performance_vs_market > 0 ? 'Alpha Detected' : 'Underperforming Market'}
                                </div>
                            </div>
                            <div className="md:col-span-3 grid grid-cols-3 gap-6 items-center">
                                <div className="bg-zinc-900/30 p-4 rounded-xl border border-zinc-800/50">
                                    <div className="text-[9px] font-black text-zinc-600 uppercase mb-2 flex items-center gap-1">
                                        Buy & Hold
                                        <Tooltip content="The return of simply buying the stock on Day 1 and holding until today.">
                                            <HelpCircle className="w-2.5 h-2.5 text-zinc-700" />
                                        </Tooltip>
                                    </div>
                                    <div className="text-2xl font-black font-mono text-zinc-400">{backtestResult.buy_hold_return > 0 ? '+' : ''}{backtestResult.buy_hold_return}%</div>
                                    <div className="text-[8px] text-zinc-700 mt-1 font-bold italic">Stock raw performance</div>
                                </div>
                                <div className="bg-zinc-900/30 p-4 rounded-xl border border-zinc-800/50">
                                    <div className="text-[9px] font-black text-zinc-600 uppercase mb-2 flex items-center gap-1">
                                        Win Rate
                                        <Tooltip content="Percentage of strategy-generated trades that were profitable.">
                                            <HelpCircle className="w-2.5 h-2.5 text-zinc-700" />
                                        </Tooltip>
                                    </div>
                                    <div className="text-2xl font-black font-mono text-blue-400">{backtestResult.win_rate}%</div>
                                    <div className="text-[8px] text-zinc-700 mt-1 font-bold italic">{backtestResult.trade_count} Total Trades</div>
                                </div>
                                <div className="bg-zinc-900/30 p-4 rounded-xl border border-zinc-800/50">
                                    <div className="text-[9px] font-black text-zinc-600 uppercase mb-2 flex items-center gap-1">
                                        Strategy Edge
                                        <Tooltip content="The Alpha: Strategy Return minus the Buy & Hold return. Positive values indicate the algorithm outperformed the market.">
                                            <HelpCircle className="w-2.5 h-2.5 text-zinc-700" />
                                        </Tooltip>
                                    </div>
                                    <div className={`text-2xl font-black font-mono ${backtestResult.performance_vs_market > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {backtestResult.performance_vs_market > 0 ? '+' : ''}{backtestResult.performance_vs_market}%
                                    </div>
                                    <div className="text-[8px] text-zinc-700 mt-1 font-bold italic">Return vs Buy & Hold</div>
                                </div>
                            </div>
                        </div>
                    ) : isBacktesting ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-4">
                            <div className="w-10 h-10 border-2 border-zinc-800 border-t-green-500 rounded-full animate-spin"></div>
                            <div className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">Crunching 1Y Historical Data...</div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center py-12 text-zinc-700 text-xs font-black uppercase tracking-widest">Wait for engine warmup...</div>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>

      {/* 3. Secondary Analysis Row (Stacked Engines & Action Plan) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 2x2 Engine Grid */}
        <div className="lg:col-span-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Smart Money Engine */}
            <Card className="bg-[#0A0A0A] border-zinc-800 h-full">
                <CardHeader className="py-2.5 border-b border-zinc-800/50 flex flex-row items-center gap-2">
                    <ShieldAlert className="w-3 h-3 text-zinc-500"/>
                    <CardTitle className="text-[10px] uppercase font-black tracking-widest text-zinc-500 flex items-center gap-2">
                        Smart Money
                        <Tooltip content="Tracks 'Big Money' via Institutional Ownership trends, Insider clusters, and Put/Call volume ratios.">
                            <HelpCircle className="w-2.5 h-2.5 text-zinc-700" />
                        </Tooltip>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5 pt-3">
                    <div className="bg-zinc-900/50 p-2 rounded border border-zinc-800/50 space-y-1.5">
                        <div className="flex justify-between items-center">
                            <span className="text-[9px] uppercase font-bold text-zinc-500">Accumulation</span>
                            <span className={`text-[10px] font-black ${(data.info.institutions_percent > 0.6 && data.signals.volume_ratio > 1.2) ? 'text-green-400' : 'text-zinc-600'}`}>
                                {(data.info.institutions_percent > 0.6 && data.signals.volume_ratio > 1.2) ? "BUYING" : "NEUTRAL"}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[9px] uppercase font-bold text-zinc-500">Squeeze</span>
                            <span className={`text-[10px] font-black ${data.info.short_ratio > 5 ? 'text-orange-400 animate-pulse' : 'text-zinc-600'}`}>
                                {data.info.short_ratio > 5 ? "POTENTIAL" : "LOW"}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[9px] uppercase font-bold text-zinc-500">Insiders</span>
                            <span className={`text-[10px] font-black ${data.info.insider_buying_cluster ? 'text-green-400' : 'text-zinc-600'}`}>
                                {data.info.insider_buying_cluster ? "BUYING" : "NONE"}
                            </span>
                        </div>
                    </div>
                    <div className="flex justify-between items-center px-1">
                        <span className="text-[9px] uppercase font-bold text-zinc-600 tracking-tighter text-zinc-500">Inst. Ownership</span>
                        <span className="text-xs font-mono font-bold text-zinc-300">{(data.info.institutions_percent*100).toFixed(1)}%</span>
                    </div>
                </CardContent>
            </Card>

            {/* Quality Engine */}
        <Card className="bg-[#0A0A0A] border-zinc-800 h-full">
          <CardHeader className="py-3 border-b border-zinc-800/50">
            <CardTitle className="text-[10px] uppercase font-black tracking-widest text-zinc-500 flex items-center gap-2">
                <HelpCircle className="w-3 h-3"/> Quality Engine
                <Tooltip content="Fundamental health check including growth valuation (PEG), cash flow yield, and runway for high-burn sectors.">
                    <HelpCircle className="w-2.5 h-2.5 text-zinc-700 ml-1" />
                </Tooltip>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            <div className="bg-zinc-900/50 p-2 rounded border border-zinc-800/50">
              
              {/* Fair Value Visualization */}
              {data.info.fair_value && (
                <div className="mb-3 border-b border-zinc-800/50 pb-3">
                    <div className="flex justify-between items-center mb-1">
                        <div className="text-[9px] uppercase font-bold text-zinc-500 flex items-center gap-1">
                            Intrinsic Value
                             <Tooltip content="Estimated Fair Value based on Peter Lynch's PEG=1.0 rule. If Price < Value, stock is undervalued relative to growth.">
                                <HelpCircle className="w-2.5 h-2.5 text-zinc-700" />
                            </Tooltip>
                        </div>
                        <span className={`text-[10px] font-black ${data.price < data.info.fair_value ? 'text-green-400' : 'text-red-400'}`}>
                            {data.price < data.info.fair_value ? "UNDERVALUED" : "OVERVALUED"}
                        </span>
                    </div>
                    
                    <div className="relative h-1.5 bg-zinc-800 rounded-full w-full overflow-visible mt-2 mb-1">
                        {/* Fair Value Tick (Blue) */}
                        <div 
                            className="absolute top-1/2 -translate-y-1/2 w-0.5 h-3 bg-blue-500 z-10" 
                            style={{ left: `${Math.min(100, (data.info.fair_value / (Math.max(data.price, data.info.fair_value)*1.15))*100)}%` }}
                        />
                        
                        {/* Current Price Dot (White) */}
                        <div 
                            className={`absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 border-zinc-900 shadow-lg z-20 ${data.price < data.info.fair_value ? 'bg-green-400' : 'bg-red-400'}`} 
                            style={{ left: `${Math.min(100, (data.price / (Math.max(data.price, data.info.fair_value)*1.15))*100)}%` }}
                        />
                    </div>
                    
                    <div className="flex justify-between items-center">
                        <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider">Current: <span className="text-white">${data.price?.toFixed(0) ?? "N/A"}</span></span>
                        <span className="text-[8px] font-bold text-blue-500 uppercase tracking-wider">Fair: ${data.info.fair_value?.toFixed(0) ?? "N/A"}</span>
                    </div>
                </div>
              )}

              <div className="flex justify-between items-center mb-1">
                <span className="text-[9px] uppercase font-bold text-zinc-500">PEG Ratio</span>
                <span className={`text-[10px] font-black ${data.info.peg_ratio == null ? 'text-zinc-600' : data.info.peg_ratio < 1 ? 'text-green-400' : data.info.peg_ratio > 2 ? 'text-red-400' : 'text-zinc-400'}`}>
                    {data.info.peg_ratio != null ? Number(data.info.peg_ratio).toFixed(2) : "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[9px] uppercase font-bold text-zinc-500">FCF Yield</span>
                <span className={`text-[10px] font-black ${data.info.fcf_yield == null ? 'text-zinc-600' : data.info.fcf_yield > 0.05 ? 'text-green-400' : 'text-zinc-400'}`}>
                    {data.info.fcf_yield != null ? (Number(data.info.fcf_yield) * 100).toFixed(1) + "%" : "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[9px] uppercase font-bold text-zinc-500">Altman Z</span>
                <span className={`text-[10px] font-black ${data.info.altman_z == null ? 'text-zinc-600' : data.info.altman_z < 1.8 ? 'text-red-500' : 'text-green-500'}`}>
                    {data.info.altman_z != null ? Number(data.info.altman_z).toFixed(2) : "N/A"}
                </span>
              </div>
              
              {/* Biotech / Growth Logic */}
              {data.info.months_runway != null && (
                 <>
                    <div className="flex justify-between items-center mb-1 border-t border-zinc-800/50 pt-1 mt-1">
                        <span className="text-[9px] uppercase font-bold text-zinc-500">Cash Runway</span>
                        <span className={`text-[10px] font-black ${data.info.months_runway < 6 ? 'text-red-500 animate-pulse' : data.info.months_runway < 12 ? 'text-amber-500' : 'text-green-500'}`}>
                            {data.info.months_runway.toFixed(1)} Months
                        </span>
                    </div>
                     <div className="flex justify-between items-center">
                        <span className="text-[9px] uppercase font-bold text-zinc-500">Monthly Burn</span>
                        <span className="text-[10px] font-black text-red-400">
                            ${((data.info.monthly_burn || 0) / 1000000).toFixed(2)}M
                        </span>
                    </div>
                 </>
              )}
            </div>
            {data.info.altman_z != null && data.info.altman_z < 1.8 && (
                <div className="text-[7px] bg-red-500/10 text-red-400 p-1 rounded border border-red-500/20 font-black uppercase text-center animate-pulse tracking-tighter">
                    ⚠️ INSOLVENCY RISK
                </div>
            )}
             {data.info.months_runway != null && data.info.months_runway < 6 && (
                <div className="text-[7px] bg-red-500/10 text-red-400 p-1 rounded border border-red-500/20 font-black uppercase text-center animate-pulse tracking-tighter">
                    ⚠️ DILUTION IMMINENT
                </div>
            )}
          </CardContent>
        </Card>

            {/* Edge Engine */}
            <Card className="bg-[#0A0A0A] border-zinc-800 h-full">
                <CardHeader className="py-2.5 border-b border-zinc-800/50 flex flex-row items-center gap-2">
                    <Brain className="w-3 h-3 text-zinc-500"/>
                    <CardTitle className="text-[10px] uppercase font-black tracking-widest text-zinc-500 flex items-center gap-2">
                        Edge Engine
                        <Tooltip content="Tactical timing factors: Sector rotation relative to SPY, News velocity (3-sigma proxy), and Market VIX regime.">
                            <HelpCircle className="w-2.5 h-2.5 text-zinc-700" />
                        </Tooltip>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5 pt-3">
                    <div className="bg-zinc-900/50 p-2 rounded border border-zinc-800/50 space-y-1.5">
                        <div className="flex justify-between items-center">
                            <span className="text-[9px] uppercase font-bold text-zinc-500">Rotation</span>
                            <span className={`text-[10px] font-black ${data.info.sector_rotation === 'Leading' ? 'text-green-400' : data.info.sector_rotation === 'Improving' ? 'text-emerald-400' : 'text-zinc-600'}`}>
                                {data.info.sector_rotation?.toUpperCase()}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[9px] uppercase font-bold text-zinc-500">News Vel.</span>
                            <span className={`text-[10px] font-black ${data.info.news_velocity > 0.8 ? 'text-red-400' : 'text-zinc-600'}`}>
                                {data.info.news_velocity > 0.8 ? "OVERHEATED" : "NORMAL"}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[9px] uppercase font-bold text-zinc-500">Market VIX</span>
                            <span className={`text-[10px] font-black ${data.info.vix_level > 30 ? 'text-red-500 animate-pulse' : 'text-zinc-500'}`}>
                                {data.info.vix_level > 30 ? "PANIC" : "CALM"}
                            </span>
                        </div>
                    </div>
                    <div className="flex justify-between items-center px-1">
                        <span className="text-[9px] uppercase font-bold text-zinc-600 tracking-tighter text-zinc-500">Current VIX</span>
                        <span className={`text-xs font-mono font-bold ${data.info.vix_level > 30 ? 'text-red-400' : 'text-zinc-300'}`}>{data.info.vix_level?.toFixed(2)}</span>
                    </div>
                </CardContent>
            </Card>

            {/* Fund Verdict */}
            <Card className="bg-[#0A0A0A] border-zinc-800 h-full shadow-lg">
                <CardHeader className="py-2.5 border-b border-zinc-800/50 flex flex-row items-center gap-2">
                    <ShieldAlert className="w-3 h-3 text-zinc-500"/>
                    <CardTitle className="text-[10px] uppercase font-black tracking-widest text-zinc-500 flex items-center gap-2">
                        Fund Verdict
                        <Tooltip content="Institutional-grade risk/reward assessment based on Sharpe Ratio (returns per unit of risk) and Max Drawdown.">
                            <HelpCircle className="w-2.5 h-2.5 text-zinc-700" />
                        </Tooltip>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-3">
                    <div className="bg-zinc-900/50 p-2.5 rounded border border-zinc-800/50 text-center">
                        <div className="text-[8px] uppercase font-black text-zinc-600 mb-0.5 tracking-tighter">Institutional Verdict</div>
                        <div className="text-xs font-black text-green-400 uppercase">{data.hedge_fund.verdict}</div>
                    </div>
                    <Progress value={data.hedge_fund.score} className="h-1 bg-zinc-900" />
                    <div className="grid grid-cols-2 gap-2">
                        <div><div className="text-[8px] uppercase font-bold text-zinc-600 tracking-tighter">Sharpe</div><div className="text-xs font-mono font-bold text-white">{data.metrics.sharpe?.toFixed(2)}</div></div>
                        <div><div className="text-[8px] uppercase font-bold text-zinc-600 tracking-tighter">Drawdown</div><div className="text-xs font-mono font-bold text-red-400">{(data.metrics.drawdown*100).toFixed(1)}%</div></div>
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* AI Verdict (Full Visibility) */}
        <div className="lg:col-span-6">
            <Card className="border-l-4 border-l-green-500 bg-green-500/[0.02] border-zinc-800 shadow-[0_0_30px_rgba(34,197,94,0.05)] h-full">
                <CardHeader className="py-3 border-b border-zinc-800/50 bg-zinc-900/10">
                    <CardTitle className="text-green-400 flex items-center gap-2 font-black text-[10px] uppercase tracking-widest">
                        <Brain className="w-4 h-4" /> Strategic Action Plan
                        <Tooltip content="AI Council synthesis of all hard data and sentiment into a tactical 1-2 month roadmap.">
                            <HelpCircle className="w-3 h-3 text-green-900 ml-1" />
                        </Tooltip>
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-sm leading-relaxed text-zinc-200 font-medium py-5">
                    <div className="prose prose-invert prose-sm max-w-none scrollbar-thin overflow-y-auto max-h-[300px]" dangerouslySetInnerHTML={{ __html: parseMarkdown(data.ai_analysis.recommended_action.replace(/\$/g, '')) }} />
                </CardContent>
            </Card>
        </div>
      </div>

      {/* 3.5 Alpha Hunter Macro Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-12 bg-[#0A0A0A] border-zinc-800 overflow-hidden shadow-2xl">
            <CardHeader className="py-3 border-b border-zinc-800/50 bg-zinc-900/20 flex flex-row justify-between items-center">
                <CardTitle className="text-[10px] uppercase font-black tracking-[0.2em] text-zinc-400 flex items-center gap-2">
                    ALPHA HUNTER: MACRO CORRELATIONS
                    <Tooltip content="90-day correlation matrix. Determines if the stock is moving in sync with global drivers (DXY, Yields, BTC) or generating unique alpha.">
                        <HelpCircle className="w-3 h-3 text-zinc-700 ml-1" />
                    </Tooltip>
                </CardTitle>
                <div className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">90-Day Asset Alignment</div>
            </CardHeader>
            <CardContent className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {data.macro_correlations && Object.entries(data.macro_correlations).map(([name, d]: [string, any]) => {
                        const isBullish = (d.value < -0.5 && d.trend === "Falling") || (d.value > 0.5 && d.trend === "Rising");
                        const isBearish = (d.value > 0.5 && d.trend === "Falling") || (d.value < -0.5 && d.trend === "Rising");
                        
                        return (
                            <div key={name} className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4 transition-all hover:border-zinc-700 group">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest group-hover:text-zinc-300">{name}</span>
                                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${d.trend === "Rising" ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                        {d.trend.toUpperCase()}
                                    </span>
                                </div>
                                <div className="flex items-end gap-2">
                                    <div className={`text-xl font-black font-mono ${Math.abs(d.value || 0) > 0.6 ? (isBullish ? 'text-green-400' : isBearish ? 'text-red-400' : 'text-white') : 'text-zinc-400'}`}>
                                        {d.value?.toFixed(2) ?? "N/A"}
                                    </div>
                                    <div className="text-[8px] text-zinc-600 font-bold mb-1 uppercase tracking-tighter">Correlation</div>
                                </div>
                                <div className="mt-3 h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full transition-all duration-500 ${isBullish ? 'bg-green-500' : isBearish ? 'bg-red-500' : 'bg-zinc-600'}`}
                                        style={{ width: `${Math.abs(d.value) * 100}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
      </div>

      {/* 4. Deep Dive Row (Chart & Details) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart */}
        <div className="lg:col-span-8">
          <AdvancedChart data={data.chart_data} />
        </div>

        {/* Bull/Bear & Peers Side Panel */}
        <div className="lg:col-span-4 space-y-6">
          <Tabs defaultValue="bull" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-zinc-900 h-9 p-1 border border-zinc-800">
              <TabsTrigger value="bull" className="text-[10px] uppercase font-black h-full">🐂 Bull</TabsTrigger>
              <TabsTrigger value="bear" className="text-[10px] uppercase font-black h-full">🐻 Bear</TabsTrigger>
            </TabsList>
            <TabsContent value="bull" className="bg-green-500/[0.02] p-4 rounded-b-lg border-x border-b border-zinc-800 text-xs text-zinc-300 leading-relaxed border-t-0 min-h-[100px]">
              <div className="prose prose-invert prose-xs" dangerouslySetInnerHTML={{ __html: parseMarkdown(data.ai_analysis.bull_case) }} />
            </TabsContent>
            <TabsContent value="bear" className="bg-red-500/[0.02] p-4 rounded-b-lg border-x border-b border-zinc-800 text-xs text-zinc-300 leading-relaxed border-t-0 min-h-[100px]">
              <div className="prose prose-invert prose-xs" dangerouslySetInnerHTML={{ __html: parseMarkdown(data.ai_analysis.bear_case) }} />
            </TabsContent>
          </Tabs>

          <Card className="max-h-[400px] flex flex-col bg-[#0A0A0A] border-zinc-800 overflow-hidden shadow-2xl">
            <CardHeader className="py-3 border-b border-zinc-800/50">
                <CardTitle className="text-[10px] uppercase font-black tracking-[0.2em] text-zinc-500 flex items-center gap-2">
                    Market Intelligence
                    <Tooltip content="Cross-referencing real-time news sentiment with direct industry peer performance.">
                        <HelpCircle className="w-3 h-3 text-zinc-700 ml-1" />
                    </Tooltip>
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-0 scrollbar-thin">
              
              <div className="p-4 border-b border-zinc-800/50">
                <div className="flex justify-between items-center mb-3">
                    <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-1">
                        Peers Comparison
                        <Tooltip content="Relative valuation check against top direct competitors.">
                            <HelpCircle className="w-2.5 h-2.5 text-zinc-800" />
                        </Tooltip>
                    </div>
                    {peerStats && (
                        <div className="text-[8px] font-mono text-zinc-500 text-right">
                           AVG P/E: <span className="text-zinc-300">{peerStats.avgPe.toFixed(1)}</span> | PEG: <span className="text-zinc-300">{peerStats.avgPeg.toFixed(2)}</span>
                        </div>
                    )}
                </div>
                <div className="space-y-0.5">
                    <div className="grid grid-cols-[18px_1fr_50px_60px] gap-2 px-1 py-1 text-[8px] uppercase font-bold text-zinc-600 border-b border-zinc-800/30">
                        <span></span>
                        <span>Ticker</span>
                        <span className="text-right">Price</span>
                        <span className="text-center">Rec</span>
                    </div>
                  {data.peers?.map((p:any)=>(
                    <div key={p.Ticker} className={`grid grid-cols-[18px_1fr_50px_60px] gap-2 items-center px-1 py-1.5 rounded transition-colors ${selectedPeers.includes(p.Ticker) ? 'bg-zinc-900/40 hover:bg-zinc-900' : 'bg-transparent opacity-40 hover:opacity-70'}`}>
                        <button onClick={() => togglePeer(p.Ticker)} className="text-zinc-600 hover:text-white transition-colors">
                            {selectedPeers.includes(p.Ticker) ? <CheckSquare className="w-2.5 h-2.5 text-green-500" /> : <Square className="w-2.5 h-2.5" />}
                        </button>
                        <span className="text-[11px] font-black text-zinc-300 cursor-pointer hover:text-green-400 transition-colors" onClick={() => onTickerSelect(p.Ticker)}>{p.Ticker}</span>
                        <span className="text-[10px] font-mono font-bold text-white text-right">${p.Price?.toFixed(2) ?? "N/A"}</span>
                        <div className="text-center">
                            <span className={`text-[7px] px-1 py-0.5 rounded border font-bold uppercase ${getRecColor(p.Rec)}`}>{p.Rec}</span>
                        </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-zinc-950/20">
                <div className="text-[9px] font-black text-zinc-600 mb-3 uppercase tracking-widest flex items-center gap-1">
                    Sentiment Stream
                    <Tooltip content="Live headline analysis filter for high-impact market news.">
                        <HelpCircle className="w-2.5 h-2.5 text-zinc-800" />
                    </Tooltip>
                </div>
                {data.news?.slice(0,4).map((n:string,i:number)=>(
                  <div key={i} className="text-[10px] text-zinc-500 border-l border-zinc-800 pl-3 py-1 mb-2 hover:text-zinc-300 transition-colors hover:border-zinc-500 leading-snug">{n}</div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
});