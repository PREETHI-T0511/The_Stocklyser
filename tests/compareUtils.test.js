import { describe, test, expect } from 'vitest';
import { normalizeStockPrices, calculateSectorHeatmap } from '../compareUtils';

describe('Multi-Stock Comparison & Heatmap Utilities', () => {
  test('normalizeStockPrices correctly calculates percentage growth from t=0', () => {
    const rawData = [
      { time: '2026-01-01', close: 100 },
      { time: '2026-01-02', close: 110 },
      { time: '2026-01-03', close: 90 },
    ];

    const normalized = normalizeStockPrices(rawData);

    expect(normalized[0].percentageChange).toBe(0);
    expect(normalized[1].percentageChange).toBe(10);
    expect(normalized[2].percentageChange).toBe(-10);
  });

  test('calculateSectorHeatmap groups assets and sums totals accurately', () => {
    const stocks = [
      { symbol: 'A', sector: 'Tech', changePercent: 2 },
      { symbol: 'B', sector: 'Tech', changePercent: 4 },
      { symbol: 'C', sector: 'Energy', changePercent: -3 },
    ];

    const heatmap = calculateSectorHeatmap(stocks);

    expect(heatmap['Tech'].count).toBe(2);
    expect(heatmap['Tech'].totalChange).toBe(6);
    expect(heatmap['Energy'].count).toBe(1);
  });
});