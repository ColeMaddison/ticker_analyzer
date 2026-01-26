import asyncio
from finvizfinance.screener.overview import Overview
from app.services.discovery import fetch_market_buzz, analyze_market_trends

def fetch_screener_opportunities():
    """
    Fetches high-probability setups using specific Finviz filter combinations.
    Focuses on 'Veteran' setups: Oversold Quality, Volume Breakouts, and Trend Pullbacks.
    """
    opportunities = []
    
    presets = [
        {
            "name": "Oversold Blue Chips",
            "desc": "S&P 500 stocks with RSI < 30 (Extreme Fear). Potential mean reversion.",
            "filters": {'Index': 'S&P 500', 'RSI (14)': 'Oversold (30)'}
        },
        {
            "name": "High Volume Breakouts",
            "desc": "Stocks breaking out with 3x+ Relative Volume. Momentum play.",
            "filters": {'Relative Volume': 'Over 3', 'Price': 'Over $10'}
        },
        {
            "name": "Golden Trend Pullbacks",
            "desc": "Strong Uptrend (SMA200) pulling back to SMA50 support.",
            "filters": {'200-Day Simple Moving Average': 'Price above SMA200', '50-Day Simple Moving Average': 'Price below SMA50', 'RSI (14)': 'Not Overbought (<60)'}
        }
    ]

    for preset in presets:
        try:
            foverview = Overview()
            foverview.set_filter(filters_dict=preset['filters'])
            df = foverview.screener_view()
            
            if not df.empty:
                # Take top 5 sorted by Volume to ensure liquidity
                top_picks = df.sort_values(by='Volume', ascending=False).head(5)
                
                tickers = []
                for _, row in top_picks.iterrows():
                    tickers.append({
                        "symbol": row['Ticker'],
                        "price": row['Price'],
                        "change": row['Change'],
                        "volume": row['Volume']
                    })
                
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
