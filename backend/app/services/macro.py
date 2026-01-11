import pandas as pd
import numpy as np
from app.services.data_fetcher import fetch_ticker_data

MACRO_ASSETS = {
    "DXY": "DX-Y.NYB",    # US Dollar Index
    "10Y Yield": "^TNX", # 10Y Treasury Note
    "Bitcoin": "BTC-USD",
    "Oil": "CL=F",       # WTI Crude
    "S&P 500": "SPY"
}

def calculate_macro_correlations(ticker_df):
    """
    Calculates 90-day correlations between the stock and major macro assets.
    """
    if ticker_df is None or ticker_df.empty:
        return {}

    correlations = {}
    # Use returns for correlation to avoid price-level bias
    ticker_returns = ticker_df['Close'].pct_change().dropna()
    
    for name, symbol in MACRO_ASSETS.items():
        try:
            macro_df = fetch_ticker_data(symbol, period="6mo")
            if macro_df is not None and not macro_df.empty:
                macro_returns = macro_df['Close'].pct_change().dropna()
                # Align indices
                combined = pd.concat([ticker_returns, macro_returns], axis=1).dropna()
                combined.columns = ['Stock', 'Macro']
                
                # Calculate 60-day correlation (approx 3 months of trading days)
                corr = combined['Stock'].tail(60).corr(combined['Macro'])
                
                # Determine current trend of macro asset (5-day slope)
                recent_macro = macro_df['Close'].tail(5)
                trend = "Rising" if recent_macro.iloc[-1] > recent_macro.iloc[0] else "Falling"
                
                correlations[name] = {
                    "value": round(float(corr), 2) if not np.isnan(corr) else 0,
                    "trend": trend,
                    "symbol": symbol
                }
        except Exception as e:
            print(f"Failed correlation for {name}: {e}")
            continue
            
    return correlations
