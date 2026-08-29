// frontend/src/components/StreakBadge.jsx
import React from 'react';

export default function StreakBadge({
  days = 0,
  streakDays = null,
  rank = {
    badgeColor: '#4ADE80',
    glowColor: 'rgba(74, 222, 128, 0.35)',
    fullTitle: 'Novice (門下生)',
    title: 'Novice',
    kanji: '門下生',
    daysToNext: 14,
    nextRankTitle: 'Ronin'
  },
  compact = false
}) {
  const activeDays = streakDays ?? days;
  const isZero = activeDays === 0;
  const strokeColor = isZero ? 'rgba(255, 255, 255, 0.18)' : rank.badgeColor;
  const glow = isZero ? 'none' : `0 0 14px ${rank.glowColor}`;

  if (compact) {
    return (
      <div style={{ ...styles.compactPill, borderColor: rank.badgeColor, boxShadow: glow }}>
        <span style={{ fontSize: '0.95rem', filter: isZero ? 'grayscale(1) opacity(0.5)' : 'none' }}>
          🔥
        </span>
        <span style={styles.compactNum}>{activeDays}</span>
        <span style={{ fontSize: '0.68rem', color: '#aaa', fontWeight: '700' }}>d</span>
      </div>
    );
  }

  return (
    <div style={styles.card}>
      {/* Ambient Radial Backdrop Glow */}
      <div
        style={{
          ...styles.ambientGlow,
          background: isZero ? 'rgba(255, 255, 255, 0.04)' : rank.glowColor
        }}
      />

      <div style={styles.contentRow}>
        {/* Glowing Progress Indicator Ring */}
        <div style={styles.ringWrapper}>
          <svg viewBox="0 0 44 44" style={styles.svgRing}>
            {/* Inner subtle disc */}
            <circle
              cx="22"
              cy="22"
              r="17"
              fill="rgba(255, 255, 255, 0.03)"
            />
            {/* Background Track */}
            <circle
              cx="22"
              cy="22"
              r="17"
              fill="none"
              stroke="rgba(255, 255, 255, 0.09)"
              strokeWidth="2.8"
            />
            {/* Dynamic Active Progress Ring */}
            <circle
              cx="22"
              cy="22"
              r="17"
              fill="none"
              stroke={strokeColor}
              strokeWidth="2.8"
              strokeDasharray="106.8"
              strokeDashoffset={isZero ? '106.8' : Math.max(10, 106.8 - (activeDays * 2.5))}
              strokeLinecap="round"
              style={{
                filter: isZero ? 'none' : `drop-shadow(0 0 5px ${rank.badgeColor})`,
                transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              transform="rotate(-90 22 22)"
            />
          </svg>

          {/* Center Flame Icon */}
          <div style={styles.ringCenter}>
            <span style={{ fontSize: '1.15rem', filter: isZero ? 'grayscale(1) opacity(0.35)' : 'none' }}>
              🔥
            </span>
          </div>
        </div>

        {/* Streak Details & Clean Typography */}
        <div style={styles.textCol}>
          <div style={styles.rankEyebrow}>
            <span style={{ color: isZero ? '#888' : rank.badgeColor, fontWeight: '800' }}>
              {isZero ? 'IGNITE STREAK' : (rank.fullTitle || `${rank.title || 'WARRIOR'}`).toUpperCase()}
            </span>
          </div>

          <div style={styles.streakNumberRow}>
            <span style={styles.streakNum}>{activeDays}</span>
            <span style={styles.unitText}>{activeDays === 1 ? 'DAY' : 'DAYS'}</span>
          </div>

          <div style={styles.subtext}>
            {rank.nextRankTitle ? (
              <span style={{ color: rank.badgeColor, fontWeight: '700' }}>
                ⚡ {rank.daysToNext} {rank.daysToNext === 1 ? 'day' : 'days'} to level up ({rank.nextRankTitle})
              </span>
            ) : (
              <span style={{ color: rank.badgeColor, fontWeight: '700' }}>
                👑 Apex Master ({rank.title})
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  card: {
    position: 'relative',
    backgroundColor: 'rgba(18, 18, 24, 0.75)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '22px',
    padding: '1rem 1.25rem',
    overflow: 'hidden',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.45)',
    margin: '0.8rem 0'
  },
  ambientGlow: {
    position: 'absolute',
    top: '-30%',
    left: '10%',
    width: '110px',
    height: '110px',
    borderRadius: '50%',
    filter: 'blur(40px)',
    pointerEvents: 'none',
    opacity: 0.45
  },
  contentRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.15rem'
  },
  ringWrapper: {
    position: 'relative',
    width: '48px',
    height: '48px',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  svgRing: {
    width: '100%',
    height: '100%'
  },
  ringCenter: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  textCol: {
    display: 'flex',
    flexDirection: 'column'
  },
  rankEyebrow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.66rem',
    letterSpacing: '1px',
    marginBottom: '1px'
  },
  streakNumberRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '6px',
    lineHeight: 1.1
  },
  streakNum: {
    fontSize: '1.65rem',
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: '-0.5px'
  },
  unitText: {
    fontSize: '0.78rem',
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: '0.5px'
  },
  subtext: {
    fontSize: '0.72rem',
    marginTop: '2px',
    fontWeight: '500'
  },
  compactPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '0.35rem 0.75rem',
    borderRadius: '40px',
    border: '1px solid',
    backgroundColor: 'rgba(18, 18, 24, 0.85)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)'
  },
  compactNum: {
    fontSize: '0.95rem',
    fontWeight: '900',
    color: '#fff'
  }
};