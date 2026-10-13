const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();
const { generateGroundedResearch } = require('./aiResearchService.cjs');
const { getNewsAndSentiment } = require('./newsAndSentimentService.cjs');
const { runSMACrossoverBacktest } = require('./backtestService.cjs');

const app = express();
app.use(cors());
app.use(express.json());

const cors = require('cors');
app.use(cors());

const PORT = process.env.PORT || 5000;

app.get('/api/stocks/candles', async (req, res) => {
  const { symbol = 'AAPL' } = req.query;

  try {
    const mockCandles = Array.from({ length: 60 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (60 - i));
      const basePrice = 150 + Math.sin(i / 5) * 10;
      return {
        time: date.toISOString().split('T')[0],
        open: parseFloat((basePrice - 1).toFixed(2)),
        high: parseFloat((basePrice + 2).toFixed(2)),
        low: parseFloat((basePrice - 2).toFixed(2)),
        close: parseFloat((basePrice + 0.5).toFixed(2)),
        volume: Math.floor(1000000 + Math.random() * 500000),
      };
    });

    res.json({
      symbol: symbol.toUpperCase(),
      data: mockCandles,
      isDelayed: true,
      delayMinutes: 15,
      disclaimer: "Market data delayed by 15 minutes. For analysis purposes only.",
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch candle data' });
  }
});

// AI Research Assistant endpoint
app.post('/api/ai/research', async (req, res) => {
  const { symbol = 'AAPL', query = 'Analyze current financial performance' } = req.body;

  try {
    const report = await generateGroundedResearch(symbol, query);
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate research report' });
  }
});

// Financial News Sentiment & Earnings endpoint
app.get('/api/news/sentiment', async (req, res) => {
  const { symbol = 'AAPL' } = req.query;

  try {
    const data = await getNewsAndSentiment(symbol);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch news and sentiment data' });
  }
});


// Strategy Backtester Endpoint
app.post('/api/backtest', async (req, res) => {
  const { shortPeriod = 5, longPeriod = 20, initialCapital = 10000 } = req.body;

  try {
    // Generate synthetic historical candles for backtesting
    const mockCandles = Array.from({ length: 120 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (120 - i));
      const close = 100 + Math.sin(i / 6) * 15 + (i * 0.2);
      return {
        time: date.toISOString().split('T')[0],
        open: close - 0.5,
        high: close + 1.5,
        low: close - 1.5,
        close: parseFloat(close.toFixed(2)),
        volume: 50000,
      };
    });

    const results = runSMACrossoverBacktest(mockCandles, shortPeriod, longPeriod, initialCapital);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to execute backtest' });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
