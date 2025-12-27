import React, { useContext, useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Portfolio.css';

function Portfolio() {
  const { user, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [portfolioStats, setPortfolioStats] = useState({
    totalValue: 0,
    totalGrowth: 0,
    investments: 0,
    returns: 0
  });

  // Mock portfolio data - in production, this would come from an API
  const portfolioData = {
    overview: {
      totalInvestment: 250000,
      currentValue: 287500,
      totalReturn: 37500,
      returnPercentage: 15.0,
      activeInvestments: 8
    },
    assets: [
      {
        id: 1,
        name: 'Smart Township Alpha',
        category: 'Real Estate',
        investment: 75000,
        currentValue: 86250,
        return: 11250,
        returnPercentage: 15.0,
        status: 'Active',
        acquiredDate: '2024-03-15'
      },
      {
        id: 2,
        name: 'Blockchain Infrastructure Fund',
        category: 'Digital Assets',
        investment: 50000,
        currentValue: 58500,
        return: 8500,
        returnPercentage: 17.0,
        status: 'Active',
        acquiredDate: '2024-06-20'
      },
      {
        id: 3,
        name: 'Urban Agriculture Project',
        category: 'Alternative Assets',
        investment: 40000,
        currentValue: 45200,
        return: 5200,
        returnPercentage: 13.0,
        status: 'Active',
        acquiredDate: '2024-08-10'
      },
      {
        id: 4,
        name: 'AI Technology Ventures',
        category: 'Digital Assets',
        investment: 85000,
        currentValue: 97550,
        return: 12550,
        returnPercentage: 14.76,
        status: 'Active',
        acquiredDate: '2024-01-05'
      }
    ],
    transactions: [
      {
        id: 1,
        type: 'Investment',
        asset: 'Smart Township Alpha',
        amount: 25000,
        date: '2024-12-15',
        status: 'Completed'
      },
      {
        id: 2,
        type: 'Return',
        asset: 'Blockchain Infrastructure Fund',
        amount: 3200,
        date: '2024-12-10',
        status: 'Completed'
      },
      {
        id: 3,
        type: 'Investment',
        asset: 'Urban Agriculture Project',
        amount: 15000,
        date: '2024-12-05',
        status: 'Completed'
      },
      {
        id: 4,
        type: 'Return',
        asset: 'AI Technology Ventures',
        amount: 4500,
        date: '2024-11-28',
        status: 'Completed'
      }
    ],
    performance: [
      { month: 'Jul', value: 240000 },
      { month: 'Aug', value: 248000 },
      { month: 'Sep', value: 260000 },
      { month: 'Oct', value: 271000 },
      { month: 'Nov', value: 279000 },
      { month: 'Dec', value: 287500 }
    ]
  };

  useEffect(() => {
    // Animate numbers on mount
    const duration = 2000;
    const steps = 60;
    const stepDuration = duration / steps;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;

      setPortfolioStats({
        totalValue: Math.floor(portfolioData.overview.currentValue * progress),
        totalGrowth: Math.floor(portfolioData.overview.returnPercentage * progress * 10) / 10,
        investments: Math.floor(portfolioData.overview.activeInvestments * progress),
        returns: Math.floor(portfolioData.overview.totalReturn * progress)
      });

      if (currentStep >= steps) {
        clearInterval(interval);
        setPortfolioStats({
          totalValue: portfolioData.overview.currentValue,
          totalGrowth: portfolioData.overview.returnPercentage,
          investments: portfolioData.overview.activeInvestments,
          returns: portfolioData.overview.totalReturn
        });
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, []);

  // Redirect if not authenticated
  if (!isAuthenticated()) {
    return <Navigate to="/login" />;
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="portfolio-page">
      <div className="portfolio-container">
        {/* Header Section */}
        <div className="portfolio-header">
          <div className="portfolio-welcome">
            <h1>Welcome back, {user?.name}</h1>
            <p className="portfolio-subtitle">Your Investment Portfolio Dashboard</p>
          </div>
          <div className="portfolio-header-actions">
            <button className="btn-secondary">Download Report</button>
            <button className="btn-primary" onClick={() => navigate('/investments')}>New Investment</button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="portfolio-stats">
          <div className="stat-card">
            <div className="stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <div className="stat-content">
              <p className="stat-label">Total Portfolio Value</p>
              <h3 className="stat-value">{formatCurrency(portfolioStats.totalValue)}</h3>
              <p className="stat-change positive">+{portfolioStats.totalGrowth}% this year</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <div className="stat-content">
              <p className="stat-label">Active Investments</p>
              <h3 className="stat-value">{portfolioStats.investments}</h3>
              <p className="stat-change">Across multiple sectors</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <div className="stat-content">
              <p className="stat-label">Total Returns</p>
              <h3 className="stat-value">{formatCurrency(portfolioStats.returns)}</h3>
              <p className="stat-change positive">+{portfolioData.overview.returnPercentage}% ROI</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <div className="stat-content">
              <p className="stat-label">Total Invested</p>
              <h3 className="stat-value">{formatCurrency(portfolioData.overview.totalInvestment)}</h3>
              <p className="stat-change">Initial capital</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="portfolio-tabs">
          <button
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`tab-btn ${activeTab === 'assets' ? 'active' : ''}`}
            onClick={() => setActiveTab('assets')}
          >
            My Assets
          </button>
          <button
            className={`tab-btn ${activeTab === 'transactions' ? 'active' : ''}`}
            onClick={() => setActiveTab('transactions')}
          >
            Transactions
          </button>
          <button
            className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            Analytics
          </button>
        </div>

        {/* Tab Content */}
        <div className="portfolio-content">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="tab-content">
              <div className="content-grid">
                <div className="content-main">
                  <div className="card">
                    <div className="card-header">
                      <h3>Performance Chart</h3>
                      <select className="period-selector">
                        <option>Last 6 Months</option>
                        <option>Last Year</option>
                        <option>All Time</option>
                      </select>
                    </div>
                    <div className="chart-container">
                      <div className="chart-wrapper">
                        {portfolioData.performance.map((data, index) => (
                          <div key={index} className="chart-bar-group">
                            <div className="chart-bar-container">
                              <div
                                className="chart-bar"
                                style={{
                                  height: `${(data.value / 300000) * 100}%`
                                }}
                              >
                                <span className="chart-bar-value">{formatCurrency(data.value)}</span>
                              </div>
                            </div>
                            <span className="chart-label">{data.month}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-header">
                      <h3>Recent Transactions</h3>
                      <a href="#" className="view-all-link">View All</a>
                    </div>
                    <div className="transactions-list">
                      {portfolioData.transactions.slice(0, 3).map((transaction) => (
                        <div key={transaction.id} className="transaction-item">
                          <div className="transaction-info">
                            <div className={`transaction-icon ${transaction.type.toLowerCase()}`}>
                              {transaction.type === 'Investment' ? (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M12 5v14M5 12l7-7 7 7" />
                                </svg>
                              ) : (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M12 19V5M5 12l7 7 7-7" />
                                </svg>
                              )}
                            </div>
                            <div>
                              <p className="transaction-name">{transaction.asset}</p>
                              <p className="transaction-date">{formatDate(transaction.date)}</p>
                            </div>
                          </div>
                          <div className="transaction-amount">
                            <p className={`amount ${transaction.type.toLowerCase()}`}>
                              {transaction.type === 'Investment' ? '-' : '+'}{formatCurrency(transaction.amount)}
                            </p>
                            <span className={`status-badge ${transaction.status.toLowerCase()}`}>
                              {transaction.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="content-sidebar">
                  <div className="card">
                    <div className="card-header">
                      <h3>Asset Allocation</h3>
                    </div>
                    <div className="allocation-chart">
                      <div className="allocation-item">
                        <div className="allocation-label">
                          <span className="allocation-color" style={{ backgroundColor: '#4F46E5' }}></span>
                          <span>Real Estate</span>
                        </div>
                        <span className="allocation-percentage">30%</span>
                      </div>
                      <div className="allocation-item">
                        <div className="allocation-label">
                          <span className="allocation-color" style={{ backgroundColor: '#10B981' }}></span>
                          <span>Digital Assets</span>
                        </div>
                        <span className="allocation-percentage">54%</span>
                      </div>
                      <div className="allocation-item">
                        <div className="allocation-label">
                          <span className="allocation-color" style={{ backgroundColor: '#F59E0B' }}></span>
                          <span>Alternative Assets</span>
                        </div>
                        <span className="allocation-percentage">16%</span>
                      </div>
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-header">
                      <h3>Quick Actions</h3>
                    </div>
                    <div className="quick-actions">
                      <button className="action-btn" onClick={() => navigate('/investments')}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="16" />
                          <line x1="8" y1="12" x2="16" y2="12" />
                        </svg>
                        Add Investment
                      </button>
                      <button className="action-btn">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        Withdraw Funds
                      </button>
                      <button className="action-btn">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                          <polyline points="10 9 9 9 8 9" />
                        </svg>
                        Generate Report
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Assets Tab */}
          {activeTab === 'assets' && (
            <div className="tab-content">
              <div className="card">
                <div className="card-header">
                  <h3>My Investments</h3>
                  <div className="filter-controls">
                    <select className="filter-select">
                      <option>All Categories</option>
                      <option>Real Estate</option>
                      <option>Digital Assets</option>
                      <option>Alternative Assets</option>
                    </select>
                    <select className="filter-select">
                      <option>Sort by: Value</option>
                      <option>Sort by: Return</option>
                      <option>Sort by: Date</option>
                    </select>
                  </div>
                </div>
                <div className="assets-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Asset Name</th>
                        <th>Category</th>
                        <th>Investment</th>
                        <th>Current Value</th>
                        <th>Return</th>
                        <th>ROI</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {portfolioData.assets.map((asset) => (
                        <tr key={asset.id}>
                          <td>
                            <div className="asset-name">
                              <div className="asset-icon">{asset.name.charAt(0)}</div>
                              <div>
                                <p className="asset-title">{asset.name}</p>
                                <p className="asset-date">Acquired: {formatDate(asset.acquiredDate)}</p>
                              </div>
                            </div>
                          </td>
                          <td><span className="category-badge">{asset.category}</span></td>
                          <td>{formatCurrency(asset.investment)}</td>
                          <td className="value-highlight">{formatCurrency(asset.currentValue)}</td>
                          <td className="positive-value">+{formatCurrency(asset.return)}</td>
                          <td>
                            <span className="roi-badge positive">+{asset.returnPercentage}%</span>
                          </td>
                          <td><span className="status-badge active">{asset.status}</span></td>
                          <td>
                            <button className="action-icon-btn">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="1" />
                                <circle cx="12" cy="5" r="1" />
                                <circle cx="12" cy="19" r="1" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Transactions Tab */}
          {activeTab === 'transactions' && (
            <div className="tab-content">
              <div className="card">
                <div className="card-header">
                  <h3>Transaction History</h3>
                  <div className="filter-controls">
                    <select className="filter-select">
                      <option>All Types</option>
                      <option>Investment</option>
                      <option>Return</option>
                    </select>
                    <input type="text" className="search-input" placeholder="Search transactions..." />
                  </div>
                </div>
                <div className="transactions-table">
                  {portfolioData.transactions.map((transaction) => (
                    <div key={transaction.id} className="transaction-row">
                      <div className="transaction-details">
                        <div className={`transaction-type-icon ${transaction.type.toLowerCase()}`}>
                          {transaction.type === 'Investment' ? (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M12 5v14M5 12l7-7 7 7" />
                            </svg>
                          ) : (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M12 19V5M5 12l7 7 7-7" />
                            </svg>
                          )}
                        </div>
                        <div className="transaction-text">
                          <p className="transaction-title">{transaction.type} - {transaction.asset}</p>
                          <p className="transaction-meta">{formatDate(transaction.date)}</p>
                        </div>
                      </div>
                      <div className="transaction-value">
                        <p className={`transaction-price ${transaction.type.toLowerCase()}`}>
                          {transaction.type === 'Investment' ? '-' : '+'}{formatCurrency(transaction.amount)}
                        </p>
                        <span className={`transaction-status ${transaction.status.toLowerCase()}`}>
                          {transaction.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="tab-content">
              <div className="analytics-grid">
                <div className="card analytics-card">
                  <div className="card-header">
                    <h3>Portfolio Growth</h3>
                  </div>
                  <div className="analytics-content">
                    <div className="analytics-metric">
                      <p className="metric-label">Year-to-Date Growth</p>
                      <h2 className="metric-value positive">+15.0%</h2>
                    </div>
                    <div className="analytics-chart">
                      <div className="growth-indicators">
                        <div className="indicator">
                          <span className="indicator-dot positive"></span>
                          <span>Above Market Average</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card analytics-card">
                  <div className="card-header">
                    <h3>Risk Assessment</h3>
                  </div>
                  <div className="analytics-content">
                    <div className="risk-score">
                      <div className="risk-gauge">
                        <div className="gauge-fill" style={{ width: '45%' }}></div>
                      </div>
                      <p className="risk-label">Moderate Risk</p>
                    </div>
                    <p className="risk-description">
                      Your portfolio has a balanced risk profile with diversified investments across multiple sectors.
                    </p>
                  </div>
                </div>

                <div className="card analytics-card">
                  <div className="card-header">
                    <h3>Sector Performance</h3>
                  </div>
                  <div className="analytics-content">
                    <div className="sector-performance">
                      <div className="sector-item">
                        <div className="sector-info">
                          <span>Digital Assets</span>
                          <span className="sector-roi positive">+17.0%</span>
                        </div>
                        <div className="sector-bar">
                          <div className="sector-bar-fill" style={{ width: '85%' }}></div>
                        </div>
                      </div>
                      <div className="sector-item">
                        <div className="sector-info">
                          <span>Real Estate</span>
                          <span className="sector-roi positive">+15.0%</span>
                        </div>
                        <div className="sector-bar">
                          <div className="sector-bar-fill" style={{ width: '75%' }}></div>
                        </div>
                      </div>
                      <div className="sector-item">
                        <div className="sector-info">
                          <span>Alternative Assets</span>
                          <span className="sector-roi positive">+13.0%</span>
                        </div>
                        <div className="sector-bar">
                          <div className="sector-bar-fill" style={{ width: '65%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card analytics-card full-width">
                  <div className="card-header">
                    <h3>Investment Insights</h3>
                  </div>
                  <div className="analytics-content">
                    <div className="insights-list">
                      <div className="insight-item">
                        <div className="insight-icon success">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                        <div className="insight-content">
                          <h4>Strong Portfolio Diversification</h4>
                          <p>Your investments are well-balanced across multiple sectors, reducing overall risk.</p>
                        </div>
                      </div>
                      <div className="insight-item">
                        <div className="insight-icon info">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="16" x2="12" y2="12" />
                            <line x1="12" y1="8" x2="12.01" y2="8" />
                          </svg>
                        </div>
                        <div className="insight-content">
                          <h4>Consider Rebalancing</h4>
                          <p>Digital assets now represent 54% of your portfolio. Consider diversifying further.</p>
                        </div>
                      </div>
                      <div className="insight-item">
                        <div className="insight-icon warning">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                          </svg>
                        </div>
                        <div className="insight-content">
                          <h4>Market Opportunity</h4>
                          <p>Smart City investments are showing strong growth. Consider increasing allocation.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Portfolio;
