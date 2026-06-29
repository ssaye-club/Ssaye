import React, { useState, useMemo, useContext, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Marketplace.css';

const API_URL = process.env.REACT_APP_API_URL || '';

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

// ─── Buy Now Modal ────────────────────────────────────────────────────────────
function BuyNowModal({ product, quantity, onClose, onSuccess }) {
  const { token } = useContext(AuthContext);
  const [placing, setPlacing] = useState(false);
  const [error,   setError]   = useState(null);

  const handleConfirm = async () => {
    setPlacing(true);
    setError(null);
    try {

      const res = await fetch(`${API_URL}/api/marketplace-orders`, {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: [{
            productId: product.id,
            name:      product.name,
            brand:     product.brand,
            category:  product.category,
            emoji:     product.emoji,
            price:     product.price,
            quantity,
          }],
        }),
      });
      const data = await res.json();
      if (data.success) {
        onSuccess(data.order);
      } else {
        setError(data.message || 'Could not place your order. Please try again.');
      }
    } catch {
      setError('Could not reach the server. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="mp-modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="bn-modal-title">
      <div className="mp-modal" onClick={(e) => e.stopPropagation()}>
        <button className="mp-modal-close" onClick={onClose} aria-label="Close">✕</button>
        <div className="mp-modal-icon">{product.emoji}</div>
        <h2 className="mp-modal-title" id="bn-modal-title">Confirm Order</h2>
        <p className="mp-modal-body">
          <strong>{product.name}</strong><br />
          Qty: {quantity} · Total: <strong>${(product.price * quantity).toFixed(2)}</strong>
        </p>
        {error && <p className="mp-checkout-error" style={{ marginBottom: '0.75rem' }}>{error}</p>}
        <div className="mp-modal-actions">
          <button className="mp-buy-now-confirm-btn" onClick={handleConfirm} disabled={placing}>
            {placing ? 'Placing Order…' : 'Place Order'}
          </button>
          <button className="mp-modal-btn-secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ─── Buy Now Confirmation Screen ──────────────────────────────────────────────
function BuyNowSuccess({ order, onClose }) {
  return (
    <div className="mp-modal-overlay" role="dialog" aria-modal="true">
      <div className="mp-modal" onClick={(e) => e.stopPropagation()}>
        <div className="mp-modal-icon">🎉</div>
        <h2 className="mp-modal-title">Order Placed!</h2>
        <p className="mp-modal-body">
          Order <strong>#{order.orderNumber}</strong> has been placed.<br />
          Total: <strong>${order.total?.toFixed(2)}</strong>
        </p>
        <div className="mp-modal-actions">
          <button className="mp-modal-btn-primary" onClick={onClose}>Continue Shopping</button>
        </div>
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
function ProductCard({ product, qty, onAdd, onRemove, onViewDetails, onBuyNow, isWishlisted, onToggleWishlist }) {
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
          className={`mp-card-heart${isWishlisted ? ' mp-card-heart--active' : ''}`}
          onClick={(e) => { e.stopPropagation(); onToggleWishlist(product); }}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
        >
          <svg width="18" height="18" viewBox="0 0 24 24"
            fill={isWishlisted ? 'currentColor' : 'none'}
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

        {/* Quantity stepper or Add + Buy Now buttons */}
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
        <button
          className="mp-buy-now-btn"
          onClick={() => onBuyNow(product)}
          aria-label={`Buy ${product.name} now`}
        >
          Buy Now
        </button>
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

// ─── Suggested For You strip ──────────────────────────────────────────────────
function SuggestedForYou({ products, cart, onAdd, onRemove, onViewDetails, onBuyNow }) {
  if (!products || products.length === 0) return null;

  return (
    <div className="mp-suggestions">
      <div className="mp-suggestions-header">
        <span className="mp-suggestions-icon">✨</span>
        <h2 className="mp-suggestions-title">Suggested For You</h2>
        <span className="mp-suggestions-sub">Based on your searches &amp; purchases</span>
      </div>
      <div className="mp-suggestions-track">
        {products.map((p) => {
          const qty = cart[p.id] || 0;
          const discount = p.originalPrice
            ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
            : null;
          return (
            <div key={p.id} className="mp-sug-card">
              <div className="mp-sug-img" onClick={() => onViewDetails(p)}>
                {discount && <span className="mp-badge mp-badge-sale mp-sug-badge">{discount}% OFF</span>}
                {p.imageUrl
                  ? <img src={p.imageUrl} alt={p.name} className="mp-product-img" onError={(e) => { e.currentTarget.style.display='none'; }} />
                  : <span className="mp-emoji" role="img" aria-label={p.name}>{p.emoji}</span>
                }
              </div>
              <div className="mp-sug-body">
                <p className="mp-brand">{p.brand}</p>
                <p className="mp-sug-name" onClick={() => onViewDetails(p)}>{p.name}</p>
                <p className="mp-sug-price">${p.price.toFixed(2)}</p>
                {qty > 0 ? (
                  <div className="mp-qty-row mp-sug-qty">
                    <button className="mp-qty-btn" onClick={() => onRemove(p.id)}>−</button>
                    <span className="mp-qty-count">{qty}</span>
                    <button className="mp-qty-btn mp-qty-btn--add" onClick={() => onAdd(p)}>+</button>
                  </div>
                ) : (
                  <button className="mp-sug-add" onClick={() => onAdd(p)}>Add to Cart</button>
                )}
                <button className="mp-buy-now-btn mp-sug-buynow" onClick={() => onBuyNow(p)}>Buy Now</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
function readCart()      { try { return JSON.parse(localStorage.getItem('ssaye_cart') || '{}'); } catch { return {}; } }
function writeCart(cart) { localStorage.setItem('ssaye_cart', JSON.stringify(cart)); }

function Marketplace() {
  const { isAuthenticated, token } = useContext(AuthContext);
  const navigate = useNavigate();

  const [activeCategory,    setActiveCategory]    = useState("All Products");
  const [searchQuery,       setSearchQuery]       = useState("");
  const [sortBy,            setSortBy]            = useState("popular");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [showCart,          setShowCart]          = useState(false);
  const [showLoginPrompt,   setShowLoginPrompt]   = useState(false);
  const [buyNowProduct,     setBuyNowProduct]     = useState(null);
  const [buyNowOrder,       setBuyNowOrder]       = useState(null);

  // cart: { [productId]: quantity } — persisted in localStorage so ProductDetail page shares it
  const [cart, setCart] = useState(readCart);

  const [products,     setProducts]     = useState([]);
  const [loadingProds, setLoadingProds] = useState(true);
  const [prodError,    setProdError]    = useState(null);
  const [totalCount,   setTotalCount]   = useState(0);
  const [currentPage,  setCurrentPage]  = useState(1);
  const [totalPages,   setTotalPages]   = useState(1);
  const [categoryCounts, setCategoryCounts] = useState({});

  const [suggestions, setSuggestions] = useState([]);
  const [fuzzySuggestion, setFuzzySuggestion] = useState(null);
  const [wishlist, setWishlist] = useState(new Set()); // Set of productIds

  // Persist cart to localStorage whenever it changes
  useEffect(() => { writeCart(cart); }, [cart]);

  // Clear in-memory cart immediately when user logs out
  useEffect(() => {
    if (!token) setCart({});
  }, [token]);

  // Read ?cart=1 and ?category=X query params set by ProductDetail page
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('cart') === '1') setShowCart(true);
    const cat = params.get('category');
    if (cat && CATEGORIES.includes(cat)) setActiveCategory(cat);
    if (params.toString()) window.history.replaceState({}, '', '/marketplace');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch one page of products whenever filters/sort/page change
  const fetchProductsRef = useRef(null);
  useEffect(() => {
    setLoadingProds(true);
    setProdError(null);

    const params = new URLSearchParams({ page: currentPage, limit: 40, sort: sortBy });
    if (activeCategory !== 'All Products') params.set('category', activeCategory);
    if (searchQuery.trim()) params.set('search', searchQuery.trim());

    // Debounce: wait 350ms after last change before firing (avoids rapid requests while typing)
    clearTimeout(fetchProductsRef.current);
    fetchProductsRef.current = setTimeout(() => {
      // Helper function with timeout
      const fetchWithTimeout = (url, timeout = 10000) => {
        return Promise.race([
          fetch(url).then(r => {
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            return r.json();
          }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), timeout)
          ),
        ]);
      };

      Promise.all([
        fetchWithTimeout(`${API_URL}/api/products?${params}`),
        fetchWithTimeout(`${API_URL}/api/products/category-counts${searchQuery.trim() ? `?search=${encodeURIComponent(searchQuery.trim())}` : ''}`),
      ])
        .then(async ([data, catData]) => {
          if (data && data.success) {
            setProducts(data.products || []);
            setTotalCount(data.total || 0);
            setTotalPages(data.pages || 1);
            // If no results and user typed a search query, try fuzzy suggestion
            if (data.total === 0 && searchQuery.trim().length >= 2) {
              try {
                const fuzzyRes = await fetchWithTimeout(`${API_URL}/api/products/fuzzy-suggest?q=${encodeURIComponent(searchQuery.trim())}`);
                setFuzzySuggestion(fuzzyRes.success ? fuzzyRes.suggestion : null);
              } catch {
                setFuzzySuggestion(null);
              }
            } else {
              setFuzzySuggestion(null);
            }
            setProdError(null);
          } else {
            setProdError('Failed to load products. Please try again.');
            setProducts([]);
          }
          if (catData && catData.success && catData.counts) {
            setCategoryCounts(catData.counts);
          } else {
            console.warn('Category counts failed to load:', catData);
            setCategoryCounts({});
          }
        })
        .catch((error) => {
          console.error('Products fetch error:', error);
          setProdError('Could not connect to the server. Please check your connection and try again.');
          setProducts([]);
          setCategoryCounts({});
        })
        .finally(() => setLoadingProds(false));
    }, searchQuery.trim() ? 350 : 0);

    return () => clearTimeout(fetchProductsRef.current);
  }, [activeCategory, searchQuery, sortBy, currentPage, API_URL]);

  // Reset to page 1 whenever filters or sort change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, searchQuery, sortBy]);

  // Fetch wishlist whenever auth state changes
  useEffect(() => {
    if (!isAuthenticated() || !token) { setWishlist(new Set()); return; }
    fetch(`${API_URL}/api/wishlist`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.success) setWishlist(new Set(d.items.map(i => i.productId))); })
      .catch(() => {});
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleWishlist = async (product) => {
    if (!isAuthenticated()) { setShowLoginPrompt(true); return; }
    const isWishlisted = wishlist.has(product.id);
    // Optimistic update
    setWishlist(prev => {
      const next = new Set(prev);
      isWishlisted ? next.delete(product.id) : next.add(product.id);
      return next;
    });
    try {
      if (isWishlisted) {
        await fetch(`${API_URL}/api/wishlist/${product.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await fetch(`${API_URL}/api/wishlist`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            productId: product.id,
            name: product.name,
            brand: product.brand,
            category: product.category,
            price: product.price,
            emoji: product.emoji,
            imageUrl: product.imageUrl || null,
          }),
        });
      }
    } catch {
      // Revert optimistic update on failure
      setWishlist(prev => {
        const next = new Set(prev);
        isWishlisted ? next.add(product.id) : next.delete(product.id);
        return next;
      });
    }
  };

  // Fetch recommendations whenever auth state changes (login / logout)
  useEffect(() => {
    if (!isAuthenticated() || !token) { setSuggestions([]); return; }
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    
    fetch(`${API_URL}/api/recommendations`, { 
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal
    })
      .then((r) => {
        clearTimeout(timeoutId);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => { if (d.success && Array.isArray(d.products)) setSuggestions(d.products); })
      .catch((error) => {
        clearTimeout(timeoutId);
        console.warn('Failed to load recommendations:', error);
      });

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [token, API_URL]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounce search recording — fire after user stops typing for 1.5 s
  const searchDebounceRef = useRef(null);
  const recordSearch = (keyword) => {
    if (!isAuthenticated() || !token || !keyword.trim()) return;
    clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      fetch(`${API_URL}/api/products/search-activity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ keyword: keyword.trim() }),
        signal: controller.signal,
      })
        .catch((error) => {
          // Silently fail for analytics endpoint
          console.debug('Search activity record failed (non-critical):', error);
        })
        .finally(() => clearTimeout(timeoutId));
    }, 1500);
  };

  const addToCart = (product) => {
    if (!isAuthenticated()) { setShowLoginPrompt(true); return; }
    setCart((prev) => ({ ...prev, [product.id]: (prev[product.id] || 0) + 1 }));
  };

  const removeFromCart = (productId) => {
    setCart((prev) => {
      const newQty = (prev[productId] || 0) - 1;
      if (newQty <= 0) { const next = { ...prev }; delete next[productId]; return next; }
      return { ...prev, [productId]: newQty };
    });
  };

  const clearCartItem = (productId) => {
    setCart((prev) => { const next = { ...prev }; delete next[productId]; return next; });
  };

  const clearCart = () => setCart({});

  const handleBuyNow = (product) => {
    if (!isAuthenticated()) { setShowLoginPrompt(true); return; }
    setBuyNowProduct({ product, quantity: 1 });
  };

  const totalQty = Object.values(cart).reduce((s, q) => s + q, 0);

  // ── Cart view ──
  if (showCart) {
    return (
      <div className="mp-page">
        <section className="mp-hero">
          <div className="mp-hero-content">
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

        {/* Backdrop — closes sidebar when tapping outside on mobile */}
        {mobileFiltersOpen && (
          <div className="mp-sidebar-backdrop" onClick={() => setMobileFiltersOpen(false)} aria-hidden="true" />
        )}

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
          {/* Suggestions strip — only shown when not actively filtering */}
          {!searchQuery && activeCategory === "All Products" && (
            <SuggestedForYou
              products={suggestions}
              cart={cart}
              onAdd={addToCart}
              onRemove={removeFromCart}
              onViewDetails={(p) => navigate(`/product/${p.id}`)}
              onBuyNow={handleBuyNow}
            />
          )}

          <div className="mp-toolbar">
            {/* Search bar — left side */}
            <div className="mp-toolbar-search">
              <span className="mp-toolbar-search-icon">🔍</span>
              <input
                type="text"
                className="mp-toolbar-search-input"
                placeholder="Search products…"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setActiveCategory("All Products"); recordSearch(e.target.value); }}
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
                {totalCount.toLocaleString()} product{totalCount !== 1 ? "s" : ""}
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

          {prodError ? (
            <div className="mp-empty">
              <span className="mp-empty-icon">⚠️</span>
              <h3>Something went wrong</h3>
              <p>{prodError}</p>
              <button className="mp-empty-reset" onClick={() => window.location.reload()}>Try Again</button>
            </div>
          ) : !loadingProds && products.length === 0 ? (
            <div className="mp-empty">
              <span className="mp-empty-icon">🛍️</span>
              <h3>No products found</h3>
              {fuzzySuggestion ? (
                <p>
                  Did you mean{' '}
                  <button
                    className="mp-fuzzy-suggestion"
                    onClick={() => { setSearchQuery(fuzzySuggestion); setFuzzySuggestion(null); }}
                  >
                    "{fuzzySuggestion}"
                  </button>
                  ?
                </p>
              ) : (
                <p>Try a different category or search term</p>
              )}
              <button className="mp-empty-reset" onClick={() => { setSearchQuery(""); setActiveCategory("All Products"); setFuzzySuggestion(null); }}>
                Show All Products
              </button>
            </div>
          ) : (
            <div style={{ opacity: loadingProds ? 0.5 : 1, transition: 'opacity 0.15s' }}>
              <div className="mp-grid">
                {products.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    qty={cart[p.id] || 0}
                    onAdd={addToCart}
                    onRemove={removeFromCart}
                    onViewDetails={(p) => navigate(`/product/${p.id}`)}
                    onBuyNow={handleBuyNow}
                    isWishlisted={wishlist.has(p.id)}
                    onToggleWishlist={toggleWishlist}
                  />
                ))}
              </div>

              {/* ── Pagination ── */}
              {totalPages > 1 && (
                <div className="mp-pagination">
                  <button
                    className="mp-page-btn"
                    onClick={() => setCurrentPage(p => p - 1)}
                    disabled={currentPage === 1 || loadingProds}
                  >‹ Prev</button>

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
                    return start + i;
                  }).map(n => (
                    <button
                      key={n}
                      className={`mp-page-btn ${n === currentPage ? 'mp-page-btn--active' : ''}`}
                      onClick={() => setCurrentPage(n)}
                      disabled={loadingProds}
                    >{n}</button>
                  ))}

                  <button
                    className="mp-page-btn"
                    onClick={() => setCurrentPage(p => p + 1)}
                    disabled={currentPage === totalPages || loadingProds}
                  >Next ›</button>

                  <span className="mp-page-info">
                    {totalCount.toLocaleString()} products · page {currentPage}/{totalPages}
                  </span>
                </div>
              )}
            </div>
          )}
        </main>
      </div>


      {buyNowProduct && !buyNowOrder && (
        <BuyNowModal
          product={buyNowProduct.product}
          quantity={buyNowProduct.quantity}
          onClose={() => setBuyNowProduct(null)}
          onSuccess={(order) => { setBuyNowProduct(null); setBuyNowOrder(order); }}
        />
      )}

      {buyNowOrder && (
        <BuyNowSuccess
          order={buyNowOrder}
          onClose={() => setBuyNowOrder(null)}
        />
      )}
    </div>
  );
}

export default Marketplace;
