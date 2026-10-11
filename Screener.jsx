import React, { useState } from 'react';
import { filterStocks, evaluateAlerts } from './screenerService';

const SAMPLE_UNIVERSE = [
  { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology', peRatio: 28.5, marketCap: 2800, rsi: 58.4, price: 175.5 },
  { symbol: 'MSFT', name: 'Microsoft Corp.', sector: 'Technology', peRatio: 32.1, marketCap: 2500, rsi: 42.1, price: 330.2 },
  { symbol: 'JPM', name: 'JPMorgan Chase', sector: 'Financials', peRatio: 11.4, marketCap: 450, rsi: 28.6, price: 145.0 },
  { symbol: 'XOM', name: 'Exxon Mobil', sector: 'Energy', peRatio: 9.8, marketCap: 400, rsi: 72.3, price: 108.4 },
];

export default function Screener() {
  const [maxPE, setMaxPE] = useState(30);
  const [sector, setSector] = useState('ALL');
  const [alerts, setAlerts] = useState([
    { id: '1', symbol: 'JPM', condition: 'BELOW', targetPrice: 150.0 },
  ]);

  const filtered = filterStocks(SAMPLE_UNIVERSE, { maxPE, sector });
  const evaluatedAlerts = evaluateAlerts(alerts, { JPM: 145.0, AAPL: 175.5 });

  return (
    <div style={{ padding: '20px', backgroundColor: '#181b2a', color: '#fff', borderRadius: '8px' }}>
      <h2>Stock Screener & Alert Manager</h2>

      <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', backgroundColor: '#22273b', padding: '15px', borderRadius: '6px' }}>
        <label>
          Max P/E:
          <input type="number" value={maxPE} onChange={(e) => setMaxPE(e.target.value)} style={{ marginLeft: '8px', width: '70px', padding: '4px' }} />
        </label>
        <label>
          Sector:
          <select value={sector} onChange={(e) => setSector(e.target.value)} style={{ marginLeft: '8px', padding: '4px' }}>
            <option value="ALL">All Sectors</option>
            <option value="Technology">Technology</option>
            <option value="Financials">Financials</option>
            <option value="Energy">Energy</option>
          </select>
        </label>
      </div>

      <h3>Filtered Universe ({filtered.length} matches)</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '25px' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '1px solid #444' }}>
            <th>Symbol</th><th>Name</th><th>Sector</th><th>P/E</th><th>Market Cap ($B)</th><th>RSI</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((s) => (
            <tr key={s.symbol} style={{ borderBottom: '1px solid #333' }}>
              <td>{s.symbol}</td><td>{s.name}</td><td>{s.sector}</td><td>{s.peRatio}</td><td>${s.marketCap}B</td><td>{s.rsi}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Active Price Alerts</h3>
      {evaluatedAlerts.map((a) => (
        <div key={a.id} style={{ padding: '10px', backgroundColor: a.triggered ? '#4a1525' : '#1d2238', borderRadius: '4px', marginBottom: '8px' }}>
          <strong>{a.symbol}</strong> when price is {a.condition} ${a.targetPrice} | Current: ${a.currentPrice} 
          {a.triggered && <span style={{ color: '#ff4d6d', marginLeft: '10px', fontWeight: 'bold' }}>[ALERT TRIGGERED]</span>}
        </div>
      ))}
    </div>
  );
}