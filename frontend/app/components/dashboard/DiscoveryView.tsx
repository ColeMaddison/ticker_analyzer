import { Card, CardContent, CardHeader, CardTitle } from "../ui";
import { DiscoveryResponse } from "../../types";
import { TrendingUp, Zap, ArrowRight, BarChart3 } from "lucide-react";

export const DiscoveryView = ({ 
  data, scanning, onScan, onAnalyze, currentSector 
}: { 
  data: DiscoveryResponse | null, 
  scanning: boolean, 
  onScan: (force: boolean, sector: string) => void, 
  onAnalyze: (t: string) => void,
  currentSector: string
}) => {
  const sectors = [
    "All", "Technology", "Financial Services", "Healthcare", "Consumer Cyclical", 
    "Energy", "Industrials", "Consumer Defensive", "Utilities", "Real Estate", 
    "Basic Materials", "Communication Services"
  ];

  return (
    <div className="space-y-8">
      {/* Control Panel */}
      <div className="flex flex-col gap-6 bg-[#0A0A0A] p-6 rounded-2xl border border-zinc-800 shadow-2xl">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            Sector Intelligence Filter
          </div>
          <div className="flex flex-wrap gap-2">
            {sectors.map(s => (
              <button
                key={s}
                onClick={() => onScan(false, s)}
                className={`whitespace-nowrap px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all border duration-300 ${
                  currentSector === s 
                  ? "bg-blue-600 border-blue-400 text-white shadow-[0_0_20px_rgba(37,99,235,0.2)] scale-105 z-10" 
                  : "bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-200 hover:bg-zinc-800"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t border-zinc-800/50">
          <p className="text-[11px] text-zinc-500 font-medium italic">
            Scanning global news, social sentiment, and institutional filings for <span className="text-blue-400 font-bold uppercase">{currentSector}</span>...
          </p>
          <button 
            onClick={() => onScan(true, currentSector)} 
            disabled={scanning}
            className="w-full md:w-auto text-[10px] font-black uppercase tracking-widest bg-zinc-100 hover:bg-white text-black px-8 py-3 rounded-lg transition-all active:scale-95 disabled:opacity-50 shadow-lg"
          >
             {scanning ? "CRUNCHING FEEDS..." : "REFRESH MARKET BUZZ"}
          </button>
        </div>
      </div>
      
      {!data && scanning && (
        <div className="flex flex-col items-center justify-center py-24 gap-4 opacity-50">
            <div className="w-12 h-12 border-4 border-zinc-800 border-t-blue-500 rounded-full animate-spin"></div>
            <p className="text-sm font-black uppercase tracking-widest text-zinc-500">Discovering {currentSector} Themes...</p>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: News Themes (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center gap-2 text-zinc-400 mb-2">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                <h3 className="text-xs font-black uppercase tracking-widest">Global Market Themes</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {data?.news_themes?.map((t, i)=>(
                <Card key={i} className={`group relative bg-[#0A0A0A] hover:bg-zinc-900/40 border-zinc-800 transition-all duration-500 overflow-hidden shadow-2xl hover:border-zinc-600 ${
                    t.sentiment?.toLowerCase() === 'bullish' ? 'hover:shadow-[0_0_30px_rgba(34,197,94,0.05)]' : 
                    t.sentiment?.toLowerCase() === 'bearish' ? 'hover:shadow-[0_0_30px_rgba(239,68,68,0.05)]' : ''
                }`}>
                    <div className={`absolute top-0 left-0 right-0 h-1 transition-colors ${
                        t.sentiment?.toLowerCase() === 'bullish' ? 'bg-green-500/50' : 
                        t.sentiment?.toLowerCase() === 'bearish' ? 'bg-red-500/50' : 
                        'bg-blue-500/30'
                    }`} />

                    <CardHeader className="pb-4 pt-8">
                    <div className="flex justify-between items-start gap-4 mb-4">
                        <div className="space-y-1">
                            <CardTitle className="text-lg font-black text-white leading-tight group-hover:text-blue-400 transition-colors tracking-tight">
                                {t.title}
                            </CardTitle>
                            <div className="flex items-center gap-2">
                                {t.sentiment && (
                                    <span className={`flex items-center gap-1 text-[8px] font-black px-2 py-0.5 rounded-full border uppercase tracking-widest ${
                                        t.sentiment.toLowerCase() === 'bullish' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                                        t.sentiment.toLowerCase() === 'bearish' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                                        'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                                    }`}>
                                        <span className={`w-1 h-1 rounded-full ${
                                            t.sentiment.toLowerCase() === 'bullish' ? 'bg-green-400' : 
                                            t.sentiment.toLowerCase() === 'bearish' ? 'bg-red-400' : 'bg-zinc-400'
                                        }`} />
                                        {t.sentiment}
                                    </span>
                                )}
                                <span className="bg-blue-500/10 text-blue-400 text-[8px] font-black px-2 py-0.5 rounded-full border border-blue-500/20 tracking-widest uppercase">
                                    Hype {t.hype_score}/10
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    {t.verdict && (
                        <div className={`text-[10px] font-black px-3 py-1.5 rounded-lg border w-fit uppercase tracking-tighter transition-all ${
                            t.verdict.toLowerCase().includes('buy') ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 group-hover:bg-emerald-500/20' :
                            t.verdict.toLowerCase().includes('avoid') ? 'bg-red-500/10 text-red-400 border-red-500/20 group-hover:bg-red-500/20' :
                            'bg-zinc-900 text-zinc-400 border-zinc-800'
                        }`}>
                            {t.verdict}
                        </div>
                    )}
                    </CardHeader>
                    <CardContent>
                    <p className="text-xs font-medium text-zinc-500 leading-relaxed mb-6 group-hover:text-zinc-400 transition-colors">
                        {t.summary}
                    </p>
                    
                    <div className="pt-4 border-t border-zinc-800/50">
                        <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-3">Target Assets</div>
                        <div className="flex flex-wrap gap-2">
                            {t.tickers.map((tik: string) => (
                            <button 
                                key={tik} 
                                onClick={() => onAnalyze(tik)}
                                className="group/btn relative overflow-hidden bg-zinc-900 border border-zinc-800 text-zinc-300 px-3 py-1.5 rounded-md text-[10px] font-black hover:text-white transition-all cursor-pointer hover:border-blue-500/50"
                            >
                                <span className="relative z-10">{tik}</span>
                                <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                            </button>
                            ))}
                        </div>
                    </div>
                    </CardContent>
                </Card>
                ))}
            </div>
        </div>

        {/* Right Column: Screener Opportunities (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-2 text-zinc-400 mb-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                <h3 className="text-xs font-black uppercase tracking-widest">Algorithmic Setups</h3>
            </div>

            <div className="space-y-4">
                {data?.screener_opportunities?.map((opp, i) => (
                    <Card key={i} className="bg-[#0A0A0A] border-zinc-800 overflow-hidden group hover:border-yellow-500/30 transition-all">
                        <CardHeader className="py-3 bg-zinc-900/30 border-b border-zinc-800/50">
                            <CardTitle className="text-sm font-black text-zinc-200 uppercase tracking-wide flex items-center gap-2">
                                {opp.strategy}
                            </CardTitle>
                            <p className="text-[10px] text-zinc-500 mt-1 leading-snug">{opp.description}</p>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-zinc-800/50">
                                {opp.picks.map((pick) => (
                                    <div key={pick.symbol} className="flex items-center justify-between p-3 hover:bg-zinc-900/50 transition-colors group/row cursor-pointer" onClick={() => onAnalyze(pick.symbol)}>
                                        <div className="flex items-center gap-3">
                                            <div className="bg-zinc-900 border border-zinc-800 w-8 h-8 rounded flex items-center justify-center text-[10px] font-black text-white group-hover/row:border-yellow-500/50 group-hover/row:text-yellow-500 transition-colors">
                                                {pick.symbol}
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-zinc-300 group-hover/row:text-white">${pick.price.toFixed(2)}</div>
                                                <div className="text-[9px] text-zinc-600 font-mono">Vol: {(pick.volume / 1e6).toFixed(1)}M</div>
                                            </div>
                                        </div>
                                        <div className={`text-[10px] font-black px-2 py-1 rounded border ${pick.change > 0 ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                                            {pick.change > 0 ? '+' : ''}{pick.change}%
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>

      </div>
    </div>
  );
};
