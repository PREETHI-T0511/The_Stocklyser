const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

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

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});