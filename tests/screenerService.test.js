import { describe, test, expect } from 'vitest';
import { filterStocks, evaluateAlerts } from '../screenerService';

describe('Screener & Alert Service Suite', () => {
  const mockUniverse = [
    { symbol: 'AAPL', sector: 'Tech', peRatio: 25, rsi: 50 },
    { symbol: 'XOM', sector: 'Energy', peRatio: 10, rsi: 70 },
  ];

  test('filterStocks filters by maximum P/E and sector accurately', () => {
    const techOnly = filterStocks(mockUniverse, { sector: 'Tech' });
    expect(techOnly.length).toBe(1);
    expect(techOnly[0].symbol).toBe('AAPL');

    const lowPE = filterStocks(mockUniverse, { maxPE: 15 });
    expect(lowPE.length).toBe(1);
    expect(lowPE[0].symbol).toBe('XOM');
  });

  test('evaluateAlerts triggers when price threshold condition is met', () => {
    const alerts = [{ symbol: 'AAPL', condition: 'ABOVE', targetPrice: 170 }];
    const evaluated = evaluateAlerts(alerts, { AAPL: 175 });

    expect(evaluated[0].triggered).toBe(true);
    expect(evaluated[0].triggeredAt).not.toBeNull();
  });
});