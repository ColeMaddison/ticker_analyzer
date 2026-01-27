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
    combined_results = []
    
    with DDGS() as ddgs:
        # Targeted Sector Queries - Focus on "Smart Money" and "Professional Analysis"
        if sector and sector != "All":
            sector_queries = [
                f"institutional accumulation in {sector} stocks analysis",
                f"analyst consensus upgrades {sector} sector today",
                f"major M&A activity and consolidation in {sector} industry",
                f"earnings surprises and guidance shifts in {sector} companies"
            ]
        else:
            sector_queries = [
                "top institutional stock picks 2026 analysis",
                "semiconductor and AI infrastructure market tailwinds",
                "energy sector geopolitical risk premium analysis",
                "financial sector interest rate sensitivity news",
                "large cap software enterprise spending trends"
            ]
        
        # High-Conviction "Fintwit" and Institutional Buzz (Filtering for quality)
        social_queries = [
            f"institutional positioning {sector if sector and sector != 'All' else ''} stocks",
            f"top professional trader watchlist {sector if sector and sector != 'All' else ''} tickers"
        ]
        
        # Fetch Sector News (Mainstream Financial)
        try:
            limit = 4 if sector and sector != "All" else 3
            for q in sector_queries[:limit]: 
                results = ddgs.news(keywords=q, max_results=5)
                if results:
                    for r in results:
                        # Stricter Source Check (Implicit via targeted queries, but we can add filter)
                        title = r.get('title', '')
                        combined_results.append(f"[Market Intelligence] {title} ({r.get('source')})")
        except Exception as e:
            print(f"Error fetching sector buzz: {e}")

        # Fetch High-Signal Context
        try:
            for q in social_queries:
                results = ddgs.text(keywords=q, max_results=5)
                if results:
                    for r in results:
                        title = r.get('title', '')
                        body = r.get('body', '')
                        # Explicit noise filter
                        if any(x in (title + body).lower() for x in ['stock', 'market', 'trade', 'invest', 'ticker', 'equity', 'bond', 'yield']):
                            if not any(x in (title + body).lower() for x in ['football', 'premier league', 'celebrity', 'movie', 'concert']):
                                combined_results.append(f"[Pro Sentiment] {title}: {body[:100]}...")
        except Exception as e:
            print(f"Error fetching social buzz: {e}")
        
    return list(set(combined_results))

def analyze_market_trends(news_list):
    """
    Uses the LLM to cluster news into 'High-Conviction Themes'.
    Strictly filters for professional financial relevance and high-quality assets.
    """
    if not news_list:
        return {"themes": []}

    news_text = "\n".join(news_list[:25]) 
    
    prompt = f"""
    You are a Senior Wall Street Discovery Agent. Your job is to identify high-conviction, institutional-grade market themes.
    
    INPUT DATA:
    {news_text}
    
    STRICT FILTERING & QUALITY RULES:
    1. EXCLUDE: Penny stocks (micro-caps), sports, celebrities, general lifestyle, and noise.
    2. IGNORE: "Meme stocks" unless there is a clear institutional fundamental shift.
    3. FOCUS: Large/Mid Cap Companies, Macroeconomic Pivots, Sector Rotation, and Systematic Trends.
    4. QUALITY CHECK: Only include tickers for established companies with professional analyst coverage.
    
    TASK:
    Identify 3-5 distinct "Strategic Market Themes".
    
    For each theme:
    1. Title: Institutional and professional (e.g., "Hyperscale Cloud Infrastructure Expansion").
    2. Summary: The fundamental "Why" behind the movement.
    3. Tickers: List established symbols (e.g., "MSFT", "ASML", "JPM").
    4. Hype Score: 1-10 (Institutional attention level).
    5. Sentiment: Bullish / Bearish / Neutral.
    6. Verdict: Professional recommendation (e.g., "Overweight", "Accumulate", "Underweight", "Monitor").

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
        
        # Robust JSON cleaning
        content = content.strip()
        if content.startswith("```"):
            # Remove code blocks if present
            lines = content.split("\n")
            if lines[0].startswith("```"): lines = lines[1:]
            if lines[-1].startswith("```"): lines = lines[:-1]
            content = "\n".join(lines).strip()
            
        return json.loads(content)
    except Exception as e:
        print(f"LLM Analysis Error: {e}")
        # Secondary fallback: try to find anything between curly braces
        try:
            import re
            match = re.search(r'(\{.*\})', content, re.DOTALL)
            if match:
                return json.loads(match.group(1))
        except: pass
        return {"themes": []}