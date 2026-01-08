import yfinance as yf
import pandas as pd
from duckduckgo_search import DDGS

def fetch_ticker_data(ticker_symbol, period="6mo", interval="1d"):
    """
    Fetches historical OHLCV data for the given ticker.
    """
    try:
        ticker = yf.Ticker(ticker_symbol)
        df = ticker.history(period=period, interval=interval)
        if df.empty:
            return None
        return df
    except Exception as e:
        print(f"Error fetching ticker data: {e}")
        return None

def fetch_sector_benchmark(sector_name):
    """
    Maps sector names to standard SPDR ETFs for benchmarking.
    """
    sector_map = {
        "Technology": "XLK",
        "Financial Services": "XLF",
        "Healthcare": "XLV",
        "Consumer Cyclical": "XLY",
        "Energy": "XLE",
        "Industrials": "XLI",
        "Consumer Defensive": "XLP",
        "Utilities": "XLU",
        "Real Estate": "XLRE",
        "Basic Materials": "XLB",
        "Communication Services": "XLC"
    }
    etf = sector_map.get(sector_name, "SPY") # Fallback to SPY
    return fetch_ticker_data(etf, period="6mo")

def fetch_company_info(ticker_symbol):
    """
    Fetches fundamental data like P/E, Sector, Recommendations.
    """
    try:
        ticker = yf.Ticker(ticker_symbol)
        info = ticker.info
        
        # Robust recommendation extraction
        # Try string key first, then numeric mean, then fallback to "neutral"
        rec = info.get("recommendationKey")
        if not rec or rec == "none":
            rec_mean = info.get("recommendationMean")
            if rec_mean:
                if rec_mean <= 1.5: rec = "strong_buy"
                elif rec_mean <= 2.5: rec = "buy"
                elif rec_mean <= 3.5: rec = "hold"
                elif rec_mean <= 4.5: rec = "sell"
                else: rec = "strong_sell"
            else:
                rec = "hold"

        return {
            "symbol": ticker_symbol,
            "current_price": info.get("currentPrice") or info.get("regularMarketPrice"),
            "previous_close": info.get("previousClose") or info.get("regularMarketPreviousClose"),
            "sector": info.get("sector", "Unknown"),
            "pe_ratio": info.get("trailingPE"),
            "forward_pe": info.get("forwardPE"),
            "peg_ratio": info.get("pegRatio"),
            "market_cap": info.get("marketCap"),
            "recommendation": rec,
            "target_mean_price": info.get("targetMeanPrice"),
            "target_low_price": info.get("targetLowPrice"),
            "target_high_price": info.get("targetHighPrice"),
            "volume": info.get("volume") or info.get("regularMarketVolume"),
            "average_volume": info.get("averageVolume"),
            # Hedge Fund Metrics
            "institutions_percent": info.get("heldPercentInstitutions"),
            "insiders_percent": info.get("heldPercentInsiders"),
            "short_ratio": info.get("shortRatio"), # Days to cover
            "short_percent": info.get("shortPercentOfFloat")
        }
    except Exception as e:
        print(f"Error fetching company info: {e}")
        return {}

from datetime import datetime

def parse_date(date_str):
    """Helper to format dates nicely."""
    try:
        if not date_str: return ""
        # Handle ISO format
        dt = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        return dt.strftime('%Y-%m-%d')
    except:
        return ""

def fetch_news(ticker_symbol, limit=10):
    """
    Fetches news headlines from yfinance and DuckDuckGo.
    """
    news_items = []
    
    # 1. Try yfinance news first
    try:
        ticker = yf.Ticker(ticker_symbol)
        yf_news = ticker.news
        if yf_news:
            for item in yf_news[:5]: # Take top 5 from YF
                content = item.get('content', item)
                title = content.get('title')
                pub_date = content.get('pubDate')
                
                provider = content.get('provider', {})
                publisher_name = "Yahoo Finance"
                if isinstance(provider, dict):
                    publisher_name = provider.get('displayName', 'Yahoo Finance')
                
                date_display = f"[{parse_date(pub_date)}] " if pub_date else ""
                
                if title:
                    news_items.append(f"{date_display}{title} (Source: {publisher_name})")
    except Exception as e:
        print(f"Error fetching yfinance news: {e}")

    # 2. Supplement with DuckDuckGo
    try:
        ddgs = DDGS()
        results = ddgs.news(keywords=ticker_symbol, max_results=limit)
        if results:
            for res in results:
                title = res.get('title', '')
                source = res.get('source', 'Web')
                date = res.get('date', '')
                
                date_display = f"[{parse_date(date)}] " if date else ""
                
                if title:
                    news_items.append(f"{date_display}{title} (Source: {source})")
    except Exception as e:
        print(f"Error fetching DDG news: {e}")

    unique_news = list(set(news_items))
    # Sort by date string descending if possible (simple string sort works reasonably well for YYYY-MM-DD)
    unique_news.sort(reverse=True)
    return unique_news[:limit]

def fetch_analyst_actions(ticker_symbol):
    """
    Fetches analyst upgrades/downgrades for the last 60 days.
    Returns a list of dicts.
    """
    try:
        ticker = yf.Ticker(ticker_symbol)
        upgrades = ticker.upgrades_downgrades
        
        if upgrades is None or upgrades.empty:
            return []
            
        # Filter for last 60 days
        cutoff_date = pd.Timestamp.now() - pd.Timedelta(days=60)
        recent = upgrades[upgrades.index > cutoff_date].copy()
        
        if recent.empty:
            return []
            
        # Format for display
        actions = []
        # Sort by date descending
        recent = recent.sort_index(ascending=False)
        
        for date, row in recent.iterrows():
            actions.append({
                "date": date.strftime('%Y-%m-%d'),
                "firm": row['Firm'],
                "to_grade": row['ToGrade'],
                "action": row['Action'] # up, down, main, init, reit
            })
            
        return actions
        
    except Exception as e:
        print(f"Error fetching analyst actions: {e}")
        return []

def fetch_social_news(ticker_symbol, limit=5):
    """
    Fetches recent discussions from Reddit and X/Twitter using DDGS text search.
    """
    social_items = []
    ddgs = DDGS()
    
    # Reddit Search
    try:
        query = f"{ticker_symbol} stock discussion site:reddit.com"
        results = ddgs.text(keywords=query, max_results=limit)
        for res in results:
            title = res.get('title', '')
            body = res.get('body', '')
            if title:
                social_items.append(f"[Reddit] {title}: {body[:150]}...")
    except Exception as e:
        print(f"Error fetching Reddit: {e}")

    # X/Twitter Search (Best effort via search engine)
    try:
        query = f"{ticker_symbol} stock sentiment site:x.com"
        results = ddgs.text(keywords=query, max_results=limit)
        for res in results:
            title = res.get('title', '')
            body = res.get('body', '')
            # Filter out generic login/profile pages
            if "Log in" not in title and "Sign up" not in title:
                social_items.append(f"[X/Twitter] {title}: {body[:150]}...")
    except Exception as e:
        print(f"Error fetching X: {e}")
        
    return social_items

def fetch_options_sentiment(ticker_symbol):
    """
    Fetches the nearest expiration option chain to calculate Put/Call Ratio.
    Returns dict with volume pcr, total calls, total puts.
    """
    try:
        ticker = yf.Ticker(ticker_symbol)
        dates = ticker.options
        
        if not dates:
            return None
            
        # Get nearest expiration
        chain = ticker.option_chain(dates[0])
        
        # Calculate volumes
        # Fill NaN with 0 to be safe
        call_vol = chain.calls['volume'].fillna(0).sum()
        put_vol = chain.puts['volume'].fillna(0).sum()
        
        if call_vol == 0:
            pcr = 1.0 # Neutral fallback
        else:
            pcr = put_vol / call_vol
            
        return {
            "pcr": round(pcr, 2),
            "call_volume": int(call_vol),
            "put_volume": int(put_vol),
            "expiration": dates[0]
        }
        
    except Exception as e:
        print(f"Error fetching options: {e}")
        return None

def fetch_fundamentals_batch(tickers):
    """
    Fetches key comparison metrics for a list of tickers.
    Returns a pandas DataFrame.
    """
    data = []
    for t in tickers:
        try:
            info = yf.Ticker(t).info
            # Calculate 1Y return estimate if not directly available
            # using previousClose isn't enough, we need history for performance
            # For speed, we will just use valuation metrics and current price
            
            data.append({
                "Ticker": t,
                "Price": info.get("currentPrice", 0),
                "P/E": info.get("trailingPE", None),
                "Fwd P/E": info.get("forwardPE", None),
                "PEG": info.get("pegRatio", None),
                "P/S": info.get("priceToSalesTrailing12Months", None),
                "Mkt Cap": info.get("marketCap", 0),
                "Rec": info.get("recommendationKey", "N/A").replace("_", " ").title()
            })
        except Exception as e:
            print(f"Error fetching batch {t}: {e}")
            
    return pd.DataFrame(data)
