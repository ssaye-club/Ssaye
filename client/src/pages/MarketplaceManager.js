import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './MarketplaceManager.css';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const STATUS_LABELS = {
  pending:    { label: 'Pending',    color: '#f59e0b' },
  'in-transit': { label: 'In Transit', color: '#3b82f6' },
  delivered:  { label: 'Delivered',  color: '#10b981' },
  cancelled:  { label: 'Cancelled',  color: '#6b7280' },
  refunded:   { label: 'Refunded',   color: '#ef4444' },
};

function StatusBadge({ status }) {
  const s = STATUS_LABELS[status] || { label: status, color: '#6b7280' };
  return (
    <span
      className="mm-status-badge"
      style={{ background: s.color + '20', color: s.color, border: `1px solid ${s.color}40` }}
    >
      {s.label}
    </span>
  );
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ─── Cockpit Stats ────────────────────────────────────────────────────────────
function CockpitTab({ stats, orders, onStatusChange }) {
  const dispatchNeeded = orders.filter((o) => o.status === 'pending').slice(0, 5);

  return (
    <div className="mm-cockpit">
      {/* ── Stat Cards Grid ── */}
      <div className="mm-stats-grid">
        <div className="mm-stat-card mm-stat-card--green">
          <div className="mm-stat-icon">💰</div>
          <div className="mm-stat-body">
            <p className="mm-stat-label">Total Revenue</p>
            <p className="mm-stat-value">${stats.revenue?.toFixed(2) ?? '0.00'}</p>
          </div>
        </div>

        <div className="mm-stat-card mm-stat-card--red">
          <div className="mm-stat-icon">↩️</div>
          <div className="mm-stat-body">
            <p className="mm-stat-label">Refunded</p>
            <p className="mm-stat-value">${stats.refunded?.toFixed(2) ?? '0.00'}</p>
          </div>
        </div>

        <div className="mm-stat-card mm-stat-card--amber">
          <div className="mm-stat-icon">⏳</div>
          <div className="mm-stat-body">
            <p className="mm-stat-label">Pending Orders</p>
            <p className="mm-stat-value">{stats.pending ?? 0}</p>
          </div>
        </div>

        <div className="mm-stat-card mm-stat-card--blue">
          <div className="mm-stat-icon">🚚</div>
          <div className="mm-stat-body">
            <p className="mm-stat-label">In Transit</p>
            <p className="mm-stat-value">{stats.inTransit ?? 0}</p>
          </div>
        </div>

        <div className="mm-stat-card mm-stat-card--teal">
          <div className="mm-stat-icon">✅</div>
          <div className="mm-stat-body">
            <p className="mm-stat-label">Delivered</p>
            <p className="mm-stat-value">{stats.delivered ?? 0}</p>
          </div>
        </div>

        <div className="mm-stat-card mm-stat-card--purple">
          <div className="mm-stat-icon">👥</div>
          <div className="mm-stat-body">
            <p className="mm-stat-label">Unique Customers</p>
            <p className="mm-stat-value">{stats.uniqueCustomers ?? 0}</p>
          </div>
        </div>

        <div className="mm-stat-card mm-stat-card--indigo">
          <div className="mm-stat-icon">📦</div>
          <div className="mm-stat-body">
            <p className="mm-stat-label">Total Orders</p>
            <p className="mm-stat-value">{stats.totalOrders ?? 0}</p>
          </div>
        </div>

        <div className="mm-stat-card mm-stat-card--orange">
          <div className="mm-stat-icon">⚠️</div>
          <div className="mm-stat-body">
            <p className="mm-stat-label">Low Stock Items</p>
            <p className="mm-stat-value">{stats.lowStockItems ?? 0}</p>
          </div>
        </div>
      </div>

      {/* ── Orders Need Dispatch ── */}
      {dispatchNeeded.length > 0 && (
        <div className="mm-dispatch-alert">
          <div className="mm-dispatch-header">
            <span className="mm-dispatch-dot" />
            <h3 className="mm-dispatch-title">
              Orders Need Dispatch
              <span className="mm-dispatch-count">{stats.pending}</span>
            </h3>
          </div>
          <div className="mm-dispatch-list">
            {dispatchNeeded.map((o) => (
              <div key={o._id} className="mm-dispatch-row">
                <div className="mm-dispatch-left">
                  <p className="mm-dispatch-order">{o.orderNumber}</p>
                  <p className="mm-dispatch-customer">
                    {o.customerName} — {o.items?.length} item{o.items?.length !== 1 ? 's' : ''}
                  </p>
                  <p className="mm-dispatch-date">{fmtDate(o.createdAt)}</p>
                </div>
                <div className="mm-dispatch-right">
                  <span className="mm-dispatch-amount">${o.total?.toFixed(2)}</span>
                  <button
                    className="mm-dispatch-btn"
                    onClick={() => onStatusChange(o._id, 'in-transit')}
                  >
                    Mark In Transit →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Recent Orders ── */}
      <div className="mm-recent">
        <h3 className="mm-recent-title">Recent Orders</h3>
        <OrdersTable orders={orders.slice(0, 10)} onStatusChange={onStatusChange} />
      </div>
    </div>
  );
}

// ─── Orders Table (reusable) ──────────────────────────────────────────────────
function OrdersTable({ orders, onStatusChange }) {
  const [expandedId, setExpandedId] = useState(null);
  const [editingId,  setEditingId]  = useState(null);
  const [newStatus,  setNewStatus]  = useState('');

  if (orders.length === 0) {
    return (
      <div className="mm-empty">
        <span>📭</span>
        <p>No orders yet.</p>
      </div>
    );
  }

  return (
    <div className="mm-table-wrap">
      <table className="mm-table">
        <thead>
          <tr>
            <th>Order #</th>
            <th>Customer</th>
            <th>Items</th>
            <th>Total</th>
            <th>Status</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <React.Fragment key={o._id}>
              <tr
                className={`mm-table-row ${expandedId === o._id ? 'mm-table-row--expanded' : ''}`}
                onClick={() => setExpandedId(expandedId === o._id ? null : o._id)}
              >
                <td className="mm-td-order">{o.orderNumber}</td>
                <td>
                  <p className="mm-td-name">{o.customerName}</p>
                  <p className="mm-td-email">{o.customerEmail}</p>
                </td>
                <td>{o.items?.length ?? 0} item{o.items?.length !== 1 ? 's' : ''}</td>
                <td className="mm-td-total">${o.total?.toFixed(2)}</td>
                <td>
                  {editingId === o._id ? (
                    <div className="mm-status-edit" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                        className="mm-status-select"
                      >
                        {Object.entries(STATUS_LABELS).map(([val, { label }]) => (
                          <option key={val} value={val}>{label}</option>
                        ))}
                      </select>
                      <button
                        className="mm-status-save"
                        onClick={() => {
                          onStatusChange(o._id, newStatus);
                          setEditingId(null);
                        }}
                      >
                        Save
                      </button>
                      <button
                        className="mm-status-cancel"
                        onClick={() => setEditingId(null)}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <StatusBadge status={o.status} />
                  )}
                </td>
                <td className="mm-td-date">{fmtDate(o.createdAt)}</td>
                <td onClick={(e) => e.stopPropagation()}>
                  <button
                    className="mm-action-btn"
                    onClick={() => {
                      setEditingId(o._id);
                      setNewStatus(o.status);
                    }}
                    title="Change status"
                  >
                    ✏️
                  </button>
                </td>
              </tr>

              {/* Expanded row — item details */}
              {expandedId === o._id && (
                <tr className="mm-expanded-row">
                  <td colSpan={7}>
                    <div className="mm-expanded-content">
                      <h4>Items in Order</h4>
                      <ul className="mm-item-list">
                        {o.items?.map((item, idx) => (
                          <li key={idx} className="mm-item-row">
                            <span className="mm-item-emoji">{item.emoji}</span>
                            <span className="mm-item-name">{item.name}</span>
                            <span className="mm-item-brand">({item.brand})</span>
                            <span className="mm-item-qty">× {item.quantity}</span>
                            <span className="mm-item-total">${item.lineTotal?.toFixed(2)}</span>
                          </li>
                        ))}
                      </ul>
                      {o.dispatchedTo && (
                        <p className="mm-dispatch-to">Dispatched to: <strong>{o.dispatchedTo}</strong></p>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Customers Tab ────────────────────────────────────────────────────────────
function CustomersTab({ orders }) {
  // Aggregate per customer
  const customerMap = {};
  orders.forEach((o) => {
    const key = o.customerEmail;
    if (!customerMap[key]) {
      customerMap[key] = {
        name:    o.customerName,
        email:   o.customerEmail,
        orders:  0,
        spent:   0,
        lastOrder: o.createdAt,
      };
    }
    customerMap[key].orders += 1;
    customerMap[key].spent  += o.total || 0;
    if (new Date(o.createdAt) > new Date(customerMap[key].lastOrder)) {
      customerMap[key].lastOrder = o.createdAt;
    }
  });

  const customers = Object.values(customerMap).sort((a, b) => b.spent - a.spent);

  return (
    <div className="mm-customers">
      {customers.length === 0 ? (
        <div className="mm-empty"><span>👥</span><p>No customers yet.</p></div>
      ) : (
        <div className="mm-table-wrap">
          <table className="mm-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Email</th>
                <th>Total Orders</th>
                <th>Total Spent</th>
                <th>Last Order</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.email} className="mm-table-row">
                  <td className="mm-td-name">{c.name}</td>
                  <td className="mm-td-email">{c.email}</td>
                  <td>{c.orders}</td>
                  <td className="mm-td-total">${c.spent.toFixed(2)}</td>
                  <td className="mm-td-date">{fmtDate(c.lastOrder)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Stub Tab ─────────────────────────────────────────────────────────────────
// ─── Subscriptions Tab ────────────────────────────────────────────────────────
const SUB_STATUS_COLORS = {
  active:    '#10b981',
  paused:    '#f59e0b',
  cancelled: '#6b7280',
  completed: '#3b82f6',
};

const FREQ_LABELS = {
  weekly:    'Every week',
  biweekly:  'Every 2 weeks',
  monthly:   'Every month',
  bimonthly: 'Every 2 months',
  quarterly: 'Every 3 months',
};

function SubscriptionsTab({ token }) {
  const [subs,    setSubs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/api/subscriptions`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.success) setSubs(d.subscriptions); else setError('Failed to load subscriptions.'); })
      .catch(() => setError('Could not reach the server.'))
      .finally(() => setLoading(false));
  }, [token]);

  const updateStatus = async (id, status) => {
    try {
      const res = await fetch(`${API_URL}/api/subscriptions/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) setSubs(prev => prev.map(s => s._id === id ? data.subscription : s));
    } catch { console.error('Failed to update subscription status'); }
  };

  if (loading) return <div className="mm-loading"><div className="mm-spinner" /><p>Loading subscriptions…</p></div>;
  if (error)   return <div className="mm-error"><span>⚠️</span><p>{error}</p></div>;

  return (
    <div className="mm-orders-tab">
      <div className="mm-tab-heading">
        <h2>Subscriptions</h2>
        <p>{subs.length} active subscription{subs.length !== 1 ? 's' : ''}</p>
      </div>

      {subs.length === 0 ? (
        <div className="mm-stub">
          <span className="mm-stub-icon">🔄</span>
          <h3>No subscriptions yet</h3>
          <p>Subscriptions will appear here once customers subscribe to products.</p>
        </div>
      ) : (
        <div className="mm-sub-table-wrap">
          <table className="mm-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Customer</th>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Frequency</th>
                <th>Start</th>
                <th>End</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {subs.map(s => (
                <tr key={s._id}>
                  <td><span className="mm-order-num">{s.subscriptionNumber}</span></td>
                  <td>
                    <div className="mm-customer-cell">
                      <span className="mm-customer-name">{s.customerName}</span>
                      <span className="mm-customer-email">{s.customerEmail}</span>
                    </div>
                  </td>
                  <td>
                    <div className="mm-product-cell">
                      <span>{s.product.emoji}</span>
                      <span className="mm-product-name">{s.product.name}</span>
                    </div>
                  </td>
                  <td><span className="mm-category-chip">{s.product.category}</span></td>
                  <td><strong>${s.product.price.toFixed(2)}</strong></td>
                  <td>{FREQ_LABELS[s.frequency] ?? s.frequency}</td>
                  <td>{new Date(s.startDate).toLocaleDateString()}</td>
                  <td>{new Date(s.endDate).toLocaleDateString()}</td>
                  <td>
                    <span className="mm-status-badge" style={{ background: SUB_STATUS_COLORS[s.status] + '22', color: SUB_STATUS_COLORS[s.status], borderColor: SUB_STATUS_COLORS[s.status] + '55' }}>
                      {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                    </span>
                  </td>
                  <td>
                    <select
                      className="mm-status-select"
                      value={s.status}
                      onChange={e => updateStatus(s._id, e.target.value)}
                    >
                      <option value="active">Active</option>
                      <option value="paused">Paused</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="completed">Completed</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Inventory Tab ────────────────────────────────────────────────────────────
const STOCK_COLORS = { 'In Stock': '#10b981', 'Low': '#f59e0b', 'Out of Stock': '#ef4444' };
const CATEGORIES_LIST = ['All Products','Dal & Lentils','Rice & Grains','Spices & Masala','Atta & Flour','Oils & Ghee','Snacks & Namkeen','Pickles & Chutneys','Frozen Foods','Dairy & Paneer','Tea, Coffee & Drinks','Sweets & Mithai','Fresh Produce','Meat & Seafood','Pooja Items'];
const PAGE_SIZE = 50;

function InventoryTab({ token }) {
  const [products,     setProducts]     = useState([]);
  const [total,        setTotal]        = useState(0);
  const [pages,        setPages]        = useState(1);
  const [page,         setPage]         = useState(1);
  const [stockCounts,  setStockCounts]  = useState({ 'In Stock': 0, 'Low': 0, 'Out of Stock': 0 });
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [importing,    setImporting]    = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [importError,  setImportError]  = useState(null);
  const [clearing,     setClearing]     = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [search,       setSearch]       = useState('');
  const [filterCat,    setFilterCat]    = useState('');
  const [filterStock,  setFilterStock]  = useState('');
  const fileRef    = React.useRef(null);
  const searchTimer = React.useRef(null);

  const fetchPage = useCallback(async (p, s, cat, stk, silent = false) => {
    if (!token) return;
    if (!silent) setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: p, limit: PAGE_SIZE });
      if (s)   params.set('search',   s);
      if (cat) params.set('category', cat);
      if (stk) params.set('stock',    stk);
      const r = await fetch(`${API_URL}/api/inventory?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (d.success) {
        setProducts(d.products);
        setTotal(d.total);
        setPages(d.pages);
        setStockCounts(d.stockCounts);
      } else {
        setError('Failed to load inventory.');
      }
    } catch {
      setError('Could not reach the server.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [token]);

  // Initial load
  useEffect(() => { fetchPage(1, '', '', ''); }, [fetchPage]);

  // Debounced search — 400 ms after typing stops
  const handleSearchChange = (val) => {
    setSearch(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setPage(1);
      fetchPage(1, val, filterCat, filterStock);
    }, 400);
  };

  const applyFilter = (cat, stk) => {
    setFilterCat(cat); setFilterStock(stk); setPage(1);
    fetchPage(1, search, cat, stk);
  };

  const goToPage = (p) => { setPage(p); fetchPage(p, search, filterCat, filterStock); };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true); setImportResult(null); setImportError(null);
    try {
      const csvText = await file.text();
      const res = await fetch(`${API_URL}/api/inventory/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ csvText }),
      });
      const data = await res.json();
      if (data.success) {
        setImportResult(data.results);
        // Silently refresh current page so banner stays visible
        await fetchPage(page, search, filterCat, filterStock, true);
      } else {
        setImportError(data.message || 'Import failed.');
      }
    } catch {
      setImportError('Could not reach the server.');
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  const handleClearAll = async () => {
    setClearing(true); setConfirmClear(false); setImportResult(null); setImportError(null);
    try {
      const res = await fetch(`${API_URL}/api/inventory/all`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setProducts([]); setTotal(0); setPages(1); setPage(1);
        setStockCounts({ 'In Stock': 0, 'Low': 0, 'Out of Stock': 0 });
        setImportResult({ inserted: 0, updated: 0, skipped: 0, cleared: data.deleted });
      } else {
        setImportError(data.message || 'Clear failed.');
      }
    } catch {
      setImportError('Could not reach the server.');
    } finally {
      setClearing(false);
    }
  };

  const handleStockEdit = async (productId, newStock) => {
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: newStock } : p));
    await fetch(`${API_URL}/api/inventory/${productId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ stock: newStock }),
    });
  };

  const totalPages = pages;
  const pageNums = [];
  for (let i = Math.max(1, page - 2); i <= Math.min(totalPages, page + 2); i++) pageNums.push(i);

  return (
    <div className="mm-orders-tab">
      {/* ── Header ── */}
      <div className="mm-tab-heading">
        <div>
          <h2>Inventory</h2>
          <p>{total.toLocaleString()} products total</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {!confirmClear ? (
            <button className="inv-clear-btn" onClick={() => setConfirmClear(true)} disabled={clearing || importing || total === 0}>
              🗑 Clear All
            </button>
          ) : (
            <div className="inv-confirm-row">
              <span className="inv-confirm-label">Delete all {total.toLocaleString()} products?</span>
              <button className="inv-confirm-yes" onClick={handleClearAll} disabled={clearing}>
                {clearing ? 'Clearing…' : 'Yes, delete all'}
              </button>
              <button className="inv-confirm-no" onClick={() => setConfirmClear(false)}>Cancel</button>
            </div>
          )}
          <button className="inv-upload-btn" onClick={() => fileRef.current?.click()} disabled={importing || clearing}>
            {importing ? '⏳ Importing…' : '📂 Import CSV'}
          </button>
        </div>
        <input ref={fileRef} type="file" accept=".csv,text/csv" style={{ display: 'none' }} onChange={handleFileUpload} />
      </div>

      {/* ── Banners ── */}
      {importResult && (
        <div className="inv-import-banner inv-import-banner--success">
          {importResult.cleared != null
            ? <>🗑 Cleared <strong>{importResult.cleared.toLocaleString()}</strong> products. Upload a fresh CSV to repopulate.</>
            : <>✅ Import complete — <strong>{importResult.inserted}</strong> new, <strong>{importResult.updated}</strong> updated, <strong>{importResult.skipped}</strong> skipped.</>
          }
          <button className="inv-banner-close" onClick={() => setImportResult(null)}>✕</button>
        </div>
      )}
      {importError && (
        <div className="inv-import-banner inv-import-banner--error">
          ⚠️ {importError}
          <button className="inv-banner-close" onClick={() => setImportError(null)}>✕</button>
        </div>
      )}

      {/* ── CSV format guide ── */}
      <div className="inv-csv-guide">
        <span className="inv-csv-guide-label">📋 CSV format:</span>
        <code>ItemNum, ItemName, In_Stock, Price</code>
        <span className="inv-csv-guide-note">Categories are auto-detected.</span>
      </div>

      {/* ── Stock summary chips ── */}
      <div className="inv-stock-summary">
        {Object.entries(stockCounts).map(([label, count]) => (
          <button
            key={label}
            className={`inv-stock-chip ${filterStock === label ? 'inv-stock-chip--active' : ''}`}
            style={{ '--chip-color': STOCK_COLORS[label] }}
            onClick={() => applyFilter(filterCat, filterStock === label ? '' : label)}
          >
            <span className="inv-chip-dot" style={{ background: STOCK_COLORS[label] }} />
            {label}: <strong>{count.toLocaleString()}</strong>
          </button>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="inv-filters">
        <input
          className="inv-search"
          placeholder="🔍 Search by name, brand or item #…"
          value={search}
          onChange={e => handleSearchChange(e.target.value)}
        />
        <select className="mm-status-select" value={filterCat} onChange={e => applyFilter(e.target.value, filterStock)}>
          {CATEGORIES_LIST.map(c => <option key={c} value={c === 'All Products' ? '' : c}>{c}</option>)}
        </select>
        <select className="mm-status-select" value={filterStock} onChange={e => applyFilter(filterCat, e.target.value)}>
          <option value="">All Stock</option>
          <option>In Stock</option>
          <option>Low</option>
          <option>Out of Stock</option>
        </select>
      </div>

      {error && <div className="mm-error"><span>⚠️</span><p>{error}</p></div>}

      <div className="mm-sub-table-wrap" style={{ opacity: loading ? 0.5 : 1, transition: 'opacity 0.15s' }}>
        <table className="mm-table">
          <thead>
            <tr>
              <th>Item #</th>
              <th>Product</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock Status</th>
              <th>Change Status</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {loading && products.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading…</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>No products match your filters.</td></tr>
            ) : products.map(p => (
              <tr key={p._id || p.id}>
                <td><span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#94a3b8' }}>{p.itemNum || p.id}</span></td>
                <td>
                  <div className="mm-product-cell">
                    <span>{p.emoji}</span>
                    <div>
                      <div className="mm-product-name">{p.name}</div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{p.brand}</div>
                    </div>
                  </div>
                </td>
                <td><span className="mm-category-chip">{p.category}</span></td>
                <td><strong>${p.price.toFixed(2)}</strong></td>
                <td>
                  <span className="mm-status-badge" style={{ background: STOCK_COLORS[p.stock] + '22', color: STOCK_COLORS[p.stock], borderColor: STOCK_COLORS[p.stock] + '55' }}>
                    {p.stock}
                  </span>
                </td>
                <td>
                  <select className="mm-status-select" value={p.stock} onChange={e => handleStockEdit(p.id, e.target.value)}>
                    <option>In Stock</option>
                    <option>Low</option>
                    <option>Out of Stock</option>
                  </select>
                </td>
                <td style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  {p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="inv-pagination">
          <button className="inv-page-btn" onClick={() => goToPage(page - 1)} disabled={page === 1}>‹</button>
          {page > 3 && <><button className="inv-page-btn" onClick={() => goToPage(1)}>1</button><span className="inv-page-ellipsis">…</span></>}
          {pageNums.map(n => (
            <button key={n} className={`inv-page-btn ${n === page ? 'inv-page-btn--active' : ''}`} onClick={() => goToPage(n)}>{n}</button>
          ))}
          {page < totalPages - 2 && <><span className="inv-page-ellipsis">…</span><button className="inv-page-btn" onClick={() => goToPage(totalPages)}>{totalPages}</button></>}
          <button className="inv-page-btn" onClick={() => goToPage(page + 1)} disabled={page === totalPages}>›</button>
          <span className="inv-page-info">Page {page} of {totalPages} · {total.toLocaleString()} products</span>
        </div>
      )}
    </div>
  );
}

// ─── Images Tab ───────────────────────────────────────────────────────────────
function ImagesTab({ token }) {
  const [query,      setQuery]      = useState('');
  const [results,    setResults]    = useState([]);
  const [searching,  setSearching]  = useState(false);
  const [selected,   setSelected]   = useState(null); // product object
  const [preview,    setPreview]    = useState(null); // base64 data URL
  const [saving,     setSaving]     = useState(false);
  const [saveOk,     setSaveOk]     = useState(false);
  const [saveErr,    setSaveErr]    = useState(null);

  // Backfill state
  const [backfilling,   setBackfilling]   = useState(false);
  const [backfillMsg,   setBackfillMsg]   = useState(null);
  const [backfillErr,   setBackfillErr]   = useState(null);

  const fileRef = React.useRef(null);
  const searchTimer = React.useRef(null);

  const handleBackfill = async () => {
    setBackfilling(true); setBackfillMsg(null); setBackfillErr(null);
    try {
      const res = await fetch(`${API_URL}/api/inventory/backfill-images`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setBackfillMsg(`Queued ${data.queued} product${data.queued !== 1 ? 's' : ''} for image fetch. This runs in the background — images will appear over the next few minutes.`);
      } else {
        setBackfillErr(data.message || 'Backfill failed.');
      }
    } catch { setBackfillErr('Could not reach the server.'); }
    finally { setBackfilling(false); }
  };

  const runSearch = (q) => {
    clearTimeout(searchTimer.current);
    if (!q.trim()) { setResults([]); return; }
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const r = await fetch(`${API_URL}/api/inventory/search-by-itemnum?q=${encodeURIComponent(q)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const d = await r.json();
        if (d.success) setResults(d.products);
      } catch {}
      finally { setSearching(false); }
    }, 350);
  };

  const selectProduct = (p) => {
    setSelected(p);
    setResults([]);
    setQuery(p.itemNum ? `${p.itemNum} — ${p.name}` : p.name);
    setPreview(p.imageUrl || null);
    setSaveOk(false);
    setSaveErr(null);
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(file);
    setSaveOk(false);
    setSaveErr(null);
    e.target.value = '';
  };

  const handleSave = async () => {
    if (!selected || !preview) return;
    setSaving(true); setSaveOk(false); setSaveErr(null);
    try {
      const res = await fetch(`${API_URL}/api/inventory/${selected.id}/image`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ imageUrl: preview }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveOk(true);
        setSelected(prev => ({ ...prev, imageUrl: preview }));
      } else {
        setSaveErr(data.message || 'Failed to save image.');
      }
    } catch { setSaveErr('Could not reach the server.'); }
    finally { setSaving(false); }
  };

  const handleRemove = async () => {
    if (!selected) return;
    setSaving(true); setSaveOk(false); setSaveErr(null);
    try {
      const res = await fetch(`${API_URL}/api/inventory/${selected.id}/image`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ imageUrl: null }),
      });
      const data = await res.json();
      if (data.success) {
        setPreview(null);
        setSelected(prev => ({ ...prev, imageUrl: null }));
        setSaveOk(true);
      } else {
        setSaveErr(data.message || 'Failed to remove image.');
      }
    } catch { setSaveErr('Could not reach the server.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="mm-orders-tab">
      <div className="mm-tab-heading">
        <div>
          <h2>Product Images</h2>
          <p>Search by item # or product name, then upload an image</p>
        </div>
      </div>

      {/* ── Auto-fetch card ── */}
      <div className="img-backfill-card">
        <div className="img-backfill-info">
          <span className="img-backfill-icon">🌐</span>
          <div>
            <p className="img-backfill-title">Auto-fetch from Open Food Facts</p>
            <p className="img-backfill-sub">Searches the Open Food Facts database for every product currently missing an image. Runs in the background — no waiting required.</p>
          </div>
        </div>
        <button className="img-backfill-btn" onClick={handleBackfill} disabled={backfilling}>
          {backfilling ? 'Starting…' : '🔄 Fetch Missing Images'}
        </button>
        {backfillMsg && <p className="img-msg img-msg--ok" style={{ marginTop: 10 }}>{backfillMsg}</p>}
        {backfillErr && <p className="img-msg img-msg--err" style={{ marginTop: 10 }}>{backfillErr}</p>}
      </div>

      {/* ── Search box ── */}
      <div className="img-search-wrap">
        <div className="img-search-row">
          <input
            className="inv-search"
            placeholder="🔍 Search by item # or product name…"
            value={query}
            onChange={e => { setQuery(e.target.value); setSelected(null); setPreview(null); runSearch(e.target.value); }}
            autoComplete="off"
          />
          {searching && <div className="mm-spinner img-spinner" />}
        </div>

        {results.length > 0 && (
          <ul className="img-results-list">
            {results.map(p => (
              <li key={p._id} className="img-result-item" onClick={() => selectProduct(p)}>
                <span className="img-result-emoji">{p.emoji}</span>
                <div className="img-result-info">
                  <span className="img-result-name">{p.name}</span>
                  <span className="img-result-meta">{p.brand} · Item # {p.itemNum || p.id}</span>
                </div>
                {p.imageUrl && <span className="img-result-has-img" title="Has image">🖼</span>}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── Upload panel ── */}
      {selected ? (
        <div className="img-panel">
          {/* Product info */}
          <div className="img-panel-product">
            <span className="img-panel-emoji">{selected.emoji}</span>
            <div>
              <p className="img-panel-name">{selected.name}</p>
              <p className="img-panel-meta">{selected.brand} · {selected.category} · Item # {selected.itemNum || selected.id}</p>
            </div>
          </div>

          {/* Preview area */}
          <div className="img-preview-area" onClick={() => fileRef.current?.click()}>
            {preview
              ? <img src={preview} alt="Product" className="img-preview-img" />
              : (
                <div className="img-preview-placeholder">
                  <span className="img-preview-icon">📷</span>
                  <p>Click to upload an image</p>
                  <p className="img-preview-sub">JPG, PNG, WebP — max 4 MB recommended</p>
                </div>
              )
            }
          </div>

          {/* Actions */}
          <div className="img-actions">
            <button className="inv-upload-btn" onClick={() => fileRef.current?.click()}>
              📂 Choose Image
            </button>
            <button
              className="img-save-btn"
              onClick={handleSave}
              disabled={saving || !preview || preview === selected.imageUrl}
            >
              {saving ? 'Saving…' : '💾 Save Image'}
            </button>
            {selected.imageUrl && (
              <button className="inv-clear-btn" onClick={handleRemove} disabled={saving}>
                🗑 Remove Image
              </button>
            )}
          </div>

          {saveOk  && <p className="img-msg img-msg--ok">Image saved successfully.</p>}
          {saveErr && <p className="img-msg img-msg--err">{saveErr}</p>}

          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
        </div>
      ) : (
        <div className="mm-stub" style={{ marginTop: 40 }}>
          <span className="mm-stub-icon">🖼</span>
          <h3>Select a product above</h3>
          <p>Search by item number or product name, then upload a photo.</p>
        </div>
      )}
    </div>
  );
}

function StubTab({ icon, title, description }) {
  return (
    <div className="mm-stub">
      <span className="mm-stub-icon">{icon}</span>
      <h3>{title}</h3>
      <p>{description}</p>
      <span className="mm-stub-badge">Coming Soon</span>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MarketplaceManager() {
  const { user, isAuthenticated, token } = useContext(AuthContext);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('cockpit');
  const [stats,     setStats]     = useState({});
  const [orders,    setOrders]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  // Auth guard
  useEffect(() => {
    if (!isAuthenticated())       { navigate('/login');      return; }
    if (!user?.isSuperAdmin)      { navigate('/');           return; }
  }, [isAuthenticated, user, navigate]);

  const loadData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [statsRes, ordersRes] = await Promise.all([
        fetch(`${API_URL}/api/marketplace-orders/stats`,  { headers }),
        fetch(`${API_URL}/api/marketplace-orders`,        { headers }),
      ]);
      const statsData  = await statsRes.json();
      const ordersData = await ordersRes.json();
      if (statsData.success)  setStats(statsData.stats);
      if (ordersData.success) setOrders(ordersData.orders);
    } catch {
      setError('Could not load marketplace data. Is the server running?');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const res = await fetch(`${API_URL}/api/marketplace-orders/${orderId}/status`, {
        method:  'PATCH',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setOrders((prev) =>
          prev.map((o) => (o._id === orderId ? data.order : o))
        );
        // Refresh stats after a status change
        const statsRes  = await fetch(`${API_URL}/api/marketplace-orders/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const statsData = await statsRes.json();
        if (statsData.success) setStats(statsData.stats);
      }
    } catch {
      console.error('Failed to update order status');
    }
  };

  const TABS = [
    { id: 'cockpit',       label: '🏠 Cockpit'          },
    { id: 'orders',        label: '📦 Orders'           },
    { id: 'customers',     label: '👥 Customers'        },
    { id: 'subscriptions', label: '🔄 Subscriptions'    },
    { id: 'inventory',     label: '🏪 Inventory'        },
    { id: 'images',        label: '🖼 Images'           },
    { id: 'payments',      label: '💳 Payments'         },
    { id: 'vendors',       label: '🤝 Vendors'          },
  ];

  return (
    <div className="mm-page">
      {/* ── Header ── */}
      <div className="mm-header">
        <div className="mm-header-left">
          <button className="mm-back-btn" onClick={() => navigate('/superadmin')}>
            ← Back to Super Admin
          </button>
          <div>
            <h1 className="mm-title">Marketplace Manager</h1>
            <p className="mm-subtitle">Ssaye Grocery Club — Order & Operations Portal</p>
          </div>
        </div>
        <button className="mm-refresh-btn" onClick={loadData} title="Refresh data">
          🔄 Refresh
        </button>
      </div>

      {/* ── Tabs ── */}
      <div className="mm-tabs-bar">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`mm-tab-btn ${activeTab === t.id ? 'mm-tab-btn--active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div className="mm-content">
        {loading ? (
          <div className="mm-loading">
            <div className="mm-spinner" />
            <p>Loading marketplace data…</p>
          </div>
        ) : error ? (
          <div className="mm-error">
            <span>⚠️</span>
            <p>{error}</p>
            <button onClick={loadData}>Try Again</button>
          </div>
        ) : (
          <>
            {activeTab === 'cockpit' && (
              <CockpitTab
                stats={stats}
                orders={orders}
                onStatusChange={handleStatusChange}
              />
            )}
            {activeTab === 'orders' && (
              <div className="mm-orders-tab">
                <div className="mm-tab-heading">
                  <h2>All Orders</h2>
                  <p>{orders.length} total order{orders.length !== 1 ? 's' : ''}</p>
                </div>
                <OrdersTable orders={orders} onStatusChange={handleStatusChange} />
              </div>
            )}
            {activeTab === 'customers' && (
              <div className="mm-orders-tab">
                <div className="mm-tab-heading">
                  <h2>Customers</h2>
                  <p>{stats.uniqueCustomers ?? 0} unique customer{stats.uniqueCustomers !== 1 ? 's' : ''}</p>
                </div>
                <CustomersTab orders={orders} />
              </div>
            )}
            {activeTab === 'subscriptions' && (
              <SubscriptionsTab token={token} />
            )}
            {activeTab === 'inventory' && (
              <InventoryTab token={token} />
            )}
            {activeTab === 'images' && (
              <ImagesTab token={token} />
            )}
            {activeTab === 'payments' && (
              <StubTab
                icon="💳"
                title="Payments & Billing"
                description="View transaction history, process refunds, and manage payment gateway settings."
              />
            )}
            {activeTab === 'vendors' && (
              <StubTab
                icon="🤝"
                title="Vendor Management"
                description="Manage your supplier relationships, purchase orders, and vendor performance."
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
