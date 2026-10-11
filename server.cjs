const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const marketService = require('./marketService.cjs');
const aiResearchService = require('./aiResearchService.cjs');
const newsAndSentimentService = require('./newsAndSentimentService.cjs');
const backtestService = require('./backtestService.cjs');

const app = express();
app.use(cors());
app.use(express.json());

// Resilient MongoDB connection
mongoose.connect("mongodb://localhost:27017/UserDetails")
  .then(() => console.log('MongoDB connected successfully to UserDetails database'))
  .catch((err) => {
    console.warn('MongoDB connection notice: Local database offline (' + err.message + '). Auth endpoints require MongoDB; market endpoints remain fully operational.');
  });

const UserSchema = new mongoose.Schema({
  email: String,
  password: String,
});
const User = mongoose.model('User', UserSchema);

// Existing Authentication Endpoints
app.post('/signUp', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: "User created successfully" });
  } catch (err) {
    console.error('Sign-up error:', err.message);
    res.status(500).json({ error: "Database error during sign up: " + err.message });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Incorrect password" });
    }

    res.status(200).json({ message: "Login successful", email: user.email });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: "Database error during login: " + err.message });
  }
});

// Real-Time Market Data Endpoints
app.get('/api/market/quote/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const quote = await marketService.getQuote(symbol);
    res.json(quote);
  } catch (err) {
    console.error(`Quote error for ${req.params.symbol}:`, err.message);
    res.status(500).json({ error: `Failed to fetch quote: ${err.message}` });
  }
});

app.get('/api/market/chart/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const range = req.query.range || '1mo';
    const interval = req.query.interval || '1d';

    const chartData = await marketService.getChart(symbol, range, interval);
    res.json(chartData);
  } catch (err) {
    console.error(`Chart error for ${req.params.symbol}:`, err.message);
    res.status(500).json({ error: `Failed to fetch chart: ${err.message}` });
  }
});

app.get('/api/market/search', async (req, res) => {
  try {
    const query = req.query.q || '';
    const results = await marketService.searchSymbols(query);
    res.json(results);
  } catch (err) {
    console.error('Search error:', err.message);
    res.status(500).json({ error: `Search failed: ${err.message}` });
  }
});

app.get('/api/market/popular', async (req, res) => {
  try {
    const quotes = await marketService.getPopularQuotes();
    res.json(quotes);
  } catch (err) {
    console.error('Popular quotes error:', err.message);
    res.status(500).json({ error: `Failed to fetch popular quotes: ${err.message}` });
  }
});

app.get('/api/market/compare', async (req, res) => {
  try {
    const symbolsParam = req.query.symbols || 'AAPL,MSFT,NVDA,SPY';
    const symbols = symbolsParam.split(',').map(s => s.trim()).filter(Boolean);
    const range = req.query.range || '1mo';
    const interval = req.query.interval || '1d';

    const compareData = await marketService.compareSymbols(symbols, range, interval);
    res.json(compareData);
  } catch (err) {
    console.error('Compare error:', err.message);
    res.status(500).json({ error: `Comparison failed: ${err.message}` });
  }
});

app.get('/api/market/sectors', async (req, res) => {
  try {
    const period = req.query.period || '1d';
    const sectorData = await marketService.getSectorHeatmap(period);
    res.json(sectorData);
  } catch (err) {
    console.error('Sectors error:', err.message);
    res.status(500).json({ error: `Sector heatmap failed: ${err.message}` });
  }
});

// Grounded AI Stock Research Endpoints
app.post('/api/ai/research', async (req, res) => {
  try {
    const { symbol, promptType, query } = req.body;
    if (!symbol || !symbol.trim()) {
      return res.status(400).json({ error: 'A valid stock ticker symbol is required.' });
    }

    const report = await aiResearchService.generateGroundedResearch(symbol, promptType, query);
    res.json(report);
  } catch (err) {
    console.error(`AI Research error for ${req.body?.symbol}:`, err.message);
    res.status(500).json({ error: `AI Research generation failed: ${err.message}` });
  }
});

app.get('/api/ai/factbase/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const factbase = await aiResearchService.getComprehensiveFactBase(symbol);
    res.json(factbase);
  } catch (err) {
    console.error(`Factbase error for ${req.params.symbol}:`, err.message);
    res.status(500).json({ error: `Failed to retrieve fact base: ${err.message}` });
  }
});

// Financial News Sentiment & Earnings Routes
app.get('/api/news/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const newsData = await newsAndSentimentService.getNewsAndSentiment(symbol);
    res.json(newsData);
  } catch (err) {
    console.error(`News error for ${req.params.symbol}:`, err.message);
    res.status(500).json({ error: `Failed to fetch news and sentiment: ${err.message}` });
  }
});

app.get('/api/earnings/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const earningsData = await newsAndSentimentService.getEarningsSummary(symbol);
    res.json(earningsData);
  } catch (err) {
    console.error(`Earnings error for ${req.params.symbol}:`, err.message);
    res.status(500).json({ error: `Failed to fetch earnings summary: ${err.message}` });
  }
});

// ── Feature 5: Historical Strategy Backtesting ────────────────────────────────
// POST /api/backtest
// Body: { symbol, strategy, range, initialCapital, commissionFlat, commissionPct, slippagePct, params }
app.post('/api/backtest', async (req, res) => {
  try {
    const {
      symbol, strategy, range, initialCapital,
      commissionFlat, commissionPct, slippagePct, params,
    } = req.body;

    // Input validation
    if (!symbol || typeof symbol !== 'string' || !/^[A-Z0-9.\-^=]{1,10}$/i.test(symbol.trim())) {
      return res.status(400).json({ error: 'Invalid symbol' });
    }
    const validStrategies = ['smaCrossover', 'rsiMeanReversion', 'buyAndHold'];
    if (strategy && !validStrategies.includes(strategy)) {
      return res.status(400).json({ error: `strategy must be one of: ${validStrategies.join(', ')}` });
    }
    const validRanges = ['6mo', '1y', '2y', '5y', '10y', 'max'];
    if (range && !validRanges.includes(range)) {
      return res.status(400).json({ error: `range must be one of: ${validRanges.join(', ')}` });
    }
    if (initialCapital !== undefined && (isNaN(initialCapital) || initialCapital < 100 || initialCapital > 10_000_000)) {
      return res.status(400).json({ error: 'initialCapital must be between 100 and 10,000,000' });
    }

    const result = await backtestService.runBacktest({
      symbol: symbol.trim().toUpperCase(),
      strategy: strategy || 'smaCrossover',
      range: range || '2y',
      initialCapital: Number(initialCapital) || 10000,
      commissionFlat: commissionFlat !== undefined ? Number(commissionFlat) : 1.0,
      commissionPct: commissionPct !== undefined ? Number(commissionPct) : 0.001,
      slippagePct: slippagePct !== undefined ? Number(slippagePct) : 0.0005,
      params: params || {},
    });
    res.json(result);
  } catch (err) {
    console.error('Backtest error:', err.message);
    res.status(500).json({ error: `Backtest failed: ${err.message}` });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`backend running on port ${PORT}`));
