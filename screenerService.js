/**
 * Screens stock list based on user-defined criteria
 */
export const filterStocks = (stocks, criteria = {}) => {
  const { maxPE, minMarketCap, maxRSI, minRSI, sector } = criteria;

  return stocks.filter((stock) => {
    if (sector && sector !== 'ALL' && stock.sector !== sector) return false;
    if (maxPE !== undefined && maxPE !== '' && stock.peRatio > Number(maxPE)) return false;
    if (minMarketCap !== undefined && minMarketCap !== '' && stock.marketCap < Number(minMarketCap)) return false;
    if (maxRSI !== undefined && maxRSI !== '' && stock.rsi > Number(maxRSI)) return false;
    if (minRSI !== undefined && minRSI !== '' && stock.rsi < Number(minRSI)) return false;
    return true;
  });
};

/**
 * Checks price alert triggers against current asset price
 */
export const evaluateAlerts = (alerts, currentPrices = {}) => {
  return alerts.map((alert) => {
    const price = currentPrices[alert.symbol];
    if (price === undefined) return { ...alert, triggered: false };

    let triggered = false;
    if (alert.condition === 'ABOVE' && price >= alert.targetPrice) triggered = true;
    if (alert.condition === 'BELOW' && price <= alert.targetPrice) triggered = true;

    return {
      ...alert,
      currentPrice: price,
      triggered,
      triggeredAt: triggered ? new Date().toISOString() : null,
    };
  });
};