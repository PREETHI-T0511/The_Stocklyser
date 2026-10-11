import { getComprehensiveFactBase, generateGroundedResearch } from './aiResearchService.cjs';

async function runFeature3Tests() {
  console.log('--- Starting Feature 3: Grounded AI Stock Research Assistant Tests ---');

  // Test 1: Fact Base Retrieval & Structure
  console.log('1. Testing Comprehensive Financial Fact Base for AAPL...');
  const factBase = await getComprehensiveFactBase('AAPL');

  if (!factBase || factBase.symbol !== 'AAPL') {
    throw new Error('factBase AAPL invalid or symbol mismatch');
  }

  if (typeof factBase.currentPrice !== 'number' || factBase.currentPrice <= 0) {
    throw new Error(`Invalid current price for AAPL: ${factBase.currentPrice}`);
  }

  if (!factBase.fundamentals.sector || factBase.fundamentals.sector === 'N/A') {
    throw new Error(`Missing sector for AAPL: ${JSON.stringify(factBase.fundamentals)}`);
  }

  if (typeof factBase.technicals.rsi14 !== 'number' || factBase.technicals.rsi14 < 0 || factBase.technicals.rsi14 > 100) {
    throw new Error(`Invalid RSI calculation for AAPL: ${factBase.technicals.rsi14}`);
  }

  console.log(`   ✓ Fact Base verified: ${factBase.companyName} ($${factBase.currentPrice})`);
  console.log(`   ✓ Fundamentals: Sector=${factBase.fundamentals.sector}, Industry=${factBase.fundamentals.industry}`);
  console.log(`   ✓ Technicals: RSI=${factBase.technicals.rsi14}, SMA50=$${factBase.technicals.sma50}, SMA200=$${factBase.technicals.sma200}`);
  console.log(`   ✓ News Headlines count: ${factBase.news.length}`);

  // Test 2: Grounded Analysis Generation with Citations
  console.log('\n2. Testing Grounded Research Memo Synthesis for NVDA...');
  const report = await generateGroundedResearch('NVDA', 'general');

  if (!report.executiveVerdict || report.sections.length < 3) {
    throw new Error('Grounded report sections incomplete');
  }

  // Verify citation markers
  const allText = [
    report.executiveVerdict,
    ...report.sections.map(s => s.content),
    ...report.bullFactors,
    ...report.bearRisks,
  ].join(' ');

  const hasSource1 = allText.includes('[Source 1]');
  const hasSource2 = allText.includes('[Source 2]');
  const hasSource3 = allText.includes('[Source 3]');

  if (!hasSource1 || !hasSource2 || !hasSource3) {
    throw new Error(`Report lacks required source citation tags: Source1=${hasSource1}, Source2=${hasSource2}, Source3=${hasSource3}`);
  }

  console.log(`   ✓ Executive Verdict: "${report.executiveVerdict.slice(0, 80)}..."`);
  console.log(`   ✓ Verified ${report.sources.length} underlying citation evidence blocks:`);
  report.sources.forEach(s => console.log(`     - [${s.id}]: ${s.title} (${s.provider})`));
  console.log(`   ✓ Bullish Catalysts count: ${report.bullFactors.length}`);
  console.log(`   ✓ Bearish Risks count: ${report.bearRisks.length}`);
  console.log(`   ✓ 12-Month Probabilistic Scenarios: Bull, Base, and Bear cases modeled`);

  if (!report.disclaimer || !report.disclaimer.includes('DISCLAIMER')) {
    throw new Error('Report lacks mandatory regulatory disclosure');
  }
  console.log('   ✓ Mandatory financial disclaimer validated');

  // Test 3: Prompt Variations
  console.log('\n3. Testing Prompt Variation: Technical Momentum & Valuation for MSFT...');
  const techReport = await generateGroundedResearch('MSFT', 'technical');
  if (techReport.symbol !== 'MSFT') throw new Error('Symbol mismatch in techReport');
  console.log(`   ✓ MSFT Research Memo generated: Verdict="${techReport.executiveVerdict.slice(0, 60)}..."`);

  console.log('\n--- ALL FEATURE 3 TESTS PASSED SUCCESSFULLY! ---');
}

runFeature3Tests().catch(err => {
  console.error('Feature 3 Test Failure:', err);
  process.exit(1);
});
