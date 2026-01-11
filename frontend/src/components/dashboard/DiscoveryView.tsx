import { Card, CardContent, CardHeader, CardTitle } from "../ui";
import { DiscoveryTheme } from "../../types";

export const DiscoveryView = ({ data, scanning, onScan, onAnalyze }: { data: DiscoveryTheme[] | null, scanning: boolean, onScan: () => void, onAnalyze: (t: string) => void }) => {
  return (
    <div>
      <div className="flex justify-end mb-6">
         <button onClick={onScan} className="text-xs font-bold bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 px-6 py-3 rounded-lg transition-all active:scale-95">
           {scanning ? "SCANNING..." : "SCAN MARKET BUZZ"}
         </button>
      </div>
      
      {!data && scanning && <div className="text-center text-zinc-500 py-20 animate-pulse">Scanning Global Feeds...</div>}
      
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
