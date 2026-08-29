// frontend/src/components/BioScanCard.jsx
import React from 'react';
import Icon from './Icon.jsx';

export default function BioScanCard({ bioData = null, badgeColor = '#FF85A2' }) {
  if (!bioData) return null;

  return (
    <div style={styles.container}>
      {/* Header & Overall Score */}
      <div style={styles.headerRow}>
        <div>
          <div style={{ ...styles.eyebrow, color: badgeColor }}>SMART BIO-SCAN REPORT</div>
          <h2 style={styles.title}>Body Composition</h2>
          <div style={styles.dateLabel}>Scanned: {bioData.reportDate}</div>
        </div>

        <div style={{ ...styles.overallScoreBadge, borderColor: badgeColor }}>
          <span style={{ fontSize: '0.65rem', color: '#888', fontWeight: '800' }}>HEALTH SCORE</span>
          <span style={{ fontSize: '1.4rem', fontWeight: '900', color: badgeColor }}>
            {bioData.scores?.overall || 73}
          </span>
          <span style={{ fontSize: '0.65rem', color: '#aaa' }}>/ 100</span>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div style={styles.metricGrid}>
        <div style={styles.metricCard}>
          <span style={styles.metricLabel}>Body Fat</span>
          <span style={{ ...styles.metricVal, color: '#FF85A2' }}>{bioData.bodyFatPct}%</span>
          <span style={styles.metricSub}>Ideal: 10–20%</span>
        </div>

        <div style={styles.metricCard}>
          <span style={styles.metricLabel}>Muscle Mass</span>
          <span style={{ ...styles.metricVal, color: '#4ADE80' }}>{bioData.muscleMass} kg</span>
          <span style={styles.metricSub}>Normal: 40–47 kg</span>
        </div>

        <div style={styles.metricCard}>
          <span style={styles.metricLabel}>BMR</span>
          <span style={{ ...styles.metricVal, color: '#38BDF8' }}>{bioData.bmr} kcal</span>
          <span style={styles.metricSub}>Basal Metabolic</span>
        </div>

        <div style={styles.metricCard}>
          <span style={styles.metricLabel}>Metabolic Age</span>
          <span style={{ ...styles.metricVal, color: '#F59E0B' }}>{bioData.metabolicAge} yrs</span>
          <span style={styles.metricSub}>Actual: {bioData.age} yrs</span>
        </div>
      </div>

      {/* Secondary Structural Components */}
      <div style={styles.secondarySection}>
        <div style={styles.secRow}>
          <span style={styles.secLabel}>Fat Mass</span>
          <span style={styles.secVal}>{bioData.fatMass} kg <span style={{ color: '#888', fontSize: '0.7rem' }}>(Target &lt;15kg)</span></span>
        </div>
        <div style={styles.secRow}>
          <span style={styles.secLabel}>Lean Mass</span>
          <span style={styles.secVal}>{bioData.leanMass} kg</span>
        </div>
        <div style={styles.secRow}>
          <span style={styles.secLabel}>Visceral Fat</span>
          <span style={styles.secVal}>Index {bioData.visceralFatIndex} <span style={{ color: '#4ADE80', fontSize: '0.7rem' }}>(Normal)</span></span>
        </div>
        <div style={styles.secRow}>
          <span style={styles.secLabel}>Subcutaneous Fat</span>
          <span style={styles.secVal}>{bioData.subcutaneousFatPct}%</span>
        </div>
        <div style={styles.secRow}>
          <span style={styles.secLabel}>Bone Mass</span>
          <span style={styles.secVal}>{bioData.boneMass} kg</span>
        </div>
        <div style={styles.secRow}>
          <span style={styles.secLabel}>Protein</span>
          <span style={styles.secVal}>{bioData.proteinPct}%</span>
        </div>
      </div>

      {/* Recommended Focus Areas */}
      <div style={styles.focusBox}>
        <div style={{ fontSize: '0.72rem', fontWeight: '800', color: badgeColor, marginBottom: 4 }}>
          ⚔️ WARRIOR FOCUS TARGETS
        </div>
        <ul style={styles.focusList}>
          <li>Reduce Body Fat from <b>25%</b> to <b>&lt;20%</b>[cite: 1]</li>
          <li>Reduce Fat Mass from <b>20 kg</b> to <b>&lt;15 kg</b>[cite: 1]</li>
          <li>Lower Metabolic Age from <b>31</b> to <b>&lt;27 yrs</b> with resistance training[cite: 1]</li>
        </ul>
      </div>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: 'rgba(18, 18, 24, 0.75)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '22px',
    padding: '1.2rem',
    marginBottom: '1.2rem',
    boxShadow: '0 8px 30px rgba(0,0,0,0.5)'
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1rem'
  },
  eyebrow: {
    fontSize: '0.68rem',
    fontWeight: '800',
    letterSpacing: '1px',
    marginBottom: '2px'
  },
  title: {
    fontSize: '1.2rem',
    fontWeight: '800',
    margin: 0,
    color: '#fff'
  },
  dateLabel: {
    fontSize: '0.72rem',
    color: '#777',
    marginTop: '2px'
  },
  overallScoreBadge: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1.5px solid',
    borderRadius: '16px',
    padding: '0.4rem 0.75rem',
    backgroundColor: 'rgba(0,0,0,0.4)'
  },
  metricGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.6rem',
    marginBottom: '1rem'
  },
  metricCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '14px',
    padding: '0.75rem 0.85rem',
    display: 'flex',
    flexDirection: 'column'
  },
  metricLabel: {
    fontSize: '0.68rem',
    color: '#888',
    fontWeight: '700'
  },
  metricVal: {
    fontSize: '1.25rem',
    fontWeight: '900',
    margin: '0.2rem 0'
  },
  metricSub: {
    fontSize: '0.65rem',
    color: '#666'
  },
  secondarySection: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: '14px',
    padding: '0.8rem 1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.45rem',
    marginBottom: '1rem'
  },
  secRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  secLabel: {
    fontSize: '0.75rem',
    color: '#999',
    fontWeight: '600'
  },
  secVal: {
    fontSize: '0.8rem',
    color: '#fff',
    fontWeight: '700'
  },
  focusBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px dashed rgba(255, 255, 255, 0.15)',
    borderRadius: '14px',
    padding: '0.75rem 0.9rem'
  },
  focusList: {
    margin: 0,
    paddingLeft: '1.1rem',
    fontSize: '0.75rem',
    color: '#ccc',
    lineHeight: '1.35rem'
  }
};