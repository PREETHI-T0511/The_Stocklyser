import React, { useState } from 'react';

export default function AIResearchAssistant() {
  const [symbol, setSymbol] = useState('AAPL');
  const [query, setQuery] = useState('What are the key valuation drivers?');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);

  const handleResearch = async () => {
    setLoading(true);
    setReport(null);
    try {
      const res = await fetch('/api/ai/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, query })
      });
      const data = await res.json();
      setReport(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', color: '#fff', backgroundColor: '#1a1a2e', borderRadius: '8px' }}>
      <h2>AI Stock Research Assistant</h2>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
        <input 
          value={symbol} 
          onChange={(e) => setSymbol(e.target.value.toUpperCase())} 
          placeholder="Ticker (e.g. AAPL)"
          style={{ padding: '8px', borderRadius: '4px' }}
        />
        <input 
          value={query} 
          onChange={(e) => setQuery(e.target.value)} 
          placeholder="Ask a question..."
          style={{ padding: '8px', flex: 1, borderRadius: '4px' }}
        />
        <button onClick={handleResearch} disabled={loading} style={{ padding: '8px 16px', cursor: 'pointer' }}>
          {loading ? 'Analyzing...' : 'Generate Analysis'}
        </button>
      </div>

      {report && (
        <div style={{ backgroundColor: '#16213e', padding: '15px', borderRadius: '6px' }}>
          <h3>Grounded Facts & Financial Metrics</h3>
          <ul>
            {report.facts.map((fact, idx) => (
              <li key={idx} style={{ marginBottom: '6px' }}>{fact}</li>
            ))}
          </ul>

          <h3>Generated Interpretation</h3>
          <ul>
            {report.interpretations.map((interp, idx) => (
              <li key={idx} style={{ marginBottom: '6px' }}>{interp}</li>
            ))}
          </ul>

          <p style={{ fontSize: '0.8rem', color: '#e94560', marginTop: '15px' }}>
            {report.disclaimer}
          </p>
        </div>
      )}
    </div>
  );
}