import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import './CrmBot.css';

const API_URL = process.env.REACT_APP_API_URL || '';

// ── Formatters ────────────────────────────────────────────────────────────────
function fmt$(n) { return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtN(n) { return Number(n).toLocaleString('en-US'); }

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ icon, label, value, sub, accent }) {
  return (
    <div className="crm-kpi-card" style={{ '--accent': accent }}>
      <div className="crm-kpi-icon">{icon}</div>
      <div className="crm-kpi-body">
        <p className="crm-kpi-label">{label}</p>
        <p className="crm-kpi-value">{value}</p>
        {sub && <p className="crm-kpi-sub">{sub}</p>}
      </div>
    </div>
  );
}

// ── Bar chart row ─────────────────────────────────────────────────────────────
function BarRow({ label, count, max, color }) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className="crm-bar-row">
      <span className="crm-bar-label">{label}</span>
      <div className="crm-bar-track">
        <div className="crm-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="crm-bar-count">{fmtN(count)}</span>
    </div>
  );
}

// ── Render simple markdown-style bold (**text**) in AI responses ──────────────
function AiText({ text }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <span>
      {parts.map((p, i) =>
        p.startsWith('**') && p.endsWith('**')
          ? <strong key={i}>{p.slice(2, -2)}</strong>
          : <span key={i}>{p}</span>
      )}
    </span>
  );
}

// ── Urgency badge ─────────────────────────────────────────────────────────────
const URGENCY_STYLE = {
  critical: { bg: '#fee2e2', color: '#991b1b', label: 'CRITICAL' },
  high:     { bg: '#fef3c7', color: '#92400e', label: 'HIGH'     },
  medium:   { bg: '#e0f2fe', color: '#075985', label: 'MEDIUM'   },
};

function UrgencyBadge({ urgency }) {
  const s = URGENCY_STYLE[urgency] || URGENCY_STYLE.medium;
  return (
    <span className="crm-urgency-badge" style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

// ── Trend pill ────────────────────────────────────────────────────────────────
function TrendPill({ pct }) {
  const up = pct >= 0;
  return (
    <span className="crm-trend-pill" style={{ background: up ? '#d1fae5' : '#fee2e2', color: up ? '#065f46' : '#991b1b' }}>
      {up ? '▲' : '▼'} {Math.abs(pct)}%
    </span>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function CrmBot() {
  const { token } = useContext(AuthContext);

  const [open,       setOpen]       = useState(false);
  const [activeTab,  setActiveTab]  = useState('dashboard');
  const [crmData,    setCrmData]    = useState(null);
  const [dataLoading,setDataLoading]= useState(false);
  const [dataError,  setDataError]  = useState(null);

  // Predictions state
  const [predData,    setPredData]    = useState(null);
  const [predLoading, setPredLoading] = useState(false);
  const [predError,   setPredError]   = useState(null);

  // Chat state
  const [messages,   setMessages]   = useState([
    { role: 'assistant', content: 'Hi! I\'m your CRM analyst. Ask me anything about your customers, sales trends, top products, or how to grow revenue.' }
  ]);
  const [input,      setInput]      = useState('');
  const [chatLoading,setChatLoading]= useState(false);
  const messagesEndRef = useRef(null);

  // ── Load CRM data whenever panel opens ──────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!token) return;
    setDataLoading(true);
    setDataError(null);
    try {
      const r = await fetch(`${API_URL}/api/admin/crm-insights`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await r.json();
      if (d.success) setCrmData(d.data);
      else setDataError(d.message || 'Failed to load CRM data.');
    } catch {
      setDataError('Could not reach the server.');
    } finally {
      setDataLoading(false);
    }
  }, [token]);

  const loadPredictions = useCallback(async () => {
    if (!token) return;
    setPredLoading(true);
    setPredError(null);
    try {
      const r = await fetch(`${API_URL}/api/admin/crm-predictions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await r.json();
      if (d.success) setPredData(d.data);
      else setPredError(d.message || 'Failed to load predictions.');
    } catch {
      setPredError('Could not reach the server.');
    } finally {
      setPredLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (open && !crmData) loadData();
  }, [open, crmData, loadData]);

  useEffect(() => {
    if (open && activeTab === 'predictions' && !predData) loadPredictions();
  }, [open, activeTab, predData, loadPredictions]);

  useEffect(() => {
    if (open) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  // ── Send chat message ────────────────────────────────────────────────────────
  const sendMessage = async () => {
    const text = input.trim();
    if (!text || chatLoading) return;
    setInput('');
    const updated = [...messages, { role: 'user', content: text }];
    setMessages(updated);
    setChatLoading(true);
    try {
      const r = await fetch(`${API_URL}/api/admin/crm-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: text, history: updated }),
      });
      const d = await r.json();
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: d.success ? d.response : (d.message || 'Something went wrong.'),
      }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Could not reach the server.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  // ── Derived chart data ───────────────────────────────────────────────────────
  const maxCatCount  = crmData?.topCategories?.[0]?.count  || 1;
  const maxBrandCount= crmData?.topBrands?.[0]?.count      || 1;

  const CATEGORY_COLORS = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6'];
  const BRAND_COLORS    = ['#f97316','#06b6d4','#84cc16','#e11d48','#7c3aed','#0ea5e9','#d97706','#059669'];

  // ── Suggested questions ──────────────────────────────────────────────────────
  const SUGGESTIONS = [
    'What should I order this week?',
    'Which products will run out of stock soonest?',
    'Which category has the most growth opportunity?',
    'What products are wishlisted but not purchased?',
    'How can we reduce lapsed customers?',
  ];

  return (
    <>
      {/* ── FAB trigger ─────────────────────────────────────────────────────── */}
      <button
        className={`crm-fab ${open ? 'crm-fab--open' : ''}`}
        onClick={() => setOpen(o => !o)}
        title="CRM Intelligence"
        aria-label="Toggle CRM bot"
      >
        {open ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77A5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
          </svg>
        )}
        {!open && <span className="crm-fab-label">CRM Insights</span>}
      </button>

      {/* ── Panel ───────────────────────────────────────────────────────────── */}
      {open && (
        <div className="crm-panel">
          {/* Header */}
          <div className="crm-panel-header">
            <div className="crm-panel-title">
              <span className="crm-panel-icon">📊</span>
              <div>
                <h2>CRM Intelligence</h2>
                <p>Live customer analytics · Ssaye Club</p>
              </div>
            </div>
            <div className="crm-panel-actions">
              <button className="crm-refresh-btn" onClick={() => { loadData(); loadPredictions(); }} disabled={dataLoading || predLoading} title="Refresh data">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={dataLoading ? 'crm-spin' : ''}>
                  <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                </svg>
              </button>
              <button className="crm-close-btn" onClick={() => setOpen(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="crm-tabs">
            <button className={`crm-tab ${activeTab === 'dashboard' ? 'crm-tab--active' : ''}`} onClick={() => setActiveTab('dashboard')}>
              📈 Dashboard
            </button>
            <button className={`crm-tab ${activeTab === 'predictions' ? 'crm-tab--active' : ''}`} onClick={() => setActiveTab('predictions')}>
              🔮 Predictions
            </button>
            <button className={`crm-tab ${activeTab === 'chat' ? 'crm-tab--active' : ''}`} onClick={() => setActiveTab('chat')}>
              🤖 Ask AI
            </button>
          </div>

          {/* ── Dashboard Tab ─────────────────────────────────────────────── */}
          {activeTab === 'dashboard' && (
            <div className="crm-body crm-dashboard">
              {dataLoading && !crmData && (
                <div className="crm-loading">
                  <div className="crm-spinner" />
                  <p>Loading CRM data…</p>
                </div>
              )}
              {dataError && (
                <div className="crm-error">
                  <span>⚠️</span><p>{dataError}</p>
                  <button onClick={loadData}>Retry</button>
                </div>
              )}
              {crmData && (
                <>
                  {/* KPI cards */}
                  <div className="crm-kpi-grid">
                    <KpiCard icon="📦" label="Avg Orders / Customer"  value={crmData.overview.avgOrdersPerCustomer}          accent="#6366f1" sub={`${fmtN(crmData.overview.totalOrders)} total orders`} />
                    <KpiCard icon="💰" label="Avg Spend / Customer"   value={fmt$(crmData.overview.avgSpendPerCustomer)}      accent="#10b981" sub={`${fmt$(crmData.overview.totalRevenue)} lifetime revenue`} />
                    <KpiCard icon="🔁" label="Repeat Purchase Rate"   value={`${crmData.overview.repeatRate}%`}              accent="#f59e0b" sub={`${fmtN(crmData.overview.repeatCustomers)} repeat buyers`} />
                    <KpiCard icon="⭐" label="High-Value Customers"   value={fmtN(crmData.overview.highValueCustomers)}      accent="#ec4899" sub="Top 20% by lifetime spend" />
                    <KpiCard icon="😴" label="Lapsed Customers"       value={fmtN(crmData.overview.lapsedCustomers)}         accent="#ef4444" sub="No order in 60+ days" />
                    <KpiCard icon="🔄" label="Active Subscriptions"   value={fmtN(crmData.overview.activeSubscriptions)}     accent="#8b5cf6" sub="Subscribe & Save members" />
                  </div>

                  {/* Top Categories */}
                  {crmData.topCategories.length > 0 && (
                    <div className="crm-section">
                      <h3 className="crm-section-title">🏷️ Top Categories by Units Sold</h3>
                      <div className="crm-bars">
                        {crmData.topCategories.map((c, i) => (
                          <BarRow key={c.name} label={c.name} count={c.count} max={maxCatCount} color={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Top Brands */}
                  {crmData.topBrands.length > 0 && (
                    <div className="crm-section">
                      <h3 className="crm-section-title">⭐ Top Brands by Units Sold</h3>
                      <div className="crm-bars">
                        {crmData.topBrands.map((b, i) => (
                          <BarRow key={b.name} label={b.name} count={b.count} max={maxBrandCount} color={BRAND_COLORS[i % BRAND_COLORS.length]} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Top Searches */}
                  {crmData.topSearches.length > 0 && (
                    <div className="crm-section">
                      <h3 className="crm-section-title">🔍 Top Search Terms</h3>
                      <div className="crm-tags">
                        {crmData.topSearches.map((s, i) => (
                          <span key={s.term} className="crm-tag" style={{ opacity: 1 - i * 0.07 }}>
                            {s.term} <strong>{s.count}</strong>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Top Wishlisted */}
                  {crmData.topWishlisted.length > 0 && (
                    <div className="crm-section">
                      <h3 className="crm-section-title">❤️ Most Wishlisted Products</h3>
                      <div className="crm-wish-list">
                        {crmData.topWishlisted.map((w, i) => (
                          <div key={w.name} className="crm-wish-row">
                            <span className="crm-wish-rank">#{i + 1}</span>
                            <div className="crm-wish-info">
                              <span className="crm-wish-name">{w.name}</span>
                              {w.category && <span className="crm-wish-cat">{w.category}</span>}
                            </div>
                            <span className="crm-wish-count">{w.count} saves</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Top Products */}
                  {crmData.topProducts.length > 0 && (
                    <div className="crm-section">
                      <h3 className="crm-section-title">📦 Best-Selling Products</h3>
                      <div className="crm-wish-list">
                        {crmData.topProducts.map((p, i) => (
                          <div key={p.name} className="crm-wish-row">
                            <span className="crm-wish-rank">#{i + 1}</span>
                            <div className="crm-wish-info">
                              <span className="crm-wish-name">{p.name}</span>
                              {p.brand && <span className="crm-wish-cat">{p.brand} · {p.category}</span>}
                            </div>
                            <span className="crm-wish-count">{p.count} sold</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {crmData.topCategories.length === 0 && crmData.topBrands.length === 0 && (
                    <div className="crm-empty">
                      <span>📭</span>
                      <p>No order data yet. CRM insights will populate once customers start purchasing.</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── Predictions Tab ───────────────────────────────────────────── */}
          {activeTab === 'predictions' && (
            <div className="crm-body crm-dashboard">
              {predLoading && !predData && (
                <div className="crm-loading"><div className="crm-spinner" /><p>Analysing stock & velocity…</p></div>
              )}
              {predError && (
                <div className="crm-error"><span>⚠️</span><p>{predError}</p><button onClick={loadPredictions}>Retry</button></div>
              )}
              {predData && (
                <>
                  {/* Summary alert bar */}
                  {(predData.meta.outOfStockCount > 0 || predData.meta.lowStockCount > 0) && (
                    <div className="crm-alert-bar">
                      {predData.meta.outOfStockCount > 0 && (
                        <span className="crm-alert-chip crm-alert-chip--red">
                          🚨 {predData.meta.outOfStockCount} out of stock
                        </span>
                      )}
                      {predData.meta.lowStockCount > 0 && (
                        <span className="crm-alert-chip crm-alert-chip--amber">
                          ⚠️ {predData.meta.lowStockCount} low stock
                        </span>
                      )}
                      {predData.meta.activeSubCount > 0 && (
                        <span className="crm-alert-chip crm-alert-chip--blue">
                          🔄 {predData.meta.activeSubCount} active subscriptions
                        </span>
                      )}
                    </div>
                  )}

                  {/* Urgent Reorder List */}
                  <div className="crm-section">
                    <h3 className="crm-section-title">🛒 Reorder Now — Priority List</h3>
                    {predData.urgentReorders.length === 0 ? (
                      <div className="crm-pred-empty">
                        <span>✅</span>
                        <p>All selling products are currently in stock.</p>
                      </div>
                    ) : (
                      <div className="crm-reorder-list">
                        {predData.urgentReorders.map((p, i) => (
                          <div key={i} className={`crm-reorder-card crm-reorder-card--${p.urgency}`}>
                            <div className="crm-reorder-top">
                              <UrgencyBadge urgency={p.urgency} />
                              <TrendPill pct={p.trendPct} />
                            </div>
                            <p className="crm-reorder-name">{p.name}</p>
                            <p className="crm-reorder-meta">{p.brand} · {p.category}</p>
                            <div className="crm-reorder-stats">
                              <div className="crm-reorder-stat">
                                <span className="crm-reorder-stat-label">Velocity</span>
                                <span className="crm-reorder-stat-val">{p.weeklyVelocity} / wk</span>
                              </div>
                              <div className="crm-reorder-stat">
                                <span className="crm-reorder-stat-label">Suggest</span>
                                <span className="crm-reorder-stat-val crm-reorder-qty">{p.suggestedQty} units</span>
                              </div>
                            </div>
                            {p.vendor && p.vendor !== 'Unknown vendor' && (
                              <p className="crm-reorder-vendor">🤝 {p.vendor}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Trending Products */}
                  {predData.trending.length > 0 && (
                    <div className="crm-section">
                      <h3 className="crm-section-title">🚀 Trending — Stock Up Before They Spike</h3>
                      <div className="crm-wish-list">
                        {predData.trending.map((p, i) => (
                          <div key={i} className="crm-wish-row">
                            <span className="crm-wish-rank">#{i + 1}</span>
                            <div className="crm-wish-info">
                              <span className="crm-wish-name">{p.name}</span>
                              <span className="crm-wish-cat">{p.brand} · {p.category}</span>
                            </div>
                            <TrendPill pct={p.trendPct} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Subscription Forecast */}
                  {predData.subscriptionForecast.length > 0 && (
                    <div className="crm-section">
                      <h3 className="crm-section-title">🔄 Subscription Demand — Next 30 Days</h3>
                      <p className="crm-section-sub">Guaranteed units needed to fulfil active subscriptions</p>
                      <div className="crm-wish-list">
                        {predData.subscriptionForecast.map((s, i) => (
                          <div key={i} className="crm-wish-row">
                            <span className="crm-wish-rank">#{i + 1}</span>
                            <div className="crm-wish-info">
                              <span className="crm-wish-name">{s.name}</span>
                              <span className="crm-wish-cat">{s.subscriberCount} subscriber{s.subscriberCount !== 1 ? 's' : ''}</span>
                            </div>
                            <span className="crm-wish-count">{s.forecastedUnits} units</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Wishlist Gap */}
                  {predData.wishlistGap.length > 0 && (
                    <div className="crm-section">
                      <h3 className="crm-section-title">❤️ High Intent, Low Conversion</h3>
                      <p className="crm-section-sub">Wishlisted heavily but purchased rarely — prime promotion targets</p>
                      <div className="crm-wish-list">
                        {predData.wishlistGap.map((w, i) => (
                          <div key={i} className="crm-wish-row">
                            <span className="crm-wish-rank">#{i + 1}</span>
                            <div className="crm-wish-info">
                              <span className="crm-wish-name">{w.name}</span>
                              <span className="crm-wish-cat">{w.category}</span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <span className="crm-wish-count">{w.saves} saves</span>
                              <span style={{ display: 'block', fontSize: '0.68rem', color: '#94a3b8' }}>{w.recentSales} sold</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {predData.urgentReorders.length === 0 && predData.trending.length === 0 && (
                    <div className="crm-empty">
                      <span>📊</span>
                      <p>Place some orders to start generating predictive insights.</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── Chat Tab ──────────────────────────────────────────────────── */}
          {activeTab === 'chat' && (
            <div className="crm-body crm-chat-body">
              {/* Suggested questions (only when conversation is default) */}
              {messages.length === 1 && (
                <div className="crm-suggestions">
                  <p className="crm-suggestions-label">Try asking:</p>
                  {SUGGESTIONS.map(q => (
                    <button key={q} className="crm-suggestion-chip" onClick={() => { setInput(q); }}>
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {/* Messages */}
              <div className="crm-messages">
                {messages.map((m, i) => (
                  <div key={i} className={`crm-msg crm-msg--${m.role}`}>
                    {m.role === 'assistant' && <span className="crm-msg-avatar">🤖</span>}
                    <div className="crm-msg-bubble">
                      {m.content.split('\n').map((line, li) => (
                        <p key={li} style={{ margin: li === 0 ? 0 : '6px 0 0' }}>
                          <AiText text={line} />
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="crm-msg crm-msg--assistant">
                    <span className="crm-msg-avatar">🤖</span>
                    <div className="crm-msg-bubble crm-msg-bubble--typing">
                      <span /><span /><span />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="crm-input-row">
                <textarea
                  className="crm-input"
                  placeholder="Ask about customers, sales trends, categories…"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  rows={1}
                  disabled={chatLoading}
                />
                <button
                  className="crm-send-btn"
                  onClick={sendMessage}
                  disabled={!input.trim() || chatLoading}
                  title="Send"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
