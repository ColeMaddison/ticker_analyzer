import pandas as pd
import yfinance as yf
import ta
import requests
import time
import random
from io import StringIO
from concurrent.futures import ThreadPoolExecutor

def retry_with_backoff(fn, *args, retries=3, backoff_in_seconds=2, **kwargs):
    """Retries a function with exponential backoff and jitter."""
    for i in range(retries):
        try:
            return fn(*args, **kwargs)
        except Exception as e:
            if i == retries - 1:
                print(f"Final attempt failed: {e}")
                raise
            # Add jitter to avoid synchronized retries
            sleep_time = (backoff_in_seconds * (2 ** i)) + random.uniform(0, 1)
            print(f"Attempt {i+1} failed. Retrying in {sleep_time:.2f}s... Error: {e}")
            time.sleep(sleep_time)

def get_sp500_tickers():
    """Fetches the S&P 500 ticker list from Wikipedia with proper headers."""
    try:
        url = "https://en.wikipedia.org/wiki/List_of_S%26P_500_companies"
        headers = {"User-Agent": "Mozilla/5.0"}
        response = requests.get(url, headers=headers)
        df = pd.read_html(StringIO(response.text))[0]
        tickers = [t.replace('.', '-') for t in df['Symbol'].tolist()]
        return tickers
    except Exception as e:
        print(f"Error fetching S&P 500 list: {e}")
        return []

def fetch_single_ticker_info(t):
    """Helper for multi-threaded info fetching with retry."""
    try:
        ticker = yf.Ticker(t)
        # Use retry wrapper for brittle .info property
        try:
            info = retry_with_backoff(lambda: ticker.info, retries=2, backoff_in_seconds=1)
        except:
            info = {}
            
        return {
            "Ticker": t,
            "Recommendation": info.get("recommendationKey", "hold"),
            "Target Upside": round(((info.get("targetMeanPrice", 0) / info.get("currentPrice", 1)) - 1) * 100, 1) if info.get("targetMeanPrice") and info.get("currentPrice") else 0,
            "Market Cap": info.get("marketCap", 0)
        }
    except:
        return {"Ticker": t, "Recommendation": "none", "Target Upside": 0, "Market Cap": 0}

def scan_market(tickers):
    """Batches fetch data and calculates metrics with retry/backoff."""
    default_cols = ["Rank", "Ticker", "Price", "RSI", "Rel Vol", "Recommendation", "Upside %", "Market Cap"]
    if not tickers:
        return pd.DataFrame(columns=default_cols)

    batch_size = 40 # Slightly smaller batch for better stability
    all_data = pd.DataFrame()
    
    print(f"Starting batched download for {len(tickers)} tickers...")
    
    for i in range(0, len(tickers), batch_size):
        batch = tickers[i:i + batch_size]
        try:
            # yfinance 0.2.50+ prefers threads=False when using curl_cffi sessions
            batch_data = retry_with_backoff(
                yf.download, 
                batch, 
                period="6mo", 
                group_by='ticker', 
                progress=False, 
                threads=False,
                auto_adjust=True,
                retries=2
            )
            if batch_data is not None and not batch_data.empty:
                all_data = pd.concat([all_data, batch_data], axis=1) if not all_data.empty else batch_data
        except Exception as e:
            print(f"Batch {i//batch_size} failed: {e}")
            continue

    if all_data.empty:
        print("Error: All batches failed to download.")
        return pd.DataFrame(columns=default_cols)

    # 2. Multi-threaded Info Fetch
    # Use fewer workers to avoid triggering Yahoo's anti-scraping
    with ThreadPoolExecutor(max_workers=10) as executor:
        info_results = list(executor.map(fetch_single_ticker_info, tickers[:len(all_data.columns.levels[0]) if isinstance(all_data.columns, pd.MultiIndex) else 100]))
    
    info_map = {res['Ticker']: res for res in info_results}

    results = []
    # Logic to handle different yfinance output structures
    if isinstance(all_data.columns, pd.MultiIndex):
        available_tickers = all_data.columns.levels[0]
    else:
        available_tickers = [tickers[0]]

    for t in available_tickers:
        try:
            if isinstance(all_data.columns, pd.MultiIndex):
                if t not in all_data.columns: continue
                df_t = all_data[t].copy()
            else:
                df_t = all_data.copy()
                
            df_t.dropna(subset=['Close'], inplace=True)
            if len(df_t) < 20: continue

            # Technicals
            last_close = df_t['Close'].iloc[-1]
            rsi_series = ta.momentum.rsi(df_t['Close'])
            rsi = rsi_series.iloc[-1] if not rsi_series.empty else 50
            
            avg_vol = df_t['Volume'].rolling(window=20).mean().iloc[-1]
            rel_vol = df_t['Volume'].iloc[-1] / avg_vol if avg_vol > 0 else 1.0
            
            # Fundamental Info
            t_info = info_map.get(t, {"Recommendation": "hold", "Target Upside": 0, "Market Cap": 0})

            results.append({
                "Ticker": t,
                "Price": round(float(last_close), 2),
                "RSI": round(float(rsi), 1),
                "Rel Vol": round(float(rel_vol), 2),
                "Recommendation": str(t_info.get('Recommendation', 'hold')).replace('_', ' ').title(),
                "Upside %": t_info.get('Target Upside', 0),
                "Market Cap": t_info.get('Market Cap', 0)
            })
        except:
            continue
            
    if not results:
        return pd.DataFrame(columns=default_cols)
            
    df = pd.DataFrame(results)
    # Filter out any that completely failed to get a Market Cap (likely data errors)
    # but keep them if we have at least Price and RSI
    df.sort_values(by="Market Cap", ascending=False, inplace=True)
    df.reset_index(drop=True, inplace=True)
    df['Rank'] = df.index + 1
    
    return df