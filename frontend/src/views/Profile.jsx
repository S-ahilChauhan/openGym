// frontend/src/views/Profile.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useStore, INITIAL_BIO_SCAN } from '../store/useStore.js';
import { getStreakRank } from '../utils/ranks';
import { streakWeeks } from '../lib/history.js';
import { fmtDate } from '../lib/format.js';
import BioScanCard from '../components/BioScanCard.jsx';
import BioScanUploadModal from '../components/BioScanUploadModal.jsx';

export default function Profile({ rankWeeks = null }) {
  const S = useStore((s) => s.S);
  const user = useStore((s) => s.user);
  const update = useStore((s) => s.update);

  const activeWeeks = rankWeeks !== null ? rankWeeks : streakWeeks(S);
  const currentRank = getStreakRank(activeWeeks);

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [showBioModal, setShowBioModal] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  const p = S?.profile || {};

  function todayDate() {
    return new Date().toISOString().slice(0, 10);
  }

  // Sanitized & Dynamic Initial State (No hardcoded personal data)
  const [displayName, setDisplayName] = useState(p.name || user?.name || '');
  const [userEmail, setUserEmail] = useState(user?.email || '');
  const [heightCm, setHeightCm] = useState(p.heightCm || '');
  const [bio, setBio] = useState(p.bio || '');
  const [bloodGroup, setBloodGroup] = useState(p.bloodGroup || 'Select');
  const [restingHR, setRestingHR] = useState(p.restingHR || '');
  const [bloodPressure, setBloodPressure] = useState(p.bloodPressure || '');
  const [injuries, setInjuries] = useState(p.injuries || 'None');
  const [allergies, setAllergies] = useState(p.allergies || 'None');
  const [somatotype, setSomatotype] = useState(p.somatotype || 'Mesomorph');
  const [dominantHand, setDominantHand] = useState(p.dominantHand || 'Right');
  const [trainingDays, setTrainingDays] = useState(p.trainingDays || '4');
  const [sessionDuration, setSessionDuration] = useState(p.sessionDuration || '60');
  const [equipment, setEquipment] = useState(p.equipment || 'Full Gym');
  const [avoidExercises, setAvoidExercises] = useState(p.avoidExercises || '');
  const [targetWeight, setTargetWeight] = useState(p.targetWeight || '');
  const [targetBodyFat, setTargetBodyFat] = useState(p.targetBodyFat || '');
  const [targetDate, setTargetDate] = useState(p.targetDate || '');
  const [goal, setGoal] = useState(p.goal || 'Hypertrophy');

  // Blank tape measurements
  const [measurements, setMeasurements] = useState(p.measurements || {
    chest: '',
    waist: '',
    hips: '',
    bicepL: '',
    bicepR: '',
    thighL: '',
    thighR: '',
    calfL: '',
    calfR: '',
    neck: '',
    shoulders: ''
  });
  const measurementsUpdated = p.measurementsUpdatedAt || 'Not recorded';

  // Extended Body Composition
  const [waterPct, setWaterPct] = useState(p.waterPct || '');
  const [boneDensityScore, setBoneDensityScore] = useState(p.boneDensityScore || '');

  // Progress Photos
  const [photos, setPhotos] = useState(p.photos || { front: null, side: null, back: null, date: null });

  // Latest Weight & Weight Last Updated Date
  const latestBWEntry = S?.bodyweight?.length ? S.bodyweight[S.bodyweight.length - 1] : null;
  const currentWeight = latestBWEntry ? latestBWEntry.w : (S?.bioScan?.weight || null);
  const weightUpdatedDate = latestBWEntry?.d ? fmtDate(latestBWEntry.d, true) : (S?.bioScan?.reportDate || 'Not recorded');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUserEmail(session.user.email || '');
          if (!displayName && session.user.user_metadata?.name) {
            setDisplayName(session.user.user_metadata.name);
          }
        }
      } catch (err) {}
    };
    fetchUser();
  }, []);

  const handlePhotoUpload = (key, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setPhotos((prev) => ({
        ...prev,
        [key]: event.target?.result,
        date: todayDate()
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setMessage('');

    const profileData = {
      name: displayName,
      heightCm,
      bio,
      bloodGroup,
      restingHR,
      bloodPressure,
      injuries,
      allergies,
      somatotype,
      dominantHand,
      trainingDays,
      sessionDuration,
      equipment,
      avoidExercises,
      targetWeight,
      targetBodyFat,
      targetDate,
      goal,
      measurements,
      measurementsUpdatedAt: todayDate(),
      waterPct,
      boneDensityScore,
      photos
    };

    try {
      update((s) => {
        s.profile = profileData;
        if (targetWeight) s.targetW = parseFloat(targetWeight);
      });

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase.auth.updateUser({ data: { profile: profileData } });
      }

      setMessage('Warrior profile updated & locked in! ⚔️');
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
    try { await supabase.auth.signOut(); } catch (err) {}
    window.location.reload();
  };

  const handleExportData = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(S, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `openGym_backup_${todayDate()}.json`);
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

      {/* Editing View */}
      {isEditing ? (
        <form onSubmit={handleSaveProfile} style={styles.card}>
          <div style={styles.tabNav}>
            {['Basic', 'Tape', 'Health', 'Prefs', 'Goals', 'Photos'].map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => setActiveTab(t.toLowerCase())}
                style={{
                  ...styles.tabBtn,
                  borderBottom: activeTab === t.toLowerCase() ? `2px solid ${currentRank.badgeColor}` : 'none',
                  color: activeTab === t.toLowerCase() ? '#fff' : '#777'
                }}
              >
                {t}
              </button>
            ))}
          </div>

          {/* TAB 1: BASIC INFO */}
          {activeTab === 'basic' && (
            <div style={styles.sectionCol}>
              <div style={styles.inputGroup}>
                <label style={styles.inputLabel}>CALL-SIGN / NAME</label>
                <input 
                  type="text" 
                  placeholder="Enter your name"
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
                    placeholder="e.g. 175"
                    value={heightCm} 
                    onChange={(e) => setHeightCm(e.target.value)} 
                    style={styles.textInput} 
                  />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.inputLabel}>SOMATOTYPE</label>
                  <select value={somatotype} onChange={(e) => setSomatotype(e.target.value)} style={styles.selectInput}>
                    <option value="Mesomorph">Mesomorph (Athletic / Muscular)</option>
                    <option value="Ectomorph">Ectomorph (Lean / Fast Metabolism)</option>
                    <option value="Endomorph">Endomorph (Solid / Slower Metabolism)</option>
                  </select>
                </div>
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.inputLabel}>DOMINANT HAND</label>
                <select value={dominantHand} onChange={(e) => setDominantHand(e.target.value)} style={styles.selectInput}>
                  <option value="Right">Right Handed</option>
                  <option value="Left">Left Handed</option>
                  <option value="Ambidextrous">Ambidextrous</option>
                </select>
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.inputLabel}>WARRIOR MANTRA / BIO</label>
                <textarea 
                  placeholder="Your personal fitness quote or motivation..."
                  value={bio} 
                  onChange={(e) => setBio(e.target.value)} 
                  style={{ ...styles.textInput, minHeight: '60px' }} 
                />
              </div>
            </div>
          )}

          {/* TAB 2: TAPE MEASUREMENTS (INCHES) */}
          {activeTab === 'tape' && (
            <div style={styles.sectionCol}>
              <div style={styles.sectionHelp}>Track limb & torso girth in inches:</div>
              <div style={styles.grid3}>
                <div style={styles.inputGroup}>
                  <label style={styles.inputLabel}>CHEST</label>
                  <input type="number" step="0.1" placeholder="—" value={measurements.chest || ''} onChange={(e) => setMeasurements({ ...measurements, chest: e.target.value })} style={styles.textInput} />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.inputLabel}>WAIST</label>
                  <input type="number" step="0.1" placeholder="—" value={measurements.waist || ''} onChange={(e) => setMeasurements({ ...measurements, waist: e.target.value })} style={styles.textInput} />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.inputLabel}>HIPS</label>
                  <input type="number" step="0.1" placeholder="—" value={measurements.hips || ''} onChange={(e) => setMeasurements({ ...measurements, hips: e.target.value })} style={styles.textInput} />
                </div>
              </div>
              <div style={styles.grid2}>
                <div style={styles.inputGroup}>
                  <label style={styles.inputLabel}>LEFT BICEP</label>
                  <input type="number" step="0.1" placeholder="—" value={measurements.bicepL || ''} onChange={(e) => setMeasurements({ ...measurements, bicepL: e.target.value })} style={styles.textInput} />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.inputLabel}>RIGHT BICEP</label>
                  <input type="number" step="0.1" placeholder="—" value={measurements.bicepR || ''} onChange={(e) => setMeasurements({ ...measurements, bicepR: e.target.value })} style={styles.textInput} />
                </div>
              </div>
              <div style={styles.grid2}>
                <div style={styles.inputGroup}>
                  <label style={styles.inputLabel}>LEFT THIGH</label>
                  <input type="number" step="0.1" placeholder="—" value={measurements.thighL || ''} onChange={(e) => setMeasurements({ ...measurements, thighL: e.target.value })} style={styles.textInput} />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.inputLabel}>RIGHT THIGH</label>
                  <input type="number" step="0.1" placeholder="—" value={measurements.thighR || ''} onChange={(e) => setMeasurements({ ...measurements, thighR: e.target.value })} style={styles.textInput} />
                </div>
              </div>
              <div style={styles.grid2}>
                <div style={styles.inputGroup}>
                  <label style={styles.inputLabel}>SHOULDERS</label>
                  <input type="number" step="0.1" placeholder="—" value={measurements.shoulders || ''} onChange={(e) => setMeasurements({ ...measurements, shoulders: e.target.value })} style={styles.textInput} />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.inputLabel}>NECK</label>
                  <input type="number" step="0.1" placeholder="—" value={measurements.neck || ''} onChange={(e) => setMeasurements({ ...measurements, neck: e.target.value })} style={styles.textInput} />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: HEALTH & MEDICAL */}
          {activeTab === 'health' && (
            <div style={styles.sectionCol}>
              <div style={styles.grid3}>
                <div style={styles.inputGroup}>
                  <label style={styles.inputLabel}>BLOOD GROUP</label>
                  <select value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} style={styles.selectInput}>
                    <option value="Select">Select</option>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                  </select>
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.inputLabel}>RESTING HR (BPM)</label>
                  <input type="number" placeholder="e.g. 65" value={restingHR} onChange={(e) => setRestingHR(e.target.value)} style={styles.textInput} />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.inputLabel}>BP (SYS/DIA)</label>
                  <input type="text" placeholder="e.g. 120/80" value={bloodPressure} onChange={(e) => setBloodPressure(e.target.value)} style={styles.textInput} />
                </div>
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.inputLabel}>KNOWN INJURIES / LIMITATIONS</label>
                <input type="text" placeholder="e.g. Shoulder impingement, knee pain, or None" value={injuries} onChange={(e) => setInjuries(e.target.value)} style={styles.textInput} />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.inputLabel}>ALLERGIES & MEDICAL NOTES</label>
                <input type="text" placeholder="e.g. None" value={allergies} onChange={(e) => setAllergies(e.target.value)} style={styles.textInput} />
              </div>
              <div style={styles.grid2}>
                <div style={styles.inputGroup}>
                  <label style={styles.inputLabel}>BODY WATER (%)</label>
                  <input type="number" step="0.1" placeholder="Optional" value={waterPct} onChange={(e) => setWaterPct(e.target.value)} style={styles.textInput} />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.inputLabel}>BONE DENSITY SCORE</label>
                  <input type="text" placeholder="Optional" value={boneDensityScore} onChange={(e) => setBoneDensityScore(e.target.value)} style={styles.textInput} />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TRAINING PREFERENCES */}
          {activeTab === 'prefs' && (
            <div style={styles.sectionCol}>
              <div style={styles.grid2}>
                <div style={styles.inputGroup}>
                  <label style={styles.inputLabel}>DAYS / WEEK</label>
                  <select value={trainingDays} onChange={(e) => setTrainingDays(e.target.value)} style={styles.selectInput}>
                    {['2', '3', '4', '5', '6', '7'].map(d => <option key={d} value={d}>{d} Days</option>)}
                  </select>
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.inputLabel}>SESSION TIME (MINS)</label>
                  <input type="number" placeholder="60" value={sessionDuration} onChange={(e) => setSessionDuration(e.target.value)} style={styles.textInput} />
                </div>
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.inputLabel}>EQUIPMENT ACCESS</label>
                <select value={equipment} onChange={(e) => setEquipment(e.target.value)} style={styles.selectInput}>
                  <option value="Full Gym">Full Commercial Gym (Barbells, Cables, Dumbbells)</option>
                  <option value="Home Gym">Home Gym (Dumbbells & Bench)</option>
                  <option value="Bodyweight Only">Calisthenics / Bodyweight Only</option>
                </select>
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.inputLabel}>EXERCISES TO AVOID</label>
                <input type="text" placeholder="e.g. Behind-neck press, Barbell Deadlift" value={avoidExercises} onChange={(e) => setAvoidExercises(e.target.value)} style={styles.textInput} />
              </div>
            </div>
          )}

          {/* TAB 5: GOALS & TARGETS */}
          {activeTab === 'goals' && (
            <div style={styles.sectionCol}>
              <div style={styles.inputGroup}>
                <label style={styles.inputLabel}>PRIMARY GOAL</label>
                <select value={goal} onChange={(e) => setGoal(e.target.value)} style={styles.selectInput}>
                  <option value="Hypertrophy">Hypertrophy (Muscle Building)</option>
                  <option value="Lean Recomposition">Lean Recomposition (Lose Fat & Gain Muscle)</option>
                  <option value="Raw Strength">Raw Strength & Powerlifting</option>
                  <option value="Fat Loss">Fat Loss & Definition</option>
                  <option value="Athletic Conditioning">Athletic Conditioning</option>
                </select>
              </div>
              <div style={styles.grid3}>
                <div style={styles.inputGroup}>
                  <label style={styles.inputLabel}>TARGET WT (KG)</label>
                  <input type="number" step="0.1" placeholder="e.g. 75" value={targetWeight} onChange={(e) => setTargetWeight(e.target.value)} style={styles.textInput} />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.inputLabel}>TARGET BODY FAT %</label>
                  <input type="number" step="0.1" placeholder="e.g. 15" value={targetBodyFat} onChange={(e) => setTargetBodyFat(e.target.value)} style={styles.textInput} />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.inputLabel}>TARGET DATE</label>
                  <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} style={styles.textInput} />
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: PROGRESS PHOTOS */}
          {activeTab === 'photos' && (
            <div style={styles.sectionCol}>
              <div style={styles.sectionHelp}>Upload front, side & back check-in photos:</div>
              <div style={styles.grid3}>
                {['front', 'side', 'back'].map((pose) => (
                  <div key={pose} style={styles.photoUploadBox}>
                    <input type="file" accept="image/*" id={`photo-${pose}`} style={{ display: 'none' }} onChange={(e) => handlePhotoUpload(pose, e)} />
                    <label htmlFor={`photo-${pose}`} style={styles.photoLabel}>
                      {photos[pose] ? (
                        <img src={photos[pose]} alt={pose} style={styles.photoPreview} />
                      ) : (
                        <div style={styles.emptyPhotoBox}>
                          <span>📸</span>
                          <span style={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>{pose}</span>
                        </div>
                      )}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

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
        /* DISPLAY VIEW */
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
                <h2 style={styles.userName}>{displayName || 'Warrior'}</h2>
                <span style={styles.userEmail}>{userEmail || 'Local Account'}</span>
                {bio && <p style={styles.bioText}>"{bio}"</p>}
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

          {/* Physical Archetype & Targets */}
          <div style={styles.sectionHeader}>PHYSICAL ARCHETYPE & TARGETS</div>
          <div style={styles.grid3}>
            <div style={styles.statBox}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={styles.statLabel}>Current Weight</span>
                <span style={styles.timestampBadge}>{weightUpdatedDate}</span>
              </div>
              <div style={styles.statVal}>
                {currentWeight ? currentWeight : '—'} <span style={styles.unit}>{currentWeight ? 'kg' : ''}</span>
              </div>
              <span style={{ fontSize: '0.65rem', color: '#888' }}>
                Target: {targetWeight ? `${targetWeight} kg` : 'Not set'}
              </span>
            </div>
            <div style={styles.statBox}>
              <span style={styles.statLabel}>Body Fat</span>
              <div style={styles.statVal}>
                {S?.bioScan?.bodyFatPct ? S.bioScan.bodyFatPct : '—'} <span style={styles.unit}>{S?.bioScan?.bodyFatPct ? '%' : ''}</span>
              </div>
              <span style={{ fontSize: '0.65rem', color: '#888' }}>
                Target: {targetBodyFat ? `${targetBodyFat}%` : 'Not set'}
              </span>
            </div>
            <div style={styles.statBox}>
              <span style={styles.statLabel}>Somatotype</span>
              <div style={{ ...styles.statVal, fontSize: '1rem', marginTop: '0.2rem' }}>{somatotype}</div>
              <span style={{ fontSize: '0.65rem', color: currentRank.badgeColor }}>{dominantHand} Hand</span>
            </div>
          </div>

          {/* Tape Measurements Card */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.3rem' }}>
            <div style={styles.sectionHeader}>BODY TAPE MEASUREMENTS (INCHES)</div>
            <span style={styles.timestampBadge}>Updated: {measurementsUpdated}</span>
          </div>
          <div style={styles.card}>
            <div style={styles.measureGrid}>
              <div style={styles.measureItem}><span style={styles.mLabel}>Chest</span><span style={styles.mVal}>{measurements.chest ? `${measurements.chest}"` : '—'}</span></div>
              <div style={styles.measureItem}><span style={styles.mLabel}>Waist</span><span style={styles.mVal}>{measurements.waist ? `${measurements.waist}"` : '—'}</span></div>
              <div style={styles.measureItem}><span style={styles.mLabel}>Hips</span><span style={styles.mVal}>{measurements.hips ? `${measurements.hips}"` : '—'}</span></div>
              <div style={styles.measureItem}><span style={styles.mLabel}>Shoulders</span><span style={styles.mVal}>{measurements.shoulders ? `${measurements.shoulders}"` : '—'}</span></div>
              <div style={styles.measureItem}><span style={styles.mLabel}>Bicep (L/R)</span><span style={styles.mVal}>{measurements.bicepL || '—'} / {measurements.bicepR || '—'}"</span></div>
              <div style={styles.measureItem}><span style={styles.mLabel}>Thigh (L/R)</span><span style={styles.mVal}>{measurements.thighL || '—'} / {measurements.thighR || '—'}"</span></div>
            </div>
          </div>

          {/* Health & Safety Dossier */}
          <div style={styles.sectionHeader}>HEALTH & SAFETY DOSSIER</div>
          <div style={styles.card}>
            <div style={styles.settingRow}>
              <span>Blood Group</span>
              <span style={{ ...styles.settingValue, color: '#FF85A2' }}>{bloodGroup !== 'Select' ? bloodGroup : '—'}</span>
            </div>
            <div style={styles.divider} />
            <div style={styles.settingRow}>
              <span>Cardiovascular</span>
              <span style={styles.settingValue}>
                {restingHR ? `${restingHR} bpm` : '—'} · {bloodPressure ? `${bloodPressure} BP` : '—'}
              </span>
            </div>
            <div style={styles.divider} />
            <div style={styles.settingRow}>
              <span>Injuries / Limitations</span>
              <span style={{ ...styles.settingValue, color: injuries !== 'None' ? '#F59E0B' : '#888' }}>{injuries}</span>
            </div>
            <div style={styles.divider} />
            <div style={styles.settingRow}>
              <span>Body Water / Bone Score</span>
              <span style={styles.settingValue}>
                {waterPct ? `${waterPct}%` : '—'} · {boneDensityScore ? boneDensityScore : '—'}
              </span>
            </div>
          </div>

          {/* Training Protocol */}
          <div style={styles.sectionHeader}>TRAINING PROTOCOL</div>
          <div style={styles.card}>
            <div style={styles.settingRow}>
              <span>Training Frequency</span>
              <span style={styles.settingValue}>{trainingDays} Days / Week ({sessionDuration} mins)</span>
            </div>
            <div style={styles.divider} />
            <div style={styles.settingRow}>
              <span>Equipment Setup</span>
              <span style={styles.settingValue}>{equipment}</span>
            </div>
            <div style={styles.divider} />
            <div style={styles.settingRow}>
              <span>Avoid List</span>
              <span style={{ ...styles.settingValue, color: '#aaa' }}>{avoidExercises || 'None'}</span>
            </div>
          </div>

          {/* Progress Photo Vault */}
          <div style={styles.sectionHeader}>PROGRESS PHOTO VAULT</div>
          <div style={styles.card}>
            <div style={styles.grid3}>
              {['front', 'side', 'back'].map((pose) => (
                <div key={pose} style={styles.photoDisplayBox}>
                  {photos[pose] ? (
                    <img src={photos[pose]} alt={pose} style={styles.photoPreview} />
                  ) : (
                    <div style={styles.emptyPhotoBox}>
                      <span>📷</span>
                      <span style={{ fontSize: '0.62rem', color: '#666', textTransform: 'uppercase' }}>No {pose}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {photos.date && <div style={{ fontSize: '0.65rem', color: '#777', textAlign: 'center' }}>Vault Checked: {photos.date}</div>}
          </div>

          {/* Smart Bio-Scan Section */}
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
          <button onClick={handleExportData} style={styles.exportBtn}>Export JSON</button>
        </div>
      </div>

      <div style={styles.sectionHeader}>SESSION</div>
      <div style={styles.card}>
        <button onClick={handleSignOut} style={styles.signOutBtn}>Sign Out of Account</button>
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
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  subtitle: { fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.8px' },
  title: { fontSize: '1.8rem', fontWeight: '800', margin: '0.15rem 0 0 0', letterSpacing: '-0.5px' },
  editHeaderBtn: { padding: '0.45rem 0.85rem', borderRadius: '14px', border: 'none', fontSize: '0.78rem', fontWeight: '800', cursor: 'pointer' },
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
  avatarRow: { display: 'flex', alignItems: 'flex-start', gap: '1rem' },
  avatar: { width: '54px', height: '54px', borderRadius: '50%', backgroundColor: 'rgba(255, 255, 255, 0.08)', border: '2px solid', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 },
  userName: { fontSize: '1.25rem', fontWeight: '800', margin: '0 0 0.15rem 0' },
  userEmail: { fontSize: '0.75rem', color: '#888', display: 'block' },
  bioText: { fontSize: '0.78rem', color: '#bbb', margin: '0.4rem 0 0 0', fontStyle: 'italic' },
  rankBadge: { padding: '0.4rem 0.8rem', borderRadius: '12px', border: '1px solid', backgroundColor: 'rgba(0, 0, 0, 0.4)', fontSize: '0.75rem', fontWeight: '700', textAlign: 'center' },
  sectionHeader: { fontSize: '0.68rem', fontWeight: '800', color: '#888', letterSpacing: '0.8px', marginTop: '0.3rem', paddingLeft: '0.2rem' },
  timestampBadge: { fontSize: '0.62rem', color: '#888', backgroundColor: 'rgba(255,255,255,0.05)', padding: '0.15rem 0.45rem', borderRadius: '8px', fontWeight: '600' },
  sectionHelp: { fontSize: '0.72rem', color: '#888', marginBottom: '0.5rem' },
  sectionCol: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' },
  grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.6rem' },
  statBox: { backgroundColor: 'rgba(18, 18, 22, 0.75)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '18px', padding: '0.85rem', backdropFilter: 'blur(16px)', display: 'flex', flexDirection: 'column', gap: '0.15rem' },
  statLabel: { fontSize: '0.65rem', color: '#888', fontWeight: '600' },
  statVal: { fontSize: '1.2rem', fontWeight: '800' },
  unit: { fontSize: '0.75rem', color: '#aaa' },
  measureGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' },
  measureItem: { display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0.6rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '10px', fontSize: '0.78rem' },
  mLabel: { color: '#888' },
  mVal: { fontWeight: '700' },
  settingRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', padding: '0.2rem 0' },
  settingValue: { fontWeight: '700', fontSize: '0.8rem' },
  divider: { height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.08)' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '0.3rem' },
  inputLabel: { fontSize: '0.65rem', fontWeight: '700', color: '#888', letterSpacing: '0.6px' },
  textInput: { width: '100%', padding: '0.65rem 0.8rem', backgroundColor: 'rgba(0, 0, 0, 0.45)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '12px', color: '#ffffff', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' },
  selectInput: { width: '100%', padding: '0.65rem 0.8rem', backgroundColor: 'rgba(20, 20, 25, 0.95)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '12px', color: '#ffffff', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' },
  tabNav: { display: 'flex', gap: '0.5rem', overflowX: 'auto', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginBottom: '0.5rem' },
  tabBtn: { background: 'none', border: 'none', padding: '0.3rem 0.4rem', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap' },
  photoUploadBox: { width: '100%', aspectRatio: '3/4', backgroundColor: 'rgba(0,0,0,0.4)', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '14px', overflow: 'hidden', cursor: 'pointer' },
  photoDisplayBox: { width: '100%', aspectRatio: '3/4', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', overflow: 'hidden' },
  photoLabel: { display: 'flex', width: '100%', height: '100%', cursor: 'pointer' },
  photoPreview: { width: '100%', height: '100%', objectFit: 'cover' },
  emptyPhotoBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', gap: '0.3rem' },
  saveBtn: { width: '100%', padding: '0.85rem', color: '#000000', border: 'none', borderRadius: '14px', fontSize: '0.9rem', fontWeight: '800', cursor: 'pointer', marginTop: '0.5rem' },
  exportBtn: { padding: '0.4rem 0.75rem', backgroundColor: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '10px', color: '#ffffff', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' },
  signOutBtn: { width: '100%', padding: '0.85rem', backgroundColor: 'rgba(255, 68, 68, 0.15)', border: '1px solid rgba(255, 68, 68, 0.4)', borderRadius: '14px', color: '#ff6b6b', fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer' },
  alert: { padding: '0.75rem 1rem', backgroundColor: 'rgba(0, 0, 0, 0.6)', border: '1px solid', borderRadius: '14px', fontSize: '0.8rem', textAlign: 'center', fontWeight: '600' }
};