import os
from openai import OpenAI
from dotenv import load_dotenv
import json

load_dotenv()

API_KEY = os.getenv("OPENROUTER_API_KEY")
MODEL = os.getenv("OPENROUTER_MODEL", "xiaomi/mimo-v2-flash:free")

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=API_KEY,
)

def analyze_sentiment(ticker, headlines, social_news=None, technical_signals=None):
    """
    Simulates a Council of Agents to deliver a final actionable verdict.
    Now incorporates hard technical and fundamental data into the reasoning.
    """
    if not headlines:
        return {
            "sentiment_score": 50, 
            "summary": "No news found.", 
            "bull_case": "N/A", 
            "bear_case": "N/A",
            "recommended_action": "Wait for more data."
        }

    news_text = "\n".join([f"- {h}" for h in headlines])
    
    social_text = ""
    if social_news:
        social_text = "\nSOCIAL MEDIA PULSE:\n" + "\n".join([f"- {s}" for s in social_news])
    
    # Format technical context for the AI
    tech_context = ""
    if technical_signals:
        tech_context = f"""
        HARD DATA SNAPSHOT:
        - Current Price: {technical_signals.get('price', 'N/A')}
        - RSI (14): {technical_signals.get('rsi', 'N/A')}
        - Trend Strength (ADX): {technical_signals.get('adx', 'N/A')}
        - Put/Call Ratio: {technical_signals.get('pcr', 'N/A')}
        - Analyst Consensus: {technical_signals.get('consensus', 'N/A')}
        - Implied Upside: {technical_signals.get('upside', 'N/A')}%\n        
        KEY LEVELS (Use these for Entry/Exit/Stop logic):
        - Support (S1): {technical_signals.get('s1', 'N/A')}
        - Resistance (R1): {technical_signals.get('r1', 'N/A')}
        - SMA 50: {technical_signals.get('sma_50', 'N/A')}
        - SMA 200: {technical_signals.get('sma_200', 'N/A')}
        - Bollinger Bands: {technical_signals.get('bb_lower', 'N/A')} - {technical_signals.get('bb_upper', 'N/A')}
        - Weekly VWAP: {technical_signals.get('vwap_weekly', 'N/A')}
        """

    prompt = f"""
    You are a Senior Hedge Fund Strategy Committee analyzing {ticker}.
    Your goal is to provide a definitive "Action Plan" for a 1-2 month horizon.
    
    {tech_context}
    
    RECENT HEADLINES:
    {news_text}
    {social_text}
    
    TASK:
    1. 'The Bull': Argue why this stock will outperform. Use markdown bullet points (-).
    2. 'The Bear': Identify the "kill-switch" risks. Use markdown bullet points (-).
    3. 'The Retail Trader': Gauge the crowd's hype/fear.
    4. 'The Chief Strategist': Synthesize ALL data (Hard Stats + News) into a specific recommendation.

    STRICT FORMATING RULES:
    - NEVER use the dollar sign symbol ($). Use 'USD' or just the number.
    - NEVER use LaTeX or math notation.
    - Use plain text with standard markdown bolding (**) for emphasis.
    - Keep the "recommended_action" highly readable and structured.

    Return ONLY a valid JSON object:
    {{
        "sentiment_score": (int 0-100),
        "bull_case": "Markdown list of pros starting with - ",
        "bear_case": "Markdown list of risks starting with - ",
        "retail_mood": "Short vibe check.",
        "summary": "Condensed verdict (2-3 sentences).",
        "recommended_action": "DETAILED STRATEGY: Provide a clear, bulleted action plan using markdown (-). Include Entry, Stop Loss, and Take Profit levels. Do not use dollar signs."
    }}
    """

    try:
        completion = client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": "You are a professional financial strategy engine. Output valid JSON only."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.3, 
        )
        
        content = completion.choices[0].message.content.strip()
        if content.startswith("```json"): content = content[7:]
        if content.endswith("```"): content = content[:-3]
        
        return json.loads(content.strip())
    except Exception as e:
        print(f"AI Analysis Error: {e}")
        return {
            "sentiment_score": 50, 
            "summary": "AI analysis failed.", 
            "bull_case": "Error", 
            "bear_case": "Error",
            "recommended_action": "Maintain current position and re-analyze later."
        }

def identify_competitors(ticker):
    prompt = f"Identify 3 direct publicly traded competitors for {ticker}. Return ONLY a JSON list of tickers. Example: [\"AMD\", \"INTC\", \"GOOGL\"]"
    try:
        completion = client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1, 
        )
        content = completion.choices[0].message.content.strip()
        if content.startswith("```json"): content = content[7:]
        if content.endswith("```"): content = content[:-3]
        return json.loads(content.strip())[:3]
    except: return []

def analyze_commodity_strategy(commodity_name, technical_signals, macro_context, news):
    """
    Generates a specialized Strategic Action Plan for commodities.
    Considers macro factors, geopolitical risks, and technicals.
    """
    news_text = "No recent news."
    if news:
        news_text = "\n".join([f"- {h}" for h in news])

    tech_context = ""
    if technical_signals:
        tech_context = f"""
        TECHNICAL DATA:
        - Price: {technical_signals.get('price', 'N/A')}
        - RSI: {technical_signals.get('rsi', 'N/A')}
        - Trend (ADX): {technical_signals.get('adx', 'N/A')}
        - SMA 50: {technical_signals.get('sma_50', 'N/A')}
        - SMA 200: {technical_signals.get('sma_200', 'N/A')}
        """

    macro_text = ""
    if macro_context:
        macro_text = f"""
        MACRO DRIVERS:
        - USD Index (DXY) Correlation: {macro_context.get('dxy_correlation', 'N/A')}
        - Interest Rate Sensitivity: {macro_context.get('rate_sensitivity', 'N/A')}
        - Inflationary Environment: {macro_context.get('inflation_outlook', 'N/A')}
        """

    prompt = f"""
    You are a Global Commodities Strategist analyzing {commodity_name}.
    Your goal is to provide a "Strategic Action Plan" based on technicals, macro factors, and news.

    {tech_context}
    
    {macro_text}

    RELEVANT NEWS/EVENTS:
    {news_text}

    TASK:
    1. Analyze Supply/Demand dynamics based on the news and trends.
    2. Evaluate Geopolitical Risks.
    3. Assess the "Buy/Not Buy" relevance.
    4. Formulate a specific Strategic Action Plan.

    STRICT FORMATING RULES:
    - NEVER use the dollar sign symbol ($). Use 'USD' or just the number.
    - Return ONLY a valid JSON object.

    JSON Structure:
    {{
        "relevance_score": (int 0-100, where 100 is Strong Buy),
        "verdict": "Buy / Sell / Hold",
        "supply_demand_analysis": "Markdown analysis of physical market tightness.",
        "geopolitical_risks": "Markdown list of key risks.",
        "macro_outlook": "How rates and currency impact this commodity.",
        "action_plan": "DETAILED STRATEGY: Entry, Stops, Targets (use markdown list)."
    }}
    """

    try:
        completion = client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": "You are a commodities expert. Output valid JSON only."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.3, 
        )
        
        content = completion.choices[0].message.content.strip()
        if content.startswith("```json"): content = content[7:]
        if content.endswith("```"): content = content[:-3]
        
        return json.loads(content.strip())
    except Exception as e:
        print(f"Commodity Analysis Error: {e}")
        return {
            "relevance_score": 50,
            "verdict": "Neutral",
            "supply_demand_analysis": "Error in analysis.",
            "geopolitical_risks": "N/A",
            "macro_outlook": "N/A",
            "action_plan": "Stand aside due to system error."
        }

