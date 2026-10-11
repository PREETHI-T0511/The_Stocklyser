import React, { useState } from 'react';
import { normalizeStockPrices, calculateSectorHeatmap } from './compareUtils';

const SAMPLE_SECTOR_DATA = [
  { symbol: 'AAPL', name: 'Apple', sector: 'Technology', changePercent: 1.85 },
  { symbol: 'MSFT', name: 'Microsoft', sector: 'Technology', changePercent: -0.42 },
  { symbol: 'NVDA', name: 'NVIDIA', sector: 'Technology', changePercent: 3.12 },
  { symbol: 'JPM', name: 'JPMorgan', sector: 'Financials', changePercent: 0.75 },
  { symbol: 'BAC', name: 'Bank of America', sector: 'Financials', changePercent: -1.10 },
  { symbol: 'XOM', name: 'ExxonMobil', sector: 'Energy', changePercent: -2.30 },
  { symbol: 'CVX', name: 'Chevron', sector: 'Energy', changePercent: -1.80 },
];

export default function CompareAndHeatmap() {
  const [activeTab, setActiveTab] = useState('heatmap');
  const groupedSectors = calculateSectorHeatmap(SAMPLE_SECTOR_DATA);

  return (
    <div style={{ padding: '20px', color: '#fff', backgroundColor: '#121212', borderRadius: '8px' }}>
      <h2>Market Comparisons & Sector Heatmap</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={() => setActiveTab('heatmap')} 
          style={{ marginRight: '10px', padding: '8px 16px', cursor: 'pointer' }}
        >
          Sector Heatmap
        </button>
      </div>

      {activeTab === 'heatmap' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
          {Object.entries(groupedSectors).map(([sectorName, data]) => {
            const avgChange = (data.totalChange / data.count).toFixed(2);
            const isPositive = avgChange >= 0;

            return (
              <div 
                key={sectorName} 
                style={{
                  padding: '15px',
                  borderRadius: '6px',
                  backgroundColor: isPositive ? '#1b4332' : '#4a0e17',
                  border: `1px solid ${isPositive ? '#2d6a4f' : '#800f2f'}`
                }}
              >
                <h3>{sectorName}</h3>
                <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                  {isPositive ? `+${avgChange}%` : `${avgChange}%`}
                </p>
                <hr style={{ borderColor: '#444' }} />
                {data.stocks.map((s) => (
                  <div key={s.symbol} style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
                    <span>{s.symbol}</span>
                    <span style={{ color: s.changePercent >= 0 ? '#52b788' : '#ff4d6d' }}>
                      {s.changePercent >= 0 ? `+${s.changePercent}%` : `${s.changePercent}%`}
                    </span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}