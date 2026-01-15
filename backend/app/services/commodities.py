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
    "VIX": "^VIX"
}

async def analyze_commodity(commodity_id):
    config = COMMODITY_MAP.get(commodity_id.lower())
    if not config:
        return {"error": "Invalid commodity ID"}

    ticker = config["ticker"]
    display_name = config["name"]

    # Fetch Data in Parallel
    tasks = [
        asyncio.to_thread(fetch_ticker_data, ticker),
        asyncio.to_thread(fetch_news, ticker),
        asyncio.to_thread(fetch_ticker_data, MACRO_INDICATORS["USD Index"]),
        asyncio.to_thread(fetch_ticker_data, MACRO_INDICATORS["10Y Yield"])
    ]
    
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    df = results[0]
    news = results[1] if isinstance(results[1], list) else []
    dxy_df = results[2] if isinstance(results[2], pd.DataFrame) else None
    tnx_df = results[3] if isinstance(results[3], pd.DataFrame) else None

    if df is None or df.empty:
        return {"error": f"No data found for {display_name}"}

    # Technicals
    df = calculate_technicals(df)
    signals = get_latest_signals(df)
    
    # Macro Context Calculation
    macro_context = {
        "dxy_correlation": "N/A",
        "rate_sensitivity": "N/A",
        "inflation_outlook": "High" if isinstance(tnx_df, pd.DataFrame) and tnx_df['Close'].iloc[-1] > 4.0 else "Moderate"
    }

    if dxy_df is not None and not dxy_df.empty:
        # Calculate correlation over last 60 days
        common_idx = df.index.intersection(dxy_df.index)
        if len(common_idx) > 20:
            corr = df.loc[common_idx, "Close"].tail(60).corr(dxy_df.loc[common_idx, "Close"].tail(60))
            macro_context["dxy_correlation"] = f"{corr:.2f}"
    
    if tnx_df is not None and not tnx_df.empty:
         # Simple sensitivity: correlation with yields
        common_idx = df.index.intersection(tnx_df.index)
        if len(common_idx) > 20:
            corr = df.loc[common_idx, "Close"].tail(60).corr(tnx_df.loc[common_idx, "Close"].tail(60))
            macro_context["rate_sensitivity"] = f"{corr:.2f}"

    # AI Analysis
    strategy = await asyncio.to_thread(analyze_commodity_strategy, display_name, signals, macro_context, news)
    
    # Format Chart Data
    chart_df = df.reset_index().tail(150)
    # Ensure Date is string for JSON
    chart_df['time'] = chart_df['Date'].dt.strftime('%Y-%m-%d')
    chart_df.rename(columns={'Open': 'open', 'High': 'high', 'Low': 'low', 'Close': 'close', 'Volume': 'value'}, inplace=True)
    chart_data = chart_df.replace({np.nan: None}).to_dict(orient="records")

    return {
        "id": commodity_id,
        "name": display_name,
        "ticker": ticker,
        "price": signals.get("close"),
        "technicals": signals,
        "strategy": strategy,
        "chart_data": chart_data,
        "macro_context": macro_context
    }

def get_commodity_list():
    return [{"id": k, "name": v["name"]} for k, v in COMMODITY_MAP.items()]