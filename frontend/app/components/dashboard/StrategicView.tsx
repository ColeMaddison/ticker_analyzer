import { useState, useEffect, useMemo, Fragment } from "react";
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from "~/components/ui";
import { ShieldAlert, TrendingUp, Microscope, Scale, Landmark, BrainCircuit, Rocket, Activity, ChevronDown, ChevronUp, ArrowUpDown, Users, AlertTriangle, ChartBar, Zap } from "lucide-react";

interface StrategicData {
  ticker: string;
  verdict: {
    score: number;
    label: string;
    breakdown: Record<string, number>;
  };
  moat: {
    roe: number;
    roic: number;
    is_wonderful: boolean;
    owners_earnings: number;
  };
  smart_money: {
    insider_trans: number;
    inst_trans: number;
    verdict: string;
  };
  valuation: {
    pe: number;
    forward_pe: number;
    peg: number;
    verdict: string;
  };
  safety: {
    debt_to_equity: number;
    is_safe: boolean;
  };
  magic_formula: {
    earnings_yield: number;
    roc_rank: string;
  };
  policy: {
    catalysts: { name: string; impact: string; direction: string }[];
    sector: string;
  };
  risk: {
    stop_loss_price: number;
    fear_greed_proxy: string;
    vix: number;
    second_level_thought: string;
  };
  technicals: {
    patterns: { Cup_Handle: boolean; Double_Bottom: boolean };
    signals: { macd_bullish: boolean; rsi: number };
  };
}

interface MagicStock {
  rank: number;
  ticker: string;
  price: number;
  pe: number;
  market_cap: number;
  earnings_yield: number;
  sector: string;
}

interface StrategicViewProps {
    discoveryList: MagicStock[] | null;
    setDiscoveryList: (data: MagicStock[]) => void;
    analysisCache: Record<string, StrategicData>;
    setAnalysisCache: (fn: (prev: Record<string, StrategicData>) => Record<string, StrategicData>) => void;
}

type SortConfig = {
  key: keyof MagicStock | null;
  direction: 'asc' | 'desc';
};

const formatMarketCap = (val: number) => {
    if (val >= 1e12) return `$${(val / 1e12).toFixed(2)}T`;
    if (val >= 1e9) return `$${(val / 1e9).toFixed(1)}B`;
    return `$${(val / 1e6).toFixed(1)}M`;
};

const CATEGORY_COLORS: Record<string, string> = {
    "Moat Check": "bg-blue-500",
    "Smart Money & Value": "bg-emerald-500",
    "Risk & Safety": "bg-red-500",
    "Policy & Trend": "bg-purple-500",
    "Entry Patterns": "bg-yellow-500"
};

const CATEGORY_MAX: Record<string, number> = {
    "Moat Check": 25,
    "Smart Money & Value": 25,
    "Risk & Safety": 20,
    "Policy & Trend": 15,
    "Entry Patterns": 15
};

export const StrategicView = ({ discoveryList, setDiscoveryList, analysisCache, setAnalysisCache }: StrategicViewProps) => {
  // Local UI states
  const [expandedTicker, setExpandedTicker] = useState<string | null>(null);
  
  const [searchTicker, setSearchTicker] = useState("");
  const [loadingTicker, setLoadingTicker] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' });

  const fetchDiscovery = async () => {
    setScanning(true);
    try {
      const res = await fetch("http://localhost:8000/api/strategic/discovery");
      const data = await res.json();
      setDiscoveryList(data);
    } catch (e) {
      console.error(e);
    } finally {
      setScanning(false);
    }
  };

  const fetchAnalysis = async (ticker: string) => {
    // If we already have it, just expand
    if (analysisCache[ticker]) {
        setExpandedTicker(ticker);
        return;
    }

    setLoadingTicker(ticker);
    try {
      const res = await fetch(`http://localhost:8000/api/strategic/analysis/${ticker}`);
      if (res.ok) {
        const data = await res.json();
        setAnalysisCache(prev => ({ ...prev, [ticker]: data }));
        setExpandedTicker(ticker);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTicker(null);
    }
  };

  const handleSort = (key: keyof MagicStock) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedList = useMemo(() => {
    const list = discoveryList || [];
    if (!sortConfig.key) return list;
    
    return [...list].sort((a, b) => {
        const valA = a[sortConfig.key!];
        const valB = b[sortConfig.key!];

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });
  }, [discoveryList, sortConfig]);

  const toggleExpand = (ticker: string) => {
    if (expandedTicker === ticker) {
        setExpandedTicker(null);
    } else {
        fetchAnalysis(ticker);
    }
  };

  const renderAnalysisContent = (data: StrategicData) => (
    <div className="p-4 bg-zinc-950/50 rounded-lg border border-zinc-800/50 mt-2 animate-in fade-in slide-in-from-top-4 duration-300">
        {/* 0. FINAL VERDICT */}
        <Card className="bg-zinc-900/50 border-zinc-700 mb-6 border-l-8 border-l-purple-600">
            <CardContent className="py-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-6">
                        <div className="relative flex items-center justify-center">
                            <svg className="w-24 h-24 transform -rotate-90">
                                <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-zinc-800" />
                                <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={251.2} strokeDashoffset={251.2 - (251.2 * data.verdict.score) / 100} className="text-purple-500" strokeLinecap="round" />
                            </svg>
                            <span className="absolute text-2xl font-black text-white">{data.verdict.score}</span>
                        </div>
                        <div>
                            <div className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-1">Strategic Verdict</div>
                            <div className={`text-4xl font-black italic tracking-tighter ${data.verdict.score >= 70 ? 'text-emerald-400' : data.verdict.score >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                                {data.verdict.label}
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 w-full max-w-xl space-y-4">
                        <div className="flex justify-between items-end mb-1">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Decision Breakdown</span>
                            <span className="text-[10px] font-mono text-zinc-400">Weighted Matrix v2.0</span>
                        </div>
                        <div className="h-4 w-full bg-zinc-900 rounded-full overflow-hidden flex border border-zinc-800">
                            {Object.entries(data.verdict.breakdown).map(([name, score]) => (
                                <div 
                                    key={name}
                                    style={{ width: `${score}%` }}
                                    className={`${CATEGORY_COLORS[name]} transition-all relative group h-full`}
                                >
                                    {/* Inline annotation on hover */}
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50">
                                        <div className="bg-zinc-950 border border-zinc-700 p-2 rounded shadow-2xl min-w-[120px]">
                                            <div className="text-[9px] font-black uppercase text-zinc-400 whitespace-nowrap">{name}</div>
                                            <div className="text-xs font-bold text-white">{score} / {CATEGORY_MAX[name]} pts</div>
                                        </div>
                                        <div className="w-2 h-2 bg-zinc-950 border-r border-b border-zinc-700 rotate-45 mx-auto -mt-1" />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-5 gap-1">
                            {Object.entries(CATEGORY_COLORS).map(([name, color]) => (
                                <div key={name} className="flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity">
                                    <div className={`w-1.5 h-1.5 rounded-full ${color}`} />
                                    <span className="text-[8px] font-black uppercase truncate text-zinc-400">{name.split(' ')[0]}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 1. Moat & Quality */}
            <Card className="bg-zinc-900/30 border-zinc-800 border-l-4 border-l-blue-500">
                <CardHeader className="py-3"><CardTitle className="text-blue-400 flex items-center gap-2 text-base"><Landmark className="w-4 h-4"/> Moat Check</CardTitle></CardHeader>
                <CardContent className="space-y-3 py-3">
                    <div className="flex justify-between items-center text-sm">
                        <span>Return on Equity (ROE)</span>
                        <span className={(data.moat.roe ?? 0) > 0.15 ? "text-green-400 font-bold" : "text-zinc-500"}>{(data.moat.roe ? data.moat.roe * 100 : 0).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span>Return on Invested Capital (ROIC)</span>
                        <span className={(data.moat.roic ?? 0) > 0.15 ? "text-green-400 font-bold" : "text-zinc-500"}>{(data.moat.roic ? data.moat.roic * 100 : 0).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-zinc-800 pt-2 text-sm">
                        <span>Owner's Earnings (Approx FCF)</span>
                        <span className="font-mono text-white">${((data.moat.owners_earnings ?? 0) / 1e9).toFixed(2)}B</span>
                    </div>
                    {data.moat.is_wonderful && (
                        <div className="bg-blue-500/20 text-blue-300 p-1.5 rounded text-center text-[10px] font-black uppercase tracking-widest mt-2">
                            💎 Wonderful Business
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* 2. Smart Money & Valuation */}
            <Card className="bg-zinc-900/30 border-zinc-800 border-l-4 border-l-emerald-500">
                <CardHeader className="py-3"><CardTitle className="text-emerald-400 flex items-center gap-2 text-base"><Users className="w-4 h-4"/> Smart Money & Value</CardTitle></CardHeader>
                <CardContent className="space-y-3 py-3">
                    <div className="flex justify-between items-center text-sm">
                        <span>Insider Activity (6M)</span>
                        <span className={(data.smart_money.insider_trans ?? 0) > 0 ? "text-green-400 font-bold" : (data.smart_money.insider_trans ?? 0) < -0.05 ? "text-red-400" : "text-zinc-500"}>
                            {(data.smart_money.insider_trans ? data.smart_money.insider_trans * 100 : 0).toFixed(1)}%
                        </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span>Inst. Transactions (3M)</span>
                        <span className={(data.smart_money.inst_trans ?? 0) > 0 ? "text-green-400 font-bold" : "text-zinc-500"}>
                            {(data.smart_money.inst_trans ? data.smart_money.inst_trans * 100 : 0).toFixed(1)}%
                        </span>
                    </div>
                    <div className="bg-zinc-900/50 p-2 rounded mt-2">
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-zinc-500">P/E vs Fwd P/E</span>
                            <span className="text-zinc-300">{(data.valuation.pe ?? 0).toFixed(1)}x / <span className="text-emerald-400">{(data.valuation.forward_pe ?? 0).toFixed(1)}x</span></span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-zinc-500">PEG Ratio</span>
                            <span className={(data.valuation.peg ?? 0) < 1 ? "text-green-400 font-bold" : "text-zinc-400"}>{(data.valuation.peg ?? 0).toFixed(2)}</span>
                        </div>
                    </div>
                    <div className="text-center text-[10px] font-black uppercase tracking-widest text-emerald-600/80 mt-1">
                        Verdict: {data.smart_money.verdict}
                    </div>
                </CardContent>
            </Card>


            {/* 3. Risk & Safety */}
            <Card className="bg-zinc-900/30 border-zinc-800 border-l-4 border-l-red-500">
                <CardHeader className="py-3"><CardTitle className="text-red-400 flex items-center gap-2 text-base"><ShieldAlert className="w-4 h-4"/> Risk & Safety</CardTitle></CardHeader>
                <CardContent className="space-y-3 py-3">
                    <div className="flex justify-between items-center text-sm">
                        <span>Debt / Equity Ratio</span>
                        <span className={data.safety.is_safe ? "text-green-400" : "text-red-500 font-bold"}>{(data.safety.debt_to_equity ?? 0).toFixed(2)}</span>
                    </div>
                    {!data.safety.is_safe && (
                        <div className="bg-red-500/10 border border-red-900/30 p-1.5 rounded flex items-center gap-2 text-red-400 text-xs">
                            <AlertTriangle className="w-3 h-3"/> High Leverage Warning
                        </div>
                    )}
                    
                    <div className="flex justify-between items-center text-sm border-t border-zinc-800 pt-2 mt-2">
                        <span>Stop Loss (8%)</span>
                        <span className="text-red-400 font-mono">${(data.risk.stop_loss_price ?? 0).toFixed(2)}</span>
                    </div>
                    
                    <div className="bg-zinc-950 p-2 rounded border border-zinc-800 mt-1">
                        <div className="text-[10px] uppercase text-zinc-600 font-black mb-1 flex items-center gap-1"><BrainCircuit className="w-3 h-3"/> Second-Level Thinking</div>
                        <p className="text-xs italic text-zinc-400 leading-tight">"{data.risk.second_level_thought}"</p>
                    </div>
                </CardContent>
            </Card>

            {/* 4. Policy & Catalysts */}
            <Card className="bg-zinc-900/30 border-zinc-800 border-l-4 border-l-purple-500">
                <CardHeader className="py-3"><CardTitle className="text-purple-400 flex items-center gap-2 text-base"><Scale className="w-4 h-4"/> Policy & Trend</CardTitle></CardHeader>
                <CardContent className="space-y-3 py-3">
                    <div className="text-[10px] uppercase text-zinc-500 tracking-widest mb-1">Legislative Catalysts</div>
                    {data.policy.catalysts.length > 0 ? data.policy.catalysts.map((c, i) => (
                        <div key={i} className="flex justify-between items-center bg-zinc-900/50 p-2 rounded">
                            <span className="text-xs font-medium">{c.name}</span>
                            <Badge variant="outline" className={`text-[10px] h-5 ${c.direction.includes("Bullish") ? "text-green-400 border-green-900" : "text-yellow-400 border-yellow-900"}`}>{c.direction}</Badge>
                        </div>
                    )) : <div className="text-zinc-500 text-xs italic">No specific catalysts detected.</div>}
                </CardContent>
            </Card>

            {/* 5. Technical Fine-Tuning */}
            <Card className="bg-zinc-900/30 border-zinc-800 border-l-4 border-l-yellow-500 col-span-1 md:col-span-2 lg:col-span-1">
                <CardHeader className="py-3"><CardTitle className="text-yellow-400 flex items-center gap-2 text-base"><Rocket className="w-4 h-4"/> Entry Patterns</CardTitle></CardHeader>
                <CardContent className="space-y-3 py-3">
                        <div className="grid grid-cols-2 gap-2">
                        <div className={`p-2 rounded border ${data.technicals.patterns.Cup_Handle ? "bg-green-500/20 border-green-500 text-green-300" : "bg-zinc-900/50 border-zinc-800 text-zinc-600"}`}>
                            <div className="text-[10px] font-black uppercase text-center">Cup & Handle</div>
                            <div className="text-center mt-1 text-xs">{data.technicals.patterns.Cup_Handle ? "DETECTED" : "NONE"}</div>
                        </div>
                        <div className={`p-2 rounded border ${data.technicals.patterns.Double_Bottom ? "bg-green-500/20 border-green-500 text-green-300" : "bg-zinc-900/50 border-zinc-800 text-zinc-600"}`}>
                            <div className="text-[10px] font-black uppercase text-center">Double Bottom</div>
                            <div className="text-center mt-1 text-xs">{data.technicals.patterns.Double_Bottom ? "DETECTED" : "NONE"}</div>
                        </div>
                        </div>
                        <div className="flex justify-between items-center text-xs pt-1">
                        <span>MACD Alignment</span>
                        <Badge variant="outline" className={`h-5 ${data.technicals.signals.macd_bullish ? "text-green-400 border-green-900" : "text-zinc-500 border-zinc-800"}`}>
                            {data.technicals.signals.macd_bullish ? "BULLISH" : "NEUTRAL/BEAR"}
                        </Badge>
                        </div>
                </CardContent>
            </Card>
        </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
            Strategic Investment Module
            </h2>
            <p className="text-zinc-500 text-xs tracking-widest uppercase mt-1">Rocket & Moat Engine</p>
        </div>
        <div className="flex gap-2">
            <input 
                type="text" 
                placeholder="Ticker..." 
                className="bg-zinc-900 border border-zinc-800 rounded px-3 py-1 text-sm uppercase w-24 font-mono focus:border-purple-500 outline-none"
                value={searchTicker}
                onChange={(e) => setSearchTicker(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchAnalysis(searchTicker)}
            />
            <Button size="sm" variant="outline" onClick={() => fetchAnalysis(searchTicker)} disabled={loadingTicker === searchTicker}>
                {loadingTicker === searchTicker ? <Activity className="animate-spin w-4 h-4"/> : "Analyze"}
            </Button>
            <Button size="sm" variant="default" className="bg-purple-600 hover:bg-purple-500 text-white font-black" onClick={fetchDiscovery} disabled={scanning}>
                {scanning ? <Activity className="animate-spin w-4 h-4 mr-2"/> : <Microscope className="w-4 h-4 mr-2"/>}
                {scanning ? "SCANNING..." : "SCAN S&P 500"}
            </Button>
        </div>
      </div>

       {expandedTicker && (!discoveryList || !discoveryList.find(s => s.ticker === expandedTicker)) && analysisCache[expandedTicker] && (
           <Card className="bg-zinc-900/30 border-zinc-800 mb-6">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                        <Rocket className="w-5 h-5 text-purple-400"/> Custom Analysis: {expandedTicker}
                        <Button variant="ghost" size="sm" className="ml-auto h-6 w-6 p-0" onClick={() => setExpandedTicker(null)}>X</Button>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {renderAnalysisContent(analysisCache[expandedTicker])}
                </CardContent>
           </Card>
       )}

      <Card className="bg-zinc-900/30 border-zinc-800">
        <CardHeader>
            <CardTitle className="flex items-center justify-between text-lg text-purple-400">
                <div className="flex items-center gap-2">
                    <Microscope className="w-5 h-5" /> S&P 500 Strategic Matrix
                </div>
                {discoveryList && discoveryList.length > 0 && (
                    <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">
                        {discoveryList.length} Tickers Cached
                    </span>
                )}
            </CardTitle>
        </CardHeader>
        <CardContent>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-zinc-400">
                    <thead className="text-xs text-zinc-500 uppercase bg-zinc-900/50">
                        <tr>
                            <th className="px-4 py-3 cursor-pointer hover:text-zinc-300 transition-colors group" onClick={() => handleSort('rank')}>
                                <div className="flex items-center gap-1">Pos <ArrowUpDown className="w-3 h-3 opacity-50 group-hover:opacity-100"/></div>
                            </th>
                            <th className="px-4 py-3 cursor-pointer hover:text-zinc-300 transition-colors group" onClick={() => handleSort('ticker')}>
                                <div className="flex items-center gap-1">Ticker <ArrowUpDown className="w-3 h-3 opacity-50 group-hover:opacity-100"/></div>
                            </th>
                            <th className="px-4 py-3 cursor-pointer hover:text-zinc-300 transition-colors group" onClick={() => handleSort('price')}>
                                <div className="flex items-center gap-1">Price <ArrowUpDown className="w-3 h-3 opacity-50 group-hover:opacity-100"/></div>
                            </th>
                            <th className="px-4 py-3 cursor-pointer hover:text-zinc-300 transition-colors group" onClick={() => handleSort('market_cap')}>
                                <div className="flex items-center gap-1">Capitalization <ArrowUpDown className="w-3 h-3 opacity-50 group-hover:opacity-100"/></div>
                            </th>
                            <th className="px-4 py-3 cursor-pointer hover:text-zinc-300 transition-colors group" onClick={() => handleSort('pe')}>
                                <div className="flex items-center gap-1">P/E Ratio <ArrowUpDown className="w-3 h-3 opacity-50 group-hover:opacity-100"/></div>
                            </th>
                            <th className="px-4 py-3 cursor-pointer hover:text-zinc-300 transition-colors group" onClick={() => handleSort('earnings_yield')}>
                                <div className="flex items-center gap-1">Yield <ArrowUpDown className="w-3 h-3 opacity-50 group-hover:opacity-100"/></div>
                            </th>
                            <th className="px-4 py-3 cursor-pointer hover:text-zinc-300 transition-colors group" onClick={() => handleSort('sector')}>
                                <div className="flex items-center gap-1">Sector <ArrowUpDown className="w-3 h-3 opacity-50 group-hover:opacity-100"/></div>
                            </th>
                            <th className="px-4 py-3">Deep Dive</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                        {(sortedList || []).map((stock) => (
                            <Fragment key={stock.ticker}>
                                <tr className={`hover:bg-zinc-800/30 transition-colors ${expandedTicker === stock.ticker ? "bg-zinc-800/20" : ""}`}>
                                    <td className="px-4 py-3 font-mono text-zinc-500">#{stock.rank}</td>
                                    <td className="px-4 py-3 font-bold text-white">{stock.ticker}</td>
                                    <td className="px-4 py-3">${stock.price?.toFixed(2) ?? "0.00"}</td>
                                    <td className="px-4 py-3 font-mono text-xs">{formatMarketCap(stock.market_cap)}</td>
                                    <td className="px-4 py-3 text-green-400">{stock.pe?.toFixed(1) ?? "0.0"}x</td>
                                    <td className="px-4 py-3">{(stock.earnings_yield ? stock.earnings_yield * 100 : 0).toFixed(1)}%</td>
                                    <td className="px-4 py-3 text-xs opacity-70">{stock.sector}</td>
                                    <td className="px-4 py-3">
                                        <Button 
                                            size="sm" 
                                            variant="ghost" 
                                            className={`h-7 text-xs ${expandedTicker === stock.ticker ? "bg-purple-500/20 text-purple-300" : "bg-purple-500/10 text-purple-400 hover:bg-purple-500 hover:text-white"}`}
                                            onClick={() => toggleExpand(stock.ticker)}
                                            disabled={loadingTicker === stock.ticker}
                                        >
                                            {loadingTicker === stock.ticker ? (
                                                <Activity className="animate-spin w-3 h-3 mr-1"/>
                                            ) : (
                                                expandedTicker === stock.ticker ? <ChevronUp className="w-3 h-3 mr-1"/> : <ChevronDown className="w-3 h-3 mr-1"/>
                                            )}
                                            {expandedTicker === stock.ticker ? "Close" : "Analyze"}
                                        </Button>
                                    </td>
                                </tr>
                                {expandedTicker === stock.ticker && (
                                    <tr>
                                        <td colSpan={8} className="px-0 py-0 border-b-0">
                                            {analysisCache[stock.ticker] ? (
                                                renderAnalysisContent(analysisCache[stock.ticker])
                                            ) : (
                                                <div className="flex justify-center items-center h-32 text-zinc-500">
                                                    <Activity className="animate-spin w-6 h-6 mr-2" />
                                                    <span className="text-sm uppercase tracking-widest">Igniting Engines...</span>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                )}
                            </Fragment>
                        ))}
                    </tbody>
                </table>
                {(!sortedList || sortedList.length === 0) && (
                     <div className="p-12 text-center flex flex-col items-center justify-center gap-4">
                        <div className="p-4 rounded-full bg-zinc-900/50 border border-zinc-800">
                            <Microscope className="w-8 h-8 text-zinc-700" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-black uppercase tracking-widest text-zinc-400">Strategic Matrix Offline</p>
                            <p className="text-[10px] text-zinc-600 uppercase tracking-tighter">Initialize S&P 500 scanner to populate market frequency</p>
                        </div>
                        <Button 
                            variant="outline" 
                            className="mt-2 border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                            onClick={fetchDiscovery}
                            disabled={scanning}
                        >
                            {scanning ? <Activity className="animate-spin w-4 h-4 mr-2"/> : <Zap className="w-4 h-4 mr-2"/>}
                            {scanning ? "SCANNING..." : "IGNITE SCAN"}
                        </Button>
                     </div>
                )}
            </div>
        </CardContent>
      </Card>

       {expandedTicker && (!discoveryList || !discoveryList.find(s => s.ticker === expandedTicker)) && analysisCache[expandedTicker] && (
           <Card className="bg-zinc-900/30 border-zinc-800 mt-8 animate-in slide-in-from-bottom-4 duration-500">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                        <Rocket className="w-5 h-5 text-purple-400"/> Custom Analysis: {expandedTicker}
                        <Button variant="ghost" size="sm" className="ml-auto h-6 w-6 p-0" onClick={() => setExpandedTicker(null)}>X</Button>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {renderAnalysisContent(analysisCache[expandedTicker])}
                </CardContent>
           </Card>
       )}
    </div>
  );
};
