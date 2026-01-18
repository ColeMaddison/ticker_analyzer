import { useState, useEffect } from "react";
import { Activity } from "lucide-react";

interface NavbarProps {
  onAnalyze: (ticker: string) => void;
  initialTicker?: string;
}

export const Navbar = ({ onAnalyze, initialTicker = "" }: NavbarProps) => {
  const [inputTicker, setInputTicker] = useState(initialTicker);

  useEffect(() => {
    setInputTicker(initialTicker);
  }, [initialTicker]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onAnalyze(inputTicker);
    }
  };

  return (
    <nav className="border-b border-zinc-800 bg-black/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-[1800px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <Activity className="text-green-500 w-6 h-6" /> TickerAnalyzer<span className="text-green-500 font-black">Pro</span>
          </div>
          <div className="flex gap-3">
            <input 
                className="bg-zinc-900/50 border border-zinc-700/50 rounded-full px-5 py-2 text-sm w-40 uppercase focus:outline-none focus:border-green-500 transition-all font-medium placeholder:text-zinc-700" 
                value={inputTicker} 
                onChange={e=>setInputTicker(e.target.value)} 
                onKeyDown={handleKeyDown} 
                placeholder="SYMBOL" 
            />
            <button 
                onClick={()=>onAnalyze(inputTicker)} 
                className="bg-green-600 hover:bg-green-500 px-6 py-2 rounded-full text-sm font-bold transition-all active:scale-95 shadow-[0_0_15px_rgba(34,197,94,0.3)]"
            >
                ANALYZE
            </button>
          </div>
        </div>
      </nav>
  );
};