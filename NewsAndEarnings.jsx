import React, { useState, useEffect } from 'react';

export default function NewsAndEarnings({ symbol = 'AAPL' }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchSentiment() {
      setLoading(true);
      try {
        const res = await fetch(`/api/news/sentiment?symbol=${symbol}`);
        const result = await res.json();
        setData(result);
      } catch (err) {
        console.error('Error loading news sentiment:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchSentiment();
  }, [symbol]);

  if (loading) return <p style={{ color: '#fff' }}>Loading news & sentiment data...</p>;
  if (!data) return null;

  return (
    <div style={{ padding: '20px', backgroundColor: '#1e1e2f', color: '#fff', borderRadius: '8px' }}>
      <h2>News Sentiment & Earnings Summary ({data.symbol})</h2>

      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#2a2a40', borderRadius: '6px' }}>
        <h3>Overall Sentiment Score: {data.overallScore} ({data.overallSentiment})</h3>
        <p>
          Upcoming Earnings Report Date: <strong>{data.upcomingEarnings.reportDate}</strong> | Est. EPS:{' '}
          <strong>{data.upcomingEarnings.estimatedEPS}</strong>
        </p>
      </div>

      <h3>Recent Headlines</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {data.articles.map((item) => (
          <div
            key={item.id}
            style={{
              padding: '12px',
              backgroundColor: '#27293d',
              borderRadius: '6px',
              borderLeft: `5px solid ${
                item.sentimentLabel === 'Bullish'
                  ? '#00f2c3'
                  : item.sentimentLabel === 'Bearish'
                  ? '#ff8d72'
                  : '#e14eca'
              }`,
            }}
          >
            <p style={{ margin: 0, fontWeight: 'bold' }}>{item.headline}</p>
            <small style={{ color: '#888' }}>
              {item.source} • {item.publishedAt} | Sentiment: {item.sentimentLabel} ({item.sentimentScore})
            </small>
          </div>
        ))}
      </div>
    </div>
  );
}