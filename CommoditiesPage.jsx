import React, { useState } from 'react';
import GoldDashboard from './GoldDashBoard';
import SilverDashboard from './SilverDashBoard';
import BitcoinDashboard from './BitcoinDashboard';

export default function CommoditiesPage() {
  const [activeAsset, setActiveAsset] = useState('gold');

  const assets = [
    { id: 'gold', name: 'Gold (XAU)', icon: '🪙', color: '#eab308' },
    { id: 'silver', name: 'Silver (XAG)', icon: '🥈', color: '#94a3b8' },
    { id: 'bitcoin', name: 'Bitcoin (BTC)', icon: '₿', color: '#f97316' },
  ];

  return (
    <div style={{
      minHeight: 'calc(100vh - 80px)',
      backgroundColor: '#0f172a',
      color: '#f8fafc',
      padding: '100px 24px 60px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '2.4rem', fontWeight: 800, margin: '0 0 10px' }}>
            Precious Metals & Digital Assets
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '1.05rem', margin: 0 }}>
            Real-time spot price monitoring and live tick chart tracking.
          </p>
        </div>

        {/* Tab Controls */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '12px',
          marginBottom: '32px'
        }}>
          {assets.map(asset => (
            <button
              key={asset.id}
              onClick={() => setActiveAsset(asset.id)}
              style={{
                backgroundColor: activeAsset === asset.id ? asset.color : '#1e293b',
                color: activeAsset === asset.id ? '#0f172a' : '#f8fafc',
                border: '1px solid #334155',
                borderRadius: '10px',
                padding: '10px 24px',
                fontSize: '1rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {asset.icon} {asset.name}
            </button>
          ))}
        </div>

        {/* Active Asset Dashboard Container */}
        <div style={{
          backgroundColor: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)'
        }}>
          {activeAsset === 'gold' && <GoldDashboard />}
          {activeAsset === 'silver' && <SilverDashboard />}
          {activeAsset === 'bitcoin' && <BitcoinDashboard />}
        </div>
      </div>
    </div>
  );
}
