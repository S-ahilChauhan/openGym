// frontend/src/components/BioScanUploadModal.jsx
import React, { useState } from 'react';
import { extractTextFromPDF, parseSmartScaleReport } from '../utils/bioParser.js';

export default function BioScanUploadModal({ isOpen, onClose, onScanComplete, badgeColor = '#FF85A2' }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('upload'); // 'upload' | 'manual'

  // Manual Form State
  const [weight, setWeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [muscleMass, setMuscleMass] = useState('');
  const [bmr, setBmr] = useState('');
  const [metabolicAge, setMetabolicAge] = useState('');

  if (!isOpen) return null;

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError('');

    try {
      if (file.type === 'application/pdf') {
        const text = await extractTextFromPDF(file);
        const parsed = parseSmartScaleReport(text);
        onScanComplete(parsed);
        onClose();
      } else {
        setError('Please upload a PDF report (or enter metrics manually below).');
      }
    } catch (err) {
      console.error(err);
      setError('Could not auto-parse this document. Please enter metrics manually.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    const w = parseFloat(weight) || 75;
    const bf = parseFloat(bodyFat) || 20;
    const mm = parseFloat(muscleMass) || w * 0.52;
    const b = parseFloat(bmr) || 1600;
    const ma = parseInt(metabolicAge) || 25;

    const manualScan = {
      reportDate: new Date().toISOString().slice(0, 10),
      weight: w,
      bodyFatPct: bf,
      muscleMass: mm,
      bmr: b,
      metabolicAge: ma,
      fatMass: Math.round(((w * bf) / 100) * 10) / 10,
      leanMass: Math.round((w - ((w * bf) / 100)) * 10) / 10,
      visceralFatIndex: 6,
      subcutaneousFatPct: Math.max(5, bf - 2),
      boneMass: 2.8,
      proteinPct: 16.0,
      scores: {
        overall: bf > 24 ? 68 : 82,
        bodyComposition: 80,
        fatAnalysis: 70,
        metabolicIndicators: 80
      },
      targets: {
        idealWeight: Math.round(w * 0.85),
        targetFatMass: Math.max(10, Math.round(w * 0.15)),
        targetBodyFat: 18.0,
        targetMetabolicAge: 25
      }
    };

    onScanComplete(manualScan);
    onClose();
  };

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <div>
            <span style={{ fontSize: '0.68rem', fontWeight: '800', color: badgeColor, letterSpacing: '1px' }}>
              SMART SCALE INTEGRATION
            </span>
            <h2 style={{ margin: '0.2rem 0', fontSize: '1.25rem', color: '#fff' }}>Upload Bio-Scan</h2>
          </div>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        {/* Tab Switcher */}
        <div style={styles.tabRow}>
          <button
            style={{ ...styles.tabBtn, borderBottom: tab === 'upload' ? `2px solid ${badgeColor}` : 'none', color: tab === 'upload' ? '#fff' : '#777' }}
            onClick={() => setTab('upload')}
          >
            Upload PDF
          </button>
          <button
            style={{ ...styles.tabBtn, borderBottom: tab === 'manual' ? `2px solid ${badgeColor}` : 'none', color: tab === 'manual' ? '#fff' : '#777' }}
            onClick={() => setTab('manual')}
          >
            Manual Entry
          </button>
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}

        {tab === 'upload' ? (
          <div style={styles.dropZone}>
            <input
              type="file"
              accept=".pdf"
              id="bio-scan-file-input"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
              disabled={loading}
            />
            <label htmlFor="bio-scan-file-input" style={styles.uploadLabel}>
              <span style={{ fontSize: '2.5rem' }}>📄</span>
              <span style={{ fontSize: '0.9rem', fontWeight: '800', color: '#fff' }}>
                {loading ? 'Analyzing Smart Scale PDF...' : 'Choose Fitelo / Smart Scale PDF'}
              </span>
              <span style={{ fontSize: '0.72rem', color: '#888' }}>
                Auto-extracts Body Fat, Muscle Mass, BMR & Metabolic Age
              </span>
            </label>
          </div>
        ) : (
          <form onSubmit={handleManualSubmit} style={styles.manualForm}>
            <div style={styles.grid2}>
              <div>
                <label style={styles.label}>WEIGHT (KG)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  style={styles.input}
                  placeholder="e.g. 78.9"
                />
              </div>
              <div>
                <label style={styles.label}>BODY FAT (%)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={bodyFat}
                  onChange={(e) => setBodyFat(e.target.value)}
                  style={styles.input}
                  placeholder="e.g. 25.0"
                />
              </div>
            </div>

            <div style={styles.grid2}>
              <div>
                <label style={styles.label}>MUSCLE MASS (KG)</label>
                <input
                  type="number"
                  step="0.1"
                  value={muscleMass}
                  onChange={(e) => setMuscleMass(e.target.value)}
                  style={styles.input}
                  placeholder="e.g. 41.9"
                />
              </div>
              <div>
                <label style={styles.label}>BMR (KCAL)</label>
                <input
                  type="number"
                  value={bmr}
                  onChange={(e) => setBmr(e.target.value)}
                  style={styles.input}
                  placeholder="e.g. 1623"
                />
              </div>
            </div>

            <div>
              <label style={styles.label}>METABOLIC AGE (YRS)</label>
              <input
                type="number"
                value={metabolicAge}
                onChange={(e) => setMetabolicAge(e.target.value)}
                style={styles.input}
                placeholder="e.g. 31"
              />
            </div>

            <button type="submit" style={{ ...styles.submitBtn, backgroundColor: badgeColor }}>
              Save Bio-Scan
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
    backgroundColor: 'rgba(0,0,0,0.75)',
    backdropFilter: 'blur(10px)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem'
  },
  modal: {
    width: '100%',
    maxWidth: '430px',
    backgroundColor: 'rgba(20, 20, 26, 0.95)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '24px',
    padding: '1.4rem',
    boxShadow: '0 15px 40px rgba(0,0,0,0.6)'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1rem'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#888',
    fontSize: '1.2rem',
    cursor: 'pointer'
  },
  tabRow: {
    display: 'flex',
    gap: '1rem',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    marginBottom: '1.2rem'
  },
  tabBtn: {
    background: 'none',
    border: 'none',
    padding: '0.5rem 0.2rem',
    fontSize: '0.85rem',
    fontWeight: '700',
    cursor: 'pointer'
  },
  dropZone: {
    border: '2px dashed rgba(255, 255, 255, 0.2)',
    borderRadius: '16px',
    padding: '2rem 1rem',
    textAlign: 'center',
    cursor: 'pointer',
    backgroundColor: 'rgba(255, 255, 255, 0.02)'
  },
  uploadLabel: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
    cursor: 'pointer'
  },
  manualForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.85rem'
  },
  grid2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.75rem'
  },
  label: {
    fontSize: '0.65rem',
    fontWeight: '700',
    color: '#888',
    marginBottom: '0.2rem',
    display: 'block'
  },
  input: {
    width: '100%',
    padding: '0.65rem 0.8rem',
    backgroundColor: 'rgba(0,0,0,0.5)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '10px',
    color: '#fff',
    fontSize: '0.85rem',
    boxSizing: 'border-box'
  },
  submitBtn: {
    marginTop: '0.4rem',
    padding: '0.8rem',
    borderRadius: '12px',
    border: 'none',
    fontWeight: '800',
    color: '#000',
    cursor: 'pointer'
  },
  errorBox: {
    backgroundColor: 'rgba(255, 68, 68, 0.15)',
    border: '1px solid rgba(255, 68, 68, 0.3)',
    color: '#ff6b6b',
    padding: '0.6rem 0.8rem',
    borderRadius: '10px',
    fontSize: '0.75rem',
    marginBottom: '0.8rem'
  }
};