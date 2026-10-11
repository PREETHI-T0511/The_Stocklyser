import { describe, test, expect } from 'vitest';
import { analyzeSentimentScore, getNewsAndSentiment } from '../newsAndSentimentService.cjs';

describe('Financial News Sentiment Engine', () => {
  test('analyzeSentimentScore identifies bullish and bearish keywords', () => {
    const bullishHeadline = 'Company records strong profit growth and outperforms market';
    const bearishHeadline = 'Stock plunges as company misses quarterly revenue targets';

    expect(analyzeSentimentScore(bullishHeadline)).toBeGreaterThan(0);
    expect(analyzeSentimentScore(bearishHeadline)).toBeLessThan(0);
  });

  test('getNewsAndSentiment aggregates articles and output format', async () => {
    const result = await getNewsAndSentiment('AAPL');

    expect(result.symbol).toBe('AAPL');
    expect(result.articles.length).toBeGreaterThan(0);
    expect(typeof result.overallScore).toBe('number');
    expect(result.upcomingEarnings.reportDate).toBeDefined();
  });
});