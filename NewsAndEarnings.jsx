import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './newsAndEarnings.css';
import './stockDashboard.css';

const POPULAR_TICKERS = ['TSLA', 'NVDA', 'AAPL', 'MSFT', 'AMZN', 'GOOGL'];

export default function NewsAndEarnings() {
  const [symbol, setSymbol] = useState('TSLA');
  const [activeTab, setActiveTab] = useState('news'); // 'news' | 'earnings'
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // News & Sentiment State
  const [newsData, setNewsData] = useState(null);
  const [loadingNews, setLoadingNews] = useState(true);
  const [newsError, setNewsError] = useState(null);

  // Earnings State
  const [earningsData, setEarningsData] = useState(null);
  const [loadingEarnings, setLoadingEarnings] = useState(true);
  const [earningsError, setEarningsError] = useState(null);

  // Fetch News & Sentiment
  const fetchNews = async (sym) => {
    setLoadingNews(true);
    setNewsError(null);
    try {
      const res = await axios.get(`http://localhost:5000/api/news/${sym}`);
      setNewsData(res.data);
    } catch (err) {
      console.error('News fetch error:', err);
      setNewsError(err.response?.data?.error || err.message || 'Failed to fetch financial news');
    } finally {
      setLoadingNews(false);
    }
  };

  // Fetch Earnings
  const fetchEarnings = async (sym) => {
    setLoadingEarnings(true);
    setEarningsError(null);
    try {
      const res = await axios.get(`http://localhost:5000/api/earnings/${sym}`);
      setEarningsData(res.data);
    } catch (err) {
      console.error('Earnings fetch error:', err);
      setEarningsError(err.response?.data?.error || err.message || 'Failed to fetch earnings data');
    } finally {
      setLoadingEarnings(false);
    }
  };

  useEffect(() => {
    fetchNews(symbol);
    fetchEarnings(symbol);
  }, [symbol]);

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
  };

  const formatRevenue = (val) => {
    if (!val) return 'N/A';
    if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
    if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
    return `$${val.toLocaleString()}`;
  };

  return (
    <div className="news-earnings-container">
      {/* Header & Tabs */}
      <div className="news-header">
        <div className="news-title">
          <h1>News Sentiment & Earnings Intelligence</h1>
          <p>Algorithmic NLP financial sentiment scoring and historical quarterly earnings beat/miss tracking.</p>
        </div>

        <div className="main-mode-tabs">
          <button
            className={`main-mode-tab ${activeTab === 'news' ? 'active' : ''}`}
            onClick={() => setActiveTab('news')}
          >
            📰 News & Sentiment
          </button>
          <button
            className={`main-mode-tab ${activeTab === 'earnings' ? 'active' : ''}`}
            onClick={() => setActiveTab('earnings')}
          >
            📅 Earnings & Surprises
          </button>
        </div>
      </div>

      {/* Ticker Selector Bar */}
      <div className="dashboard-top-bar" style={{ marginBottom: 20 }}>
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

        {/* Search Input */}
        <div className="search-section" style={{ maxWidth: '300px' }}>
          <div className="search-input-wrapper">
            <span>🔍</span>
            <input
              type="text"
              placeholder="Search ticker (e.g. META)..."
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

      {/* VIEW 1: FINANCIAL NEWS & SENTIMENT */}
      {activeTab === 'news' && (
        <div>
          {newsError && (
            <div className="error-banner">
              <p>⚠️ {newsError}</p>
              <button onClick={() => fetchNews(symbol)}>Retry</button>
            </div>
          )}

          {loadingNews ? (
            <div className="loading-skeleton-container" style={{ minHeight: 380 }}>
              <div className="loading-spinner" />
              <p style={{ color: '#94a3b8' }}>Aggregating news and scoring financial sentiment for {symbol}...</p>
            </div>
          ) : (
            <>
              {/* Aggregate Sentiment Ribbon */}
              {newsData && (
                <div className="sentiment-overview-card">
                  <div className="sentiment-overview-header">
                    <div>
                      <h3 style={{ margin: '0 0 4px', fontSize: '1.25rem', fontWeight: 800 }}>
                        Market Sentiment Outlook for {newsData.symbol}
                      </h3>
                      <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                        Based on {newsData.articlesCount} real-time media articles scored with financial NLP lexicon
                      </div>
                    </div>

                    <div
                      className={`sentiment-badge-large ${newsData.overallSentiment.toLowerCase()}`}
                    >
                      <span>
                        {newsData.overallSentiment === 'Bullish' ? '🟢' : newsData.overallSentiment === 'Bearish' ? '🔴' : '⚪'}
                      </span>
                      <span>
                        {newsData.overallSentiment.toUpperCase()} ({newsData.overallScore >= 0 ? '+' : ''}{newsData.overallScore})
                      </span>
                    </div>
                  </div>

                  {/* Sentiment Percentage Distribution Bar */}
                  <div className="sentiment-bar-track">
                    <div
                      className="sentiment-bar-segment bull"
                      style={{ width: `${newsData.bullishPercent}%` }}
                      title={`Bullish: ${newsData.bullishPercent}%`}
                    />
                    <div
                      className="sentiment-bar-segment neu"
                      style={{ width: `${newsData.neutralPercent}%` }}
                      title={`Neutral: ${newsData.neutralPercent}%`}
                    />
                    <div
                      className="sentiment-bar-segment bear"
                      style={{ width: `${newsData.bearishPercent}%` }}
                      title={`Bearish: ${newsData.bearishPercent}%`}
                    />
                  </div>

                  <div className="sentiment-legend">
                    <span style={{ color: '#4ade80' }}>
                      ▲ Bullish: {newsData.bullishPercent}% ({newsData.bullishCount})
                    </span>
                    <span style={{ color: '#94a3b8' }}>
                      ■ Neutral: {newsData.neutralPercent}% ({newsData.neutralCount})
                    </span>
                    <span style={{ color: '#f87171' }}>
                      ▼ Bearish: {newsData.bearishPercent}% ({newsData.bearishCount})
                    </span>
                  </div>
                </div>
              )}

              {/* News Articles Feed */}
              <div className="news-articles-grid">
                {newsData?.articles?.map((article, idx) => (
                  <div key={idx} className="article-card">
                    <a
                      href={article.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="article-headline"
                    >
                      {article.title} ↗
                    </a>

                    <div className="article-meta-row">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontWeight: 700, color: '#e2e8f0' }}>{article.publisher}</span>
                        <span>•</span>
                        <span>{article.displayDate}</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className={`article-sentiment-pill ${article.sentiment.toLowerCase()}`}>
                          <span>{article.sentiment === 'Bullish' ? '▲' : article.sentiment === 'Bearish' ? '▼' : '■'}</span>
                          <span>{article.sentiment} ({article.sentimentScore >= 0 ? '+' : ''}{article.sentimentScore})</span>
                        </div>

                        {article.keywords?.length > 0 && (
                          <div className="keywords-tags-row">
                            {article.keywords.map((kw, kIdx) => (
                              <span key={kIdx} className="keyword-tag">
                                #{kw}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* VIEW 2: EARNINGS CALENDAR & SURPRISES */}
      {activeTab === 'earnings' && (
        <div>
          {earningsError && (
            <div className="error-banner">
              <p>⚠️ {earningsError}</p>
              <button onClick={() => fetchEarnings(symbol)}>Retry</button>
            </div>
          )}

          {loadingEarnings ? (
            <div className="loading-skeleton-container" style={{ minHeight: 380 }}>
              <div className="loading-spinner" />
              <p style={{ color: '#94a3b8' }}>Retrieving earnings calendar and historical surprises for {symbol}...</p>
            </div>
          ) : (
            <>
              {/* Upcoming Earnings Announcement Banner */}
              {earningsData?.upcoming && (
                <div className="upcoming-earnings-card">
                  <span className="upcoming-badge">Upcoming Earnings Report</span>
                  <h2 style={{ margin: '0 0 6px', fontSize: '1.6rem', fontWeight: 800 }}>
                    Expected Announcement: {earningsData.upcoming.date}
                  </h2>
                  <p style={{ margin: 0, color: '#cbd5e1', fontSize: '0.9rem' }}>
                    Wall Street consensus projections for the upcoming fiscal quarter.
                  </p>

                  <div className="upcoming-grid">
                    <div>
                      <div style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
                        Consensus EPS Est.
                      </div>
                      <div style={{ fontSize: '1.3rem', fontWeight: 800, marginTop: 4, color: '#38bdf8' }}>
                        ${earningsData.upcoming.epsEstimateAvg ?? 'N/A'}
                      </div>
                      <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: 2 }}>
                        Range: ${earningsData.upcoming.epsEstimateLow ?? '-'} - ${earningsData.upcoming.epsEstimateHigh ?? '-'}
                      </div>
                    </div>

                    <div>
                      <div style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
                        Consensus Revenue Est.
                      </div>
                      <div style={{ fontSize: '1.3rem', fontWeight: 800, marginTop: 4, color: '#38bdf8' }}>
                        {formatRevenue(earningsData.upcoming.revenueEstimateAvg)}
                      </div>
                      <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: 2 }}>
                        Range: {formatRevenue(earningsData.upcoming.revenueEstimateLow)} - {formatRevenue(earningsData.upcoming.revenueEstimateHigh)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Historical Beat Rate Summary */}
              {earningsData && (
                <div className="beat-rate-card">
                  <div className="beat-stat">
                    <div className="beat-stat-val">{earningsData.beatRate}%</div>
                    <div className="beat-stat-label">Historical Beat Rate</div>
                  </div>
                  <div className="beat-stat">
                    <div className="beat-stat-val" style={{ color: '#4ade80' }}>
                      {earningsData.beatsCount} / {earningsData.totalQuartersCount}
                    </div>
                    <div className="beat-stat-label">Quarters Beating Estimate</div>
                  </div>
                  <div className="beat-stat">
                    <div className="beat-stat-val" style={{ color: '#a855f7' }}>
                      4 Qtrs
                    </div>
                    <div className="beat-stat-label">Sample Window</div>
                  </div>
                </div>
              )}

              {/* Historical Quarters Table */}
              {earningsData?.history?.length > 0 && (
                <div className="metrics-table-card">
                  <table className="compare-table">
                    <thead>
                      <tr>
                        <th>Fiscal Quarter</th>
                        <th>EPS Estimate</th>
                        <th>EPS Actual</th>
                        <th>Difference</th>
                        <th>Surprise %</th>
                        <th>Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      {earningsData.history.map((q, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 800 }}>{q.quarter}</td>
                          <td style={{ color: '#94a3b8' }}>${q.epsEstimate ?? 'N/A'}</td>
                          <td style={{ fontWeight: 700, color: '#f8fafc' }}>${q.epsActual ?? 'N/A'}</td>
                          <td style={{ fontWeight: 700, color: q.epsDifference > 0 ? '#4ade80' : q.epsDifference < 0 ? '#f87171' : '#94a3b8' }}>
                            {q.epsDifference > 0 ? '+' : ''}{q.epsDifference ?? '-'}
                          </td>
                          <td style={{ fontWeight: 700, color: q.surprisePercent > 0 ? '#4ade80' : q.surprisePercent < 0 ? '#f87171' : '#94a3b8' }}>
                            {q.surprisePercent > 0 ? '+' : ''}{q.surprisePercent ?? '-'}%
                          </td>
                          <td>
                            <span className={`surprise-badge ${q.status}`}>
                              {q.status === 'beat' ? '✓ BEAT' : q.status === 'miss' ? '✕ MISS' : '• MET'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Regulatory & Feed Disclaimer */}
      <div className="disclaimer-card" style={{ marginTop: 24 }}>
        <span>ℹ️</span>
        <div>
          <b>Sentiment & Earnings Disclosure:</b> Financial news headlines are parsed algorithmically via an NLP lexicon to evaluate sentiment orientation. Past quarterly earnings beats or misses do not guarantee future quarterly results. Provided for research and educational purposes only. Not financial or investment advice.
        </div>
      </div>
    </div>
  );
}
