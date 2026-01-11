# 🤖 AI Ticker Analyzer Pro

**Institutional-Grade Market Intelligence Terminal**

A professional-grade dashboard that combines **Technical Analysis**, **Smart Money Flow**, **Fundamental Quality**, and **Alternative Data** to deliver high-conviction trading signals. Designed to bridge the gap between retail timing and institutional value.

![Next.js](https://img.shields.io/badge/Next.js-14-black) ![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-009688) ![Tailwind](https://img.shields.io/badge/Tailwind-3.3-38B2AC) ![OpenAI](https://img.shields.io/badge/AI-OpenRouter-orange)

---

## 🚀 The Multi-Engine Analysis Hub

At the heart of the terminal is **The Beast Score (0-100)**, a decision matrix that aggregates five specialized engines into a single actionable output.

### 1. **[T] Technicals**
*   **RSI Regimes**: Focus on 40 (Bull Support) and 60 (Bear Resistance) shift points.
*   **MACD Divergence**: Automated detection of price vs. momentum exhaustion.
*   **SMI**: Stochastic Momentum Index for precise overbought/oversold cycles.

### 2. **[M] Momentum**
*   **Trend Strength**: ADX-based filtering (>25 strong, <20 avoid chop).
*   **Relative Strength (RS)**: Continuous benchmarking against the specific Sector ETF.
*   **Weekly VWAP**: Real-time tracking of institutional price support.

### 3. **[S] Smart Money**
*   **Institutional Flow**: Tracks net accumulation vs. retail selling.
*   **Insider Clusters**: Scans Form 4 filings for multiple open-market executive buys.
*   **Short Interest**: Monitors "Days to Cover" for short-squeeze setups (>5.0 ratio).
*   **Put/Call Ratio**: Contrarian sentiment analysis (Extreme Fear = Buy Opportunity).

### 4. **[Q] Quality**
*   **Growth/Valuation**: Real-time PEG Ratio filtering (<1.0 undervalued).
*   **FCF Yield**: Prioritizes companies with high cash-flow-to-price ratios (>5%).
*   **Earnings Consistency**: Tracks 4-quarter "Beat Rate" and EPS revisions.
*   **Altman Z-Score**: Automated bankruptcy risk guard (Hard cap if < 1.8).

### 5. **[E] Edge (Alternative Data)**
*   **Sector Rotation**: Relative Rotation Graph phase detection (Leading/Improving).
*   **News Velocity**: Alerts for 3-sigma news volume spikes (Sell the news signals).
*   **Market VIX Guard**: Protective cap on all scores when VIX > 30 (Panic mode).

---

## 🛠️ Key Features

*   **The Beast Score Matrix**: Instant 0-100 verdict with color-coded "Firing Engines" (T, M, S, Q, E).
*   **AI Council Strategy**: A debate-style verdict from "Bull", "Bear", and "Retail" AI agents, synthesized by a "Chief Strategist" into a bulleted Action Plan.
*   **Interactive Charts**: Lightweight Charts (TradingView style) with VWAP, Bollinger Clouds, and Volatility Squeeze markers.
*   **S&P 500 Scanner**: Full index screening by Market Cap Rank, RSI, Relative Volume, and "Strong Buy" conviction.
*   **Market Discovery**: AI-powered clustering of global news into tradeable "Buzzing Themes".
*   **Peer Benchmarking**: Live fundamental comparison of peers with aggregate group stats (Avg P/E, PEG).

---

## 💻 Tech Stack

*   **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Radix UI, Lucide Icons.
*   **Backend**: FastAPI (Python), yfinance, Pandas, TA-Lib (ta), DuckDuckGo Search.
*   **AI**: OpenRouter (LLM Council Implementation).
*   **Visuals**: Lightweight-Charts, Recharts.

---

## 🏗️ Setup & Installation

### Prerequisites
*   Python 3.9+
*   Node.js 18+
*   OpenRouter API Key

### Backend Setup
1.  Navigate to `/backend`
2.  Install dependencies: `pip install -r requirements.txt`
3.  Create `.env`:
    ```env
    OPENROUTER_API_KEY=your_key_here
    OPENROUTER_MODEL=xiaomi/mimo-v2-flash:free
    ```
4.  Run: `uvicorn app.main:app --reload`

### Frontend Setup
1.  Navigate to `/frontend`
2.  Install dependencies: `npm install`
3.  Run: `npm run dev`

---

**Disclaimer:** *This tool is for informational purposes only. It is not financial advice. Always do your own due diligence before trading.*