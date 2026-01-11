import { Card, CardContent, CardHeader, CardTitle } from "../ui";
import { DiscoveryTheme } from "../../types";

export const DiscoveryView = ({ 
  data, scanning, onScan, onAnalyze, currentSector 
}: { 
  data: DiscoveryTheme[] | null, 
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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#0A0A0A] p-4 rounded-xl border border-zinc-800">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide no-scrollbar">
          {sectors.map(s => (
            <button
              key={s}
              onClick={() => onScan(true, s)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all border ${
                currentSector === s 
                ? "bg-blue-600 border-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]" 
                : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <button 
          onClick={() => onScan(true, currentSector)} 
          disabled={scanning}
          className="w-full md:w-auto text-xs font-bold bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 px-6 py-3 rounded-lg transition-all active:scale-95 disabled:opacity-50"
        >
           {scanning ? "CRUNCHING FEEDS..." : "REFRESH BUZZ"}
        </button>
      </div>
      
      {!data && scanning && (
        <div className="flex flex-col items-center justify-center py-24 gap-4 opacity-50">
            <div className="w-12 h-12 border-4 border-zinc-800 border-t-blue-500 rounded-full animate-spin"></div>
            <p className="text-sm font-black uppercase tracking-widest text-zinc-500">Discovering {currentSector} Themes...</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {data?.map((t, i)=>(
          <Card key={i} className="group bg-[#0A0A0A] hover:bg-zinc-900/20 border-zinc-800 transition-all">
            <CardHeader className="pb-4 flex flex-row justify-between items-start">
              <CardTitle className="text-base font-bold text-zinc-200 leading-snug group-hover:text-blue-400 transition-colors">{t.title}</CardTitle>
              <span className="bg-blue-500/10 text-blue-400 text-[10px] font-black px-2 py-1 rounded border border-blue-500/20">HYP {t.hype_score}</span>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-500 leading-relaxed mb-4">{t.summary}</p>
              <div className="flex flex-wrap gap-2">
                {t.tickers.map((tik: string) => (
                  <button 
                    key={tik} 
                    onClick={() => onAnalyze(tik)}
                    className="bg-zinc-900 border border-zinc-800 text-zinc-400 px-2.5 py-1 rounded text-[10px] font-black hover:text-zinc-200 hover:border-zinc-700 hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    {tik}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
