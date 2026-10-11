/**
 * Normalizes multi-stock closing prices to percentage change from baseline t=0
 */
export const normalizeStockPrices = (seriesData) => {
  if (!seriesData || seriesData.length === 0) return [];
  
  const basePrice = seriesData[0].close;
  if (basePrice === 0) return seriesData.map(() => 0);

  return seriesData.map((point) => ({
    time: point.time,
    percentageChange: parseFloat((((point.close - basePrice) / basePrice) * 100).toFixed(2)),
  }));
};

/**
 * Groups stocks into sector performance bins
 */
export const calculateSectorHeatmap = (stocks) => {
  return stocks.reduce((acc, stock) => {
    const { sector, changePercent } = stock;
    if (!acc[sector]) {
      acc[sector] = { totalChange: 0, count: 0, stocks: [] };
    }
    acc[sector].totalChange += changePercent;
    acc[sector].count += 1;
    acc[sector].stocks.push(stock);
    return acc;
  }, {});
};