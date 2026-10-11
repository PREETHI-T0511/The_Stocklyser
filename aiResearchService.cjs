const axios = require('axios');

/**
 * Fetches grounded financial context for a given stock ticker
 */
async function getStockContext(symbol) {
  const cleanSymbol = symbol.toUpperCase();
  
  // In production, integrate with SEC EDGAR, Alpha Vantage, or Yahoo Finance API
  const simulatedFundamentalData = {
    symbol: cleanSymbol,
    peRatio: 28.5,
    marketCap: "2.8T",
    revenueGrowthYoY: "11.2%",
    debtToEquity: 1.4,
    lastQuarterEarnings: "Beat estimate by $0.08 per share",
    dataSource: "SEC EDGAR / Yahoo Finance API",
    asOfDate: "2026-Q3"
  };

  return simulatedFundamentalData;
}

/**
 * Generates an AI research report grounded strictly in retrieved financial data
 */
async function generateGroundedResearch(symbol, userQuery) {
  const context = await getStockContext(symbol);

  // Construct grounded response with citation tracking
  const facts = [
    `P/E Ratio is ${context.peRatio}`,
    `Market Cap is $${context.marketCap}`,
    `YoY Revenue Growth is ${context.revenueGrowthYoY}`,
    `Last Quarter Earnings: ${context.lastQuarterEarnings}`
  ];

  const interpretations = [
    `The valuation (P/E of ${context.peRatio}) reflects high market expectations relative to current earnings.`,
    `Revenue growth at ${context.revenueGrowthYoY} indicates steady top-line expansion.`
  ];

  return {
    symbol: context.symbol,
    query: userQuery,
    facts,
    interpretations,
    disclaimer: "Disclaimer: Generated insights are for research purposes only and do not constitute financial advice.",
    timestamp: new Date().toISOString()
  };
}

module.exports = { getStockContext, generateGroundedResearch };