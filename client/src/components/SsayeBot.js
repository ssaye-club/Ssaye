import React, { useState, useEffect, useRef } from 'react';
import logo from '../images/logo.png';
import './SsayeBot.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const QUICK_ACTIONS = [
  '🌶️ What spices do you carry?',
  '🫘 Help me find dal',
  '🛒 How does checkout work?',
  '🍛 Suggest a recipe ingredient',
];

function SsayeBot() {
  const [isOpen,    setIsOpen]    = useState(false);
  const [messages,  setMessages]  = useState([
    { role: 'assistant', content: "Hey there! I'm **Ssaye Bot** ✨ — your South Asian grocery guide. Ask me about products, ingredients, recipes, or anything in the marketplace!" },
  ]);
  const [input,     setInput]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [unread,    setUnread]    = useState(0);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const send = async (text) => {
    const userText = (text || input).trim();
    if (!userText || loading) return;
    setInput('');

    const next = [...messages, { role: 'user', content: userText }];
    setMessages(next);
    setLoading(true);

    try {
      const res  = await fetch(`${API_URL}/api/chat/marketplace`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ message: userText, history: messages }),
      });
      const data = await res.json();
      const reply = data.response || "Sorry, I couldn't get a response. Please try again!";
      setMessages([...next, { role: 'assistant', content: reply }]);
      if (!isOpen) setUnread(u => u + 1);
    } catch {
      setMessages([...next, { role: 'assistant', content: "Oops! I'm having trouble connecting right now 😅 Please try again in a moment." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    send();
  };

  // Simple markdown-lite renderer: bold and line breaks only
  const renderContent = (text) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <>
      {/* ── Bubble toggle ── */}
      <button
        className={`sb-toggle ${isOpen ? 'sb-toggle--open' : ''}`}
        onClick={() => setIsOpen(o => !o)}
        aria-label="Open Ssaye Bot"
      >
        {isOpen ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round"/>
          </svg>
        ) : (
          <>
            <img src={logo} alt="Ssaye Bot" className="sb-toggle-logo" />
            {unread > 0 && <span className="sb-unread">{unread}</span>}
          </>
        )}
      </button>

      {/* ── Chat window ── */}
      {isOpen && (
        <div className="sb-window" role="dialog" aria-label="Ssaye Bot chat">

          {/* Header */}
          <div className="sb-header">
            <div className="sb-header-left">
              <div className="sb-avatar">
                <img src={logo} alt="Ssaye Bot" className="sb-avatar-logo" />
              </div>
              <div>
                <p className="sb-header-name">Ssaye Bot</p>
                <p className="sb-header-status">
                  <span className="sb-dot" />
                  Your grocery guide
                </p>
              </div>
            </div>
            <button className="sb-close" onClick={() => setIsOpen(false)} aria-label="Close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="sb-messages">
            {messages.map((m, i) => (
              <div key={i} className={`sb-msg sb-msg--${m.role}`}>
                {m.role === 'assistant' && (
                  <span className="sb-msg-avatar">
                    <img src={logo} alt="Ssaye Bot" className="sb-msg-avatar-logo" />
                  </span>
                )}
                <div className="sb-msg-bubble">
                  {renderContent(m.content)}
                </div>
              </div>
            ))}

            {loading && (
              <div className="sb-msg sb-msg--assistant">
                <span className="sb-msg-avatar">
                  <img src={logo} alt="Ssaye Bot" className="sb-msg-avatar-logo" />
                </span>
                <div className="sb-msg-bubble sb-typing">
                  <span /><span /><span />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick actions — only on first message */}
          {messages.length === 1 && !loading && (
            <div className="sb-quick">
              {QUICK_ACTIONS.map((a, i) => (
                <button key={i} className="sb-quick-btn" onClick={() => send(a)}>
                  {a}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form className="sb-form" onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              className="sb-input"
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask about products, recipes…"
              disabled={loading}
              autoComplete="off"
            />
            <button
              className="sb-send"
              type="submit"
              disabled={!input.trim() || loading}
              aria-label="Send"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </form>

          <p className="sb-footer">Powered by Ssaye · South Asian Grocery Club</p>
        </div>
      )}
    </>
  );
}

export default SsayeBot;
