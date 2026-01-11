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
    Fetches high-conviction decision data from Finviz with robust parsing.
    """
    try:
        stock = finvizfinance(symbol)
        fund = stock.ticker_fundament()
        
        # Parse numeric helper
        def p(val):
            if val is None or val == '-' or val == '': return None
            try:
                # Standardize units
                clean = str(val).replace('%', '').replace('$', '').replace(',', '')
                if 'B' in clean: return float(clean.replace('B', '')) * 1e9
                if 'M' in clean: return float(clean.replace('M', '')) * 1e6
                if 'K' in clean: return float(clean.replace('K', '')) * 1e3
                return float(clean)
            except: return None

        # Smart Money Data
        inst_own = p(fund.get('Inst Own'))
        inst_trans = p(fund.get('Inst Trans'))
        insider_trans = p(fund.get('Insider Trans'))
        short_ratio = p(fund.get('Short Ratio'))
        
        # QUALITY LOGIC: Altman Z-Score Approximation
        # Altman Z = 1.2A + 1.4B + 3.3C + 0.6D + 1.0E
        # A: (Current Assets - Current Liab) / Total Assets
        # B: Retained Earnings / Total Assets
        # C: EBIT / Total Assets
        # D: Market Cap / Total Liabilities
        # E: Sales / Total Assets
        
        altman_z = None
        try:
            # Finviz sometimes lists Altman Z-Score directly in fundamental keys
            altman_z = p(fund.get('Altman Z-Score'))
            if altman_z is None:
                # Fallback to yfinance proxy for Z-Score
                ticker = yf.Ticker(symbol)
                altman_z = ticker.info.get('altmanZScore')
        except: pass

        # EDGE LOGIC: News Velocity calculation
        news_df = stock.ticker_news()
        news_velocity = 0.1 # default
        if not news_df.empty:
            # Count headlines in the last 48 hours as a proxy for velocity
            news_velocity = len(news_df) / 48 # Items per hour

        return {
            "symbol": symbol,
            "current_price": p(fund.get('Price')),
            "previous_close": p(fund.get('Prev Close')),
            "sector": fund.get('Sector', 'Unknown'),
            "pe_ratio": p(fund.get('P/E')),
            "forward_pe": p(fund.get('Forward P/E')),
            "peg_ratio": p(fund.get('PEG')),
            "market_cap": p(fund.get('Market Cap')),
            "recommendation": "buy" if p(fund.get('Recom')) <= 2.5 else "hold",
            "target_mean_price": p(fund.get('Target Price')),
            "volume": p(fund.get('Volume')),
            "average_volume": p(fund.get('Avg Volume')),
            # Smart Money Engine
            "institutions_percent": (inst_own / 100) if inst_own else 0,
            "short_ratio": short_ratio,
            "insider_buying_cluster": (insider_trans is not None and insider_trans > 0),
            # Quality Engine
            "fcf_yield": (1 / p(fund.get('P/FCF'))) if p(fund.get('P/FCF')) else None,
            "gross_margins": (p(fund.get('Gross Margin')) / 100) if p(fund.get('Gross Margin')) else None,
            "altman_z": altman_z,
            "surprises": [], 
            # Edge Engine
            "vix_level": fetch_vix_level(),
            "sector_rotation": fetch_sector_rotation(fund.get('Sector', 'Unknown')), 
            "news_velocity": news_velocity
        }
    except Exception as e:
        print(f"Finviz Error for {symbol}: {e}")
        return {}

def fetch_vix_level():
    try:
        vix = finvizfinance('^VIX')
        return float(vix.ticker_fundament().get('Price', 20.0))
    except: return 20.0

def fetch_sector_rotation(sector_name):
    """Determines if sector is Leading, Improving, Lagging, or Weakening using yfinance."""
    try:
        sector_map = {
            "Technology": "XLK", "Financial Services": "XLF", "Healthcare": "XLV",
            "Consumer Cyclical": "XLY", "Energy": "XLE", "Industrials": "XLI",
            "Consumer Defensive": "XLP", "Utilities": "XLU", "Real Estate": "XLRE",
            "Basic Materials": "XLB", "Communication Services": "XLC"
        }
        etf = sector_map.get(sector_name)
        if not etf: return "Neutral"
        
        # Compare 1mo return of ETF vs SPY
        s_data = yf.Ticker(etf).history(period="1mo")["Close"]
        m_data = yf.Ticker("SPY").history(period="1mo")["Close"]
        
        s_ret = (s_data.iloc[-1] / s_data.iloc[0]) - 1
        m_ret = (m_data.iloc[-1] / m_data.iloc[0]) - 1
        
        if s_ret > m_ret and s_ret > 0: return "Leading"
        if s_ret > m_ret and s_ret < 0: return "Improving"
        if s_ret < m_ret and s_ret > 0: return "Weakening"
        return "Lagging"
    except: return "Neutral"

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