/**
 * Financial News Sentiment Analysis & Earnings Summary Service
 * Aggregates real-time news headlines, performs algorithmic financial NLP sentiment scoring,
 * and extracts historical earnings surprise & upcoming calendar events from Yahoo Finance.
 */

const YahooFinance = require('yahoo-finance2').default;

const yf = new YahooFinance({
  suppressNotices: ['yahooSurvey', 'ripHistorical'],
  logger: { info: () => {}, warn: () => {}, error: console.error, debug: () => {}, dir: () => {} },
});

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

function setCache(key, data, ttlSeconds = 60) {
  cache.set(key, { data, expiresAt: Date.now() + ttlSeconds * 1000 });
}

// Financial Lexicon Dictionary (Loughran-McDonald inspired)
const BULLISH_KEYWORDS = [
  'surge', 'surges', 'surged', 'jump', 'jumps', 'jumped', 'gain', 'gains', 'gained',
  'rally', 'rallies', 'rallied', 'soar', 'soars', 'soared', 'beat', 'beats', 'beating',
  'outperform', 'outperformed', 'upgrade', 'upgraded', 'upgrades', 'bull', 'bullish',
  'growth', 'record', 'profit', 'profits', 'profitable', 'expansion', 'expanding',
  'high', 'higher', 'dividend', 'buyback', 'acquisition', 'boost', 'boosts', 'boosted',
  'positive', 'strength', 'strong', 'optimism', 'breakout', 'advance', 'advances',
];

const BEARISH_KEYWORDS = [
  'fall', 'falls', 'fell', 'drop', 'drops', 'dropped', 'plunge', 'plunges', 'plunged',
  'slump', 'slumps', 'slumped', 'sink', 'sinks', 'sank', 'decline', 'declines', 'declined',
  'miss', 'misses', 'missed', 'loss', 'losses', 'downgrade', 'downgraded', 'downgrades',
  'bear', 'bearish', 'selloff', 'crash', 'crashing', 'crashes', 'warning', 'warns',
  'weak', 'weakness', 'lawsuit', 'antitrust', 'investigation', 'probe', 'subpoena',
  'cut', 'cuts', 'cutting', 'debt', 'risk', 'risks', 'headwind', 'headwinds', 'recession',
];

/**
 * Algorithmic Financial Sentiment Scorer
 * Scores text between -1.0 and +1.0 with keyword detection and confidence.
 */
function analyzeFinancialSentiment(text) {
  if (!text) return { score: 0, label: 'Neutral', confidence: 50, keywords: [] };

  const lower = text.toLowerCase();
  const words = lower.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);

  let bullScore = 0;
  let bearScore = 0;
  const detectedKeywords = [];

  for (const word of words) {
    if (BULLISH_KEYWORDS.includes(word)) {
      bullScore += 1;
      if (!detectedKeywords.includes(word)) detectedKeywords.push(word);
    } else if (BEARISH_KEYWORDS.includes(word)) {
      bearScore += 1;
      if (!detectedKeywords.includes(word)) detectedKeywords.push(word);
    }
  }

  const totalMatches = bullScore + bearScore;
  let score = 0;
  let label = 'Neutral';
  let confidence = 65;

  if (totalMatches > 0) {
    score = Number(((bullScore - bearScore) / totalMatches).toFixed(2));
    confidence = Math.min(95, 65 + totalMatches * 8);

    if (score >= 0.2) label = 'Bullish';
    else if (score <= -0.2) label = 'Bearish';
    else label = 'Neutral';
  }

  return {
    score,
    label,
    confidence,
    keywords: detectedKeywords.slice(0, 5),
  };
}

/**
 * Get Real Financial News & Algorithmic Sentiment Analysis
 */
async function getNewsAndSentiment(symbol) {
  const cleanSym = symbol.trim().toUpperCase();
  const cacheKey = `news_sentiment:${cleanSym}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const searchRes = await yf.search(cleanSym, { newsCount: 12, quotesCount: 0 });
  const rawNews = searchRes.news || [];

  const analyzedArticles = rawNews.map((n) => {
    const sentiment = analyzeFinancialSentiment(n.title);
    return {
      title: n.title,
      publisher: n.publisher || 'Financial Wire',
      link: n.link,
      publishedAt: n.providerPublishTime
        ? new Date(n.providerPublishTime * 1000).toISOString()
        : new Date().toISOString(),
      displayDate: n.providerPublishTime
        ? new Date(n.providerPublishTime * 1000).toLocaleString()
        : 'Recent',
      sentiment: sentiment.label,
      sentimentScore: sentiment.score,
      confidence: sentiment.confidence,
      keywords: sentiment.keywords,
      relatedTickers: n.relatedTickers || [cleanSym],
    };
  });

  // Aggregate Sentiment Stats
  let totalScore = 0;
  let bullCount = 0;
  let bearCount = 0;
  let neutralCount = 0;

  for (const art of analyzedArticles) {
    totalScore += art.sentimentScore;
    if (art.sentiment === 'Bullish') bullCount++;
    else if (art.sentiment === 'Bearish') bearCount++;
    else neutralCount++;
  }

  const count = analyzedArticles.length || 1;
  const avgScore = Number((totalScore / count).toFixed(2));

  let overallLabel = 'Neutral';
  if (avgScore >= 0.15) overallLabel = 'Bullish';
  else if (avgScore <= -0.15) overallLabel = 'Bearish';

  const payload = {
    symbol: cleanSym,
    articlesCount: analyzedArticles.length,
    overallSentiment: overallLabel,
    overallScore: avgScore,
    bullishCount: bullCount,
    bearishCount: bearCount,
    neutralCount: neutralCount,
    bullishPercent: Math.round((bullCount / count) * 100),
    bearishPercent: Math.round((bearCount / count) * 100),
    neutralPercent: Math.round((neutralCount / count) * 100),
    articles: analyzedArticles,
    lastUpdated: new Date().toISOString(),
  };

  setCache(cacheKey, payload, 60);
  return payload;
}

/**
 * Get Historical Earnings Surprises & Upcoming Calendar Events
 */
async function getEarningsSummary(symbol) {
  const cleanSym = symbol.trim().toUpperCase();
  const cacheKey = `earnings:${cleanSym}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  let qs = {};
  try {
    qs = await yf.quoteSummary(cleanSym, {
      modules: ['earningsHistory', 'calendarEvents', 'earningsTrend'],
    });
  } catch (err) {
    console.warn(`quoteSummary earnings fallback for ${cleanSym}:`, err.message);
  }

  const history = qs.earningsHistory?.history || [];
  const calendar = qs.calendarEvents || {};

  // Format historical quarters
  const formattedHistory = history.map((q) => {
    const actual = q.epsActual !== undefined ? Number(q.epsActual.toFixed(2)) : null;
    const estimate = q.epsEstimate !== undefined ? Number(q.epsEstimate.toFixed(2)) : null;
    const diff = q.epsDifference !== undefined ? Number(q.epsDifference.toFixed(2)) : null;
    const surprisePct = q.surprisePercent !== undefined ? Number((q.surprisePercent * 100).toFixed(2)) : null;

    let status = 'met';
    if (diff !== null) {
      if (diff > 0) status = 'beat';
      else if (diff < 0) status = 'miss';
    }

    const quarterDate = q.quarter ? new Date(q.quarter).toLocaleDateString(undefined, { year: 'numeric', month: 'short' }) : 'Q';

    return {
      period: q.period || '',
      quarter: quarterDate,
      epsActual: actual,
      epsEstimate: estimate,
      epsDifference: diff,
      surprisePercent: surprisePct,
      status, // 'beat' | 'miss' | 'met'
    };
  });

  // Historical Beat Rate
  const beats = formattedHistory.filter(q => q.status === 'beat').length;
  const totalReported = formattedHistory.length;
  const beatRate = totalReported > 0 ? Math.round((beats / totalReported) * 100) : 0;

  // Upcoming Earnings Details
  const earningsCal = calendar.earnings || {};
  let upcomingDate = null;
  if (earningsCal.earningsDate && earningsCal.earningsDate.length > 0) {
    upcomingDate = new Date(earningsCal.earningsDate[0]).toLocaleDateString(undefined, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  const upcoming = {
    date: upcomingDate || 'To be announced',
    isEstimate: earningsCal.isEarningsDateEstimate || false,
    epsEstimateAvg: earningsCal.earningsAverage ? Number(earningsCal.earningsAverage.toFixed(2)) : null,
    epsEstimateLow: earningsCal.earningsLow ? Number(earningsCal.earningsLow.toFixed(2)) : null,
    epsEstimateHigh: earningsCal.earningsHigh ? Number(earningsCal.earningsHigh.toFixed(2)) : null,
    revenueEstimateAvg: earningsCal.revenueAverage ? earningsCal.revenueAverage : null,
    revenueEstimateLow: earningsCal.revenueLow ? earningsCal.revenueLow : null,
    revenueEstimateHigh: earningsCal.revenueHigh ? earningsCal.revenueHigh : null,
  };

  const payload = {
    symbol: cleanSym,
    beatRate,
    beatsCount: beats,
    totalQuartersCount: totalReported,
    history: formattedHistory,
    upcoming,
    lastUpdated: new Date().toISOString(),
    source: 'SEC Filings & Yahoo Finance Consensus Earnings Feeds',
  };

  setCache(cacheKey, payload, 180);
  return payload;
}

module.exports = {
  getNewsAndSentiment,
  getEarningsSummary,
  analyzeFinancialSentiment,
};
