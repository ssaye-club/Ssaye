import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './MyOrders.css';

const API_URL = process.env.REACT_APP_API_URL || '';

const STATUS_STEPS = ['pending', 'in-transit', 'delivered'];

const STATUS_META = {
  pending:    { label: 'Pending',    icon: '🕐', color: '#f59e0b', bg: '#fef3c7' },
  'in-transit': { label: 'In Transit', icon: '🚚', color: '#3b82f6', bg: '#dbeafe' },
  delivered:  { label: 'Delivered',  icon: '✅', color: '#10b981', bg: '#d1fae5' },
  cancelled:  { label: 'Cancelled',  icon: '✕',  color: '#ef4444', bg: '#fee2e2' },
  refunded:   { label: 'Refunded',   icon: '↩',  color: '#8b5cf6', bg: '#ede9fe' },
};

function StatusStepper({ status }) {
  const isTerminal = status === 'cancelled' || status === 'refunded';
  const meta = STATUS_META[status] || STATUS_META.pending;

  if (isTerminal) {
    return (
      <div className="mo-terminal-status" style={{ background: meta.bg, color: meta.color }}>
        <span>{meta.icon}</span>
        <span>{meta.label}</span>
      </div>
    );
  }

  const currentIdx = STATUS_STEPS.indexOf(status);

  return (
    <div className="mo-stepper">
      {STATUS_STEPS.map((step, idx) => {
        const m       = STATUS_META[step];
        const done    = idx < currentIdx;
        const active  = idx === currentIdx;
        return (
          <React.Fragment key={step}>
            <div className={`mo-step ${done ? 'mo-step--done' : ''} ${active ? 'mo-step--active' : ''}`}>
              <div className="mo-step-circle" style={active ? { background: m.color, borderColor: m.color } : done ? { background: '#10b981', borderColor: '#10b981' } : {}}>
                {done ? '✓' : m.icon}
              </div>
              <span className="mo-step-label" style={active ? { color: m.color, fontWeight: 700 } : {}}>{m.label}</span>
            </div>
            {idx < STATUS_STEPS.length - 1 && (
              <div className={`mo-step-line ${done || active ? 'mo-step-line--done' : ''}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function OrderCard({ order }) {
  const [expanded, setExpanded] = useState(false);
  const meta = STATUS_META[order.status] || STATUS_META.pending;
  const date = new Date(order.createdAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
  const updatedDate = new Date(order.updatedAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  const totalSaved = (order.premiumDiscount || 0) + (order.couponDiscount || 0);

  return (
    <div className="mo-card">
      {/* ── Card header ── */}
      <div className="mo-card-header">
        <div className="mo-card-meta">
          <span className="mo-order-number">Order #{order.orderNumber}</span>
          <span className="mo-order-date">{date}</span>
        </div>
        <span className="mo-status-pill" style={{ background: meta.bg, color: meta.color }}>
          {meta.icon} {meta.label}
        </span>
      </div>

      {/* ── Status stepper ── */}
      <div className="mo-stepper-wrap">
        <StatusStepper status={order.status} />
        <p className="mo-updated">Last updated: {updatedDate}</p>
      </div>

      {/* ── Price summary ── */}
      <div className="mo-price-row">
        <div className="mo-price-breakdown">
          <span className="mo-subtotal">Subtotal: ${order.subtotal?.toFixed(2)}</span>
          {order.premiumDiscount > 0 && (
            <span className="mo-saving">⭐ Premium −${order.premiumDiscount.toFixed(2)}</span>
          )}
          {order.couponDiscount > 0 && (
            <span className="mo-saving">🎟 Coupon −${order.couponDiscount.toFixed(2)}</span>
          )}
        </div>
        <div className="mo-total-wrap">
          {totalSaved > 0 && <span className="mo-saved-badge">Saved ${totalSaved.toFixed(2)}</span>}
          <span className="mo-total">${order.total?.toFixed(2)}</span>
        </div>
      </div>

      {/* ── Items toggle ── */}
      <button className="mo-items-toggle" onClick={() => setExpanded(e => !e)}>
        {order.items.length} item{order.items.length !== 1 ? 's' : ''}
        <span className="mo-chevron">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="mo-items">
          {order.items.map((item, i) => (
            <div key={i} className="mo-item-row">
              <span className="mo-item-emoji">{item.emoji}</span>
              <div className="mo-item-info">
                <p className="mo-item-name">{item.name}</p>
                <p className="mo-item-brand">{item.brand}</p>
              </div>
              <div className="mo-item-qty-price">
                <span className="mo-item-qty">×{item.quantity}</span>
                <span className="mo-item-total">${item.lineTotal?.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MyOrders() {
  const { token, isAuthenticated } = useContext(AuthContext);
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (!isAuthenticated()) return;
    fetch(`${API_URL}/api/marketplace-orders/my`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) setOrders(data.orders);
        else setError('Could not load orders.');
      })
      .catch(() => setError('Could not reach the server.'))
      .finally(() => setLoading(false));
  }, [token, isAuthenticated]);

  return (
    <div className="mo-page">
      <div className="mo-container">
        <div className="mo-header">
          <div>
            <h1 className="mo-title">My Orders</h1>
            <p className="mo-subtitle">Track your Ssaye Grocery Club orders</p>
          </div>
          <Link to="/marketplace" className="mo-shop-link">← Continue Shopping</Link>
        </div>

        {loading ? (
          <div className="mo-loading">
            <div className="mo-spinner" />
            <p>Loading your orders…</p>
          </div>
        ) : error ? (
          <div className="mo-error">{error}</div>
        ) : orders.length === 0 ? (
          <div className="mo-empty">
            <span className="mo-empty-icon">🛍️</span>
            <h2>No orders yet</h2>
            <p>Your order history will appear here once you make a purchase.</p>
            <Link to="/marketplace" className="mo-empty-btn">Start Shopping</Link>
          </div>
        ) : (
          <div className="mo-list">
            {orders.map(order => (
              <OrderCard key={order._id} order={order} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
