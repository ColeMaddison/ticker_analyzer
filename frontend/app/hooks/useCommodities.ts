import { useState, useEffect } from 'react';
import { CommodityAnalysis, CommodityItem } from '../types';

const API_BASE = "/api";

export function useCommodities() {
  const [commodities, setCommodities] = useState<CommodityItem[]>([]);
  const [selectedCommodityId, setSelectedCommodityId] = useState<string | null>(null);
  const [data, setData] = useState<CommodityAnalysis | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/commodities`)
      .then(res => res.json())
      .then(setCommodities)
      .catch(console.error);
  }, []);

  const selectCommodity = async (id: string) => {
    setSelectedCommodityId(id);
    setLoading(true);
    setData(null);
    try {
      const res = await fetch(`${API_BASE}/commodities/${id}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return {
    commodities,
    selectedCommodityId,
    data,
    loading,
    selectCommodity,
    refresh: () => selectedCommodityId && selectCommodity(selectedCommodityId)
  };
}