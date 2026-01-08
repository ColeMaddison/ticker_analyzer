import streamlit as st
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import pandas as pd
import time

# Internal imports
from logic.data_fetcher import fetch_ticker_data, fetch_company_info, fetch_news, fetch_options_sentiment, fetch_fundamentals_batch, fetch_social_news, fetch_analyst_actions, fetch_sector_benchmark
from logic.technicals import calculate_technicals, get_latest_signals, calculate_risk_metrics
from logic.ai_analyst import analyze_sentiment, identify_competitors
from logic.scorer import calculate_score, calculate_hedge_fund_score
from logic.discovery import fetch_market_buzz, analyze_market_trends
from logic.scanner import get_sp500_tickers, scan_market

# Page Config
st.set_page_config(page_title="Ticker Analyzer Pro", layout="wide", page_icon="📈")

# Custom CSS
st.markdown("""
<style>
    .metric-card { background-color: #0e1117; border: 1px solid #30333d; border-radius: 10px; padding: 20px; text-align: center; }
    .buzz-card { background-color: #1E1E1E; border: 1px solid #333; border-radius: 10px; padding: 20px; margin-bottom: 20px; transition: transform 0.2s; }
    .buzz-card:hover { border-color: #4CAF50; transform: translateY(-2px); }
    .stButton>button { width: 100%; }
    .retail-box { background-color: rgba(52, 152, 219, 0.1); border: 1px solid rgba(52, 152, 219, 0.3); padding: 15px; border-radius: 8px; margin-bottom: 20px; }
    .strategy-card { background-color: #161b22; padding: 20px; border-radius: 10px; border-left: 5px solid #2ea043; margin-bottom: 15px; }
    .verdict-card { background-color: #1c2128; border: 1px solid #4CAF50; border-radius: 10px; padding: 25px; margin-top: 20px; margin-bottom: 20px; }
</style>
""", unsafe_allow_html=True)

# Sidebar Watchlist Logic
if 'watchlist' not in st.session_state:
    st.session_state.watchlist = ["AAPL", "NVDA", "TSLA", "AMD"]

with st.sidebar:
    st.header("👀 Watchlist")
    new_t = st.text_input("Add Ticker", placeholder="MSFT", key="sidebar_add").upper()
    if st.button("Add"):
        if new_t and new_t not in st.session_state.watchlist:
            st.session_state.watchlist.append(new_t)
    st.divider()
    for t in st.session_state.watchlist:
        c1, c2 = st.columns([3, 1])
        if c1.button(t, key=f"w_{t}", use_container_width=True):
            st.session_state.analysis_ticker = t; st.session_state.auto_run = True
        if c2.button("❌", key=f"d_{t}"):
            st.session_state.watchlist.remove(t); st.rerun()

st.title("🤖 AI Ticker Analyzer Pro")
tab1, tab2, tab3, tab4 = st.tabs(["📈 Ticker Analysis", "🔭 Market Discovery", "🔍 S&P 500 Scanner", "📖 Strategy Guide"])

# --- TAB 1: TICKER ANALYSIS ---
with tab1:
    col1, col2 = st.columns([3, 1])
    with col1:
        default_t = st.session_state.get("analysis_ticker", "AAPL")
        t_input = st.text_input("Enter Ticker Symbol", default_t, key="main_ticker_input")
    with col2:
        st.write(""); st.write("")
        auto_run = st.session_state.get("auto_run", False)
        if auto_run: st.session_state.auto_run = False 
        analyze_btn = st.button("Analyze Ticker", type="primary")

    if analyze_btn or auto_run:
        ticker = t_input.upper().strip()
        with st.spinner(f"Analysing {ticker}..."):
            df = fetch_ticker_data(ticker); info = fetch_company_info(ticker)
            options = fetch_options_sentiment(ticker); actions = fetch_analyst_actions(ticker)
            
            if df is None or df.empty:
                st.error("No data found for this ticker.")
            else:
                sector_df = fetch_sector_benchmark(info.get("sector", "Unknown"))
                df_t = calculate_technicals(df, sector_df); sigs = get_latest_signals(df_t)
                risk = calculate_risk_metrics(df)
                
                # Prepare AI Context
                curr_p = info.get('current_price') or info.get('regularMarketPrice') or 0
                t_m = info.get('target_mean_price', 0)
                upside_val = ((t_m - curr_p) / curr_p) * 100 if t_m and curr_p else 0
                
                tech_data = {
                    "price": f"${curr_p:.2f}",
                    "rsi": f"{sigs['rsi']:.1f}",
                    "adx": f"{sigs['adx']:.1f}",
                    "pcr": options['pcr'] if options else "N/A",
                    "consensus": str(info.get('recommendation', 'Hold')),
                    "upside": round(upside_val, 1),
                    "s1": f"${sigs.get('s1', 0):.2f}" if sigs.get('s1') else "N/A",
                    "r1": f"${sigs.get('r1', 0):.2f}" if sigs.get('r1') else "N/A",
                    "sma_50": f"${sigs.get('sma_50', 0):.2f}",
                    "sma_200": f"${sigs.get('sma_200', 0):.2f}",
                    "bb_lower": f"${sigs.get('bb_lower', 0):.2f}",
                    "bb_upper": f"${sigs.get('bb_upper', 0):.2f}",
                    "vwap_weekly": f"${sigs.get('vwap_weekly', 0):.2f}"
                }
                
                headlines = fetch_news(ticker, limit=10); social = fetch_social_news(ticker, limit=5)
                ai = analyze_sentiment(ticker, headlines, social, tech_data); peers = identify_competitors(ticker)
                score, bdown = calculate_score(sigs, info, ai, options, actions)
                hf_s, hf_v = calculate_hedge_fund_score(info, risk)
                
                # --- Top Metrics Row ---
                m1, m2, m3, m4, m5, m6, m7 = st.columns(7)
                m1.metric("Price", f"${curr_p:,.2f}")
                m2.metric("Rel Strength", f"{sigs['rel_strength']*100:+.1f}%", help="Leader vs Laggard check. Stock vs Sector ETF over 3m.")
                m3.metric("ADX", f"{sigs['adx']:.1f}", help="Trend Strength. > 25 is strong. < 20 is choppy.")
                m4.metric("RSI", f"{sigs['rsi']:.1f}", help="Regime Shift focus. 40 support / 60 resistance.")
                pcr_val = options['pcr'] if options else 0
                m5.metric("P/C Ratio", f"{pcr_val:.2f}" if options else "N/A", help="Put/Call Volume Ratio. < 0.70 Bullish.")
                m6.metric("Consensus", str(info.get('recommendation', 'N/A')).replace('_', ' ').title(), help="Wall Street bank consensus.")
                m7.metric("Upside", f"{upside_val:+.1f}%", help="Distance to Analyst Target Mean.")

                st.divider()
                
                # --- Core Analysis Area ---
                s_col, c_col = st.columns([1, 2])
                with s_col:
                    st.markdown("### 🎯 Analysis Score")
                    color = "#27ae60" if score >= 80 else "#2ecc71" if score >= 60 else "orange" if score >= 40 else "red"
                    st.plotly_chart(go.Figure(go.Indicator(mode="gauge+number", value=score, gauge={'axis':{'range':[0,100]},'bar':{'color':color}})).update_layout(height=250, margin=dict(l=20,r=20,t=20,b=20)), width='stretch')
                    
                    with st.expander("Signals Breakdown"):
                        st.write(f"**Technical Analysis (40%):** {bdown['technical_score']}/100")
                        st.caption("Focus: RSI Regimes (40 support / 60 resistance), MACD Divergence, SMI.")
                        st.write(f"**Momentum Score (25%):** {bdown['momentum_score']}/100")
                        st.caption("Focus: RS vs Sector, ADX trend strength, VWAP, Options PCR.")
                        st.write(f"**AI Sentiment (25%):** {bdown['ai_score']}/100")
                        st.write(f"**Fundamentals (10%):** {bdown['fundamental_score']}/100")
                        st.divider()
                        st.write(f"**MACD Divergence:** {'DETECTED ✅' if sigs['macd_div'] else 'None'}")
                        st.write(f"**Volatility Squeeze:** {'FIRING 💥' if sigs['bb_squeeze'] else 'Normal'}")
                        st.write(f"**Next Resistance (R1):** USD {sigs['r1']:.2f}" if sigs['r1'] else "")
                        st.write(f"**Next Support (S1):** USD {sigs['s1']:.2f}" if sigs['s1'] else "")

                    with st.expander("🏦 Hedge Fund Insights", expanded=True):
                        st.subheader(f"{hf_v}")
                        st.progress(hf_s)
                        st.metric("Sharpe Ratio", f"{risk.get('sharpe', 0):.2f}", help="Risk-adjusted return. > 1.5 is excellent.")
                        st.write(f"**Institutional Own:** {info.get('institutions_percent', 0)*100:.1f}%")
                        st.metric("Max Drawdown", f"{risk.get('max_drawdown', 0)*100:.1f}%", help="Worst peak-to-trough decline.")

                with c_col:
                    st.markdown("### 🕯️ Advanced Charts")
                    fig = make_subplots(rows=4, cols=1, shared_xaxes=True, vertical_spacing=0.04, 
                                        subplot_titles=('Price, Weekly VWAP & Breakout Lines', 'Squeeze Momentum', 'SMI', 'MACD Histogram'), 
                                        row_heights=[0.4, 0.2, 0.2, 0.2])
                    fig.add_trace(go.Candlestick(x=df_t.index, open=df_t['Open'], high=df_t['High'], low=df_t['Low'], close=df_t['Close'], name='Price'), row=1, col=1)
                    fig.add_trace(go.Scatter(x=df_t.index, y=df_t['BB_Upper'], line=dict(color='rgba(173,216,230,0.2)'), showlegend=False), row=1, col=1)
                    fig.add_trace(go.Scatter(x=df_t.index, y=df_t['BB_Lower'], line=dict(color='rgba(173,216,230,0.2)'), fill='tonexty', showlegend=False), row=1, col=1)
                    fig.add_trace(go.Scatter(x=df_t.index, y=df_t['VWAP_Weekly'], line=dict(color='yellow', width=2), name='Weekly VWAP'), row=1, col=1)
                    sqz_c = ['white' if on else 'rgba(0,0,0,0)' for on in df_t['SQZ_ON']]
                    fig.add_trace(go.Scatter(x=df_t.index, y=df_t['Close'], mode='markers', marker=dict(color=sqz_c, size=4), name='Squeeze'), row=1, col=1)
                    m_c = ['#00FF00' if v >= 0 else '#FF0000' for v in df_t['SQZ_MOM']]
                    fig.add_trace(go.Bar(x=df_t.index, y=df_t['SQZ_MOM'], marker_color=m_c, name='Squeeze Mom'), row=2, col=1)
                    fig.add_trace(go.Scatter(x=df_t.index, y=df_t['SMI'], line=dict(color='cyan'), name='SMI'), row=3, col=1)
                    fig.add_trace(go.Scatter(x=df_t.index, y=df_t.get('SMI_SIGNAL', pd.Series(0, index=df_t.index)), line=dict(color='red', dash='dot'), name='Signal'), row=3, col=1)
                    fig.add_hline(y=40, line_dash="dash", line_color="gray", row=3, col=1); fig.add_hline(y=-40, line_dash="dash", line_color="gray", row=3, col=1)
                    h_c = ['#2ecc71' if v >= 0 else '#e74c3c' for v in df_t['MACD_Hist']]
                    fig.add_trace(go.Bar(x=df_t.index, y=df_t['MACD_Hist'], marker_color=h_c, name='MACD Hist'), row=4, col=1)
                    fig.update_layout(height=800, xaxis_rangeslider_visible=False, margin=dict(l=0,r=0,t=20,b=0))
                    st.plotly_chart(fig, width='stretch')

                # --- Action Plan Card ---
                verdict_text = ai.get('recommended_action', 'Wait for trend confirmation.').replace('$', '')
                
                # Render container start
                st.markdown("""
                <div class='verdict-card'>
                    <h2 style='color:#4CAF50;margin-top:0;margin-bottom:10px;'>🎯 Recommended Action Plan</h2>
                </div>
                """, unsafe_allow_html=True)
                
                # Render content with standard markdown (enables bolding)
                # We use a negative margin on a container or just render it inside a column to simulate being 'in' the card, 
                # but standard st.markdown won't sit inside the HTML div above easily without unsafe_allow_html=True on the content itself.
                # A better trick: Use st.info or st.success which support markdown natively, OR verify the previous issue.
                # The previous issue was likely that the text was inside <p> tags in HTML string passed to st.markdown.
                # Markdown parsing inside HTML blocks is limited.
                
                # Let's try a standard st.success but styled via the custom CSS we already have for 'verdict-card' if possible, 
                # OR just pass the full markdown string to st.markdown without the <p> wrapper.
                
                st.markdown(f"""
                <div class='verdict-card'>
                    <h2 style='color:#4CAF50;margin-top:0;'>🎯 Recommended Action Plan</h2>
                    <div style='font-size:1.15rem;line-height:1.6;color:#e1e4e8;'>
{verdict_text}
                    </div>
                </div>
                """, unsafe_allow_html=True)
                
                # WAIT! st.markdown with unsafe_allow_html=True DOES NOT parse **bold** inside HTML tags. 
                # That is the core issue.
                # I must separate them.
                
                st.markdown(f"""
                <div class='verdict-card'>
                    <h2 style='color:#4CAF50;margin-top:0;'>🎯 Recommended Action Plan</h2>
                </div>
                """, unsafe_allow_html=True)
                # Inject content visually 'inside' by using negative margin or just placing it right below.
                # Actually, simpler: Just use st.markdown(verdict_text) but it won't have the background.
                
                # CORRECT FIX:
                # Use a container with a styled background, then write markdown inside it.
                with st.container():
                    st.markdown(f"""
                    <style>
                    .stMarkdown p {{
                        font-size: 1.1rem !important;
                    }}
                    </style>
                    """, unsafe_allow_html=True)
                    
                    with st.container(border=True): # New Streamlit container with border
                        st.markdown("### 🎯 Recommended Action Plan")
                        st.markdown(verdict_text)

                # --- AI Council Analysis ---
                st.markdown("### 🧠 AI Council Analysis")
                st.info(f"**Arbiter Verdict:** {ai.get('summary', 'No summary.')}")
                cb1, cb2 = st.columns(2)
                with cb1: st.success("**🐂 The Bull Case**"); st.markdown(ai.get('bull_case', 'N/A'))
                with cb2: st.error("**🐻 The Bear Case**"); st.markdown(ai.get('bear_case', 'N/A'))
                st.markdown(f"<div class='retail-box'><h4>📢 Retail Pulse</h4><p>{ai.get('retail_mood', 'Neutral')}</p></div>", unsafe_allow_html=True)

                # --- Bottom Sections ---
                with st.expander("News & Peer Comparison", expanded=True):
                    if peers:
                        st.subheader("⚖️ Peer Comparison")
                        peer_df = fetch_fundamentals_batch([ticker] + peers)
                        st.dataframe(peer_df, width='stretch')
                    st.subheader("🗞️ Analyzed Headlines")
                    for h in headlines: st.text(f"• {h}")
                    if actions:
                        st.subheader("📉 Recent Analyst Actions")
                        st.dataframe(pd.DataFrame(actions), width='stretch')

# --- TAB 2: DISCOVERY ---
with tab2:
    st.header("🔭 Market Discovery")
    if st.button("🚀 Scan for Opportunities", type="primary", key="discovery_scan"):
        with st.spinner("Analyzing global news..."):
            raw_n = fetch_market_buzz(); an = analyze_market_trends(raw_n)
            st.session_state.discovery_data = an.get("themes", []); st.rerun()
    if st.session_state.get("discovery_data"):
        for t in st.session_state.discovery_data:
            with st.container():
                st.markdown(f"<div class='buzz-card'><div class='buzz-title'>{t['title']}</div><div class='buzz-summary'>{t['summary']}</div></div>", unsafe_allow_html=True)
                cols = st.columns(len(t['tickers']) + 1)
                for i, tick in enumerate(t['tickers']):
                    if cols[i].button(f"Analyze {tick}", key=f"sc_{tick}_{t['title']}"):
                        st.session_state.analysis_ticker = tick; st.toast(f"Selected {tick}!")

# --- TAB 3: SCANNER ---
with tab3:
    st.header("🔍 S&P 500 Market Scanner")
    if st.button("🚀 Run Full Scan", type="primary"):
        with st.spinner("Scanning 500 tickers..."):
            tk = get_sp500_tickers(); sd = scan_market(tk)
            st.session_state.scan_results = sd; st.rerun()
    if st.session_state.get("scan_results") is not None:
        sdf = st.session_state.scan_results
        f1, f2, f3, f4 = st.columns(4)
        with f1: rsi_f = st.slider("Max RSI", 0, 100, 100)
        with f2: vol_f = st.slider("Min Rel Vol", 0.0, 5.0, 0.0)
        with f3: search_t = st.text_input("Search", "").upper()
        with f4: only_sb = st.checkbox("Only 'Strong Buy'")
        filtered = sdf[(sdf['RSI'] <= rsi_f) & (sdf['Rel Vol'] >= vol_f)]
        if only_sb: filtered = filtered[filtered['Recommendation'] == 'Strong Buy']
        if search_t: filtered = filtered[filtered['Ticker'].str.contains(search_t)]
        st.dataframe(filtered.sort_values(by="Upside %", ascending=False), width='stretch')

# --- TAB 4: STRATEGY GUIDE ---
with tab4:
    st.header("📖 Professional Strategy Guide")
    st.markdown("Use this terminal to align **Institutional Value** with **Retail Timing**.")
    g1, g2 = st.columns(2)
    with g1:
        st.markdown("### 🏹 High-Conviction Setups")
        st.markdown("""
        <div class='strategy-card'><b>1. The Convergence (Golden Play)</b><br>Score > 75 AND Consensus is 'Strong Buy'. Alignment of value and timing.</div>
        <div class='strategy-card' style='border-left-color:#f1e05a;'><b>2. The Watchlist</b><br>Strong Buy but Score < 50. Overextended or downtrending. Wait for score > 60.</div>
        <div class='strategy-card'><b>3. Breakout Cloud</b><br>Price leaving the Bollinger area with volume and a Squeeze Fire dot.</div>
        """, unsafe_allow_html=True)
    with g2:
        st.markdown("### ⚠️ Red Flags")
        st.markdown("""
        <div class='strategy-card' style='border-left-color:red;'><b>1. Institutional Exhaustion</b><br>High PCR (> 1.1) + RSI > 70. Big money is hedging.</div>
        <div class='strategy-card' style='border-left-color:red;'><b>2. The Chop Zone</b><br>ADX < 20. Stock has no clear trend active. Avoid.</div>
        """, unsafe_allow_html=True)
    st.divider()
    st.markdown("### 🛠️ Metric Glossary")
    gl1, gl2 = st.columns(2)
    with gl1:
        st.write("**Rel Strength:** Outperformance vs Sector ETF. >5% is a market leader.")
        st.write("**RSI Regime Shift:** Watch 40 support / 60 resistance. Bouncing from 40 is Bullish.")
        st.write("**MACD Divergence:** Price lower low vs MACD higher low. Signals selling exhaustion.")
    with gl2:
        st.write("**Weekly VWAP:** Average institutional entry price. Crossing above is a major Buy signal.")
        st.write("**SMI:** Stochastic Momentum Index. +/- 40 are the critical overbought/oversold levels.")
        st.write("**Squeeze:** White dots on candles = volatility is compressed. Big move coming.")