import { useState } from "react";
import { TickerData } from "../types";
import { useToast } from "../components/ui";

export function useTickerAnalysis() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [data, setData] = useState<TickerData | null>(null);
  const [backtestResult, setBacktestResult] = useState<any>(null);
  const [isBacktesting, setIsBacktesting] = useState(false);
  const { addToast } = useToast();

  const runBacktest = async (ticker: string) => {
    setIsBacktesting(true);
    setBacktestResult(null);
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/backtest/${ticker}`);
      const result = await res.json();
      setBacktestResult(result);
    } catch (e) {
      console.error("Backtest failed", e);
    } finally {
      setIsBacktesting(false);
    }
  };

  const analyzeTicker = (ticker: string) => {
    if (!ticker) return;
    
    setLoading(true); 
    setProgress(5); 
    setStatus(`Initializing analysis for ${ticker}...`); 
    setData(null);
    setBacktestResult(null);

    const es = new EventSource(`http://127.0.0.1:8000/api/stream/analyze/${ticker}`);
    
    es.addEventListener("progress", (e: any) => {
      const d = JSON.parse(e.data);
      setProgress(d.percent);
      setStatus(d.status);
    });

    es.addEventListener("result", (e: any) => {
      const d = JSON.parse(e.data);
      setData(d);
      setLoading(false);
      es.close();
      // Auto-trigger backtest on analysis success
      runBacktest(ticker);
    });

    es.addEventListener("error", (e: any) => {
      try {
        if (e.data) {
            const d = JSON.parse(e.data);
            addToast(d.error || "An unknown error occurred", "error");
        } else {
            addToast("Connection to backend failed", "error");
        }
      } catch {
        addToast("Error communicating with backend", "error");
      }
      es.close(); 
      setLoading(false);
    });
  };

  return { data, loading, progress, status, analyzeTicker, backtestResult, isBacktesting };
}