def calculate_score(signals, info, ai_result, options_data=None, analyst_actions=None):
    """
    Highly advanced scoring engine.
    Weights: Technicals (40%), Momentum (25%), AI (25%), Fundamentals (10%).
    """
    
    score_breakdown = {
        "technical_score": 50,
        "momentum_score": 50,
        "ai_score": ai_result.get("sentiment_score", 50),
        "fundamental_score": 50
    }
    
    # --- 1. Technical Score (40%) ---
    # Focus: RSI Regime, MACD Divergence, SMI
    t_points = 50
    
    # RSI Regime Shift
    rsi = signals.get('rsi', 50)
    rsi_prev = signals.get('rsi_prev', 50)
    if rsi_prev <= 40 and rsi > 40: t_points += 20 # Bull Support Bounce
    elif rsi_prev >= 60 and rsi < 60: t_points -= 20 # Bear Resistance Failure
    
    # MACD Divergence
    if signals.get('macd_div'): t_points += 25 # Bullish Exhaustion
    
    # SMI
    smi = signals.get('smi', 0)
    if smi < -40: t_points += 10
    elif smi > 40: t_points -= 10
    
    score_breakdown["technical_score"] = max(0, min(100, t_points))

    # --- 2. Momentum Score (25%) ---
    # Focus: Relative Strength, VWAP, ADX, Squeeze
    m_points = 50
    
    # ADX Check (STRICT NO BUY if < 20)
    adx = signals.get('adx', 0)
    if adx < 20: 
        m_points = 20 # Penalize heavily for chop
    elif adx > 25:
        m_points += 15 # Strong Trend
        
    # Relative Strength vs Sector
    rs = signals.get('rel_strength', 0)
    if rs > 0.05: m_points += 20 # Outperforming sector by 5%
    elif rs < -0.05: m_points -= 15 # Laggard
    
    # Weekly VWAP
    if signals.get('close', 0) > signals.get('vwap_weekly', 0): m_points += 15
    else: m_points -= 10
    
    # Bollinger Squeeze
    if signals.get('bb_squeeze'): m_points += 10 # Anticipating breakout
    
    score_breakdown["momentum_score"] = max(0, min(100, m_points))

    # --- 3. Fundamentals (10%) ---
    f_points = 50
    rec = info.get('recommendation')
    if rec in ["strong_buy", "buy"]: f_points += 20
    
    if analyst_actions:
        upgrades = len([a for a in analyst_actions if a.get('action') == 'up'])
        if upgrades > 0: f_points += 15
        
    score_breakdown["fundamental_score"] = max(0, min(100, f_points))

    # --- Final Calculation ---
    final = (
        (score_breakdown["technical_score"] * 0.40) +
        (score_breakdown["momentum_score"] * 0.25) +
        (score_breakdown["ai_score"] * 0.25) +
        (score_breakdown["fundamental_score"] * 0.10)
    )
    
    return int(final), score_breakdown

def calculate_hedge_fund_score(info, risk_metrics):
    score = 50
    inst = info.get('institutions_percent')
    if inst:
        if inst > 0.6: score += 20
        elif inst < 0.2: score -= 10
    sharpe = risk_metrics.get('sharpe', 0)
    if sharpe > 1.5: score += 20
    elif sharpe < 0: score -= 15
    score = max(0, min(100, int(score)))
    if score >= 80: verdict = "Institutional Favorite 💎"
    elif score >= 60: verdict = "Quality Accumulation 🟢"
    elif score >= 40: verdict = "Mixed / Neutral 🟡"
    else: verdict = "Avoid / High Risk 🔴"
    return score, verdict
