/**
 * In-memory Paper Trading Engine
 * Manages virtual account balance, order matching, active portfolio holdings, and execution logs.
 */

export class PaperAccount {
  constructor(initialBalance = 100000) {
    this.cash = initialBalance;
    this.initialBalance = initialBalance;
    this.positions = {}; // { 'AAPL': { shares: 10, avgPrice: 150.00 } }
    this.orders = [];
    this.tradeHistory = [];
  }

  placeOrder({ symbol, type = 'MARKET', side = 'BUY', shares, limitPrice, currentPrice }) {
    if (shares <= 0) throw new Error('Shares must be greater than zero');
    
    const executionPrice = type === 'LIMIT' ? limitPrice : currentPrice;
    const totalCost = executionPrice * shares;

    if (side === 'BUY' && this.cash < totalCost) {
      throw new Error('Insufficient virtual funds available');
    }

    if (side === 'SELL') {
      const currentShares = this.positions[symbol]?.shares || 0;
      if (currentShares < shares) {
        throw new Error('Insufficient shares in portfolio to execute sell');
      }
    }

    // Execute Market Order immediately
    if (type === 'MARKET') {
      return this._executeTrade({ symbol, side, shares, price: executionPrice });
    }

    // Pend Limit Order if limit price condition isn't met
    const order = {
      id: Date.now().toString(),
      symbol,
      type,
      side,
      shares,
      limitPrice,
      status: 'PENDING',
      timestamp: new Date().toISOString(),
    };
    
    this.orders.push(order);
    return order;
  }

  _executeTrade({ symbol, side, shares, price }) {
    const totalCost = shares * price;

    if (side === 'BUY') {
      this.cash -= totalCost;
      const currentPos = this.positions[symbol] || { shares: 0, avgPrice: 0 };
      const totalShares = currentPos.shares + shares;
      const newAvgPrice = (currentPos.shares * currentPos.avgPrice + totalCost) / totalShares;

      this.positions[symbol] = {
        shares: totalShares,
        avgPrice: parseFloat(newAvgPrice.toFixed(2)),
      };
    } else if (side === 'SELL') {
      this.cash += totalCost;
      const currentPos = this.positions[symbol];
      const remainingShares = currentPos.shares - shares;

      if (remainingShares === 0) {
        delete this.positions[symbol];
      } else {
        this.positions[symbol].shares = remainingShares;
      }
    }

    const tradeRecord = {
      id: Date.now().toString(),
      symbol,
      side,
      shares,
      price: parseFloat(price.toFixed(2)),
      timestamp: new Date().toISOString(),
    };

    this.tradeHistory.push(tradeRecord);
    return tradeRecord;
  }

  getPortfolioSummary(currentPrices = {}) {
    let holdingsValue = 0;

    Object.entries(this.positions).forEach(([symbol, pos]) => {
      const mktPrice = currentPrices[symbol] || pos.avgPrice;
      holdingsValue += pos.shares * mktPrice;
    });

    const totalEquity = this.cash + holdingsValue;
    const totalPnl = totalEquity - this.initialBalance;
    const totalPnlPercent = (totalPnl / this.initialBalance) * 100;

    return {
      cash: parseFloat(this.cash.toFixed(2)),
      holdingsValue: parseFloat(holdingsValue.toFixed(2)),
      totalEquity: parseFloat(totalEquity.toFixed(2)),
      totalPnl: parseFloat(totalPnl.toFixed(2)),
      totalPnlPercent: parseFloat(totalPnlPercent.toFixed(2)),
      positions: this.positions,
      tradeHistory: this.tradeHistory,
    };
  }
}