import { useState } from "react";
import { DiscoveryResponse, ScannerResult } from "../types";

export function useMarketData() {
  const [discoveryData, setDiscoveryData] = useState<DiscoveryResponse | null>(null);
  const [scannerData, setScannerData] = useState<ScannerResult[] | null>(null);
  const [scanning, setScanning] = useState(false);

  // Scanner States for persistence
  const [scannerSearch, setScannerSearch] = useState("");
  const [scannerMaxRsi, setScannerMaxRsi] = useState<number>(100);
  const [scannerMinRelVol, setScannerMinRelVol] = useState<number>(0);
  const [scannerOnlyStrongBuy, setScannerOnlyStrongBuy] = useState(false);
  const [scannerOnlyGoldenSetup, setScannerOnlyGoldenSetup] = useState(false);
  const [scannerSortConfig, setScannerSortConfig] = useState<{ key: keyof ScannerResult; direction: 'asc' | 'desc' }>({ key: 'Upside %', direction: 'desc' });

  const [scannerSignal, setScannerSignal] = useState<string | null>(null);

  const [discoverySector, setDiscoverySector] = useState<string>("All");

  // Doomsday Data
  const [doomsdayData, setDoomsdayData] = useState<any | null>(null);

  // Strategic Data Persistence
  const [strategicData, setStrategicData] = useState<any[] | null>(null);
  const [strategicCache, setStrategicCache] = useState<Record<string, any>>({});

  const fetchDoomsday = async (force = false) => {
    if (doomsdayData && !force) return;
    setScanning(true);
    try {
      const res = await fetch("/api/macro/doomsday");
      const json = await res.json();
      setDoomsdayData(json);
    } catch (e) { console.error(e); }
    setScanning(false);
  };

  const fetchDiscovery = async (force = false, sector: string = "All") => {
    if (discoveryData && !force && discoverySector === sector) return;
    setScanning(true);
    setDiscoverySector(sector);
    try {
      const url = new URL("/api/discovery", "http://localhost");
      if (sector && sector !== "All") url.searchParams.append("sector", sector);
      
      const res = await fetch(url.pathname + url.search);
      const json = await res.json();
      setDiscoveryData(json);
    } catch (e) { console.error(e); }
    setScanning(false);
  };

  const fetchScanner = async (force = false, signal: string | null = null) => {
    if (scannerData && !force && scannerSignal === signal) return;
    setScanning(true);
    setScannerSignal(signal);
    try {
      const url = new URL("/api/scanner", "http://localhost");
      if (signal) url.searchParams.append("signal", signal);
      
      const res = await fetch(url.pathname + url.search);
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
    scannerSortConfig, setScannerSortConfig,
    scannerSignal, setScannerSignal,
        discoverySector, setDiscoverySector,
        strategicData, setStrategicData,
        strategicCache, setStrategicCache,
        doomsdayData, fetchDoomsday
      };
    }
    