import { calculateSMA, calculateEMA, calculateRSI, calculateBollingerBands, calculateMACD } from './indicators.js';

async function runFeature1Tests() {
  console.log('--- Starting Feature 1 Verification Tests ---');

  // 1. Math Verification
  console.log('1. Testing Indicators Math...');
  const sampleCandles = Array.from({ length: 60 }, (_, i) => ({
    time: `2025-01-${String(i + 1).padStart(2, '0')}`,
    close: 150 + Math.sin(i / 4) * 20 + i * 0.3,
  }));

  const sma20 = calculateSMA(sampleCandles, 20);
  if (sma20.length !== 41) throw new Error(`SMA length error: got ${sma20.length}`);
  console.log('   ✓ SMA20 passed');

  const ema20 = calculateEMA(sampleCandles, 20);
  if (ema20.length !== 41) throw new Error(`EMA length error: got ${ema20.length}`);
  console.log('   ✓ EMA20 passed');

  const rsi14 = calculateRSI(sampleCandles, 14);
  if (rsi14.length !== 46) throw new Error(`RSI length error: got ${rsi14.length}`);
  if (rsi14.some(r => r.value < 0 || r.value > 100)) throw new Error('RSI bounds error');
  console.log('   ✓ RSI14 passed');

  const bb = calculateBollingerBands(sampleCandles, 20, 2);
  if (bb.middle.length !== 41) throw new Error('BB length error');
  if (bb.upper[0].value <= bb.middle[0].value || bb.middle[0].value <= bb.lower[0].value) {
    throw new Error('BB invariant error');
  }
  console.log('   ✓ Bollinger Bands passed');

  const macd = calculateMACD(sampleCandles, 12, 26, 9);
  if (macd.length === 0) throw new Error('MACD calculation error');
  console.log('   ✓ MACD passed');

  // 2. Market Data Service Verification
  console.log('2. Testing Market Data Service...');
  const { getChart, getQuote, searchSymbols } = await import('./marketService.cjs');

  const quote = await getQuote('AAPL');
  if (!quote.price || quote.symbol !== 'AAPL') {
    throw new Error('getQuote AAPL returned invalid payload: ' + JSON.stringify(quote));
  }
  console.log(`   ✓ getQuote passed: AAPL @ $${quote.price} (${quote.name})`);

  const chart = await getChart('NVDA', '1mo', '1d');
  if (!chart.candles || chart.candles.length === 0) {
    throw new Error('getChart NVDA returned no candles');
  }
  const lastCandle = chart.candles[chart.candles.length - 1];
  if (!lastCandle.time || !lastCandle.close || !lastCandle.high || !lastCandle.low) {
    throw new Error('getChart candle format invalid: ' + JSON.stringify(lastCandle));
  }
  console.log(`   ✓ getChart passed: NVDA returned ${chart.candles.length} candles. Last close: $${lastCandle.close}`);

  const search = await searchSymbols('Tesla');
  if (!Array.isArray(search) || search.length === 0 || !search.some(s => s.symbol === 'TSLA')) {
    throw new Error('searchSymbols Tesla failed');
  }
  console.log(`   ✓ searchSymbols passed: Found ${search.length} matches, including TSLA`);

  console.log('--- ALL FEATURE 1 TESTS PASSED SUCCESSFULLY! ---');
}

runFeature1Tests().catch(err => {
  console.error('Test failure:', err);
  process.exit(1);
});
