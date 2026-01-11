def calculate_score(signals, info, ai_result, options_data=None, analyst_actions=None):
    """
    Institutional-grade scoring engine.
    Weights: Technicals (20%), Momentum (10%), Smart Money (20%), Quality (20%), Edge (20%), AI (10%).
    """
    
    score_breakdown = {
        "technical_score": 50,
        "momentum_score": 50,
        "smart_money_score": 50,
        "quality_score": 50,
        "edge_score": 50,
        "ai_score": ai_result.get("sentiment_score", 50)
    }
    
    # --- 1. Technical Score (20%) ---
    t_points = 50
    rsi = signals.get('rsi', 50)
    if signals.get('rsi_prev', 50) <= 40 and rsi > 40: t_points += 20 
    if signals.get('macd_div'): t_points += 25 
    if signals.get('smi', 0) < -40: t_points += 10
    score_breakdown["technical_score"] = max(0, min(100, t_points))

    # --- 2. Momentum Score (10%) ---
    m_points = 50
    if signals.get('adx', 0) < 20: m_points = 20 
    if signals.get('rel_strength', 0) > 0.05: m_points += 20 
    if signals.get('close', 0) > signals.get('vwap_weekly', 0): m_points += 15
    score_breakdown["momentum_score"] = max(0, min(100, m_points))

    # --- 3. Smart Money Engine (20%) ---
    sm_points = 50
    if (info.get('institutions_percent', 0) or 0) > 0.60 and signals.get('volume_ratio', 1.0) > 1.20: sm_points += 20
    if (info.get('short_ratio', 0) or 0) > 5.0: sm_points += 25
    if info.get('insider_buying_cluster'): sm_points += 25
    pcr = options_data.get('pcr', 1.0) if options_data else 1.0
    if pcr > 1.20: sm_points += 20 
    elif pcr < 0.60: sm_points -= 20 
    score_breakdown["smart_money_score"] = max(0, min(100, sm_points))

    # --- 4. Quality Engine (20%) ---
    q_points = 50
    peg = info.get('peg_ratio')
    if peg is not None:
        if peg < 1.0: q_points += 20
        elif peg > 2.0: q_points -= 20
    surprises = info.get('surprises', [])
    if len(surprises) >= 4 and all(s['actual'] > s['estimate'] for s in surprises): q_points += 25
    if (info.get('fcf_yield', 0) or 0) > 0.05: q_points += 20
    score_breakdown["quality_score"] = max(0, min(100, q_points))

    # --- 5. Edge Engine (20%) ---
    e_points = 50
    # Sector Rotation
    rot = info.get('sector_rotation', 'Neutral')
    if rot == "Leading": e_points += 25
    elif rot == "Improving": e_points += 15
    elif rot == "Lagging": e_points -= 15
    
    # News Velocity (3-sigma proxy)
    if info.get('news_velocity', 0) > 0.8: e_points -= 20 # Overheated
    
    score_breakdown["edge_score"] = max(0, min(100, e_points))

    # --- Final Calculation ---
    final = (
        (score_breakdown["technical_score"] * 0.20) +
        (score_breakdown["momentum_score"] * 0.10) +
        (score_breakdown["smart_money_score"] * 0.20) +
        (score_breakdown["quality_score"] * 0.20) +
        (score_breakdown["edge_score"] * 0.20) +
        (score_breakdown["ai_score"] * 0.10)
    )
    
    # Global Defensive Guards
    altman_z = info.get('altman_z')
    if altman_z is not None and altman_z < 1.8: final = min(30, final)
    
    vix = info.get('vix_level', 20)
    if vix > 30: final = min(40, final) # Market Panic Mode
    
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
