import React, { useState } from 'react';
import { PaperAccount } from './paperTradingStore';

const globalAccount = new PaperAccount(100000);

export default function PaperTrading() {
  const [symbol, setSymbol] = useState('AAPL');
  const [shares, setShares] = useState(10);
  const [orderType, setOrderType] = useState('MARKET');
  const [side, setSide] = useState('BUY');
  const [limitPrice, setLimitPrice] = useState(180);
  const [currentPrice] = useState(175.50);
  const [summary, setSummary] = useState(globalAccount.getPortfolioSummary({ AAPL: 175.50 }));
  const [error, setError] = useState('');

  const handlePlaceOrder = (e) => {
    e.preventDefault();
    setError('');
    try {
      globalAccount.placeOrder({
        symbol,
        type: orderType,
        side,
        shares: Number(shares),
        limitPrice: Number(limitPrice),
        currentPrice,
      });
      setSummary(globalAccount.getPortfolioSummary({ [symbol]: currentPrice }));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#141e30', color: '#fff', borderRadius: '8px' }}>
      <h2>Paper Trading Simulator</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', marginBottom: '20px' }}>
        <div style={{ backgroundColor: '#243b55', padding: '15px', borderRadius: '6px' }}>
          <small>Virtual Cash</small>
          <h3>${summary.cash}</h3>
        </div>
        <div style={{ backgroundColor: '#243b55', padding: '15px', borderRadius: '6px' }}>
          <small>Total Equity</small>
          <h3>${summary.totalEquity}</h3>
        </div>
        <div style={{ backgroundColor: '#243b55', padding: '15px', borderRadius: '6px' }}>
          <small>Total Profit / Loss</small>
          <h3 style={{ color: summary.totalPnl >= 0 ? '#4caf50' : '#f44336' }}>
            ${summary.totalPnl} ({summary.totalPnlPercent}%)
          </h3>
        </div>
      </div>

      {error && <div style={{ color: '#f44336', marginBottom: '15px' }}>{error}</div>}

      <form onSubmit={handlePlaceOrder} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <input value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} placeholder="Ticker" style={{ padding: '8px' }} />
        <input type="number" value={shares} onChange={(e) => setShares(e.target.value)} placeholder="Shares" style={{ padding: '8px' }} />
        <select value={side} onChange={(e) => setSide(e.target.value)} style={{ padding: '8px' }}>
          <option value="BUY">BUY</option>
          <option value="SELL">SELL</option>
        </select>
        <select value={orderType} onChange={(e) => setOrderType(e.target.value)} style={{ padding: '8px' }}>
          <option value="MARKET">MARKET</option>
          <option value="LIMIT">LIMIT</option>
        </select>
        {orderType === 'LIMIT' && (
          <input type="number" value={limitPrice} onChange={(e) => setLimitPrice(e.target.value)} placeholder="Limit Price" style={{ padding: '8px' }} />
        )}
        <button type="submit" style={{ padding: '8px 20px', cursor: 'pointer', backgroundColor: side === 'BUY' ? '#4caf50' : '#f44336', color: '#fff', border: 'none' }}>
          Submit {side} Order
        </button>
      </form>

      <h3>Open Positions</h3>
      <ul>
        {Object.entries(summary.positions).map(([sym, pos]) => (
          <li key={sym}>{sym}: {pos.shares} shares @ Avg Price ${pos.avgPrice}</li>
        ))}
      </ul>
    </div>
  );
}