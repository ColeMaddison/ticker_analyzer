import json
import os
from duckduckgo_search import DDGS
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("OPENROUTER_API_KEY")
MODEL = os.getenv("OPENROUTER_MODEL", "xiaomi/mimo-v2-flash:free")

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=API_KEY,
)

def fetch_market_buzz(sector=None):
    """
    Searches for market-moving news. If sector is provided, targets that specific industry.
    """
    ddgs = DDGS()
    
    # Targeted Sector Queries
    if sector and sector != "All":
        sector_queries = [
            f"{sector} industry trends stock market analysis",
            f"top moving stocks in {sector} sector today",
            f"macro headwinds affecting {sector} companies",
            f"institutional accumulation in {sector} stocks"
        ]
    else:
        sector_queries = [
            "semiconductor industry trends stock market",
            "enterprise software market news analysis",
            "mining and metals stock sector news",
            "financial sector major movers today",
            "industrial machinery stocks outlook"
        ]
    
    # Social/Retail Sentiment (Strictly Financial)
    social_queries = [
        f"most discussed {sector if sector and sector != 'All' else ''} stocks wallstreetbets investing",
        f"fintwit trending {sector if sector and sector != 'All' else ''} tickers analysis"
    ]
    
    combined_results = []
    
    # Fetch Sector News (Mainstream)
    try:
        limit = 4 if sector and sector != "All" else 3
        for q in sector_queries[:limit]: 
            results = ddgs.news(keywords=q, max_results=5)
            if results:
                for r in results:
                    combined_results.append(f"[{sector if sector and sector != 'All' else 'Market'} News] {r.get('title')} ({r.get('source')})")
    except Exception as e:
        print(f"Error fetching sector buzz: {e}")

    # Fetch Social Buzz
    try:
        for q in social_queries:
            results = ddgs.text(keywords=q, max_results=5)
            if results:
                for r in results:
                    title = r.get('title', '')
                    body = r.get('body', '')
                    if any(x in (title + body).lower() for x in ['stock', 'market', 'trade', 'invest', 'price', 'nasdaq', 'nyse']):
                        combined_results.append(f"[Retail Sentiment] {title}: {body[:100]}...")
    except Exception as e:
        print(f"Error fetching social buzz: {e}")
        
    return list(set(combined_results))

def analyze_market_trends(news_list):
    """
    Uses the LLM to cluster news into 'Buzzing Themes'.
    Strictly filters for financial relevance.
    """
    if not news_list:
        return {"themes": []}

    news_text = "\n".join(news_list[:25]) 
    
    prompt = f"""
    You are a Wall Street Discovery Agent. Your job is to identify actionable market themes for a trader.
    
    INPUT DATA:
    {news_text}
    
    STRICT FILTERING RULES:
    1. IGNORE all news related to: Sports (Football, Premier League), Music/Celebrities, Politics (unless directly moving markets), and General Lifestyle.
    2. FOCUS ONLY on: Publicly Traded Companies, Economic Trends, Commodities (Minerals, Oil), Hardware/Software Tech, and Financial Markets.
    3. If a news item is not about a tradeable asset or industry, DISCARD IT.
    
    TASK:
    Identify 3-5 distinct "Market Themes" based on the valid financial news above.
    Act as a "Veteran Discovery Agent" in 2026.
    
    For each theme:
    1. Title: Professional and descriptive (e.g., "Semiconductor Supply Chain Tightening").
    2. Summary: Why this matters to a trader.
    3. Tickers: List specific stock symbols (e.g., "NVDA", "RIO", "JPM").
    4. Hype Score: 1-10 (10 = Everyone is talking about it).
    5. Sentiment: Bullish / Bearish / Neutral.
    6. Verdict: "Strong Buy" / "Buy" / "Neutral" / "Avoid" (based on veteran risk/reward assessment).

    Return ONLY a JSON object:
    {{
        "themes": [
            {{
                "title": "...",
                "summary": "...",
                "tickers": ["..."],
                "hype_score": 8,
                "sentiment": "...",
                "verdict": "..."
            }}
        ]
    }}
    """

    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "system", "content": "You are a JSON-only financial assistant."},
                      {"role": "user", "content": prompt}],
            temperature=0.3,
            response_format={"type": "json_object"}
        )
        content = response.choices[0].message.content
        if content.startswith("```json"):
            content = content[7:]
        if content.endswith("```"):
            content = content[:-3]
            
        return json.loads(content)
    except Exception as e:
        print(f"LLM Analysis Error: {e}")
        return {"themes": []}