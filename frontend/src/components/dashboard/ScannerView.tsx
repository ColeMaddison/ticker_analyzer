import { useMemo } from "react";
import { Card, CardContent } from "../ui";
import { ScannerResult } from "../../types";
import { Search, Play, Check, Square, CheckSquare, ArrowUpDown, Star } from "lucide-react";

export const ScannerView = ({ 
  data, scanning, onScan, onAnalyze,
  search, setSearch,
  maxRsi, setMaxRsi,
  minRelVol, setMinRelVol,
  onlyStrongBuy, setOnlyStrongBuy,
  onlyGoldenSetup, setOnlyGoldenSetup,
  sortConfig, setSortConfig
}: { 
  data: ScannerResult[] | null, 
  scanning: boolean, 
  onScan: () => void, 
  onAnalyze: (t: string) => void,
  search: string, setSearch: (v: string) => void,
  maxRsi: number, setMaxRsi: (v: number) => void,
  minRelVol: number, setMinRelVol: (v: number) => void,
  onlyStrongBuy: boolean, setOnlyStrongBuy: (v: boolean) => void,
  onlyGoldenSetup: boolean, setOnlyGoldenSetup: (v: boolean) => void,
  sortConfig: { key: keyof ScannerResult; direction: 'asc' | 'desc' }, setSortConfig: (v: any) => void
}) => {

  const isGoldenSetup = (r: ScannerResult) => {
    return r.Recommendation === "Strong Buy" && r["Upside %"] > 15 && r["Rel Vol"] > 1.2 && r.RSI < 60;
  };

  const filteredData = useMemo(() => {
    if (!data) return [];
    let sorted = [...data];
    
    // Sort
    sorted.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted.filter(r => 
      r.Ticker.includes(search.toUpperCase()) && 
      r.RSI <= maxRsi && 
      r["Rel Vol"] >= minRelVol &&
      (!onlyStrongBuy || r.Recommendation === 'Strong Buy') &&
      (!onlyGoldenSetup || isGoldenSetup(r))
    );
  }, [data, search, maxRsi, minRelVol, onlyStrongBuy, onlyGoldenSetup, sortConfig]);

  const handleSort = (key: keyof ScannerResult) => {
    setSortConfig((current: any) => ({
      key,
      direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const getRecColor = (rec: string) => {
    const r = rec.toLowerCase();
    if (r.includes('strong buy')) return "text-green-400 bg-green-400/10 border-green-400/20";
    if (r.includes('buy')) return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
    if (r.includes('sell')) return "text-red-400 bg-red-400/10 border-red-400/20";
    return "text-zinc-400 bg-zinc-400/10 border-zinc-400/20";
  };

  const SortIcon = ({ column }: { column: keyof ScannerResult }) => (
    <ArrowUpDown className={`w-3 h-3 ml-1 inline-block transition-colors ${sortConfig.key === column ? 'text-green-500' : 'text-zinc-600 group-hover:text-zinc-400'}`} />
  );

  return (
    <div className="space-y-4">
       <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-[#0A0A0A] p-4 rounded-xl border border-zinc-800">
         
         <div className="flex gap-3 items-center w-full md:w-auto flex-wrap">
            <div className="relative group">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500 group-focus-within:text-green-500 transition-colors" />
                <input 
                    type="text" 
                    placeholder="Search Ticker..." 
                    className="pl-10 pr-4 py-2 bg-zinc-900/50 border border-zinc-700 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-green-500 w-40 transition-all uppercase placeholder:normal-case"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="flex items-center gap-2 bg-zinc-900/50 border border-zinc-700 rounded-lg px-3 py-2">
                <span className="text-xs font-bold text-zinc-500 uppercase">Max RSI</span>
                <input 
                    type="number" 
                    className="w-12 bg-transparent text-sm font-mono text-zinc-200 focus:outline-none text-right"
                    value={maxRsi}
                    onChange={(e) => setMaxRsi(Number(e.target.value))}
                />
            </div>

            <div className="flex items-center gap-2 bg-zinc-900/50 border border-zinc-700 rounded-lg px-3 py-2">
                <span className="text-xs font-bold text-zinc-500 uppercase">Min Vol</span>
                <input 
                    type="number" 
                    className="w-12 bg-transparent text-sm font-mono text-zinc-200 focus:outline-none text-right"
                    value={minRelVol}
                    onChange={(e) => setMinRelVol(Number(e.target.value))}
                />
            </div>

            <button 
                onClick={() => setOnlyStrongBuy(!onlyStrongBuy)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold border transition-all ${onlyStrongBuy ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-zinc-900/50 border-zinc-700 text-zinc-500 hover:text-zinc-300'}`}
            >
                {onlyStrongBuy ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                STRONG BUY
            </button>

            <button 
                onClick={() => setOnlyGoldenSetup(!onlyGoldenSetup)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold border transition-all ${onlyGoldenSetup ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400' : 'bg-zinc-900/50 border-zinc-700 text-zinc-500 hover:text-zinc-300'}`}
            >
                {onlyGoldenSetup ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                GOLDEN
            </button>
         </div>

         <button onClick={onScan} className="w-full md:w-auto flex items-center gap-2 text-xs font-bold bg-green-600 hover:bg-green-500 text-white px-6 py-2.5 rounded-lg transition-all active:scale-95 shadow-[0_0_20px_rgba(34,197,94,0.2)]">
           {scanning ? <span className="animate-spin">⏳</span> : <Play className="w-3 h-3 fill-current" />}
           {scanning ? "SCANNING..." : "RUN SCANNER"}
         </button>
       </div>
      
      {!data && scanning && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50 animate-pulse">
            <div className="w-12 h-12 border-4 border-zinc-800 border-t-green-500 rounded-full animate-spin"></div>
            <p className="text-sm font-black uppercase tracking-widest text-zinc-500">Processing S&P 500 Index...</p>
        </div>
      )}

      {data && (
        <Card className="overflow-hidden bg-[#0A0A0A] border-zinc-800 shadow-xl">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                <thead className="text-[10px] uppercase font-black tracking-widest text-zinc-500 bg-zinc-900/80 border-b border-zinc-800 backdrop-blur sticky top-0">
                    <tr>
                        <th className="p-4 w-16 text-center cursor-pointer hover:bg-zinc-800/50 group" onClick={() => handleSort('Rank')}># <SortIcon column="Rank" /></th>
                        <th className="p-4 cursor-pointer hover:bg-zinc-800/50 group" onClick={() => handleSort('Ticker')}>Ticker <SortIcon column="Ticker" /></th>
                        <th className="p-4 text-right cursor-pointer hover:bg-zinc-800/50 group" onClick={() => handleSort('Price')}>Price <SortIcon column="Price" /></th>
                        <th className="p-4 text-center cursor-pointer hover:bg-zinc-800/50 group" onClick={() => handleSort('Recommendation')}>Rec <SortIcon column="Recommendation" /></th>
                        <th className="p-4 text-center cursor-pointer hover:bg-zinc-800/50 group" onClick={() => handleSort('RSI')}>RSI <SortIcon column="RSI" /></th>
                        <th className="p-4 text-center cursor-pointer hover:bg-zinc-800/50 group" onClick={() => handleSort('Rel Vol')}>Rel Vol <SortIcon column="Rel Vol" /></th>
                        <th className="p-4 text-right cursor-pointer hover:bg-zinc-800/50 group" onClick={() => handleSort('Upside %')}>Upside <SortIcon column="Upside %" /></th>
                        <th className="p-4 text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/30">
                    {filteredData.map((r, i)=>(
                    <tr key={r.Ticker} className={`hover:bg-zinc-900/40 transition-colors group ${isGoldenSetup(r) ? 'bg-emerald-500/[0.03]' : ''}`}>
                        <td className="p-3 text-center text-zinc-600 font-mono text-xs">{r.Rank}</td>
                        <td className="p-3 font-black text-zinc-200 tracking-wide flex items-center gap-2">
                            {r.Ticker}
                            {isGoldenSetup(r) && (
                                <div className="flex items-center gap-1">
                                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 animate-pulse" />
                                    <span className="text-[7px] bg-yellow-500/10 text-yellow-500 px-1 rounded border border-yellow-500/20 font-black tracking-tighter">GOLDEN</span>
                                </div>
                            )}
                        </td>
                        <td className="p-3 text-right font-mono font-medium text-zinc-400">${r.Price.toFixed(2)}</td>
                        <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-black border ${getRecColor(r.Recommendation)}`}>
                                {r.Recommendation}
                            </span>
                        </td>
                        <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${r.RSI<30?"text-green-400 bg-green-400/10 animate-pulse":r.RSI>70?"text-red-400 bg-red-400/10":"text-zinc-500"}`}>
                                {r.RSI.toFixed(0)}
                            </span>
                        </td>
                        <td className="p-3 text-center font-mono text-xs text-zinc-400">{r["Rel Vol"].toFixed(1)}x</td>
                        <td className={`p-3 text-right font-mono font-bold ${r['Upside %']>0 ? 'text-blue-400' : 'text-zinc-600'}`}>
                            {r['Upside %'] > 0 ? '+' : ''}{r['Upside %'].toFixed(1)}%
                        </td>
                        <td className="p-3 text-right">
                            <button onClick={() => onAnalyze(r.Ticker)} className="text-[9px] font-black uppercase bg-zinc-900 hover:bg-green-600 hover:text-white text-zinc-400 border border-zinc-700 px-3 py-1.5 rounded transition-all">
                                Analyze
                            </button>
                        </td>
                    </tr>
                    ))}
                    {filteredData.length === 0 && (
                        <tr>
                            <td colSpan={8} className="p-10 text-center text-zinc-500 text-xs uppercase tracking-widest">No tickers match your filters</td>
                        </tr>
                    )}
                </tbody>
                </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};