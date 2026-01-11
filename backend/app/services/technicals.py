import pandas as pd
import numpy as np
from ta.momentum import RSIIndicator
from ta.trend import MACD, SMAIndicator, EMAIndicator, ADXIndicator
from ta.volatility import AverageTrueRange, BollingerBands
from ta.volume import VolumeWeightedAveragePrice

def calculate_technicals(df, sector_df=None):
    """
    Calculates technical signals with robust fallbacks and high-fidelity squeeze logic.
    """
    if df is None or df.empty:
        return None

    df = df.copy()

    # 1. Standard Indicators
    df["RSI_14"] = RSIIndicator(close=df["Close"], window=14).rsi()
    macd_ind = MACD(close=df["Close"])
    df["MACD"] = macd_ind.macd()
    df["MACD_Signal"] = macd_ind.macd_signal()
    df["MACD_Hist"] = macd_ind.macd_diff()
    df["ADX"] = ADXIndicator(high=df["High"], low=df["Low"], close=df["Close"], window=14).adx()
    
    # Moving Averages
    df["SMA_50"] = df["Close"].rolling(window=50).mean()
    df["SMA_200"] = df["Close"].rolling(window=200).mean()
    
    # 2. Bollinger Bands & Keltner Channels (for Squeeze)
    bb = BollingerBands(close=df["Close"], window=20, window_dev=2)
    df["BB_Upper"] = bb.bollinger_hband()
    df["BB_Lower"] = bb.bollinger_lband()
    
    # Keltner Channel Approximation (for Squeeze)
    atr = AverageTrueRange(high=df["High"], low=df["Low"], close=df["Close"], window=20).average_true_range()
    sma20 = df["Close"].rolling(window=20).mean()
    df["KC_Upper"] = sma20 + (1.5 * atr)
    df["KC_Lower"] = sma20 - (1.5 * atr)
    
    # 3. Squeeze Detection (BB inside KC)
    df["BB_Squeeze"] = (df["BB_Upper"] < df["KC_Upper"]) & (df["BB_Lower"] > df["KC_Lower"])

    # 4. Weekly VWAP
    df["VWAP_Weekly"] = VolumeWeightedAveragePrice(high=df["High"], low=df["Low"], close=df["Close"], volume=df["Volume"], window=5).volume_weighted_average_price()

    # 5. Relative Strength (Robust Fallback)
    # 63 days = ~3 months of trading
    lookback = min(63, len(df) - 1)
    stock_perf = (df["Close"] / df["Close"].shift(lookback)) - 1
    
    if sector_df is not None and not sector_df.empty:
        sector_perf = (sector_df["Close"] / sector_df["Close"].shift(min(63, len(sector_df)-1))) - 1
        df["Relative_Strength"] = stock_perf - sector_perf
    else:
        # Fallback to general market (SPY proxy not available, use simple momentum)
        df["Relative_Strength"] = stock_perf

    # 6. Squeeze Momentum (Lazy LinReg)
    sqz_on, sqz_mom = calculate_squeeze_momentum(df)
    df["SQZ_ON"] = sqz_on
    df["SQZ_MOM"] = sqz_mom
    
    # 7. SMI & Vol Ratio
    smi, smi_sig = calculate_smi(df)
    df["SMI"] = smi
    df["SMI_SIGNAL"] = smi_sig

    df['is_up'] = df['Close'] > df['Open']
    up_vol = df['Volume'].where(df['is_up'], 0).rolling(window=20).sum()
    dn_vol = df['Volume'].where(~df['is_up'], 0).rolling(window=20).sum()
    df['Vol_Ratio'] = up_vol / (dn_vol + 1)

    return df

def calculate_squeeze_momentum(df, length=20, mult=2.0, length_kc=20, mult_kc=1.5):
    basis = df['Close'].rolling(window=length).mean()
    dev = mult * df['Close'].rolling(window=length).std()
    ma_tr = (df['High'] - df['Low']).rolling(window=length_kc).mean()
    upper_kc = basis + (ma_tr * mult_kc)
    lower_kc = basis - (ma_tr * mult_kc)
    sqz_on = (lower_bb := basis - dev) > lower_kc # simplified
    avg_hl = (df['High'] + df['Low']) / 2
    avg_val = (avg_hl + basis) / 2
    delta = df['Close'] - avg_val
    def linreg(series):
        y = series.values; x = np.arange(len(y))
        try: slope, intercept = np.polyfit(x, y, 1); return slope * (len(y) - 1) + intercept
        except: return 0.0
    mom = delta.rolling(window=length).apply(linreg, raw=False)
    return sqz_on, mom

def calculate_smi(df, q_period=14, r_period=9):
    hh = df['High'].rolling(window=q_period).max(); ll = df['Low'].rolling(window=q_period).min()
    c = (hh + ll) / 2; diff = df['Close'] - c; r = hh - ll
    def double_ema(series, span): return series.ewm(span=span).mean().ewm(span=span).mean()
    num = double_ema(diff, r_period); den = double_ema(r, r_period)
    smi = 100 * (num / (0.5 * den + 0.0001)); smi_signal = smi.ewm(span=10).mean()
    return smi, smi_signal

def calculate_risk_metrics(df):
    if df is None or df.empty: return {}
    df['returns'] = df['Close'].pct_change()
    vol = df['returns'].std() * np.sqrt(252)
    sharpe = (df['returns'].mean() / df['returns'].std()) * np.sqrt(252) if df['returns'].std() > 0 else 0
    dd = ((1 + df['returns']).cumprod() / (1 + df['returns']).cumprod().cummax()) - 1
    return {"volatility": vol, "sharpe": sharpe, "max_drawdown": dd.min()}

def get_latest_signals(df):
    if df is None or df.empty: return {}
    latest = df.iloc[-1]; prev = df.iloc[-2] if len(df) > 1 else latest
    smi, smi_sig = calculate_smi(df)
    return {
        "rsi": latest.get("RSI_14", 50), "rsi_prev": prev.get("RSI_14", 50),
        "macd_div": bool(latest.get("MACD_Divergence", False)),
        "adx": latest.get("ADX", 0), "rel_strength": latest.get("Relative_Strength", 0),
        "bb_squeeze": bool(latest.get("BB_Squeeze", False)),
        "close": latest["Close"], "vwap_weekly": latest.get("VWAP_Weekly", 0),
        "sqz_on": bool(latest.get("SQZ_ON", False)), "sqz_mom": latest.get("SQZ_MOM", 0),
        "smi": smi.iloc[-1] if not smi.empty else 0, "volume": latest["Volume"],
        "volume_ratio": latest.get("Vol_Ratio", 1.0),
        "r1": latest.get("R1"), "s1": latest.get("S1"),
        # New Context for AI
        "sma_50": latest.get("SMA_50", 0), "sma_200": latest.get("SMA_200", 0),
        "bb_upper": latest.get("BB_Upper", 0), "bb_lower": latest.get("BB_Lower", 0)
    }
