/**
 * Calculates Sharpe Ratio
 * Sharpe = (Mean Return - Risk Free Rate) / Standard Deviation of Returns
 */
export const calculateSharpeRatio = (returns, riskFreeRate = 0.02) => {
  if (!returns || returns.length === 0) return 0;
  const meanReturn = returns.reduce((acc, val) => acc + val, 0) / returns.length;
  const variance = returns.reduce((acc, val) => acc + Math.pow(val - meanReturn, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);

  if (stdDev === 0) return 0;
  return parseFloat(((meanReturn - riskFreeRate) / stdDev).toFixed(2));
};

/**
 * Calculates Portfolio Beta relative to Benchmark Returns
 * Beta = Covariance(Portfolio, Benchmark) / Variance(Benchmark)
 */
export const calculateBeta = (portfolioReturns, benchmarkReturns) => {
  if (!portfolioReturns || !benchmarkReturns || portfolioReturns.length !== benchmarkReturns.length || portfolioReturns.length === 0) {
    return 1.0;
  }

  const meanPort = portfolioReturns.reduce((acc, val) => acc + val, 0) / portfolioReturns.length;
  const meanBench = benchmarkReturns.reduce((acc, val) => acc + val, 0) / benchmarkReturns.length;

  let covariance = 0;
  let benchVariance = 0;

  for (let i = 0; i < portfolioReturns.length; i++) {
    covariance += (portfolioReturns[i] - meanPort) * (benchmarkReturns[i] - meanBench);
    benchVariance += Math.pow(benchmarkReturns[i] - meanBench, 2);
  }

  if (benchVariance === 0) return 1.0;
  return parseFloat((covariance / benchVariance).toFixed(2));
};

/**
 * Calculates Value at Risk (VaR) at 95% confidence level (Z = 1.645)
 */
export const calculateValueAtRisk = (portfolioValue, returns, confidence = 0.95) => {
  if (!returns || returns.length === 0) return 0;
  const meanReturn = returns.reduce((acc, val) => acc + val, 0) / returns.length;
  const variance = returns.reduce((acc, val) => acc + Math.pow(val - meanReturn, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);

  // Z-score for 95% confidence
  const zScore = confidence === 0.99 ? 2.326 : 1.645;
  const varPercent = zScore * stdDev - meanReturn;

  return parseFloat((portfolioValue * Math.max(0, varPercent)).toFixed(2));
};