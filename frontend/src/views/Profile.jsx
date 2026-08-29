// frontend/src/views/Profile.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useStore, INITIAL_BIO_SCAN } from '../store/useStore.js';
import { getStreakRank } from '../utils/ranks';
import { streakWeeks } from '../lib/history.js';
import BioScanCard from '../components/BioScanCard.jsx';
import BioScanUploadModal from '../components/BioScanUploadModal.jsx';

export default function Profile({ rankWeeks = null }) {
  const S = useStore((s) => s.S);
  const user = useStore((s) => s.user);
  const update = useStore((s) => s.update);

  // Compute rank dynamically
  const activeWeeks = rankWeeks !== null ? rankWeeks : streakWeeks(S);
  const currentRank = getStreakRank(activeWeeks);

  // Profile Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [showBioModal, setShowBioModal] = useState(false);

  // Editable Profile Fields (Default from store/state if available)
  const [displayName, setDisplayName] = useState(S?.profile?.name || user?.name || 'Sahil');
  const [userEmail, setUserEmail] = useState(user?.email || '');
  const [goal, setGoal] = useState(S?.profile?.goal || 'Lean Recomposition');
  const [split, setSplit] = useState(S?.profile?.split || 'Push / Pull / Legs');
  const [heightCm, setHeightCm] = useState(S?.profile?.heightCm || '170');
  const [targetWeight, setTargetWeight] = useState(S?.profile?.targetWeight || '63.0');
  const [bio, setBio] = useState(S?.profile?.bio || 'Forging the demon back day by day.');

  // Current weight pulled from bio-scan or store history
  const currentWeight = S?.bodyweight?.length 
    ? S.bodyweight[S.bodyweight.length - 1].w 
    : (S?.bioScan?.weight || 78.95);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const authUser = session.user;
          setUserEmail(authUser.email || '');
          const meta = authUser.user_metadata || {};
          if (meta.full_name && !S?.profile?.name) setDisplayName(meta.full_name);
          if (meta.goal && !S?.profile?.goal) setGoal(meta.goal);
          if (meta.split && !S?.profile?.split) setSplit(meta.split);
          if (meta.heightCm && !S?.profile?.heightCm) setHeightCm(meta.heightCm);
          if (meta.targetWeight && !S?.profile?.targetWeight) setTargetWeight(meta.targetWeight);
          if (meta.bio && !S?.profile?.bio) setBio(meta.bio);
        }
      } catch (err) {
        // Local store fallback
      }
    };
    fetchUser();
  }, [S?.profile]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const profileData = {
        name: displayName,
        goal,
        split,
        heightCm,
        targetWeight,
        bio,
      };

      // 1. Save locally to OpenGym store
      if (typeof update === 'function') {
        update((s) => {
          s.profile = profileData;
          s.targetW = parseFloat(targetWeight) || s.targetW;
        });
      } else {
        localStorage.setItem('openGym_profile', JSON.stringify(profileData));
      }

      // 2. Sync to Supabase auth metadata if authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase.auth.updateUser({
          data: {
            full_name: displayName,
            goal,
            split,
            heightCm,
            targetWeight,
            bio,
          },
        });
      }

      setMessage('Profile updated successfully! ⚔️');
      setIsEditing(false);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Profile saved locally! ⚔️');
      setIsEditing(false);
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Sign out error:', err);
    }
    window.location.reload();
  };

  const handleExportData = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(S, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `openGym_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div style={styles.container}>
      {/* Top Header */}
      <div style={styles.header}>
        <div>
          <span style={{ ...styles.subtitle, color: currentRank.badgeColor }}>
            WARRIOR DOSSIER
          </span>
          <h1 style={styles.title}>Warrior Profile</h1>
        </div>
        <button
          onClick={() => setIsEditing(!isEditing)}
          style={{
            ...styles.editHeaderBtn,
            backgroundColor: isEditing ? 'rgba(255,255,255,0.1)' : currentRank.badgeColor,
            color: isEditing ? '#ffffff' : '#000000',
            boxShadow: isEditing ? 'none' : `0 0 12px ${currentRank.glowColor}`,
          }}
        >
          {isEditing ? 'Cancel' : 'Edit Profile ✏️'}
        </button>
      </div>

      {message && (
        <div style={{ ...styles.alert, borderColor: currentRank.badgeColor, color: currentRank.badgeColor }}>
          {message}
        </div>
      )}

      {/* Profile Overview / Edit Form */}
      {isEditing ? (
        <form onSubmit={handleSaveProfile} style={styles.card}>
          <div style={styles.sectionHeader}>EDIT WARRIOR ATTRIBUTES</div>

          <div style={styles.inputGroup}>
            <label style={styles.inputLabel}>WARRIOR CALL-SIGN / NAME</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              style={styles.textInput}
              required
            />
          </div>

          <div style={styles.grid2}>
            <div style={styles.inputGroup}>
              <label style={styles.inputLabel}>HEIGHT (CM)</label>
              <input
                type="number"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                style={styles.textInput}
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.inputLabel}>TARGET WEIGHT (KG)</label>
              <input
                type="number"
                step="0.1"
                value={targetWeight}
                onChange={(e) => setTargetWeight(e.target.value)}
                style={styles.textInput}
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.inputLabel}>PRIMARY TRAINING GOAL</label>
            <select
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              style={styles.selectInput}
            >
              <option value="Hypertrophy">Hypertrophy (Muscle Growth)</option>
              <option value="Raw Strength">Raw Strength & Powerlifting</option>
              <option value="Lean Recomposition">Lean Recomposition (Cut/Tone)</option>
              <option value="Athletic Conditioning">Athletic Conditioning</option>
            </select>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.inputLabel}>FAVORITE SPLIT</label>
            <select
              value={split}
              onChange={(e) => setSplit(e.target.value)}
              style={styles.selectInput}
            >
              <option value="Push / Pull / Legs">Push / Pull / Legs (PPL)</option>
              <option value="Upper / Lower">Upper / Lower Split</option>
              <option value="Arnold Split">Arnold Split (Chest/Back, Shoulders/Arms, Legs)</option>
              <option value="Full Body 3x">Full Body 3x Weekly</option>
            </select>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.inputLabel}>PHILOSOPHY / BIO</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              style={{ ...styles.textInput, minHeight: '65px', resize: 'vertical' }}
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            style={{
              ...styles.saveBtn,
              backgroundColor: currentRank.badgeColor,
              boxShadow: `0 0 16px ${currentRank.glowColor}`,
            }}
          >
            {saving ? 'Saving...' : 'Save Profile Changes ⚔️'}
          </button>
        </form>
      ) : (
        <>
          {/* Main User Card */}
          <div style={styles.card}>
            <div style={styles.avatarRow}>
              <div
                style={{
                  ...styles.avatar,
                  borderColor: currentRank.badgeColor,
                  boxShadow: `0 0 15px ${currentRank.glowColor}`,
                }}
              >
                ⚔️
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={styles.userName}>{displayName}</h2>
                <span style={styles.userEmail}>{userEmail || 'Local Warrior Account'}</span>
                <p style={styles.bioText}>"{bio}"</p>
              </div>
            </div>

            {/* Rank Pill */}
            <div
              style={{
                ...styles.rankBadge,
                borderColor: currentRank.badgeColor,
                color: currentRank.badgeColor,
                boxShadow: `0 0 10px ${currentRank.glowColor}`,
              }}
            >
              <span>⚔️ LVL {currentRank.level} • {currentRank.fullTitle}</span>
            </div>
          </div>

          {/* Physique & Goal Matrix */}
          <div style={styles.sectionHeader}>PHYSICAL METRICS & GOALS</div>
          <div style={styles.grid2}>
            <div style={styles.statBox}>
              <span style={styles.statLabel}>Current Weight</span>
              <div style={styles.statVal}>
                {currentWeight} <span style={styles.unit}>kg</span>
              </div>
              <span style={{ fontSize: '0.68rem', color: '#888' }}>
                Target: {targetWeight} kg
              </span>
            </div>

            <div style={styles.statBox}>
              <span style={styles.statLabel}>Height</span>
              <div style={styles.statVal}>
                {heightCm} <span style={styles.unit}>cm</span>
              </div>
              <span style={{ fontSize: '0.68rem', color: currentRank.badgeColor }}>
                {goal}
              </span>
            </div>
          </div>

          {/* Training Style Card */}
          <div style={styles.card}>
            <div style={styles.settingRow}>
              <span>Training Focus</span>
              <span style={{ ...styles.settingValue, color: currentRank.badgeColor }}>
                {goal}
              </span>
            </div>
            <div style={styles.divider} />
            <div style={styles.settingRow}>
              <span>Favorite Split</span>
              <span style={styles.settingValue}>{split}</span>
            </div>
            <div style={styles.divider} />
            <div style={styles.settingRow}>
              <span>Streak Milestone</span>
              <span style={{ ...styles.settingValue, color: currentRank.badgeColor }}>
                {currentRank.nextTarget}
              </span>
            </div>
          </div>

          {/* Smart Bio-Scan Section with Upload Trigger */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.8rem' }}>
            <div style={styles.sectionHeader}>BODY COMPOSITION & BIO-SCAN</div>
            <button
              onClick={() => setShowBioModal(true)}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#fff',
                fontSize: '0.7rem',
                fontWeight: '700',
                padding: '0.25rem 0.65rem',
                borderRadius: '10px',
                cursor: 'pointer'
              }}
            >
              + Upload Report / Scan
            </button>
          </div>

          <BioScanCard 
            bioData={S?.bioScan || INITIAL_BIO_SCAN} 
            badgeColor={currentRank.badgeColor} 
          />

          <BioScanUploadModal
            isOpen={showBioModal}
            onClose={() => setShowBioModal(false)}
            badgeColor={currentRank.badgeColor}
            onScanComplete={(newScan) => {
              update((s) => {
                s.bioScan = newScan;
                if (newScan.weight) {
                  s.bodyweight.push({ d: newScan.reportDate, w: newScan.weight });
                }
              });
              setMessage('Bio-Scan successfully updated! 📊');
              setTimeout(() => setMessage(''), 3000);
            }}
          />
        </>
      )}

      {/* App Data & Session Management */}
      <div style={styles.sectionHeader}>DATA & BACKUP</div>
      <div style={styles.card}>
        <div style={styles.settingRow}>
          <div>
            <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>Export Workout Data</div>
            <div style={{ fontSize: '0.72rem', color: '#888' }}>Download full JSON history backup</div>
          </div>
          <button onClick={handleExportData} style={styles.exportBtn}>
            Export JSON
          </button>
        </div>
      </div>

      <div style={styles.sectionHeader}>SESSION</div>
      <div style={styles.card}>
        <button onClick={handleSignOut} style={styles.signOutBtn}>
          Sign Out of Account
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '2.5rem 1.25rem 7.5rem 1.25rem',
    maxWidth: '440px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.2rem',
    boxSizing: 'border-box',
    color: '#ffffff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    backgroundColor: 'transparent',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  subtitle: {
    fontSize: '0.7rem',
    fontWeight: '700',
    letterSpacing: '0.8px',
  },
  title: {
    fontSize: '1.8rem',
    fontWeight: '800',
    margin: '0.15rem 0 0 0',
    letterSpacing: '-0.5px',
  },
  editHeaderBtn: {
    padding: '0.45rem 0.85rem',
    borderRadius: '14px',
    border: 'none',
    fontSize: '0.78rem',
    fontWeight: '800',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  card: {
    backgroundColor: 'rgba(18, 18, 22, 0.75)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '20px',
    padding: '1.2rem',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.35)',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.85rem',
  },
  avatarRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '1rem',
  },
  avatar: {
    width: '54px',
    height: '54px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    border: '2px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.5rem',
    flexShrink: 0,
  },
  userName: {
    fontSize: '1.25rem',
    fontWeight: '800',
    margin: '0 0 0.15rem 0',
  },
  userEmail: {
    fontSize: '0.75rem',
    color: '#888',
    display: 'block',
  },
  bioText: {
    fontSize: '0.78rem',
    color: '#bbb',
    margin: '0.4rem 0 0 0',
    fontStyle: 'italic',
  },
  rankBadge: {
    padding: '0.4rem 0.8rem',
    borderRadius: '12px',
    border: '1px solid',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    fontSize: '0.75rem',
    fontWeight: '700',
    textAlign: 'center',
  },
  sectionHeader: {
    fontSize: '0.68rem',
    fontWeight: '800',
    color: '#888',
    letterSpacing: '0.8px',
    marginTop: '0.3rem',
    paddingLeft: '0.2rem',
  },
  grid2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.85rem',
  },
  statBox: {
    backgroundColor: 'rgba(18, 18, 22, 0.75)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '18px',
    padding: '1rem',
    backdropFilter: 'blur(16px)',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.2rem',
  },
  statLabel: {
    fontSize: '0.7rem',
    color: '#888',
    fontWeight: '600',
  },
  statVal: {
    fontSize: '1.35rem',
    fontWeight: '800',
  },
  unit: {
    fontSize: '0.8rem',
    color: '#aaa',
  },
  settingRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.88rem',
    padding: '0.2rem 0',
  },
  settingValue: {
    fontWeight: '700',
    fontSize: '0.82rem',
  },
  divider: {
    height: '1px',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
  },
  inputLabel: {
    fontSize: '0.65rem',
    fontWeight: '700',
    color: '#888',
    letterSpacing: '0.6px',
  },
  textInput: {
    width: '100%',
    padding: '0.75rem 0.9rem',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '12px',
    color: '#ffffff',
    fontSize: '0.88rem',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  selectInput: {
    width: '100%',
    padding: '0.75rem 0.9rem',
    backgroundColor: 'rgba(20, 20, 25, 0.95)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '12px',
    color: '#ffffff',
    fontSize: '0.88rem',
    outline: 'none',
    boxSizing: 'border-box',
  },
  saveBtn: {
    width: '100%',
    padding: '0.85rem',
    color: '#000000',
    border: 'none',
    borderRadius: '14px',
    fontSize: '0.9rem',
    fontWeight: '800',
    cursor: 'pointer',
    marginTop: '0.4rem',
  },
  exportBtn: {
    padding: '0.4rem 0.75rem',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '10px',
    color: '#ffffff',
    fontSize: '0.75rem',
    fontWeight: '700',
    cursor: 'pointer',
  },
  signOutBtn: {
    width: '100%',
    padding: '0.85rem',
    backgroundColor: 'rgba(255, 68, 68, 0.15)',
    border: '1px solid rgba(255, 68, 68, 0.4)',
    borderRadius: '14px',
    color: '#ff6b6b',
    fontWeight: '700',
    fontSize: '0.9rem',
    cursor: 'pointer',
  },
  alert: {
    padding: '0.75rem 1rem',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    border: '1px solid',
    borderRadius: '14px',
    fontSize: '0.8rem',
    textAlign: 'center',
    fontWeight: '600',
  },
};