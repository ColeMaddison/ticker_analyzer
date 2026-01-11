import pandas as pd
from finvizfinance.screener.custom import Custom
from finvizfinance.screener.overview import Overview
from finvizfinance.constants import signal_dict

# Manually inject the missing Volatility Squeeze signal
if 'Volatility Squeeze' not in signal_dict:
    signal_dict['Volatility Squeeze'] = 'ta_volatilitysqueeze'

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
        if signal == 'Vol. Squeeze':
            internal_signal = 'Volatility Squeeze'
        elif signal:
            internal_signal = signal

        print(f"Starting Manual S&P 500 Index Scan (Signal: {internal_signal})...")
        
        # 1. Configuration
        all_frames = []
        fcustom = Custom()
        
        # Apply S&P 500 filter and the requested signal
        fcustom.set_filter(filters_dict={'Index': 'S&P 500'}, signal=internal_signal)
        
        # Correct Column Indices from finvizfinance metadata:
        # 1: Ticker, 6: Market Cap, 62: Analyst Recom, 59: RSI, 64: Rel Vol, 65: Price, 69: Target Price
        custom_cols = [1, 6, 62, 59, 64, 65, 69]
        
        # 2. Manual Pagination Loop
        # S&P 500 is ~503 companies. at 20 per page = 26 pages.
        # If a signal is applied, there will be fewer pages.
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
                break # Stop if we hit an error to avoid infinite loops

        if not all_frames:
            print("Scanner Error: No data returned from Finviz.")
            return pd.DataFrame()

        df = pd.concat(all_frames, ignore_index=True)
        print(f"Data retrieved. Count: {len(df)}")

        # 3. Robust Column Mapping
        # We map by name first, which is the most reliable method
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

                # Finviz Custom view returns these columns consistently
                # We use .get() with the exact names we verified in debug
                ticker = str(row.get('Ticker', 'N/A'))
                mkt_cap = p(row.get('Market Cap', 0))
                recom = p(row.get('Recom', 3.0))
                rsi = p(row.get('RSI', 0))
                rel_vol = p(row.get('Rel Volume', 1.0))
                price = p(row.get('Price', 0))
                target = p(row.get('Target Price', 0))
                
                upside = ((target / price) - 1) * 100 if target > 0 and price > 0 else 0

                # Map Numeric Rec (1.0-5.0) to Text
                rec_text = "Hold"
                if recom > 0:
                    if recom <= 1.5: rec_text = "Strong Buy"
                    elif recom <= 2.5: rec_text = "Buy"
                    elif recom > 3.5: rec_text = "Sell"

                results.append({
                    "Ticker": ticker,
                    "Price": price,
                    "RSI": rsi,
                    "Rel Vol": rel_vol,
                    "Recommendation": rec_text,
                    "Upside %": round(float(upside), 1),
                    "Market Cap": mkt_cap,
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
