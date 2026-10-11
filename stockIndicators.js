export const calculateSMA = (data, period) => {
  return data.map((_, i) => {
    if (i < period - 1) return null;
    const slice = data.slice(i - period + 1, i + 1);
    const sum = slice.reduce((acc, curr) => acc + curr.close, 0);
    return parseFloat((sum / period).toFixed(2));
  });
};

export const calculateEMA = (data, period) => {
  const k = 2 / (period + 1);
  let prevEMA = null;
  return data.map((d, i) => {
    if (i < period - 1) return null;
    if (prevEMA === null) {
      const slice = data.slice(0, period);
      prevEMA = slice.reduce((acc, curr) => acc + curr.close, 0) / period;
      return parseFloat(prevEMA.toFixed(2));
    }
    prevEMA = d.close * k + prevEMA * (1 - k);
    return parseFloat(prevEMA.toFixed(2));
  });
};

export const calculateRSI = (data, period = 14) => {
  let gains = 0, losses = 0;
  for (let i = 1; i <= period && i < data.length; i++) {
    const diff = data[i].close - data[i - 1].close;
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  return data.map((d, i) => {
    if (i < period) return null;
    if (i > period) {
      const diff = d.close - data[i - 1].close;
      avgGain = (avgGain * (period - 1) + (diff > 0 ? diff : 0)) / period;
      avgLoss = (avgLoss * (period - 1) + (diff < 0 ? Math.abs(diff) : 0)) / period;
    }
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return parseFloat((100 - 100 / (1 + rs)).toFixed(2));
  });
};