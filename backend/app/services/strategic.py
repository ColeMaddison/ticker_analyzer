import pandas as pd
import numpy as np
import yfinance as yf
from app.services.data_fetcher import fetch_company_info, fetch_news, fetch_vix_level
from app.services.technicals import calculate_technicals, get_latest_signals, detect_chart_patterns
from finvizfinance.screener.financial import Financial
from finvizfinance.screener.overview import Overview
from finvizfinance.quote import finvizfinance

def parse_finviz_float(val):
    if not val or val == '-': return 0.0
    if isinstance(val, (float, int)): return float(val)
    # Remove % and ,
    clean_val = val.replace('%', '').replace(',', '')
    try:
        return float(clean_val)
    except:
        return 0.0

def parse_finviz_percent(val):
    """Returns float 0.15 for '15%'"""
    if not val or val == '-': return 0.0
    if isinstance(val, (float, int)): return float(val) # Already float?
    clean_val = val.replace('%', '').replace(',', '')
    try:
        return float(clean_val) / 100.0
    except:
        return 0.0

async def get_strategic_analysis(ticker: str):
    """
    Aggregates 'Rocket & Moat' Strategic Analysis for a single ticker.
    """
    ticker = ticker.upper().strip()
    
    # 1. Fetch Core Data (YFinance)
    info = fetch_company_info(ticker)
    
    # 2. Fetch Technicals (for Patterns & Entry)
    df = yf.Ticker(ticker).history(period="1y")
    if df is not None and not df.empty:
        df_tech = calculate_technicals(df)
        signals = get_latest_signals(df_tech)
        patterns = detect_chart_patterns(df_tech)
    else:
        signals = {}
        patterns = {"Cup_Handle": False, "Double_Bottom": False}

    # 3. Fetch Finviz Data (Detailed Fundamentals)
    try:
        fv_stock = finvizfinance(ticker)
        fv_fund = fv_stock.ticker_fundament()
    except Exception as e:
        print(f"Finviz fetch failed for {ticker}: {e}")
        fv_fund = {}

    # 4. Moat & Quality
    # Prefer Finviz data if available, fallback to YF info
    roe = parse_finviz_percent(fv_fund.get('ROE')) if 'ROE' in fv_fund else (info.get('roe', 0) or 0)
    roic = parse_finviz_percent(fv_fund.get('ROIC')) if 'ROIC' in fv_fund else (info.get('roic', 0) or 0)
    
    # Owner's Earnings (Approx FCF)
    fcf = info.get('fcf_yield', 0) * info.get('market_cap', 1) if info.get('fcf_yield') else 0
    
    # 5. Magic Formula Components
    # Earnings Yield (EBITDA / EV) - Finviz doesn't give EBITDA/EV directly as a ratio, but has components?
    # Actually Finviz has 'Earnings' (EPS) and 'Price'.
    # We can use the simple inverse P/E from Finviz or stick to our calculated one.
    # Let's rely on P/E from Finviz for consistency.
    pe = parse_finviz_float(fv_fund.get('P/E'))
    earnings_yield = (1.0 / pe) if pe > 0 else 0.0
    
    # 6. Policy & Catalysts
    sector = fv_fund.get('Sector') or info.get('sector', 'Unknown')
    policy_catalysts = get_policy_catalysts(sector)
    
    # 7. Risk
    current_price = parse_finviz_float(fv_fund.get('Price')) or info.get('current_price', 0)
    stop_loss = current_price * 0.92 if current_price else 0
    vix = info.get('vix_level', 20)
    fear_greed = "Neutral"
    if vix < 15: fear_greed = "Extreme Greed"
    elif vix > 30: fear_greed = "Extreme Fear"
    
    # 8. Smart Money (Insiders & Institutions)
    insider_trans = parse_finviz_percent(fv_fund.get('Insider Trans')) # "12.5%" -> 0.125
    inst_trans = parse_finviz_percent(fv_fund.get('Inst Trans'))
    
    # 9. Valuation & Safety
    forward_pe = parse_finviz_float(fv_fund.get('Forward P/E'))
    peg = parse_finviz_float(fv_fund.get('PEG'))
    debt_eq = parse_finviz_float(fv_fund.get('Debt/Eq'))
    
    # Logic for Valuation Verdict
    valuation_verdict = "Fair"
    if pe > 0 and forward_pe > 0:
        if forward_pe < pe * 0.8: valuation_verdict = "Undervalued (Growth Exp)"
        elif forward_pe > pe * 1.2: valuation_verdict = "Overvalued (Shrink Exp)"
    
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
            "roc_rank": "Top 10%" if earnings_yield > 0.08 else "Average"
        },
        "smart_money": {
            "insider_trans": insider_trans,
            "inst_trans": inst_trans,
            "verdict": "Accumulation" if (insider_trans > 0 or inst_trans > 0.02) else "Distribution" if (insider_trans < -0.1) else "Neutral"
        },
        "valuation": {
            "pe": pe,
            "forward_pe": forward_pe,
            "peg": peg,
            "verdict": valuation_verdict
        },
        "safety": {
            "debt_to_equity": debt_eq,
            "is_safe": debt_eq < 2.0
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

def get_magic_formula_list():
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
        
        # Filters: Index = S&P 500.
        # Removed ROE filter to show all S&P 500 companies as requested.
        filters_dict = {
            'Index': 'S&P 500'
        }
        
        f_overview = Overview()
        f_overview.set_filter(filters_dict=filters_dict)
        
        # Get all S&P 500 companies (Limit > 505)
        # We sort by Market Cap to establish "Position in the Index"
        df = f_overview.screener_view(order='Market Cap', limit=600, verbose=0)
        
        results = []
        if df is not None and not df.empty:
            # Finviz 'Market Cap' is usually already sorted descending if we pass 'Market Cap' 
            # as order, but let's ensure it's sorted by Market Cap descending.
            df = df.sort_values(by='Market Cap', ascending=False)
            
            for i, row in df.iterrows():
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
                    market_cap = parse_float(row['Market Cap'])
                    
                    # Change might be string "1.5%" or float 0.015
                    change_val = row['Change']
                    if isinstance(change_val, str):
                        change = parse_float(change_val) / 100
                    else:
                        change = float(change_val)
                    
                    results.append({
                        "rank": len(results) + 1, # Position in the index (by Market Cap)
                        "ticker": ticker,
                        "price": price,
                        "pe": pe,
                        "market_cap": market_cap,
                        "earnings_yield": round(1/pe if pe > 0 else 0, 4),
                        "momentum_6m": change, 
                        "sector": row['Sector']
                    })
                except: continue
        
        return results

    except Exception as e:
        print(f"Magic Formula Scan Error: {e}")
        return []
