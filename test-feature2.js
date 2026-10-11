import { compareSymbols, getSectorHeatmap } from './marketService.cjs';

async function runFeature2Tests() {
  console.log('--- Starting Feature 2: Multi-Stock Comparison & Sector Heatmap Tests ---');

  // Test 1: Multi-Stock Comparison
  console.log('1. Testing Multi-Stock Comparison Logic (AAPL, MSFT, NVDA, SPY)...');
  const symbols = ['AAPL', 'MSFT', 'NVDA', 'SPY'];
  const compareResult = await compareSymbols(symbols, '1mo', '1d');

  if (!compareResult || !Array.isArray(compareResult.series)) {
    throw new Error('compareSymbols did not return a series array');
  }

  if (compareResult.series.length !== 4) {
    throw new Error(`Expected 4 series, got ${compareResult.series.length}`);
  }

  for (const s of compareResult.series) {
    if (!s.data || s.data.length === 0) {
      throw new Error(`Series for ${s.symbol} has no normalized data points`);
    }
    // First data point must be 0% normalized
    const firstPoint = s.data[0];
    if (firstPoint.value !== 0) {
      throw new Error(`First data point for ${s.symbol} must be 0%, got ${firstPoint.value}%`);
    }

    if (typeof s.totalReturn !== 'number' || typeof s.volatility !== 'number') {
      throw new Error(`Metrics for ${s.symbol} missing or invalid: ${JSON.stringify(s)}`);
    }

    console.log(`   ✓ ${s.symbol}: Return=${s.totalReturn}%, Peak=${s.maxReturn}%, Volatility=${s.volatility}% (${s.data.length} candles)`);
  }
  console.log('   ✓ Multi-stock normalization & statistics calculation passed!');

  // Test 2: Sector Heatmap
  console.log('\n2. Testing Sector Heatmap Performance & Hierarchy...');
  const heatmap1d = await getSectorHeatmap('1d');

  if (!heatmap1d || !Array.isArray(heatmap1d.sectors)) {
    throw new Error('getSectorHeatmap did not return sectors array');
  }

  if (heatmap1d.sectors.length < 11) {
    throw new Error(`Expected 11 sectors, got ${heatmap1d.sectors.length}`);
  }

  // Check sort order (descending by performance)
  for (let i = 1; i < heatmap1d.sectors.length; i++) {
    if (heatmap1d.sectors[i].performance > heatmap1d.sectors[i - 1].performance) {
      throw new Error('Sectors are not sorted in descending order of performance');
    }
  }

  const topSector = heatmap1d.sectors[0];
  const bottomSector = heatmap1d.sectors[heatmap1d.sectors.length - 1];
  console.log(`   ✓ Top Performing Sector: ${topSector.name} (${topSector.etf}) @ ${topSector.performance}%`);
  console.log(`   ✓ Bottom Performing Sector: ${bottomSector.name} (${bottomSector.etf}) @ ${bottomSector.performance}%`);

  // Verify constituent stocks are populated
  for (const sec of heatmap1d.sectors) {
    if (!sec.stocks || sec.stocks.length === 0) {
      throw new Error(`Sector ${sec.name} has no constituent stocks`);
    }
    if (!sec.weight || typeof sec.performance !== 'number') {
      throw new Error(`Sector ${sec.name} missing weight or performance`);
    }
  }
  console.log(`   ✓ All ${heatmap1d.sectors.length} sectors verified with constituents & weights!`);

  console.log('\n--- ALL FEATURE 2 TESTS PASSED SUCCESSFULLY! ---');
}

runFeature2Tests().catch(err => {
  console.error('Feature 2 Test Failure:', err);
  process.exit(1);
});
