export interface TickerData {
  ticker: string;
  price: number;
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
    company_name?: string;
    institutions_percent: number;
    insider_buying_cluster: boolean;
    short_ratio: number;
    vix_level: number;
    sector_rotation: string;
    news_velocity: number;
    fair_value?: number;
    months_runway?: number;
    monthly_burn?: number;
    [key: string]: any;
  };
  news: string[];
  peers: any[];
  analyst_actions: any[];
  chart_data: any[];
  options_data: any;
  macro_correlations?: {
    [key: string]: {
      value: number;
      trend: "Rising" | "Falling";
      symbol: string;
    };
  };
}

export interface DiscoveryTheme {
  title: string;
  summary: string;
  hype_score: number;
  tickers: string[];
  sentiment: string;
  verdict: string;
}

export interface ScreenerPick {
  symbol: string;
  price: number;
  change: number;
  volume: number;
}

export interface ScreenerOpportunity {
  strategy: string;
  description: string;
  picks: ScreenerPick[];
}

export interface DiscoveryResponse {
  news_themes: DiscoveryTheme[];
  screener_opportunities: ScreenerOpportunity[];
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
  is_squeeze?: boolean;
}

export interface CommodityItem {
  id: string;
  name: string;
}

export interface CommodityAnalysis {
  id: string;
  name: string;
  ticker: string;
  price: number;
  technicals: any;
  strategy: {
    relevance_score: number;
    verdict: string;
    supply_demand_analysis: string;
    geopolitical_risks: string;
    macro_outlook: string;
    action_plan: string;
  };
  chart_data: {
    time: string;
    open: number;
    high: number;
    low: number;
    close: number;
    value: number;
  }[];
  macro_context: {
    dxy_correlation: string;
    rate_sensitivity: string;
    inflation_outlook: string;
  };
  veteran_metrics?: {
    score: number;
    dxy_level: number;
    move_index: number;
    real_yield_trend: string;
    copper_gold_ratio: number;
    gold_silver_ratio: number;
    baltic_dry: number;
    carbon_credits: number;
  };
}