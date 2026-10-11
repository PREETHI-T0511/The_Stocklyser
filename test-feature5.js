#!/usr/bin/env node
/**
 * test-feature5.js  — Feature 5: Historical Strategy Backtesting
 * Run: node test-feature5.js
 */

import('./backtestService.cjs').then(async ({ runBacktest }) => {
  let passed = 0, failed = 0;

  function assert(condition, label) {
    if (condition) { console.log(`  ✅ PASS: ${label}`); passed++; }
    else { console.error(`  ❌ FAIL: ${label}`); failed++; }
  }

  // ── Test 1: Buy & Hold (simplest, always works) ────────────────────────────
  console.log('\n── Test 1: Buy & Hold — AAPL 1y ──');
  try {
    const r = await runBacktest({ symbol: 'AAPL', strategy: 'buyAndHold', range: '1y' });
    console.log(`  Return: ${r.totalReturn}%  |  CAGR: ${r.cagr}%  |  Sharpe: ${r.sharpe}`);
    console.log(`  Benchmark SPY return: ${r.benchmark.totalReturn}%`);
    assert(r.symbol === 'AAPL', 'symbol correct');
    assert(r.strategy === 'buyAndHold', 'strategy echoed');
    assert(typeof r.totalReturn === 'number', 'totalReturn is a number');
    assert(typeof r.cagr === 'number', 'cagr is a number');
    assert(typeof r.sharpe === 'number', 'sharpe is a number');
    assert(r.maxDrawdown >= 0, `maxDrawdown ≥0 (got ${r.maxDrawdown})`);
    assert(typeof r.benchmark.totalReturn === 'number', 'benchmark totalReturn is number');
    assert(Array.isArray(r.equityCurve) && r.equityCurve.length > 0, 'equityCurve non-empty');
    assert(Array.isArray(r.benchmark.equityCurve), 'benchmark equityCurve present');
    assert(r.dataPoints >= 200, `≥200 trading days returned (got ${r.dataPoints})`);
    assert(r.initialCapital === 10000, 'default capital 10000');
    assert(r.finalEquity > 0, `finalEquity >0 (got ${r.finalEquity})`);
    assert(r.commissionTotal >= 0, 'commissions ≥0');
    assert(r.disclaimer.length > 10, 'disclaimer present');
    // Buy & Hold: exactly 1 buy trade
    assert(r.trades.length === 1 || r.trades.length === 2, `B&H has 1-2 trades (got ${r.trades.length})`);
  } catch (err) {
    console.error('  Error:', err.message);
    failed++;
  }

  // ── Test 2: SMA Crossover — MSFT 2y ───────────────────────────────────────
  console.log('\n── Test 2: SMA Crossover — MSFT 2y ──');
  try {
    const r = await runBacktest({
      symbol: 'MSFT',
      strategy: 'smaCrossover',
      range: '2y',
      params: { shortPeriod: 20, longPeriod: 50 },
    });
    console.log(`  Return: ${r.totalReturn}%  |  Trades: ${r.trades.length}  |  Commission: $${r.commissionTotal}`);
    assert(r.symbol === 'MSFT', 'symbol correct');
    assert(typeof r.winRate === 'number' && r.winRate >= 0 && r.winRate <= 100,
      `winRate 0-100 (got ${r.winRate})`);
    assert(r.commissionTotal > 0, 'commissions deducted');
    assert(r.totalTrades === r.trades.length, 'totalTrades matches trades array');
    // equity curve must start near initialCapital
    const firstEquity = r.equityCurve[0]?.equity;
    assert(firstEquity >= 9000 && firstEquity <= 11000, `equity curve starts near $10k (got ${firstEquity})`);
  } catch (err) {
    console.error('  Error:', err.message);
    failed++;
  }

  // ── Test 3: RSI Mean-Reversion — NVDA 2y ─────────────────────────────────
  console.log('\n── Test 3: RSI Mean-Reversion — NVDA 2y ──');
  try {
    const r = await runBacktest({
      symbol: 'NVDA',
      strategy: 'rsiMeanReversion',
      range: '2y',
      params: { period: 14, oversold: 30, overbought: 70 },
    });
    console.log(`  Return: ${r.totalReturn}%  |  Trades: ${r.trades.length}`);
    assert(typeof r.totalReturn === 'number', 'RSI return is number');
    assert(r.equityCurve.length > 200, 'RSI equity curve has >200 points');
  } catch (err) {
    console.error('  Error:', err.message);
    failed++;
  }

  // ── Test 4: No future-data leakage sanity check ───────────────────────────
  console.log('\n── Test 4: Custom commission & slippage deducted ──');
  try {
    const cheap = await runBacktest({
      symbol: 'AAPL', strategy: 'buyAndHold', range: '1y',
      commissionFlat: 0, commissionPct: 0, slippagePct: 0,
    });
    const expensive = await runBacktest({
      symbol: 'AAPL', strategy: 'buyAndHold', range: '1y',
      commissionFlat: 10, commissionPct: 0.01, slippagePct: 0.01,
    });
    console.log(`  Cheap commissions final: $${cheap.finalEquity}  |  Expensive: $${expensive.finalEquity}`);
    assert(cheap.finalEquity >= expensive.finalEquity, 'Higher costs → lower returns (sanity check)');
  } catch (err) {
    console.error('  Error:', err.message);
    failed++;
  }

  // ── Test 5: Input validation ───────────────────────────────────────────────
  console.log('\n── Test 5: Input validation ──');
  try {
    await runBacktest({ symbol: '', strategy: 'buyAndHold', range: '1y' });
    console.error('  ❌ FAIL: should have thrown for empty symbol');
    failed++;
  } catch {
    console.log('  ✅ PASS: throws for empty symbol');
    passed++;
  }
  try {
    await runBacktest({ symbol: 'AAPL', strategy: 'invalidStrategy', range: '1y' });
    console.error('  ❌ FAIL: should have thrown for invalid strategy');
    failed++;
  } catch {
    console.log('  ✅ PASS: throws for invalid strategy');
    passed++;
  }
  try {
    await runBacktest({ symbol: 'AAPL', strategy: 'buyAndHold', range: 'badRange' });
    console.error('  ❌ FAIL: should have thrown for invalid range');
    failed++;
  } catch {
    console.log('  ✅ PASS: throws for invalid range');
    passed++;
  }

  console.log(`\n════ Feature 5 Test Results: ${passed} passed, ${failed} failed ════`);
  if (failed > 0) process.exit(1);
});
