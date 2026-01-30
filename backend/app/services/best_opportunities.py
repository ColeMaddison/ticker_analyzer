import asyncio
import time
from finvizfinance.screener.overview import Overview
from app.services.discovery import fetch_market_buzz, analyze_market_trends

def fetch_screener_opportunities():
    """
    Fetches high-probability setups using specific Finviz filter combinations.
    Focuses on 'Veteran' setups: Oversold Quality, Volume Breakouts, and Trend Pullbacks.
    Excludes 'junk' by enforcing Market Cap and Volume floors.
    """
    opportunities = []
    
    presets = [
        {
            "name": "Small Cap Rockets",
            "desc": "High-velocity movers ($300M+) with >3x volume. Volatile but explosive.",
            "filters": {
                'Market Cap.': '+Small (over $300mln)', 
                'Relative Volume': 'Over 3', 
                'Price': 'Over $5',
                'Change': 'Up'
            }
        },
        {
            "name": "Short Squeeze Prime",
            "desc": "High short interest (>20%) stocks seeing abnormal volume. Squeeze potential.",
            "filters": {
                'Float Short': 'Over 20%',
                'Relative Volume': 'Over 1.5',
                'Price': 'Over $5'
            }
        },
        {
            "name": "Aggressive Growth",
            "desc": "Companies with >25% sales growth breaking out on volume.",
            "filters": {
                'Sales growthqtr over qtr': 'Over 25%',
                'Relative Volume': 'Over 1.5',
                'Price': 'Over $5',
                '20-Day Simple Moving Average': 'Price above SMA20'
            }
        },
        {
            "name": "Oversold Blue Chips",
            "desc": "S&P 500 stocks with RSI < 30. Institutional mean reversion plays.",
            "filters": {'Index': 'S&P 500', 'RSI (14)': 'Oversold (30)'}
        },
        {
            "name": "Institutional Breakouts",
            "desc": "Mid-Caps breaking out with massive volume. Accumulation signatures.",
            "filters": {
                'Market Cap.': '+Mid (over $2bln)', 
                'Relative Volume': 'Over 3', 
                'Average Volume': 'Over 1M',
                'Price': 'Over $15',
                'Change': 'Up'
            }
        }
    ]

    for preset in presets:
        try:
            # Respect rate limits
            time.sleep(1.5)
            
            foverview = Overview()
            foverview.set_filter(filters_dict=preset['filters'])
            df = foverview.screener_view(verbose=0)
            
            if df is not None and not df.empty:
                # Ensure we have required columns and handle potential name variations
                # Finviz columns: Ticker, Price, Change, Volume
                
                # Take top 5 sorted by Volume to ensure highest liquidity
                top_picks = df.sort_values(by='Volume', ascending=False).head(5)
                
                tickers = []
                for _, row in top_picks.iterrows():
                    try:
                        # Parse values safely
                        def safe_float(val):
                            if isinstance(val, str):
                                return float(val.strip('%').replace(',', ''))
                            return float(val)

                        tickers.append({
                            "symbol": row['Ticker'],
                            "price": safe_float(row['Price']),
                            "change": safe_float(row['Change']),
                            "volume": safe_float(row['Volume'])
                        })
                    except: continue
                
                if tickers:
                    opportunities.append({
                        "strategy": preset['name'],
                        "description": preset['desc'],
                        "picks": tickers
                    })
        except Exception as e:
            print(f"Error fetching preset {preset['name']}: {e}")
            continue
            
    return opportunities

async def get_combined_discovery(sector=None):
    """
    Combines AI-analyzed News Themes with Algorithmic Screener Opportunities.
    """
    # Parallel execution for speed
    raw_news = await asyncio.to_thread(fetch_market_buzz, sector=sector)
    
    # Run Analysis and Screener concurrently
    news_task = asyncio.to_thread(analyze_market_trends, raw_news)
    screener_task = asyncio.to_thread(fetch_screener_opportunities)
    
    analysis_result, screener_results = await asyncio.gather(news_task, screener_task)
    
    return {
        "news_themes": analysis_result.get("themes", []),
        "screener_opportunities": screener_results
    }
