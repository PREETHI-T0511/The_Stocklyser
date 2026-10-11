import React, { useState } from 'react';

export default function Backtester() {
  const [shortPeriod, setShortPeriod] = useState(5);
  const [longPeriod, setLongPeriod] = useState(20);
  const [initialCapital, setInitialCapital] = useState(10000);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleRunBacktest = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/backtest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shortPeriod: Number(shortPeriod), longPeriod: Number(longPeriod), initialCapital: Number(initialCapital) }),
      });
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error('Backtest request failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#181824', color: '#fff', borderRadius: '8px' }}>
      <h2>Historical Strategy Backtester</h2>
      
      <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <label>
          Fast SMA:
          <input 
            type="number" 
            value={shortPeriod} 
            onChange={(e) => setShortPeriod(e.target.value)} 
            style={{ marginLeft: '8px', width: '60px', padding: '4px' }}
          />
        </label>
        <label>
          Slow SMA:
          <input 
            type="number" 
            value={longPeriod} 
            onChange={(e) => setLongPeriod(e.target.value)} 
            style={{ marginLeft: '8px', width: '60px', padding: '4px' }}
          />
        </label>
        <label>
          Starting Cash ($):
          <input 
            type="number" 
            value={initialCapital} 
            onChange={(e) => setInitialCapital(e.target.value)} 
            style={{ marginLeft: '8px', width: '100px', padding: '4px' }}
          />
        </label>
        <button onClick={handleRunBacktest} disabled={loading} style={{ padding: '6px 16px', cursor: 'pointer' }}>
          {loading ? 'Running Simulation...' : 'Execute Backtest'}
        </button>
      </div>

      {results && (
        <div style={{ padding: '15px', backgroundColor: '#222235', borderRadius: '6px' }}>
          <h3>Performance Metrics</h3>
          <p>Final Portfolio Value: <strong>${results.finalValue}</strong></p>
          <p>Strategy Return: <strong style={{ color: results.totalReturnPercent >= 0 ? '#4caf50' : '#f44336' }}>{results.totalReturnPercent}%</strong></p>
          <p>Max Drawdown: <strong style={{ color: '#f44336' }}>{results.maxDrawdownPercent}%</strong></p>
          <p>Total Executed Trades: <strong>{results.totalTrades}</strong></p>
        </div>
      )}
    </div>
  );
}