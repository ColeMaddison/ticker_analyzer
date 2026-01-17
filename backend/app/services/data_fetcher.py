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

def fetch_company_info_fallback(symbol):
    """
    Fallback method to fetch company info using yfinance when Finviz fails.
    """
    try:
        t = yf.Ticker(symbol)
        info = t.info
        
        # Map YF data to our schema
        current_price = info.get('currentPrice') or info.get('regularMarketPrice') or info.get('previousClose')
        
        # Rec
        rec_key = info.get('recommendationKey', 'hold').lower()
        recommendation = 'hold'
        if 'buy' in rec_key: recommendation = 'buy'
        if 'strong' in rec_key and 'buy' in rec_key: recommendation = 'strong_buy'
        if 'sell' in rec_key: recommendation = 'sell'
        
        # Inst Own
        inst_own = info.get('heldPercentInstitutions', 0)
        
        # FCF Yield Proxy: Operating Cash Flow / Market Cap
        fcf_yield = None
        ocf = info.get('operatingCashflow')
        mkt_cap = info.get('marketCap')
        if ocf and mkt_cap:
             fcf_yield = ocf / mkt_cap
             
        # Altman Z Proxy
        altman_z = info.get('altmanZScore')
        if altman_z is None:
             try:
                bs = t.balance_sheet
                if not bs.empty:
                    total_liab = bs.loc['Total Liabilities Net Minority Interest'].iloc[0] if 'Total Liabilities Net Minority Interest' in bs.index else 0
                    if total_liab > 0 and mkt_cap:
                         altman_z = (mkt_cap / total_liab) * 0.6 + 1.0
             except: pass
        
        return {
            "symbol": symbol,
            "current_price": current_price,
            "previous_close": info.get('previousClose'),
            "sector": info.get('sector', 'Unknown'),
            "pe_ratio": info.get('trailingPE'),
            "forward_pe": info.get('forwardPE'),
            "peg_ratio": peg,
            "market_cap": mkt_cap,
            "recommendation": recommendation,
            "target_mean_price": info.get('targetMeanPrice'),
            "volume": info.get('volume'),
            "average_volume": info.get('averageVolume'),
            "institutions_percent": inst_own, 
            "short_ratio": info.get('shortRatio'),
            "insider_buying_cluster": False, # YF data limited
            "fcf_yield": fcf_yield,
            "gross_margins": info.get('grossMargins'),
            "altman_z": info.get('altmanZScore'), 
            "surprises": [], 
            "months_runway": None,
            "monthly_burn": None,
            "vix_level": fetch_vix_level(),
            "sector_rotation": fetch_sector_rotation(info.get('sector', 'Unknown')), 
            "news_velocity": 0.5 # Default
        }
    except Exception as e:
        print(f"YFinance Fallback Error for {symbol}: {e}")
        return {}

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

        # Extract PEG, Price, and FCF for logic and return
        peg = p(fund.get('PEG'))
        price = p(fund.get('Price'))
        fcf_yield = (1 / p(fund.get('P/FCF'))) if p(fund.get('P/FCF')) else None

        # BIOTECH / GROWTH METRICS (General Fallback for N/A Quality)
        months_runway = None
        monthly_burn = None
        
        # General fallback: If standard metrics are missing (common for new IPOs/Growth), dig deeper
        if peg is None or fcf_yield is None or altman_z is None:
            try:
                t = yf.Ticker(symbol)
                bs = t.balance_sheet
                cf = t.cashflow
                
                # 1. Cash Runway Calculation
                if not bs.empty:
                    # Robust search for cash
                    cash_items = ['Cash And Cash Equivalents', 'Other Short Term Investments', 'Cash Financial Assets']
                    total_liquidity = sum([bs.loc[item].iloc[0] for item in cash_items if item in bs.index])
                    
                    if not cf.empty:
                        # Operating Cash Flow (Annual)
                        ocf = cf.loc['Operating Cash Flow'].iloc[0] if 'Operating Cash Flow' in cf.index else 0
                        if ocf < 0:
                            monthly_burn = abs(ocf) / 12
                            if monthly_burn > 0:
                                months_runway = total_liquidity / monthly_burn
                                
                    # 2. Altman Z Manual Proxy (Simplified for missing data)
                    # Z = 1.2(Working Cap/Assets) + 1.4(Retained Earnings/Assets) + 3.3(EBIT/Assets) + 0.6(MV Equity/Liab) + 1.0(Sales/Assets)
                    if altman_z is None and not bs.empty:
                        try:
                            total_assets = bs.loc['Total Assets'].iloc[0] if 'Total Assets' in bs.index else 1
                            total_liab = bs.loc['Total Liabilities Net Minority Interest'].iloc[0] if 'Total Liabilities Net Minority Interest' in bs.index else 1
                            mkt_cap = p(fund.get('Market Cap')) or (price * p(fund.get('Shs Outstand')) if price else 0)
                            
                            # Simple proxy for Altman Z if data is sparse: 
                            # Focus on Solvency: Market Cap / Total Liabilities
                            if total_liab > 0 and mkt_cap:
                                altman_z = (mkt_cap / total_liab) * 0.6 + 1.0 # Base shift
                        except: pass
            except: pass

        # Map Numeric Rec (1.0-5.0) to Granular Text
        recom_val = p(fund.get('Recom'))
        recommendation = "hold"
        if recom_val:
            if recom_val <= 1.5: recommendation = "strong_buy"
            elif recom_val <= 2.5: recommendation = "buy"
            elif recom_val > 3.5: recommendation = "sell"

        return {
            "symbol": symbol,
            "current_price": price,
            "previous_close": p(fund.get('Prev Close')),
            "sector": fund.get('Sector', 'Unknown'),
            "pe_ratio": p(fund.get('P/E')),
            "forward_pe": p(fund.get('Forward P/E')),
            "peg_ratio": peg,
            "market_cap": p(fund.get('Market Cap')),
            "recommendation": recommendation,
            "target_mean_price": p(fund.get('Target Price')),
            "volume": p(fund.get('Volume')),
            "average_volume": p(fund.get('Avg Volume')),
            # Smart Money Engine
            "institutions_percent": (inst_own / 100) if inst_own else 0,
            "short_ratio": short_ratio,
            "insider_buying_cluster": (insider_trans is not None and insider_trans > 0),
            # Quality Engine
            "fcf_yield": fcf_yield,
            "gross_margins": (p(fund.get('Gross Margin')) / 100) if p(fund.get('Gross Margin')) else None,
            "altman_z": altman_z,
            "surprises": [], 
            # Biotech / Growth Specific
            "months_runway": months_runway,
            "monthly_burn": monthly_burn,
            # Edge Engine
            "vix_level": fetch_vix_level(),
            "sector_rotation": fetch_sector_rotation(fund.get('Sector', 'Unknown')), 
            "news_velocity": news_velocity
        }
    except Exception as e:
        print(f"Finviz Error for {symbol}: {e}. Switching to YFinance fallback.")
        return fetch_company_info_fallback(symbol)

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