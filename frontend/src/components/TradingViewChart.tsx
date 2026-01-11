"use client";

import { useEffect, useRef } from 'react';
import { createChart, ColorType, ISeriesApi } from 'lightweight-charts';

interface ChartProps {
  data: any[];
  colors?: {
    backgroundColor?: string;
    lineColor?: string;
    textColor?: string;
    areaTopColor?: string;
    areaBottomColor?: string;
  };
}

export const TradingViewChart = ({ data, colors = {} }: ChartProps) => {
  const {
    backgroundColor = 'transparent',
    textColor = '#d1d5db',
  } = colors;

  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const handleResize = () => {
      chart.applyOptions({ width: chartContainerRef.current?.clientWidth });
    };

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: backgroundColor },
        textColor,
      },
      grid: {
        vertLines: { color: 'rgba(42, 46, 57, 0.5)' },
        horzLines: { color: 'rgba(42, 46, 57, 0.5)' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      timeScale: {
        borderColor: 'rgba(42, 46, 57, 0.5)',
      },
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    // Add Weekly VWAP line
    const vwapSeries = chart.addLineSeries({
      color: '#fbbf24',
      lineWidth: 2,
      title: 'Weekly VWAP',
    });

    // Extract candle data
    const formattedCandles = data.map(item => ({
      time: item.time,
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
    }));

    // Extract VWAP data
    const formattedVwap = data
      .filter(item => item.VWAP_Weekly !== null)
      .map(item => ({
        time: item.time,
        value: item.VWAP_Weekly,
      }));

    candleSeries.setData(formattedCandles);
    vwapSeries.setData(formattedVwap);

    chart.timeScale().fitContent();

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [data, backgroundColor, textColor]);

  return <div ref={chartContainerRef} className="w-full h-full" />;
};
