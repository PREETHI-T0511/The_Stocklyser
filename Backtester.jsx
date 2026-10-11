import React, { useState, useRef, useEffect, useCallback } from 'react';
import './backtester.css';

// ── SVG Equity Curve Chart (inline, no external lib dep) ────────────────────

function EquityChart({ strategyData, benchmarkData, symbol }) {
  const svgRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);

  const W = 900, H = 320, PAD = { top: 16, right: 20, bottom: 44, left: 72 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  // Merge & align dates
  const allEquities = [...strategyData.map(d => d.equity), ...benchmarkData.map(d => d.equity)];
  const minE = Math.min(...allEquities) * 0.97;
  const maxE = Math.max(...allEquities) * 1.02;

  const xScale = (i, total) => PAD.left + (i / Math.max(total - 1, 1)) * chartW;
  const yScale = (v) => PAD.top + chartH - ((v - minE) / (maxE - minE)) * chartH;

  const buildPath = (data) => data.map((d, i) => {
    const x = xScale(i, data.length);
    const y = yScale(d.equity);
    return `${i === 0 ? 'M' : 'L'}${x},${y}`;
  }).join(' ');

  // X-axis labels (8 evenly spaced)
  const xLabels = [];
  const n = strategyData.length;
  for (let i = 0; i < 8; i++) {
    const idx = Math.floor((i / 7) * (n - 1));
    const d = strategyData[idx];
    if (d) xLabels.push({ x: xScale(idx, n), label: d.date?.slice(0, 7) });
  }
  // Y-axis labels (5)
  const yLabels = [];
  for (let i = 0; i <= 4; i++) {
    const v = minE + (i / 4) * (maxE - minE);
    yLabels.push({ y: yScale(v), label: `\$${(v / 1000).toFixed(1)}k` });
  }

  // Trade signals on chart
  const buySignals = strategyData.filter(d => d.signal === 'BUY');
  const sellSignals = strategyData.filter(d => d.signal === 'SELL');

  const handleMouseMove = useCallback((e) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const relX = e.clientX - rect.left - PAD.left;
    const idx = Math.round((relX / chartW) * (n - 1));
    const clamped = Math.max(0, Math.min(n - 1, idx));
    const sd = strategyData[clamped];
    const bd = benchmarkData[Math.min(clamped, benchmarkData.length - 1)];
    if (sd) setTooltip({ x: xScale(clamped, n), y: yScale(sd.equity), sd, bd });
  }, [strategyData, benchmarkData, n]);

  return (
    <div className="equity-chart-wrapper">
      <svg
        ref={svgRef}
        width="100%" viewBox={`0 0 ${W} ${H}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
        style={{ cursor: 'crosshair' }}
      >
        {/* Grid lines */}
        {yLabels.map((yl, i) => (
          <g key={i}>
            <line x1={PAD.left} x2={W - PAD.right} y1={yl.y} y2={yl.y}
              stroke="#1e2d45" strokeWidth="1" strokeDasharray="4,4" />
            <text x={PAD.left - 6} y={yl.y + 4} textAnchor="end"
              fill="#4b5563" fontSize="11">{yl.label}</text>
          </g>
        ))}
        {/* X labels */}
        {xLabels.map((xl, i) => (
          <text key={i} x={xl.x} y={H - 8} textAnchor="middle"
            fill="#4b5563" fontSize="11">{xl.label}</text>
        ))}

        {/* Benchmark path */}
        <path d={buildPath(benchmarkData)} fill="none"
          stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="5,3" opacity="0.6" />

        {/* Strategy path */}
        <path d={buildPath(strategyData)} fill="none"
          stroke="#3b82f6" strokeWidth="2.5" />

        {/* Gradient fill under strategy */}
        <defs>
          <linearGradient id="stratGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d={`${buildPath(strategyData)} L${xScale(n - 1, n)},${H - PAD.bottom} L${PAD.left},${H - PAD.bottom} Z`}
          fill="url(#stratGrad)"
        />

        {/* Buy/Sell markers */}
        {strategyData.map((d, i) => {
          if (!d.signal) return null;
          const x = xScale(i, n);
          const y = yScale(d.equity);
          return d.signal === 'BUY'
            ? <polygon key={`b${i}`} points={`${x},${y - 14} ${x - 6},${y} ${x + 6},${y}`} fill="#22c55e" opacity="0.85" />
            : <polygon key={`s${i}`} points={`${x},${y + 14} ${x - 6},${y} ${x + 6},${y}`} fill="#ef4444" opacity="0.85" />;
        })}

        {/* Tooltip */}
        {tooltip && (
          <g>
            <line x1={tooltip.x} x2={tooltip.x} y1={PAD.top} y2={H - PAD.bottom}
              stroke="#60a5fa" strokeWidth="1" strokeDasharray="3,3" />
            <circle cx={tooltip.x} cy={tooltip.y} r="4" fill="#3b82f6" />
            <rect x={tooltip.x + 8} y={tooltip.y - 44} width="180" height="56"
              rx="6" fill="#131929" stroke="#1e2d45" />
            <text x={tooltip.x + 16} y={tooltip.y - 28} fill="#a0adc0" fontSize="11">
              {tooltip.sd.date}
            </text>
            <text x={tooltip.x + 16} y={tooltip.y - 13} fill="#60a5fa" fontSize="12" fontWeight="600">
              Strategy: ${tooltip.sd.equity?.toFixed(0)}
            </text>
            <text x={tooltip.x + 16} y={tooltip.y + 2} fill="#f59e0b" fontSize="12">
              SPY: ${tooltip.bd?.equity?.toFixed(0)}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}

// ── Strategy param helpers ───────────────────────────────────────────────────
const STRATEGY_DEFAULTS = {
  smaCrossover:      { shortPeriod: 20, longPeriod: 50 },
  rsiMeanReversion:  { period: 14, oversold: 30, overbought: 70 },
  buyAndHold:        {},
};
const STRATEGY_LABELS = {
  smaCrossover: 'SMA Crossover',
  rsiMeanReversion: 'RSI Mean-Reversion',
  buyAndHold: 'Buy & Hold',
};

// ── KPI Card ─────────────────────────────────────────────────────────────────
function KPI({ label, value, sub, colorClass = 'neutral' }) {
  return (
    <div className="kpi-card">
      <div className="kpi-label">{label}</div>
      <div className={`kpi-value ${colorClass}`}>{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  );
}

function colorBySign(num) {
  if (num > 0) return 'positive';
  if (num < 0) return 'negative';
  return 'neutral';
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Backtester() {
  const [symbol, setSymbol]           = useState('AAPL');
  const [strategy, setStrategy]       = useState('smaCrossover');
  const [range, setRange]             = useState('2y');
  const [initialCapital, setCapital]  = useState(10000);
  const [commissionFlat, setCommFlat] = useState(1.0);
  const [commissionPct, setCommPct]   = useState(0.1);   // displayed as %
  const [slippagePct, setSlippage]    = useState(0.05);  // displayed as %
  const [params, setParams]           = useState({ ...STRATEGY_DEFAULTS.smaCrossover });

  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [result, setResult]     = useState(null);

  // Update params when strategy changes
  useEffect(() => {
    setParams({ ...STRATEGY_DEFAULTS[strategy] });
  }, [strategy]);

  const runBacktest = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('http://localhost:5000/api/backtest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol,
          strategy,
          range,
          initialCapital: Number(initialCapital),
          commissionFlat: Number(commissionFlat),
          commissionPct: Number(commissionPct) / 100,
          slippagePct: Number(slippagePct) / 100,
          params,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Backtest failed');
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const strategyExcess = result
    ? result.totalReturn - result.benchmark.totalReturn
    : null;

  return (
    <div className="backtester-page">

      {/* Header */}
      <div className="backtester-header">
        <h1>📉 Strategy Backtester</h1>
        <p className="subtitle">
          Test trading strategies on historical data with realistic transaction costs &amp; slippage. Compare against SPY benchmark.
        </p>
        <div className="disclaimer-banner">
          ⚠️ Backtested results are <strong>hypothetical</strong>. Past performance does not guarantee future results.
          This tool is for educational purposes only — not financial advice.
        </div>
      </div>

      {/* Config Card */}
      <div className="config-card">
        <h2>Configuration</h2>

        <div className="config-grid">
          <div className="config-field">
            <label>Symbol</label>
            <input
              value={symbol}
              onChange={e => setSymbol(e.target.value.toUpperCase())}
              placeholder="e.g. AAPL"
              maxLength={10}
            />
          </div>
          <div className="config-field">
            <label>Strategy</label>
            <select value={strategy} onChange={e => setStrategy(e.target.value)}>
              {Object.entries(STRATEGY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div className="config-field">
            <label>Historical Range</label>
            <select value={range} onChange={e => setRange(e.target.value)}>
              <option value="6mo">6 Months</option>
              <option value="1y">1 Year</option>
              <option value="2y">2 Years</option>
              <option value="5y">5 Years</option>
              <option value="10y">10 Years</option>
              <option value="max">Max</option>
            </select>
          </div>
          <div className="config-field">
            <label>Initial Capital ($)</label>
            <input
              type="number" min="100" max="10000000"
              value={initialCapital}
              onChange={e => setCapital(e.target.value)}
            />
          </div>
          <div className="config-field">
            <label>Commission (flat $)</label>
            <input
              type="number" min="0" step="0.5"
              value={commissionFlat}
              onChange={e => setCommFlat(e.target.value)}
            />
          </div>
          <div className="config-field">
            <label>Commission (% notional)</label>
            <input
              type="number" min="0" max="5" step="0.01"
              value={commissionPct}
              onChange={e => setCommPct(e.target.value)}
            />
          </div>
          <div className="config-field">
            <label>Slippage (%)</label>
            <input
              type="number" min="0" max="5" step="0.01"
              value={slippagePct}
              onChange={e => setSlippage(e.target.value)}
            />
          </div>
        </div>

        {/* Dynamic strategy params */}
        {strategy === 'smaCrossover' && (
          <div className="strategy-params">
            <h3>SMA Crossover Parameters</h3>
            <div className="params-row">
              <div className="config-field">
                <label>Short Period (days)</label>
                <input type="number" min="2" max="200"
                  value={params.shortPeriod || 20}
                  onChange={e => setParams(p => ({ ...p, shortPeriod: +e.target.value }))}
                />
              </div>
              <div className="config-field">
                <label>Long Period (days)</label>
                <input type="number" min="2" max="500"
                  value={params.longPeriod || 50}
                  onChange={e => setParams(p => ({ ...p, longPeriod: +e.target.value }))}
                />
              </div>
            </div>
          </div>
        )}
        {strategy === 'rsiMeanReversion' && (
          <div className="strategy-params">
            <h3>RSI Mean-Reversion Parameters</h3>
            <div className="params-row">
              <div className="config-field">
                <label>RSI Period</label>
                <input type="number" min="2" max="100"
                  value={params.period || 14}
                  onChange={e => setParams(p => ({ ...p, period: +e.target.value }))}
                />
              </div>
              <div className="config-field">
                <label>Oversold Threshold</label>
                <input type="number" min="1" max="49"
                  value={params.oversold || 30}
                  onChange={e => setParams(p => ({ ...p, oversold: +e.target.value }))}
                />
              </div>
              <div className="config-field">
                <label>Overbought Threshold</label>
                <input type="number" min="51" max="99"
                  value={params.overbought || 70}
                  onChange={e => setParams(p => ({ ...p, overbought: +e.target.value }))}
                />
              </div>
            </div>
          </div>
        )}

        <button className="run-btn" onClick={runBacktest} disabled={loading || !symbol}>
          {loading ? <span className="spinner">⟳</span> : '▶'}
          {loading ? ' Running backtest…' : ` Run ${STRATEGY_LABELS[strategy]} on ${symbol || '…'}`}
        </button>
      </div>

      {/* Error */}
      {error && <div className="backtest-error">❌ {error}</div>}

      {/* Results */}
      {result && (
        <div className="results-section">
          <h2>
            Results — {result.symbol} · {STRATEGY_LABELS[result.strategy]} · {result.range} ·{' '}
            {result.dataPoints} trading days
          </h2>

          {/* KPI Grid */}
          <div className="kpi-grid">
            <KPI
              label="Total Return"
              value={`${result.totalReturn > 0 ? '+' : ''}${result.totalReturn}%`}
              sub="Strategy"
              colorClass={colorBySign(result.totalReturn)}
            />
            <KPI
              label="vs SPY Benchmark"
              value={`${strategyExcess > 0 ? '+' : ''}${strategyExcess?.toFixed(2)}%`}
              sub="Alpha (excess return)"
              colorClass={colorBySign(strategyExcess)}
            />
            <KPI
              label="CAGR"
              value={`${result.cagr > 0 ? '+' : ''}${result.cagr}%`}
              sub="Compound annual growth"
              colorClass={colorBySign(result.cagr)}
            />
            <KPI
              label="Sharpe Ratio"
              value={result.sharpe}
              sub="Risk-adjusted return"
              colorClass={result.sharpe > 1 ? 'positive' : result.sharpe < 0 ? 'negative' : 'neutral'}
            />
            <KPI
              label="Max Drawdown"
              value={`-${result.maxDrawdown}%`}
              sub={`${result.drawdownPeriod.start?.slice(0, 7)} → ${result.drawdownPeriod.end?.slice(0, 7)}`}
              colorClass="negative"
            />
            <KPI
              label="Win Rate"
              value={`${result.winRate}%`}
              sub={`${result.totalTrades} trades`}
              colorClass={result.winRate > 50 ? 'positive' : result.winRate > 0 ? 'neutral' : 'neutral'}
            />
            <KPI
              label="Final Equity"
              value={`$${result.finalEquity.toLocaleString()}`}
              sub={`Started $${result.initialCapital.toLocaleString()}`}
              colorClass={colorBySign(result.finalEquity - result.initialCapital)}
            />
            <KPI
              label="Total Commissions"
              value={`$${result.commissionTotal}`}
              sub="Fees + slippage cost"
              colorClass="neutral"
            />
          </div>

          {/* Benchmark row */}
          <div className="benchmark-row">
            <div className="bench-card">
              <div className="label">📈 {result.symbol} ({STRATEGY_LABELS[result.strategy]})</div>
              <div className={`value ${colorBySign(result.totalReturn)}`}>
                {result.totalReturn > 0 ? '+' : ''}{result.totalReturn}%
              </div>
              <div className="sub">CAGR: {result.cagr > 0 ? '+' : ''}{result.cagr}% · Sharpe: {result.sharpe}</div>
            </div>
            <div className="bench-card">
              <div className="label">📊 SPY (Buy & Hold Benchmark)</div>
              <div className={`value ${colorBySign(result.benchmark.totalReturn)}`}>
                {result.benchmark.totalReturn > 0 ? '+' : ''}{result.benchmark.totalReturn}%
              </div>
              <div className="sub">S&P 500 ETF over same period</div>
            </div>
          </div>

          {/* Equity Curve Chart */}
          <div className="chart-card">
            <h3>Equity Curve</h3>
            <div className="chart-legend">
              <div className="legend-item">
                <div className="legend-dot" style={{ background: '#3b82f6' }}></div>
                {result.symbol} Strategy
              </div>
              <div className="legend-item">
                <div className="legend-dot" style={{ background: '#f59e0b' }}></div>
                SPY Benchmark
              </div>
              <div className="legend-item">
                <div className="legend-dot" style={{ background: '#22c55e' }}></div>
                Buy Signal ▲
              </div>
              <div className="legend-item">
                <div className="legend-dot" style={{ background: '#ef4444' }}></div>
                Sell Signal ▼
              </div>
            </div>
            <EquityChart
              strategyData={result.equityCurve}
              benchmarkData={result.benchmark.equityCurve}
              symbol={result.symbol}
            />
          </div>

          {/* Trades Table */}
          <div className="trades-card">
            <h3>Trade Log ({result.trades.length} trades)</h3>
            {result.trades.length === 0 ? (
              <div className="no-trades">No trades executed — try different strategy parameters or a longer range.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="trades-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Date</th>
                      <th>Action</th>
                      <th>Fill Price</th>
                      <th>Shares</th>
                      <th>Commission</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.trades.map((t, i) => (
                      <tr key={i}>
                        <td>{i + 1}</td>
                        <td>{t.date}</td>
                        <td className={t.action === 'BUY' ? 'trade-buy' : 'trade-sell'}>{t.action}</td>
                        <td>${t.price.toFixed(2)}</td>
                        <td>{t.shares}</td>
                        <td>${t.commission.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Disclaimer */}
          <div className="disclaimer-banner" style={{ marginBottom: 0 }}>
            {result.disclaimer}
          </div>
        </div>
      )}
    </div>
  );
}
