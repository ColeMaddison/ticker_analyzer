"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger, Progress } from "../components/ui";
import { Activity } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { AnalysisView } from "../components/dashboard/AnalysisView";
import { DiscoveryView } from "../components/dashboard/DiscoveryView";
import { ScannerView } from "../components/dashboard/ScannerView";
import { StrategyView } from "../components/dashboard/StrategyView";
import { CommodityView } from "../components/dashboard/CommodityView";
import { useTickerAnalysis } from "../hooks/useTickerAnalysis";
import { useMarketData } from "../hooks/useMarketData";

export default function Dashboard() {
  // inputTicker state removed - now isolated in Navbar
  const { data, loading, progress, status, analyzeTicker, backtestResult, isBacktesting } = useTickerAnalysis();
  const { 
    discoveryData, scannerData, scanning, fetchDiscovery, fetchScanner,
    scannerSearch, setScannerSearch,
    scannerMaxRsi, setScannerMaxRsi,
    scannerMinRelVol, setScannerMinRelVol,
    scannerOnlyStrongBuy, setScannerOnlyStrongBuy,
    scannerOnlyGoldenSetup, setScannerOnlyGoldenSetup,
    scannerSortConfig, setScannerSortConfig,
    scannerSignal, setScannerSignal,
    discoverySector, setDiscoverySector
  } = useMarketData();

  const handleAnalyze = (t: string) => {
    analyzeTicker(t);
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans antialiased selection:bg-green-500/20 pb-20">
      
      {/* Navbar Component */}
      <Navbar onAnalyze={handleAnalyze} />

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
              <TabsTrigger value="discovery" onClick={() => fetchDiscovery(false, discoverySector)} className="gap-2 font-bold text-xs uppercase px-4">🔭 Discovery</TabsTrigger>
              <TabsTrigger value="scanner" onClick={() => fetchScanner()} className="gap-2 font-bold text-xs uppercase px-4">🔍 Scanner</TabsTrigger>
              <TabsTrigger value="commodities" className="gap-2 font-bold text-xs uppercase px-4">🛢️ Commodities</TabsTrigger>
              <TabsTrigger value="strategy" className="gap-2 font-bold text-xs uppercase px-4">📖 Strategy</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="analysis">
            {data ? (
              <AnalysisView 
                data={data} 
                onTickerSelect={handleAnalyze} 
                backtestResult={backtestResult}
                isBacktesting={isBacktesting}
              />
            ) : (
              <div className="h-[60vh] flex flex-col items-center justify-center text-zinc-700 gap-6">
                <div className="p-10 rounded-full bg-zinc-900/30 border border-zinc-800/50"><Activity className="w-20 h-20 opacity-20 text-green-500" /></div>
                <p className="text-xs font-black uppercase tracking-[0.3em] opacity-40">Ready for terminal input</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="discovery">
            <DiscoveryView data={discoveryData} scanning={scanning} onScan={(force, sector) => fetchDiscovery(force, sector)} onAnalyze={handleAnalyze} currentSector={discoverySector} />
          </TabsContent>

          <TabsContent value="scanner">
            <ScannerView 
              data={scannerData} 
              scanning={scanning} 
              onScan={(force, signal) => fetchScanner(force, signal)} 
              onAnalyze={handleAnalyze}
              search={scannerSearch} setSearch={setScannerSearch}
              maxRsi={scannerMaxRsi} setMaxRsi={setScannerMaxRsi}
              minRelVol={scannerMinRelVol} setMinRelVol={setScannerMinRelVol}
              onlyStrongBuy={scannerOnlyStrongBuy} setOnlyStrongBuy={setScannerOnlyStrongBuy}
              onlyGoldenSetup={scannerOnlyGoldenSetup} setOnlyGoldenSetup={setScannerOnlyGoldenSetup}
              sortConfig={scannerSortConfig} setSortConfig={setScannerSortConfig}
              currentSignal={scannerSignal}
              setSignal={setScannerSignal}
            />
          </TabsContent>

          <TabsContent value="strategy">
            <StrategyView />
          </TabsContent>

          <TabsContent value="commodities">
            <CommodityView />
          </TabsContent>

        </Tabs>
      </main>
    </div>
  );
}
