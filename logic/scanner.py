import pandas as pd
import yfinance as yf
import streamlit as st
import ta
from concurrent.futures import ThreadPoolExecutor

@st.cache_data(ttl=86400)
def get_sp500_tickers():
    """Fetches the S&P 500 ticker list from Wikipedia with proper headers."""
    try:
        import requests
        url = "https://en.wikipedia.org/wiki/List_of_S%26P_500_companies"
        headers = {"User-Agent": "Mozilla/5.0"}
        response = requests.get(url, headers=headers)
        df = pd.read_html(response.text)[0]
        tickers = [t.replace('.', '-') for t in df['Symbol'].tolist()]
        return tickers
    except Exception as e:
        st.error(f"Error fetching S&P 500 list: {e}")
        return []

def fetch_single_ticker_info(t):
    """Helper for multi-threaded info fetching."""
    try:
        ticker = yf.Ticker(t)
        info = ticker.info
        return {
            "Ticker": t,
            "Recommendation": info.get("recommendationKey", "hold"),
            "Target Upside": round(((info.get("targetMeanPrice", 0) / info.get("currentPrice", 1)) - 1) * 100, 1) if info.get("targetMeanPrice") and info.get("currentPrice") else 0
        }
    except:
        return {"Ticker": t, "Recommendation": "none", "Target Upside": 0}

@st.cache_data(ttl=3600)
def scan_market(tickers):
    """Batches fetch data and calculates metrics including Recommendations."""
    default_cols = ["Ticker", "Price", "RSI", "Rel Vol", "Recommendation", "Upside %"]
    if not tickers:
        return pd.DataFrame(columns=default_cols)

    # 1. Bulk Download OHLCV (Fast)
    try:
        data = yf.download(tickers, period="6mo", group_by='ticker', progress=False, threads=True)
    except Exception as e:
        st.error(f"Bulk download failed: {e}")
        return pd.DataFrame(columns=default_cols)

    # 2. Multi-threaded Info Fetch (for Recommendations)
    # We limit to 50 threads to avoid rate limiting
    with ThreadPoolExecutor(max_workers=50) as executor:
        info_results = list(executor.map(fetch_single_ticker_info, tickers))
    
    info_map = {res['Ticker']: res for res in info_results}

    results = []
    available_tickers = data.columns.levels[0] if isinstance(data.columns, pd.MultiIndex) else [tickers[0]]

    for t in available_tickers:
        try:
            df_t = data[t].copy() if isinstance(data.columns, pd.MultiIndex) else data.copy()
            df_t.dropna(subset=['Close'], inplace=True)
            if len(df_t) < 30: continue

            # Technicals
            last_close = df_t['Close'].iloc[-1]
            rsi = ta.momentum.rsi(df_t['Close']).iloc[-1]
            avg_vol = df_t['Volume'].rolling(window=20).mean().iloc[-1]
            rel_vol = df_t['Volume'].iloc[-1] / avg_vol if avg_vol > 0 else 0
            
            # Fundamental Info (from our threaded map)
            t_info = info_map.get(t, {"Recommendation": "hold", "Target Upside": 0})

            results.append({
                "Ticker": t,
                "Price": round(float(last_close), 2),
                "RSI": round(float(rsi), 1),
                "Rel Vol": round(float(rel_vol), 2),
                "Recommendation": t_info['Recommendation'].replace('_', ' ').title(),
                "Upside %": t_info['Target Upside']
            })
        except:
            continue
            
    if not results:
        return pd.DataFrame(columns=default_cols)
            
    return pd.DataFrame(results)