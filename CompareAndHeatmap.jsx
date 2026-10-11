import React, { useState, useEffect, useRef } from 'react';
import { createChart, ColorType, CrosshairMode } from 'lightweight-charts';
import axios from 'axios';
import './compareAndHeatmap.css';
import './stockDashboard.css';

const PRESET_BUNDLES = [
  { name: 'Tech Titans', symbols: ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN'] },
  { name: 'Index Benchmarks', symbols: ['SPY', 'QQQ', 'DIA', 'IWM'] },
  { name: 'Magnificent 7', symbols: ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN', 'META'] },
  { name: 'Tech vs Energy', symbols: ['XLK', 'XLE', 'NVDA', 'XOM'] },
];

const SERIES_COLORS = [
  '#38bdf8', // Sky Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#a855f7', // Purple
  '#f43f5e', // Rose
  '#06b6d4', // Cyan
];

const COMPARE_TIMEFRAMES = [
  { label: '1W', range: '5d', interval: '15m' },
  { label: '1M', range: '1mo', interval: '1d' },
  { label: '3M', range: '3mo', interval: '1d' },
  { label: '6M', range: '6mo', interval: '1d' },
  { label: '1Y', range: '1y', interval: '1d' },
  { label: '5Y', range: '5y', interval: '1wk' },
];

const HEATMAP_PERIODS = [
  { id: '1d', label: '1 Day' },
  { id: '1w', label: '1 Week' },
  { id: '1m', label: '1 Month' },
  { id: '1y', label: '1 Year' },
];

export default function CompareAndHeatmap() {
  const [activeTab, setActiveTab] = useState('compare'); // 'compare' | 'heatmap'

  // Comparison State
  const [selectedSymbols, setSelectedSymbols] = useState(['AAPL', 'MSFT', 'NVDA', 'SPY']);
  const [timeframe, setTimeframe] = useState(COMPARE_TIMEFRAMES[1]); // Default 1M
  const [compareData, setCompareData] = useState(null);
  const [loadingCompare, setLoadingCompare] = useState(true);
  const [compareError, setCompareError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [crosshairReturns, setCrosshairReturns] = useState(null);

  // Heatmap State
  const [heatmapPeriod, setHeatmapPeriod] = useState('1d');
  const [sectorData, setSectorData] = useState(null);
  const [loadingHeatmap, setLoadingHeatmap] = useState(true);
  const [heatmapError, setHeatmapError] = useState(null);

  // Chart DOM Reference
  const chartContainerRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const seriesInstancesRef = useRef([]);

  // Fetch Comparison Data
  const fetchComparison = async (symbols, tf) => {
    if (!symbols || symbols.length === 0) return;
    setLoadingCompare(true);
    setCompareError(null);
    try {
      const symbolsParam = symbols.join(',');
      const res = await axios.get(
        `http://localhost:5000/api/market/compare?symbols=${symbolsParam}&range=${tf.range}&interval=${tf.interval}`
      );
      setCompareData(res.data);
    } catch (err) {
      console.error('Comparison error:', err);
      setCompareError(err.response?.data?.error || err.message || 'Failed to fetch comparison data');
    } finally {
      setLoadingCompare(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'compare') {
      fetchComparison(selectedSymbols, timeframe);
    }
  }, [selectedSymbols, timeframe, activeTab]);

  // Fetch Heatmap Data
  const fetchHeatmap = async (period) => {
    setLoadingHeatmap(true);
    setHeatmapError(null);
    try {
      const res = await axios.get(`http://localhost:5000/api/market/sectors?period=${period}`);
      setSectorData(res.data);
    } catch (err) {
      console.error('Heatmap error:', err);
      setHeatmapError(err.response?.data?.error || err.message || 'Failed to fetch sector performance');
    } finally {
      setLoadingHeatmap(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'heatmap') {
      fetchHeatmap(heatmapPeriod);
    }
  }, [heatmapPeriod, activeTab]);

  // Autocomplete Search for Adding Tickers
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

  const handleAddSymbol = (sym) => {
    const clean = sym.trim().toUpperCase();
    if (!selectedSymbols.includes(clean)) {
      if (selectedSymbols.length >= 6) {
        alert('You can compare up to 6 symbols at a time.');
        return;
      }
      setSelectedSymbols([...selectedSymbols, clean]);
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleRemoveSymbol = (sym) => {
    if (selectedSymbols.length <= 1) {
      alert('Keep at least one symbol in the comparison.');
      return;
    }
    setSelectedSymbols(selectedSymbols.filter(s => s !== sym));
  };

  const handleApplyPreset = (symbols) => {
    setSelectedSymbols(symbols);
  };

  const handleCompareSector = (stocks) => {
    setSelectedSymbols(stocks.map(s => s.symbol));
    setActiveTab('compare');
  };

  // Render Comparison Normalized Multi-Line Chart
  useEffect(() => {
    if (activeTab !== 'compare' || !chartContainerRef.current || !compareData?.series || compareData.series.length === 0) {
      return;
    }

    if (chartInstanceRef.current) {
      chartInstanceRef.current.remove();
      chartInstanceRef.current = null;
    }

    const container = chartContainerRef.current;
    const chart = createChart(container, {
      width: container.clientWidth,
      height: 480,
      layout: {
        background: { type: ColorType.Solid, color: '#131722' },
        textColor: '#94a3b8',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.04)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.04)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      rightPriceScale: {
        borderColor: '#334155',
        mode: 0, // Normal
      },
      timeScale: {
        borderColor: '#334155',
        timeVisible: timeframe.interval.includes('m'),
      },
    });

    chartInstanceRef.current = chart;
    seriesInstancesRef.current = [];

    // Zero-line baseline reference
    const zeroSeries = chart.addLineSeries({
      color: 'rgba(255, 255, 255, 0.2)',
      lineWidth: 1,
      lineStyle: 2, // Dashed
      priceLineVisible: false,
      lastValueVisible: false,
    });

    // Populate data for each compared symbol
    compareData.series.forEach((s, idx) => {
      const color = SERIES_COLORS[idx % SERIES_COLORS.length];
      const lineSeries = chart.addLineSeries({
        color,
        lineWidth: 2.5,
        title: s.symbol,
        priceFormat: {
          type: 'custom',
          formatter: (price) => `${price >= 0 ? '+' : ''}${price.toFixed(2)}%`,
        },
      });

      lineSeries.setData(s.data);
      seriesInstancesRef.current.push({ symbol: s.symbol, color, instance: lineSeries });

      if (idx === 0) {
        zeroSeries.setData(s.data.map(d => ({ time: d.time, value: 0 })));
      }
    });

    // Crosshair hover listener
    chart.subscribeCrosshairMove(param => {
      if (!param.time) {
        setCrosshairReturns(null);
        return;
      }

      const returnMap = {};
      seriesInstancesRef.current.forEach(item => {
        const val = param.seriesData.get(item.instance);
        if (val && val.value !== undefined) {
          returnMap[item.symbol] = {
            value: val.value,
            color: item.color,
          };
        }
      });
      setCrosshairReturns(returnMap);
    });

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartInstanceRef.current) {
        chartInstanceRef.current.remove();
        chartInstanceRef.current = null;
      }
    };
  }, [compareData, activeTab, timeframe]);

  const getHeatmapColorClass = (perf) => {
    if (perf >= 2.5) return 'heat-strong-green';
    if (perf >= 1.0) return 'heat-med-green';
    if (perf >= 0.0) return 'heat-light-green';
    if (perf >= -1.0) return 'heat-light-red';
    if (perf >= -2.5) return 'heat-med-red';
    return 'heat-strong-red';
  };

  return (
    <div className="compare-page-container">
      {/* Top Header & Tab Switcher */}
      <div className="compare-header">
        <div className="compare-title">
          <h1>Market Analysis & Sector Heatmaps</h1>
          <p>Multi-asset normalized performance comparison and real-time S&P 500 sector tracking.</p>
        </div>

        <div className="main-mode-tabs">
          <button
            className={`main-mode-tab ${activeTab === 'compare' ? 'active' : ''}`}
            onClick={() => setActiveTab('compare')}
          >
            📊 Multi-Stock Comparison
          </button>
          <button
            className={`main-mode-tab ${activeTab === 'heatmap' ? 'active' : ''}`}
            onClick={() => setActiveTab('heatmap')}
          >
            🗺️ Sector Heatmap
          </button>
        </div>
      </div>

      {/* VIEW 1: MULTI-STOCK COMPARISON */}
      {activeTab === 'compare' && (
        <div>
          {/* Ticker Management Card */}
          <div className="ticker-select-card">
            <div className="active-tickers-flow">
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 700 }}>COMPARING:</span>
              {compareData?.series?.map((s, idx) => {
                const color = SERIES_COLORS[idx % SERIES_COLORS.length];
                return (
                  <div key={s.symbol} className="ticker-pill-badge" style={{ borderColor: color }}>
                    <span className="ticker-color-dot" style={{ backgroundColor: color }} />
                    <span>{s.symbol}</span>
                    <span
                      className="ticker-pill-return"
                      style={{ color: s.totalReturn >= 0 ? '#22c55e' : '#ef4444' }}
                    >
                      {s.totalReturn >= 0 ? '+' : ''}{s.totalReturn}%
                    </span>
                    <button
                      className="ticker-pill-remove"
                      onClick={() => handleRemoveSymbol(s.symbol)}
                      title={`Remove ${s.symbol}`}
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="presets-and-search-row">
              {/* Presets */}
              <div className="presets-group">
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>PRESETS:</span>
                {PRESET_BUNDLES.map(p => (
                  <button
                    key={p.name}
                    className="preset-chip-btn"
                    onClick={() => handleApplyPreset(p.symbols)}
                  >
                    {p.name}
                  </button>
                ))}
              </div>

              {/* Add Symbol Input */}
              <div className="search-section" style={{ maxWidth: '300px' }}>
                <div className="search-input-wrapper">
                  <span>➕</span>
                  <input
                    type="text"
                    placeholder="Add symbol (e.g. GOOGL)..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
                {searchResults.length > 0 && (
                  <div className="search-dropdown">
                    {searchResults.map(item => (
                      <div
                        key={item.symbol}
                        className="search-item"
                        onClick={() => handleAddSymbol(item.symbol)}
                      >
                        <span className="search-item-symbol">{item.symbol}</span>
                        <span className="search-item-name">{item.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Timeframe Controls Bar */}
          <div className="compare-controls-bar">
            <div className="controls-group">
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>TIMEFRAME:</span>
              {COMPARE_TIMEFRAMES.map(tf => (
                <button
                  key={tf.label}
                  className={`btn-toggle ${timeframe.label === tf.label ? 'active' : ''}`}
                  onClick={() => setTimeframe(tf)}
                >
                  {tf.label}
                </button>
              ))}
            </div>

            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Base Normalized to 0.00% at period start
            </span>
          </div>

          {/* Error Banner */}
          {compareError && (
            <div className="error-banner">
              <p>⚠️ {compareError}</p>
              <button onClick={() => fetchComparison(selectedSymbols, timeframe)}>Retry</button>
            </div>
          )}

          {/* Comparison Normalized Chart */}
          <div className="chart-stage-card">
            {loadingCompare && (
              <div className="loading-skeleton-container" style={{ minHeight: 480 }}>
                <div className="loading-spinner" />
                <p style={{ color: '#94a3b8' }}>Normalizing relative returns across {selectedSymbols.join(', ')}...</p>
              </div>
            )}

            {crosshairReturns && (
              <div className="chart-legend-overlay">
                {Object.entries(crosshairReturns).map(([sym, item]) => (
                  <span key={sym} style={{ color: item.color, fontWeight: 700 }}>
                    {sym}: {item.value >= 0 ? '+' : ''}{item.value.toFixed(2)}%
                  </span>
                ))}
              </div>
            )}

            <div
              ref={chartContainerRef}
              className="compare-chart-canvas"
              style={{ display: loadingCompare ? 'none' : 'block' }}
            />
          </div>

          {/* Detailed Performance Metrics Table */}
          {compareData?.series && (
            <div className="metrics-table-card">
              <table className="compare-table">
                <thead>
                  <tr>
                    <th>Ticker</th>
                    <th>Company Name</th>
                    <th>Current Price</th>
                    <th>Period Return</th>
                    <th>Peak Return</th>
                    <th>Lowest Return</th>
                    <th>Ann. Volatility</th>
                  </tr>
                </thead>
                <tbody>
                  {compareData.series.map((s, idx) => {
                    const color = SERIES_COLORS[idx % SERIES_COLORS.length];
                    return (
                      <tr key={s.symbol}>
                        <td style={{ fontWeight: 800 }}>
                          <span className="ticker-color-dot" style={{ backgroundColor: color, marginRight: 8 }} />
                          {s.symbol}
                        </td>
                        <td style={{ color: '#cbd5e1' }}>{s.name}</td>
                        <td style={{ fontWeight: 700 }}>${s.currentPrice?.toFixed(2)}</td>
                        <td style={{ fontWeight: 800, color: s.totalReturn >= 0 ? '#22c55e' : '#ef4444' }}>
                          {s.totalReturn >= 0 ? '▲ +' : '▼ '}{s.totalReturn}%
                        </td>
                        <td style={{ color: '#22c55e' }}>+{s.maxReturn}%</td>
                        <td style={{ color: '#ef4444' }}>{s.minReturn}%</td>
                        <td style={{ color: '#94a3b8' }}>{s.volatility}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: SECTOR HEATMAP */}
      {activeTab === 'heatmap' && (
        <div>
          {/* Heatmap Period Selector */}
          <div className="heatmap-period-bar">
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>PERIOD:</span>
            {HEATMAP_PERIODS.map(p => (
              <button
                key={p.id}
                className={`btn-toggle ${heatmapPeriod === p.id ? 'active' : ''}`}
                onClick={() => setHeatmapPeriod(p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>

          {heatmapError && (
            <div className="error-banner">
              <p>⚠️ {heatmapError}</p>
              <button onClick={() => fetchHeatmap(heatmapPeriod)}>Retry</button>
            </div>
          )}

          {loadingHeatmap ? (
            <div className="loading-skeleton-container" style={{ minHeight: 400 }}>
              <div className="loading-spinner" />
              <p style={{ color: '#94a3b8' }}>Aggregating real-time sector ETF & component performance...</p>
            </div>
          ) : (
            <div className="sectors-grid">
              {sectorData?.sectors?.map(sec => {
                const colorClass = getHeatmapColorClass(sec.performance);
                return (
                  <div key={sec.id} className={`sector-tile-card ${colorClass}`}>
                    <div className="sector-tile-header">
                      <div>
                        <div className="sector-tile-name">{sec.name}</div>
                        <div className="sector-tile-etf">
                          ETF: <b>{sec.etf}</b> • Weight: {sec.weight}%
                        </div>
                      </div>
                      <div className="sector-tile-perf">
                        {sec.performance >= 0 ? '▲ +' : '▼ '}{sec.performance}%
                      </div>
                    </div>

                    <div className="sector-stocks-chips">
                      {sec.stocks?.map(st => (
                        <div key={st.symbol} className="stock-chip-mini">
                          <span>{st.symbol}</span>
                          <span style={{ color: st.changePercent >= 0 ? '#86efac' : '#fca5a5' }}>
                            {st.changePercent >= 0 ? '+' : ''}{st.changePercent}%
                          </span>
                        </div>
                      ))}
                    </div>

                    <button
                      className="sector-compare-btn"
                      onClick={() => handleCompareSector(sec.stocks)}
                    >
                      Compare {sec.name} Stocks →
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Analytical Disclaimer */}
      <div className="disclaimer-card" style={{ marginTop: 24 }}>
        <span>ℹ️</span>
        <div>
          <b>Sector & Benchmark Disclosure:</b> Sector ETF performance is derived from SPDR Sector ETFs and representative large-cap constituent stocks. Returns represent capital price changes over the selected interval. Delayed data feeds provided for research and educational purposes only. Not investment advice.
        </div>
      </div>
    </div>
  );
}
