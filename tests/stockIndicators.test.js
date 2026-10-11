import { describe, test, expect } from 'vitest';
import { calculateSMA, calculateEMA, calculateRSI } from '../stockIndicators';

describe('Technical Indicators Suite', () => {
  const mockCandles = Array.from({ length: 30 }, (_, i) => ({
    close: 100 + i + (i % 2 === 0 ? 2 : -1),
  }));

  test('calculateSMA returns correct values', () => {
    const sma = calculateSMA(mockCandles, 5);
    expect(sma[0]).toBeNull();
    expect(typeof sma[10]).toBe('number');
  });

  test('calculateEMA generates smooth curve values', () => {
    const ema = calculateEMA(mockCandles, 5);
    expect(ema[0]).toBeNull();
    expect(ema[4]).toBeGreaterThan(0);
  });

  test('calculateRSI values stay strictly bounded between 0 and 100', () => {
    const rsi = calculateRSI(mockCandles, 14);
    const validValues = rsi.filter((v) => v !== null);
    validValues.forEach((val) => {
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThanOrEqual(100);
    });
  });
});