import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './MarketplaceManager.css';
import '../components/CrmBot.css';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const API_URL = process.env.REACT_APP_API_URL || '';

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
        <code>ItemNum, ItemName, In_Stock, Price[, Vendor]</code>
        <span className="inv-csv-guide-note">Categories are auto-detected. Vendor column is optional.</span>
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

// ─── Vendors Tab ──────────────────────────────────────────────────────────────
const VENDOR_STOCK_COLORS = { 'In Stock': '#10b981', 'Low': '#f59e0b', 'Out of Stock': '#ef4444' };

function VendorProductsPanel({ token, vendor, onClose, onOrderAll }) {
  const [products,  setProducts]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [page,      setPage]      = useState(1);
  const [pages,     setPages]     = useState(1);
  const [total,     setTotal]     = useState(0);
  const [search,    setSearch]    = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterStk, setFilterStk] = useState('');
  const [cart,      setCart]      = useState({});
  const searchTimer = React.useRef(null);
  const PAGE_SIZE   = 50;

  const fetchProducts = useCallback(async (p, s, cat, stk) => {
    if (!token || !vendor) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: PAGE_SIZE });
      if (s)   params.set('search',   s);
      if (cat) params.set('category', cat);
      if (stk) params.set('stock',    stk);
      const r = await fetch(
        `${API_URL}/api/inventory/vendors/${encodeURIComponent(vendor.name)}/products?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const d = await r.json();
      if (d.success) { setProducts(d.products); setTotal(d.total); setPages(d.pages); }
    } catch {}
    finally { setLoading(false); }
  }, [token, vendor]);

  useEffect(() => { setPage(1); setCart({}); fetchProducts(1, '', '', ''); }, [fetchProducts]);

  const handleSearch = (val) => {
    setSearch(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setPage(1); fetchProducts(1, val, filterCat, filterStk); }, 350);
  };

  const applyFilter = (cat, stk) => {
    setFilterCat(cat); setFilterStk(stk); setPage(1);
    fetchProducts(1, search, cat, stk);
  };

  const goToPage = (p) => { setPage(p); fetchProducts(p, search, filterCat, filterStk); };

  const cartItems = products.filter(p => cart[p.id] > 0);
  const cartTotal = cartItems.reduce((sum, p) => sum + p.price * (cart[p.id] || 0), 0);

  const categories = ['', ...Array.from(new Set(vendor.categories || [])).sort()];
  const pageNums = [];
  for (let i = Math.max(1, page - 2); i <= Math.min(pages, page + 2); i++) pageNums.push(i);

  return (
    <div className="vnd-panel">
      <div className="vnd-panel-header">
        <div className="vnd-panel-title-row">
          <button className="vnd-back-btn" onClick={onClose}>← Back to Vendors</button>
          <h2 className="vnd-panel-name">{vendor.name}</h2>
          <div className="vnd-panel-meta">
            <span className="vnd-panel-count">{total.toLocaleString()} product{total !== 1 ? 's' : ''}</span>
            {vendor.categories?.length > 0 && (
              <div className="vnd-panel-cats">
                {vendor.categories.map(c => <span key={c} className="mm-category-chip">{c}</span>)}
              </div>
            )}
          </div>
        </div>

        {/* Cart summary */}
        {cartItems.length > 0 && (
          <div className="vnd-cart-bar">
            <span className="vnd-cart-summary">
              🛒 {cartItems.length} product{cartItems.length !== 1 ? 's' : ''} selected
              &nbsp;·&nbsp; <strong>${cartTotal.toFixed(2)}</strong>
            </span>
            <button className="vnd-order-btn" onClick={() => onOrderAll(vendor.name, cartItems.map(p => ({ ...p, quantity: cart[p.id] })))}>
              Place Vendor Order
            </button>
            <button className="vnd-clear-btn" onClick={() => setCart({})}>Clear</button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="inv-filters">
        <input
          className="inv-search"
          placeholder="🔍 Search products…"
          value={search}
          onChange={e => handleSearch(e.target.value)}
        />
        <select className="mm-status-select" value={filterCat} onChange={e => applyFilter(e.target.value, filterStk)}>
          <option value="">All Categories</option>
          {categories.filter(Boolean).map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="mm-status-select" value={filterStk} onChange={e => applyFilter(filterCat, e.target.value)}>
          <option value="">All Stock</option>
          <option>In Stock</option>
          <option>Low</option>
          <option>Out of Stock</option>
        </select>
      </div>

      <div className="mm-sub-table-wrap" style={{ opacity: loading ? 0.5 : 1, transition: 'opacity 0.15s' }}>
        <table className="mm-table">
          <thead>
            <tr>
              <th>Item #</th>
              <th>Product</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Qty</th>
            </tr>
          </thead>
          <tbody>
            {loading && products.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Loading…</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>No products match your filters.</td></tr>
            ) : products.map(p => (
              <tr key={p.id} className={cart[p.id] > 0 ? 'vnd-row--selected' : ''}>
                <td><span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#94a3b8' }}>{p.itemNum || p.id}</span></td>
                <td>
                  <div className="mm-product-cell">
                    {p.imageUrl
                      ? <img src={p.imageUrl} alt="" className="vnd-thumb" />
                      : <span>{p.emoji}</span>
                    }
                    <div>
                      <div className="mm-product-name">{p.name}</div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{p.brand}</div>
                    </div>
                  </div>
                </td>
                <td><span className="mm-category-chip">{p.category}</span></td>
                <td><strong>${p.price.toFixed(2)}</strong></td>
                <td>
                  <span className="mm-status-badge" style={{
                    background: (VENDOR_STOCK_COLORS[p.stock] || '#6b7280') + '22',
                    color: VENDOR_STOCK_COLORS[p.stock] || '#6b7280',
                    borderColor: (VENDOR_STOCK_COLORS[p.stock] || '#6b7280') + '55',
                  }}>{p.stock}</span>
                </td>
                <td>
                  <div className="vnd-qty-row">
                    <button
                      className="vnd-qty-btn"
                      onClick={() => setCart(prev => ({ ...prev, [p.id]: Math.max(0, (prev[p.id] || 0) - 1) }))}
                      disabled={(cart[p.id] || 0) === 0}
                    >−</button>
                    <span className="vnd-qty-val">{cart[p.id] || 0}</span>
                    <button
                      className="vnd-qty-btn"
                      onClick={() => setCart(prev => ({ ...prev, [p.id]: (prev[p.id] || 0) + 1 }))}
                    >+</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="inv-pagination">
          <button className="inv-page-btn" onClick={() => goToPage(page - 1)} disabled={page === 1}>‹</button>
          {page > 3 && <><button className="inv-page-btn" onClick={() => goToPage(1)}>1</button><span className="inv-page-ellipsis">…</span></>}
          {pageNums.map(n => (
            <button key={n} className={`inv-page-btn ${n === page ? 'inv-page-btn--active' : ''}`} onClick={() => goToPage(n)}>{n}</button>
          ))}
          {page < pages - 2 && <><span className="inv-page-ellipsis">…</span><button className="inv-page-btn" onClick={() => goToPage(pages)}>{pages}</button></>}
          <button className="inv-page-btn" onClick={() => goToPage(page + 1)} disabled={page === pages}>›</button>
          <span className="inv-page-info">Page {page} of {pages} · {total.toLocaleString()} products</span>
        </div>
      )}
    </div>
  );
}

function VendorsTab({ token }) {
  const [vendors,        setVendors]        = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState(null);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [orderSuccess,   setOrderSuccess]   = useState(null);
  const [orderError,     setOrderError]     = useState(null);
  const [ordering,       setOrdering]       = useState(false);
  const [search,         setSearch]         = useState('');

  const fetchVendors = useCallback(async () => {
    if (!token) return;
    setLoading(true); setError(null);
    try {
      const r = await fetch(`${API_URL}/api/inventory/vendors`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await r.json();
      if (d.success) setVendors(d.vendors);
      else setError('Failed to load vendors.');
    } catch { setError('Could not reach the server.'); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchVendors(); }, [fetchVendors]);

  const handleOrderAll = async (vendorName, items) => {
    setOrdering(true); setOrderSuccess(null); setOrderError(null);
    try {
      const res = await fetch(`${API_URL}/api/marketplace-orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          items: items.map(p => ({ productId: p._id || p.id, quantity: p.quantity })),
          vendorOrder: vendorName,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setOrderSuccess(`Order ${data.order.orderNumber} placed successfully for ${vendorName}!`);
        setSelectedVendor(null);
      } else {
        setOrderError(data.message || 'Failed to place order.');
      }
    } catch { setOrderError('Could not reach the server.'); }
    finally { setOrdering(false); }
  };

  const filtered = vendors.filter(v =>
    !search || v.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="mm-loading"><div className="mm-spinner" /><p>Loading vendors…</p></div>;
  if (error)   return <div className="mm-error"><span>⚠️</span><p>{error}</p></div>;

  if (selectedVendor) {
    return (
      <VendorProductsPanel
        token={token}
        vendor={selectedVendor}
        onClose={() => setSelectedVendor(null)}
        onOrderAll={handleOrderAll}
      />
    );
  }

  return (
    <div className="mm-orders-tab">
      <div className="mm-tab-heading">
        <div>
          <h2>Vendors</h2>
          <p>{vendors.length} vendor{vendors.length !== 1 ? 's' : ''} in inventory</p>
        </div>
        <button className="mm-refresh-btn" onClick={fetchVendors}>🔄 Refresh</button>
      </div>

      {orderSuccess && (
        <div className="inv-import-banner inv-import-banner--success" style={{ marginBottom: 16 }}>
          ✅ {orderSuccess}
          <button className="inv-banner-close" onClick={() => setOrderSuccess(null)}>✕</button>
        </div>
      )}
      {orderError && (
        <div className="inv-import-banner inv-import-banner--error" style={{ marginBottom: 16 }}>
          ⚠️ {orderError}
          <button className="inv-banner-close" onClick={() => setOrderError(null)}>✕</button>
        </div>
      )}
      {ordering && (
        <div className="mm-loading" style={{ padding: '12px 0' }}>
          <div className="mm-spinner" /><p>Placing order…</p>
        </div>
      )}

      {vendors.length === 0 ? (
        <div className="mm-stub">
          <span className="mm-stub-icon">🤝</span>
          <h3>No vendors yet</h3>
          <p>Import a CSV with a Vendor column to populate this tab.</p>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 16 }}>
            <input
              className="inv-search"
              placeholder="🔍 Search vendors…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ maxWidth: 320 }}
            />
          </div>
          <div className="vnd-grid">
            {filtered.map(v => (
              <div key={v.name} className="vnd-card" onClick={() => setSelectedVendor(v)}>
                <div className="vnd-card-header">
                  <span className="vnd-card-icon">🤝</span>
                  <h3 className="vnd-card-name">{v.name}</h3>
                </div>
                <div className="vnd-card-stats">
                  <span className="vnd-stat"><strong>{v.productCount.toLocaleString()}</strong> products</span>
                  <span className="vnd-stat vnd-stat--green">{v.inStock} in stock</span>
                  {v.lowStock > 0    && <span className="vnd-stat vnd-stat--amber">{v.lowStock} low</span>}
                  {v.outOfStock > 0  && <span className="vnd-stat vnd-stat--red">{v.outOfStock} out</span>}
                </div>
                {v.categories?.length > 0 && (
                  <div className="vnd-card-cats">
                    {v.categories.slice(0, 4).map(c => <span key={c} className="mm-category-chip">{c}</span>)}
                    {v.categories.length > 4 && <span className="mm-category-chip">+{v.categories.length - 4} more</span>}
                  </div>
                )}
                <button className="vnd-view-btn">View Products →</button>
              </div>
            ))}
          </div>
        </>
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

// ─── Stock Alerts Tab ─────────────────────────────────────────────────────────
function AlertsTab({ token }) {
  const [products,      setProducts]      = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [lastUpdated,   setLastUpdated]   = useState(null);
  const [categoryFilter,setCategoryFilter]= useState('all');
  const [statusFilter,  setStatusFilter]  = useState('all');
  const [search,        setSearch]        = useState('');

  const fetchInventory = async () => {
    if (!token) return;
    setAlertsLoading(true);
    try {
      let all = [], page = 1, pages = 1;
      while (page <= pages) {
        const res = await fetch(`${API_URL}/api/inventory?limit=100&page=${page}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          all   = all.concat(data.products || []);
          pages = data.pages || 1;
        }
        page++;
      }
      setProducts(all);
      setLastUpdated(new Date());
    } catch (e) {
      console.error('Failed to fetch inventory for alerts', e);
    } finally {
      setAlertsLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
    const id = setInterval(fetchInventory, 60000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const outOfStock = products.filter(p => p.stock === 'Out of Stock');
  const lowStock   = products.filter(p => p.stock === 'Low');
  const inStock    = products.filter(p => p.stock === 'In Stock');

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category).filter(Boolean))).sort()];

  const filtered = products.filter(p => {
    if (statusFilter !== 'all' && p.stock !== statusFilter) return false;
    if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
    if (search && !p.name?.toLowerCase().includes(search.toLowerCase()) &&
        !p.brand?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const ALERT_COLORS = { 'Out of Stock': '#ef4444', 'Low': '#f59e0b', 'In Stock': '#10b981' };

  return (
    <div className="mm-orders-tab">
      <div className="mm-tab-heading">
        <div>
          <h2>Stock Alerts</h2>
          <p>{alertsLoading ? 'Refreshing…' : lastUpdated ? `Last updated ${lastUpdated.toLocaleTimeString()}` : 'Loading…'}</p>
        </div>
        <button className="mm-refresh-btn" onClick={fetchInventory} disabled={alertsLoading}>
          🔄 Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="mm-stats-grid" style={{ marginBottom: 24 }}>
        <div className="mm-stat-card mm-stat-card--red">
          <div className="mm-stat-icon">🚨</div>
          <div className="mm-stat-body">
            <p className="mm-stat-label">Out of Stock</p>
            <p className="mm-stat-value">{outOfStock.length}</p>
          </div>
        </div>
        <div className="mm-stat-card mm-stat-card--amber">
          <div className="mm-stat-icon">⚠️</div>
          <div className="mm-stat-body">
            <p className="mm-stat-label">Low Stock</p>
            <p className="mm-stat-value">{lowStock.length}</p>
          </div>
        </div>
        <div className="mm-stat-card mm-stat-card--green">
          <div className="mm-stat-icon">✅</div>
          <div className="mm-stat-body">
            <p className="mm-stat-label">In Stock</p>
            <p className="mm-stat-value">{inStock.length}</p>
          </div>
        </div>
        <div className="mm-stat-card mm-stat-card--blue">
          <div className="mm-stat-icon">📦</div>
          <div className="mm-stat-body">
            <p className="mm-stat-label">Total Products</p>
            <p className="mm-stat-value">{products.length}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="inv-filters">
        <input
          className="inv-search"
          placeholder="🔍 Search by name or brand…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="mm-status-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">All Stock Status</option>
          <option value="Out of Stock">Out of Stock</option>
          <option value="Low">Low</option>
          <option value="In Stock">In Stock</option>
        </select>
        <select className="mm-status-select" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
          {categories.map(c => <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="mm-sub-table-wrap">
        <table className="mm-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Brand</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                {alertsLoading ? 'Loading…' : 'No products match your filters.'}
              </td></tr>
            ) : filtered.map(p => (
              <tr key={p._id || p.id}>
                <td>
                  <div className="mm-product-cell">
                    <span>{p.emoji}</span>
                    <div className="mm-product-name">{p.name}</div>
                  </div>
                </td>
                <td style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{p.brand}</td>
                <td><span className="mm-category-chip">{p.category}</span></td>
                <td><strong>${p.price?.toFixed(2)}</strong></td>
                <td>
                  <span className="mm-status-badge" style={{
                    background: (ALERT_COLORS[p.stock] || '#6b7280') + '22',
                    color: ALERT_COLORS[p.stock] || '#6b7280',
                    borderColor: (ALERT_COLORS[p.stock] || '#6b7280') + '55',
                  }}>
                    {p.stock}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── CRM Intelligence Tab ────────────────────────────────────────────────────
function fmt$(n) { return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtN(n) { return Number(n).toLocaleString('en-US'); }

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

function TrendPill({ pct }) {
  const up = pct >= 0;
  return (
    <span className="crm-trend-pill" style={{ background: up ? '#d1fae5' : '#fee2e2', color: up ? '#065f46' : '#991b1b' }}>
      {up ? '▲' : '▼'} {Math.abs(pct)}%
    </span>
  );
}

const CRM_CAT_COLORS   = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6'];
const CRM_BRAND_COLORS = ['#f97316','#06b6d4','#84cc16','#e11d48','#7c3aed','#0ea5e9','#d97706','#059669'];
const CRM_SUGGESTIONS  = [
  'What should I order this week?',
  'Which products will run out of stock soonest?',
  'Which category has the most growth opportunity?',
  'What products are wishlisted but not purchased?',
  'How can we reduce lapsed customers?',
];

function CrmTab({ token }) {
  const [activeTab,   setActiveTab]   = useState('dashboard');
  const [crmData,     setCrmData]     = useState(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError,   setDataError]   = useState(null);
  const [predData,    setPredData]    = useState(null);
  const [predLoading, setPredLoading] = useState(false);
  const [predError,   setPredError]   = useState(null);
  const [messages,    setMessages]    = useState([
    { role: 'assistant', content: 'Hi! I\'m your CRM analyst. Ask me anything about your customers, sales trends, top products, or how to grow revenue.' }
  ]);
  const [input,       setInput]       = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const loadData = useCallback(async () => {
    if (!token) return;
    setDataLoading(true); setDataError(null);
    try {
      const r = await fetch(`${API_URL}/api/admin/crm-insights`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (d.success) setCrmData(d.data);
      else setDataError(d.message || 'Failed to load CRM data.');
    } catch { setDataError('Could not reach the server.'); }
    finally { setDataLoading(false); }
  }, [token]);

  const loadPredictions = useCallback(async () => {
    if (!token) return;
    setPredLoading(true); setPredError(null);
    try {
      const r = await fetch(`${API_URL}/api/admin/crm-predictions`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (d.success) setPredData(d.data);
      else setPredError(d.message || 'Failed to load predictions.');
    } catch { setPredError('Could not reach the server.'); }
    finally { setPredLoading(false); }
  }, [token]);

  useEffect(() => { if (!crmData) loadData(); }, [crmData, loadData]);
  useEffect(() => { if (activeTab === 'predictions' && !predData) loadPredictions(); }, [activeTab, predData, loadPredictions]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

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
      setMessages(prev => [...prev, { role: 'assistant', content: d.success ? d.response : (d.message || 'Something went wrong.') }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Could not reach the server.' }]);
    } finally { setChatLoading(false); }
  };

  const handleKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

  const maxCat   = crmData?.topCategories?.[0]?.count || 1;
  const maxBrand = crmData?.topBrands?.[0]?.count     || 1;

  return (
    <div className="mm-orders-tab crm-tab-page">
      {/* ── Sub-tab bar ── */}
      <div className="crm-subtab-bar">
        <div className="crm-subtab-left">
          <button className={`crm-subtab-btn ${activeTab === 'dashboard'   ? 'crm-subtab-btn--active' : ''}`} onClick={() => setActiveTab('dashboard')}>📈 Dashboard</button>
          <button className={`crm-subtab-btn ${activeTab === 'predictions' ? 'crm-subtab-btn--active' : ''}`} onClick={() => setActiveTab('predictions')}>🔮 Predictions</button>
          <button className={`crm-subtab-btn ${activeTab === 'chat'        ? 'crm-subtab-btn--active' : ''}`} onClick={() => setActiveTab('chat')}>🤖 Ask AI</button>
        </div>
        <button
          className="crm-subtab-refresh"
          onClick={() => { loadData(); loadPredictions(); }}
          disabled={dataLoading || predLoading}
          title="Refresh CRM data"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" className={dataLoading || predLoading ? 'crm-spin' : ''}>
            <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
          Refresh
        </button>
      </div>

      {/* ── Dashboard ── */}
      {activeTab === 'dashboard' && (
        <div className="crm-tab-body">
          {dataLoading && !crmData && (
            <div className="crm-loading"><div className="crm-spinner" /><p>Loading CRM data…</p></div>
          )}
          {dataError && (
            <div className="crm-error"><span>⚠️</span><p>{dataError}</p><button onClick={loadData}>Retry</button></div>
          )}
          {crmData && (
            <>
              <div className="crm-kpi-grid">
                <KpiCard icon="📦" label="Avg Orders / Customer" value={crmData.overview.avgOrdersPerCustomer}     accent="#6366f1" sub={`${fmtN(crmData.overview.totalOrders)} total orders`} />
                <KpiCard icon="💰" label="Avg Spend / Customer"  value={fmt$(crmData.overview.avgSpendPerCustomer)} accent="#10b981" sub={`${fmt$(crmData.overview.totalRevenue)} lifetime revenue`} />
                <KpiCard icon="🔁" label="Repeat Purchase Rate"  value={`${crmData.overview.repeatRate}%`}         accent="#f59e0b" sub={`${fmtN(crmData.overview.repeatCustomers)} repeat buyers`} />
                <KpiCard icon="⭐" label="High-Value Customers"  value={fmtN(crmData.overview.highValueCustomers)} accent="#ec4899" sub="Top 20% by lifetime spend" />
                <KpiCard icon="😴" label="Lapsed Customers"      value={fmtN(crmData.overview.lapsedCustomers)}    accent="#ef4444" sub="No order in 60+ days" />
                <KpiCard icon="🔄" label="Active Subscriptions"  value={fmtN(crmData.overview.activeSubscriptions)}accent="#8b5cf6" sub="Subscribe & Save members" />
              </div>
              {crmData.topCategories.length > 0 && (
                <div className="crm-section">
                  <h3 className="crm-section-title">🏷️ Top Categories by Units Sold</h3>
                  <div className="crm-bars">
                    {crmData.topCategories.map((c, i) => <BarRow key={c.name} label={c.name} count={c.count} max={maxCat} color={CRM_CAT_COLORS[i % CRM_CAT_COLORS.length]} />)}
                  </div>
                </div>
              )}
              {crmData.topBrands.length > 0 && (
                <div className="crm-section">
                  <h3 className="crm-section-title">⭐ Top Brands by Units Sold</h3>
                  <div className="crm-bars">
                    {crmData.topBrands.map((b, i) => <BarRow key={b.name} label={b.name} count={b.count} max={maxBrand} color={CRM_BRAND_COLORS[i % CRM_BRAND_COLORS.length]} />)}
                  </div>
                </div>
              )}
              {crmData.topSearches.length > 0 && (
                <div className="crm-section">
                  <h3 className="crm-section-title">🔍 Top Search Terms</h3>
                  <div className="crm-tags">
                    {crmData.topSearches.map((s, i) => (
                      <span key={s.term} className="crm-tag" style={{ opacity: 1 - i * 0.07 }}>{s.term} <strong>{s.count}</strong></span>
                    ))}
                  </div>
                </div>
              )}
              {crmData.topWishlisted.length > 0 && (
                <div className="crm-section">
                  <h3 className="crm-section-title">❤️ Most Wishlisted Products</h3>
                  <div className="crm-wish-list">
                    {crmData.topWishlisted.map((w, i) => (
                      <div key={w.name} className="crm-wish-row">
                        <span className="crm-wish-rank">#{i + 1}</span>
                        <div className="crm-wish-info"><span className="crm-wish-name">{w.name}</span>{w.category && <span className="crm-wish-cat">{w.category}</span>}</div>
                        <span className="crm-wish-count">{w.count} saves</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {crmData.topProducts.length > 0 && (
                <div className="crm-section">
                  <h3 className="crm-section-title">📦 Best-Selling Products</h3>
                  <div className="crm-wish-list">
                    {crmData.topProducts.map((p, i) => (
                      <div key={p.name} className="crm-wish-row">
                        <span className="crm-wish-rank">#{i + 1}</span>
                        <div className="crm-wish-info"><span className="crm-wish-name">{p.name}</span>{p.brand && <span className="crm-wish-cat">{p.brand} · {p.category}</span>}</div>
                        <span className="crm-wish-count">{p.count} sold</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {crmData.topCategories.length === 0 && crmData.topBrands.length === 0 && (
                <div className="crm-empty"><span>📭</span><p>No order data yet. CRM insights will populate once customers start purchasing.</p></div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Predictions ── */}
      {activeTab === 'predictions' && (
        <div className="crm-tab-body">
          {predLoading && !predData && (
            <div className="crm-loading"><div className="crm-spinner" /><p>Analysing stock & velocity…</p></div>
          )}
          {predError && (
            <div className="crm-error"><span>⚠️</span><p>{predError}</p><button onClick={loadPredictions}>Retry</button></div>
          )}
          {predData && (
            <>
              {(predData.meta.outOfStockCount > 0 || predData.meta.lowStockCount > 0) && (
                <div className="crm-alert-bar">
                  {predData.meta.outOfStockCount > 0 && <span className="crm-alert-chip crm-alert-chip--red">🚨 {predData.meta.outOfStockCount} out of stock</span>}
                  {predData.meta.lowStockCount   > 0 && <span className="crm-alert-chip crm-alert-chip--amber">⚠️ {predData.meta.lowStockCount} low stock</span>}
                  {predData.meta.activeSubCount  > 0 && <span className="crm-alert-chip crm-alert-chip--blue">🔄 {predData.meta.activeSubCount} active subscriptions</span>}
                </div>
              )}
              <div className="crm-section">
                <h3 className="crm-section-title">🛒 Reorder Now — Priority List</h3>
                {predData.urgentReorders.length === 0 ? (
                  <div className="crm-pred-empty"><span>✅</span><p>All selling products are currently in stock.</p></div>
                ) : (
                  <div className="crm-reorder-list">
                    {predData.urgentReorders.map((p, i) => (
                      <div key={i} className={`crm-reorder-card crm-reorder-card--${p.urgency}`}>
                        <div className="crm-reorder-top"><UrgencyBadge urgency={p.urgency} /><TrendPill pct={p.trendPct} /></div>
                        <p className="crm-reorder-name">{p.name}</p>
                        <p className="crm-reorder-meta">{p.brand} · {p.category}</p>
                        <div className="crm-reorder-stats">
                          <div className="crm-reorder-stat"><span className="crm-reorder-stat-label">Velocity</span><span className="crm-reorder-stat-val">{p.weeklyVelocity} / wk</span></div>
                          <div className="crm-reorder-stat"><span className="crm-reorder-stat-label">Suggest</span><span className="crm-reorder-stat-val crm-reorder-qty">{p.suggestedQty} units</span></div>
                        </div>
                        {p.vendor && p.vendor !== 'Unknown vendor' && <p className="crm-reorder-vendor">🤝 {p.vendor}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {predData.trending.length > 0 && (
                <div className="crm-section">
                  <h3 className="crm-section-title">🚀 Trending — Stock Up Before They Spike</h3>
                  <div className="crm-wish-list">
                    {predData.trending.map((p, i) => (
                      <div key={i} className="crm-wish-row">
                        <span className="crm-wish-rank">#{i + 1}</span>
                        <div className="crm-wish-info"><span className="crm-wish-name">{p.name}</span><span className="crm-wish-cat">{p.brand} · {p.category}</span></div>
                        <TrendPill pct={p.trendPct} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {predData.subscriptionForecast.length > 0 && (
                <div className="crm-section">
                  <h3 className="crm-section-title">🔄 Subscription Demand — Next 30 Days</h3>
                  <p className="crm-section-sub">Guaranteed units needed to fulfil active subscriptions</p>
                  <div className="crm-wish-list">
                    {predData.subscriptionForecast.map((s, i) => (
                      <div key={i} className="crm-wish-row">
                        <span className="crm-wish-rank">#{i + 1}</span>
                        <div className="crm-wish-info"><span className="crm-wish-name">{s.name}</span><span className="crm-wish-cat">{s.subscriberCount} subscriber{s.subscriberCount !== 1 ? 's' : ''}</span></div>
                        <span className="crm-wish-count">{s.forecastedUnits} units</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {predData.wishlistGap.length > 0 && (
                <div className="crm-section">
                  <h3 className="crm-section-title">❤️ High Intent, Low Conversion</h3>
                  <p className="crm-section-sub">Wishlisted heavily but purchased rarely — prime promotion targets</p>
                  <div className="crm-wish-list">
                    {predData.wishlistGap.map((w, i) => (
                      <div key={i} className="crm-wish-row">
                        <span className="crm-wish-rank">#{i + 1}</span>
                        <div className="crm-wish-info"><span className="crm-wish-name">{w.name}</span><span className="crm-wish-cat">{w.category}</span></div>
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
                <div className="crm-empty"><span>📊</span><p>Place some orders to start generating predictive insights.</p></div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Ask AI ── */}
      {activeTab === 'chat' && (
        <div className="crm-tab-body crm-tab-chat">
          {messages.length === 1 && (
            <div className="crm-suggestions">
              <p className="crm-suggestions-label">Try asking:</p>
              {CRM_SUGGESTIONS.map(q => (
                <button key={q} className="crm-suggestion-chip" onClick={() => setInput(q)}>{q}</button>
              ))}
            </div>
          )}
          <div className="crm-messages crm-messages--inline">
            {messages.map((m, i) => (
              <div key={i} className={`crm-msg crm-msg--${m.role}`}>
                {m.role === 'assistant' && <span className="crm-msg-avatar">🤖</span>}
                <div className="crm-msg-bubble">
                  {m.content.split('\n').map((line, li) => (
                    <p key={li} style={{ margin: li === 0 ? 0 : '6px 0 0' }}><AiText text={line} /></p>
                  ))}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="crm-msg crm-msg--assistant">
                <span className="crm-msg-avatar">🤖</span>
                <div className="crm-msg-bubble crm-msg-bubble--typing"><span /><span /><span /></div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="crm-input-row crm-input-row--inline">
            <textarea
              className="crm-input"
              placeholder="Ask about customers, sales trends, categories…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              rows={1}
              disabled={chatLoading}
            />
            <button className="crm-send-btn" onClick={sendMessage} disabled={!input.trim() || chatLoading} title="Send">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
            </button>
          </div>
        </div>
      )}
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
    { id: 'alerts',        label: '🔔 Stock Alerts'     },
    { id: 'vendors',       label: '🤝 Vendors'             },
    { id: 'images',        label: '🖼 Images'           },
    { id: 'payments',      label: '💳 Payments'         },
    { id: 'crm',           label: '📊 CRM Intelligence' },
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
            className={`mm-tab-btn ${activeTab === t.id ? 'mm-tab-btn--active' : ''} ${t.comingSoon ? 'mm-tab-btn--coming-soon' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
            {t.comingSoon && <span className="mm-tab-coming-soon">Coming Soon</span>}
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
            {activeTab === 'alerts' && (
              <AlertsTab token={token} />
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
              <VendorsTab token={token} />
            )}
            {activeTab === 'crm' && (
              <CrmTab token={token} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
