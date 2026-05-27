import React, { useState, useMemo, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Marketplace.css';

// Products are fetched from the API — see fetchProducts() in Marketplace()

const CATEGORIES = [
  "All Products",
  "Dal & Lentils",
  "Rice & Grains",
  "Spices & Masala",
  "Atta & Flour",
  "Oils & Ghee",
  "Snacks & Namkeen",
  "Pickles & Chutneys",
  "Frozen Foods",
  "Dairy & Paneer",
  "Tea, Coffee & Drinks",
  "Sweets & Mithai",
  "Fresh Produce",
  "Meat & Seafood",
  "Pooja Items",
];

const CATEGORY_ICONS = {
  "Dal & Lentils":        "🫘",
  "Rice & Grains":        "🌾",
  "Spices & Masala":      "🌶️",
  "Atta & Flour":         "🌾",
  "Oils & Ghee":          "🫙",
  "Snacks & Namkeen":     "🍿",
  "Pickles & Chutneys":   "🥭",
  "Frozen Foods":         "❄️",
  "Dairy & Paneer":       "🧀",
  "Tea, Coffee & Drinks": "☕",
  "Sweets & Mithai":      "🍮",
  "Fresh Produce":        "🥬",
  "Meat & Seafood":       "🥩",
  "Pooja Items":          "🪔",
};

const SORT_OPTIONS = [
  { value: "popular",    label: "Most Popular" },
  { value: "price-asc",  label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating",     label: "Top Rated" },
  { value: "name",       label: "Name: A–Z" },
];

// ─── Login Prompt Modal ───────────────────────────────────────────────────────
function LoginPromptModal({ onClose, onLogin }) {
  return (
    <div className="mp-modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="mp-modal-title">
      <div className="mp-modal" onClick={(e) => e.stopPropagation()}>
        <button className="mp-modal-close" onClick={onClose} aria-label="Close">✕</button>
        <div className="mp-modal-icon">🔒</div>
        <h2 className="mp-modal-title" id="mp-modal-title">Sign in to add items</h2>
        <p className="mp-modal-body">
          You need a Ssaye account to add products to your cart and place orders.
          It only takes a minute to sign up.
        </p>
        <div className="mp-modal-actions">
          <button className="mp-modal-btn-primary" onClick={onLogin}>Sign In</button>
          <button className="mp-modal-btn-secondary" onClick={onClose}>Continue Browsing</button>
        </div>
        <p className="mp-modal-signup">
          Don't have an account?{' '}
          <a href="/signup" className="mp-modal-link">Create one for free</a>
        </p>
      </div>
    </div>
  );
}

// ─── Star Rating ──────────────────────────────────────────────────────────────
function StarRating({ rating }) {
  return (
    <span className="mp-stars" aria-label={`${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={s <= Math.round(rating) ? "mp-star filled" : "mp-star"}>★</span>
      ))}
    </span>
  );
}

// ─── Product Card ─────────────────────────────────────────────────────────────
function ProductCard({ product, qty, onAdd, onRemove, onViewDetails }) {
  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;
  const [imgError, setImgError] = useState(false);
  const showImage = product.imageUrl && !imgError;

  return (
    <div className="mp-card">
      {/* ── Image area ── */}
      <div className="mp-card-img" onClick={() => onViewDetails(product)}>

        {/* Top-left: sale / stock / type badge — one at a time, priority order */}
        {discount ? (
          <span className="mp-badge mp-badge-sale">{discount}% OFF</span>
        ) : product.badge === "Low" ? (
          <span className="mp-badge mp-badge-low">Low Stock</span>
        ) : product.badge === "Organic" ? (
          <span className="mp-badge mp-badge-organic">Organic</span>
        ) : product.badge === "Fresh" ? (
          <span className="mp-badge mp-badge-fresh">Fresh</span>
        ) : product.badge === "Halal" ? (
          <span className="mp-badge mp-badge-halal">Halal</span>
        ) : null}

        {/* Top-right: wishlist heart */}
        <button
          className="mp-card-heart"
          onClick={(e) => e.stopPropagation()}
          aria-label="Save to wishlist"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>

        {/* Real product image — emoji shown as fallback if URL missing or fails */}
        {showImage ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="mp-product-img"
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="mp-emoji" role="img" aria-label={product.name}>
            {product.emoji}
          </span>
        )}

        {/* Compare hint on hover */}
        <div className="mp-compare-hint">📊 Compare Prices</div>
      </div>

      {/* ── Card body ── */}
      <div className="mp-card-body">
        <p className="mp-brand">{product.brand}</p>
        <h3
          className="mp-name mp-name-link"
          onClick={() => onViewDetails(product)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onViewDetails(product)}
        >
          {product.name}
        </h3>

        <div className="mp-rating-row">
          <StarRating rating={product.rating} />
          <span className="mp-review-count">({product.reviews.toLocaleString()})</span>
        </div>

        <div className="mp-price-row">
          <span className="mp-price">${product.price.toFixed(2)}</span>
          {product.originalPrice && (
            <span className="mp-original-price">${product.originalPrice.toFixed(2)}</span>
          )}
        </div>

        {/* Quantity stepper or Add button */}
        {qty > 0 ? (
          <div className="mp-qty-row">
            <button className="mp-qty-btn" onClick={() => onRemove(product.id)} aria-label="Remove one">−</button>
            <span className="mp-qty-count">{qty}</span>
            <button className="mp-qty-btn mp-qty-btn--add" onClick={() => onAdd(product)} aria-label="Add one more">+</button>
          </div>
        ) : (
          <button
            className="mp-add-btn"
            onClick={() => onAdd(product)}
            aria-label={`Add ${product.name} to cart`}
          >
            <svg className="mp-add-btn-icon" width="16" height="16" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            Add to Cart
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Verdict config ────────────────────────────────────────────────────────────
const VERDICT_CONFIG = {
  great_deal:  { label: '🔥 Great Deal',    cls: 'pd-verdict--great',  bar: '#10b981' },
  good_value:  { label: '👍 Good Value',    cls: 'pd-verdict--good',   bar: '#3b82f6' },
  market_rate: { label: '📊 Market Rate',   cls: 'pd-verdict--market', bar: '#f59e0b' },
};

// ─── Nutrient bar ──────────────────────────────────────────────────────────────
function NutrientBar({ label, value, unit, max, color }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="pd-nutrient-row">
      <span className="pd-nutrient-label">{label}</span>
      <div className="pd-nutrient-track">
        <div className="pd-nutrient-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="pd-nutrient-val">{value != null ? `${value}${unit}` : '—'}</span>
    </div>
  );
}

// ─── Price comparison bar ──────────────────────────────────────────────────────
function PriceBar({ label, price, ssayePrice, maxPrice, isSSaye }) {
  const pct = Math.min(100, Math.round((price / maxPrice) * 100));
  const cheaper = !isSSaye && price > ssayePrice;
  return (
    <div className={`pd-price-row ${isSSaye ? 'pd-price-row--ssaye' : ''}`}>
      <span className="pd-price-source">{label}</span>
      <div className="pd-price-track">
        <div
          className="pd-price-fill"
          style={{
            width: `${pct}%`,
            background: isSSaye
              ? 'linear-gradient(90deg, #667eea, #764ba2)'
              : cheaper ? '#94a3b8' : '#64748b',
          }}
        />
      </div>
      <span className={`pd-price-val ${isSSaye ? 'pd-price-val--ssaye' : ''}`}>
        ${price.toFixed(2)}
        {cheaper && <span className="pd-price-diff"> +${(price - ssayePrice).toFixed(2)}</span>}
      </span>
    </div>
  );
}

// ─── Product Detail Modal ─────────────────────────────────────────────────────
function ProductDetailModal({ product, qty, onAdd, onRemove, onClose }) {
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  // Fetch comparison data when modal mounts
  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`${API_URL}/api/compare/${product.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setData(d);
        else setError('Could not load comparison data.');
      })
      .catch(() => setError('Could not reach the server.'))
      .finally(() => setLoading(false));
  }, [product.id, API_URL]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const comparison   = data?.comparison;
  const off          = comparison?.openFoodFacts;
  const marketPrices = comparison?.marketPrices ?? [];
  const verdictCfg   = comparison ? (VERDICT_CONFIG[comparison.verdict] ?? VERDICT_CONFIG.market_rate) : null;
  const maxPrice     = comparison
    ? Math.max(...marketPrices.map((m) => m.price), comparison.ssayePrice) * 1.05
    : 1;

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;

  // Nutriscore grade colours
  const nutriColors = { a: '#21a55a', b: '#84bb2f', c: '#f5ce42', d: '#ee8100', e: '#e63312' };
  const nutriGrade  = off?.nutriscoreGrade?.toLowerCase();

  return (
    <div className="pd-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label={`Details for ${product.name}`}>
      <div className="pd-panel" onClick={(e) => e.stopPropagation()}>

        {/* ── Close ── */}
        <button className="pd-close" onClick={onClose} aria-label="Close">✕</button>

        {/* ── Product hero ── */}
        <div className="pd-hero">
          <div className="pd-hero-emoji">{product.emoji}</div>
          <div className="pd-hero-info">
            <p className="pd-hero-brand">{product.brand.toUpperCase()}</p>
            <h2 className="pd-hero-name">{product.name}</h2>
            <div className="pd-hero-meta">
              <StarRating rating={product.rating} />
              <span className="pd-review-count">({product.reviews.toLocaleString()} reviews)</span>
              {product.badge && (
                <span className={`mp-badge mp-badge-${product.badge.toLowerCase()} pd-badge`}>
                  {product.badge === 'Low' ? 'Low Stock' : product.badge}
                </span>
              )}
            </div>
            <div className="pd-hero-price-row">
              <span className="pd-hero-price">${product.price.toFixed(2)}</span>
              {product.originalPrice && (
                <span className="pd-hero-original">${product.originalPrice.toFixed(2)}</span>
              )}
              {discount && <span className="pd-hero-discount">{discount}% OFF</span>}
            </div>
            {/* Cart controls */}
            <div className="pd-cart-row">
              {qty > 0 ? (
                <div className="mp-qty-row pd-qty-row">
                  <button className="mp-qty-btn" onClick={() => onRemove(product.id)} aria-label="Remove one">−</button>
                  <span className="mp-qty-count">{qty}</span>
                  <button className="mp-qty-btn mp-qty-btn--add" onClick={() => onAdd(product)} aria-label="Add one more">+</button>
                </div>
              ) : (
                <button className="pd-add-btn" onClick={() => onAdd(product)}>
                  🛒 Add to Cart
                </button>
              )}
              {qty > 0 && <span className="pd-in-cart">{qty} in cart</span>}
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="pd-body">
          {loading && (
            <div className="pd-loading">
              <div className="mp-spinner" />
              <p>Fetching live market prices…</p>
            </div>
          )}

          {error && (
            <div className="pd-error">
              <span>⚠️</span> {error}
            </div>
          )}

          {!loading && !error && comparison && (
            <>
              {/* ── Verdict banner ── */}
              <div className={`pd-verdict ${verdictCfg.cls}`}>
                <span className="pd-verdict-label">{verdictCfg.label}</span>
                <span className="pd-verdict-text">{comparison.verdictText}</span>
              </div>

              {/* ── Price comparison chart ── */}
              <section className="pd-section">
                <h3 className="pd-section-title">💰 Price Comparison</h3>
                <p className="pd-section-sub">Ssaye vs. market estimates</p>
                <div className="pd-price-chart">
                  {/* Ssaye price first */}
                  <PriceBar
                    label="🛒 Ssaye Price"
                    price={comparison.ssayePrice}
                    ssayePrice={comparison.ssayePrice}
                    maxPrice={maxPrice}
                    isSSaye
                  />
                  {marketPrices.map((m) => (
                    <PriceBar
                      key={m.source}
                      label={m.source}
                      price={m.price}
                      ssayePrice={comparison.ssayePrice}
                      maxPrice={maxPrice}
                      isSSaye={false}
                    />
                  ))}
                </div>
                {comparison.savings > 0 && (
                  <div className="pd-savings-banner">
                    <span className="pd-savings-icon">💸</span>
                    <span>
                      Save <strong>${comparison.savings.toFixed(2)}</strong> ({comparison.savingsPct}%) buying from Ssaye vs. retail
                    </span>
                  </div>
                )}
                {/* Google-scraped prices if any */}
                {comparison.googlePrices?.length > 0 && (
                  <div className="pd-google-prices">
                    <p className="pd-google-title">🔍 Prices found online</p>
                    <div className="pd-google-chips">
                      {[...new Set(comparison.googlePrices)].slice(0, 6).map((p, i) => (
                        <span key={i} className="pd-google-chip">{p}</span>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              {/* ── Open Food Facts data ── */}
              {off?.found && (
                <section className="pd-section">
                  <h3 className="pd-section-title">🥗 Nutritional Intelligence</h3>
                  <p className="pd-section-sub">Data sourced from Open Food Facts</p>
                  <div className="pd-off-grid">
                    {/* Nutriscore */}
                    {nutriGrade && (
                      <div className="pd-nutriscore">
                        <p className="pd-nutriscore-label">Nutri-Score</p>
                        <div
                          className="pd-nutriscore-badge"
                          style={{ background: nutriColors[nutriGrade] ?? '#94a3b8' }}
                        >
                          {nutriGrade.toUpperCase()}
                        </div>
                      </div>
                    )}
                    {/* Product info */}
                    <div className="pd-off-info">
                      {off.productName && <p><strong>Matched product:</strong> {off.productName}</p>}
                      {off.brands      && <p><strong>Brand(s):</strong> {off.brands}</p>}
                      {off.quantity    && <p><strong>Quantity:</strong> {off.quantity}</p>}
                      {off.stores      && <p><strong>Sold at:</strong> {off.stores}</p>}
                    </div>
                  </div>

                  {/* Nutrients */}
                  {off.nutriments && Object.keys(off.nutriments).length > 0 && (
                    <div className="pd-nutrients">
                      <p className="pd-nutrients-title">Per 100g</p>
                      <NutrientBar label="Energy"  value={off.nutriments['energy-kcal_100g']} unit=" kcal" max={600}  color="#f97316" />
                      <NutrientBar label="Protein" value={off.nutriments['proteins_100g']}    unit="g"     max={50}   color="#3b82f6" />
                      <NutrientBar label="Carbs"   value={off.nutriments['carbohydrates_100g']} unit="g"   max={100}  color="#f59e0b" />
                      <NutrientBar label="Fat"     value={off.nutriments['fat_100g']}          unit="g"    max={50}   color="#ef4444" />
                      <NutrientBar label="Fibre"   value={off.nutriments['fiber_100g']}        unit="g"    max={20}   color="#10b981" />
                      <NutrientBar label="Salt"    value={off.nutriments['salt_100g']}         unit="g"    max={5}    color="#8b5cf6" />
                    </div>
                  )}
                </section>
              )}

              {/* ── No OFF match ── */}
              {off && !off.found && (
                <section className="pd-section pd-section--muted">
                  <h3 className="pd-section-title">🥗 Nutritional Data</h3>
                  <p className="pd-no-data">No nutritional data found in the Open Food Facts database for this product.</p>
                </section>
              )}

              {/* ── Product details ── */}
              <section className="pd-section">
                <h3 className="pd-section-title">📋 Product Details</h3>
                <div className="pd-details-grid">
                  <div className="pd-detail-item">
                    <span className="pd-detail-key">Category</span>
                    <span className="pd-detail-val">{product.category}</span>
                  </div>
                  <div className="pd-detail-item">
                    <span className="pd-detail-key">Brand</span>
                    <span className="pd-detail-val">{product.brand}</span>
                  </div>
                  <div className="pd-detail-item">
                    <span className="pd-detail-key">Stock</span>
                    <span className="pd-detail-val" style={{ color: product.stock === 'Low' ? '#f59e0b' : product.stock === 'Out of Stock' ? '#ef4444' : '#10b981' }}>
                      {product.stock}
                    </span>
                  </div>
                  <div className="pd-detail-item">
                    <span className="pd-detail-key">Rating</span>
                    <span className="pd-detail-val">{product.rating} / 5 ⭐</span>
                  </div>
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Cart Page ────────────────────────────────────────────────────────────────
function CartPage({ cart, products, onAdd, onRemove, onClearItem, onBack, onCheckoutSuccess }) {
  const { token } = useContext(AuthContext);
  const cartItems = products.filter((p) => cart[p.id] > 0);
  const subtotal  = cartItems.reduce((sum, p) => sum + p.price * cart[p.id], 0);
  const totalQty  = Object.values(cart).reduce((s, q) => s + q, 0);

  const [checkingOut,   setCheckingOut]   = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);
  const [orderDone,     setOrderDone]     = useState(null); // order object on success

  const handleCheckout = async () => {
    setCheckingOut(true);
    setCheckoutError(null);
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      const items = cartItems.map((p) => ({
        productId: p.id,
        name:      p.name,
        brand:     p.brand,
        category:  p.category,
        emoji:     p.emoji,
        price:     p.price,
        quantity:  cart[p.id],
      }));
      const res = await fetch(`${API_URL}/api/marketplace-orders`, {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ items }),
      });
      const data = await res.json();
      if (data.success) {
        setOrderDone(data.order);
        onCheckoutSuccess(); // clears cart in parent
      } else {
        setCheckoutError(data.message || 'Could not place your order. Please try again.');
      }
    } catch {
      setCheckoutError('Could not reach the server. Please try again.');
    } finally {
      setCheckingOut(false);
    }
  };

  // ── Order Confirmed screen ──
  if (orderDone) {
    return (
      <div className="mp-cart-page">
        <div className="mp-order-confirmed">
          <div className="mp-order-confirmed-icon">🎉</div>
          <h2 className="mp-order-confirmed-title">Order Placed!</h2>
          <p className="mp-order-confirmed-number">Order #{orderDone.orderNumber}</p>
          <p className="mp-order-confirmed-msg">
            Thanks for your order. We'll process it shortly and keep you updated.
          </p>
          <p className="mp-order-confirmed-total">
            Total: <strong>${orderDone.total?.toFixed(2)}</strong>
          </p>
          <button className="mp-cart-back-btn" onClick={onBack} style={{ marginTop: '1.5rem' }}>
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mp-cart-page">
      {/* header */}
      <div className="mp-cart-header">
        <button className="mp-cart-back" onClick={onBack}>
          ← Continue Shopping
        </button>
        <h1 className="mp-cart-title">Your Cart</h1>
        <p className="mp-cart-subtitle">{totalQty} item{totalQty !== 1 ? "s" : ""} in your cart</p>
      </div>

      {cartItems.length === 0 ? (
        <div className="mp-cart-empty">
          <span className="mp-cart-empty-icon">🛒</span>
          <h2>Your cart is empty</h2>
          <p>Add some items from the marketplace to get started.</p>
          <button className="mp-cart-back-btn" onClick={onBack}>Browse Products</button>
        </div>
      ) : (
        <div className="mp-cart-layout">
          {/* item list */}
          <div className="mp-cart-items">
            {cartItems.map((product) => (
              <div key={product.id} className="mp-cart-row">
                <div className="mp-cart-row-img">
                  <span className="mp-cart-emoji">{product.emoji}</span>
                </div>
                <div className="mp-cart-row-info">
                  <p className="mp-cart-row-brand">{product.brand.toUpperCase()}</p>
                  <p className="mp-cart-row-name">{product.name}</p>
                  <p className="mp-cart-row-unit">${product.price.toFixed(2)} each</p>
                </div>
                <div className="mp-cart-row-controls">
                  <div className="mp-qty-row">
                    <button className="mp-qty-btn" onClick={() => onRemove(product.id)} aria-label="Remove one">−</button>
                    <span className="mp-qty-count">{cart[product.id]}</span>
                    <button className="mp-qty-btn mp-qty-btn--add" onClick={() => onAdd(product)} aria-label="Add one more">+</button>
                  </div>
                  <p className="mp-cart-row-subtotal">
                    ${(product.price * cart[product.id]).toFixed(2)}
                  </p>
                  <button
                    className="mp-cart-remove"
                    onClick={() => onClearItem(product.id)}
                    aria-label={`Remove ${product.name}`}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* order summary */}
          <div className="mp-cart-summary">
            <h2 className="mp-cart-summary-title">Order Summary</h2>
            <div className="mp-cart-summary-row">
              <span>Subtotal ({totalQty} items)</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="mp-cart-summary-row">
              <span>Delivery</span>
              <span className="mp-cart-free">FREE</span>
            </div>
            <div className="mp-cart-summary-divider" />
            <div className="mp-cart-summary-row mp-cart-summary-total">
              <span>Total</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            {checkoutError && (
              <p className="mp-checkout-error">{checkoutError}</p>
            )}
            <button
              className="mp-cart-checkout"
              onClick={handleCheckout}
              disabled={checkingOut}
            >
              {checkingOut ? 'Placing Order…' : 'Proceed to Checkout'}
            </button>
            <button className="mp-cart-back-btn mp-cart-back-btn--outline" onClick={onBack}>
              Continue Shopping
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
function Marketplace() {
  const { isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  const [activeCategory,    setActiveCategory]    = useState("All Products");
  const [searchQuery,       setSearchQuery]       = useState("");
  const [sortBy,            setSortBy]            = useState("popular");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [showCart,          setShowCart]          = useState(false);
  const [showLoginPrompt,   setShowLoginPrompt]   = useState(false);
  const [detailProduct,     setDetailProduct]     = useState(null); // product detail modal

  // cart: { [productId]: quantity }
  const [cart, setCart] = useState({});

  const [products,     setProducts]     = useState([]);
  const [loadingProds, setLoadingProds] = useState(true);
  const [prodError,    setProdError]    = useState(null);

  useEffect(() => {
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    fetch(`${API_URL}/api/products`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setProducts(data.products);
        } else {
          setProdError('Failed to load products.');
        }
      })
      .catch(() => setProdError('Could not connect to the server.'))
      .finally(() => setLoadingProds(false));
  }, []);

  const addToCart = (product) => {
    if (!isAuthenticated()) {
      setShowLoginPrompt(true);
      return;
    }
    setCart((prev) => ({ ...prev, [product.id]: (prev[product.id] || 0) + 1 }));
  };

  const removeFromCart = (productId) => {
    setCart((prev) => {
      const newQty = (prev[productId] || 0) - 1;
      if (newQty <= 0) {
        const next = { ...prev };
        delete next[productId];
        return next;
      }
      return { ...prev, [productId]: newQty };
    });
  };

  const clearCartItem = (productId) => {
    setCart((prev) => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });
  };

  const clearCart = () => setCart({});

  const totalQty = Object.values(cart).reduce((s, q) => s + q, 0);

  const categoryCounts = useMemo(() => {
    const counts = {};
    CATEGORIES.forEach((c) => {
      counts[c] = c === "All Products"
        ? products.length
        : products.filter((p) => p.category === c).length;
    });
    return counts;
  }, [products]);

  const filtered = useMemo(() => {
    let list = products;
    if (activeCategory !== "All Products") {
      list = list.filter((p) => p.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }
    switch (sortBy) {
      case "price-asc":  return [...list].sort((a, b) => a.price - b.price);
      case "price-desc": return [...list].sort((a, b) => b.price - a.price);
      case "rating":     return [...list].sort((a, b) => b.rating - a.rating);
      case "name":       return [...list].sort((a, b) => a.name.localeCompare(b.name));
      default:           return [...list].sort((a, b) => b.reviews - a.reviews);
    }
  }, [products, activeCategory, searchQuery, sortBy]);

  // ── Cart view ──
  if (showCart) {
    return (
      <div className="mp-page">
        <section className="mp-hero">
          <div className="mp-hero-content">
            <p className="mp-hero-eyebrow">Ssaye Club · Grocery</p>
            <h1 className="mp-hero-title">SSAYE GROCERY CLUB</h1>
            <p className="mp-hero-tagline">Empowering communities through authentic South Asian flavours</p>
            <p className="mp-hero-subtitle">
              Ssaye Grocery Club delivers an authentic South Asian shopping experience — fresh produce,
              premium spices, trusted brands and frozen favourites, all in one place.
            </p>
          </div>
        </section>
        <CartPage
          cart={cart}
          products={products}
          onAdd={addToCart}
          onRemove={removeFromCart}
          onClearItem={clearCartItem}
          onBack={() => setShowCart(false)}
          onCheckoutSuccess={clearCart}
        />
        {showLoginPrompt && (
          <LoginPromptModal
            onClose={() => setShowLoginPrompt(false)}
            onLogin={() => navigate('/login')}
          />
        )}
      </div>
    );
  }

  // ── Marketplace view ──
  return (
    <div className="mp-page">
      {/* ── Login prompt modal ── */}
      {showLoginPrompt && (
        <LoginPromptModal
          onClose={() => setShowLoginPrompt(false)}
          onLogin={() => navigate('/login')}
        />
      )}

      {/* ── Hero ── */}
      <section className="mp-hero">
        <div className="mp-hero-content">
          <p className="mp-hero-eyebrow">Ssaye Club · Grocery</p>
          <h1 className="mp-hero-title">SSAYE GROCERY CLUB</h1>
          <p className="mp-hero-tagline">Empowering communities through authentic South Asian flavours</p>
          <p className="mp-hero-subtitle">
            Ssaye Grocery Club delivers an authentic South Asian shopping experience — fresh produce,
            premium spices, trusted brands and frozen favourites, all in one place.
          </p>
        </div>
      </section>

      {/* ── Layout ── */}
      <div className="mp-layout">

        {/* Mobile filter toggle */}
        <button
          className="mp-filter-toggle"
          onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
          aria-expanded={mobileFiltersOpen}
        >
          {mobileFiltersOpen ? "✕ Close Filters" : "☰ Categories"}
        </button>

        {/* ── Sidebar ── */}
        <aside className={`mp-sidebar ${mobileFiltersOpen ? "mp-sidebar--open" : ""}`}>

          <h2 className="mp-sidebar-title">CATEGORIES</h2>
          <ul className="mp-category-list">
            {CATEGORIES.map((cat) => (
              <li key={cat}>
                <button
                  className={`mp-category-btn ${activeCategory === cat ? "mp-category-btn--active" : ""}`}
                  onClick={() => { setActiveCategory(cat); setMobileFiltersOpen(false); }}
                >
                  <span className="mp-cat-icon">{CATEGORY_ICONS[cat] ?? "🛒"}</span>
                  <span className="mp-cat-name">{cat}</span>
                  <span className="mp-cat-count">{categoryCounts[cat]}</span>
                </button>
              </li>
            ))}
          </ul>

          {/* Can't find it? */}
          <div className="mp-request-box">
            <p className="mp-request-label">🔍 CAN'T FIND IT?</p>
            <p className="mp-request-desc">Request a product or join the waitlist</p>
            <a
              href="mailto:info@ssayeclub.com?subject=Product%20Request"
              className="mp-request-btn"
            >
              Request Product
            </a>
          </div>
        </aside>

        {/* ── Main Grid ── */}
        <main className="mp-main">
          <div className="mp-toolbar">
            {/* Search bar — left side */}
            <div className="mp-toolbar-search">
              <span className="mp-toolbar-search-icon">🔍</span>
              <input
                type="text"
                className="mp-toolbar-search-input"
                placeholder="Search products…"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setActiveCategory("All Products"); }}
              />
              {searchQuery && (
                <button
                  className="mp-search-clear"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                >✕</button>
              )}
            </div>

            {/* Right side: count + sort + cart */}
            <div className="mp-toolbar-right">
              <p className="mp-count">
                {filtered.length} product{filtered.length !== 1 ? "s" : ""}
                {searchQuery && <span className="mp-search-term"> for "{searchQuery}"</span>}
              </p>
              <div className="mp-sort-wrap">
                <label htmlFor="mp-sort" className="mp-sort-label">Sort:</label>
                <select
                  id="mp-sort"
                  className="mp-sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              {/* Cart button */}
              <button
                className="mp-toolbar-cart"
                onClick={() => setShowCart(true)}
                aria-label={`View cart — ${totalQty} item${totalQty !== 1 ? 's' : ''}`}
              >
                <span className="mp-toolbar-cart-icon">🛒</span>
                <span className="mp-toolbar-cart-label">
                  Cart{totalQty > 0 ? ` · ${totalQty}` : ''}
                </span>
                {totalQty > 0 && (
                  <span className="mp-toolbar-cart-badge">{totalQty}</span>
                )}
              </button>
            </div>
          </div>

          {loadingProds ? (
            <div className="mp-loading">
              <div className="mp-spinner" />
              <p>Loading products…</p>
            </div>
          ) : prodError ? (
            <div className="mp-empty">
              <span className="mp-empty-icon">⚠️</span>
              <h3>Something went wrong</h3>
              <p>{prodError}</p>
              <button className="mp-empty-reset" onClick={() => window.location.reload()}>
                Try Again
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="mp-empty">
              <span className="mp-empty-icon">🛍️</span>
              <h3>No products found</h3>
              <p>Try a different category or search term</p>
              <button className="mp-empty-reset" onClick={() => { setSearchQuery(""); setActiveCategory("All Products"); }}>
                Show All Products
              </button>
            </div>
          ) : (
            <div className="mp-grid">
              {filtered.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  qty={cart[p.id] || 0}
                  onAdd={addToCart}
                  onRemove={removeFromCart}
                  onViewDetails={setDetailProduct}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* ── Product Detail / Compare Modal ── */}
      {detailProduct && (
        <ProductDetailModal
          product={detailProduct}
          qty={cart[detailProduct.id] || 0}
          onAdd={addToCart}
          onRemove={removeFromCart}
          onClose={() => setDetailProduct(null)}
        />
      )}
    </div>
  );
}

export default Marketplace;
