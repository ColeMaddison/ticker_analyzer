import { useState } from "react";
import { DiscoveryTheme, ScannerResult } from "../types";

export function useMarketData() {
  const [discoveryData, setDiscoveryData] = useState<DiscoveryTheme[] | null>(null);
  const [scannerData, setScannerData] = useState<ScannerResult[] | null>(null);
  const [scanning, setScanning] = useState(false);

  // Scanner States for persistence
  const [scannerSearch, setScannerSearch] = useState("");
  const [scannerMaxRsi, setScannerMaxRsi] = useState<number>(100);
  const [scannerMinRelVol, setScannerMinRelVol] = useState<number>(0);
  const [scannerOnlyStrongBuy, setScannerOnlyStrongBuy] = useState(false);
  const [scannerOnlyGoldenSetup, setScannerOnlyGoldenSetup] = useState(false);
  const [scannerSortConfig, setScannerSortConfig] = useState<{ key: keyof ScannerResult; direction: 'asc' | 'desc' }>({ key: 'Upside %', direction: 'desc' });

  const fetchDiscovery = async (force = false) => {
    if (discoveryData && !force) return;
    setScanning(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/discovery");
      const json = await res.json();
      setDiscoveryData(json.themes);
    } catch (e) { console.error(e); }
    setScanning(false);
  };

  const fetchScanner = async (force = false) => {
    if (scannerData && !force) return;
    setScanning(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/scanner");
      const json = await res.json();
      setScannerData(json);
    } catch (e) { console.error(e); }
    setScanning(false);
  };

  return { 
    discoveryData, 
    scannerData, 
    scanning, 
    fetchDiscovery, 
    fetchScanner,
    scannerSearch, setScannerSearch,
    scannerMaxRsi, setScannerMaxRsi,
    scannerMinRelVol, setScannerMinRelVol,
    scannerOnlyStrongBuy, setScannerOnlyStrongBuy,
    scannerOnlyGoldenSetup, setScannerOnlyGoldenSetup,
    scannerSortConfig, setScannerSortConfig
  };
}
