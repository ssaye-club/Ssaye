import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './VendorDashboard.css';

const API_URL = process.env.REACT_APP_API_URL || '';

const CATEGORIES = [
  'Dal & Lentils','Rice & Grains','Spices & Masala','Atta & Flour','Oils & Ghee',
  'Snacks & Namkeen','Pickles & Chutneys','Frozen Foods','Dairy & Paneer',
  'Tea, Coffee & Drinks','Sweets & Mithai','Fresh Produce','Meat & Seafood','Pooja Items',
];

const CATEGORY_EMOJI = {
  'Dal & Lentils':'🫘','Rice & Grains':'🌾','Spices & Masala':'🌶️','Atta & Flour':'🌾',
  'Oils & Ghee':'🫙','Snacks & Namkeen':'🍿','Pickles & Chutneys':'🥭','Frozen Foods':'❄️',
  'Dairy & Paneer':'🧀','Tea, Coffee & Drinks':'☕','Sweets & Mithai':'🍮',
  'Fresh Produce':'🥬','Meat & Seafood':'🥩','Pooja Items':'🪔',
};

const STOCK_COLORS = {
  'In Stock': '#10b981',
  'Low':      '#f59e0b',
  'Out of Stock': '#ef4444',
};

// ── CSV parser (no external library) ─────────────────────────────────────────
function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const rows = lines.slice(1).map(line => {
    const values = [];
    let cur = '', inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') { inQ = !inQ; }
      else if (c === ',' && !inQ) { values.push(cur.trim()); cur = ''; }
      else { cur += c; }
    }
    values.push(cur.trim());
    return Object.fromEntries(headers.map((h, i) => [h, (values[i] || '').replace(/^"|"$/g, '').trim()]));
  }).filter(r => Object.values(r).some(v => v !== ''));
  return { headers, rows };
}

const CSV_COLUMNS = ['ItemName', 'Brand', 'Category', 'Price', 'OriginalPrice', 'Unit', 'Stock', 'Description', 'Badge'];
const CSV_REQUIRED = ['ItemName', 'Brand', 'Category', 'Price'];

// ── CSV Import component ──────────────────────────────────────────────────────
function CSVImport({ token, onDone }) {
  const fileRef  = useRef(null);
  const [step,      setStep]      = useState('idle'); // idle | preview | uploading | result
  const [fileName,  setFileName]  = useState('');
  const [headers,   setHeaders]   = useState([]);
  const [mapping,   setMapping]   = useState({});
  const [rows,      setRows]      = useState([]);
  const [result,    setResult]    = useState(null);
  const [error,     setError]     = useState('');
  const [dragging,  setDragging]  = useState(false);

  const processFile = useCallback((file) => {
    if (!file || !file.name.endsWith('.csv')) {
      setError('Please upload a .csv file');
      return;
    }
    setError('');
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const { headers: h, rows: r } = parseCSV(e.target.result);
      if (!h.length || !r.length) { setError('CSV appears empty or malformed'); return; }
      setHeaders(h);
      setRows(r);
      // Auto-map: match CSV header to expected column by exact or case-insensitive match
      const autoMap = {};
      CSV_COLUMNS.forEach(col => {
        const match = h.find(hh => hh.toLowerCase() === col.toLowerCase()
          || hh.toLowerCase() === (col === 'ItemName' ? 'name' : col.toLowerCase())
          || hh.toLowerCase() === (col === 'Price' ? 'price' : col.toLowerCase()));
        autoMap[col] = match || '';
      });
      setMapping(autoMap);
      setStep('preview');
    };
    reader.readAsText(file);
  }, []);

  const handleFilePick = (e) => processFile(e.target.files[0]);
  const handleDrop     = (e) => { e.preventDefault(); setDragging(false); processFile(e.dataTransfer.files[0]); };
  const handleDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave= ()  => setDragging(false);

  const previewProducts = rows.map(row => ({
    name:          row[mapping.ItemName]     || '',
    brand:         row[mapping.Brand]        || '',
    category:      row[mapping.Category]     || '',
    price:         row[mapping.Price]        || '',
    originalPrice: row[mapping.OriginalPrice]|| '',
    unit:          row[mapping.Unit]         || '',
    stock:         row[mapping.Stock]        || 'In Stock',
    description:   row[mapping.Description] || '',
    badge:         row[mapping.Badge]        || '',
  }));

  const missingRequired = CSV_REQUIRED.filter(col => !mapping[col]);

  const handleUpload = async () => {
    if (missingRequired.length) { setError(`Map required columns: ${missingRequired.join(', ')}`); return; }
    setStep('uploading');
    setError('');
    try {
      const res  = await fetch(`${API_URL}/api/vendor/products/bulk`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ products: previewProducts }),
      });
      const data = await res.json();
      if (!data.success && !data.inserted) {
        setError(data.message || 'Upload failed');
        setStep('preview');
        return;
      }
      setResult(data);
      setStep('result');
    } catch {
      setError('Could not reach the server');
      setStep('preview');
    }
  };

  const reset = () => {
    setStep('idle'); setFileName(''); setHeaders([]); setMapping({});
    setRows([]); setResult(null); setError('');
    if (fileRef.current) fileRef.current.value = '';
  };

  if (step === 'result') {
    return (
      <div className="vd-csv-result">
        <div className="vd-csv-result-icon">✅</div>
        <h3>Import Complete</h3>
        <p><strong>{result.inserted}</strong> product{result.inserted !== 1 ? 's' : ''} added to the marketplace.</p>
        {result.skipped > 0 && <p className="vd-csv-warn">{result.skipped} row{result.skipped !== 1 ? 's' : ''} skipped due to errors.</p>}
        {result.errors?.length > 0 && (
          <details className="vd-csv-error-list">
            <summary>View row errors ({result.errors.length})</summary>
            <ul>{result.errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
          </details>
        )}
        <div className="vd-csv-result-actions">
          <button className="vd-csv-btn vd-csv-btn--secondary" onClick={reset}>Import Another File</button>
          <button className="vd-csv-btn" onClick={() => { reset(); onDone(); }}>View Products</button>
        </div>
      </div>
    );
  }

  if (step === 'preview' || step === 'uploading') {
    return (
      <div className="vd-csv-preview">
        <div className="vd-csv-preview-header">
          <span className="vd-csv-filename">📄 {fileName}</span>
          <span className="vd-csv-rowcount">{rows.length} row{rows.length !== 1 ? 's' : ''} detected</span>
        </div>

        <h4 className="vd-csv-map-title">Map CSV Columns</h4>
        <p className="vd-csv-map-hint">Match your CSV headers to the required product fields.</p>
        <div className="vd-csv-mapping">
          {CSV_COLUMNS.map(col => (
            <div key={col} className="vd-csv-map-row">
              <span className="vd-csv-map-field">{col}{CSV_REQUIRED.includes(col) ? ' *' : ''}</span>
              <select
                value={mapping[col] || ''}
                onChange={e => setMapping(m => ({ ...m, [col]: e.target.value }))}
                className="vd-csv-map-select"
              >
                <option value="">(skip)</option>
                {headers.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          ))}
        </div>

        {error && <div className="vd-csv-error">{error}</div>}

        <h4 className="vd-csv-preview-title">Preview (first 5 rows)</h4>
        <div className="vd-csv-table-wrap">
          <table className="vd-csv-table">
            <thead>
              <tr>
                <th>Name</th><th>Brand</th><th>Category</th><th>Price</th><th>Stock</th>
              </tr>
            </thead>
            <tbody>
              {previewProducts.slice(0, 5).map((p, i) => (
                <tr key={i} className={!p.name || !p.brand || !p.category || !p.price ? 'vd-csv-row--warn' : ''}>
                  <td>{p.name || <span className="vd-csv-missing">—</span>}</td>
                  <td>{p.brand || <span className="vd-csv-missing">—</span>}</td>
                  <td>{p.category || <span className="vd-csv-missing">—</span>}</td>
                  <td>{p.price ? `$${p.price}` : <span className="vd-csv-missing">—</span>}</td>
                  <td>{p.stock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="vd-csv-preview-actions">
          <button className="vd-csv-btn vd-csv-btn--secondary" onClick={reset} disabled={step === 'uploading'}>
            Cancel
          </button>
          <button
            className="vd-csv-btn"
            onClick={handleUpload}
            disabled={step === 'uploading' || missingRequired.length > 0}
          >
            {step === 'uploading' ? 'Uploading…' : `Import ${rows.length} Products`}
          </button>
        </div>
      </div>
    );
  }

  // idle state — drop zone
  return (
    <div className="vd-csv-zone">
      <div
        className={`vd-csv-dropzone ${dragging ? 'vd-csv-dropzone--dragging' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileRef.current?.click()}
      >
        <input type="file" accept=".csv" ref={fileRef} style={{ display: 'none' }} onChange={handleFilePick} />
        <span className="vd-csv-icon">📊</span>
        <p className="vd-csv-drop-title">Drop your CSV file here</p>
        <p className="vd-csv-drop-hint">or click to browse</p>
      </div>

      {error && <div className="vd-csv-error">{error}</div>}

      <div className="vd-csv-format-hint">
        <strong>Expected columns:</strong> ItemName, Brand, Category, Price, OriginalPrice, Unit, Stock, Description, Badge
        <br />
        <strong>Required:</strong> ItemName, Brand, Category, Price &nbsp;·&nbsp;
        <strong>Stock values:</strong> In Stock / Low / Out of Stock
        <br />
        <strong>Categories:</strong> {CATEGORIES.join(', ')}
      </div>
    </div>
  );
}

// ── Pricing rule helpers ──────────────────────────────────────────────────────
function isoDate(d) {
  // Convert a Date/ISO-string to yyyy-mm-dd for <input type="date">
  if (!d) return '';
  return new Date(d).toISOString().slice(0, 10);
}

function ruleIsActiveNow(rule) {
  const now = new Date();
  const after  = !rule.startDate || new Date(rule.startDate) <= now;
  const before = !rule.endDate   || new Date(rule.endDate)   >= now;
  return after && before;
}

const EMPTY_RULE = { price: '', minQty: 1, maxQty: '', startDate: '', endDate: '', label: '', noEndDate: true };

function PricingRulesEditor({ rules, onChange }) {
  const addRule = () => onChange([...rules, { ...EMPTY_RULE }]);

  const update = (i, key, val) => {
    const next = rules.map((r, idx) => idx === i ? { ...r, [key]: val } : r);
    onChange(next);
  };

  const remove = (i) => onChange(rules.filter((_, idx) => idx !== i));

  return (
    <div className="vpf-pricing">
      <div className="vpf-pricing-header">
        <span className="vpf-pricing-title">Pricing Rules</span>
        <span className="vpf-pricing-hint">Override the base price by quantity or date. Rules are applied in order — first matching rule wins.</span>
      </div>

      {rules.length === 0 && (
        <p className="vpf-pricing-empty">No rules yet — the base price applies to all orders.</p>
      )}

      {rules.map((rule, i) => {
        const active = ruleIsActiveNow(rule);
        return (
          <div key={i} className={`vpf-rule ${active ? 'vpf-rule--active' : ''}`}>
            <div className="vpf-rule-header">
              <span className="vpf-rule-num">Rule {i + 1}</span>
              {active && <span className="vpf-rule-live">● Active now</span>}
              <button type="button" className="vpf-rule-remove" onClick={() => remove(i)} title="Remove rule">✕</button>
            </div>

            <div className="vpf-rule-grid">
              {/* Price */}
              <div className="vpf-rule-field">
                <label>Price (USD) *</label>
                <input
                  type="number" min="0" step="0.01"
                  value={rule.price}
                  onChange={e => update(i, 'price', e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>

              {/* Qty range */}
              <div className="vpf-rule-field">
                <label>Min Qty</label>
                <input
                  type="number" min="1"
                  value={rule.minQty}
                  onChange={e => update(i, 'minQty', e.target.value)}
                  placeholder="1"
                />
              </div>
              <div className="vpf-rule-field">
                <label>Max Qty <span className="vpf-rule-optional">(blank = unlimited)</span></label>
                <input
                  type="number" min="1"
                  value={rule.maxQty}
                  onChange={e => update(i, 'maxQty', e.target.value)}
                  placeholder="unlimited"
                />
              </div>

              {/* Label */}
              <div className="vpf-rule-field vpf-rule-field--wide">
                <label>Label <span className="vpf-rule-optional">(e.g. "Bulk Deal", "Diwali Sale")</span></label>
                <input
                  type="text"
                  value={rule.label}
                  onChange={e => update(i, 'label', e.target.value)}
                  placeholder="Optional display label"
                />
              </div>

              {/* Date range */}
              <div className="vpf-rule-field">
                <label>Start Date <span className="vpf-rule-optional">(blank = immediately)</span></label>
                <input
                  type="date"
                  value={rule.startDate}
                  onChange={e => update(i, 'startDate', e.target.value)}
                />
              </div>

              <div className="vpf-rule-field">
                <label>End Date</label>
                <input
                  type="date"
                  value={rule.noEndDate ? '' : rule.endDate}
                  onChange={e => update(i, 'endDate', e.target.value)}
                  disabled={!!rule.noEndDate}
                  placeholder="Never"
                />
                <label className="vpf-rule-checkbox">
                  <input
                    type="checkbox"
                    checked={!!rule.noEndDate}
                    onChange={e => update(i, 'noEndDate', e.target.checked)}
                  />
                  No end date (endless)
                </label>
              </div>
            </div>
          </div>
        );
      })}

      <button type="button" className="vpf-rule-add" onClick={addRule}>
        + Add Pricing Rule
      </button>
    </div>
  );
}

function ProductForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial || {
    name:'', brand:'', category: CATEGORIES[0], price:'', originalPrice:'',
    unit:'', stock:'In Stock', description:'', emoji:'🛒', imageUrl:'', badge:'',
  });
  const [imageMode,    setImageMode]    = useState('url'); // 'url' | 'upload'
  const [imagePreview, setImagePreview] = useState(initial?.imageData || initial?.imageUrl || null);
  const [imageData,    setImageData]    = useState(null);
  const fileRef = useRef(null);

  // Normalise pricingRules from the server (Date objects → strings for inputs)
  const [rules, setRules] = useState(() => {
    const raw = initial?.pricingRules || [];
    return raw.map(r => ({
      price:     r.price ?? '',
      minQty:    r.minQty ?? 1,
      maxQty:    r.maxQty ?? '',
      startDate: isoDate(r.startDate),
      endDate:   isoDate(r.endDate),
      label:     r.label || '',
      noEndDate: !r.endDate,
    }));
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImageData(ev.target.result);
      setImagePreview(ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Serialise rules: strip helper field, coerce types, null-ify blanks
    const pricingRules = rules.map(r => ({
      price:     parseFloat(r.price),
      minQty:    parseInt(r.minQty, 10) || 1,
      maxQty:    r.maxQty ? parseInt(r.maxQty, 10) : null,
      startDate: r.startDate || null,
      endDate:   r.noEndDate ? null : (r.endDate || null),
      label:     r.label || '',
    }));

    onSave({
      ...form,
      price:         parseFloat(form.price),
      originalPrice: form.originalPrice ? parseFloat(form.originalPrice) : null,
      emoji:         CATEGORY_EMOJI[form.category] || form.emoji || '🛒',
      imageUrl:      imageMode === 'url' ? (form.imageUrl || null) : null,
      imageData:     imageMode === 'upload' ? (imageData || null) : null,
      badge:         form.badge || null,
      pricingRules,
    });
  };

  return (
    <form className="vpf-form" onSubmit={handleSubmit}>
      <div className="vpf-row">
        <div className="vpf-field">
          <label>Product Name *</label>
          <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Tilda Basmati 5kg" required />
        </div>
        <div className="vpf-field">
          <label>Brand *</label>
          <input value={form.brand} onChange={e => set('brand', e.target.value)} placeholder="e.g. Tilda" required />
        </div>
      </div>

      <div className="vpf-row">
        <div className="vpf-field">
          <label>Category *</label>
          <select value={form.category} onChange={e => set('category', e.target.value)} required>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="vpf-field">
          <label>Unit / Size</label>
          <input value={form.unit} onChange={e => set('unit', e.target.value)} placeholder="e.g. 5kg, 500g, per piece" />
        </div>
      </div>

      <div className="vpf-row">
        <div className="vpf-field">
          <label>Base Price (USD) *</label>
          <input type="number" min="0" step="0.01" value={form.price} onChange={e => set('price', e.target.value)} placeholder="0.00" required />
        </div>
        <div className="vpf-field">
          <label>Original Price <span className="vpf-rule-optional">(for strike-through)</span></label>
          <input type="number" min="0" step="0.01" value={form.originalPrice} onChange={e => set('originalPrice', e.target.value)} placeholder="0.00" />
        </div>
        <div className="vpf-field">
          <label>Stock Status</label>
          <select value={form.stock} onChange={e => set('stock', e.target.value)}>
            <option value="In Stock">In Stock</option>
            <option value="Low">Low Stock</option>
            <option value="Out of Stock">Out of Stock</option>
          </select>
        </div>
        <div className="vpf-field">
          <label>Badge</label>
          <select value={form.badge} onChange={e => set('badge', e.target.value)}>
            <option value="">None</option>
            <option value="Organic">Organic</option>
            <option value="Fresh">Fresh</option>
            <option value="Halal">Halal</option>
            <option value="Low">Low Stock</option>
          </select>
        </div>
      </div>

      <div className="vpf-field">
        <label>Description</label>
        <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} placeholder="Brief product description (optional)" />
      </div>

      {/* Image */}
      <div className="vpf-field">
        <label>Product Image</label>
        <div className="vpf-image-toggle">
          <button type="button" className={`vpf-img-mode ${imageMode==='url'?'vpf-img-mode--active':''}`} onClick={() => setImageMode('url')}>URL</button>
          <button type="button" className={`vpf-img-mode ${imageMode==='upload'?'vpf-img-mode--active':''}`} onClick={() => setImageMode('upload')}>Upload File</button>
        </div>
        {imageMode === 'url' ? (
          <input
            value={form.imageUrl}
            onChange={e => { set('imageUrl', e.target.value); setImagePreview(e.target.value || null); }}
            placeholder="https://example.com/product.jpg"
          />
        ) : (
          <div className="vpf-upload-area" onClick={() => fileRef.current?.click()}>
            <input type="file" accept="image/*" ref={fileRef} style={{ display:'none' }} onChange={handleFile} />
            <span>📁 Click to upload image</span>
            <span className="vpf-upload-hint">JPG, PNG, WEBP — max ~2MB recommended</span>
          </div>
        )}
        {imagePreview && (
          <div className="vpf-preview">
            <img src={imagePreview} alt="Preview" onError={() => setImagePreview(null)} />
          </div>
        )}
        <p className="vpf-hint">Leave blank to show a category emoji on the marketplace.</p>
      </div>

      {/* Pricing rules */}
      <PricingRulesEditor rules={rules} onChange={setRules} />

      <div className="vpf-actions">
        <button type="button" className="vpf-cancel" onClick={onCancel}>Cancel</button>
        <button type="submit" className="vpf-save" disabled={saving}>{saving ? 'Saving…' : 'Save Product'}</button>
      </div>
    </form>
  );
}

const REGULATORY_BODIES = [
  'FSSAI (India)', 'FDA (USA)', 'EU Food Safety', 'USDA (USA)',
  'FSA (UK)', 'FSANZ (AUS/NZ)', 'Local Food Permit', 'Other',
];

const CERT_STATUS_META = {
  not_submitted:  { label: 'Not Submitted',  color: '#94a3b8', bg: '#f1f5f9' },
  pending_review: { label: 'Pending Review', color: '#b45309', bg: '#fef3c7' },
  verified:       { label: 'Verified ✓',     color: '#065f46', bg: '#d1fae5' },
  rejected:       { label: 'Rejected',       color: '#991b1b', bg: '#fee2e2' },
};

function CertStatusBadge({ status }) {
  const m = CERT_STATUS_META[status] || CERT_STATUS_META.not_submitted;
  return (
    <span className="vd-cert-status" style={{ color: m.color, background: m.bg }}>
      {m.label}
    </span>
  );
}

// ── Govt cert form (Account tab) ──────────────────────────────────────────────
function GovtCertForm({ token, initialCert, onSaved }) {
  const [form, setForm] = useState({
    regulatoryBody: initialCert?.regulatoryBody || '',
    licenceNumber:  initialCert?.licenceNumber  || '',
    issuingCountry: initialCert?.issuingCountry || '',
    expiryDate:     initialCert?.expiryDate ? isoDate(initialCert.expiryDate) : '',
    documentName:   initialCert?.documentName   || '',
    documentData:   null,
  });
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState(false);
  const fileRef = useRef(null);
  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setError(''); setSuccess(false); };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('File must be under 5 MB'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => set('documentData', ev.target.result);
    set('documentName', file.name);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError(''); setSuccess(false);
    try {
      const res  = await fetch(`${API_URL}/api/vendor/auth/cert`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({
          regulatoryBody: form.regulatoryBody,
          licenceNumber:  form.licenceNumber,
          issuingCountry: form.issuingCountry,
          expiryDate:     form.expiryDate || null,
          documentData:   form.documentData || (initialCert?.documentData ?? null),
          documentName:   form.documentName || (initialCert?.documentName ?? ''),
        }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.message || 'Submission failed'); return; }
      setSuccess(true);
      onSaved(data.govtCert);
    } catch {
      setError('Could not reach the server');
    } finally {
      setSaving(false);
    }
  };

  const hasDoc = form.documentData || initialCert?.documentData;

  return (
    <form className="vd-cert-form" onSubmit={handleSubmit}>
      <div className="vd-cert-form-grid">
        <div className="vd-cert-field">
          <label>Regulatory Body *</label>
          <select value={form.regulatoryBody} onChange={e => set('regulatoryBody', e.target.value)} required>
            <option value="">Select…</option>
            {REGULATORY_BODIES.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div className="vd-cert-field">
          <label>Licence / Registration Number *</label>
          <input value={form.licenceNumber} onChange={e => set('licenceNumber', e.target.value)} placeholder="e.g. 12345678901234" required />
        </div>
        <div className="vd-cert-field">
          <label>Issuing Country *</label>
          <input value={form.issuingCountry} onChange={e => set('issuingCountry', e.target.value)} placeholder="e.g. India" required />
        </div>
        <div className="vd-cert-field">
          <label>Certificate Expiry Date</label>
          <input type="date" value={form.expiryDate} onChange={e => set('expiryDate', e.target.value)} />
        </div>
      </div>

      <div className="vd-cert-field vd-cert-field--doc">
        <label>Certificate Document <span className="vpf-rule-optional">(PDF or image, max 5 MB)</span></label>
        <div className="vd-cert-upload" onClick={() => fileRef.current?.click()}>
          <input type="file" accept=".pdf,image/*" ref={fileRef} style={{ display:'none' }} onChange={handleFile} />
          {hasDoc
            ? <span className="vd-cert-uploaded">📎 {form.documentName || initialCert?.documentName || 'Document uploaded'} — click to replace</span>
            : <span>📁 Click to upload certificate</span>
          }
        </div>
      </div>

      {error   && <div className="vd-cert-error">{error}</div>}
      {success && <div className="vd-cert-success">Submitted for review. A super admin will verify your certificate shortly.</div>}

      <button type="submit" className="vd-cert-submit" disabled={saving}>
        {saving ? 'Submitting…' : initialCert?.licenceNumber ? 'Update Certificate' : 'Submit Certificate'}
      </button>
    </form>
  );
}

// ── Per-product cert form ─────────────────────────────────────────────────────
function ProductCertPanel({ productId, certType, existingCert, token, onSaved }) {
  const [open,   setOpen]   = useState(false);
  const [form,   setForm]   = useState({
    issuingBody:   existingCert?.issuingBody   || '',
    licenceNumber: existingCert?.licenceNumber || '',
    expiryDate:    existingCert?.expiryDate ? isoDate(existingCert.expiryDate) : '',
    documentName:  existingCert?.documentName  || '',
    documentData:  null,
  });
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState(false);
  const fileRef = useRef(null);
  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setError(''); setSuccess(false); };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('File must be under 5 MB'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => set('documentData', ev.target.result);
    set('documentName', file.name);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError(''); setSuccess(false);
    try {
      const res  = await fetch(`${API_URL}/api/vendor/products/${productId}/cert`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({
          certType,
          issuingBody:   form.issuingBody,
          licenceNumber: form.licenceNumber,
          expiryDate:    form.expiryDate || null,
          documentData:  form.documentData || (existingCert?.documentData ?? null),
          documentName:  form.documentName || (existingCert?.documentName ?? ''),
        }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.message || 'Submission failed'); return; }
      setSuccess(true);
      onSaved(data.certifications);
      setOpen(false);
    } catch {
      setError('Could not reach the server');
    } finally {
      setSaving(false);
    }
  };

  const status = existingCert?.status || 'not_submitted';
  const hasDoc = form.documentData || existingCert?.documentData;

  return (
    <div className={`vd-pcert ${status === 'verified' ? 'vd-pcert--verified' : ''}`}>
      <div className="vd-pcert-header" onClick={() => setOpen(o => !o)}>
        <span className="vd-pcert-type">{certType}</span>
        <CertStatusBadge status={status} />
        {existingCert?.adminNotes && status === 'rejected' && (
          <span className="vd-pcert-note" title={existingCert.adminNotes}>⚠ {existingCert.adminNotes}</span>
        )}
        <span className="vd-pcert-toggle">{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <form className="vd-pcert-form" onSubmit={handleSubmit}>
          <div className="vd-cert-form-grid">
            <div className="vd-cert-field">
              <label>Issuing Body *</label>
              <input value={form.issuingBody} onChange={e => set('issuingBody', e.target.value)} placeholder="e.g. Halal Certification Authority" required />
            </div>
            <div className="vd-cert-field">
              <label>Certificate Number *</label>
              <input value={form.licenceNumber} onChange={e => set('licenceNumber', e.target.value)} placeholder="e.g. HC-2024-00123" required />
            </div>
            <div className="vd-cert-field">
              <label>Expiry Date</label>
              <input type="date" value={form.expiryDate} onChange={e => set('expiryDate', e.target.value)} />
            </div>
          </div>
          <div className="vd-cert-field vd-cert-field--doc">
            <label>Certificate Document <span className="vpf-rule-optional">(PDF or image, max 5 MB)</span></label>
            <div className="vd-cert-upload" onClick={() => fileRef.current?.click()}>
              <input type="file" accept=".pdf,image/*" ref={fileRef} style={{ display:'none' }} onChange={handleFile} />
              {hasDoc
                ? <span className="vd-cert-uploaded">📎 {form.documentName || existingCert?.documentName || 'Document uploaded'} — click to replace</span>
                : <span>📁 Click to upload certificate</span>
              }
            </div>
          </div>
          {error   && <div className="vd-cert-error">{error}</div>}
          {success && <div className="vd-cert-success">Submitted for review.</div>}
          <button type="submit" className="vd-cert-submit" disabled={saving}>
            {saving ? 'Submitting…' : existingCert?.licenceNumber ? 'Update & Resubmit' : 'Submit for Verification'}
          </button>
        </form>
      )}
    </div>
  );
}

export default function VendorDashboard() {
  const navigate = useNavigate();
  const [vendor,   setVendor]   = useState(null);
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [activeTab, setActiveTab] = useState('products'); // 'products' | 'import' | 'account'
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null); // product being edited
  const [saving,     setSaving]     = useState(false);
  const [formError,  setFormError]  = useState('');
  const [vendorFull, setVendorFull] = useState(null); // full vendor doc including govtCert

  const token = localStorage.getItem('vendor_token');

  const loadVendorFull = useCallback(async () => {
    try {
      const res  = await fetch(`${API_URL}/api/vendor/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setVendorFull(data.vendor);
    } catch { /* silent */ }
  }, [token]);

  useEffect(() => {
    if (!token) { navigate('/vendor/login'); return; }
    const stored = localStorage.getItem('vendor_info');
    if (stored) setVendor(JSON.parse(stored));
    loadProducts();
    loadVendorFull();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch(`${API_URL}/api/vendor/products`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setProducts(data.products);
      else setError(data.message || 'Failed to load products');
    } catch {
      setError('Could not reach the server');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('vendor_token');
    localStorage.removeItem('vendor_info');
    navigate('/vendor/login');
  };

  const handleSave = async (formData) => {
    setSaving(true);
    setFormError('');
    try {
      const isEdit = !!editTarget;
      const url    = isEdit
        ? `${API_URL}/api/vendor/products/${editTarget._id}`
        : `${API_URL}/api/vendor/products`;
      const method = isEdit ? 'PATCH' : 'POST';
      const res  = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!data.success) {
        const msg = data.errors ? data.errors[0].msg : (data.message || 'Save failed');
        setFormError(msg);
        return;
      }
      setShowForm(false);
      setEditTarget(null);
      await loadProducts();
    } catch {
      setFormError('Could not reach the server');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleListed = async (product) => {
    try {
      await fetch(`${API_URL}/api/vendor/products/${product._id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ isListed: !product.isListed }),
      });
      await loadProducts();
    } catch { /* silent */ }
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    try {
      await fetch(`${API_URL}/api/vendor/products/${product._id}`, {
        method:  'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      await loadProducts();
    } catch { /* silent */ }
  };

  const openEdit = (product) => {
    setEditTarget(product);
    setFormError('');
    setShowForm(true);
  };

  const openNew = () => {
    setEditTarget(null);
    setFormError('');
    setShowForm(true);
  };

  return (
    <div className="vd-page">
      {/* ── Header ── */}
      <div className="vd-header">
        <div className="vd-header-left">
          <span className="vd-logo">🏪</span>
          <div>
            <h1 className="vd-title">{vendor?.businessName || 'Vendor Dashboard'}</h1>
            <p className="vd-subtitle">Ssaye Marketplace · Vendor Portal</p>
          </div>
        </div>
        <button className="vd-logout" onClick={handleLogout}>Sign Out</button>
      </div>

      {/* ── Tabs ── */}
      <div className="vd-tabs">
        <button className={`vd-tab ${activeTab==='products'?'vd-tab--active':''}`} onClick={() => setActiveTab('products')}>📦 My Products</button>
        <button className={`vd-tab ${activeTab==='import'  ?'vd-tab--active':''}`} onClick={() => setActiveTab('import')}>📊 Bulk Import</button>
        <button className={`vd-tab ${activeTab==='account' ?'vd-tab--active':''}`} onClick={() => setActiveTab('account')}>👤 Account</button>
      </div>

      <div className="vd-body">

        {/* ── Products tab ── */}
        {activeTab === 'products' && (
          <>
            <div className="vd-products-header">
              <div>
                <h2 className="vd-section-title">Your Products</h2>
                <p className="vd-section-sub">{products.length} product{products.length !== 1 ? 's' : ''} listed</p>
              </div>
              <button className="vd-add-btn" onClick={openNew}>+ Add Product</button>
            </div>

            {showForm && (
              <div className="vd-form-card">
                <h3 className="vd-form-title">{editTarget ? 'Edit Product' : 'Add New Product'}</h3>
                {formError && <div className="vd-form-error">{formError}</div>}
                <ProductForm
                  initial={editTarget}
                  onSave={handleSave}
                  onCancel={() => { setShowForm(false); setEditTarget(null); }}
                  saving={saving}
                />
              </div>
            )}

            {loading ? (
              <div className="vd-loading"><div className="vd-spinner" /><p>Loading products…</p></div>
            ) : error ? (
              <div className="vd-error"><span>⚠️</span><p>{error}</p><button onClick={loadProducts}>Retry</button></div>
            ) : products.length === 0 ? (
              <div className="vd-empty">
                <span className="vd-empty-icon">📦</span>
                <h3>No products yet</h3>
                <p>Add your first product to start selling on the Ssaye marketplace.</p>
                <button className="vd-add-btn" onClick={openNew}>+ Add Your First Product</button>
              </div>
            ) : (
              <div className="vd-product-list">
                {products.map(p => {
                  const certBadges = ['Organic', 'Halal', 'Fresh'].filter(b => p.badge === b);
                  return (
                    <div key={p._id} className={`vd-product-card ${!p.isListed ? 'vd-product-card--unlisted' : ''}`}>
                      <div className="vd-product-row">
                        <div className="vd-product-img">
                          {p.imageData || p.imageUrl
                            ? <img src={p.imageData || p.imageUrl} alt={p.name} onError={e => { e.currentTarget.style.display='none'; }} />
                            : <span className="vd-product-emoji">{p.emoji || '🛒'}</span>
                          }
                        </div>
                        <div className="vd-product-info">
                          <p className="vd-product-name">{p.name}</p>
                          <p className="vd-product-meta">{p.brand} · {p.category}{p.unit ? ` · ${p.unit}` : ''}</p>
                          <div className="vd-product-badges">
                            <span className="vd-stock-badge" style={{ background: STOCK_COLORS[p.stock] + '22', color: STOCK_COLORS[p.stock] }}>{p.stock}</span>
                            {!p.isListed && <span className="vd-unlisted-badge">Hidden</span>}
                            {p.badge && (() => {
                              const cert = p.certifications?.find(c => c.certType === p.badge);
                              const certStatus = cert?.status || 'not_submitted';
                              return (
                                <span className={`vd-badge-pill vd-badge-pill--${certStatus}`} title={`${p.badge} cert: ${certStatus.replace('_',' ')}`}>
                                  {p.badge} {certStatus === 'verified' ? '✓' : certStatus === 'pending_review' ? '⏳' : certStatus === 'rejected' ? '✕' : '○'}
                                </span>
                              );
                            })()}
                          </div>
                        </div>
                        <div className="vd-product-price">
                          <span className="vd-price">${Number(p.price).toFixed(2)}</span>
                          {p.originalPrice && <span className="vd-orig-price">${Number(p.originalPrice).toFixed(2)}</span>}
                          {p.pricingRules?.length > 0 && (
                            <span className="vd-rules-badge">
                              {p.pricingRules.filter(ruleIsActiveNow).length > 0
                                ? `⚡ ${p.pricingRules.filter(ruleIsActiveNow).length} active rule${p.pricingRules.filter(ruleIsActiveNow).length > 1 ? 's' : ''}`
                                : `${p.pricingRules.length} rule${p.pricingRules.length > 1 ? 's' : ''}`
                              }
                            </span>
                          )}
                        </div>
                        <div className="vd-product-actions">
                          <button className="vd-action-btn vd-action-btn--edit" onClick={() => openEdit(p)}>Edit</button>
                          <button
                            className={`vd-action-btn ${p.isListed ? 'vd-action-btn--hide' : 'vd-action-btn--show'}`}
                            onClick={() => handleToggleListed(p)}
                          >
                            {p.isListed ? 'Hide' : 'Show'}
                          </button>
                          <button className="vd-action-btn vd-action-btn--delete" onClick={() => handleDelete(p)}>Delete</button>
                        </div>
                      </div>

                      {/* Per-product cert panels — only shown when a certifiable badge is set */}
                      {certBadges.length > 0 && (
                        <div className="vd-product-certs">
                          <p className="vd-product-certs-label">Badge Certifications</p>
                          {certBadges.map(badge => (
                            <ProductCertPanel
                              key={badge}
                              productId={p._id}
                              certType={badge}
                              existingCert={p.certifications?.find(c => c.certType === badge)}
                              token={token}
                              onSaved={(certs) => {
                                setProducts(prev => prev.map(prod =>
                                  prod._id === p._id ? { ...prod, certifications: certs } : prod
                                ));
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ── Bulk Import tab ── */}
        {activeTab === 'import' && (
          <div className="vd-import-tab">
            <div className="vd-products-header">
              <div>
                <h2 className="vd-section-title">Bulk Catalogue Import</h2>
                <p className="vd-section-sub">Upload a CSV file to add multiple products at once</p>
              </div>
            </div>
            <CSVImport
              token={token}
              onDone={() => { setActiveTab('products'); loadProducts(); }}
            />
          </div>
        )}

        {/* ── Account tab ── */}
        {activeTab === 'account' && vendor && (
          <div className="vd-account">
            <h2 className="vd-section-title">Account Details</h2>
            <div className="vd-account-card">
              <div className="vd-account-row"><span className="vd-account-label">Full Name</span><span className="vd-account-val">{vendor.fullName || '—'}</span></div>
              <div className="vd-account-row"><span className="vd-account-label">Business Name</span><span className="vd-account-val">{vendor.businessName}</span></div>
              <div className="vd-account-row"><span className="vd-account-label">Email</span><span className="vd-account-val">{vendor.email}</span></div>
              <div className="vd-account-row"><span className="vd-account-label">Phone</span><span className="vd-account-val">{vendor.phone || '—'}</span></div>
              <div className="vd-account-row">
                <span className="vd-account-label">Account Status</span>
                <span className={`vd-status-badge vd-status-badge--${vendor.status}`}>{vendor.status}</span>
              </div>
            </div>

            {/* Government Certificate Section */}
            <div className="vd-cert-section">
              <div className="vd-cert-section-header">
                <div>
                  <h3 className="vd-cert-section-title">🏛 Government / Food Safety Certificate</h3>
                  <p className="vd-cert-section-sub">
                    Submit your business-level food safety registration (e.g. FSSAI, FDA). Required to sell on Ssaye.
                  </p>
                </div>
                {vendorFull?.govtCert && (
                  <CertStatusBadge status={vendorFull.govtCert.status} />
                )}
              </div>

              {vendorFull?.govtCert?.adminNotes && vendorFull.govtCert.status === 'rejected' && (
                <div className="vd-cert-rejection-note">
                  <strong>Admin note:</strong> {vendorFull.govtCert.adminNotes}
                </div>
              )}

              <GovtCertForm
                token={token}
                initialCert={vendorFull?.govtCert}
                onSaved={(updatedCert) => setVendorFull(v => ({ ...v, govtCert: updatedCert }))}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
