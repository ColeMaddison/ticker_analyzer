import pandas as pd
from finvizfinance.screener.custom import Custom
from finvizfinance.screener.overview import Overview

def get_sp500_tickers():
    """Placeholder."""
    return ["SPY"]

def scan_market(tickers=None):
    """
    MANUAL PAGINATING SCANNER.
    Iterates through Finviz pages to ensure all 500+ S&P companies 
    are fetched with correct technical and fundamental columns.
    """
    try:
        print("Starting Manual S&P 500 Index Scan...")
        
        # 1. Configuration
        all_frames = []
        fcustom = Custom()
        fcustom.set_filter(filters_dict={'Index': 'S&P 500'})
        
        # Correct Column Indices from finvizfinance.screener.util.get_custom_screener_columns():
        # 1: Ticker, 6: Market Cap, 62: Analyst Recom, 59: RSI, 64: Rel Vol, 65: Price, 69: Target Price
        custom_cols = [1, 6, 62, 59, 64, 65, 69]
        
        # 2. Manual Pagination Loop
        # S&P 500 is ~503 companies. at 20 per page = 26 pages.
        print("Fetching 26 pages from Finviz...")
        for page in range(1, 27):
            try:
                # select_page returns 20 rows for that specific page
                df_page = fcustom.screener_view(select_page=page, columns=custom_cols, verbose=0)
                if df_page is not None and not df_page.empty:
                    all_frames.append(df_page)
                else:
                    break
            except Exception as e:
                print(f"Error on page {page}: {e}")
                continue

        if not all_frames:
            print("Scanner Error: No data returned from Finviz.")
            return pd.DataFrame()

        df = pd.concat(all_frames, ignore_index=True)
        print(f"Data retrieved. Columns: {df.columns.tolist()}. Count: {len(df)}")

        # 3. Robust Column Mapping
        cols = df.columns.tolist()
        def find_col(keywords):
            for c in cols:
                if any(k.lower() in c.lower() for k in keywords):
                    return c
            return None

        ticker_col = find_col(["Ticker"])
        price_col = find_col(["Price"])
        rsi_col = find_col(["RSI"])
        vol_col = find_col(["Relative Volume", "Rel Vol"])
        rec_col = find_col(["Recommendation", "Recom"])
        target_col = find_col(["Target Price", "Target"])
        cap_col = find_col(["Market Cap"])

        # 4. Parsing and Formatting
        results = []
        for _, row in df.iterrows():
            try:
                def p(val):
                    if val is None or val == '-': return 0
                    try:
                        if isinstance(val, (int, float)): return float(val)
                        clean_val = str(val).replace('%', '').replace('B', 'e9').replace('M', 'e6').replace('K', 'e3').replace('$', '').replace(',', '')
                        return float(clean_val)
                    except: return 0

                price = p(row.get(price_col, 0))
                target = p(row.get(target_col, 0))
                upside = ((target / price) - 1) * 100 if target > 0 and price > 0 else 0

                # Map Numeric Rec (1.0-5.0) to Text
                rec_score = p(row.get(rec_col, 3.0))
                rec_text = "Hold"
                if rec_score > 0:
                    if rec_score <= 1.5: rec_text = "Strong Buy"
                    elif rec_score <= 2.5: rec_text = "Buy"
                    elif rec_score > 3.5: rec_text = "Sell"

                results.append({
                    "Ticker": str(row.get(ticker_col, 'N/A')),
                    "Price": price,
                    "RSI": p(row.get(rsi_col, 0)),
                    "Rel Vol": p(row.get(vol_col, 1.0)),
                    "Recommendation": rec_text,
                    "Upside %": round(float(upside), 1),
                    "Market Cap": p(row.get(cap_col, 0)),
                })
            except:
                continue

        final_df = pd.DataFrame(results)
        final_df.drop_duplicates(subset=['Ticker'], inplace=True)
        final_df.sort_values(by="Market Cap", ascending=False, inplace=True)
        final_df.reset_index(drop=True, inplace=True)
        final_df['Rank'] = final_df.index + 1
        
        print(f"Scan complete. Successfully loaded {len(final_df)} tickers.")
        return final_df
    except Exception as e:
        print(f"Screener Critical Error: {e}")
        return pd.DataFrame()