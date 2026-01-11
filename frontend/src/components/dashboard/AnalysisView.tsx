import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, Progress, Tabs, TabsContent, TabsList, TabsTrigger, Tooltip } from "../ui";
import { AdvancedChart } from "../AdvancedChart";
import { Zap, ShieldAlert, Brain, HelpCircle, CheckSquare, Square } from "lucide-react";
import { parseMarkdown } from "../../lib/utils";
import { TickerData } from "../../types";
import plotly from 'plotly.js-dist'; 
// Note: AdvancedChart handles Recharts, but previous code used Plotly. 
// We are sticking to Recharts as per the AdvancedChart.tsx implementation.

const Metric = ({ label, value, sub, tip, color = "text-white" }: any) => (
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
);

const Row = ({ label, val }: any) => (
  <div className="flex justify-between items-center group py-1">
    <span className="text-xs font-bold uppercase tracking-wide text-zinc-500 group-hover:text-zinc-300 transition-colors">{label}</span>
    <span className="font-mono text-sm font-bold text-white bg-zinc-800 px-2 py-0.5 rounded">{val}</span>
  </div>
);

export const AnalysisView = ({ data, onTickerSelect }: { data: TickerData, onTickerSelect: (t: string) => void }) => {
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
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Metric label="Price" value={`$${data.price.toFixed(2)}`} tip="Current real-time price." />
        <Metric label="Rel Strength" value={`${(data.signals.rel_strength*100).toFixed(1)}%`} tip="Leader vs Laggard check. Stock performance vs its Sector ETF over 3 months." />
        <Metric label="ADX" value={data.signals.adx.toFixed(1)} tip="Average Directional Index. Measures trend strength. > 25 is strong, < 20 is choppy/non-trending." />
        <Metric label="RSI" value={data.signals.rsi.toFixed(1)} tip="Relative Strength Index. We watch 40 as Bull Market Support and 60 as Bear Market Resistance." />
        <Metric label="P/C Ratio" value={data.options_data?.pcr.toFixed(2) || "N/A"} tip="Put/Call Volume Ratio. > 1.2 suggests extreme fear (contrarian buy), < 0.6 suggests extreme greed (hedge/sell)." />
        <Metric label="Consensus" value={data.info.recommendation?.replace('_',' ').toUpperCase()} color="text-blue-400" tip="Wall Street analyst consensus rating." />
        <Metric label="Upside" value={`${data.metrics.upside.toFixed(1)}%`} color={data.metrics.upside>0?"text-green-400":"text-red-400"} tip="Distance from current price to average analyst price target." />
      </div>

      {/* 2. Decision Maker's Summary Row (Visible without scrolling) */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* THE BEAST SCORE - Decision Matrix */}
        <Card className="bg-[#0A0A0A] border-zinc-800 h-full relative overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          <div className="absolute top-0 right-0 p-2 opacity-10"><Zap className="w-12 h-12 rotate-12" /></div>
          <CardHeader className="py-3 border-b border-zinc-800/50 bg-zinc-900/20"><CardTitle className="text-[10px] uppercase font-black tracking-[0.2em] text-zinc-400 flex items-center gap-2">THE BEAST SCORE</CardTitle></CardHeader>
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
                <Row label="Tech" val={sb.technical_score} />
                <Row label="Smart" val={sb.smart_money_score} />
                <Row label="Qual" val={sb.quality_score} />
             </div>
          </CardContent>
        </Card>

        {/* Smart Money Engine */}
        <Card className="bg-[#0A0A0A] border-zinc-800 h-full">
          <CardHeader className="py-3 border-b border-zinc-800/50"><CardTitle className="text-[10px] uppercase font-black tracking-widest text-zinc-500 flex items-center gap-2"><ShieldAlert className="w-3 h-3"/> Smart Money</CardTitle></CardHeader>
          <CardContent className="space-y-3 pt-4">
            <div className="bg-zinc-900/50 p-2 rounded border border-zinc-800/50">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[9px] uppercase font-bold text-zinc-500">Accumulation</span>
                <span className={`text-[10px] font-black ${(data.info.institutions_percent > 0.6 && data.signals.volume_ratio > 1.2) ? 'text-green-400' : 'text-zinc-600'}`}>
                    {(data.info.institutions_percent > 0.6 && data.signals.volume_ratio > 1.2) ? "ACCUMULATING" : "NEUTRAL"}
                </span>
              </div>
              <div className="flex justify-between items-center mb-1">
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
                <span className="text-[9px] uppercase font-bold text-zinc-600">Inst. Own</span>
                <span className="text-xs font-mono font-bold text-white">{(data.info.institutions_percent*100).toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>

        {/* Quality Engine */}
        <Card className="bg-[#0A0A0A] border-zinc-800 h-full">
          <CardHeader className="py-3 border-b border-zinc-800/50"><CardTitle className="text-[10px] uppercase font-black tracking-widest text-zinc-500 flex items-center gap-2"><HelpCircle className="w-3 h-3"/> Quality Engine</CardTitle></CardHeader>
          <CardContent className="space-y-3 pt-4">
            <div className="bg-zinc-900/50 p-2 rounded border border-zinc-800/50">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[9px] uppercase font-bold text-zinc-500">PEG Ratio</span>
                <span className={`text-[10px] font-black ${data.info.peg_ratio === null ? 'text-zinc-600' : data.info.peg_ratio < 1 ? 'text-green-400' : data.info.peg_ratio > 2 ? 'text-red-400' : 'text-zinc-400'}`}>
                    {data.info.peg_ratio !== null ? data.info.peg_ratio.toFixed(2) : "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[9px] uppercase font-bold text-zinc-500">FCF Yield</span>
                <span className={`text-[10px] font-black ${data.info.fcf_yield === null ? 'text-zinc-600' : data.info.fcf_yield > 0.05 ? 'text-green-400' : 'text-zinc-400'}`}>
                    {data.info.fcf_yield !== null ? (data.info.fcf_yield * 100).toFixed(1) + "%" : "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[9px] uppercase font-bold text-zinc-500">Altman Z</span>
                <span className={`text-[10px] font-black ${data.info.altman_z === null ? 'text-zinc-600' : data.info.altman_z < 1.8 ? 'text-red-500' : 'text-green-500'}`}>
                    {data.info.altman_z !== null ? data.info.altman_z.toFixed(2) : "N/A"}
                </span>
              </div>
            </div>
            {data.info.altman_z !== null && data.info.altman_z < 1.8 && (
                <div className="text-[7px] bg-red-500/10 text-red-400 p-1 rounded border border-red-500/20 font-black uppercase text-center animate-pulse tracking-tighter">
                    ⚠️ INSOLVENCY RISK
                </div>
            )}
          </CardContent>
        </Card>

        {/* Edge Engine */}
        <Card className="bg-[#0A0A0A] border-zinc-800 h-full">
          <CardHeader className="py-3 border-b border-zinc-800/50"><CardTitle className="text-[10px] uppercase font-black tracking-widest text-zinc-500 flex items-center gap-2"><Brain className="w-3 h-3"/> Edge Engine</CardTitle></CardHeader>
          <CardContent className="space-y-3 pt-4">
            <div className="bg-zinc-900/50 p-2 rounded border border-zinc-800/50">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[9px] uppercase font-bold text-zinc-500">Rotation</span>
                <span className={`text-[10px] font-black ${data.info.sector_rotation === 'Leading' ? 'text-green-400' : data.info.sector_rotation === 'Improving' ? 'text-emerald-400' : 'text-zinc-600'}`}>
                    {data.info.sector_rotation?.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[9px] uppercase font-bold text-zinc-500">News Vel.</span>
                <span className={`text-[10px] font-black ${data.info.news_velocity > 0.8 ? 'text-red-400' : 'text-zinc-600'}`}>
                    {data.info.news_velocity > 0.8 ? "OVERHEATED" : "NORMAL"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[9px] uppercase font-bold text-zinc-500">VIX Status</span>
                <span className={`text-[10px] font-black ${data.info.vix_level > 30 ? 'text-red-500 animate-pulse' : 'text-zinc-500'}`}>
                    {data.info.vix_level > 30 ? "PANIC" : "CALM"}
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center px-1">
                <span className="text-[9px] uppercase font-bold text-zinc-600">Market VIX</span>
                <span className={`text-xs font-mono font-bold ${data.info.vix_level > 30 ? 'text-red-400' : 'text-white'}`}>{data.info.vix_level?.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Hedge Fund Pulse / Verdict */}
        <Card className="bg-[#0A0A0A] border-zinc-800 h-full">
          <CardHeader className="py-3 border-b border-zinc-800/50"><CardTitle className="text-[10px] uppercase font-black tracking-widest text-zinc-500 flex items-center gap-2"><ShieldAlert className="w-3 h-3"/> Fund Verdict</CardTitle></CardHeader>
          <CardContent className="space-y-3 pt-4">
            <div className="bg-zinc-900/50 p-2 rounded border border-zinc-800/50 text-center">
              <div className="text-[9px] uppercase font-black text-zinc-600 mb-0.5 tracking-tighter">Institutional Verdict</div>
              <div className="text-xs font-black text-green-400">{data.hedge_fund.verdict}</div>
            </div>
            <Progress value={data.hedge_fund.score} className="h-1 bg-zinc-900" />
            <div className="grid grid-cols-2 gap-2">
              <div><div className="text-[9px] uppercase font-bold text-zinc-600 tracking-tighter">Sharpe</div><div className="text-xs font-mono font-bold text-white">{data.metrics.sharpe?.toFixed(2)}</div></div>
              <div><div className="text-[9px] uppercase font-bold text-zinc-600 tracking-tighter">Drawdown</div><div className="text-xs font-mono font-bold text-red-400">{(data.metrics.drawdown*100).toFixed(1)}%</div></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Action Plan (Full Width) */}
      <Card className="border-l-4 border-l-green-500 bg-green-500/[0.02] border-zinc-800 shadow-[0_0_30px_rgba(34,197,94,0.05)]">
        <CardHeader className="py-3"><CardTitle className="text-green-400 flex items-center gap-2 font-black text-[10px] uppercase tracking-widest"><Brain className="w-4 h-4" /> Recommended Action Plan</CardTitle></CardHeader>
        <CardContent className="text-sm leading-relaxed text-zinc-200 font-medium pb-4">
          <div className="prose prose-invert prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: parseMarkdown(data.ai_analysis.recommended_action.replace(/\$/g, '')) }} />
        </CardContent>
      </Card>

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
            <CardHeader className="py-3 border-b border-zinc-800/50"><CardTitle className="text-[10px] uppercase font-black tracking-[0.2em] text-zinc-500">Market Intelligence</CardTitle></CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-0 scrollbar-thin">
              
              <div className="p-4 border-b border-zinc-800/50">
                <div className="flex justify-between items-center mb-3">
                    <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Peers Comparison</div>
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
                        <span className="text-[10px] font-mono font-bold text-white text-right">${p.Price.toFixed(2)}</span>
                        <div className="text-center">
                            <span className={`text-[7px] px-1 py-0.5 rounded border font-bold uppercase ${getRecColor(p.Rec)}`}>{p.Rec}</span>
                        </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-zinc-950/20">
                <div className="text-[9px] font-black text-zinc-600 mb-3 uppercase tracking-widest">Sentiment Stream</div>
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
};
