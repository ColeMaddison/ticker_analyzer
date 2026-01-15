import asyncio
import pandas as pd
import numpy as np
from app.services.data_fetcher import fetch_ticker_data, fetch_news
from app.services.technicals import calculate_technicals, get_latest_signals
from app.services.ai_analyst import analyze_commodity_strategy

# Keyed by slug ID for elegant URLs
COMMODITY_MAP = {
    "gold": {"name": "Gold", "ticker": "GC=F"},
    "silver": {"name": "Silver", "ticker": "SI=F"},
    "crude-oil": {"name": "Crude Oil", "ticker": "CL=F"},
    "natural-gas": {"name": "Natural Gas", "ticker": "NG=F"},
    "copper": {"name": "Copper", "ticker": "HG=F"},
    "corn": {"name": "Corn", "ticker": "ZC=F"},
    "wheat": {"name": "Wheat", "ticker": "ZW=F"},
    "soybeans": {"name": "Soybeans", "ticker": "ZS=F"},
    "coffee": {"name": "Coffee", "ticker": "KC=F"}
}

MACRO_INDICATORS = {
    "USD Index": "DX-Y.NYB",
    "10Y Yield": "^TNX",
    "VIX": "^VIX",
    "MOVE Index": "^MOVE",         # Bond Volatility
    "BCOM Index": "^BCOM",         # Bloomberg Commodity Index
    "GSCI Index": "^SPGSCI",       # S&P GSCI
    "Baltic Dry": "BDRY",          # ETF Proxy for Logistics
    "Carbon Credits": "KRBN",      # ETF Proxy for Carbon
    "Real Yields (TIP)": "TIP"     # TIPS ETF (Inverse of Real Yields)
}

async def analyze_commodity(commodity_id):
    config = COMMODITY_MAP.get(commodity_id.lower())
    if not config:
        return {"error": "Invalid commodity ID"}

    ticker = config["ticker"]
    display_name = config["name"]

    # Fetch Data in Parallel
    # We need specific tickers for ratios: Copper, Gold, Silver
    ratio_tickers = ["HG=F", "GC=F", "SI=F"]
    
    # 1. Fetch Target Commodity + News
    tasks = [
        asyncio.to_thread(fetch_ticker_data, ticker),
        asyncio.to_thread(fetch_news, ticker),
    ]
    
    # 2. Fetch Macro Indicators
    macro_keys = list(MACRO_INDICATORS.keys())
    for key in macro_keys:
        tasks.append(asyncio.to_thread(fetch_ticker_data, MACRO_INDICATORS[key]))

    # 3. Fetch Ratio Components (if not already fetched as target or macro)
    for rt in ratio_tickers:
        if rt != ticker: # Avoid duplicate fetch
            tasks.append(asyncio.to_thread(fetch_ticker_data, rt))

    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    # Unpack Results
    df = results[0]
    news = results[1] if isinstance(results[1], list) else []
    
    macro_data = {}
    result_idx = 2
    for key in macro_keys:
        val = results[result_idx]
        macro_data[key] = val if isinstance(val, pd.DataFrame) and not val.empty else None
        result_idx += 1
        
    ratio_data = {}
    for rt in ratio_tickers:
        if rt == ticker:
            ratio_data[rt] = df
        else:
            val = results[result_idx]
            ratio_data[rt] = val if isinstance(val, pd.DataFrame) and not val.empty else None
            result_idx += 1

    if df is None or df.empty:
        return {"error": f"No data found for {display_name}"}

    # Technicals
    df = calculate_technicals(df)
    signals = get_latest_signals(df)
    
    # --- VETERAN ANALYTICS ENGINE ---
    
    # 1. Liquidity & Macro
    dxy_val = macro_data["USD Index"]["Close"].iloc[-1] if macro_data["USD Index"] is not None else 100
    move_val = macro_data["MOVE Index"]["Close"].iloc[-1] if macro_data["MOVE Index"] is not None else 100
    tip_price = macro_data["Real Yields (TIP)"]["Close"].iloc[-1] if macro_data["Real Yields (TIP)"] is not None else 100
    tip_trend = "Rising" if macro_data["Real Yields (TIP)"] is not None and tip_price > macro_data["Real Yields (TIP)"]["Close"].rolling(20).mean().iloc[-1] else "Falling"
    
    # 2. Ratios
    copper_price = ratio_data["HG=F"]["Close"].iloc[-1] if ratio_data["HG=F"] is not None else 0
    gold_price = ratio_data["GC=F"]["Close"].iloc[-1] if ratio_data["GC=F"] is not None else 0
    silver_price = ratio_data["SI=F"]["Close"].iloc[-1] if ratio_data["SI=F"] is not None else 0
    
    # Copper/Gold (Growth vs Fear) - Scaled for readability (lbs vs oz)
    # Market standard is usually just Price/Price, but Copper is ~4 and Gold ~2000. 
    # To make it readable like the 0.002 range or similar.
    cg_ratio = (copper_price / gold_price) * 1000 if gold_price > 0 else 0 
    
    # Gold/Silver
    gs_ratio = (gold_price / silver_price) if silver_price > 0 else 0
    
    # 3. Flow (BCOM vs GSCI)
    bcom_trend = "Bullish" if macro_data["BCOM Index"] is not None and macro_data["BCOM Index"]["Close"].iloc[-1] > macro_data["BCOM Index"]["Close"].shift(20).iloc[-1] else "Bearish"
    
    # 4. Logistics
    bdry_val = macro_data["Baltic Dry"]["Close"].iloc[-1] if macro_data["Baltic Dry"] is not None else 0
    
    # --- SCORING MODEL (0-100) ---
    score = 50 # Base
    
    # DXY Filter (Inverse)
    if dxy_val < 98: score += 20 # Strong Buy Signal
    elif dxy_val > 103: score -= 20 # Strong Sell Signal
    elif dxy_val < 100: score += 10
    
    # MOVE Filter (Volatility)
    if move_val > 120: score -= 25 # "Plumbing leaking" - Cash is King
    elif move_val < 100: score += 10
    
    # Real Yields (TIP ETF Proxy)
    # If TIP is Rising => Real Yields Falling => Good for Hard Assets
    if tip_trend == "Rising": score += 15
    else: score -= 10
    
    # Ratio Plays
    if display_name == "Silver" and gs_ratio > 80: score += 20 # Screaming Buy for Silver
    if display_name == "Silver" and gs_ratio < 60: score -= 10
    
    if display_name in ["Copper", "Crude Oil"] and "Rising" in tip_trend: score += 10 # Growth context
    
    # Technical Trend
    if signals.get("price", 0) > signals.get("sma_50", 0): score += 10
    if signals.get("rsi", 50) > 70: score -= 10 # Overbought
    if signals.get("rsi", 50) < 30: score += 10 # Oversold

    # Cap Score
    score = max(0, min(100, score))
    
    veteran_metrics = {
        "score": score,
        "dxy_level": round(dxy_val, 2),
        "move_index": round(move_val, 2),
        "real_yield_trend": tip_trend, # Rising Price = Falling Yields
        "copper_gold_ratio": round(cg_ratio, 2),
        "gold_silver_ratio": round(gs_ratio, 2),
        "baltic_dry": round(bdry_val, 2),
        "carbon_credits": round(macro_data["Carbon Credits"]["Close"].iloc[-1], 2) if macro_data["Carbon Credits"] is not None else 0
    }

    # Macro Context for AI (Enhanced)
    macro_context = {
        "dxy_correlation": "N/A", # Keep existing if needed or recalculate
        "inflation_outlook": "High" if macro_data["10Y Yield"] is not None and macro_data["10Y Yield"]['Close'].iloc[-1] > 4.0 else "Moderate",
        "veteran_data": veteran_metrics,
        "market_regime": "Risk-On" if move_val < 100 and dxy_val < 100 else "Risk-Off"
    }

    # Calculate Correlations (Legacy support + extra)
    if macro_data["USD Index"] is not None:
        common_idx = df.index.intersection(macro_data["USD Index"].index)
        if len(common_idx) > 20:
            corr = df.loc[common_idx, "Close"].tail(60).corr(macro_data["USD Index"].loc[common_idx, "Close"].tail(60))
            macro_context["dxy_correlation"] = f"{corr:.2f}"

    # AI Analysis
    strategy = await asyncio.to_thread(analyze_commodity_strategy, display_name, signals, macro_context, news)
    
    # Format Chart Data
    chart_df = df.reset_index().tail(150)
    chart_df['time'] = chart_df['Date'].dt.strftime('%Y-%m-%d')
    chart_df.rename(columns={'Open': 'open', 'High': 'high', 'Low': 'low', 'Close': 'close', 'Volume': 'value'}, inplace=True)
    chart_data = chart_df.replace({np.nan: None}).to_dict(orient="records")
    
    # Inject Score into Strategy Verdict if needed, or just pass it alongside
    strategy["relevance_score"] = score # Override AI score with Veteran Math Score for consistency

    return {
        "id": commodity_id,
        "name": display_name,
        "ticker": ticker,
        "price": signals.get("close"),
        "technicals": signals,
        "strategy": strategy,
        "chart_data": chart_data,
        "macro_context": macro_context,
        "veteran_metrics": veteran_metrics # Send to frontend
    }

def get_commodity_list():
    return [{"id": k, "name": v["name"]} for k, v in COMMODITY_MAP.items()]