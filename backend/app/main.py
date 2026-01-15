import json
import asyncio
from datetime import datetime, date
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse
import pandas as pd
import numpy as np
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

# Import existing services
from app.services.data_fetcher import fetch_ticker_data, fetch_company_info, fetch_news, fetch_options_sentiment, fetch_analyst_actions, fetch_sector_benchmark, fetch_social_news, fetch_fundamentals_batch
from app.services.technicals import calculate_technicals, get_latest_signals, calculate_risk_metrics
from app.services.ai_analyst import analyze_sentiment, identify_competitors
from app.services.scorer import calculate_score, calculate_hedge_fund_score
from app.services.discovery import fetch_market_buzz, analyze_market_trends
from app.services.scanner import get_sp500_tickers, scan_market
from app.services.backtester import run_beast_backtest
from app.services.macro import calculate_macro_correlations
from app.services.commodities import analyze_commodity, get_commodity_list

app = FastAPI(title="Ticker Analyzer Pro API")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to your Vercel URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health_check():
    return {"status": "active", "version": "2.0.0"}

def convert_numpy(obj):
    if isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.floating):
        if np.isnan(obj) or np.isinf(obj):
            return None
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return [convert_numpy(i) for i in obj.tolist()]
    elif isinstance(obj, pd.Timestamp):
        return obj.strftime('%Y-%m-%d')
    elif isinstance(obj, (date, datetime)):
        return obj.isoformat()
    elif isinstance(obj, dict):
        return {k: convert_numpy(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_numpy(i) for i in obj]
    elif pd.isna(obj): # Handle other pandas NA types
        return None
    return obj

@app.get("/api/commodities")
def get_commodities():
    return get_commodity_list()

@app.get("/api/commodities/{commodity_id}")
async def get_commodity_analysis_endpoint(commodity_id: str):
    result = await analyze_commodity(commodity_id)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return convert_numpy(result)

@app.get("/api/stream/analyze/{ticker}")
async def stream_analysis(ticker: str, request: Request):
    """
    Server-Sent Event endpoint for real-time progress updates and final analysis.
    """
    ticker = ticker.upper().strip()

    async def event_generator():
        try:
            # Step 1: Initial Fetch
            if await request.is_disconnected(): return
            yield {"event": "progress", "data": json.dumps({"percent": 10, "status": f"Fetching data for {ticker}..."})}
            
            df = await asyncio.to_thread(fetch_ticker_data, ticker)
            if df is None or df.empty:
                yield {"event": "error", "data": json.dumps({"error": f"Ticker {ticker} not found or Yahoo Finance rate limited (429)."})}
                return

            info = await asyncio.to_thread(fetch_company_info, ticker)
            
            # Step 2: Technicals
            if await request.is_disconnected(): return
            yield {"event": "progress", "data": json.dumps({"percent": 30, "status": "Calculating advanced technicals..."})}
            
            sector_df = await asyncio.to_thread(fetch_sector_benchmark, info.get("sector", "Unknown"))
            df_tech = await asyncio.to_thread(calculate_technicals, df, sector_df)
            signals = get_latest_signals(df_tech)
            risk_metrics = calculate_risk_metrics(df)
            
            # Step 2.5: Macro Alpha Hunter
            macro_corrs = await asyncio.to_thread(calculate_macro_correlations, df)
            info['macro_correlations'] = macro_corrs

            # Step 3: Contextual Data
            if await request.is_disconnected(): return
            yield {"event": "progress", "data": json.dumps({"percent": 50, "status": "Scanning options & social sentiment..."})}
            
            options_data = await asyncio.to_thread(fetch_options_sentiment, ticker)
            analyst_actions = await asyncio.to_thread(fetch_analyst_actions, ticker)
            headlines = await asyncio.to_thread(fetch_news, ticker, limit=10)
            social_news = await asyncio.to_thread(fetch_social_news, ticker, limit=5)

            # Step 4: AI Analysis
            if await request.is_disconnected(): return
            yield {"event": "progress", "data": json.dumps({"percent": 75, "status": "Convening AI Council (Bull vs Bear)..."})}
            
            curr_p = info.get('current_price') or info.get('regularMarketPrice') or 0
            t_m = info.get('target_mean_price', 0)
            upside_val = ((t_m - curr_p) / curr_p) * 100 if t_m and curr_p else 0
            
            tech_context = {
                "price": f"${curr_p:.2f}",
                "rsi": f"{signals.get('rsi', 0):.1f}",
                "adx": f"{signals.get('adx', 0):.1f}",
                "pcr": options_data['pcr'] if options_data else "N/A",
                "consensus": str(info.get('recommendation', 'Hold')),
                "upside": round(upside_val, 1),
                "s1": f"${signals.get('s1', 0):.2f}" if signals.get('s1') else "N/A",
                "r1": f"${signals.get('r1', 0):.2f}" if signals.get('r1') else "N/A",
                "sma_50": f"${signals.get('sma_50', 0):.2f}",
                "sma_200": f"${signals.get('sma_200', 0):.2f}",
                "bb_lower": f"${signals.get('bb_lower', 0):.2f}",
                "bb_upper": f"${signals.get('bb_upper', 0):.2f}",
                "vwap_weekly": f"${signals.get('vwap_weekly', 0):.2f}"
            }

            ai_result = await asyncio.to_thread(analyze_sentiment, ticker, headlines, social_news, tech_context)
            
            # Step 5: Finalizing
            if await request.is_disconnected(): return
            yield {"event": "progress", "data": json.dumps({"percent": 90, "status": "Identifying competitors & Finalizing..."})}
            
            peers = await asyncio.to_thread(identify_competitors, ticker)
            peer_data = []
            if peers:
                peer_list = [ticker] + peers
                pdf = await asyncio.to_thread(fetch_fundamentals_batch, peer_list)
                if not pdf.empty:
                    peer_data = pdf.replace({np.nan: None}).to_dict(orient="records")

            final_score, breakdown = calculate_score(signals, info, ai_result, options_data, analyst_actions)
            hf_score, hf_verdict = calculate_hedge_fund_score(info, risk_metrics)

            # Format Chart Data for Lightweight Charts
            # Lightweight charts expect {time: 'YYYY-MM-DD', open: X, high: Y, low: Z, close: W}
            chart_df = df_tech.reset_index().tail(150)
            chart_df['time'] = chart_df['Date'].dt.strftime('%Y-%m-%d')
            chart_df.rename(columns={'Open': 'open', 'High': 'high', 'Low': 'low', 'Close': 'close', 'Volume': 'value'}, inplace=True)
            
            # Prepare separate series for VWAP and EMA
            # We will send the full record and filter on frontend
            chart_json = chart_df.replace({np.nan: None}).to_dict(orient="records")

            payload = {
                "ticker": ticker,
                "price": curr_p,
                "info": info,
                "metrics": {
                    "upside": upside_val,
                    "sharpe": risk_metrics.get('sharpe'),
                    "drawdown": risk_metrics.get('max_drawdown'),
                },
                "score": final_score,
                "score_breakdown": breakdown,
                "hedge_fund": {
                    "score": hf_score,
                    "verdict": hf_verdict,
                    "data": risk_metrics
                },
                "ai_analysis": ai_result,
                "signals": signals,
                "news": headlines,
                "social": social_news,
                "peers": peer_data,
                "analyst_actions": analyst_actions,
                "chart_data": chart_json,
                "options_data": options_data,
                "macro_correlations": macro_corrs
            }
            
            clean_payload = convert_numpy(payload)
            yield {"event": "result", "data": json.dumps(clean_payload)}

        except Exception as e:
            import traceback
            traceback.print_exc()
            yield {"event": "error", "data": json.dumps({"error": str(e)})}

    return EventSourceResponse(event_generator())

@app.get("/api/discovery")
async def discovery_feed(sector: Optional[str] = None):
    raw_news = await asyncio.to_thread(fetch_market_buzz, sector=sector)
    analysis = await asyncio.to_thread(analyze_market_trends, raw_news)
    return analysis

@app.get("/api/scanner")
async def scanner_feed(filter_strong_buy: bool = False, signal: Optional[str] = None):
    # tickers param is no longer needed since scan_market handles the S&P 500 internally now
    df = await asyncio.to_thread(scan_market, signal=signal)
    
    if filter_strong_buy:
        df = df[df['Recommendation'] == 'Strong Buy']
    
    return convert_numpy(df.to_dict(orient="records"))

@app.get("/api/backtest/{ticker}")
async def get_backtest(ticker: str):
    ticker = ticker.upper().strip()
    try:
        # Fetch 2 years of data for backtesting (allows for SMA200 warmup)
        df = await asyncio.to_thread(fetch_ticker_data, ticker, period="2y")
        if df is None or df.empty:
            raise HTTPException(status_code=404, detail="Ticker data not found")
            
        info = await asyncio.to_thread(fetch_company_info, ticker)
        
        # Use a neutral sentiment for historical if not available
        result = await asyncio.to_thread(run_beast_backtest, ticker, df, info)
        return convert_numpy(result)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))