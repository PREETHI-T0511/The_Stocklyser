/**
 * Technical Indicators Calculation Engine
 * Pure mathematical functions for financial time-series analysis.
 */

/**
 * Simple Moving Average (SMA)
 * @param {Array<{time: number|string, close: number}>} data 
 * @param {number} period 
 * @returns {Array<{time: number|string, value: number}>}
 */
export function calculateSMA(data, period = 20) {
  if (!Array.isArray(data) || data.length < period) return [];
  const result = [];
  let sum = 0;

  for (let i = 0; i < data.length; i++) {
    sum += data[i].close;
    if (i >= period) {
      sum -= data[i - period].close;
    }
    if (i >= period - 1) {
      result.push({
        time: data[i].time,
        value: Number((sum / period).toFixed(2)),
      });
    }
  }
  return result;
}

/**
 * Exponential Moving Average (EMA)
 * @param {Array<{time: number|string, close: number}>} data 
 * @param {number} period 
 * @returns {Array<{time: number|string, value: number}>}
 */
export function calculateEMA(data, period = 20) {
  if (!Array.isArray(data) || data.length < period) return [];
  const result = [];
  const multiplier = 2 / (period + 1);

  // Initial SMA as starting point
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i].close;
  }
  let prevEMA = sum / period;
  result.push({
    time: data[period - 1].time,
    value: Number(prevEMA.toFixed(2)),
  });

  for (let i = period; i < data.length; i++) {
    const currentClose = data[i].close;
    const currentEMA = (currentClose - prevEMA) * multiplier + prevEMA;
    result.push({
      time: data[i].time,
      value: Number(currentEMA.toFixed(2)),
    });
    prevEMA = currentEMA;
  }
  return result;
}

/**
 * Relative Strength Index (RSI - Wilder's Smoothing)
 * @param {Array<{time: number|string, close: number}>} data 
 * @param {number} period 
 * @returns {Array<{time: number|string, value: number}>}
 */
export function calculateRSI(data, period = 14) {
  if (!Array.isArray(data) || data.length <= period) return [];
  const result = [];

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const change = data[i].close - data[i - 1].close;
    if (change >= 0) gains += change;
    else losses += Math.abs(change);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  let rsi = avgLoss === 0 ? 100 : 100 - (100 / (1 + rs));

  result.push({
    time: data[period].time,
    value: Number(rsi.toFixed(2)),
  });

  for (let i = period + 1; i < data.length; i++) {
    const change = data[i].close - data[i - 1].close;
    const currentGain = change >= 0 ? change : 0;
    const currentLoss = change < 0 ? Math.abs(change) : 0;

    avgGain = (avgGain * (period - 1) + currentGain) / period;
    avgLoss = (avgLoss * (period - 1) + currentLoss) / period;

    rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi = avgLoss === 0 ? 100 : 100 - (100 / (1 + rs));

    result.push({
      time: data[i].time,
      value: Number(rsi.toFixed(2)),
    });
  }
  return result;
}

/**
 * Bollinger Bands
 * @param {Array<{time: number|string, close: number}>} data 
 * @param {number} period 
 * @param {number} stdDevMult 
 * @returns {{upper: Array<{time: number|string, value: number}>, middle: Array<{time: number|string, value: number}>, lower: Array<{time: number|string, value: number}>}}
 */
export function calculateBollingerBands(data, period = 20, stdDevMult = 2) {
  if (!Array.isArray(data) || data.length < period) {
    return { upper: [], middle: [], lower: [] };
  }

  const upper = [];
  const middle = [];
  const lower = [];

  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    const mean = slice.reduce((acc, curr) => acc + curr.close, 0) / period;

    const variance = slice.reduce((acc, curr) => acc + Math.pow(curr.close - mean, 2), 0) / period;
    const stdDev = Math.sqrt(variance);

    const time = data[i].time;
    const midVal = Number(mean.toFixed(2));
    const upVal = Number((mean + stdDev * stdDevMult).toFixed(2));
    const lowVal = Number((mean - stdDev * stdDevMult).toFixed(2));

    middle.push({ time, value: midVal });
    upper.push({ time, value: upVal });
    lower.push({ time, value: lowVal });
  }

  return { upper, middle, lower };
}

/**
 * Moving Average Convergence Divergence (MACD)
 * @param {Array<{time: number|string, close: number}>} data 
 * @param {number} fastPeriod 
 * @param {number} slowPeriod 
 * @param {number} signalPeriod 
 * @returns {Array<{time: number|string, macd: number, signal: number, histogram: number}>}
 */
export function calculateMACD(data, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
  if (!Array.isArray(data) || data.length < slowPeriod + signalPeriod) return [];

  const fastEMA = calculateEMA(data, fastPeriod);
  const slowEMA = calculateEMA(data, slowPeriod);

  // Map slowEMA times to find intersection
  const slowMap = new Map(slowEMA.map(item => [item.time, item.value]));

  const macdLine = [];
  for (const item of fastEMA) {
    if (slowMap.has(item.time)) {
      macdLine.push({
        time: item.time,
        close: Number((item.value - slowMap.get(item.time)).toFixed(2)),
      });
    }
  }

  const signalLine = calculateEMA(macdLine, signalPeriod);
  const signalMap = new Map(signalLine.map(item => [item.time, item.value]));

  const result = [];
  for (const item of macdLine) {
    if (signalMap.has(item.time)) {
      const sig = signalMap.get(item.time);
      const macd = item.close;
      result.push({
        time: item.time,
        macd,
        signal: sig,
        histogram: Number((macd - sig).toFixed(2)),
      });
    }
  }

  return result;
}
