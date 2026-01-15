import pandas as pd
import numpy as np
from app.services.technicals import calculate_technicals, get_latest_signals
from app.services.scorer import calculate_score

def run_beast_backtest(ticker, df_historical, info, ai_sentiment_score=50):
    """
    Simulates the 'Beast' strategy over historical data.
    Adjusted thresholds for historical simulation with static fundamentals.
    """
    if df_historical is None or len(df_historical) < 50:
        return {"error": "Insufficient historical data"}

    # 1. Calculate technicals for the entire period
    df = calculate_technicals(df_historical)
    
    trades = []
    in_position = False
    entry_price = 0
    entry_date = None
    
    # Veteran Settings
    BUY_THRESHOLD = 60 # Lowered from 65 for historical parity
    SELL_SCORE_TRIGGER = 40
    
    start_idx = 200 if len(df) > 250 else 30 # Fallback if less than 1 year
    
    print(f"--- Starting Veteran Backtest for {ticker} ---")
    for i in range(start_idx, len(df)):
        current_row = df.iloc[:i+1]
        signals = get_latest_signals(current_row)
        
        # Use neutral AI and Options for historical speed
        mock_ai = {"sentiment_score": ai_sentiment_score}
        
        # Calculate historical score
        score, sb = calculate_score(signals, info, mock_ai, options_data=None)
        
        curr_price = df.iloc[i]['Close']
        curr_date = df.index[i]
        
        # Veteran Trend Filter (Fallback to SMA50 if SMA200 not available)
        sma200 = df.iloc[i].get('SMA_200', df.iloc[i]['SMA_50'])
        sma50 = df.iloc[i]['SMA_50']
        rsi = df.iloc[i]['RSI_14']

        if not in_position:
            # BUY LOGIC: High Score + Bullish Trend (Price > SMA200) + Not Overbought
            if score >= BUY_THRESHOLD and curr_price > sma200 and rsi < 70:
                print(f"  [BUY] {curr_date.date()} at ${curr_price:.2f} (Score: {score}, Trend: Bullish)")
                in_position = True
                entry_price = curr_price
                entry_date = curr_date
        
        elif in_position:
            # SELL LOGIC: 
            # 1. Score Collapse AND Trend Breakdown (Price < SMA50)
            # 2. Parabolic Climax (RSI > 80) regardless of score
            # 3. Stop Loss (10% drop)
            
            trend_broken = curr_price < sma50
            score_collapse = score <= SELL_SCORE_TRIGGER
            parabolic = rsi > 80
            stop_loss = curr_price < (entry_price * 0.90)
            
            if (score_collapse and trend_broken) or parabolic or stop_loss:
                exit_price = curr_price
                profit_pct = (exit_price - entry_price) / entry_price
                reason = "Trend Break" if trend_broken else ("Parabolic" if parabolic else "Stop Loss")
                print(f"  [SELL] {curr_date.date()} at ${exit_price:.2f} (Profit: {profit_pct*100:.2f}%, Reason: {reason})")
                trades.append({
                    "entry_date": str(entry_date.date()),
                    "exit_date": str(curr_date.date()),
                    "entry_price": float(entry_price),
                    "exit_price": float(exit_price),
                    "return": float(profit_pct)
                })
                in_position = False

    if in_position:
        exit_price = df.iloc[-1]['Close']
        profit_pct = (exit_price - entry_price) / entry_price
        print(f"  [FINAL CLOSE] at ${exit_price:.2f} (Profit: {profit_pct*100:.2f}%)")
        trades.append({
            "entry_date": str(entry_date.date()),
            "exit_date": "Open",
            "entry_price": float(entry_price),
            "exit_price": float(exit_price),
            "return": float(profit_pct)
        })

    # 2. Performance Metrics
    total_return = 0
    if trades:
        current_val = 1.0
        for t in trades:
            current_val *= (1 + t['return'])
        total_return = (current_val - 1)
    
    print(f"--- Backtest Finished: Total Return {total_return*100:.2f}% ---")

    buy_hold_return = (df.iloc[-1]['Close'] - df.iloc[start_idx]['Close']) / df.iloc[start_idx]['Close']
    
    win_rate = 0
    performance_vs_market = 0
    if trades:
        wins = len([t for t in trades if t['return'] > 0])
        win_rate = (wins / len(trades)) * 100
        performance_vs_market = (total_return - buy_hold_return) * 100

    return {
        "ticker": ticker,
        "total_beast_return": round(total_return * 100, 2),
        "buy_hold_return": round(buy_hold_return * 100, 2),
        "win_rate": round(win_rate, 1),
        "trade_count": len(trades),
        "performance_vs_market": round(performance_vs_market, 2)
    }
