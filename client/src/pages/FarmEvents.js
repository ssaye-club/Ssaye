import React, { useState, useEffect, useContext } from 'react';
import { Helmet } from 'react-helmet-async';
import { AuthContext } from '../context/AuthContext';
import './FarmEvents.css';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const CATEGORIES = ['Workshop', 'Tour', 'Farm-to-Table', 'Corporate', 'Community', 'Other'];

const CATEGORY_COLORS = {
  Workshop: '#667eea',
  Tour: '#6abf4b',
  'Farm-to-Table': '#f59e0b',
  Corporate: '#38bdf8',
  Community: '#10b981',
  Other: '#94a3b8',
};

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' });
}

function formatMonth(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
}

function formatDay(dateStr) {
  return new Date(dateStr).getDate();
}

function isUpcoming(dateStr) {
  return new Date(dateStr) >= new Date(new Date().setHours(0, 0, 0, 0));
}

const EMPTY_FORM = { title: '', description: '', date: '', location: '', capacity: '', category: 'Other', poster: '' };

function FarmEvents() {
  const { user, isAuthenticated } = useContext(AuthContext);
  const isAdmin = user?.isAdmin || user?.isSuperAdmin;

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [filter, setFilter] = useState('upcoming');

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    try {
      const res = await fetch(`${API}/api/farm-events`);
      const data = await res.json();
      setEvents(Array.isArray(data) ? data : []);
    } catch {
      setError('Failed to load events. Please try again later.');
    } finally {
      setLoading(false);
    }
  }

  function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setFormError('Poster image must be under 5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setForm(f => ({ ...f, poster: reader.result }));
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    if (!form.title || !form.description || !form.date || !form.location) {
      setFormError('Title, description, date, and location are required.');
      return;
    }
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/farm-events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.message || 'Failed to create event.'); return; }
      setEvents(prev => [...prev, data].sort((a, b) => new Date(a.date) - new Date(b.date)));
      setForm(EMPTY_FORM);
      setShowForm(false);
    } catch {
      setFormError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this event?')) return;
    setDeletingId(id);
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API}/api/farm-events/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setEvents(prev => prev.filter(e => e._id !== id));
    } catch {
      alert('Failed to delete event.');
    } finally {
      setDeletingId(null);
    }
  }

  const displayed = events.filter(e =>
    filter === 'all' ? true : isUpcoming(e.date)
  );

  return (
    <div className="fe-page">
      <Helmet>
        <title>Ssaye Farms — Events</title>
        <meta name="description" content="Upcoming events at Ssaye Farms — workshops, tours, farm-to-table experiences and community gatherings." />
      </Helmet>

      {/* Hero */}
      <section className="fe-hero">
        <div className="fe-hero-inner">
          <p className="fe-hero-eyebrow">🌿 SSAYE FARMS</p>
          <h1 className="fe-hero-title">Farm Events &amp; Experiences</h1>
          <p className="fe-hero-desc">Workshops, tours, farm-to-table dinners and community gatherings — all rooted in sustainable living.</p>
        </div>
      </section>

      {/* Controls */}
      <div className="fe-controls">
        <div className="fe-filter-tabs">
          <button
            className={`fe-filter-tab ${filter === 'upcoming' ? 'fe-filter-tab--active' : ''}`}
            onClick={() => setFilter('upcoming')}
          >Upcoming</button>
          <button
            className={`fe-filter-tab ${filter === 'all' ? 'fe-filter-tab--active' : ''}`}
            onClick={() => setFilter('all')}
          >All Events</button>
        </div>
        {isAdmin && (
          <button className="fe-add-btn" onClick={() => { setShowForm(s => !s); setFormError(''); }}>
            {showForm ? '✕ Cancel' : '+ Add Event'}
          </button>
        )}
      </div>

      {/* Add Event Form */}
      {isAdmin && showForm && (
        <div className="fe-form-wrap">
          <form className="fe-form" onSubmit={handleSubmit}>
            <h3 className="fe-form-title">New Farm Event</h3>
            {formError && <p className="fe-form-error">{formError}</p>}
            <div className="fe-form-grid">
              <div className="fe-field fe-field--full">
                <label>Event Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Hydroponics Workshop" />
              </div>
              <div className="fe-field">
                <label>Date *</label>
                <input type="datetime-local" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div className="fe-field">
                <label>Location *</label>
                <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. Ssaye Farm, Block A" />
              </div>
              <div className="fe-field">
                <label>Category</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="fe-field">
                <label>Capacity (optional)</label>
                <input type="number" min="1" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} placeholder="e.g. 50" />
              </div>
              <div className="fe-field fe-field--full">
                <label>Description *</label>
                <textarea rows={4} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What will attendees experience?" />
              </div>
              <div className="fe-field fe-field--full">
                <label>Event Poster (optional, max 5 MB)</label>
                <input type="file" accept="image/*" onChange={handleImageUpload} />
                {form.poster && <img src={form.poster} alt="Preview" className="fe-poster-preview" />}
              </div>
            </div>
            <button className="fe-submit-btn" type="submit" disabled={submitting}>
              {submitting ? 'Creating…' : 'Create Event'}
            </button>
          </form>
        </div>
      )}

      {/* Events List */}
      <div className="fe-container">
        {loading && <div className="fe-spinner"><div className="fe-spin" /></div>}
        {error && <p className="fe-error">{error}</p>}
        {!loading && !error && displayed.length === 0 && (
          <div className="fe-empty">
            <span className="fe-empty-icon">🌱</span>
            <p>{filter === 'upcoming' ? 'No upcoming events scheduled yet.' : 'No events found.'}</p>
            {isAdmin && <p className="fe-empty-hint">Use the "Add Event" button above to create one.</p>}
          </div>
        )}
        {!loading && displayed.length > 0 && (
          <div className="fe-grid">
            {displayed.map(event => {
              const past = !isUpcoming(event.date);
              const color = CATEGORY_COLORS[event.category] || '#94a3b8';
              return (
                <div key={event._id} className={`fe-card ${past ? 'fe-card--past' : ''}`}>
                  {event.poster
                    ? <img src={event.poster} alt={event.title} className="fe-card-poster" />
                    : (
                      <div className="fe-card-poster-placeholder" style={{ background: `linear-gradient(135deg, ${color}22, ${color}44)` }}>
                        <span className="fe-card-poster-emoji">🌿</span>
                      </div>
                    )
                  }
                  <div className="fe-card-body">
                    <div className="fe-card-top">
                      <div className="fe-date-block">
                        <span className="fe-date-month">{formatMonth(event.date)}</span>
                        <span className="fe-date-day">{formatDay(event.date)}</span>
                      </div>
                      <div className="fe-card-meta">
                        <span className="fe-category-pill" style={{ background: `${color}22`, color, border: `1px solid ${color}55` }}>
                          {event.category}
                        </span>
                        {past && <span className="fe-past-pill">Past</span>}
                      </div>
                    </div>
                    <h3 className="fe-card-title">{event.title}</h3>
                    <p className="fe-card-desc">{event.description}</p>
                    <div className="fe-card-details">
                      <span className="fe-detail"><span>📍</span>{event.location}</span>
                      <span className="fe-detail"><span>🗓</span>{formatDate(event.date)}</span>
                      {event.capacity && <span className="fe-detail"><span>👥</span>Capacity: {event.capacity}</span>}
                    </div>
                    {isAdmin && (
                      <button
                        className="fe-delete-btn"
                        onClick={() => handleDelete(event._id)}
                        disabled={deletingId === event._id}
                      >
                        {deletingId === event._id ? 'Deleting…' : '🗑 Remove Event'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default FarmEvents;
