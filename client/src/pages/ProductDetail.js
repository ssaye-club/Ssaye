import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './ProductDetail.css';
import './Marketplace.css'; // reuse pd-* and mp-* classes

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

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

const VERDICT_CONFIG = {
  great_deal:  { cls: 'pd-verdict--great',  label: '🏆 Great Deal' },
  good_value:  { cls: 'pd-verdict--good',   label: '👍 Good Value' },
  market_rate: { cls: 'pd-verdict--market', label: '💡 Market Rate' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function StarRating({ rating }) {
  return (
    <span className="mp-stars" aria-label={`${rating} out of 5`}>
      {[1,2,3,4,5].map((s) => (
        <span key={s} className={s <= Math.round(rating) ? 'mp-star filled' : 'mp-star'}>★</span>
      ))}
    </span>
  );
}

function NutrientBar({ label, value, unit, max, color }) {
  const pct = value != null ? Math.min(100, Math.round((value / max) * 100)) : 0;
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

function PriceBar({ label, price, ssayePrice, maxPrice, isSSaye }) {
  const pct     = Math.min(100, Math.round((price / maxPrice) * 100));
  const cheaper = !isSSaye && price > ssayePrice;
  return (
    <div className={`pd-price-row ${isSSaye ? 'pd-price-row--ssaye' : ''}`}>
      <span className="pd-price-source">{label}</span>
      <div className="pd-price-track">
        <div className="pd-price-fill" style={{
          width: `${pct}%`,
          background: isSSaye ? 'linear-gradient(90deg,#667eea,#764ba2)' : cheaper ? '#94a3b8' : '#64748b',
        }} />
      </div>
      <span className={`pd-price-val ${isSSaye ? 'pd-price-val--ssaye' : ''}`}>
        ${price.toFixed(2)}
        {cheaper && <span className="pd-price-diff"> +${(price - ssayePrice).toFixed(2)}</span>}
      </span>
    </div>
  );
}

// ─── Subscribe & Save Modal ───────────────────────────────────────────────────
const FREQUENCIES = [
  { value: 'weekly',    label: 'Every week' },
  { value: 'biweekly',  label: 'Every 2 weeks' },
  { value: 'monthly',   label: 'Every month' },
  { value: 'bimonthly', label: 'Every 2 months' },
  { value: 'quarterly', label: 'Every 3 months' },
];

function toInputDate(d) {
  return d.toISOString().slice(0, 10);
}

function SubscribeModal({ product, token, onClose, onSuccess }) {
  const today   = new Date();
  const oneMonth = new Date(today);
  oneMonth.setMonth(oneMonth.getMonth() + 1);

  const [frequency,  setFrequency]  = useState('monthly');
  const [startDate,  setStartDate]  = useState(toInputDate(today));
  const [endDate,    setEndDate]    = useState(toInputDate(oneMonth));
  const [notes,      setNotes]      = useState('');
  const [placing,    setPlacing]    = useState(false);
  const [error,      setError]      = useState(null);

  const discountPct = 10; // 10 % subscribe & save discount
  const discountedPrice = (product.price * (1 - discountPct / 100)).toFixed(2);

  const handleSubmit = async () => {
    if (!startDate || !endDate) { setError('Please select start and end dates.'); return; }
    if (new Date(endDate) <= new Date(startDate)) { setError('End date must be after start date.'); return; }
    setPlacing(true); setError(null);
    try {
      const res = await fetch(`${API_URL}/api/subscriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          product: {
            productId: product.id,
            name:      product.name,
            brand:     product.brand,
            category:  product.category,
            emoji:     product.emoji,
            price:     parseFloat(discountedPrice),
          },
          frequency,
          startDate,
          endDate,
          notes,
        }),
      });
      const data = await res.json();
      if (data.success) onSuccess(data.subscription);
      else setError(data.message || 'Could not place subscription.');
    } catch { setError('Could not reach the server.'); }
    finally  { setPlacing(false); }
  };

  return (
    <div className="mp-modal-overlay" onClick={onClose}>
      <div className="sub-modal" onClick={e => e.stopPropagation()}>
        <button className="mp-modal-close" onClick={onClose}>✕</button>

        <div className="sub-modal-header">
          <span className="sub-modal-icon">🔄</span>
          <h2 className="sub-modal-title">Subscribe &amp; Save</h2>
          <p className="sub-modal-product">{product.name}</p>
          <div className="sub-discount-badge">Save {discountPct}% — ${discountedPrice} / delivery</div>
        </div>

        <div className="sub-modal-body">
          {/* Frequency */}
          <div className="sub-field">
            <label className="sub-label">Delivery Frequency</label>
            <div className="sub-freq-grid">
              {FREQUENCIES.map(f => (
                <button
                  key={f.value}
                  className={`sub-freq-btn ${frequency === f.value ? 'sub-freq-btn--active' : ''}`}
                  onClick={() => setFrequency(f.value)}
                  type="button"
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date range */}
          <div className="sub-date-row">
            <div className="sub-field">
              <label className="sub-label">Start Date</label>
              <input
                type="date"
                className="sub-date-input"
                value={startDate}
                min={toInputDate(today)}
                onChange={e => setStartDate(e.target.value)}
              />
            </div>
            <div className="sub-field">
              <label className="sub-label">End Date</label>
              <input
                type="date"
                className="sub-date-input"
                value={endDate}
                min={startDate || toInputDate(today)}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="sub-field">
            <label className="sub-label">Notes <span className="sub-label-opt">(optional)</span></label>
            <textarea
              className="sub-notes"
              placeholder="e.g. leave at front door"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {error && <p className="mp-checkout-error">{error}</p>}
        </div>

        <div className="sub-modal-footer">
          <button className="sub-confirm-btn" onClick={handleSubmit} disabled={placing}>
            {placing ? 'Subscribing…' : '🔄 Confirm Subscription'}
          </button>
          <button className="mp-modal-btn-secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ─── Cart helpers using localStorage ─────────────────────────────────────────
function readCart()       { try { return JSON.parse(localStorage.getItem('ssaye_cart') || '{}'); } catch { return {}; } }
function writeCart(cart)  { localStorage.setItem('ssaye_cart', JSON.stringify(cart)); }

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProductDetail() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const { isAuthenticated, token, user } = useContext(AuthContext);

  const [product,  setProduct]  = useState(null);
  const [prodLoad, setProdLoad] = useState(true);
  const [prodErr,  setProdErr]  = useState(null);

  const [compData, setCompData] = useState(null);
  const [compLoad, setCompLoad] = useState(true);
  const [compErr,  setCompErr]  = useState(null);

  const [cart,    setCartState] = useState(readCart);
  const [imgError, setImgError] = useState(false);

  // Buy-now modal state
  const [buyNowOpen,  setBuyNowOpen]  = useState(false);
  const [buyNowDone,  setBuyNowDone]  = useState(null);
  const [placing,     setPlacing]     = useState(false);
  const [placeErr,    setPlaceErr]    = useState(null);
  const [showLogin,   setShowLogin]   = useState(false);
  const [subOpen,     setSubOpen]     = useState(false);
  const [subDone,     setSubDone]     = useState(null);

  // Reviews state
  const [reviews,      setReviews]      = useState([]);
  const [reviewsLoad,  setReviewsLoad]  = useState(true);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewBody,   setReviewBody]   = useState('');
  const [reviewHover,  setReviewHover]  = useState(0);
  const [reviewErr,    setReviewErr]    = useState(null);
  const [reviewOk,     setReviewOk]     = useState(false);
  const [reviewSaving, setReviewSaving] = useState(false);

  // Persist cart to localStorage whenever it changes
  useEffect(() => { writeCart(cart); }, [cart]);

  // Clear in-memory cart immediately when user logs out
  useEffect(() => {
    if (!token) setCartState({});
  }, [token]);

  // Fetch product
  useEffect(() => {
    setProdLoad(true); setProdErr(null);
    fetch(`${API_URL}/api/products/${id}`)
      .then(r => r.json())
      .then(d => { if (d.success) setProduct(d.product); else setProdErr('Product not found.'); })
      .catch(() => setProdErr('Could not connect to the server.'))
      .finally(() => setProdLoad(false));
  }, [id]);

  // Fetch comparison data
  useEffect(() => {
    setCompLoad(true); setCompErr(null);
    fetch(`${API_URL}/api/compare/${id}`)
      .then(r => r.json())
      .then(d => { if (d.success) setCompData(d); else setCompErr('Could not load comparison data.'); })
      .catch(() => setCompErr('Could not reach the server.'))
      .finally(() => setCompLoad(false));
  }, [id]);

  // Fetch reviews
  useEffect(() => {
    setReviewsLoad(true);
    fetch(`${API_URL}/api/reviews/${id}`)
      .then(r => r.json())
      .then(d => { if (d.success) setReviews(d.reviews); })
      .catch(() => {})
      .finally(() => setReviewsLoad(false));
  }, [id]);

  const submitReview = async () => {
    if (!isAuthenticated()) { setShowLogin(true); return; }
    if (reviewRating === 0) { setReviewErr('Please select a star rating.'); return; }
    if (!reviewBody.trim()) { setReviewErr('Please write a review.'); return; }
    setReviewSaving(true); setReviewErr(null); setReviewOk(false);
    try {
      const res = await fetch(`${API_URL}/api/reviews/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rating: reviewRating, body: reviewBody.trim(), userName: user?.name || 'Anonymous' }),
      });
      const data = await res.json();
      if (data.success) {
        setReviewOk(true);
        setReviewBody('');
        setReviewRating(0);
        // Refresh review list
        fetch(`${API_URL}/api/reviews/${id}`)
          .then(r => r.json())
          .then(d => { if (d.success) setReviews(d.reviews); });
      } else {
        setReviewErr(data.message || 'Could not submit review.');
      }
    } catch { setReviewErr('Could not reach the server.'); }
    finally { setReviewSaving(false); }
  };

  const addToCart = () => {
    if (!isAuthenticated()) { setShowLogin(true); return; }
    setCartState(prev => { const n = { ...prev, [id]: (prev[id] || 0) + 1 }; return n; });
  };

  const removeFromCart = () => {
    setCartState(prev => {
      const qty = (prev[id] || 0) - 1;
      const n = { ...prev };
      if (qty <= 0) delete n[id]; else n[id] = qty;
      return n;
    });
  };

  const handleBuyNow = () => {
    if (!isAuthenticated()) { setShowLogin(true); return; }
    setBuyNowOpen(true);
  };

  const placeBuyNow = async () => {
    if (!product) return;
    setPlacing(true); setPlaceErr(null);
    try {
      const res = await fetch(`${API_URL}/api/marketplace-orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ items: [{ productId: product.id, name: product.name, brand: product.brand, category: product.category, emoji: product.emoji, price: product.price, quantity: 1 }] }),
      });
      const data = await res.json();
      if (data.success) { setBuyNowOpen(false); setBuyNowDone(data.order); }
      else setPlaceErr(data.message || 'Could not place order.');
    } catch { setPlaceErr('Could not reach the server.'); }
    finally { setPlacing(false); }
  };

  const totalQty = Object.values(cart).reduce((s, q) => s + q, 0);
  const qty      = cart[id] || 0;

  if (prodLoad) return (
    <div className="pdp-page">
      <div className="pdp-loading-full"><div className="mp-spinner" /><p>Loading product…</p></div>
    </div>
  );

  if (prodErr || !product) return (
    <div className="pdp-page">
      <div className="pdp-error-full">
        <span>⚠️</span>
        <p>{prodErr || 'Product not found.'}</p>
        <button onClick={() => navigate('/marketplace')}>← Back to Marketplace</button>
      </div>
    </div>
  );

  const discount    = product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : null;
  const comparison  = compData?.comparison;
  const off         = comparison?.openFoodFacts;
  const marketPrices = comparison?.marketPrices ?? [];
  const verdictCfg  = comparison ? (VERDICT_CONFIG[comparison.verdict] ?? VERDICT_CONFIG.market_rate) : null;
  const maxPrice    = comparison ? Math.max(...marketPrices.map(m => m.price), comparison.ssayePrice) * 1.05 : 1;
  const nutriColors = { a: '#21a55a', b: '#84bb2f', c: '#f5ce42', d: '#ee8100', e: '#e63312' };
  const nutriGrade  = off?.nutriscoreGrade?.toLowerCase();
  const showImage   = product.imageUrl && !imgError;

  return (
    <div className="pdp-page">
      {/* ── Top bar ── */}
      <div className="pdp-topbar">
        <button className="pdp-back-btn" onClick={() => navigate('/marketplace')}>
          ← Marketplace
        </button>
        <button className="pdp-cart-btn" onClick={() => navigate('/marketplace?cart=1')}>
          🛒 Cart {totalQty > 0 && <span className="pdp-cart-badge">{totalQty}</span>}
        </button>
      </div>

      <div className="pdp-content">
        {/* ── Sidebar ── */}
        <aside className="mp-sidebar pdp-sidebar">
          <h2 className="mp-sidebar-title">CATEGORIES</h2>
          <ul className="mp-category-list">
            {CATEGORIES.map((cat) => (
              <li key={cat}>
                <button
                  className={`mp-category-btn ${product && product.category === cat ? 'mp-category-btn--active' : ''}`}
                  onClick={() => navigate(cat === 'All Products' ? '/marketplace' : `/marketplace?category=${encodeURIComponent(cat)}`)}
                >
                  <span className="mp-cat-icon">{CATEGORY_ICONS[cat] ?? '🛒'}</span>
                  <span className="mp-cat-name">{cat}</span>
                </button>
              </li>
            ))}
          </ul>
          <div className="mp-request-box">
            <p className="mp-request-label">🔍 CAN'T FIND IT?</p>
            <p className="mp-request-desc">Request a product or join the waitlist</p>
            <a href="mailto:info@ssayeclub.com?subject=Product%20Request" className="mp-request-btn">
              Request Product
            </a>
          </div>
        </aside>

        {/* ── Main area ── */}
        <div className="pdp-main">
        {/* ── Hero ── */}
        <div className="pdp-hero">
          <div className="pdp-hero-img-wrap">
            {showImage
              ? <img src={product.imageUrl} alt={product.name} className="pdp-hero-img" onError={() => setImgError(true)} />
              : <span className="pdp-hero-emoji">{product.emoji}</span>
            }
          </div>

          <div className="pdp-hero-info">
            <p className="pdp-brand">{product.brand.toUpperCase()}</p>
            <h1 className="pdp-name">{product.name}</h1>

            <div className="pdp-meta">
              <StarRating rating={product.rating} />
              <span className="pdp-reviews">({product.reviews.toLocaleString()} reviews)</span>
              {product.badge && (
                <span className={`mp-badge mp-badge-${product.badge.toLowerCase()}`}>
                  {product.badge === 'Low' ? 'Low Stock' : product.badge}
                </span>
              )}
            </div>

            <div className="pdp-price-row">
              <span className="pdp-price">${product.price.toFixed(2)}</span>
              {product.originalPrice && <span className="pdp-original">${product.originalPrice.toFixed(2)}</span>}
              {discount && <span className="pdp-discount">{discount}% OFF</span>}
            </div>

            <div className="pdp-detail-chips">
              <span className="pdp-chip">📦 {product.category}</span>
              <span className={`pdp-chip ${product.stock === 'Out of Stock' ? 'pdp-chip--red' : product.stock === 'Low' ? 'pdp-chip--amber' : 'pdp-chip--green'}`}>
                {product.stock === 'In Stock' ? '✓ In Stock' : product.stock}
              </span>
            </div>

            <div className="pdp-actions">
              {qty > 0 ? (
                <div className="mp-qty-row pdp-qty-row">
                  <button className="mp-qty-btn" onClick={removeFromCart}>−</button>
                  <span className="mp-qty-count">{qty}</span>
                  <button className="mp-qty-btn mp-qty-btn--add" onClick={addToCart}>+</button>
                </div>
              ) : (
                <button className="pdp-add-btn" onClick={addToCart}>🛒 Add to Cart</button>
              )}
              <button className="pdp-buynow-btn" onClick={handleBuyNow}>Buy Now</button>
              <button className="pdp-sub-btn" onClick={() => { if (!isAuthenticated()) { setShowLogin(true); return; } setSubOpen(true); }}>
                🔄 Subscribe &amp; Save
              </button>
            </div>
            {qty > 0 && <p className="pdp-in-cart">{qty} in your cart</p>}
          </div>
        </div>

        {/* ── Body sections ── */}
        <div className="pdp-sections">

          {/* Price comparison */}
          <section className="pd-section">
            <h2 className="pd-section-title">💰 Price Comparison</h2>
            <p className="pd-section-sub">Ssaye vs. market estimates</p>

            {compLoad && <div className="pd-loading"><div className="mp-spinner" /><p>Fetching live market prices…</p></div>}
            {compErr  && <div className="pd-error"><span>⚠️</span> {compErr}</div>}

            {!compLoad && !compErr && comparison && (
              <>
                <div className={`pd-verdict ${verdictCfg.cls}`}>
                  <span className="pd-verdict-label">{verdictCfg.label}</span>
                  <span className="pd-verdict-text">{comparison.verdictText}</span>
                </div>
                <div className="pd-price-chart">
                  <PriceBar label="🛒 Ssaye Price" price={comparison.ssayePrice} ssayePrice={comparison.ssayePrice} maxPrice={maxPrice} isSSaye />
                  {marketPrices.map(m => (
                    <PriceBar key={m.source} label={m.source} price={m.price} ssayePrice={comparison.ssayePrice} maxPrice={maxPrice} isSSaye={false} />
                  ))}
                </div>
                {comparison.savings > 0 && (
                  <div className="pd-savings-banner">
                    <span className="pd-savings-icon">💸</span>
                    <span>Save <strong>${comparison.savings.toFixed(2)}</strong> ({comparison.savingsPct}%) buying from Ssaye vs. retail</span>
                  </div>
                )}
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
              </>
            )}
          </section>

          {/* Nutritional info */}
          {!compLoad && !compErr && (
            <section className="pd-section">
              <h2 className="pd-section-title">🥗 Nutritional Intelligence</h2>
              <p className="pd-section-sub">Data sourced from Open Food Facts</p>

              {off?.found ? (
                <>
                  <div className="pd-off-grid">
                    {nutriGrade && (
                      <div className="pd-nutriscore">
                        <p className="pd-nutriscore-label">Nutri-Score</p>
                        <div className="pd-nutriscore-badge" style={{ background: nutriColors[nutriGrade] ?? '#94a3b8' }}>
                          {nutriGrade.toUpperCase()}
                        </div>
                      </div>
                    )}
                    <div className="pd-off-info">
                      {off.productName && <p><strong>Matched product:</strong> {off.productName}</p>}
                      {off.brands      && <p><strong>Brand(s):</strong> {off.brands}</p>}
                      {off.quantity    && <p><strong>Quantity:</strong> {off.quantity}</p>}
                      {off.stores      && <p><strong>Sold at:</strong> {off.stores}</p>}
                    </div>
                  </div>
                  {off.nutriments && Object.keys(off.nutriments).length > 0 && (
                    <div className="pd-nutrients">
                      <p className="pd-nutrients-title">Per 100g</p>
                      <NutrientBar label="Energy"  value={off.nutriments['energy-kcal_100g']}     unit=" kcal" max={600} color="#f97316" />
                      <NutrientBar label="Protein" value={off.nutriments['proteins_100g']}         unit="g"     max={50}  color="#3b82f6" />
                      <NutrientBar label="Carbs"   value={off.nutriments['carbohydrates_100g']}    unit="g"     max={100} color="#f59e0b" />
                      <NutrientBar label="Fat"     value={off.nutriments['fat_100g']}              unit="g"     max={50}  color="#ef4444" />
                      <NutrientBar label="Fibre"   value={off.nutriments['fiber_100g']}            unit="g"     max={20}  color="#10b981" />
                      <NutrientBar label="Salt"    value={off.nutriments['salt_100g']}             unit="g"     max={5}   color="#8b5cf6" />
                    </div>
                  )}
                </>
              ) : (
                <p className="pd-no-data">No nutritional data found in the Open Food Facts database for this product.</p>
              )}
            </section>
          )}

          {/* Product details */}
          <section className="pd-section">
            <h2 className="pd-section-title">📋 Product Details</h2>
            <div className="pd-details-grid">
              <div className="pd-detail-item"><span className="pd-detail-key">Category</span><span className="pd-detail-val">{product.category}</span></div>
              <div className="pd-detail-item"><span className="pd-detail-key">Brand</span><span className="pd-detail-val">{product.brand}</span></div>
              <div className="pd-detail-item">
                <span className="pd-detail-key">Stock</span>
                <span className="pd-detail-val" style={{ color: product.stock === 'Low' ? '#f59e0b' : product.stock === 'Out of Stock' ? '#ef4444' : '#10b981' }}>
                  {product.stock}
                </span>
              </div>
              <div className="pd-detail-item"><span className="pd-detail-key">Rating</span><span className="pd-detail-val">{product.rating} / 5 ⭐</span></div>
            </div>
          </section>

          {/* Customer Reviews */}
          <section className="pd-section rev-section">
            <h2 className="pd-section-title">💬 Customer Reviews</h2>
            <p className="pd-section-sub">{reviews.length} {reviews.length === 1 ? 'review' : 'reviews'} for this product</p>

            {/* Submit form */}
            <div className="rev-form">
              <p className="rev-form-title">{isAuthenticated() ? 'Write a Review' : 'Sign in to leave a review'}</p>

              {/* Star picker */}
              <div className="rev-star-picker">
                {[1,2,3,4,5].map(s => (
                  <button
                    key={s}
                    type="button"
                    className={`rev-star-btn ${s <= (reviewHover || reviewRating) ? 'rev-star-btn--filled' : ''}`}
                    onClick={() => { if (isAuthenticated()) setReviewRating(s); else setShowLogin(true); }}
                    onMouseEnter={() => isAuthenticated() && setReviewHover(s)}
                    onMouseLeave={() => setReviewHover(0)}
                    aria-label={`${s} star`}
                  >★</button>
                ))}
                {reviewRating > 0 && (
                  <span className="rev-rating-label">
                    {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][reviewRating]}
                  </span>
                )}
              </div>

              <textarea
                className="rev-textarea"
                placeholder={isAuthenticated() ? 'Share your experience with this product…' : 'Sign in to write a review'}
                value={reviewBody}
                onChange={e => setReviewBody(e.target.value)}
                maxLength={1000}
                rows={4}
                disabled={!isAuthenticated()}
                onClick={() => { if (!isAuthenticated()) setShowLogin(true); }}
              />
              <div className="rev-form-footer">
                <span className="rev-char-count">{reviewBody.length}/1000</span>
                <button
                  className="rev-submit-btn"
                  onClick={submitReview}
                  disabled={reviewSaving || !isAuthenticated()}
                >
                  {reviewSaving ? 'Submitting…' : 'Submit Review'}
                </button>
              </div>
              {reviewErr && <p className="rev-error">{reviewErr}</p>}
              {reviewOk  && <p className="rev-success">Your review has been submitted!</p>}
            </div>

            {/* Review list */}
            {reviewsLoad ? (
              <div className="pd-loading"><div className="mp-spinner" /><p>Loading reviews…</p></div>
            ) : reviews.length === 0 ? (
              <p className="rev-empty">No reviews yet. Be the first to review this product!</p>
            ) : (
              <div className="rev-list">
                {reviews.map(r => (
                  <div key={r._id} className="rev-card">
                    <div className="rev-card-header">
                      <span className="rev-author">{r.userName}</span>
                      <span className="rev-stars">
                        {[1,2,3,4,5].map(s => (
                          <span key={s} className={s <= r.rating ? 'mp-star filled' : 'mp-star'}>★</span>
                        ))}
                      </span>
                      <span className="rev-date">{new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <p className="rev-body">{r.body}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>
        </div>{/* end pdp-main */}
      </div>

      {/* ── Login prompt ── */}
      {showLogin && (
        <div className="mp-modal-overlay" onClick={() => setShowLogin(false)}>
          <div className="mp-modal" onClick={e => e.stopPropagation()}>
            <button className="mp-modal-close" onClick={() => setShowLogin(false)}>✕</button>
            <div className="mp-modal-icon">🔒</div>
            <h2 className="mp-modal-title">Sign in to continue</h2>
            <p className="mp-modal-body">You need a Ssaye account to add products to your cart and place orders.</p>
            <div className="mp-modal-actions">
              <button className="mp-modal-btn-primary" onClick={() => navigate('/login')}>Sign In</button>
              <button className="mp-modal-btn-secondary" onClick={() => setShowLogin(false)}>Continue Browsing</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Buy Now confirm ── */}
      {buyNowOpen && (
        <div className="mp-modal-overlay" onClick={() => setBuyNowOpen(false)}>
          <div className="mp-modal" onClick={e => e.stopPropagation()}>
            <button className="mp-modal-close" onClick={() => setBuyNowOpen(false)}>✕</button>
            <div className="mp-modal-icon">{product.emoji}</div>
            <h2 className="mp-modal-title">Confirm Order</h2>
            <p className="mp-modal-body"><strong>{product.name}</strong><br />Total: <strong>${product.price.toFixed(2)}</strong></p>
            {placeErr && <p className="mp-checkout-error">{placeErr}</p>}
            <div className="mp-modal-actions">
              <button className="mp-buy-now-confirm-btn" onClick={placeBuyNow} disabled={placing}>{placing ? 'Placing…' : 'Place Order'}</button>
              <button className="mp-modal-btn-secondary" onClick={() => setBuyNowOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Order success ── */}
      {buyNowDone && (
        <div className="mp-modal-overlay">
          <div className="mp-modal">
            <div className="mp-modal-icon">🎉</div>
            <h2 className="mp-modal-title">Order Placed!</h2>
            <p className="mp-modal-body">Order <strong>#{buyNowDone.orderNumber}</strong> confirmed.<br />Total: <strong>${buyNowDone.total?.toFixed(2)}</strong></p>
            <div className="mp-modal-actions">
              <button className="mp-modal-btn-primary" onClick={() => { setBuyNowDone(null); navigate('/marketplace'); }}>Continue Shopping</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Subscribe & Save modal ── */}
      {subOpen && product && (
        <SubscribeModal
          product={product}
          token={token}
          onClose={() => setSubOpen(false)}
          onSuccess={(sub) => { setSubOpen(false); setSubDone(sub); }}
        />
      )}

      {/* ── Subscription confirmed ── */}
      {subDone && (
        <div className="mp-modal-overlay">
          <div className="mp-modal" onClick={e => e.stopPropagation()}>
            <div className="mp-modal-icon">🔄</div>
            <h2 className="mp-modal-title">Subscribed!</h2>
            <p className="mp-modal-body">
              <strong>{subDone.subscriptionNumber}</strong> is active.<br />
              {FREQUENCIES.find(f => f.value === subDone.frequency)?.label} · {new Date(subDone.startDate).toLocaleDateString()} → {new Date(subDone.endDate).toLocaleDateString()}
            </p>
            <div className="mp-modal-actions">
              <button className="mp-modal-btn-primary" onClick={() => { setSubDone(null); navigate('/marketplace'); }}>Continue Shopping</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
