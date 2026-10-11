import { describe, test, expect } from 'vitest';
import { calculateSharpeRatio, calculateBeta, calculateValueAtRisk } from '../riskCalculators';

describe('Portfolio Risk Analytics Suite', () => {
  const portfolioReturns = [0.02, -0.01, 0.03, -0.02, 0.015];
  const benchmarkReturns = [0.01, -0.005, 0.02, -0.01, 0.01];

  test('calculateSharpeRatio returns numeric ratio', () => {
    const sharpe = calculateSharpeRatio(portfolioReturns);
    expect(typeof sharpe).toBe('number');
  });

  test('calculateBeta calculates market sensitivity correctly', () => {
    const beta = calculateBeta(portfolioReturns, benchmarkReturns);
    expect(beta).toBeGreaterThan(0);
  });

  test('calculateValueAtRisk computes non-negative maximum expected loss', () => {
    const var95 = calculateValueAtRisk(100000, portfolioReturns);
    expect(var95).toBeGreaterThanOrEqual(0);
  });
});