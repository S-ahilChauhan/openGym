// frontend/src/components/WorkoutBuddyModal.jsx
import React, { useState } from 'react';
import { generateBuddyInvitePayload, unpackBuddyInviteToken } from '../utils/BuddySync.js';

export default function WorkoutBuddyModal({ isOpen, onClose, S = {}, onApplyRoutine, badgeColor = '#FF85A2' }) {
  const [tab, setTab] = useState('share'); // 'share' | 'email' | 'join'
  const [weeks, setWeeks] = useState(4);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [importToken, setImportToken] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  if (!isOpen) return null;

  // Safe generation with fallback safeguards
  let shareUrl = window.location.href;
  let token = '';
  try {
    const inviteData = generateBuddyInvitePayload(S || {}, weeks);
    shareUrl = inviteData?.shareUrl || window.location.href;
    token = inviteData?.encoded || '';
  } catch (err) {
    console.error('Error creating buddy invite:', err);
  }

  // QR rendering using quickchart URL (built specifically for long encoded data URLs)
  const qrUrl = `https://quickchart.io/qr?text=${encodeURIComponent(shareUrl)}&size=200&dark=ffffff&light=121218&ecLevel=L&format=svg`;

  const handleCopyLink = () => {
    try {
      navigator.clipboard.writeText(shareUrl);
    } catch {
      const el = document.createElement('textarea');
      el.value = shareUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyCode = () => {
    try {
      navigator.clipboard.writeText(token);
    } catch {
      const el = document.createElement('textarea');
      el.value = token;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleJoinByCode = (e) => {
    e.preventDefault();
    if (!importToken.trim()) return;

    let cleanToken = importToken.trim();
    if (cleanToken.includes('buddyToken=')) {
      cleanToken = cleanToken.split('buddyToken=')[1].split('&')[0];
    }

    try {
      const data = unpackBuddyInviteToken(cleanToken);
      if (data && (data.routines || data.week)) {
        if (typeof onApplyRoutine === 'function') {
          onApplyRoutine(data);
        }
        onClose();
      } else {
        alert('Could not parse workout plan. Please check the code and try again.');
      }
    } catch (err) {
      alert('Invalid code. Please ensure you copied the full sync code.');
    }
  };

  const handleSendEmail = (e) => {
    e.preventDefault();
    const creator = S?.profile?.name || 'Your Workout Buddy';
    const subject = encodeURIComponent(`${creator} invited you to Forge Duo on OpenGym!`);
    const body = encodeURIComponent(
      `Hey! Let's train together.\n\nJoin my ${weeks}-week workout split on OpenGym using this link:\n\n${shareUrl}\n\nOr paste this Sync Code under 'Join with Code':\n\n${token}\n\nLet's get to work! ⚔️`
    );
    window.open(`mailto:${emailInput}?subject=${subject}&body=${body}`, '_blank');
    setEmailSent(true);
    setTimeout(() => setEmailSent(false), 3000);
  };

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <span style={{ fontSize: '0.68rem', fontWeight: '800', color: badgeColor, letterSpacing: '1px' }}>
              FORGE DUO CO-OP
            </span>
            <h2 style={{ margin: '0.2rem 0', fontSize: '1.25rem', color: '#fff' }}>Sync Workout Split</h2>
          </div>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        {/* Tab Navigation */}
        <div style={styles.tabNav}>
          <button
            type="button"
            style={{
              ...styles.tabBtn,
              borderBottom: tab === 'share' ? `2px solid ${badgeColor}` : 'none',
              color: tab === 'share' ? '#fff' : '#777',
            }}
            onClick={() => setTab('share')}
          >
            QR & Link
          </button>
          <button
            type="button"
            style={{
              ...styles.tabBtn,
              borderBottom: tab === 'email' ? `2px solid ${badgeColor}` : 'none',
              color: tab === 'email' ? '#fff' : '#777',
            }}
            onClick={() => setTab('email')}
          >
            Invite Email
          </button>
          <button
            type="button"
            style={{
              ...styles.tabBtn,
              borderBottom: tab === 'join' ? `2px solid ${badgeColor}` : 'none',
              color: tab === 'join' ? '#fff' : '#777',
            }}
            onClick={() => setTab('join')}
          >
            Join with Code
          </button>
        </div>

        {/* TAB 1: SHARE QR & CODE */}
        {tab === 'share' && (
          <div style={styles.contentCol}>
            <div style={styles.selectorRow}>
              <span style={{ fontSize: '0.75rem', color: '#aaa', fontWeight: '600' }}>Program Duration:</span>
              <select
                value={weeks}
                onChange={(e) => setWeeks(Number(e.target.value))}
                style={styles.selectInput}
              >
                <option value={2}>2 Weeks</option>
                <option value={4}>4 Weeks</option>
                <option value={6}>6 Weeks</option>
                <option value={8}>8 Weeks</option>
                <option value={12}>12 Weeks</option>
              </select>
            </div>

            {/* QR Code Container */}
            <div style={styles.qrBox}>
              <img
                src={qrUrl}
                alt="Forge Duo QR"
                style={{ width: '170px', height: '170px', borderRadius: '10px' }}
                onError={(e) => {
                  // Graceful fallback if offline
                  e.target.style.display = 'none';
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={handleCopyLink}
                style={{ ...styles.actionBtn, backgroundColor: badgeColor }}
              >
                {copiedLink ? 'Link Copied! 📋' : 'Copy Link 🔗'}
              </button>
              <button
                type="button"
                onClick={handleCopyCode}
                style={{ ...styles.actionBtn, backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
              >
                {copiedCode ? 'Code Copied! 📋' : 'Copy Code 🔑'}
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: INVITE VIA EMAIL */}
        {tab === 'email' && (
          <form onSubmit={handleSendEmail} style={styles.contentCol}>
            <span style={{ fontSize: '0.75rem', color: '#888' }}>
              Send an email invite with your split and routine attached:
            </span>
            <input
              type="email"
              required
              placeholder="buddy@example.com"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              style={styles.textInput}
            />
            <button
              type="submit"
              style={{ ...styles.actionBtn, backgroundColor: badgeColor }}
            >
              {emailSent ? 'Opening Mail Client... ✉️' : 'Send Email Invite ✉️'}
            </button>
          </form>
        )}

        {/* TAB 3: JOIN WITH CODE */}
        {tab === 'join' && (
          <form onSubmit={handleJoinByCode} style={styles.contentCol}>
            <span style={{ fontSize: '0.75rem', color: '#888' }}>
              Paste the **Sync Code** or **Invite Link** from your buddy below:
            </span>
            <textarea
              required
              rows={4}
              placeholder="Paste invite code (or link) here..."
              value={importToken}
              onChange={(e) => setImportToken(e.target.value)}
              style={{ ...styles.textInput, resize: 'none', fontSize: '0.78rem' }}
            />
            <button
              type="submit"
              style={{ ...styles.actionBtn, backgroundColor: badgeColor }}
            >
              Sync Buddy Split ⚔️
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

const styles = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
  },
  modal: {
    width: '100%',
    maxWidth: '400px',
    backgroundColor: 'rgba(20, 20, 26, 0.96)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '24px',
    padding: '1.4rem',
    boxShadow: '0 15px 40px rgba(0, 0, 0, 0.6)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '0.8rem',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#888',
    fontSize: '1.2rem',
    cursor: 'pointer',
    padding: 0,
  },
  tabNav: {
    display: 'flex',
    gap: '0.8rem',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    marginBottom: '1rem',
  },
  tabBtn: {
    background: 'none',
    border: 'none',
    padding: '0.4rem 0.2rem',
    fontSize: '0.8rem',
    fontWeight: '700',
    cursor: 'pointer',
  },
  contentCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.85rem',
  },
  selectorRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectInput: {
    padding: '0.4rem 0.6rem',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '10px',
    color: '#fff',
    fontSize: '0.78rem',
    outline: 'none',
  },
  qrBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.8rem',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '16px',
    margin: '0.2rem 0',
    minHeight: '180px',
  },
  textInput: {
    width: '100%',
    padding: '0.75rem 0.9rem',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '12px',
    color: '#ffffff',
    fontSize: '0.85rem',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  actionBtn: {
    width: '100%',
    padding: '0.8rem',
    borderRadius: '14px',
    border: 'none',
    fontWeight: '800',
    fontSize: '0.82rem',
    color: '#000',
    cursor: 'pointer',
  },
};