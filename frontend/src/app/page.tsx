"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger, Progress } from "../components/ui";
import { Activity } from "lucide-react";
import { AnalysisView } from "../components/dashboard/AnalysisView";
import { DiscoveryView } from "../components/dashboard/DiscoveryView";
import { ScannerView } from "../components/dashboard/ScannerView";
import { StrategyView } from "../components/dashboard/StrategyView";
import { useTickerAnalysis } from "../hooks/useTickerAnalysis";
import { useMarketData } from "../hooks/useMarketData";

export default function Dashboard() {
  const [inputTicker, setInputTicker] = useState("AAPL");
  const { data, loading, progress, status, analyzeTicker } = useTickerAnalysis();
  const { discoveryData, scannerData, scanning, fetchDiscovery, fetchScanner } = useMarketData();

  useEffect(() => {
    analyzeTicker("AAPL");
  }, []);

  const handleAnalyze = (t: string) => {
    setInputTicker(t);
    analyzeTicker(t);
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans antialiased selection:bg-green-500/20 pb-20">
      
      {/* Navbar */}
      <nav className="border-b border-zinc-800 bg-black/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-[1800px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <Activity className="text-green-500 w-6 h-6" /> TickerAnalyzer<span className="text-green-500 font-black">Pro</span>
          </div>
          <div className="flex gap-3">
            <input className="bg-zinc-900/50 border border-zinc-700/50 rounded-full px-5 py-2 text-sm w-40 uppercase focus:outline-none focus:border-green-500 transition-all font-medium placeholder:text-zinc-700" 
                   value={inputTicker} onChange={e=>setInputTicker(e.target.value)} 
                   onKeyDown={e=>e.key==='Enter'&&handleAnalyze(inputTicker)} placeholder="SYMBOL" />
            <button onClick={()=>handleAnalyze(inputTicker)} className="bg-green-600 hover:bg-green-500 px-6 py-2 rounded-full text-sm font-bold transition-all active:scale-95 shadow-[0_0_15px_rgba(34,197,94,0.3)]">ANALYZE</button>
          </div>
        </div>
      </nav>

      <main className="max-w-[1800px] mx-auto px-6 py-10">
        
        {/* Real-time Progress Bar */}
        {loading && (
          <div className="fixed bottom-8 right-8 z-50 bg-zinc-900 border border-zinc-700 p-5 rounded-xl shadow-2xl w-96 animate-in slide-in-from-bottom-5">
            <div className="flex justify-between text-xs uppercase font-black tracking-widest text-zinc-400 mb-2">
              <span>{status}</span>
              <span className="text-green-400">{progress}%</span>
            </div>
            <Progress value={progress} className="h-1.5 bg-black" />
          </div>
        )}

        <Tabs defaultValue="analysis" className="space-y-10">
          <div className="flex justify-center">
            <TabsList className="bg-zinc-900/50 border border-zinc-800/50 p-1.5 backdrop-blur-sm scale-110 origin-top">
              <TabsTrigger value="analysis" className="gap-2 font-bold text-xs uppercase px-4">📈 Analysis</TabsTrigger>
              <TabsTrigger value="discovery" onClick={fetchDiscovery} className="gap-2 font-bold text-xs uppercase px-4">🔭 Discovery</TabsTrigger>
              <TabsTrigger value="scanner" onClick={fetchScanner} className="gap-2 font-bold text-xs uppercase px-4">🔍 Scanner</TabsTrigger>
              <TabsTrigger value="strategy" className="gap-2 font-bold text-xs uppercase px-4">📖 Strategy</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="analysis">
            {data ? (
              <AnalysisView data={data} onTickerSelect={handleAnalyze} />
            ) : (
              <div className="h-[60vh] flex flex-col items-center justify-center text-zinc-700 gap-6">
                <div className="p-10 rounded-full bg-zinc-900/30 border border-zinc-800/50"><Activity className="w-20 h-20 opacity-20 text-green-500" /></div>
                <p className="text-xs font-black uppercase tracking-[0.3em] opacity-40">Ready for terminal input</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="discovery">
            <DiscoveryView data={discoveryData} scanning={scanning} onScan={fetchDiscovery} onAnalyze={handleAnalyze} />
          </TabsContent>

          <TabsContent value="scanner">
            <ScannerView data={scannerData} scanning={scanning} onScan={fetchScanner} onAnalyze={handleAnalyze} />
          </TabsContent>

          <TabsContent value="strategy">
            <StrategyView />
          </TabsContent>

        </Tabs>
      </main>
    </div>
  );
}
