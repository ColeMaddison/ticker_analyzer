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

        # Quality Metrics
        fcf = info.get("freeCashflow")
        mkt_cap = info.get("marketCap")
        fcf_yield = (fcf / mkt_cap) if (fcf is not None and mkt_cap) else None

        # Altman Z-Score Components (Simplified approximation)
        # Only valid for non-financial companies
        z_score = None
        if info.get("sector") != "Financial Services":
            try:
                total_assets = info.get("totalAssets")
                if total_assets and total_assets > 0:
                    ebit = info.get("ebitda") or info.get("operatingCashflow") or 0
                    sales = info.get("totalRevenue") or 0
                    liabilities = info.get("totalDebt") or (total_assets * 0.5) # Fallback
                    # Simplified Z-Score (3-factor proxy)
                    z_score = (3.3 * ebit / total_assets) + (sales / total_assets) + (0.6 * mkt_cap / liabilities)
            except: 
                z_score = None

        return {
            "symbol": ticker_symbol,
            "current_price": info.get("currentPrice") or info.get("regularMarketPrice"),
            "previous_close": info.get("previousClose") or info.get("regularMarketPreviousClose"),
            "sector": info.get("sector", "Unknown"),
            "pe_ratio": info.get("trailingPE"),
            "forward_pe": info.get("forwardPE"),
            "peg_ratio": info.get("pegRatio"),
            "market_cap": mkt_cap,
            "recommendation": rec,
            "target_mean_price": info.get("targetMeanPrice"),
            "target_low_price": info.get("targetLowPrice"),
            "target_high_price": info.get("targetHighPrice"),
            "volume": info.get("volume") or info.get("regularMarketVolume"),
            "average_volume": info.get("averageVolume"),
            # Hedge Fund Metrics
            "institutions_percent": info.get("heldPercentInstitutions"),
            "insiders_percent": info.get("heldPercentInsiders"),
            "short_ratio": info.get("shortRatio"),
            "short_percent": info.get("shortPercentOfFloat"),
            "insider_buying_cluster": fetch_insider_cluster(ticker_symbol),
            # Quality Engine Data
            "fcf_yield": fcf_yield,
            "gross_margins": info.get("grossMargins"),
            "altman_z": z_score,
            "surprises": fetch_earnings_history(ticker_symbol),
            # Edge Engine Data
            "vix_level": fetch_vix_level(),
            "sector_rotation": fetch_sector_rotation(info.get("sector", "Unknown")),
            "news_velocity": len(fetch_news(ticker_symbol, limit=20)) / 24 # Mock velocity: items per hour window
        }
    except Exception as e:
        print(f"Error fetching company info: {e}")
        return {}

def fetch_vix_level():
    try:
        vix = yf.Ticker("^VIX").history(period="1d")["Close"].iloc[-1]
        return round(float(vix), 2)
    except: return 20.0

def fetch_sector_rotation(sector_name):
    """Determines if sector is Leading, Improving, Lagging, or Weakening."""
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

def fetch_earnings_history(symbol):
    """Fetches last 4 quarters of EPS surprise data."""
    try:
        t = yf.Ticker(symbol)
        df = t.earnings_dates
        if df is None or df.empty: return []
        df = df.dropna(subset=['Actual', 'EPS Estimate']).head(4)
        history = []
        for _, row in df.iterrows():
            history.append({
                "date": str(row.name.date()),
                "actual": float(row['Actual']),
                "estimate": float(row['EPS Estimate']),
                "surprise": float(row['Surprise(%)']) if 'Surprise(%)' in row else 0
            })
        return history
    except: return []

def fetch_insider_cluster(ticker_symbol):
    """
    Checks for open market buys by multiple insiders in the last 90 days.
    """
    try:
        ticker = yf.Ticker(ticker_symbol)
        trans = ticker.insider_transactions
        if trans is None or trans.empty:
            return False
        purchases = trans[trans['Text'].str.contains('Purchase', case=False, na=False)]
        if purchases.empty:
            return False
        unique_insiders = purchases['Insider'].nunique()
        return unique_insiders >= 2
    except:
        return False

from datetime import datetime

def parse_date(date_str):
    """Helper to format dates nicely."""
    try:
        if not date_str: return ""
        dt = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        return dt.strftime('%Y-%m-%d')
    except:
        return ""

def fetch_news(ticker_symbol, limit=10):
    """
    Fetches news headlines from yfinance and DuckDuckGo.
    """
    news_items = []
    try:
        ticker = yf.Ticker(ticker_symbol)
        yf_news = ticker.news
        if yf_news:
            for item in yf_news[:5]:
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
    unique_news.sort(reverse=True)
    return unique_news[:limit]

def fetch_analyst_actions(ticker_symbol):
    """
    Fetches analyst upgrades/downgrades for the last 60 days.
    """
    try:
        ticker = yf.Ticker(ticker_symbol)
        upgrades = ticker.upgrades_downgrades
        if upgrades is None or upgrades.empty:
            return []
        cutoff_date = pd.Timestamp.now() - pd.Timedelta(days=60)
        recent = upgrades[upgrades.index > cutoff_date].copy()
        if recent.empty:
            return []
        actions = []
        recent = recent.sort_index(ascending=False)
        for date, row in recent.iterrows():
            actions.append({
                "date": date.strftime('%Y-%m-%d'),
                "firm": row['Firm'],
                "to_grade": row['ToGrade'],
                "action": row['Action']
            })
        return actions
    except Exception as e:
        print(f"Error fetching analyst actions: {e}")
        return []

def fetch_social_news(ticker_symbol, limit=5):
    """
    Fetches recent discussions from Reddit, X/Twitter, and Financial Forums.
    """
    social_items = []
    REQUIRED_KEYWORDS = {'stock', 'market', 'trade', 'trading', 'invest', 'price', 'share', 'dividend', 'earnings', 'valuation', 'puts', 'calls'}
    BANNED_KEYWORDS = {'music', 'song', 'lyrics', 'game', 'download', 'crack', 'torrent', 'movie', 'football', 'league', 'serial'}

    def is_relevant(text):
        text = text.lower()
        if not any(k in text for k in REQUIRED_KEYWORDS):
            return False
        if any(b in text for b in BANNED_KEYWORDS):
            return False
        return True

    def safe_search(query, max_retries=2):
        for attempt in range(max_retries):
            try:
                with DDGS() as ddgs:
                    return list(ddgs.text(keywords=query, max_results=10))
            except Exception:
                import time
                time.sleep(1)
        return []
    
    results = safe_search(f"{ticker_symbol} stock discussion site:reddit.com")
    for res in results:
        title = res.get('title', '')
        body = res.get('body', '')
        if is_relevant(f"{title} {body}"):
            social_items.append(f"[Reddit] {title}: {body[:150]}...")

    if len(social_items) < limit:
        forum_query = f"{ticker_symbol} stock buy sell hold site:seekingalpha.com OR site:fool.com OR site:investorplace.com"
        results = safe_search(forum_query)
        for res in results:
            title = res.get('title', '')
            body = res.get('body', '')
            if is_relevant(f"{title} {body}"):
                source = "FinancialWeb"
                if "seekingalpha" in res.get('href', ''): source = "SeekingAlpha"
                elif "fool" in res.get('href', ''): source = "MotleyFool"
                social_items.append(f"[{source}] {title}: {body[:150]}...")

    unique_items = list(set(social_items))
    return unique_items[:limit]

def fetch_options_sentiment(ticker_symbol):
    """
    Fetches the nearest expiration option chain to calculate Put/Call Ratio.
    """
    try:
        ticker = yf.Ticker(ticker_symbol)
        dates = ticker.options
        if not dates:
            return None
        chain = ticker.option_chain(dates[0])
        call_vol = chain.calls['volume'].fillna(0).sum()
        put_vol = chain.puts['volume'].fillna(0).sum()
        pcr = put_vol / call_vol if call_vol > 0 else 1.0
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
    """
    data = []
    for t in tickers:
        try:
            info = yf.Ticker(t).info
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