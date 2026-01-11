import { useState } from "react";
import { DiscoveryTheme, ScannerResult } from "../types";

export function useMarketData() {
  const [discoveryData, setDiscoveryData] = useState<DiscoveryTheme[] | null>(null);
  const [scannerData, setScannerData] = useState<ScannerResult[] | null>(null);
  const [scanning, setScanning] = useState(false);

  const fetchDiscovery = async () => {
    if (discoveryData) return;
    setScanning(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/discovery");
      const json = await res.json();
      setDiscoveryData(json.themes);
    } catch (e) { console.error(e); }
    setScanning(false);
  };

  const fetchScanner = async () => {
    if (scannerData) return;
    setScanning(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/scanner");
      const json = await res.json();
      setScannerData(json);
    } catch (e) { console.error(e); }
    setScanning(false);
  };

  return { discoveryData, scannerData, scanning, fetchDiscovery, fetchScanner };
}
