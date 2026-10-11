import React, { useState, useEffect, useRef } from 'react';
import { createChart, ColorType, CrosshairMode } from 'lightweight-charts';
import axios from 'axios';
import {
  calculateSMA,
  calculateEMA,
  calculateRSI,
  calculateBollingerBands,
  calculateMACD,
} from './indicators.js';
import './stockDashboard.css';

const POPULAR_TICKERS = ['AAPL', 'NVDA', 'MSFT', 'TSLA', 'GOOGL', 'AMZN', 'SPY', 'QQQ'];

const TIMEFRAMES = [
  { label: '1D', range: '1d', interval: '5m' },
  { label: '5D', range: '5d', interval: '15m' },
  { label: '1M', range: '1mo', interval: '1d' },
  { label: '6M', range: '6mo', interval: '1d' },
  { label: '1Y', range: '1y', interval: '1d' },
  { label: '5Y', range: '5y', interval: '1wk' },
];

export default function StockDashboard() {
  const [symbol, setSymbol] = useState('AAPL');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [timeframe, setTimeframe] = useState(TIMEFRAMES[2]); // Default 1M
  const [chartType, setChartType] = useState('candlestick'); // 'candlestick' | 'line'

  // Indicator Toggles
  const [showSMA20, setShowSMA20] = useState(true);
  const [showSMA50, setShowSMA50] = useState(false);
  const [showSMA200, setShowSMA200] = useState(false);
  const [showEMA20, setShowEMA20] = useState(false);
  const [showBollinger, setShowBollinger] = useState(false);
  const [showVolume, setShowVolume] = useState(true);
  const [showRSI, setShowRSI] = useState(false);

  // Data States
  const [chartData, setChartData] = useState(null);
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [crosshairData, setCrosshairData] = useState(null);

  // Chart DOM Refs
  const chartContainerRef = useRef(null);
  const rsiContainerRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const rsiChartInstanceRef = useRef(null);

  // Fetch Chart & Quote Data
  const fetchData = async (sym, tf) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `http://localhost:5000/api/market/chart/${sym}?range=${tf.range}&interval=${tf.interval}`
      );
      setChartData(response.data);
      setQuote(response.data.meta);
    } catch (err) {
      console.error('Error fetching stock data:', err);
      setError(err.response?.data?.error || err.message || 'Failed to retrieve market data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(symbol, timeframe);
  }, [symbol, timeframe]);

  // Symbol Autocomplete Search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 1) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await axios.get(`http://localhost:5000/api/market/search?q=${encodeURIComponent(searchQuery)}`);
        setSearchResults(res.data);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Main Chart Rendering Effect
  useEffect(() => {
    if (!chartContainerRef.current || !chartData?.candles || chartData.candles.length === 0) {
      return;
    }

    // Clean up previous instance
    if (chartInstanceRef.current) {
      chartInstanceRef.current.remove();
      chartInstanceRef.current = null;
    }

    const container = chartContainerRef.current;
    const chart = createChart(container, {
      width: container.clientWidth,
      height: 520,
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
      },
      timeScale: {
        borderColor: '#334155',
        timeVisible: timeframe.interval.includes('m'),
        secondsVisible: false,
      },
    });

    chartInstanceRef.current = chart;

    // 1. Candlestick or Line Primary Series
    let mainSeries;
    if (chartType === 'candlestick') {
      mainSeries = chart.addCandlestickSeries({
        upColor: '#22c55e',
        downColor: '#ef4444',
        borderUpColor: '#22c55e',
        borderDownColor: '#ef4444',
        wickUpColor: '#22c55e',
        wickDownColor: '#ef4444',
      });
      mainSeries.setData(chartData.candles);
    } else {
      mainSeries = chart.addLineSeries({
        color: '#3b82f6',
        lineWidth: 2,
      });
      mainSeries.setData(
        chartData.candles.map(c => ({ time: c.time, value: c.close }))
      );
    }

    // 2. Volume Series Overlay at bottom
    if (showVolume) {
      const volumeSeries = chart.addHistogramSeries({
        color: '#3b82f6',
        priceFormat: { type: 'volume' },
        priceScaleId: '', // overlay
      });
      volumeSeries.priceScale().applyOptions({
        scaleMargins: {
          top: 0.8,
          bottom: 0,
        },
      });
      volumeSeries.setData(
        chartData.candles.map(c => ({
          time: c.time,
          value: c.volume,
          color: c.close >= c.open ? 'rgba(34, 197, 94, 0.35)' : 'rgba(239, 68, 68, 0.35)',
        }))
      );
    }

    // 3. Technical Indicator Overlays
    if (showSMA20) {
      const smaData = calculateSMA(chartData.candles, 20);
      if (smaData.length > 0) {
        const smaSeries = chart.addLineSeries({
          color: '#38bdf8',
          lineWidth: 2,
          title: 'SMA 20',
        });
        smaSeries.setData(smaData);
      }
    }

    if (showSMA50) {
      const sma50Data = calculateSMA(chartData.candles, 50);
      if (sma50Data.length > 0) {
        const sma50Series = chart.addLineSeries({
          color: '#f59e0b',
          lineWidth: 2,
          title: 'SMA 50',
        });
        sma50Series.setData(sma50Data);
      }
    }

    if (showSMA200) {
      const sma200Data = calculateSMA(chartData.candles, 200);
      if (sma200Data.length > 0) {
        const sma200Series = chart.addLineSeries({
          color: '#a855f7',
          lineWidth: 2,
          title: 'SMA 200',
        });
        sma200Series.setData(sma200Data);
      }
    }

    if (showEMA20) {
      const emaData = calculateEMA(chartData.candles, 20);
      if (emaData.length > 0) {
        const emaSeries = chart.addLineSeries({
          color: '#10b981',
          lineWidth: 2,
          title: 'EMA 20',
        });
        emaSeries.setData(emaData);
      }
    }

    if (showBollinger) {
      const bb = calculateBollingerBands(chartData.candles, 20, 2);
      if (bb.middle.length > 0) {
        const upperSeries = chart.addLineSeries({ color: 'rgba(6, 182, 212, 0.6)', lineWidth: 1, title: 'BB Upper' });
        const midSeries = chart.addLineSeries({ color: 'rgba(6, 182, 212, 0.3)', lineWidth: 1, lineStyle: 2, title: 'BB Mid' });
        const lowerSeries = chart.addLineSeries({ color: 'rgba(6, 182, 212, 0.6)', lineWidth: 1, title: 'BB Lower' });

        upperSeries.setData(bb.upper);
        midSeries.setData(bb.middle);
        lowerSeries.setData(bb.lower);
      }
    }

    // Crosshair handler
    chart.subscribeCrosshairMove(param => {
      if (!param.time || !param.seriesData.get(mainSeries)) {
        setCrosshairData(null);
        return;
      }
      const dataPoint = param.seriesData.get(mainSeries);
      setCrosshairData(dataPoint);
    });

    chart.timeScale().fitContent();

    // Resize Observer for fluid responsiveness
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
  }, [chartData, chartType, showVolume, showSMA20, showSMA50, showSMA200, showEMA20, showBollinger]);

  // RSI Sub-Chart Rendering Effect
  useEffect(() => {
    if (!showRSI || !rsiContainerRef.current || !chartData?.candles) {
      if (rsiChartInstanceRef.current) {
        rsiChartInstanceRef.current.remove();
        rsiChartInstanceRef.current = null;
      }
      return;
    }

    const container = rsiContainerRef.current;
    if (rsiChartInstanceRef.current) {
      rsiChartInstanceRef.current.remove();
    }

    const rsiChart = createChart(container, {
      width: container.clientWidth,
      height: 160,
      layout: {
        background: { type: ColorType.Solid, color: '#131722' },
        textColor: '#94a3b8',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.04)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.04)' },
      },
      rightPriceScale: {
        borderColor: '#334155',
        autoScale: false,
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        borderColor: '#334155',
        visible: false,
      },
    });

    rsiChartInstanceRef.current = rsiChart;

    const rsiSeries = rsiChart.addLineSeries({
      color: '#f43f5e',
      lineWidth: 2,
      title: 'RSI (14)',
    });

    const rsiData = calculateRSI(chartData.candles, 14);
    rsiSeries.setData(rsiData);

    // Overbought (70) and Oversold (30) reference lines
    if (rsiData.length > 0) {
      const line70 = rsiChart.addLineSeries({ color: 'rgba(239, 68, 68, 0.5)', lineWidth: 1, lineStyle: 2 });
      const line30 = rsiChart.addLineSeries({ color: 'rgba(34, 197, 94, 0.5)', lineWidth: 1, lineStyle: 2 });
      line70.setData(rsiData.map(d => ({ time: d.time, value: 70 })));
      line30.setData(rsiData.map(d => ({ time: d.time, value: 30 })));
    }

    rsiChart.timeScale().fitContent();

    const handleRsiResize = () => {
      if (rsiContainerRef.current) {
        rsiChart.applyOptions({ width: rsiContainerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleRsiResize);

    return () => {
      window.removeEventListener('resize', handleRsiResize);
      if (rsiChartInstanceRef.current) {
        rsiChartInstanceRef.current.remove();
        rsiChartInstanceRef.current = null;
      }
    };
  }, [showRSI, chartData]);

  const formatNumber = num => {
    if (num == null || isNaN(num)) return '-';
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    return num.toLocaleString();
  };

  return (
    <div className="stock-dashboard-container">
      {/* Search & Trending Tickers Bar */}
      <div className="dashboard-top-bar">
        <div className="search-section">
          <div className="search-input-wrapper">
            <span>🔍</span>
            <input
              type="text"
              placeholder="Search ticker, company or ETF (e.g., AAPL, NVDA)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {isSearching && <span className="loading-spinner" style={{ width: 14, height: 14 }} />}
          </div>

          {searchResults.length > 0 && (
            <div className="search-dropdown">
              {searchResults.map(item => (
                <div
                  key={item.symbol}
                  className="search-item"
                  onClick={() => {
                    setSymbol(item.symbol);
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                >
                  <span className="search-item-symbol">{item.symbol}</span>
                  <span className="search-item-name">{item.name} ({item.exchange})</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Select Chips */}
        <div className="quick-chips-wrapper">
          <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>TRENDING:</span>
          {POPULAR_TICKERS.map(sym => (
            <button
              key={sym}
              className={`quick-chip ${symbol === sym ? 'active' : ''}`}
              onClick={() => setSymbol(sym)}
            >
              {sym}
            </button>
          ))}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="error-banner">
          <p>⚠️ {error}</p>
          <button onClick={() => fetchData(symbol, timeframe)}>Retry Loading</button>
        </div>
      )}

      {/* Live Quote Summary Card */}
      {quote && (
        <div className="quote-card">
          <div className="quote-header">
            <div className="ticker-identity">
              <h1>
                {quote.symbol}
                <span className="ticker-badge">{quote.exchange}</span>
              </h1>
              <div className="ticker-company">{quote.name}</div>
            </div>

            <div className="price-display">
              <h2 className="current-price">
                ${Number(quote.price || 0).toFixed(2)}
              </h2>
              <div
                className={`price-change ${(quote.change ?? 0) >= 0 ? 'positive' : 'negative'}`}
              >
                {(quote.change ?? 0) >= 0 ? '▲ +' : '▼ '}
                {Number(quote.change || 0).toFixed(2)} (
                {Number(quote.changePercent || 0).toFixed(2)}%)
              </div>
            </div>
          </div>

          <div className="metrics-grid">
            <div className="metric-item">
              <span className="metric-label">Previous Close</span>
              <span className="metric-value">${Number(quote.previousClose || 0).toFixed(2)}</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Day Range</span>
              <span className="metric-value">
                ${Number(quote.dayLow || 0).toFixed(2)} - ${Number(quote.dayHigh || 0).toFixed(2)}
              </span>
            </div>
            <div className="metric-item">
              <span className="metric-label">52-Week Range</span>
              <span className="metric-value">
                ${Number(quote.fiftyTwoWeekLow || 0).toFixed(2)} - ${Number(quote.fiftyTwoWeekHigh || 0).toFixed(2)}
              </span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Volume</span>
              <span className="metric-value">{formatNumber(quote.volume)}</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Data Feed</span>
              <span className="metric-value" style={{ color: '#22c55e', fontSize: '0.85rem' }}>
                🟢 Real-time / 15m
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Controls Bar */}
      <div className="chart-controls-bar">
        {/* Timeframe Selector */}
        <div className="controls-group">
          <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>TIMEFRAME:</span>
          {TIMEFRAMES.map(tf => (
            <button
              key={tf.label}
              className={`btn-toggle ${timeframe.label === tf.label ? 'active' : ''}`}
              onClick={() => setTimeframe(tf)}
            >
              {tf.label}
            </button>
          ))}
        </div>

        {/* Chart Style Toggle */}
        <div className="controls-group">
          <button
            className={`btn-toggle ${chartType === 'candlestick' ? 'active' : ''}`}
            onClick={() => setChartType('candlestick')}
          >
            📊 Candlesticks
          </button>
          <button
            className={`btn-toggle ${chartType === 'line' ? 'active' : ''}`}
            onClick={() => setChartType('line')}
          >
            📈 Line
          </button>
        </div>

        {/* Technical Indicators */}
        <div className="controls-group">
          <label className={`indicator-checkbox ${showVolume ? 'checked' : ''}`}>
            <input
              type="checkbox"
              checked={showVolume}
              onChange={e => setShowVolume(e.target.checked)}
            />
            Volume
          </label>

          <label className={`indicator-checkbox ${showSMA20 ? 'checked' : ''}`}>
            <input
              type="checkbox"
              checked={showSMA20}
              onChange={e => setShowSMA20(e.target.checked)}
            />
            <span className="indicator-badge-dot" style={{ backgroundColor: '#38bdf8' }} />
            SMA 20
          </label>

          <label className={`indicator-checkbox ${showSMA50 ? 'checked' : ''}`}>
            <input
              type="checkbox"
              checked={showSMA50}
              onChange={e => setShowSMA50(e.target.checked)}
            />
            <span className="indicator-badge-dot" style={{ backgroundColor: '#f59e0b' }} />
            SMA 50
          </label>

          <label className={`indicator-checkbox ${showSMA200 ? 'checked' : ''}`}>
            <input
              type="checkbox"
              checked={showSMA200}
              onChange={e => setShowSMA200(e.target.checked)}
            />
            <span className="indicator-badge-dot" style={{ backgroundColor: '#a855f7' }} />
            SMA 200
          </label>

          <label className={`indicator-checkbox ${showEMA20 ? 'checked' : ''}`}>
            <input
              type="checkbox"
              checked={showEMA20}
              onChange={e => setShowEMA20(e.target.checked)}
            />
            <span className="indicator-badge-dot" style={{ backgroundColor: '#10b981' }} />
            EMA 20
          </label>

          <label className={`indicator-checkbox ${showBollinger ? 'checked' : ''}`}>
            <input
              type="checkbox"
              checked={showBollinger}
              onChange={e => setShowBollinger(e.target.checked)}
            />
            <span className="indicator-badge-dot" style={{ backgroundColor: '#06b6d4' }} />
            Bollinger (20,2)
          </label>

          <label className={`indicator-checkbox ${showRSI ? 'checked' : ''}`}>
            <input
              type="checkbox"
              checked={showRSI}
              onChange={e => setShowRSI(e.target.checked)}
            />
            <span className="indicator-badge-dot" style={{ backgroundColor: '#f43f5e' }} />
            RSI (14)
          </label>
        </div>
      </div>

      {/* Chart Canvas Card */}
      <div className="chart-wrapper-card">
        {loading && (
          <div className="loading-skeleton-container">
            <div className="loading-spinner" />
            <p style={{ color: '#94a3b8' }}>Streaming real market quotes for {symbol}...</p>
          </div>
        )}

        {crosshairData && (
          <div className="chart-legend-overlay">
            {crosshairData.open !== undefined ? (
              <>
                <span>O: <b>${crosshairData.open?.toFixed(2)}</b></span>
                <span>H: <b>${crosshairData.high?.toFixed(2)}</b></span>
                <span>L: <b>${crosshairData.low?.toFixed(2)}</b></span>
                <span>C: <b>${crosshairData.close?.toFixed(2)}</b></span>
              </>
            ) : (
              <span>Close: <b>${crosshairData.value?.toFixed(2)}</b></span>
            )}
          </div>
        )}

        <div
          ref={chartContainerRef}
          className="chart-canvas-container"
          style={{ display: loading ? 'none' : 'block' }}
        />

        {showRSI && !loading && (
          <div ref={rsiContainerRef} className="rsi-canvas-container" />
        )}
      </div>

      {/* Regulatory & Market Compliance Disclaimer */}
      <div className="disclaimer-card">
        <span>ℹ️</span>
        <div>
          <b>Market Data & Analytical Disclosure:</b> Real-time and historical equity data are retrieved via live Yahoo Finance market endpoints. Market data may be delayed up to 15 minutes in compliance with exchange terms. Stocklyser provides technical charting, indicators, and analytical modeling exclusively for research and educational purposes. Nothing on this platform constitutes financial or investment advice.
        </div>
      </div>
    </div>
  );
}
