# 🤖 AI Ticker Analyzer Pro

**Professional-Grade Market Intelligence & Strategic Validation Terminal**

A high-conviction trading dashboard that aggregates **Technical Momentum**, **Institutional Flow**, **Fundamental Quality**, and **Macro Alpha**. Powered by `finvizfinance` for institutional-grade data, `yfinance` for deep historical analysis, and a proprietary **AI Council (DeepSeek-R1)** for strategic reasoning.

![Remix](https://img.shields.io/badge/Remix-2.17-black) ![FastAPI](https://img.shields.io/badge/FastAPI-0.128-009688) ![Finviz](https://img.shields.io/badge/Data-Finviz-blue) ![DeepSeek](https://img.shields.io/badge/AI-DeepSeek--R1-orange)

---

## 🚀 The Decision Matrix: "The Strategic Verdict"

The terminal calculates a **0-100 Conviction Score** by aggregating data from five specialized engines. The verdict is visualized through a circular progress gauge and a weighted breakdown chart.

### 🛡️ 1. Moat & Quality (25%)
*   **ROE/ROIC Monitoring**: Focus on companies with >15% returns on capital.
*   **FCF Yield**: Prioritizes stocks with high Free Cash Flow generation.
*   **Owner's Earnings**: Automated estimation of intrinsic cash generation.

### 🐋 2. Smart Money & Valuation (25%)
*   **Institutional Accumulation**: Net institutional movement tracking.
*   **Insider Buy Clusters**: Real-time detection of executive open-market purchases.
*   **PEG Ratio**: Real-time valuation filtering (Undervalued targets < 1.2).

### ⚓ 3. Risk & Safety (20%)
*   **Debt/Equity Guard**: Automated bankruptcy risk monitoring.
*   **VIX Volatility Filter**: Score adjustments based on market fear levels.
*   **Automated Stop-Loss**: Instant calculation of optimal 8% technical stop-loss levels.

### 🏛️ 4. Policy & Sector Alpha (15%)
*   **Legislative Catalysts**: Tracking high-impact news (e.g., CHIPS Act, AI Regulation).
*   **Sector Rotation**: Analysis of whether an industry is Leading, Improving, or Lagging.

### 📊 5. Entry Technicals (15%)
*   **Pattern Recognition**: Automated detection of "Cup & Handle" and "Double Bottom" setups.
*   **Momentum Regimes**: RSI Support/Resistance pivots and MACD Bullish Divergence.

---

## 🛠️ Core Intelligence Modules

### 🔍 S&P 500 Strategic Scanner
A high-performance screener that ranks the entire S&P 500 index by Market Cap weight.
*   **Magic Formula List**: Instantly identifies stocks with high Earnings Yield and high Returns on Capital.
*   **Position Tracking**: Monitor a stock's relative strength and ranking within the index.
*   **Interactive Sorting**: Dynamic filtering by P/E, Yield, and 6-Month Momentum.

### 🧠 AI Council Analysis
Deep reasoning powered by **DeepSeek-R1 (via OpenRouter)**.
*   **Multi-Agent Debate**: Synthesis of "Bull", "Bear", and "Retail" perspectives.
*   **Actionable Strategy**: Specific Entry, Exit, and Risk Management bullet points.
*   **Competitor Benchmarking**: Automated parallel fetching of industry peers for comparative valuation.

### 🌍 Global Discovery & Macro
*   **Institutional Discovery**: Filters out "junk" stocks to focus on institutional-grade setups.
*   **Macro Dashboard**: Real-time tracking of Gold (GC=F), Oil (CL=F), Bitcoin (BTC-USD), and the 10Y Yield.
*   **Fear/Greed Proxy**: VIX-based sentiment analysis integrated into every ticker report.

---

## 💻 Tech Stack

*   **Frontend**: Remix (React framework), TypeScript, Tailwind CSS, Lucide Icons.
*   **Backend**: FastAPI (Python), `finvizfinance`, `yfinance`, Pandas, TA-Lib.
*   **AI**: OpenRouter (DeepSeek-R1 reasoning model).
*   **Visuals**: Lightweight-Charts (TradingView), Recharts (Strategic Gauges).

---

## 🏗️ Setup & Installation

### Prerequisites
*   Python 3.14+
*   Node.js 18+
*   OpenRouter API Key

### Installation
1.  **Backend Configuration**:
    ```bash
    cd backend
    pip install -r requirements.txt
    # Create .env with OPENROUTER_API_KEY
    uvicorn app.main:app --reload
    ```
2.  **Frontend Configuration**:
    ```bash
    cd frontend
    npm install
    npm run dev
    ```

---

**Disclaimer:** *This terminal is for informational and educational purposes only. It is not financial advice. Always perform your own due diligence.*