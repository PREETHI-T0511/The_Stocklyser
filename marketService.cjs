/**
 * Market Data Service
 * Provides real-time and historical equity market data via Yahoo Finance endpoints
 * with in-memory caching and resilient error handling.
 */

const cache = new Map();

function getCached(key) {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    cache.delete(key);
    return null;
  }
  return item.data;
}

function setCache(key, data, ttlSeconds = 30) {
  cache.set(key, {
    data,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

async function fetchFromYahoo(url, maxRetries = 2) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Market provider responded with HTTP ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      if (attempt === maxRetries) {
        throw err;
      }
      await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

/**
 * Get historical candlestick data and metadata for a ticker symbol.
 */
async function getChart(symbol, range = '1mo', interval = '1d') {
  const cleanSymbol = symbol.trim().toUpperCase();
  const cacheKey = `chart:${cleanSymbol}:${range}:${interval}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(cleanSymbol)}?range=${encodeURIComponent(range)}&interval=${encodeURIComponent(interval)}`;
  const data = await fetchFromYahoo(url);

  if (!data?.chart?.result || data.chart.result.length === 0) {
    throw new Error(data?.chart?.error?.description || `No chart data found for symbol ${cleanSymbol}`);
  }

  const result = data.chart.result[0];
  const meta = result.meta || {};
  const timestamps = result.timestamp || [];
  const quote = result.indicators?.quote?.[0] || {};

  const opens = quote.open || [];
  const highs = quote.high || [];
  const lows = quote.low || [];
  const closes = quote.close || [];
  const volumes = quote.volume || [];

  const candles = [];
  const isIntraday = interval === '1m' || interval === '2m' || interval === '5m' || interval === '15m' || interval === '30m' || interval === '60m' || interval === '1h';

  for (let i = 0; i < timestamps.length; i++) {
    const o = opens[i];
    const h = highs[i];
    const l = lows[i];
    const c = closes[i];
    const v = volumes[i] || 0;

    // Filter out null or incomplete candles (holidays, gaps)
    if (o == null || h == null || l == null || c == null) continue;

    // lightweight-charts expects UNIX seconds for intraday, or 'YYYY-MM-DD' for daily+
    let timeVal;
    if (isIntraday) {
      timeVal = timestamps[i];
    } else {
      const d = new Date(timestamps[i] * 1000);
      timeVal = d.toISOString().split('T')[0];
    }

    candles.push({
      time: timeVal,
      open: Number(o.toFixed(2)),
      high: Number(h.toFixed(2)),
      low: Number(l.toFixed(2)),
      close: Number(c.toFixed(2)),
      volume: v,
    });
  }

  // Deduplicate and sort by time
  const uniqueCandles = [];
  const seenTimes = new Set();
  for (const candle of candles) {
    if (!seenTimes.has(candle.time)) {
      seenTimes.add(candle.time);
      uniqueCandles.push(candle);
    }
  }

  const formattedMeta = {
    symbol: meta.symbol || cleanSymbol,
    name: meta.longName || meta.shortName || cleanSymbol,
    currency: meta.currency || 'USD',
    exchange: meta.exchangeName || 'US',
    price: meta.regularMarketPrice ?? (uniqueCandles[uniqueCandles.length - 1]?.close || 0),
    previousClose: meta.chartPreviousClose || meta.previousClose || 0,
    change: meta.fulldayChange ?? Number(((meta.regularMarketPrice || 0) - (meta.chartPreviousClose || 0)).toFixed(2)),
    changePercent: meta.regularMarketChangePercent ?? Number((((meta.regularMarketPrice - meta.chartPreviousClose) / meta.chartPreviousClose) * 100).toFixed(2)),
    dayHigh: meta.regularMarketDayHigh || 0,
    dayLow: meta.regularMarketDayLow || 0,
    volume: meta.regularMarketVolume || 0,
    fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh || 0,
    fiftyTwoWeekLow: meta.fiftyTwoWeekLow || 0,
    range,
    interval,
    lastUpdated: new Date().toISOString(),
    source: 'Real-time & Delayed Yahoo Finance Market API',
  };

  const payload = {
    meta: formattedMeta,
    candles: uniqueCandles,
  };

  setCache(cacheKey, payload, isIntraday ? 15 : 60);
  return payload;
}

/**
 * Get formatted current quote summary.
 */
async function getQuote(symbol) {
  const chartData = await getChart(symbol, '1d', '1d');
  return chartData.meta;
}

/**
 * Search ticker symbols with autocomplete.
 */
async function searchSymbols(query) {
  if (!query || query.trim().length === 0) return [];
  const cleanQ = query.trim();
  const cacheKey = `search:${cleanQ.toLowerCase()}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(cleanQ)}&quotesCount=8&newsCount=0`;
  const data = await fetchFromYahoo(url);

  const quotes = (data.quotes || [])
    .filter(q => q.quoteType === 'EQUITY' || q.quoteType === 'ETF')
    .map(q => ({
      symbol: q.symbol,
      name: q.shortname || q.longname || q.symbol,
      exchange: q.exchange,
      type: q.quoteType,
    }));

  setCache(cacheKey, quotes, 300);
  return quotes;
}

/**
 * Retrieve multiple popular market quotes.
 */
async function getPopularQuotes() {
  const popularSymbols = ['AAPL', 'NVDA', 'MSFT', 'TSLA', 'AMZN', 'GOOGL', 'SPY', 'QQQ'];
  const cacheKey = 'popular:quotes';
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const results = await Promise.allSettled(
    popularSymbols.map(sym => getQuote(sym))
  );

  const quotes = results
    .filter(r => r.status === 'fulfilled')
    .map(r => r.value);

  setCache(cacheKey, quotes, 30);
  return quotes;
}

/**
 * Multi-Stock Comparison Service
 * Normalizes multiple ticker series to percentage returns from day 0.
 */
async function compareSymbols(symbols, range = '1mo', interval = '1d') {
  if (!Array.isArray(symbols) || symbols.length === 0) {
    throw new Error('At least one symbol is required for comparison');
  }

  const cleanSymbols = Array.from(new Set(symbols.map(s => s.trim().toUpperCase()))).slice(0, 6);
  const cacheKey = `compare:${cleanSymbols.join(',')}:${range}:${interval}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const chartResults = await Promise.allSettled(
    cleanSymbols.map(sym => getChart(sym, range, interval))
  );

  const series = [];

  for (let idx = 0; idx < cleanSymbols.length; idx++) {
    const sym = cleanSymbols[idx];
    const res = chartResults[idx];
    if (res.status !== 'fulfilled' || !res.value?.candles || res.value.candles.length === 0) {
      continue;
    }

    const { meta, candles } = res.value;
    const basePrice = candles[0].close;
    if (!basePrice || basePrice <= 0) continue;

    const normalizedData = [];
    const dailyReturns = [];

    for (let i = 0; i < candles.length; i++) {
      const c = candles[i];
      const returnPct = Number((((c.close - basePrice) / basePrice) * 100).toFixed(2));
      normalizedData.push({
        time: c.time,
        value: returnPct,
        price: c.close,
      });

      if (i > 0) {
        const prevClose = candles[i - 1].close;
        if (prevClose > 0) {
          dailyReturns.push((c.close - prevClose) / prevClose);
        }
      }
    }

    const lastCandle = candles[candles.length - 1];
    const totalReturn = Number((((lastCandle.close - basePrice) / basePrice) * 100).toFixed(2));
    const returnValues = normalizedData.map(d => d.value);
    const maxReturn = Math.max(...returnValues);
    const minReturn = Math.min(...returnValues);

    // Annualized volatility
    let annualizedVol = 0;
    if (dailyReturns.length > 1) {
      const mean = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
      const variance = dailyReturns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (dailyReturns.length - 1);
      annualizedVol = Number((Math.sqrt(variance) * Math.sqrt(252) * 100).toFixed(2));
    }

    series.push({
      symbol: sym,
      name: meta.name || sym,
      exchange: meta.exchange || 'US',
      currency: meta.currency || 'USD',
      currentPrice: lastCandle.close,
      basePrice,
      totalReturn,
      maxReturn,
      minReturn,
      volatility: annualizedVol,
      data: normalizedData,
    });
  }

  const payload = {
    symbols: cleanSymbols,
    range,
    interval,
    series,
    lastUpdated: new Date().toISOString(),
  };

  setCache(cacheKey, payload, 45);
  return payload;
}

const SECTOR_DEFINITIONS = [
  { id: 'tech', name: 'Technology', etf: 'XLK', weight: 32.5, stocks: ['AAPL', 'MSFT', 'NVDA', 'AVGO'] },
  { id: 'fin', name: 'Financials', etf: 'XLF', weight: 13.2, stocks: ['JPM', 'BAC', 'V', 'MA'] },
  { id: 'health', name: 'Healthcare', etf: 'XLV', weight: 11.8, stocks: ['LLY', 'UNH', 'JNJ', 'ABBV'] },
  { id: 'disc', name: 'Consumer Discretionary', etf: 'XLY', weight: 10.4, stocks: ['AMZN', 'TSLA', 'HD', 'MCD'] },
  { id: 'comm', name: 'Communication Services', etf: 'XLC', weight: 8.9, stocks: ['META', 'GOOGL', 'NFLX', 'DIS'] },
  { id: 'ind', name: 'Industrials', etf: 'XLI', weight: 8.4, stocks: ['GE', 'CAT', 'UNP', 'HON'] },
  { id: 'stap', name: 'Consumer Staples', etf: 'XLP', weight: 5.8, stocks: ['PG', 'COST', 'KO', 'PEP'] },
  { id: 'energy', name: 'Energy', etf: 'XLE', weight: 3.6, stocks: ['XOM', 'CVX', 'COP', 'SLB'] },
  { id: 'util', name: 'Utilities', etf: 'XLU', weight: 2.4, stocks: ['NEE', 'SO', 'DUK', 'CEG'] },
  { id: 're', name: 'Real Estate', etf: 'XLRE', weight: 2.2, stocks: ['PLD', 'AMT', 'EQIX', 'CCI'] },
  { id: 'mat', name: 'Materials', etf: 'XLB', weight: 2.1, stocks: ['LIN', 'SHW', 'ECL', 'APD'] },
];

/**
 * Sector Performance & Heatmap Service
 */
async function getSectorHeatmap(period = '1d') {
  const cacheKey = `sectors:${period}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  let range = '1d';
  let interval = '1d';
  if (period === '1w') { range = '5d'; interval = '1d'; }
  else if (period === '1m') { range = '1mo'; interval = '1d'; }
  else if (period === '1y') { range = '1y'; interval = '1wk'; }

  // Fetch ETF performance and key stocks
  const sectorResults = await Promise.allSettled(
    SECTOR_DEFINITIONS.map(async (sec) => {
      let etfReturn = 0;
      let etfPrice = 0;

      if (period === '1d') {
        const q = await getQuote(sec.etf);
        etfReturn = q.changePercent || 0;
        etfPrice = q.price || 0;
      } else {
        const chart = await getChart(sec.etf, range, interval);
        const c = chart.candles;
        if (c.length > 0) {
          const first = c[0].close;
          const last = c[c.length - 1].close;
          etfReturn = Number((((last - first) / first) * 100).toFixed(2));
          etfPrice = last;
        }
      }

      // Fetch top component stocks
      const stockResults = await Promise.allSettled(
        sec.stocks.map(async (sym) => {
          if (period === '1d') {
            const sq = await getQuote(sym);
            return {
              symbol: sym,
              name: sq.name || sym,
              price: sq.price || 0,
              changePercent: Number((sq.changePercent || 0).toFixed(2)),
            };
          } else {
            const sc = await getChart(sym, range, interval);
            const candles = sc.candles;
            if (candles.length > 0) {
              const first = candles[0].close;
              const last = candles[candles.length - 1].close;
              const ret = Number((((last - first) / first) * 100).toFixed(2));
              return {
                symbol: sym,
                name: sc.meta.name || sym,
                price: last,
                changePercent: ret,
              };
            }
            return { symbol: sym, name: sym, price: 0, changePercent: 0 };
          }
        })
      );

      const stocks = stockResults
        .filter(r => r.status === 'fulfilled')
        .map(r => r.value);

      return {
        id: sec.id,
        name: sec.name,
        etf: sec.etf,
        weight: sec.weight,
        price: etfPrice,
        performance: Number(etfReturn.toFixed(2)),
        stocks,
      };
    })
  );

  const sectors = sectorResults
    .filter(r => r.status === 'fulfilled')
    .map(r => r.value);

  // Sort sectors by performance descending
  sectors.sort((a, b) => b.performance - a.performance);

  const payload = {
    period,
    sectors,
    lastUpdated: new Date().toISOString(),
    source: 'Real-time & Delayed Sector ETF Feeds (SPDR / Yahoo Finance)',
  };

  setCache(cacheKey, payload, 60);
  return payload;
}

module.exports = {
  getChart,
  getQuote,
  searchSymbols,
  getPopularQuotes,
  compareSymbols,
  getSectorHeatmap,
};

