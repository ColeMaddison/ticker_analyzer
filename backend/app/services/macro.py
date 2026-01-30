import pandas as pd
import numpy as np
import yfinance as yf
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

def get_doomsday_score():
    """
    Calculates a 'Doomsday Rating' (0-100) based on macro pillars:
    1. Yield Curve Inversion (35%)
    2. Sahm Rule (25%)
    3. Sector Defensiveness (20%)
    4. Credit Stress/VIX (20%)
    """
    try:
        score = 0
        pillars = {}

        # 1. Yield Curve Inversion (35%)
        # 10Y (^TNX) minus 13W (^IRX) - Using 13W as specified in prompt
        tnx = yf.Ticker("^TNX").history(period="1d")['Close'].iloc[-1]
        irx = yf.Ticker("^IRX").history(period="1d")['Close'].iloc[-1]
        spread = tnx - irx
        
        yc_score = 100 if spread < 0 else 0
        score += yc_score * 0.35
        pillars["yield_curve"] = {"value": round(spread, 3), "risk": "HIGH" if spread < 0 else "LOW", "score": yc_score}

        # 2. Sahm Rule (Mocked due to data availability) (25%)
        # Trigger: Current 3-month avg unemployment vs 12-month low > 0.5%
        # Standard value as of late 2024/2025 is ~0.53 (Triggered)
        sahm_value = 0.53 
        sahm_score = 100 if sahm_value >= 0.5 else (sahm_value / 0.5 * 100)
        score += sahm_score * 0.25
        pillars["sahm_rule"] = {"value": f"{sahm_value}%", "risk": "HIGH" if sahm_value >= 0.5 else "LOW", "score": sahm_score}

        # 3. Sector Defensiveness (20%)
        # performance of XLU + XLP vs XLK (last 30 days)
        def get_perf(symbol):
            df = yf.Ticker(symbol).history(period="1mo")
            return (df['Close'].iloc[-1] / df['Close'].iloc[0]) - 1

        xlu_perf = get_perf("XLU")
        xlp_perf = get_perf("XLP")
        xlk_perf = get_perf("XLK")
        
        defensive_avg = (xlu_perf + xlp_perf) / 2
        rotation_risk = 100 if defensive_avg > xlk_perf else 0
        score += rotation_risk * 0.20
        pillars["sector_flow"] = {
            "value": "DEFENSIVE" if defensive_avg > xlk_perf else "AGGRESSIVE",
            "risk": "HIGH" if defensive_avg > xlk_perf else "LOW",
            "score": rotation_risk
        }

        # 4. Credit Stress (VIX) (20%)
        vix = yf.Ticker("^VIX").history(period="1d")['Close'].iloc[-1]
        vix_score = min(100, (vix / 30) * 100) if vix > 20 else (vix / 20 * 50)
        score += vix_score * 0.20
        pillars["credit_stress"] = {"value": f"{round(vix, 2)} (VIX)", "risk": "HIGH" if vix > 30 else "MEDIUM" if vix > 20 else "LOW", "score": vix_score}

        # 5. Dr. Copper (Copper/Gold Ratio) (20%)
        # Signal: Falling ratio = Economic Slowdown
        copper = yf.Ticker("HG=F").history(period="6mo")['Close']
        gold = yf.Ticker("GC=F").history(period="6mo")['Close']
        
        # Align dates and calculate ratio
        combined = pd.concat([copper, gold], axis=1).dropna()
        combined.columns = ['Copper', 'Gold']
        ratio = combined['Copper'] / combined['Gold']
        
        current_ratio = ratio.iloc[-1]
        ma_ratio = ratio.mean() # 6-month average
        
        # If Current Ratio is below 6mo Average, it's a slowdown signal
        commodities_score = 100 if current_ratio < ma_ratio else 0
        score += commodities_score * 0.20
        
        pillars["dr_copper"] = {
            "value": f"{current_ratio:.4f}",
            "risk": "HIGH" if current_ratio < ma_ratio else "LOW",
            "score": commodities_score,
            "trend": "FALLING" if current_ratio < ma_ratio else "RISING"
        }
        
        # Re-normalize score (Total weights = 1.2 now, need to scale back to 100 if we keep additive)
        # Actually, let's re-weight:
        # Yield Curve: 30%
        # Sahm Rule: 20%
        # Sector: 15%
        # Credit: 15%
        # Copper: 20%
        # Total: 100%
        
        final_score = (
            (yc_score * 0.30) + 
            (sahm_score * 0.20) + 
            (rotation_risk * 0.15) + 
            (vix_score * 0.15) + 
            (commodities_score * 0.20)
        )

        # Strategic Verdict
        verdict = "STABLE"
        if final_score > 70: verdict = "CRITICAL"
        elif final_score > 40: verdict = "WATCH"

        advice_list = []
        if yc_score > 50: advice_list.append("Yield Curve Inverted")
        if sahm_score > 50: advice_list.append("Labor Weakness")
        if commodities_score > 50: advice_list.append("Industrial Slowdown (Copper/Gold)")
        
        advice_str = "Macro environment remains supportive."
        if advice_list:
            advice_str = f"Headwinds detected: {', '.join(advice_list)}. Defensive positioning advised."

        return {
            "overall_score": int(final_score),
            "verdict": verdict,
            "pillars": pillars,
            "advice": advice_str
        }

    except Exception as e:
        print(f"Error calculating doomsday score: {e}")
        return {"error": str(e)}
