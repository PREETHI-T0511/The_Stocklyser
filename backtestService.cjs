/**
 * Backtests a Simple Moving Average (SMA) Crossover strategy on candle data.
 * Prevents future-data leakage by calculating signals strictly on past data (t-1).
 * Deducts transaction fee % and slippage % on every trade.
 */
function runSMACrossoverBacktest(candles, shortPeriod = 5, longPeriod = 20, initialCapital = 10000, commissionRate = 0.001, slippageRate = 0.0005) {
  if (!candles || candles.length < longPeriod) {
    throw new Error('Insufficient historical candle data for chosen periods');
  }

  let cash = initialCapital;
  let shares = 0;
  let portfolioValueHistory = [];
  let trades = [];

  // Calculate moving averages iteratively to avoid look-ahead bias
  for (let i = 0; i < candles.length; i++) {
    const currentCandle = candles[i];

    // Need enough historical data up to current point i
    if (i >= longPeriod) {
      const pastShortSlice = candles.slice(i - shortPeriod, i);
      const pastLongSlice = candles.slice(i - longPeriod, i);

      const shortSMA = pastShortSlice.reduce((acc, c) => acc + c.close, 0) / shortPeriod;
      const longSMA = pastLongSlice.reduce((acc, c) => acc + c.close, 0) / longPeriod;

      const prevShortSlice = candles.slice(i - shortPeriod - 1, i - 1);
      const prevLongSlice = candles.slice(i - longPeriod - 1, i - 1);

      const prevShortSMA = prevShortSlice.reduce((acc, c) => acc + c.close, 0) / shortPeriod;
      const prevLongSMA = prevLongSlice.reduce((acc, c) => acc + c.close, 0) / longPeriod;

      // Bullish Crossover (BUY Signal)
      if (prevShortSMA <= prevLongSMA && shortSMA > longSMA && cash > 0) {
        const executionPrice = currentCandle.open * (1 + slippageRate); // Account for execution slippage
        const buyableShares = Math.floor(cash / executionPrice);
        
        if (buyableShares > 0) {
          const tradeCost = buyableShares * executionPrice;
          const fee = tradeCost * commissionRate;
          cash -= (tradeCost + fee);
          shares += buyableShares;

          trades.push({
            type: 'BUY',
            date: currentCandle.time,
            price: parseFloat(executionPrice.toFixed(2)),
            shares: buyableShares,
            fee: parseFloat(fee.toFixed(2)),
          });
        }
      } 
      // Bearish Crossover (SELL Signal)
      else if (prevShortSMA >= prevLongSMA && shortSMA < longSMA && shares > 0) {
        const executionPrice = currentCandle.open * (1 - slippageRate);
        const grossProceeds = shares * executionPrice;
        const fee = grossProceeds * commissionRate;
        cash += (grossProceeds - fee);

        trades.push({
          type: 'SELL',
          date: currentCandle.time,
          price: parseFloat(executionPrice.toFixed(2)),
          shares: shares,
          fee: parseFloat(fee.toFixed(2)),
        });

        shares = 0;
      }
    }

    const totalVal = cash + (shares * currentCandle.close);
    portfolioValueHistory.push({
      time: currentCandle.time,
      portfolioValue: parseFloat(totalVal.toFixed(2)),
      benchmarkValue: parseFloat(((currentCandle.close / candles[0].close) * initialCapital).toFixed(2)),
    });
  }

  const finalValue = portfolioValueHistory[portfolioValueHistory.length - 1].portfolioValue;
  const totalReturn = parseFloat((((finalValue - initialCapital) / initialCapital) * 100).toFixed(2));
  
  // Calculate Peak and Maximum Drawdown
  let peak = initialCapital;
  let maxDrawdown = 0;

  portfolioValueHistory.forEach((pt) => {
    if (pt.portfolioValue > peak) peak = pt.portfolioValue;
    const drawdown = ((peak - pt.portfolioValue) / peak) * 100;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  });

  return {
    initialCapital,
    finalValue,
    totalReturnPercent: totalReturn,
    maxDrawdownPercent: parseFloat(maxDrawdown.toFixed(2)),
    totalTrades: trades.length,
    trades,
    equityCurve: portfolioValueHistory,
  };
}

module.exports = { runSMACrossoverBacktest };