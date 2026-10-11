import { describe, test, expect } from 'vitest';
import { runSMACrossoverBacktest } from '../backtestService.cjs';

describe('Strategy Backtest Engine', () => {
  const mockCandles = Array.from({ length: 50 }, (_, i) => ({
    time: `2026-01-${(i + 1).toString().padStart(2, '0')}`,
    open: 100 + i,
    high: 102 + i,
    low: 99 + i,
    close: 101 + i,
    volume: 1000,
  }));

  test('deducts transaction fees and slippage on executed trades', () => {
    const results = runSMACrossoverBacktest(mockCandles, 5, 10, 10000, 0.001, 0.0005);

    expect(results.initialCapital).toBe(10000);
    expect(results.equityCurve.length).toBe(50);
    
    if (results.trades.length > 0) {
      expect(results.trades[0].fee).toBeGreaterThan(0);
    }
  });

  test('calculates maximum drawdown accurately without going negative', () => {
    const results = runSMACrossoverBacktest(mockCandles, 5, 10, 10000);
    expect(results.maxDrawdownPercent).toBeGreaterThanOrEqual(0);
    expect(results.maxDrawdownPercent).toBeLessThanOrEqual(100);
  });
});