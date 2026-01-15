"use client";

import { useCommodities } from "../../hooks/useCommodities";
import { AdvancedChart } from "../AdvancedChart";
import { ScrollArea, Badge, Card, CardContent, CardHeader, CardTitle, Separator } from "../ui";
import { Loader2, TrendingUp, TrendingDown, AlertTriangle, Globe, BarChart3, Target } from "lucide-react";
import { parseMarkdown } from "../../lib/utils";

export function CommodityView() {
  const { commodities, selectedCommodityId, data, loading, selectCommodity } = useCommodities();

  return (
    <div className="flex h-[calc(100vh-140px)] gap-6">
      
      {/* Sidebar List */}
      <div className="w-64 flex-shrink-0 bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur">
          <h2 className="font-bold text-zinc-100 flex items-center gap-2">
            <Globe className="w-4 h-4 text-amber-500" /> Global Markets
          </h2>
        </div>
        <ScrollArea className="flex-1 p-2">
          <div className="space-y-1">
            {commodities.map((c) => (
              <button
                key={c.id}
                onClick={() => selectCommodity(c.id)}
                className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  selectedCommodityId === c.id 
                    ? "bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]" 
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto pr-2">
        {!selectedCommodityId ? (
          <div className="h-full flex flex-col items-center justify-center text-zinc-600 gap-4">
            <Globe className="w-16 h-16 opacity-20" />
            <p className="text-sm font-medium uppercase tracking-widest">Select a commodity to analyze</p>
          </div>
        ) : loading ? (
          <div className="h-full flex flex-col items-center justify-center text-amber-500 gap-4">
            <Loader2 className="w-10 h-10 animate-spin" />
            <p className="text-xs font-bold uppercase tracking-widest animate-pulse">Analyzing Macro Factors...</p>
          </div>
        ) : data ? (
          <div className="space-y-6">
            
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-black text-white tracking-tight">{data.name}</h1>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-2xl font-mono text-zinc-300">${data.price.toFixed(2)}</span>
                  <Badge variant="outline" className={`text-sm px-3 py-1 uppercase tracking-widest font-black ${
                    data.strategy.verdict.toLowerCase().includes('buy') ? "bg-green-500/10 text-green-500 border-green-500/20" :
                    data.strategy.verdict.toLowerCase().includes('sell') ? "bg-red-500/10 text-red-500 border-red-500/20" :
                    "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                  }`}>
                    {data.strategy.verdict}
                  </Badge>
                  <span className="text-xs font-bold text-zinc-500">VETERAN SCORE: <span className={`${(data.veteran_metrics?.score || 50) > 65 ? 'text-green-500' : (data.veteran_metrics?.score || 50) < 35 ? 'text-red-500' : 'text-amber-500'}`}>{data.veteran_metrics?.score ?? data.strategy.relevance_score}/100</span></span>
                </div>
              </div>
            </div>

            {/* Chart */}
            <AdvancedChart data={data.chart_data} />

            {/* Veteran's Scorecard (Ironclad Indices) */}
            {data.veteran_metrics && (
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-black text-amber-500 uppercase flex items-center gap-2">
                    <Target className="w-4 h-4" /> Veteran's Filter (2026 Ironclad Indices)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    
                    {/* DXY */}
                    <div className="p-3 bg-zinc-900 rounded-lg border border-zinc-800">
                      <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Liquidity (DXY)</div>
                      <div className={`text-xl font-mono font-bold ${data.veteran_metrics.dxy_level < 98 ? 'text-green-400' : data.veteran_metrics.dxy_level > 103 ? 'text-red-400' : 'text-zinc-300'}`}>
                        {data.veteran_metrics.dxy_level}
                      </div>
                      <div className="text-[10px] text-zinc-500 mt-1">Target: &lt; 98</div>
                    </div>

                    {/* MOVE Index */}
                    <div className="p-3 bg-zinc-900 rounded-lg border border-zinc-800">
                      <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Volatility (MOVE)</div>
                      <div className={`text-xl font-mono font-bold ${data.veteran_metrics.move_index < 100 ? 'text-green-400' : data.veteran_metrics.move_index > 120 ? 'text-red-400' : 'text-zinc-300'}`}>
                        {data.veteran_metrics.move_index}
                      </div>
                      <div className="text-[10px] text-zinc-500 mt-1">Panic Level: &gt; 120</div>
                    </div>

                    {/* Real Yields */}
                    <div className="p-3 bg-zinc-900 rounded-lg border border-zinc-800">
                      <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Real Yields (TIP)</div>
                      <div className={`text-xl font-mono font-bold ${data.veteran_metrics.real_yield_trend === 'Rising' ? 'text-green-400' : 'text-red-400'}`}>
                        {data.veteran_metrics.real_yield_trend}
                      </div>
                      <div className="text-[10px] text-zinc-500 mt-1">Rising Price = Buy</div>
                    </div>

                    {/* Ratios */}
                    <div className="p-3 bg-zinc-900 rounded-lg border border-zinc-800">
                      <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Au/Ag Ratio</div>
                      <div className={`text-xl font-mono font-bold ${data.veteran_metrics.gold_silver_ratio > 80 ? 'text-green-400' : data.veteran_metrics.gold_silver_ratio < 60 ? 'text-red-400' : 'text-zinc-300'}`}>
                        {data.veteran_metrics.gold_silver_ratio}
                      </div>
                      <div className="text-[10px] text-zinc-500 mt-1">Buy Silver &gt; 80</div>
                    </div>

                     {/* Copper/Gold Ratio */}
                     <div className="p-3 bg-zinc-900 rounded-lg border border-zinc-800">
                      <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Cu/Au Ratio</div>
                      <div className="text-xl font-mono font-bold text-zinc-300">
                        {data.veteran_metrics.copper_gold_ratio}
                      </div>
                      <div className="text-[10px] text-zinc-500 mt-1">Growth vs Fear</div>
                    </div>

                    {/* Logistics */}
                    <div className="p-3 bg-zinc-900 rounded-lg border border-zinc-800">
                      <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Logistics (BDI)</div>
                      <div className="text-xl font-mono font-bold text-zinc-300">
                        {data.veteran_metrics.baltic_dry}
                      </div>
                      <div className="text-[10px] text-zinc-500 mt-1">Physical Flow</div>
                    </div>

                  </div>
                </CardContent>
              </Card>
            )}

            {/* Strategy Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-10">
              
              {/* Action Plan */}
              <Card className="bg-zinc-900/50 border-zinc-800 md:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-black text-amber-500 uppercase flex items-center gap-2">
                    <Target className="w-4 h-4" /> Strategic Action Plan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-invert prose-sm max-w-none text-zinc-300 whitespace-pre-line" dangerouslySetInnerHTML={{ __html: parseMarkdown(data.strategy.action_plan) }} />
                </CardContent>
              </Card>

              {/* Macro & Supply/Demand */}
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-black text-zinc-400 uppercase flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" /> Macro Drivers
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center text-sm border-b border-zinc-800/50 pb-2">
                    <span className="text-zinc-500">DXY Correlation</span>
                    <span className="font-mono text-zinc-200">{data.macro_context.dxy_correlation}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-b border-zinc-800/50 pb-2">
                    <span className="text-zinc-500">Rate Sensitivity</span>
                    <span className="font-mono text-zinc-200">{data.macro_context.rate_sensitivity}</span>
                  </div>
                   <div className="flex justify-between items-center text-sm pb-2">
                    <span className="text-zinc-500">Inflation Outlook</span>
                    <span className={`font-bold ${data.macro_context.inflation_outlook === 'High' ? 'text-red-400' : 'text-green-400'}`}>
                      {data.macro_context.inflation_outlook}
                    </span>
                  </div>
                  <div className="mt-4">
                    <h4 className="text-xs font-bold text-zinc-500 mb-2 uppercase">Macro Outlook</h4>
                    <div className="text-xs text-zinc-400 leading-relaxed" dangerouslySetInnerHTML={{ __html: parseMarkdown(data.strategy.macro_outlook) }} />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-black text-zinc-400 uppercase flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> Risks & Fundamentals
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                   <div>
                    <h4 className="text-xs font-bold text-zinc-500 mb-2 uppercase">Supply / Demand</h4>
                    <div className="text-xs text-zinc-400 leading-relaxed" dangerouslySetInnerHTML={{ __html: parseMarkdown(data.strategy.supply_demand_analysis) }} />
                  </div>
                  <Separator className="bg-zinc-800" />
                   <div>
                    <h4 className="text-xs font-bold text-zinc-500 mb-2 uppercase">Geopolitical Risks</h4>
                    <div className="text-xs text-zinc-400 leading-relaxed" dangerouslySetInnerHTML={{ __html: parseMarkdown(data.strategy.geopolitical_risks) }} />
                  </div>
                </CardContent>
              </Card>

            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}