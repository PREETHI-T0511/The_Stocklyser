#!/usr/bin/env node
/**
 * test-feature4.js  — Feature 4: News Sentiment & Earnings
 * Run: node test-feature4.js
 */

import('./newsAndSentimentService.cjs').then(async (mod) => {
  const { getNewsAndSentiment, getEarningsSummary, analyzeFinancialSentiment } = mod;

  let passed = 0;
  let failed = 0;

  function assert(condition, label) {
    if (condition) {
      console.log(`  ✅ PASS: ${label}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${label}`);
      failed++;
    }
  }

  // ── Test 1: Pure NLP scorer ──────────────────────────────────────────────
  console.log('\n── Test 1: analyzeFinancialSentiment (pure scorer) ──');
  const bull = analyzeFinancialSentiment('Tesla surges to record gains beating estimates');
  console.log('  Bullish result:', JSON.stringify(bull));
  assert(bull.label === 'Bullish', `Bullish phrase → label Bullish (got ${bull.label})`);
  assert(typeof bull.score === 'number', 'score is a number');
  assert(bull.confidence >= 0 && bull.confidence <= 100, 'confidence 0-100');

  const bear = analyzeFinancialSentiment('Apple plunges on earnings miss amid selloff and losses');
  console.log('  Bearish result:', JSON.stringify(bear));
  assert(bear.label === 'Bearish', `Bearish phrase → label Bearish (got ${bear.label})`);

  const neutral = analyzeFinancialSentiment('The company released its quarterly report today.');
  console.log('  Neutral result:', JSON.stringify(neutral));
  assert(['Neutral', 'Bullish', 'Bearish'].includes(neutral.label), `Neutral phrase → valid label (got ${neutral.label})`);

  // ── Test 2: Live news & sentiment (AAPL) ─────────────────────────────────
  console.log('\n── Test 2: getNewsAndSentiment("AAPL") ──');
  try {
    const news = await getNewsAndSentiment('AAPL');
    console.log(`  Articles: ${news.articles?.length}`);
    console.log(`  Overall: ${news.overallSentiment} (score: ${news.sentimentScore?.toFixed(2)})`);
    assert(Array.isArray(news.articles) && news.articles.length >= 1, `≥1 articles returned (got ${news.articles?.length})`);
    assert(['Bullish', 'Neutral', 'Bearish'].includes(news.overallSentiment),
      `overallSentiment is valid (got ${news.overallSentiment})`);
    assert(typeof news.overallScore === 'number', 'overallScore is a number');
    assert(typeof news.bullishPercent === 'number', 'bullishPercent is a number');
    assert(typeof news.bearishPercent === 'number', 'bearishPercent is a number');
    assert(typeof news.neutralPercent === 'number', 'neutralPercent is a number');
    assert(news.symbol === 'AAPL', 'symbol preserved in response');
    if (news.articles.length > 0) {
      const a = news.articles[0];
      assert(typeof a.title === 'string' && a.title.length > 0, 'article has title');
      assert(typeof a.sentiment === 'string', 'article has sentiment field');
    }
  } catch (err) {
    console.error('  Error fetching AAPL news:', err.message);
    failed++;
  }

  // ── Test 3: Live news & sentiment (NVDA) ─────────────────────────────────
  console.log('\n── Test 3: getNewsAndSentiment("NVDA") ──');
  try {
    const nvdaNews = await getNewsAndSentiment('NVDA');
    console.log(`  NVDA Articles: ${nvdaNews.articles?.length}, Sentiment: ${nvdaNews.overallSentiment}`);
    assert(Array.isArray(nvdaNews.articles), 'NVDA articles is array');
    assert(['Bullish', 'Neutral', 'Bearish'].includes(nvdaNews.overallSentiment), 'NVDA sentiment valid');
  } catch (err) {
    console.error('  Error fetching NVDA news:', err.message);
    failed++;
  }

  // ── Test 4: Earnings summary (AAPL) ──────────────────────────────────────
  console.log('\n── Test 4: getEarningsSummary("AAPL") ──');
  try {
    const earnings = await getEarningsSummary('AAPL');
    console.log(`  Quarters: ${earnings.history?.length}`);
    console.log(`  Beat rate: ${earnings.beatRate}%`);
    console.log(`  Upcoming: ${JSON.stringify(earnings.upcoming)}`);
    assert(typeof earnings.symbol === 'string', 'earnings symbol present');
    assert(Array.isArray(earnings.history), 'history is an array');
    assert(earnings.history.length >= 1, `≥1 historical quarters (got ${earnings.history.length})`);
    assert(typeof earnings.beatRate === 'number' && earnings.beatRate >= 0 && earnings.beatRate <= 100,
      `beatRate is 0-100 (got ${earnings.beatRate})`);
    assert(typeof earnings.upcoming === 'object', 'upcoming is an object');
  } catch (err) {
    console.error('  Error fetching AAPL earnings:', err.message);
    failed++;
  }

  // ── Test 5: Earnings summary (MSFT) ──────────────────────────────────────
  console.log('\n── Test 5: getEarningsSummary("MSFT") ──');
  try {
    const msftEarnings = await getEarningsSummary('MSFT');
    console.log(`  MSFT quarters: ${msftEarnings.history?.length}, beat rate: ${msftEarnings.beatRate}%`);
    assert(Array.isArray(msftEarnings.history), 'MSFT history is array');
    assert(typeof msftEarnings.beatRate === 'number', 'MSFT beatRate is number');
  } catch (err) {
    console.error('  Error fetching MSFT earnings:', err.message);
    failed++;
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log(`\n════ Feature 4 Test Results: ${passed} passed, ${failed} failed ════`);
  if (failed > 0) process.exit(1);
});
