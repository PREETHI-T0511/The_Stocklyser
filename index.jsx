import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppNavbar from './AppNavbar';
import StockDashboard from './StockDashboard';
import CompareAndHeatmap from './CompareAndHeatmap';
import AIResearchAssistant from './AIResearchAssistant';
import NewsAndEarnings from './NewsAndEarnings';
import Backtester from './Backtester';
import CommoditiesPage from './CommoditiesPage';
import Homepage from './homepage';
import Login_page from './login';
import SignUp_page from './signUp';
import Terms from './terms';
import AboutUs from './aboutUs';
import Gold from './gold';
import Silver from './silver';
import Bitcoin from './Bitcoin';
import './style.css';

function RenderAll() {
  return (
    <BrowserRouter>
      <AppNavbar />
      <Routes>
        {/* Feature 1: Advanced Interactive Stock Dashboard */}
        <Route path="/" element={<StockDashboard />} />
        <Route path="/stocks" element={<StockDashboard />} />

        {/* Feature 2: Multi-Stock Comparison & Sector Heatmap */}
        <Route path="/compare" element={<CompareAndHeatmap />} />

        {/* Feature 3: Grounded AI Stock Research Assistant */}
        <Route path="/ai-analyst" element={<AIResearchAssistant />} />

        {/* Feature 4: Financial News Sentiment & Earnings */}
        <Route path="/news" element={<NewsAndEarnings />} />

        {/* Feature 5: Historical Strategy Backtesting */}
        <Route path="/backtest" element={<Backtester />} />

        {/* Unified Commodities & Digital Assets */}
        <Route path="/commodities" element={<CommoditiesPage />} />

        {/* Existing Routes Preserved */}
        <Route path="/home-legacy" element={<Homepage />} />
        <Route path="/login" element={<Login_page />} />
        <Route path="/signUp" element={<SignUp_page />} />
        <Route path="/aboutUs" element={<AboutUs />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/gold" element={<Gold />} />
        <Route path="/silver" element={<Silver />} />
        <Route path="/Bitcoin" element={<Bitcoin />} />
      </Routes>
    </BrowserRouter>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<RenderAll />);