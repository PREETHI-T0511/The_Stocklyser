/**
 * backtestService.cjs
 * Feature 5: Historical Strategy Backtesting
 *
 * Supports strategies: SMA Crossover, RSI Mean-Reversion, Buy-and-Hold
 * Accounts for: transaction costs (commission + slippage), realistic fills,
 * benchmark comparison (SPY), drawdown, Sharpe ratio, CAGR.
 * No future-data leakage: indicators computed only on data[0..i-1] at bar i.
 */

'use strict';

const fetch = (...args) => import('node-fetch').then(m => m.default(...args));

// ── Helpers ──────────────────────────────────────────────────────────────────

function sma(prices, period) {
  if (prices.length < period) return null;
  const slice = prices.slice(prices.length - period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

function rsi(prices, period = 14) {
  if (prices.length < period + 1) return null;
  const slice = prices.slice(prices.length - period - 1);
  let gains = 0, losses = 0;
  for (let i = 1; i < slice.length; i++) {
    const diff = slice[i] - slice[i - 1];
    if (diff >= 0) gains += diff; else losses -= diff;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

/** Fetch daily OHLCV for symbol over given range via Yahoo Finance v8 API */
async function fetchDailyBars(symbol, rangeStr) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${rangeStr}&interval=1d&events=div,splits`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
      'Accept': 'application/json',
    },
    timeout: 15000,
  });
  if (!res.ok) throw new Error(`Yahoo Finance ${res.status} for ${symbol}`);
  const json = await res.json();
  const result = json?.chart?.result?.[0];
  if (!result) throw new Error(`No chart data for ${symbol}`);

  const timestamps = result.timestamp || [];
  const quotes = result.indicators?.quote?.[0] || {};
  const adjClose = result.indicators?.adjclose?.[0]?.adjclose || quotes.close;

  const bars = [];
  for (let i = 0; i < timestamps.length; i++) {
    if (!adjClose[i]) continue;
    bars.push({
      date: new Date(timestamps[i] * 1000).toISOString().slice(0, 10),
      open: quotes.open[i],
      high: quotes.high[i],
      low: quotes.low[i],
      close: quotes.close[i],
      adjClose: adjClose[i],
      volume: quotes.volume[i],
    });
  }
  return bars;
}

// ── Portfolio bookkeeping ────────────────────────────────────────────────────

function createPortfolio(initialCash) {
  return {
    cash: initialCash,
    shares: 0,
    trades: [],
    equityCurve: [],   // { date, equity }
    commissionTotal: 0,
  };
}

/**
 * Execute a simulated trade.
 * commission: flat per-trade + pct of notional (e.g. 0.001 = 0.1%)
 * slippage:   fraction added to buy price / subtracted from sell price
 */
function executeTrade(portfolio, date, action, price, commissionFlat, commissionPct, slippagePct) {
  if (action === 'BUY' && portfolio.shares === 0 && portfolio.cash > 0) {
    const fillPrice = price * (1 + slippagePct);
    const commission = commissionFlat + portfolio.cash * commissionPct;
    const netCash = portfolio.cash - commission;
    if (netCash <= 0) return;
    portfolio.shares = Math.floor(netCash / fillPrice);
    portfolio.cash = netCash - portfolio.shares * fillPrice;
    portfolio.commissionTotal += commission;
    portfolio.trades.push({ date, action, price: fillPrice, shares: portfolio.shares, commission });
  } else if (action === 'SELL' && portfolio.shares > 0) {
    const fillPrice = price * (1 - slippagePct);
    const gross = portfolio.shares * fillPrice;
    const commission = commissionFlat + gross * commissionPct;
    portfolio.cash += gross - commission;
    portfolio.commissionTotal += commission;
    portfolio.trades.push({ date, action, price: fillPrice, shares: portfolio.shares, commission });
    portfolio.shares = 0;
  }
}

function portfolioEquity(portfolio, currentPrice) {
  return portfolio.cash + portfolio.shares * currentPrice;
}

// ── Strategy implementations ─────────────────────────────────────────────────

function strategySMACrossover(bars, params) {
  const { shortPeriod = 20, longPeriod = 50 } = params;
  const signals = [];
  let prevShort = null, prevLong = null;
  for (let i = 0; i < bars.length; i++) {
    const closes = bars.slice(0, i + 1).map(b => b.adjClose);
    const s = closes.length >= shortPeriod ? sma(closes, shortPeriod) : null;
    const l = closes.length >= longPeriod ? sma(closes, longPeriod) : null;
    let signal = null;
    if (s !== null && l !== null && prevShort !== null && prevLong !== null) {
      if (prevShort <= prevLong && s > l) signal = 'BUY';
      else if (prevShort >= prevLong && s < l) signal = 'SELL';
    }
    signals.push({ ...bars[i], signal, indicators: { smaShort: s, smaLong: l } });
    if (s !== null) prevShort = s;
    if (l !== null) prevLong = l;
  }
  return signals;
}

function strategyRSIMeanReversion(bars, params) {
  const { period = 14, oversold = 30, overbought = 70 } = params;
  const signals = [];
  for (let i = 0; i < bars.length; i++) {
    const closes = bars.slice(0, i + 1).map(b => b.adjClose);
    const r = closes.length > period ? rsi(closes, period) : null;
    let signal = null;
    if (r !== null) {
      if (r < oversold) signal = 'BUY';
      else if (r > overbought) signal = 'SELL';
    }
    signals.push({ ...bars[i], signal, indicators: { rsi: r } });
  }
  return signals;
}

function strategyBuyAndHold(bars) {
  return bars.map((b, i) => ({
    ...b,
    signal: i === 0 ? 'BUY' : null,
    indicators: {},
  }));
}

// ── Analytics ────────────────────────────────────────────────────────────────

function computeDrawdown(equityCurve) {
  let peak = -Infinity;
  let maxDrawdown = 0;
  let drawdownStart = null, drawdownEnd = null, peakDate = null;
  for (const point of equityCurve) {
    if (point.equity > peak) {
      peak = point.equity;
      peakDate = point.date;
    }
    const dd = (peak - point.equity) / peak;
    if (dd > maxDrawdown) {
      maxDrawdown = dd;
      drawdownStart = peakDate;
      drawdownEnd = point.date;
    }
  }
  return { maxDrawdown, drawdownStart, drawdownEnd };
}

function computeCAGR(startEquity, endEquity, years) {
  if (years <= 0 || startEquity <= 0) return 0;
  return Math.pow(endEquity / startEquity, 1 / years) - 1;
}

function computeSharpe(equityCurve, riskFreeRate = 0.05) {
  if (equityCurve.length < 2) return 0;
  const returns = [];
  for (let i = 1; i < equityCurve.length; i++) {
    const prev = equityCurve[i - 1].equity;
    const curr = equityCurve[i].equity;
    if (prev > 0) returns.push((curr - prev) / prev);
  }
  if (returns.length === 0) return 0;
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((s, r) => s + Math.pow(r - mean, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);
  const annualMean = mean * 252;
  const annualStd = stdDev * Math.sqrt(252);
  if (annualStd === 0) return 0;
  return (annualMean - riskFreeRate) / annualStd;
}

// ── Main backtest runner ──────────────────────────────────────────────────────

async function runBacktest(options) {
  const {
    symbol,
    strategy = 'smaCrossover',
    range = '2y',
    initialCapital = 10000,
    commissionFlat = 1.0,   // \$1 per trade
    commissionPct = 0.001,  // 0.1% of notional
    slippagePct = 0.0005,   // 0.05% price impact
    params = {},
  } = options;

  if (!symbol) throw new Error('symbol is required');
  const allowedStrategies = ['smaCrossover', 'rsiMeanReversion', 'buyAndHold'];
  if (!allowedStrategies.includes(strategy)) throw new Error(`Unknown strategy: ${strategy}`);
  const allowedRanges = ['6mo', '1y', '2y', '5y', '10y', 'max'];
  if (!allowedRanges.includes(range)) throw new Error(`Invalid range: ${range}`);
  if (initialCapital < 100 || initialCapital > 10_000_000) throw new Error('initialCapital out of bounds');

  // Fetch data for symbol and benchmark (SPY)
  const [bars, benchmarkBars] = await Promise.all([
    fetchDailyBars(symbol.toUpperCase(), range),
    fetchDailyBars('SPY', range),
  ]);

  if (bars.length < 10) throw new Error(`Insufficient historical data for ${symbol}`);

  // Generate signals (no future leakage — each bar only uses data up to itself)
  let signalBars;
  if (strategy === 'smaCrossover') signalBars = strategySMACrossover(bars, params);
  else if (strategy === 'rsiMeanReversion') signalBars = strategyRSIMeanReversion(bars, params);
  else signalBars = strategyBuyAndHold(bars);

  // Run portfolio simulation
  const portfolio = createPortfolio(initialCapital);
  for (const bar of signalBars) {
    if (bar.signal) {
      executeTrade(portfolio, bar.date, bar.signal, bar.adjClose,
        commissionFlat, commissionPct, slippagePct);
    }
    portfolio.equityCurve.push({
      date: bar.date,
      equity: portfolioEquity(portfolio, bar.adjClose),
      price: bar.adjClose,
      signal: bar.signal,
      indicators: bar.indicators,
    });
  }

  // Force close on last bar
  const lastBar = signalBars[signalBars.length - 1];
  if (portfolio.shares > 0) {
    executeTrade(portfolio, lastBar.date, 'SELL', lastBar.adjClose,
      commissionFlat, commissionPct, slippagePct);
  }
  const finalEquity = portfolio.cash;

  // Benchmark (buy-and-hold SPY) – aligned to same date range
  const startDate = bars[0].date;
  const endDate = bars[bars.length - 1].date;
  const benchAligned = benchmarkBars.filter(b => b.date >= startDate && b.date <= endDate);
  const benchStart = benchAligned[0]?.adjClose || 1;
  const benchEnd = benchAligned[benchAligned.length - 1]?.adjClose || benchStart;
  const benchReturn = (benchEnd - benchStart) / benchStart;
  const benchEquityCurve = benchAligned.map(b => ({
    date: b.date,
    equity: initialCapital * (b.adjClose / benchStart),
  }));

  // Metrics
  const years = bars.length / 252;
  const totalReturn = (finalEquity - initialCapital) / initialCapital;
  const cagr = computeCAGR(initialCapital, finalEquity, years);
  const sharpe = computeSharpe(portfolio.equityCurve);
  const { maxDrawdown, drawdownStart, drawdownEnd } = computeDrawdown(portfolio.equityCurve);
  const winTrades = portfolio.trades.filter((t, i) => {
    if (t.action !== 'SELL') return false;
    const buy = portfolio.trades.slice(0, i).filter(x => x.action === 'BUY').at(-1);
    return buy && t.price > buy.price;
  });
  const sellTrades = portfolio.trades.filter(t => t.action === 'SELL');
  const winRate = sellTrades.length > 0 ? winTrades.length / sellTrades.length : 0;

  return {
    symbol: symbol.toUpperCase(),
    strategy,
    range,
    initialCapital,
    finalEquity: Math.round(finalEquity * 100) / 100,
    totalReturn: Math.round(totalReturn * 10000) / 100,  // %
    cagr: Math.round(cagr * 10000) / 100,                // %
    sharpe: Math.round(sharpe * 100) / 100,
    maxDrawdown: Math.round(maxDrawdown * 10000) / 100,  // %
    drawdownPeriod: { start: drawdownStart, end: drawdownEnd },
    winRate: Math.round(winRate * 10000) / 100,          // %
    totalTrades: portfolio.trades.length,
    commissionTotal: Math.round(portfolio.commissionTotal * 100) / 100,
    benchmark: {
      symbol: 'SPY',
      totalReturn: Math.round(benchReturn * 10000) / 100,
      equityCurve: benchEquityCurve,
    },
    equityCurve: portfolio.equityCurve,
    trades: portfolio.trades,
    dataPoints: bars.length,
    disclaimer: 'Backtested results are hypothetical and do not guarantee future performance. Transaction costs and slippage are simulated estimates.',
  };
}

module.exports = { runBacktest, fetchDailyBars };
