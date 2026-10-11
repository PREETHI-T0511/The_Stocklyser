import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './aiResearch.css';
import './stockDashboard.css';

const POPULAR_TICKERS = ['NVDA', 'AAPL', 'MSFT', 'TSLA', 'AMZN', 'GOOGL'];

const PROMPT_TEMPLATES = [
  { id: 'general', label: '🔍 Executive Investment Memo' },
  { id: 'valuation', label: '📊 Valuation & Financial Multiples' },
  { id: 'technical', label: '📈 Technical Momentum & Moving Averages' },
  { id: 'bull_bear', label: '⚖️ Bull Thesis vs. Bear Risks' },
  { id: 'health', label: '🛡️ Financial Health & Profit Margins' },
];

export default function AIResearchAssistant() {
  const [symbol, setSymbol] = useState('NVDA');
  const [selectedTemplate, setSelectedTemplate] = useState('general');
  const [customQuery, setCustomQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // Report States
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [highlightedSource, setHighlightedSource] = useState(null);

  // Generate Report
  const generateReport = async (sym = symbol, tmpl = selectedTemplate, query = customQuery) => {
    setLoading(true);
    setError(null);
    setCopied(false);
    try {
      const res = await axios.post('http://localhost:5000/api/ai/research', {
        symbol: sym,
        promptType: tmpl,
        query,
      });
      setReport(res.data);
    } catch (err) {
      console.error('AI Research generation error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to generate research report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateReport('NVDA', 'general', '');
  }, []);

  // Symbol Autocomplete
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/market/search?q=${encodeURIComponent(searchQuery)}`);
        setSearchResults(res.data);
      } catch (err) {
        console.error(err);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectSymbol = (sym) => {
    setSymbol(sym);
    setSearchQuery('');
    setSearchResults([]);
    generateReport(sym, selectedTemplate, customQuery);
  };

  const handleApplyTemplate = (tmplId) => {
    setSelectedTemplate(tmplId);
    generateReport(symbol, tmplId, customQuery);
  };

  const handleCopyReport = () => {
    if (!report) return;
    const text = `STOCKLYSER AI RESEARCH REPORT: ${report.symbol} (${report.companyName})
Generated: ${new Date(report.generatedAt).toLocaleString()}

EXECUTIVE VERDICT:
${report.executiveVerdict}

SECTIONS:
${report.sections.map(s => `${s.title}\n${s.content}`).join('\n\n')}

BULL FACTORS:
${report.bullFactors.map(f => `• ${f}`).join('\n')}

BEAR RISKS:
${report.bearRisks.map(r => `• ${r}`).join('\n')}

SCENARIOS:
${report.scenarioModeling.bullCase}
${report.scenarioModeling.baseCase}
${report.scenarioModeling.bearCase}

${report.disclaimer}`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  // Helper to render text with interactive citation badges
  const renderTextWithCitations = (text) => {
    if (!text) return null;
    const parts = text.split(/(\[Source \d+\])/g);
    return parts.map((part, i) => {
      if (part.startsWith('[Source') && part.endsWith(']')) {
        const sourceId = part.replace('[', '').replace(']', '').trim();
        return (
          <span
            key={i}
            className="citation-badge"
            title={`Click to view data from ${sourceId}`}
            onClick={() => {
              setHighlightedSource(sourceId);
              const el = document.getElementById(`source-item-${sourceId.replace(' ', '-')}`);
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className="ai-research-container">
      {/* Header */}
      <div className="ai-header">
        <div className="ai-header-badge">
          <span>🤖 Grounded AI Financial Analyst</span>
        </div>
        <div className="ai-title">
          <h1>Real-Time Financial Research Assistant</h1>
          <p>
            Autonomous equity intelligence grounded in verifiable financial metrics, technical indicators, and consensus targets with explicit citations.
          </p>
        </div>
      </div>

      {/* Query & Controls Card */}
      <div className="ai-controls-card">
        <div className="ai-symbol-selection-row">
          {/* Quick Select Chips */}
          <div className="quick-chips-wrapper">
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 700 }}>TICKER:</span>
            {POPULAR_TICKERS.map((sym) => (
              <button
                key={sym}
                className={`quick-chip ${symbol === sym ? 'active' : ''}`}
                onClick={() => handleSelectSymbol(sym)}
              >
                {sym}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="search-section" style={{ maxWidth: '280px' }}>
            <div className="search-input-wrapper">
              <span>🔍</span>
              <input
                type="text"
                placeholder="Search symbol (e.g. AMD)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {searchResults.length > 0 && (
              <div className="search-dropdown">
                {searchResults.map((item) => (
                  <div
                    key={item.symbol}
                    className="search-item"
                    onClick={() => handleSelectSymbol(item.symbol)}
                  >
                    <span className="search-item-symbol">{item.symbol}</span>
                    <span className="search-item-name">{item.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Custom Question Input Row */}
        <div className="ai-input-group" style={{ maxWidth: '100%', marginBottom: 16 }}>
          <input
            type="text"
            className="ai-custom-input"
            placeholder={`Ask a custom research question about ${symbol} (e.g., How do current valuation multiples compare to growth?)...`}
            value={customQuery}
            onChange={(e) => setCustomQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') generateReport(symbol, selectedTemplate, customQuery);
            }}
          />
          <button
            className="btn-generate-ai"
            onClick={() => generateReport(symbol, selectedTemplate, customQuery)}
            disabled={loading}
          >
            {loading ? 'Synthesizing...' : '✨ Run Analysis'}
          </button>
        </div>

        {/* Prompt Templates */}
        <div className="prompt-templates-bar">
          <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>PROMPT TEMPLATES:</span>
          {PROMPT_TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.id}
              className={`template-pill ${selectedTemplate === tmpl.id ? 'active' : ''}`}
              onClick={() => handleApplyTemplate(tmpl.id)}
            >
              {tmpl.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="error-banner">
          <p>⚠️ {error}</p>
          <button onClick={() => generateReport(symbol, selectedTemplate, customQuery)}>Retry Generation</button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="loading-skeleton-container" style={{ minHeight: 460 }}>
          <div className="loading-spinner" />
          <h3 style={{ margin: '14px 0 6px', color: '#f8fafc' }}>Grounded Analysis in Progress for {symbol}...</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', maxWidth: '480px', textAlign: 'center', lineHeight: 1.5 }}>
            Fetching real-time market quotes, SEC summary filings, technical indicator oscillators, and consensus price targets. Grounding factual claims in verifiable data sources...
          </p>
        </div>
      )}

      {/* Research Memo Output */}
      {report && !loading && (
        <div className="research-memo-card">
          <div className="memo-top-meta">
            <div className="memo-header-title">
              <h2>
                {report.companyName} ({report.symbol})
              </h2>
              <div className="memo-header-sub">
                Generated: {new Date(report.generatedAt).toLocaleString()} • Research Mode: {report.promptType.toUpperCase()}
              </div>
            </div>

            <div className="memo-actions">
              <button className="btn-memo-action" onClick={handleCopyReport}>
                {copied ? '✓ Copied to Clipboard!' : '📋 Copy Report'}
              </button>
              <button className="btn-memo-action" onClick={() => window.print()}>
                🖨️ Export PDF
              </button>
            </div>
          </div>

          {/* Executive Verdict Callout */}
          <div className="executive-verdict-box">
            <div className="verdict-label">Executive Analytical Verdict</div>
            <div className="verdict-text">{renderTextWithCitations(report.executiveVerdict)}</div>
          </div>

          {/* Core Sections */}
          {report.sections?.map((sec, idx) => (
            <div key={idx} className="memo-section">
              <h3>{sec.title}</h3>
              <p>{renderTextWithCitations(sec.content)}</p>
            </div>
          ))}

          {/* Bull vs Bear Two-Column Grid */}
          <div className="bull-bear-grid">
            <div className="bull-card">
              <h4>▲ Bullish Investment Catalysts</h4>
              <ul>
                {report.bullFactors?.map((f, i) => (
                  <li key={i}>{renderTextWithCitations(f)}</li>
                ))}
              </ul>
            </div>

            <div className="bear-card">
              <h4>▼ Bearish Headwinds & Risk Factors</h4>
              <ul>
                {report.bearRisks?.map((r, i) => (
                  <li key={i}>{renderTextWithCitations(r)}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Multi-Scenario Modeling */}
          {report.scenarioModeling && (
            <div className="scenarios-box">
              <h4>🔮 Probabilistic 12-Month Scenario Modeling</h4>
              <div className="scenario-item">
                <b style={{ color: '#4ade80' }}>Bull Case:</b> {renderTextWithCitations(report.scenarioModeling.bullCase)}
              </div>
              <div className="scenario-item">
                <b style={{ color: '#60a5fa' }}>Base Case:</b> {renderTextWithCitations(report.scenarioModeling.baseCase)}
              </div>
              <div className="scenario-item">
                <b style={{ color: '#f87171' }}>Bear Case:</b> {renderTextWithCitations(report.scenarioModeling.bearCase)}
              </div>
            </div>
          )}

          {/* Verifiable Sources & Citations Index Drawer */}
          <div className="sources-drawer-card">
            <div className="sources-drawer-header">
              <span>📚 Verifiable Sources & Evidence Corpus</span>
            </div>

            {report.sources?.map((s) => (
              <div
                key={s.id}
                id={`source-item-${s.id.replace(' ', '-')}`}
                className="source-item-row"
                style={{
                  backgroundColor: highlightedSource === s.id ? 'rgba(139, 92, 246, 0.12)' : 'transparent',
                  borderRadius: 6,
                  padding: '10px 8px',
                  transition: 'background-color 0.3s',
                }}
              >
                <div>
                  <span className="source-item-tag">[{s.id}]</span>
                  <b style={{ marginLeft: 6, color: '#f8fafc' }}>{s.title}</b>
                  <span className="source-item-provider">• {s.provider}</span>
                </div>

                <div className="source-item-values">
                  {Object.entries(s.data).map(([key, val]) => {
                    if (Array.isArray(val)) {
                      return val.map((v, idx) => (
                        <span key={idx} className="source-val-badge">
                          📰 {v}
                        </span>
                      ));
                    }
                    return (
                      <span key={key} className="source-val-badge">
                        <b style={{ color: '#94a3b8' }}>{key}:</b> {String(val)}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Regulatory Disclaimer */}
          <div className="disclaimer-card" style={{ marginTop: 24 }}>
            <span>⚠️</span>
            <div>{report.disclaimer}</div>
          </div>
        </div>
      )}
    </div>
  );
}
