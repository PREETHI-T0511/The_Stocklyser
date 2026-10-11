import React from 'react';
import { calculateSharpeRatio, calculateBeta, calculateValueAtRisk } from './riskCalculators';

export default function PortfolioRisk() {
  const portfolioValue = 100000;
  const sampleReturns = [0.012, -0.005, 0.018, -0.010, 0.008, 0.015, -0.003, 0.022];
  const benchmarkReturns = [0.008, -0.002, 0.012, -0.008, 0.005, 0.010, -0.001, 0.015];

  const sharpe = calculateSharpeRatio(sampleReturns);
  const beta = calculateBeta(sampleReturns, benchmarkReturns);
  const var95 = calculateValueAtRisk(portfolioValue, sampleReturns);

  return (
    <div style={{ padding: '20px', backgroundColor: '#1a1c23', color: '#fff', borderRadius: '8px' }}>
      <h2>Portfolio Risk & Volatility Analytics</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
        <div style={{ padding: '15px', backgroundColor: '#252836', borderRadius: '6px' }}>
          <small>Sharpe Ratio (Risk-Adjusted Return)</small>
          <h3 style={{ color: sharpe >= 1 ? '#4caf50' : '#ff9800' }}>{sharpe}</h3>
        </div>

        <div style={{ padding: '15px', backgroundColor: '#252836', borderRadius: '6px' }}>
          <small>Portfolio Beta (Volatility vs S&P 500)</small>
          <h3>{beta}</h3>
        </div>

        <div style={{ padding: '15px', backgroundColor: '#252836', borderRadius: '6px' }}>
          <small>1-Day Value at Risk (95% Confidence)</small>
          <h3 style={{ color: '#f44336' }}>-${var95}</h3>
        </div>
      </div>
    </div>
  );
}