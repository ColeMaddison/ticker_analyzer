import { useState } from "react";
import { TickerData } from "../types";

export function useTickerAnalysis() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [data, setData] = useState<TickerData | null>(null);

  const analyzeTicker = (ticker: string) => {
    if (!ticker) return;
    
    setLoading(true); 
    setProgress(5); 
    setStatus(`Initializing analysis for ${ticker}...`); 
    setData(null);

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
    });

    es.addEventListener("error", (e: any) => {
      console.error("SSE Error:", e);
      es.close(); 
      setLoading(false);
    });
  };

  return { data, loading, progress, status, analyzeTicker };
}
