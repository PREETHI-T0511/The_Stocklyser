import { describe, test, expect } from 'vitest';
import { generateGroundedResearch } from '../aiResearchService.cjs';

describe('AI Stock Research Assistant Grounding Suite', () => {
  test('generateGroundedResearch returns facts and interpretations', async () => {
    const report = await generateGroundedResearch('AAPL', 'Valuation review');

    expect(report.symbol).toBe('AAPL');
    expect(report.facts.length).toBeGreaterThan(0);
    expect(report.interpretations.length).toBeGreaterThan(0);
  });

  test('report includes mandatory financial advice disclaimer', async () => {
    const report = await generateGroundedResearch('MSFT', 'Earnings update');
    expect(report.disclaimer).toContain('do not constitute financial advice');
  });
});