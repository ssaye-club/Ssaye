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
    { id: 'cockpit',   label: '🏠 Cockpit'    },
    { id: 'orders',    label: '📦 Orders'     },
    { id: 'customers', label: '👥 Customers'  },
    { id: 'inventory', label: '🏪 Inventory'  },
    { id: 'payments',  label: '💳 Payments'   },
    { id: 'vendors',   label: '🤝 Vendors'    },
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
            {activeTab === 'inventory' && (
              <StubTab
                icon="🏪"
                title="Inventory Management"
                description="Track stock levels, reorder points, and product availability across your warehouse."
              />
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
