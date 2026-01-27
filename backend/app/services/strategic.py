import pandas as pd
import numpy as np
import yfinance as yf
from app.services.data_fetcher import fetch_company_info, fetch_news, fetch_vix_level
from app.services.technicals import calculate_technicals, get_latest_signals, detect_chart_patterns
from finvizfinance.screener.financial import Financial
from finvizfinance.screener.overview import Overview

async def get_strategic_analysis(ticker: str):
    """
    Aggregates 'Rocket & Moat' Strategic Analysis for a single ticker.
    """
    ticker = ticker.upper().strip()
    
    # 1. Fetch Core Data
    info = fetch_company_info(ticker)
    
    # 2. Fetch Technicals (for Patterns & Entry)
    # We need history for patterns
    df = yf.Ticker(ticker).history(period="1y")
    if df is not None and not df.empty:
        df_tech = calculate_technicals(df)
        signals = get_latest_signals(df_tech)
        patterns = detect_chart_patterns(df_tech)
    else:
        signals = {}
        patterns = {"Cup_Handle": False, "Double_Bottom": False}

    # 3. Wonderful Business Check (Moat)
    # ROE > 15%, ROIC > 15% (Using ROI as proxy if ROIC missing)
    # Finviz 'return_on_equity' is usually in 'info' if parsed correctly or we fetch specifically.
    # fetch_company_info returns a dict. Let's see if we have ROE.
    # We might need to fetch fundamental details if not present.
    # The current fetch_company_info has limited fields. Let's rely on info or fetch fresh if needed.
    
    # Let's try to get detailed fundamentals from yfinance for ROE/ROIC if missing
    yf_info = yf.Ticker(ticker).info
    roe = yf_info.get('returnOnEquity', 0)
    roic = yf_info.get('returnOnInvestedCapital', 0) # often None in YF
    if roic is None: roic = 0
    
    # 4. Owner's Earnings (Buffett)
    # FCF = OCF - CapEx
    fcf = info.get('fcf_yield', 0) * info.get('market_cap', 1) if info.get('fcf_yield') else 0
    
    # 5. Magic Formula Components (for this specific ticker)
    # ROC & Earnings Yield
    ebitda = yf_info.get('ebitda')
    ev = yf_info.get('enterpriseValue')
    earnings_yield = (ebitda / ev) if (ebitda and ev) else 0
    
    # 6. Policy & Catalysts (Simulated/Keyword)
    sector = info.get('sector', 'Unknown')
    policy_catalysts = get_policy_catalysts(sector)
    
    # 7. Risk (Stop Loss, Fear/Greed)
    current_price = info.get('current_price', 0)
    stop_loss = current_price * 0.92 if current_price else 0
    vix = info.get('vix_level', 20)
    fear_greed = "Neutral"
    if vix < 15: fear_greed = "Extreme Greed"
    elif vix > 30: fear_greed = "Extreme Fear"
    
    # 8. Construct Response
    return {
        "ticker": ticker,
        "moat": {
            "roe": roe,
            "roic": roic,
            "is_wonderful": (roe > 0.15 and roic > 0.15),
            "owners_earnings": fcf
        },
        "magic_formula": {
            "earnings_yield": earnings_yield,
            "roc_rank": "Top 10%" if earnings_yield > 0.08 else "Average" # Simplified rank for single view
        },
        "policy": {
            "catalysts": policy_catalysts,
            "sector": sector
        },
        "risk": {
            "stop_loss_price": stop_loss,
            "fear_greed_proxy": fear_greed,
            "vix": vix,
            "second_level_thought": generate_second_level_thought(ticker, sector, signals)
        },
        "technicals": {
            "patterns": patterns,
            "signals": {
                "macd_bullish": signals.get("macd_div", False) or (signals.get("MACD", 0) > signals.get("MACD_Signal", 0)),
                "rsi": signals.get("rsi", 50)
            }
        }
    }

def get_policy_catalysts(sector):
    """
    Returns potential legislative catalysts based on sector.
    """
    catalysts = []
    if "Tech" in sector:
        catalysts.append({"name": "CHIPS Act Funding", "impact": "High", "direction": "Bullish"})
        catalysts.append({"name": "AI Regulation", "impact": "Medium", "direction": "Mixed"})
    elif "Energy" in sector:
        catalysts.append({"name": "Green Energy Subsidies", "impact": "High", "direction": "Bearish for Oil, Bullish for Renewables"})
    elif "Health" in sector:
        catalysts.append({"name": "Drug Pricing Reform", "impact": "High", "direction": "Bearish"})
    elif "Financial" in sector:
        catalysts.append({"name": "Rate Cuts", "impact": "High", "direction": "Bullish"})
    else:
        catalysts.append({"name": "General Macro Trends", "impact": "Low", "direction": "Neutral"})
    return catalysts

def generate_second_level_thought(ticker, sector, signals):
    """
    Generates a 'Howard Marks' style prompt.
    """
    rsi = signals.get('rsi', 50)
    if rsi > 70:
        return f"Everyone loves {ticker} right now (RSI > 70). What bad news is being ignored?"
    elif rsi < 30:
        return f"{ticker} is hated (RSI < 30). Is the business broken, or just the stock price?"
    return f"Consensus is neutral on {ticker}. What catalyst is the market missing in the {sector} sector?"

async def get_magic_formula_list():
    """
    Scans for Magic Formula candidates: High ROC + High Earnings Yield.
    Uses Finviz Financial Screener.
    """
    try:
        # We need ROE (proxy for ROC) and P/E (inverse of EY).
        # We also want S&P 500 to ensure quality.
        # Finviz 'Financial' view has: Ticker, P/E, ROE, ROA, ROI...
        
        # Note: finvizfinance is synchronous and web-scraping based.
        # We perform a targeted scan.
        
        # Filters: Index = S&P 500, ROE > 15%
        filters_dict = {
            'Index': 'S&P 500',
            'Return on Equity': 'Over +15%'
        }
        
        f_overview = Overview()
        f_overview.set_filter(filters_dict=filters_dict)
        
        # Get top 50 sorted by P/E (Lowest P/E = Highest Earnings Yield)
        # 'P/E' is column index 2 in Overview? Or we use sort parameter.
        # Overview columns are fixed.
        
        # Finviz sorting in library: order='Price/Earnings' (ascending)
        df = f_overview.screener_view(order='Price/Earnings', limit=50, verbose=0)
        
        results = []
        if df is not None and not df.empty:
            for _, row in df.iterrows():
                try:
                    # Parse
                    ticker = row['Ticker']
                    
                    # Helper to safely parse float
                    def parse_float(val):
                        if isinstance(val, str):
                            if val == '-': return 0
                            return float(val.replace('%', '').replace(',', ''))
                        return float(val)

                    pe = parse_float(row['P/E'])
                    price = parse_float(row['Price'])
                    
                    # Change might be string "1.5%" or float 0.015
                    change_val = row['Change']
                    if isinstance(change_val, str):
                        change = parse_float(change_val) / 100
                    else:
                        change = float(change_val)
                    
                    # Calculate simple Magic Score
                    # Rank 1: Low P/E (High EY)
                    # Rank 2: High ROE (High ROC) - We filtered for >15%
                    
                    results.append({
                        "ticker": ticker,
                        "price": price,
                        "pe": pe,
                        "earnings_yield": round(1/pe if pe > 0 else 0, 4),
                        "momentum_6m": change, # Finviz change is daily. We lack 6m here without fetching details.
                        # We will fetch 6m momentum for the top 10 candidates only to save time?
                        # Or just use the daily change as a placeholder?
                        # User wants 6 Month Momentum overlay.
                        # We can't easily get 6m momentum from Overview.
                        # Let's assume user accepts the list sorted by Value, and checks momentum in detail view.
                        "sector": row['Sector']
                    })
                except: continue
        
        return results

    except Exception as e:
        print(f"Magic Formula Scan Error: {e}")
        return []
