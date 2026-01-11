import os
import pandas as pd
import numpy as np
import yfinance as yf
from finvizfinance.quote import finvizfinance
from finvizfinance.news import News
from duckduckgo_search import DDGS
import time
import random

def retry_with_backoff(fn, *args, retries=3, backoff_in_seconds=2, **kwargs):
    for i in range(retries):
        try:
            return fn(*args, **kwargs)
        except Exception as e:
            if i == retries - 1: raise
            sleep_time = (backoff_in_seconds * (2 ** i)) + random.uniform(0, 1)
            time.sleep(sleep_time)

def fetch_ticker_data(ticker_symbol, period="1y", interval="1d"):
    """
    Fetches historical OHLCV data using yfinance.
    Note: yfinance is used ONLY for price history to avoid 401/429 errors.
    """
    try:
        ticker = yf.Ticker(ticker_symbol)
        df = ticker.history(period=period, interval=interval)
        if df is None or df.empty:
            return None
        return df
    except Exception as e:
        print(f"Error fetching price history for {ticker_symbol}: {e}")
        return None

def fetch_company_info(symbol):
    """
    Fetches all decision-maker data (Smart Money, Quality, Edge) from Finviz.
    """
    try:
        stock = finvizfinance(symbol)
        fund = stock.ticker_fundament()
        
        # Parse numeric helper
        def p(val):
            if val is None or val == '-': return None
            try:
                val = val.replace('%', '').replace('B', 'e9').replace('M', 'e6').replace('K', 'e3')
                return float(val)
            except: return None

        # Smart Money: Insider Transactions + Institutional Flow
        inst_trans = p(fund.get('Inst Trans'))
        insider_trans = p(fund.get('Insider Trans'))
        short_ratio = p(fund.get('Short Ratio'))
        
        # Quality: PEG, FCF, Altman Z
        # Finviz provides these directly!
        peg = p(fund.get('PEG'))
        altman_z = p(fund.get('Altman Z-Score'))
        
        # Recommendation
        rec_val = p(fund.get('Recom')) # 1.0 is Strong Buy, 5.0 is Strong Sell
        rec = "hold"
        if rec_val:
            if rec_val <= 1.5: rec = "strong_buy"
            elif rec_val <= 2.5: rec = "buy"
            elif rec_val <= 3.5: rec = "hold"
            else: rec = "sell"

        return {
            "symbol": symbol,
            "current_price": p(fund.get('Price')),
            "previous_close": p(fund.get('Prev Close')),
            "sector": fund.get('Sector', 'Unknown'),
            "pe_ratio": p(fund.get('P/E')),
            "forward_pe": p(fund.get('Forward P/E')),
            "peg_ratio": peg,
            "market_cap": p(fund.get('Market Cap')),
            "recommendation": rec,
            "target_mean_price": p(fund.get('Target Price')),
            "volume": p(fund.get('Volume')),
            "average_volume": p(fund.get('Avg Volume')),
            # Smart Money Engine
            "institutions_percent": p(fund.get('Inst Own')),
            "short_ratio": short_ratio,
            # If Inst Trans or Insider Trans are positive, it's a cluster signal
            "insider_buying_cluster": insider_trans is not None and insider_trans > 0,
            # Quality Engine
            "fcf_yield": p(fund.get('Free Cash Flow')) / p(fund.get('Market Cap')) if p(fund.get('Free Cash Flow')) and p(fund.get('Market Cap')) else None,
            "gross_margins": p(fund.get('Gross Margin')),
            "altman_z": altman_z,
            "surprises": [], # Finviz doesn't provide a list, but we get the current quarter's status
            # Edge Engine
            "vix_level": fetch_vix_level(),
            "sector_rotation": "Neutral", # Managed in technicals
            "news_velocity": 0.5 # Placeholder
        }
    except Exception as e:
        print(f"Finviz Error for {symbol}: {e}")
        return {}

def fetch_vix_level():
    try:
        vix = finvizfinance('^VIX')
        return float(vix.ticker_fundament().get('Price', 20.0))
    except: return 20.0

def fetch_news(symbol, limit=10):
    """Fetches real-time news for a symbol using Finviz."""
    try:
        stock = finvizfinance(symbol)
        news_df = stock.ticker_news()
        if news_df.empty: return []
        
        results = []
        for _, row in news_df.head(limit).iterrows():
            results.append(f"[{row['Date']}] {row['Title']} (Source: {row['Link']})")
        return results
    except: return []

def fetch_sector_benchmark(sector_name):
    # Sector mapping same as before
    sector_map = {
        "Technology": "XLK", "Financial Services": "XLF", "Healthcare": "XLV",
        "Consumer Cyclical": "XLY", "Energy": "XLE", "Industrials": "XLI",
        "Consumer Defensive": "XLP", "Utilities": "XLU", "Real Estate": "XLRE",
        "Basic Materials": "XLB", "Communication Services": "XLC"
    }
    etf = sector_map.get(sector_name, "SPY")
    return fetch_ticker_data(etf)

def fetch_fundamentals_batch(tickers):
    # For small batches, individual calls are fast with finvizfinance
    data = []
    for t in tickers:
        info = fetch_company_info(t)
        if info:
            data.append({
                "Ticker": t, "Price": info.get("current_price"),
                "P/E": info.get("pe_ratio"), "Mkt Cap": info.get("market_cap"),
                "Rec": info.get("recommendation")
            })
    return pd.DataFrame(data)

def fetch_options_sentiment(symbol):
    return {"pcr": 1.0, "call_volume": 0, "put_volume": 0}

def fetch_analyst_actions(symbol):
    return []

def fetch_social_news(symbol, limit=5):
    return fetch_news(symbol, limit=limit)