import pandas as pd
import numpy as np
from ta.momentum import RSIIndicator
from ta.trend import MACD, SMAIndicator, EMAIndicator, ADXIndicator
from ta.volatility import AverageTrueRange, BollingerBands
from ta.volume import VolumeWeightedAveragePrice

def calculate_technicals(df, sector_df=None):
    """
    Calculates all technical signals including Breakout lines and Momentum oscillators.
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
    
    # 2. Bollinger Bands
    bb = BollingerBands(close=df["Close"], window=20, window_dev=2)
    df["BB_Upper"] = bb.bollinger_hband()
    df["BB_Lower"] = bb.bollinger_lband()
    df["BB_Width"] = (df["BB_Upper"] - df["BB_Lower"]) / bb.bollinger_mavg()
    df["BB_Squeeze"] = df["BB_Width"] == df["BB_Width"].rolling(window=126).min()

    # 3. Weekly VWAP
    df["VWAP_Weekly"] = VolumeWeightedAveragePrice(high=df["High"], low=df["Low"], close=df["Close"], volume=df["Volume"], window=5).volume_weighted_average_price()

    # 4. Pivot Points
    high = df['High'].shift(1); low = df['Low'].shift(1); close = df['Close'].shift(1)
    df['Pivot'] = (high + low + close) / 3
    df['R1'] = (2 * df['Pivot']) - low
    df['S1'] = (2 * df['Pivot']) - high

    # 5. MACD Divergence
    df['Price_LL'] = (df['Low'] < df['Low'].shift(1)) & (df['Low'] < df['Low'].shift(2))
    df['Hist_HL'] = (df['MACD_Hist'] > df['MACD_Hist'].shift(1)) & (df['MACD_Hist'] > df['MACD_Hist'].shift(2))
    df['MACD_Divergence'] = df['Price_LL'] & df['Hist_HL'] & (df['MACD_Hist'] < 0)

    # 6. Relative Strength
    if sector_df is not None:
        stock_perf = (df["Close"] / df["Close"].shift(63)) - 1
        sector_perf = (sector_df["Close"] / sector_df["Close"].shift(63)) - 1
        df["Relative_Strength"] = stock_perf - sector_perf
    else:
        df["Relative_Strength"] = 0

    # 7. Squeeze Momentum
    sqz_on, sqz_mom = calculate_squeeze_momentum(df)
    df["SQZ_ON"] = sqz_on
    df["SQZ_MOM"] = sqz_mom
    
    # 8. SMI (Stochastic Momentum Index)
    smi, smi_sig = calculate_smi(df)
    df["SMI"] = smi
    df["SMI_SIGNAL"] = smi_sig

    # 9. Up/Down Volume Ratio (20d)
    df['is_up'] = df['Close'] > df['Open']
    up_vol = df['Volume'].where(df['is_up'], 0).rolling(window=20).sum()
    dn_vol = df['Volume'].where(~df['is_up'], 0).rolling(window=20).sum()
    df['Vol_Ratio'] = up_vol / (dn_vol + 1) # +1 to avoid div by zero

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
