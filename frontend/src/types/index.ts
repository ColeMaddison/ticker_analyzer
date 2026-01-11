export interface TickerData {
  ticker: string;
  price: number;
  info: any;
  metrics: {
    upside: number;
    sharpe: number;
    drawdown: number;
  };
  score: number;
  score_breakdown: {
    technical_score: number;
    momentum_score: number;
    smart_money_score: number;
    quality_score: number;
    edge_score: number;
    ai_score: number;
    fundamental_score?: number;
  };
  hedge_fund: {
    score: number;
    verdict: string;
  };
  ai_analysis: {
    recommended_action: string;
    bull_case: string;
    bear_case: string;
    retail_mood: string;
    summary: string;
  };
  signals: {
    rsi: number;
    adx: number;
    rel_strength: number;
    macd_div: boolean;
    volume_ratio: number;
    [key: string]: any;
  };
  info: {
    recommendation: string;
    institutions_percent: number;
    insider_buying_cluster: boolean;
    short_ratio: number;
    vix_level: number;
    sector_rotation: string;
    news_velocity: number;
    [key: string]: any;
  };
  news: string[];
  peers: any[];
  analyst_actions: any[];
  chart_data: any[];
  options_data: any;
}

export interface DiscoveryTheme {
  title: string;
  summary: string;
  hype_score: number;
  tickers: string[];
}

export interface ScannerResult {
  Rank: number;
  Ticker: string;
  Price: number;
  RSI: number;
  "Rel Vol": number;
  "Upside %": number;
  Recommendation: string;
  "Market Cap": number;
}
