import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './navbar.css';

export default function AppNavbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const logged = localStorage.getItem('isLoggedIn') === 'true' || localStorage.getItem('loggedIn') === 'true';
    const email = localStorage.getItem('userEmail') || '';
    setIsLoggedIn(logged);
    setUserEmail(email);
  }, [location]);

  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('loggedIn');
    localStorage.removeItem('userEmail');
    setIsLoggedIn(false);
    setUserEmail('');
    alert('Logged out successfully.');
    navigate('/');
  };

  const navItems = [
    { path: '/', label: '📈 Stocks' },
    { path: '/compare', label: '📊 Compare & Heatmap' },
    { path: '/ai-analyst', label: '🤖 AI Analyst' },
    { path: '/news', label: '📰 News & Earnings' },
    { path: '/backtest', label: '📉 Backtester' },
    { path: '/commodities', label: '🪙 Commodities & Crypto' },
    { path: '/aboutUs', label: 'ℹ️ About Us' },
    { path: '/terms', label: '📄 Terms' },
  ];

  return (
    <nav className="app-navbar">
      <Link to="/" className="navbar-brand">
        <img src="/chart.png" alt="StockLyser Logo" className="navbar-brand-logo" />
        <span className="navbar-brand-name">StockLyser</span>
      </Link>

      <button
        className="mobile-nav-toggle"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label="Toggle navigation"
      >
        ☰
      </button>

      <div className={`navbar-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-link-item ${location.pathname === item.path ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            {item.label}
          </Link>
        ))}
      </div>

      <div className="navbar-auth">
        {isLoggedIn ? (
          <>
            <span className="user-email-chip" title={userEmail}>
              👤 {userEmail || 'Investor'}
            </span>
            <button className="btn-nav-logout" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn-nav-login">
              Log In
            </Link>
            <Link to="/signUp" className="btn-nav-signup">
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
