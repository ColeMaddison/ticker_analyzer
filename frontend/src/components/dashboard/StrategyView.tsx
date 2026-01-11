import { Card, CardContent, CardHeader, CardTitle } from "../ui";
import { Target, ShieldAlert, HelpCircle } from "lucide-react";

export const StrategyView = () => {
  return (
    <div className="space-y-10 animate-in zoom-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2"><Target className="w-4 h-4"/> High-Conviction Setups</h3>
          <Card className="border-l-4 border-l-green-500 bg-green-500/5 border-zinc-800">
            <CardHeader className="pb-3"><CardTitle className="text-green-400 text-base font-bold">1. The Convergence (Golden Play)</CardTitle></CardHeader>
            <CardContent className="text-sm text-zinc-400 leading-relaxed"><b>Score {'>'} 75</b> AND <b>Consensus is 'Strong Buy'</b>. Rare alignment.</CardContent>
          </Card>
          <Card className="border-l-4 border-l-yellow-500 bg-yellow-500/5 border-zinc-800">
            <CardHeader className="pb-3"><CardTitle className="text-yellow-400 text-base font-bold">2. The Watchlist (Value Trap Check)</CardTitle></CardHeader>
            <CardContent className="text-sm text-zinc-400 leading-relaxed"><b>Strong Buy</b> but <b>Score {'<'} 50</b>. Great company, bad timing.</CardContent>
          </Card>
          <Card className="border-l-4 border-l-blue-500 bg-blue-500/5 border-zinc-800">
            <CardHeader className="pb-3"><CardTitle className="text-blue-400 text-base font-bold">3. Breakout Cloud</CardTitle></CardHeader>
            <CardContent className="text-sm text-zinc-400 leading-relaxed">Price leaving shaded Bollinger area with volume + Squeeze Fire dot.</CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2"><ShieldAlert className="w-4 h-4"/> Red Flags to Avoid</h3>
          <Card className="border-l-4 border-l-red-500 bg-red-500/5 border-zinc-800">
            <CardHeader className="pb-3"><CardTitle className="text-red-400 text-base font-bold">1. Institutional Exhaustion</CardTitle></CardHeader>
            <CardContent className="text-sm text-zinc-400 leading-relaxed"><b>Put/Call Ratio {'>'} 1.1</b> + <b>RSI {'>'} 70</b>. Big money hedging.</CardContent>
          </Card>
          <Card className="border-l-4 border-l-red-500 bg-red-500/5 border-zinc-800">
            <CardHeader className="pb-3"><CardTitle className="text-red-400 text-base font-bold">2. The Chop Zone</CardTitle></CardHeader>
            <CardContent className="text-sm text-zinc-400 leading-relaxed"><b>ADX {'<'} 20</b>. No trend. Algorithms will chop you up.</CardContent>
          </Card>
        </div>
      </div>

      <div className="pt-8 border-t border-zinc-800">
        <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-6 flex items-center gap-2"><HelpCircle className="w-4 h-4"/> Metric Glossary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="text-sm text-zinc-400"><span className="text-zinc-200 font-bold block mb-1">Rel Strength:</span> Outperformance vs Sector ETF. {'>'}5% is a leader.</div>
            <div className="text-sm text-zinc-400"><span className="text-zinc-200 font-bold block mb-1">RSI Regime:</span> Watch 40 support / 60 resistance.</div>
            <div className="text-sm text-zinc-400"><span className="text-zinc-200 font-bold block mb-1">MACD Divergence:</span> Price lower low vs MACD higher low = Selling exhausted.</div>
          </div>
          <div className="space-y-4">
            <div className="text-sm text-zinc-400"><span className="text-zinc-200 font-bold block mb-1">Weekly VWAP:</span> Avg institutional entry. Crossing above is Buy signal.</div>
            <div className="text-sm text-zinc-400"><span className="text-zinc-200 font-bold block mb-1">SMI:</span> Stochastic Momentum. +/- 40 critical levels.</div>
            <div className="text-sm text-zinc-400"><span className="text-zinc-200 font-bold block mb-1">Squeeze:</span> White dots = volatility compressed. Big move coming.</div>
          </div>
        </div>
      </div>
    </div>
  );
};
