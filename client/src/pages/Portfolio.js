import React, { useContext, useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Portfolio.css';

function Portfolio() {
  const { user, isAuthenticated, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [applications, setApplications] = useState([]);
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('value');
  const [transactionFilter, setTransactionFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [portfolioStats, setPortfolioStats] = useState({
    totalValue: 0,
    totalGrowth: 0,
    investments: 0,
    returns: 0
  });
  const [portfolioData, setPortfolioData] = useState({
    overview: {
      totalInvestment: 0,
      currentValue: 0,
      totalReturn: 0,
      returnPercentage: 0,
      activeInvestments: 0
    },
    assets: [],
    transactions: [],
    performance: [],
    assetAllocation: {}
  });
  const [loadingPortfolio, setLoadingPortfolio] = useState(true);

  // Fetch user's investment applications
  const fetchApplications = async () => {
    setLoadingApplications(true);
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/api/investments/my-applications`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setApplications(data);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoadingApplications(false);
    }
  };

  // Fetch portfolio statistics
  const fetchPortfolioStats = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/api/investments/portfolio-stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPortfolioData(prev => ({
          ...prev,
          overview: {
            totalInvestment: data.totalInvestment,
            currentValue: data.currentValue,
            totalReturn: data.totalReturn,
            returnPercentage: data.returnPercentage,
            activeInvestments: data.activeInvestments
          },
          assetAllocation: data.assetAllocation
        }));
      }
    } catch (error) {
      console.error('Error fetching portfolio stats:', error);
    }
  };

  // Fetch user's investments (assets)
  const fetchInvestments = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/api/investments/my-investments`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Transform investments to assets format
        const assets = data.map(inv => ({
          id: inv._id,
          name: inv.investmentName,
          category: inv.assetType,
          investment: inv.investmentAmount,
          currentValue: inv.currentValue,
          return: inv.currentValue - inv.investmentAmount,
          returnPercentage: inv.investmentAmount > 0 
            ? ((inv.currentValue - inv.investmentAmount) / inv.investmentAmount * 100) 
            : 0,
          status: inv.status === 'active' ? 'Active' : inv.status,
          acquiredDate: inv.purchaseDate || inv.createdAt
        }));
        
        setPortfolioData(prev => ({
          ...prev,
          assets
        }));
      }
    } catch (error) {
      console.error('Error fetching investments:', error);
    }
  };

  // Fetch transactions
  const fetchTransactions = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/api/investments/transactions`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPortfolioData(prev => ({
          ...prev,
          transactions: data
        }));
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  // Fetch performance data
  const fetchPerformance = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/api/investments/performance`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPortfolioData(prev => ({
          ...prev,
          performance: data
        }));
      }
    } catch (error) {
      console.error('Error fetching performance:', error);
    }
  };

  // Fetch all portfolio data
  const fetchAllPortfolioData = async () => {
    setLoadingPortfolio(true);
    try {
      await Promise.all([
        fetchPortfolioStats(),
        fetchInvestments(),
        fetchTransactions(),
        fetchPerformance()
      ]);
    } catch (error) {
      console.error('Error fetching portfolio data:', error);
    } finally {
      setLoadingPortfolio(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated()) {
      fetchApplications();
      fetchAllPortfolioData();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    // Animate numbers when portfolio data loads
    if (!loadingPortfolio && portfolioData.overview.currentValue > 0) {
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
    } else if (!loadingPortfolio) {
      // If no investments, set stats to 0
      setPortfolioStats({
        totalValue: 0,
        totalGrowth: 0,
        investments: 0,
        returns: 0
      });
    }
  }, [loadingPortfolio, portfolioData.overview]);

  // Wait for auth to load before redirecting
  if (authLoading) {
    return <div className="portfolio-page"><div className="portfolio-container"><p>Loading...</p></div></div>;
  }

  // Redirect if not authenticated
  if (!isAuthenticated()) {
    return <Navigate to="/login" />;
  }

  // Block admins and super admins from accessing portfolio
  if (user?.isAdmin || user?.isSuperAdmin) {
    return <Navigate to={user?.isSuperAdmin ? "/superadmin" : "/admin"} />;
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

  // Filter and sort assets
  const getFilteredAndSortedAssets = () => {
    let filtered = [...portfolioData.assets];
    
    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(asset => asset.category === categoryFilter);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'value':
          return b.currentValue - a.currentValue;
        case 'return':
          return b.returnPercentage - a.returnPercentage;
        case 'date':
          return new Date(b.acquiredDate) - new Date(a.acquiredDate);
        default:
          return 0;
      }
    });
    
    return filtered;
  };

  // Filter transactions
  const getFilteredTransactions = () => {
    let filtered = [...portfolioData.transactions];
    
    // Apply type filter
    if (transactionFilter !== 'all') {
      filtered = filtered.filter(txn => txn.type === transactionFilter);
    }
    
    // Apply search
    if (searchQuery.trim()) {
      filtered = filtered.filter(txn => 
        txn.asset.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  };

  return (
    <div className="portfolio-page">
      <div className="portfolio-container">
        {loadingPortfolio ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading your portfolio...</p>
          </div>
        ) : (
          <>
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
              <p className={`stat-change ${portfolioStats.totalGrowth > 0 ? 'positive' : portfolioStats.totalGrowth < 0 ? 'negative' : ''}`}>
                {portfolioStats.totalGrowth > 0 ? '+' : ''}{portfolioStats.totalGrowth}% {portfolioStats.totalGrowth !== 0 ? 'this year' : 'Start investing'}
              </p>
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
              <p className={`stat-change ${portfolioData.overview.returnPercentage > 0 ? 'positive' : portfolioData.overview.returnPercentage < 0 ? 'negative' : ''}`}>
                {portfolioData.overview.returnPercentage > 0 ? '+' : ''}{portfolioData.overview.returnPercentage}% ROI
              </p>
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
          <button
            className={`tab-btn ${activeTab === 'applications' ? 'active' : ''}`}
            onClick={() => setActiveTab('applications')}
          >
            My Applications
          </button>
        </div>

        {/* Tab Content */}
        <div className="portfolio-content">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="tab-content">
              <div className="content-grid">
                <div className="content-main">
                  <div className={`card ${!user?.isPremium ? 'premium-locked' : ''}`}>
                    {!user?.isPremium && (
                      <div className="premium-overlay">
                        <div className="premium-message">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                          </svg>
                          <h3>Premium Feature</h3>
                          <p>Upgrade to Premium Membership to unlock Performance Analytics</p>
                          <button className="btn-upgrade" onClick={() => navigate('/premium')}>
                            Upgrade Now
                          </button>
                        </div>
                      </div>
                    )}
                    <div className="card-header">
                      <h3>Performance Chart</h3>
                      <select className="period-selector">
                        <option>Last 6 Months</option>
                        <option>Last Year</option>
                        <option>All Time</option>
                      </select>
                    </div>
                    <div className="chart-container">
                      {portfolioData.performance.length > 0 ? (
                        <div className="chart-wrapper">
                          {portfolioData.performance.map((data, index) => {
                            const maxValue = Math.max(...portfolioData.performance.map(p => p.value), 1);
                            return (
                              <div key={index} className="chart-bar-group">
                                <div className="chart-bar-container">
                                  <div
                                    className="chart-bar"
                                    style={{
                                      height: `${(data.value / maxValue) * 100}%`
                                    }}
                                  >
                                    <span className="chart-bar-value">{formatCurrency(data.value)}</span>
                                  </div>
                                </div>
                                <span className="chart-label">{data.month}</span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="empty-chart">
                          <p>No performance data available yet. Start investing to track your portfolio growth!</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-header">
                      <h3>Recent Transactions</h3>
                      <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('transactions'); }} className="view-all-link">View All</a>
                    </div>
                    <div className="transactions-list">
                      {portfolioData.transactions.length > 0 ? (
                        portfolioData.transactions.slice(0, 3).map((transaction) => (
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
                      ))
                      ) : (
                        <div className="empty-transactions">
                          <p>No recent transactions</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="content-sidebar">
                  <div className="card">
                    <div className="card-header">
                      <h3>Asset Allocation</h3>
                    </div>
                    <div className="allocation-chart">
                      {Object.keys(portfolioData.assetAllocation).length > 0 ? (
                        Object.entries(portfolioData.assetAllocation).map(([assetType, data], index) => {
                          const colors = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
                          return (
                            <div key={assetType} className="allocation-item">
                              <div className="allocation-label">
                                <span className="allocation-color" style={{ backgroundColor: colors[index % colors.length] }}></span>
                                <span>{assetType}</span>
                              </div>
                              <span className="allocation-percentage">{data.percentage.toFixed(1)}%</span>
                            </div>
                          );
                        })
                      ) : (
                        <p className="empty-allocation">No investments yet</p>
                      )}
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
                    <select 
                      className="filter-select"
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                      <option value="all">All Categories</option>
                      <option value="Multi-Family">Multi-Family</option>
                      <option value="Commercial">Commercial</option>
                      <option value="Mixed-Use">Mixed-Use</option>
                      <option value="Residential">Residential</option>
                      <option value="Industrial">Industrial</option>
                      <option value="Other">Other</option>
                    </select>
                    <select 
                      className="filter-select"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                    >
                      <option value="value">Sort by: Value</option>
                      <option value="return">Sort by: Return</option>
                      <option value="date">Sort by: Date</option>
                    </select>
                  </div>
                </div>
                <div className="assets-table">
                  {getFilteredAndSortedAssets().length === 0 ? (
                    <div className="empty-state">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                      </svg>
                      <h3>No Assets Yet</h3>
                      <p>Your approved investments will appear here. Start by browsing our investment opportunities!</p>
                      <button className="btn-primary" onClick={() => navigate('/investments')}>
                        Explore Investments
                      </button>
                    </div>
                  ) : (
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
                        {getFilteredAndSortedAssets().map((asset) => (
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
                            <td className={asset.return >= 0 ? 'positive-value' : 'negative-value'}>
                              {asset.return >= 0 ? '+' : ''}{formatCurrency(asset.return)}
                            </td>
                            <td>
                              <span className={`roi-badge ${asset.returnPercentage >= 0 ? 'positive' : 'negative'}`}>
                                {asset.returnPercentage >= 0 ? '+' : ''}{asset.returnPercentage.toFixed(2)}%
                              </span>
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
                  )}
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
                    <select 
                      className="filter-select"
                      value={transactionFilter}
                      onChange={(e) => setTransactionFilter(e.target.value)}
                    >
                      <option value="all">All Types</option>
                      <option value="Investment">Investment</option>
                      <option value="Return">Return</option>
                    </select>
                    <input 
                      type="text" 
                      className="search-input" 
                      placeholder="Search transactions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <div className="transactions-list">
                  {getFilteredTransactions().length === 0 ? (
                    <div className="empty-state">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <line x1="9" y1="9" x2="15" y2="9" />
                        <line x1="9" y1="15" x2="15" y2="15" />
                      </svg>
                      <h3>No Transactions Yet</h3>
                      <p>Your investment transactions will appear here once your applications are approved.</p>
                    </div>
                  ) : (
                    <>
                      {getFilteredTransactions().map((transaction) => (
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
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="tab-content">
              <div className={`analytics-grid ${!user?.isPremium ? 'premium-locked' : ''}`}>
                {!user?.isPremium && (
                  <div className="premium-overlay">
                    <div className="premium-message">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                      <h3>Premium Feature</h3>
                      <p>Upgrade to Premium Membership to unlock Advanced Analytics & Insights</p>
                      <button className="btn-upgrade" onClick={() => navigate('/premium')}>
                        Upgrade Now
                      </button>
                    </div>
                  </div>
                )}
                <div className="card analytics-card">
                  <div className="card-header">
                    <h3>Portfolio Growth</h3>
                  </div>
                  <div className="analytics-content">
                    <div className="analytics-metric">
                      <p className="metric-label">Year-to-Date Growth</p>
                      <h2 className={`metric-value ${portfolioData.overview.returnPercentage >= 0 ? 'positive' : 'negative'}`}>
                        {portfolioData.overview.returnPercentage >= 0 ? '+' : ''}{portfolioData.overview.returnPercentage.toFixed(1)}%
                      </h2>
                    </div>
                    <div className="analytics-chart">
                      <div className="growth-indicators">
                        {portfolioData.overview.returnPercentage > 10 && (
                          <div className="indicator">
                            <span className="indicator-dot positive"></span>
                            <span>Above Market Average</span>
                          </div>
                        )}
                        {portfolioData.overview.returnPercentage === 0 && (
                          <div className="indicator">
                            <span className="indicator-dot"></span>
                            <span>Start investing to track growth</span>
                          </div>
                        )}
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
                        <div className="gauge-fill" style={{ width: `${Math.min(Object.keys(portfolioData.assetAllocation).length * 15 + 30, 70)}%` }}></div>
                      </div>
                      <p className="risk-label">
                        {Object.keys(portfolioData.assetAllocation).length === 0 ? 'No Data' :
                         Object.keys(portfolioData.assetAllocation).length === 1 ? 'Higher Risk' :
                         Object.keys(portfolioData.assetAllocation).length === 2 ? 'Moderate Risk' :
                         'Balanced Risk'}
                      </p>
                    </div>
                    <p className="risk-description">
                      {Object.keys(portfolioData.assetAllocation).length === 0 
                        ? 'Start investing to get a risk assessment of your portfolio.'
                        : Object.keys(portfolioData.assetAllocation).length === 1
                        ? 'Your portfolio is concentrated in one sector. Consider diversifying to reduce risk.'
                        : 'Your portfolio has a balanced risk profile with diversified investments across multiple sectors.'}
                    </p>
                  </div>
                </div>

                <div className="card analytics-card">
                  <div className="card-header">
                    <h3>Sector Performance</h3>
                  </div>
                  <div className="analytics-content">
                    <div className="sector-performance">
                      {Object.keys(portfolioData.assetAllocation).length > 0 ? (
                        Object.entries(portfolioData.assetAllocation).map(([assetType, data]) => {
                          // Calculate average return for this asset type
                          const assetsInType = portfolioData.assets.filter(a => a.category === assetType);
                          const avgReturn = assetsInType.length > 0
                            ? assetsInType.reduce((sum, a) => sum + a.returnPercentage, 0) / assetsInType.length
                            : 0;
                          
                          return (
                            <div key={assetType} className="sector-item">
                              <div className="sector-info">
                                <span>{assetType}</span>
                                <span className={`sector-roi ${avgReturn >= 0 ? 'positive' : 'negative'}`}>
                                  {avgReturn >= 0 ? '+' : ''}{avgReturn.toFixed(1)}%
                                </span>
                              </div>
                              <div className="sector-bar">
                                <div className="sector-bar-fill" style={{ width: `${Math.min(data.percentage, 100)}%` }}></div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="empty-sectors">No sector data available yet</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="card analytics-card full-width">
                  <div className="card-header">
                    <h3>Investment Insights</h3>
                  </div>
                  <div className="analytics-content">
                    <div className="insights-list">
                      {Object.keys(portfolioData.assetAllocation).length > 0 ? (
                        <>
                          {/* Show diversification insight if multiple asset types */}
                          {Object.keys(portfolioData.assetAllocation).length >= 3 && (
                            <div className="insight-item">
                              <div className="insight-icon success">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              </div>
                              <div className="insight-content">
                                <h4>Strong Portfolio Diversification</h4>
                                <p>Your investments are well-balanced across {Object.keys(portfolioData.assetAllocation).length} sectors, reducing overall risk.</p>
                              </div>
                            </div>
                          )}

                          {/* Check for concentration in one asset type */}
                          {Object.entries(portfolioData.assetAllocation).map(([type, data]) => {
                            if (data.percentage > 60) {
                              return (
                                <div key={type} className="insight-item">
                                  <div className="insight-icon info">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <circle cx="12" cy="12" r="10" />
                                      <line x1="12" y1="16" x2="12" y2="12" />
                                      <line x1="12" y1="8" x2="12.01" y2="8" />
                                    </svg>
                                  </div>
                                  <div className="insight-content">
                                    <h4>Consider Rebalancing</h4>
                                    <p>{type} now represents {data.percentage.toFixed(0)}% of your portfolio. Consider diversifying further.</p>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          })}

                          {/* Show positive return insight */}
                          {portfolioData.overview.returnPercentage > 10 && (
                            <div className="insight-item">
                              <div className="insight-icon success">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              </div>
                              <div className="insight-content">
                                <h4>Strong Performance</h4>
                                <p>Your portfolio is showing excellent returns of {portfolioData.overview.returnPercentage.toFixed(1)}%, outperforming market averages.</p>
                              </div>
                            </div>
                          )}

                          {/* Show if only 1 asset type - encourage diversification */}
                          {Object.keys(portfolioData.assetAllocation).length === 1 && (
                            <div className="insight-item">
                              <div className="insight-icon warning">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                  <line x1="12" y1="9" x2="12" y2="13" />
                                  <line x1="12" y1="17" x2="12.01" y2="17" />
                                </svg>
                              </div>
                              <div className="insight-content">
                                <h4>Diversify Your Portfolio</h4>
                                <p>Your investments are concentrated in one sector. Consider exploring other asset types to reduce risk.</p>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="insight-item">
                          <div className="insight-icon info">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10" />
                              <line x1="12" y1="16" x2="12" y2="12" />
                              <line x1="12" y1="8" x2="12.01" y2="8" />
                            </svg>
                          </div>
                          <div className="insight-content">
                            <h4>Start Your Investment Journey</h4>
                            <p>Explore our investment opportunities to start building a diversified portfolio.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Applications Tab */}
          {activeTab === 'applications' && (
            <div className="tab-content">
              <div className="card">
                <div className="card-header">
                  <h3>My Investment Applications</h3>
                  <button className="btn-primary" onClick={() => navigate('/investments')}>
                    Browse Opportunities
                  </button>
                </div>
                
                {loadingApplications ? (
                  <div className="loading-state">Loading applications...</div>
                ) : applications.length === 0 ? (
                  <div className="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <line x1="9" y1="9" x2="15" y2="9" />
                      <line x1="9" y1="15" x2="15" y2="15" />
                    </svg>
                    <h3>No Applications Yet</h3>
                    <p>You haven't submitted any investment applications. Browse our opportunities to get started!</p>
                    <button className="btn-primary" onClick={() => navigate('/investments')}>
                      Explore Investments
                    </button>
                  </div>
                ) : (
                  <div className="applications-list">
                    {applications.map((application) => (
                      <div key={application._id} className="application-item">
                        <div className="application-header">
                          <div className="application-info">
                            <h4>{application.investmentName}</h4>
                            <p className="application-date">
                              Submitted {new Date(application.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                          <span className={`application-status status-${application.status}`}>
                            {application.status === 'pending' && 'Pending Review'}
                            {application.status === 'pending-final-approval' && 'Pending Final Approval'}
                            {application.status === 'approved' && 'Approved'}
                            {application.status === 'rejected' && 'Rejected'}
                            {application.status === 'waiting-payment' && 'Awaiting Payment'}
                            {application.status === 'payment-received' && 'Payment Received'}
                            {application.status === 'completed' && 'Completed'}
                          </span>
                        </div>
                        
                        <div className="application-details">
                          <div className="detail-grid">
                            <div className="detail-item">
                              <span className="detail-label">Investment Amount</span>
                              <span className="detail-value">{formatCurrency(application.investmentAmount)}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Payment Method</span>
                              <span className="detail-value capitalize">{application.paymentMethod.replace('-', ' ')}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Type</span>
                              <span className="detail-value capitalize">{application.investmentType.replace('-', ' ')}</span>
                            </div>
                            {application.reviewedAt && (
                              <div className="detail-item">
                                <span className="detail-label">Reviewed On</span>
                                <span className="detail-value">
                                  {new Date(application.reviewedAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          {(application.adminNotes || application.superAdminNotes) && (
                            <div className="notes-section">
                              {application.adminNotes && (
                                <div className="admin-notes">
                                  <strong>Admin Notes:</strong> {application.adminNotes}
                                </div>
                              )}
                              {application.superAdminNotes && (
                                <div className="superadmin-notes">
                                  <strong>Super Admin Notes:</strong> {application.superAdminNotes}
                                </div>
                              )}
                            </div>
                          )}
                          
                          {application.status === 'waiting-payment' && (
                            <div className="payment-notice">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                              </svg>
                              <p>Your application has been approved! Please proceed with payment to complete your investment.</p>
                              <button className="btn-payment">Proceed to Payment</button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Portfolio;
