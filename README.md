# 🤖 AI Ticker Analyzer Pro

**Institutional-Grade Market Intelligence Terminal**

A professional-grade dashboard that combines **Technical Analysis**, **Fundamental Data**, **Options Sentiment**, and **AI-Powered Reasoning** to deliver high-conviction trading signals. Designed to bridge the gap between retail timing and institutional value.

![Python](https://img.shields.io/badge/Python-3.9%2B-blue) ![Streamlit](https://img.shields.io/badge/Streamlit-1.50%2B-red) ![OpenAI](https://img.shields.io/badge/AI-OpenRouter-orange)

## 🚀 Key Features

### 1. Multi-Factor Analysis Engine
We don't just look at one signal. The **Scorer** engine aggregates 4 distinct dimensions into a single 0-100 Confidence Score:
*   **Technicals (40%)**: RSI Regimes, MACD Divergence, Stochastic Momentum Index (SMI).
*   **Momentum (25%)**: Relative Strength vs. Sector, ADX Trend Strength, Weekly VWAP, Volatility Squeeze.
*   **Fundamentals (10%)**: Analyst Consensus, Revision Momentum, PEG Ratio.
*   **AI Sentiment (25%)**: A "Council" of AI agents (Bull, Bear, Retail) debating the news.

### 2. Institutional Metrics
*   **Hedge Fund Score**: Specific 0-100 rating based on Smart Money flow.
*   **Risk Profile**: Sharpe Ratio, Max Drawdown, and Volatility.
*   **Options Sentiment**: Put/Call Ratio analysis to spot hedging vs. speculation.
*   **Breakout Lines**: Auto-plotted Pivot Points (R1/S1) and Bollinger Clouds.

### 3. The "AI Council"
Instead of a generic summary, the AI simulates a debate:
*   **🐂 The Bull**: Argues the upside case.
*   **🐻 The Bear**: Identifies "kill-switch" risks.
*   **📢 The Retail Trader**: Scans Reddit/X for FOMO or Fear.
*   **🎯 The Arbiter**: Delivers a final **Actionable Verdict** with specific Entry/Exit levels.

### 4. Market Scanner
*   **S&P 500 Screener**: Instantly scan 500 stocks for "Strong Buy" ratings or Oversold (RSI < 30) conditions.
*   **Discovery Engine**: Scans global news for "Buzzing Themes" (e.g., "AI Chip Shortage") and identifies affected tickers.

---

## 🛠️ Installation

### Prerequisites
*   Python 3.9 or higher.
*   An [OpenRouter API Key](https://openrouter.ai/) (for the AI analysis).

### Setup
1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/ticker-analyzer.git
    cd ticker_analyzer
    ```

2.  **Create a Virtual Environment:**
    ```bash
    python3 -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```

3.  **Install Dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Configure API Key:**
    *   Create a `.env` file in the root directory.
    *   Add your key:
        ```env
        OPENROUTER_API_KEY=sk-or-v1-your-key-here
        OPENROUTER_MODEL=xiaomi/mimo-v2-flash:free  # or gpt-4o, etc.
        ```

---

## 🖥️ Usage

Run the dashboard with Streamlit:

```bash
streamlit run main.py
```

### The Workflow
1.  **Input a Ticker**: Type `NVDA`, `TSLA`, etc., in the sidebar or main input.
2.  **Check the Score**:
    *   **> 80 (Strong Buy)**: Convergence of Value and Momentum.
    *   **< 40 (Sell/Avoid)**: Broken technicals or bad fundamentals.
3.  **Read the Action Plan**: The AI will give you a specific plan (e.g., *"Wait for close above $125"*).
4.  **Verify with Charts**: Look for the **Yellow Line (Weekly VWAP)**. If price is above it, institutions are supporting the move.

---

## 📂 Project Structure

*   **`main.py`**: The UI entry point (Streamlit). Handles all visualization and tab logic.
*   **`logic/`**:
    *   **`data_fetcher.py`**: Wraps `yfinance` and `duckduckgo_search`. Handles caching and error resilience.
    *   **`technicals.py`**: The math engine. Calculates RSI, SMI, Squeeze, ADX using `pandas` and `ta`.
    *   **`scorer.py`**: The weighted algorithm that produces the final 0-100 score and Hedge Fund verdict.
    *   **`ai_analyst.py`**: Manages the LLM prompts and "Council" simulation.
    *   **`scanner.py`**: High-performance multi-threaded engine for scanning the S&P 500.
    *   **`discovery.py`**: NLP logic for clustering news into market themes.

---

## 📉 Strategy Reference

*   **The "Squeeze"**: When the white dots appear on the price candles, volatility is compressing. A violent move is imminent.
*   **Relative Strength (RS)**: We compare the stock vs. its Sector ETF (e.g., NVDA vs. XLK). If RS > 0, it's a market leader.
*   **RSI Regime**: We don't just use 30/70. We watch **40** as Bull Market Support and **60** as Bear Market Resistance.

---

**Disclaimer:** *This tool is for informational purposes only. It is not financial advice. Always do your own due diligence before trading.*
