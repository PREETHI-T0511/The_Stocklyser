/**
 * Calculates a normalized sentiment score between -1.0 (Bearish) and +1.0 (Bullish)
 */
function analyzeSentimentScore(headline) {
  const bullishKeywords = ['surges', 'beats', 'outperforms', 'growth', 'record', 'profit', 'upgraded'];
  const bearishKeywords = ['plunges', 'misses', 'decline', 'drop', 'loss', 'downgraded', 'lawsuit'];

  const lowerHeadline = headline.toLowerCase();
  let score = 0;

  bullishKeywords.forEach((word) => {
    if (lowerHeadline.includes(word)) score += 0.3;
  });

  bearishKeywords.forEach((word) => {
    if (lowerHeadline.includes(word)) score -= 0.3;
  });

  // Clamp score between -1.0 and 1.0
  return parseFloat(Math.max(-1.0, Math.min(1.0, score)).toFixed(2));
}

/**
 * Fetches recent news and calculates sentiment scores along with earnings summaries
 */
async function getNewsAndSentiment(symbol) {
  const cleanSymbol = symbol.toUpperCase();

  const mockNews = [
    {
      id: 1,
      headline: `${cleanSymbol} Q3 earnings report beats analyst estimates with record revenue growth`,
      source: 'Financial Times',
      publishedAt: '2026-10-10',
    },
    {
      id: 2,
      headline: `Analysts maintain buy rating on ${cleanSymbol} following upgraded price target`,
      source: 'Wall Street Journal',
      publishedAt: '2026-10-09',
    },
    {
      id: 3,
      headline: `Tech sector faces pressure as macro uncertainties create short-term drop`,
      source: 'Bloomberg',
      publishedAt: '2026-10-08',
    },
  ];

  const processedNews = mockNews.map((item) => ({
    ...item,
    sentimentScore: analyzeSentimentScore(item.headline),
    sentimentLabel:
      analyzeSentimentScore(item.headline) > 0.1
        ? 'Bullish'
        : analyzeSentimentScore(item.headline) < -0.1
        ? 'Bearish'
        : 'Neutral',
  }));

  const overallScore = parseFloat(
    (
      processedNews.reduce((acc, curr) => acc + curr.sentimentScore, 0) /
      processedNews.length
    ).toFixed(2)
  );

  return {
    symbol: cleanSymbol,
    overallSentiment: overallScore > 0.1 ? 'Bullish' : overallScore < -0.1 ? 'Bearish' : 'Neutral',
    overallScore,
    articles: processedNews,
    upcomingEarnings: {
      reportDate: '2026-10-28',
      estimatedEPS: '$1.45',
      previousEPS: '$1.32',
    },
  };
}

module.exports = { analyzeSentimentScore, getNewsAndSentiment };