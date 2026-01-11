# 🤖 AI Ticker Analyzer Pro

**Institutional-Grade Market Intelligence & Strategy Validation Terminal**

A professional-grade dashboard that aggregates **Technical Momentum**, **Institutional Flow (Smart Money)**, **Fundamental Quality**, and **Macro Alpha** to deliver high-conviction trading signals. Powered by `finvizfinance` for robust, real-time data and a proprietary AI Council for strategic reasoning.

![Next.js](https://img.shields.io/badge/Next.js-14-black) ![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-009688) ![Finviz](https://img.shields.io/badge/Data-Finviz-blue) ![OpenAI](https://img.shields.io/badge/AI-OpenRouter-orange)

---

## 🚀 The Decision Matrix: "The Beast Score"

The terminal calculates a **0-100 Confidence Score** by aggregating five specialized engines. Each engine provides a specific "firing" signal represented by **[T, M, S, Q, E]** badges.

### 1. **[T] Technicals (20%)**
*   **RSI Regimes**: Focus on 40 (Bull Support) and 60 (Bear Resistance) pivots.
*   **MACD Divergence**: Detects momentum exhaustion before price reversals.
*   **Trend Support**: Automated scoring based on Price vs. SMA 50/200.

### 2. **[M] Momentum (10%)**
*   **ADX Filtering**: Measure trend strength (>25 strong, <20 avoid chop).
*   **Relative Strength**: Continuous benchmarking against Sector ETFs.
*   **Volatility Squeeze**: Detection of Bollinger/Keltner compression for explosive moves.

### 3. **[S] Smart Money (20%)**
*   **Institutional Accumulation**: Tracks net institutional ownership vs. volume ratio.
*   **Insider Clusters**: Real-time detection of multiple open-market executive buys.
*   **Short Interest**: Monitoring "Days to Cover" for short-squeeze setups (>5.0).

### 4. **[Q] Quality (20%)**
*   **Growth Valuation**: Real-time PEG Ratio filtering (<1.0 undervalued).
*   **FCF Yield**: Prioritizes stocks with high cash-flow-to-price ratios (>5%).
*   **Bankruptcy Guard**: Automated **Altman Z-Score** monitoring (Hard cap if < 1.8).

### 5. **[E] Edge (20%)**
*   **Alpha Hunter**: Cross-asset correlation matrix tracking DXY, 10Y Yield, and BTC.
*   **Sector Rotation**: Detects if the stock's industry is Leading or Improving.
*   **Market VIX Guard**: Protective score cap during high market panic (VIX > 30).

---

## 🛠️ Key Professional Features

### 📈 Instant Strategy Backtester
Next to every Beast Score is a **12-Month Performance Validation**. The system automatically simulates a strategy: *Buy at Score > 60, Sell at Score < 40*. It compares the **Beast Return** vs. **Buy & Hold**, providing instant proof of "Strategy Edge" and Win Rate.

### 🔍 Pro-Grade S&P 500 Scanner
A high-performance screener that fetches the entire index in a single logic flow.
*   **Golden Setups**: Instantly filter for stocks meeting the "Golden" criteria: *Strong Buy + Upside > 15% + High Rel Vol + Safe RSI*.
*   **Persistent Filters**: All search, sort, and filter states are preserved as you navigate the app.
*   **Market Cap Ranking**: Permanent indexing by S&P 500 weight.

### 🧠 AI Council Strategy
A debate-style verdict from "Bull", "Bear", and "Retail" AI agents, synthesized into a bulleted **Strategic Action Plan** with specific entry and exit logic.

---

## 💻 Tech Stack

*   **Frontend**: Next.js 14 (Client Components), TypeScript, Tailwind CSS, Radix UI.
*   **Backend**: FastAPI, `finvizfinance`, `yfinance` (History only), Pandas, TA-Lib.
*   **AI**: OpenRouter (LLM Council Implementation).
*   **Visuals**: Lightweight-Charts (TradingView), Recharts.

---

## 🏗️ Setup & Installation

### Prerequisites
*   Python 3.9+
*   Node.js 18+
*   OpenRouter API Key (configured in `backend/.env`)

### Installation
1.  **Clone & Install Backend**:
    ```bash
    cd backend
    pip install -r requirements.txt
    uvicorn app.main:app --reload
    ```
2.  **Install Frontend**:
    ```bash
    cd frontend
    npm install
    npm run dev
    ```

---

**Disclaimer:** *This terminal is for informational and educational purposes only. It is not financial advice. Always perform your own due diligence.*
