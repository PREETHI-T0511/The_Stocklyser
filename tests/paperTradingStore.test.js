import { describe, test, expect, beforeEach } from 'vitest';
import { PaperAccount } from '../paperTradingStore';

describe('Paper Trading Engine Suite', () => {
  let account;

  beforeEach(() => {
    account = new PaperAccount(100000);
  });

  test('executes BUY market order and reduces cash balance', () => {
    account.placeOrder({ symbol: 'AAPL', type: 'MARKET', side: 'BUY', shares: 10, currentPrice: 150 });

    const summary = account.getPortfolioSummary({ AAPL: 150 });
    expect(summary.cash).toBe(98500);
    expect(summary.positions['AAPL'].shares).toBe(10);
  });

  test('prevents BUY order when cash is insufficient', () => {
    expect(() => {
      account.placeOrder({ symbol: 'GOOGL', type: 'MARKET', side: 'BUY', shares: 1000, currentPrice: 150 });
    }).toThrow('Insufficient virtual funds available');
  });

  test('executes SELL market order and realizes cash proceeds', () => {
    account.placeOrder({ symbol: 'AAPL', type: 'MARKET', side: 'BUY', shares: 10, currentPrice: 150 });
    account.placeOrder({ symbol: 'AAPL', type: 'MARKET', side: 'SELL', shares: 5, currentPrice: 160 });

    const summary = account.getPortfolioSummary({ AAPL: 160 });
    expect(summary.cash).toBe(98500 + 800);
    expect(summary.positions['AAPL'].shares).toBe(5);
  });
});