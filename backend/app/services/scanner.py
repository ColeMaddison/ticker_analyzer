import pandas as pd
from finvizfinance.screener.custom import Custom
from finvizfinance.screener.overview import Overview
import finvizfinance.constants as constants

# MANUALLY INJECT missing signal into the library's constant dictionary
if 'Volatility Squeeze' not in constants.signal_dict:
    constants.signal_dict['Volatility Squeeze'] = 'ta_volatilitysqueeze'

def get_sp500_tickers():
    """Placeholder."""
    return ["SPY"]

def scan_market(signal=None):
    """
    ULTRA-FAST MANUAL PAGINATING SCANNER.
    Iterates through Finviz pages to ensure all 500+ S&P companies 
    are fetched with correct technical and fundamental columns.
    """
    try:
        # Map frontend signals to Finviz signal keys
        internal_signal = ""
        filters_dict = {'Index': 'S&P 500'} # Default to S&P 500

        if signal == 'Vol. Squeeze':
            internal_signal = 'Volatility Squeeze'
        elif signal == 'ROCKET':
            internal_signal = 'Top Gainers'
            # REMOVE S&P 500 filter for Rockets. Target Small Caps + Liquidity
            filters_dict = {
                'Market Cap.': '-Small (under $2bln)',
                'Average Volume': 'Over 100K'
            }
        elif signal:
            internal_signal = signal

        print(f"Starting Scan... Signal: {internal_signal}, Filters: {filters_dict}")
        
        # 1. Configuration
        all_frames = []
        fcustom = Custom()
        
        # Apply filters and the requested signal
        fcustom.set_filter(filters_dict=filters_dict, signal=internal_signal)
        
        # Correct Column Indices from finvizfinance metadata:
        # 1: Ticker, 6: Market Cap, 62: Analyst Recom, 59: RSI, 64: Rel Vol, 65: Price, 69: Target Price
        custom_cols = [1, 6, 62, 59, 64, 65, 69]
        
        # 2. Manual Pagination Loop
        # S&P 500 is ~503 companies. at 20 per page = 26 pages.
        print(f"Fetching pages for signal: {internal_signal}...")
        for page in range(1, 27):
            try:
                # select_page returns 20 rows for that specific page
                df_page = fcustom.screener_view(select_page=page, columns=custom_cols, verbose=0)
                if df_page is not None and not df_page.empty:
                    all_frames.append(df_page)
                    # If we got fewer than 20 rows, it's the last page
                    if len(df_page) < 20:
                        break
                else:
                    break
            except Exception as e:
                print(f"Error on page {page}: {e}")
                break 

        if not all_frames:
            print("Scanner Error: No data returned from Finviz.")
            return pd.DataFrame()

        df = pd.concat(all_frames, ignore_index=True)
        print(f"Data retrieved. Count: {len(df)}")

        # 3. Robust Column Mapping & Filtering
        results = []
        for _, row in df.iterrows():
            try:
                def p(val):
                    if val is None or val == '-' or str(val).strip() == '': return 0
                    try:
                        if isinstance(val, (int, float)): return float(val)
                        clean_val = str(val).replace('%', '').replace('B', 'e9').replace('M', 'e6').replace('K', 'e3').replace('$', '').replace(',', '')
                        return float(clean_val)
                    except: return 0

                ticker = str(row.get('Ticker', 'N/A'))
                mkt_cap = p(row.get('Market Cap', 0))
                
                # Double-Check Filters (Backend Enforcement)
                # If ROCKET mode, ensure Small Cap (<2B)
                if signal == 'ROCKET' and mkt_cap > 2.5e9: 
                    continue # Skip leakages (like TSLA)

                recom = p(row.get('Recom', 3.0))
                rsi = p(row.get('RSI', 0))
                rel_vol = p(row.get('Rel Volume', 1.0))
                price = p(row.get('Price', 0))
                target = p(row.get('Target Price', 0))
                
                # Sanity Check for Bad Data
                if price < 0.1 and mkt_cap > 1e9:
                     # Price likely missing or zero, try to use Target/Upside to infer? No, just skip or keep.
                     pass

                upside = ((target / price) - 1) * 100 if target > 0 and price > 0 else 0

                # Veteran Verdict Logic (Aligned with Analyzer)
                verdict = "WATCH"
                if recom > 0:
                    if recom <= 1.5 and rsi < 70: verdict = "STRONG BUY"
                    elif recom <= 2.5 and rsi < 75: verdict = "BUY"
                    elif recom > 4.0 or rsi > 80: verdict = "AVOID"

                # Identify Squeeze:
                # If we applied the signal, everything is a squeeze.
                # If NOT, we use a proxy: Very low RSI + Low Volume usually precedes a breakout squeeze
                is_sqz = (internal_signal == 'Volatility Squeeze') or (rsi < 35 and rel_vol < 0.8)

                results.append({
                    "Ticker": ticker,
                    "Price": price,
                    "RSI": rsi,
                    "Rel Vol": rel_vol,
                    "Recommendation": verdict,
                    "Upside %": round(float(upside), 1),
                    "Market Cap": mkt_cap,
                    "is_squeeze": is_sqz
                })
            except Exception as e:
                print(f"Row error: {e}")
                continue

        final_df = pd.DataFrame(results)
        final_df.drop_duplicates(subset=['Ticker'], inplace=True)
        final_df.sort_values(by="Market Cap", ascending=False, inplace=True)
        final_df.reset_index(drop=True, inplace=True)
        final_df['Rank'] = final_df.index + 1
        
        return final_df
    except Exception as e:
        print(f"Screener Critical Error: {e}")
        return pd.DataFrame()
