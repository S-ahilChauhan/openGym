// frontend/src/components/PlanWizard.jsx
import React, { useState, useEffect } from 'react';
import { EXDB } from '../lib/exercises-data.js';
import Icon from './Icon.jsx';
import { Button } from './ui.jsx';

const ALL_BODY_PARTS = [
  { key: 'chest', label: 'Chest', keywords: ['chest', 'pec', 'push', 'upper'] },
  { key: 'back', label: 'Back', keywords: ['back', 'lat', 'pull', 'upper', 'trap'] },
  { key: 'shoulders', label: 'Shoulders', keywords: ['shoulder', 'delt', 'push', 'press', 'overhead'] },
  { key: 'upper arms', label: 'Biceps & Triceps', keywords: ['arm', 'bicep', 'tricep', 'curls', 'pushdown', 'pull', 'push'] },
  { key: 'lower arms', label: 'Forearms', keywords: ['forearm', 'wrist', 'grip', 'arm'] },
  { key: 'upper legs', label: 'Quads & Glutes', keywords: ['leg', 'quad', 'squat', 'glute', 'thrust', 'lower'] },
  { key: 'lower legs', label: 'Calves', keywords: ['calf', 'calves', 'leg', 'lower'] },
  { key: 'waist', label: 'Core / Abs', keywords: ['abs', 'core', 'waist', 'plank', 'crunch', 'hiit'] },
  { key: 'cardio', label: 'Cardio', keywords: ['cardio', 'run', 'cycle', 'treadmill', 'walk'] }
];

const DAYS = [
  { key: 1, label: 'Monday' },
  { key: 2, label: 'Tuesday' },
  { key: 3, label: 'Wednesday' },
  { key: 4, label: 'Thursday' },
  { key: 5, label: 'Friday' },
  { key: 6, label: 'Saturday' },
  { key: 0, label: 'Sunday' }
];

export default function PlanWizard({ isOpen, onClose, onGenerate, badgeColor = '#ff85a2' }) {
  if (!isOpen) return null;

  const [step, setStep] = useState(1);
  const [planName, setPlanName] = useState('Warrior Hypertrophy Plan');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [durationWeeks, setDurationWeeks] = useState(4);
  const [rotationType, setRotationType] = useState('2week');
  const [activeCycle, setActiveCycle] = useState('weekA');
  const [selectedDayKey, setSelectedDayKey] = useState(1);

  const [schedule, setSchedule] = useState({
    weekA: {
      1: { enabled: true, title: 'Legs & Core', exercises: [] },
      2: { enabled: true, title: 'Chest & Triceps', exercises: [] },
      3: { enabled: true, title: 'Back & Biceps', exercises: [] },
      4: { enabled: true, title: 'Shoulders & Abs', exercises: [] },
      5: { enabled: true, title: 'Arms & Forearms', exercises: [] },
      6: { enabled: false, title: 'Rest', exercises: [] },
      0: { enabled: false, title: 'Rest', exercises: [] }
    },
    weekB: {
      1: { enabled: true, title: 'Legs & Calves', exercises: [] },
      2: { enabled: true, title: 'Chest & Triceps', exercises: [] },
      3: { enabled: true, title: 'Back & Biceps', exercises: [] },
      4: { enabled: true, title: 'Shoulders & Core', exercises: [] },
      5: { enabled: true, title: 'Arms & Grip', exercises: [] },
      6: { enabled: false, title: 'Rest', exercises: [] },
      0: { enabled: false, title: 'Rest', exercises: [] }
    }
  });

  const [exerciseConfigs, setExerciseConfigs] = useState({});
  const [selectedBodyPart, setSelectedBodyPart] = useState('upper legs');
  const [showAllMuscles, setShowAllMuscles] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [customExName, setCustomExName] = useState('');

  const currentDayConfig = schedule[activeCycle][selectedDayKey] || { enabled: true, title: '', exercises: [] };

  const activeDayTitle = (currentDayConfig.title || '').toLowerCase();
  const matchedBodyParts = ALL_BODY_PARTS.filter(bp =>
    bp.keywords.some(kw => activeDayTitle.includes(kw))
  );

  const availableBodyParts = showAllMuscles || matchedBodyParts.length === 0
    ? ALL_BODY_PARTS
    : matchedBodyParts;

  useEffect(() => {
    if (matchedBodyParts.length > 0) {
      setSelectedBodyPart(matchedBodyParts[0].key);
    } else {
      setSelectedBodyPart(ALL_BODY_PARTS[0].key);
    }
    setSearchQuery('');
  }, [selectedDayKey, activeCycle]);

  const copyWeekAToWeekB = () => {
    setSchedule(prev => ({
      ...prev,
      weekB: JSON.parse(JSON.stringify(prev.weekA))
    }));
    setActiveCycle('weekB');
  };

  const toggleDayEnabled = (dayKey) => {
    setSchedule(prev => ({
      ...prev,
      [activeCycle]: {
        ...prev[activeCycle],
        [dayKey]: {
          ...prev[activeCycle][dayKey],
          enabled: !prev[activeCycle][dayKey]?.enabled
        }
      }
    }));
  };

  const setDayTitle = (dayKey, title) => {
    setSchedule(prev => ({
      ...prev,
      [activeCycle]: {
        ...prev[activeCycle],
        [dayKey]: {
          ...prev[activeCycle][dayKey],
          title
        }
      }
    }));
  };

  const addExerciseToDay = (ex) => {
    const currentExercises = schedule[activeCycle][selectedDayKey]?.exercises || [];
    if (currentExercises.some(e => e.id === ex.id || e.n === ex.n)) return;

    setSchedule(prev => ({
      ...prev,
      [activeCycle]: {
        ...prev[activeCycle],
        [selectedDayKey]: {
          ...prev[activeCycle][selectedDayKey],
          exercises: [...currentExercises, ex]
        }
      }
    }));

    if (!exerciseConfigs[ex.id]) {
      setExerciseConfigs(prev => ({
        ...prev,
        [ex.id]: { sets: 3, reps: 10, isBw: ex.eq === 'body weight' }
      }));
    }
  };

  const removeExerciseFromDay = (exId) => {
    setSchedule(prev => ({
      ...prev,
      [activeCycle]: {
        ...prev[activeCycle],
        [selectedDayKey]: {
          ...prev[activeCycle][selectedDayKey],
          exercises: (prev[activeCycle][selectedDayKey]?.exercises || []).filter(e => e.id !== exId)
        }
      }
    }));
  };

  const handleAddCustom = () => {
    if (!customExName.trim()) return;
    const cleanId = `custom_${customExName.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    const customEx = {
      id: cleanId,
      n: customExName.trim(),
      bp: selectedBodyPart,
      tg: 'custom',
      eq: 'custom',
      isCustom: true
    };
    addExerciseToDay(customEx);
    setCustomExName('');
  };

  const updateExConfig = (exId, field, val) => {
    setExerciseConfigs(prev => ({
      ...prev,
      [exId]: {
        ...(prev[exId] || { sets: 3, reps: 10, isBw: false }),
        [field]: val
      }
    }));
  };

  const handleFinish = () => {
    onGenerate({
      planName,
      startDate,
      durationWeeks,
      rotationType,
      schedule,
      exerciseConfigs
    });
    onClose();
  };

  const filteredExercises = EXDB.filter(e => {
    const matchesBp = !selectedBodyPart || e.bp === selectedBodyPart;
    const matchesSearch = !searchQuery || e.n.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesBp && matchesSearch;
  });

  const weekACount = Object.values(schedule.weekA).reduce((acc, d) => acc + (d?.exercises?.length || 0), 0);
  const weekBCount = Object.values(schedule.weekB).reduce((acc, d) => acc + (d?.exercises?.length || 0), 0);

  return (
    <div style={wizardStyles.overlay}>
      <div style={wizardStyles.modal}>
        {/* Header */}
        <div style={wizardStyles.modalHeader}>
          <div>
            <div style={{ ...wizardStyles.stepTag, color: badgeColor }}>STEP {step} OF 3</div>
            <h2 style={wizardStyles.modalTitle}>
              {step === 1 && 'Plan Name & Schedule Dates'}
              {step === 2 && 'Weekly Training Split'}
              {step === 3 && 'Day-by-Day Exercise Builder'}
            </h2>
          </div>
          <button style={wizardStyles.closeBtn} onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Body */}
        <div style={wizardStyles.modalBody}>
          {/* STEP 1 */}
          {step === 1 && (
            <div style={wizardStyles.sectionCol}>
              <div>
                <label style={wizardStyles.label}>PLAN NAME</label>
                <input
                  type="text"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  placeholder="e.g. 4-Week Hypertrophy Plan"
                  style={wizardStyles.input}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={wizardStyles.label}>START DATE</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    style={wizardStyles.input}
                  />
                </div>
                <div>
                  <label style={wizardStyles.label}>DURATION</label>
                  <select
                    value={durationWeeks}
                    onChange={(e) => setDurationWeeks(parseInt(e.target.value, 10))}
                    style={wizardStyles.select}
                  >
                    <option value={2}>2 Weeks</option>
                    <option value={4}>4 Weeks</option>
                    <option value={8}>8 Weeks</option>
                    <option value={12}>12 Weeks</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={wizardStyles.label}>ROTATION FORMAT</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div
                    onClick={() => setRotationType('2week')}
                    style={{
                      ...wizardStyles.selectionCard,
                      borderColor: rotationType === '2week' ? badgeColor : 'rgba(255,255,255,0.1)'
                    }}
                  >
                    <div style={{ fontWeight: '800', fontSize: '0.92rem' }}>2-Week A/B Rotation (Weeks 1,3 vs 2,4)</div>
                    <div style={{ fontSize: '0.74rem', color: '#888', marginTop: 3 }}>
                      Generates distinct routines for Week 1, Week 2, Week 3, and Week 4 with individual dates.
                    </div>
                  </div>

                  <div
                    onClick={() => setRotationType('static')}
                    style={{
                      ...wizardStyles.selectionCard,
                      borderColor: rotationType === 'static' ? badgeColor : 'rgba(255,255,255,0.1)'
                    }}
                  >
                    <div style={{ fontWeight: '800', fontSize: '0.92rem' }}>Static Weekly Split</div>
                    <div style={{ fontSize: '0.74rem', color: '#888', marginTop: 3 }}>
                      Generates unique routines for each week using the same template.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div style={wizardStyles.sectionCol}>
              {rotationType === '2week' && (
                <div style={wizardStyles.toggleRow}>
                  <button
                    type="button"
                    onClick={() => setActiveCycle('weekA')}
                    style={{
                      ...wizardStyles.cycleToggle,
                      backgroundColor: activeCycle === 'weekA' ? badgeColor : 'rgba(255,255,255,0.06)',
                      color: activeCycle === 'weekA' ? '#0e0e12' : '#fff'
                    }}
                  >
                    Week A (Odd Weeks: 1, 3)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveCycle('weekB')}
                    style={{
                      ...wizardStyles.cycleToggle,
                      backgroundColor: activeCycle === 'weekB' ? badgeColor : 'rgba(255,255,255,0.06)',
                      color: activeCycle === 'weekB' ? '#0e0e12' : '#fff'
                    }}
                  >
                    Week B (Even Weeks: 2, 4)
                  </button>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {DAYS.map(({ key, label }) => {
                  const day = schedule[activeCycle][key] || { enabled: false, title: 'Rest' };
                  return (
                    <div key={key} style={wizardStyles.dayItemRow}>
                      <button
                        type="button"
                        onClick={() => toggleDayEnabled(key)}
                        style={{
                          ...wizardStyles.enableBtn,
                          backgroundColor: day.enabled ? badgeColor : 'rgba(255,255,255,0.1)',
                          color: day.enabled ? '#0e0e12' : '#777'
                        }}
                      >
                        {day.enabled ? 'ACTIVE' : 'REST'}
                      </button>
                      <div style={{ width: 90, fontWeight: '700', fontSize: '0.85rem' }}>{label}</div>
                      <input
                        type="text"
                        disabled={!day.enabled}
                        value={day.title}
                        onChange={(e) => setDayTitle(key, e.target.value)}
                        placeholder="e.g. Chest & Triceps"
                        style={{
                          ...wizardStyles.input,
                          opacity: day.enabled ? 1 : 0.4,
                          padding: '0.45rem 0.75rem',
                          fontSize: '0.82rem'
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div style={wizardStyles.sectionCol}>
              {rotationType === '2week' && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => setActiveCycle('weekA')}
                    style={{
                      ...wizardStyles.cycleToggle,
                      backgroundColor: activeCycle === 'weekA' ? badgeColor : 'rgba(255,255,255,0.06)',
                      color: activeCycle === 'weekA' ? '#0e0e12' : '#fff'
                    }}
                  >
                    Week A Template ({weekACount} ex)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveCycle('weekB')}
                    style={{
                      ...wizardStyles.cycleToggle,
                      backgroundColor: activeCycle === 'weekB' ? badgeColor : 'rgba(255,255,255,0.06)',
                      color: activeCycle === 'weekB' ? '#0e0e12' : '#fff'
                    }}
                  >
                    Week B Template ({weekBCount} ex)
                  </button>
                  {weekBCount === 0 && weekACount > 0 && (
                    <button
                      type="button"
                      onClick={copyWeekAToWeekB}
                      style={wizardStyles.copyBtn}
                    >
                      Copy A to B 📋
                    </button>
                  )}
                </div>
              )}

              {/* Day Selector Ribbon */}
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                {DAYS.map(({ key, label }) => {
                  const day = schedule[activeCycle][key];
                  if (!day?.enabled) return null;
                  const isSelected = selectedDayKey === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedDayKey(key)}
                      style={{
                        ...wizardStyles.chip,
                        borderColor: isSelected ? badgeColor : 'rgba(255,255,255,0.15)',
                        backgroundColor: isSelected ? 'rgba(255,255,255,0.15)' : 'transparent',
                        color: isSelected ? '#fff' : '#aaa',
                        boxShadow: isSelected ? `0 0 10px ${badgeColor}40` : 'none'
                      }}
                    >
                      {label.slice(0, 3)} ({day.exercises?.length || 0})
                    </button>
                  );
                })}
              </div>

              {/* Day Title */}
              <div style={wizardStyles.selectedDayHeader}>
                <div>
                  <span style={{ fontWeight: '800', fontSize: '0.98rem', color: '#fff' }}>
                    {DAYS.find(d => d.key === selectedDayKey)?.label}: {currentDayConfig.title || 'Workout'}
                  </span>
                  <div style={{ fontSize: '0.72rem', color: badgeColor, marginTop: '0.15rem' }}>
                    {rotationType === '2week' ? (activeCycle === 'weekA' ? 'Editing Week A (Odd Weeks)' : 'Editing Week B (Even Weeks)') : 'Weekly Template'}
                  </div>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#888' }}>
                  {currentDayConfig.exercises?.length || 0} exercises
                </span>
              </div>

              {/* Configured Exercises */}
              {currentDayConfig.exercises?.length > 0 && (
                <div style={wizardStyles.configuredList}>
                  {currentDayConfig.exercises.map((ex) => {
                    const cfg = exerciseConfigs[ex.id] || { sets: 3, reps: 10, isBw: false };
                    return (
                      <div key={ex.id} style={wizardStyles.configuredCard}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: '700', fontSize: '0.85rem' }}>{ex.n}</span>
                          <button
                            type="button"
                            onClick={() => removeExerciseFromDay(ex.id)}
                            style={wizardStyles.removeExBtn}
                          >
                            Remove ✕
                          </button>
                        </div>
                        <div style={wizardStyles.schemeRow}>
                          <div style={wizardStyles.stepperBox}>
                            <label style={wizardStyles.miniLabel}>SETS</label>
                            <input
                              type="number"
                              min="1"
                              max="10"
                              value={cfg.sets}
                              onChange={(e) => updateExConfig(ex.id, 'sets', parseInt(e.target.value, 10) || 1)}
                              style={wizardStyles.stepperInput}
                            />
                          </div>
                          <div style={wizardStyles.stepperBox}>
                            <label style={wizardStyles.miniLabel}>REPS</label>
                            <input
                              type="number"
                              min="1"
                              max="100"
                              value={cfg.reps}
                              onChange={(e) => updateExConfig(ex.id, 'reps', parseInt(e.target.value, 10) || 1)}
                              style={wizardStyles.stepperInput}
                            />
                          </div>
                          <label style={wizardStyles.bwToggle}>
                            <input
                              type="checkbox"
                              checked={!!cfg.isBw}
                              onChange={(e) => updateExConfig(ex.id, 'isBw', e.target.checked)}
                            />
                            <span style={{ fontSize: '0.72rem', color: cfg.isBw ? badgeColor : '#888' }}>
                              Bodyweight (BW)
                            </span>
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Context-Driven Muscle Filter Chips */}
              <div style={wizardStyles.libraryContainer}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
                    {availableBodyParts.map(bp => {
                      const isSelected = selectedBodyPart === bp.key;
                      return (
                        <button
                          key={bp.key}
                          type="button"
                          onClick={() => setSelectedBodyPart(bp.key)}
                          style={{
                            ...wizardStyles.miniChip,
                            borderColor: isSelected ? badgeColor : 'rgba(255,255,255,0.1)',
                            backgroundColor: isSelected ? 'rgba(255,255,255,0.15)' : 'transparent',
                            color: isSelected ? '#fff' : '#888'
                          }}
                        >
                          {bp.label}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAllMuscles(prev => !prev)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: showAllMuscles ? badgeColor : '#666',
                      fontSize: '0.68rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      marginLeft: 8
                    }}
                  >
                    {showAllMuscles ? 'Filter Day' : 'All Muscles'}
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="Search exercises..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ ...wizardStyles.input, padding: '0.4rem 0.6rem', fontSize: '0.8rem', marginBottom: 8 }}
                />

                <div style={wizardStyles.exResultScroll}>
                  {filteredExercises.slice(0, 35).map(ex => {
                    const isAdded = currentDayConfig.exercises?.some(e => e.id === ex.id);
                    return (
                      <div
                        key={ex.id}
                        onClick={() => !isAdded && addExerciseToDay(ex)}
                        style={{
                          ...wizardStyles.exSelectRow,
                          opacity: isAdded ? 0.4 : 1,
                          cursor: isAdded ? 'default' : 'pointer'
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '0.82rem', fontWeight: '700' }}>{ex.n}</div>
                          <div style={{ fontSize: '0.68rem', color: '#777' }}>
                            {ex.bp} · {ex.eq}
                          </div>
                        </div>
                        <span style={{ color: isAdded ? '#888' : badgeColor, fontWeight: '800' }}>
                          {isAdded ? '✓ Added' : '+ Add'}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div style={wizardStyles.customExRow}>
                  <input
                    type="text"
                    placeholder="Or type custom exercise name..."
                    value={customExName}
                    onChange={(e) => setCustomExName(e.target.value)}
                    style={{ ...wizardStyles.input, flex: 1, padding: '0.4rem 0.6rem', fontSize: '0.78rem' }}
                  />
                  <Button size="sm" onClick={handleAddCustom} disabled={!customExName.trim()}>
                    Add Custom
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={wizardStyles.modalFooter}>
          {step > 1 && (
            <Button variant="secondary" onClick={() => setStep(s => s - 1)}>
              Back
            </Button>
          )}
          <div style={{ marginLeft: 'auto' }}>
            {step < 3 ? (
              <Button
                variant="primary"
                onClick={() => setStep(s => s + 1)}
                style={{ backgroundColor: badgeColor, color: '#000', fontWeight: '800' }}
              >
                Next: {step === 1 ? 'Configure Split' : 'Add Exercises'}
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleFinish}
                style={{ backgroundColor: badgeColor, color: '#000', fontWeight: '800' }}
              >
                ⚔️ Generate Individual Routines
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const wizardStyles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem'
  },
  modal: {
    backgroundColor: '#121216',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '24px',
    width: '100%',
    maxWidth: '540px',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
    overflow: 'hidden'
  },
  modalHeader: {
    padding: '1.2rem 1.4rem 0.8rem',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  stepTag: { fontSize: '0.68rem', fontWeight: '800', letterSpacing: '1px' },
  modalTitle: { fontSize: '1.2rem', fontWeight: '800', margin: '0.2rem 0 0', color: '#fff' },
  closeBtn: { background: 'none', border: 'none', color: '#888', fontSize: '1.1rem', cursor: 'pointer' },
  modalBody: { padding: '1.2rem 1.4rem', overflowY: 'auto', flex: 1 },
  modalFooter: {
    padding: '0.9rem 1.4rem',
    borderTop: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    alignItems: 'center'
  },
  sectionCol: { display: 'flex', flexDirection: 'column', gap: '1.2rem' },
  label: { display: 'block', fontSize: '0.68rem', fontWeight: '800', color: '#888', letterSpacing: '0.8px', marginBottom: 6 },
  input: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '12px',
    padding: '0.65rem 0.85rem',
    color: '#fff',
    fontSize: '0.88rem',
    boxSizing: 'border-box'
  },
  select: {
    width: '100%',
    backgroundColor: '#1c1c22',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '12px',
    padding: '0.65rem 0.85rem',
    color: '#fff',
    fontSize: '0.88rem',
    boxSizing: 'border-box'
  },
  chip: {
    padding: '0.45rem 0.8rem',
    borderRadius: '12px',
    border: '1px solid',
    fontSize: '0.75rem',
    fontWeight: '700',
    cursor: 'pointer',
    whiteSpace: 'nowrap'
  },
  miniChip: {
    padding: '0.35rem 0.65rem',
    borderRadius: '8px',
    border: '1px solid',
    fontSize: '0.72rem',
    fontWeight: '700',
    cursor: 'pointer',
    whiteSpace: 'nowrap'
  },
  selectionCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    border: '1.5px solid',
    borderRadius: '16px',
    padding: '0.85rem',
    cursor: 'pointer'
  },
  toggleRow: { display: 'flex', gap: 8, marginBottom: 8 },
  cycleToggle: { flex: 1, padding: '0.5rem', border: 'none', borderRadius: '12px', fontWeight: '800', fontSize: '0.78rem', cursor: 'pointer' },
  copyBtn: { padding: '0.45rem 0.6rem', fontSize: '0.68rem', fontWeight: '700', borderRadius: '10px', border: '1px dashed #aaa', background: 'transparent', color: '#ddd', cursor: 'pointer', whiteSpace: 'nowrap' },
  dayItemRow: { display: 'flex', alignItems: 'center', gap: 10 },
  enableBtn: { border: 'none', borderRadius: '8px', padding: '0.35rem 0.6rem', fontSize: '0.65rem', fontWeight: '800', cursor: 'pointer' },
  selectedDayHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 6 },
  configuredList: { display: 'flex', flexDirection: 'column', gap: 8 },
  configuredCard: { backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '0.75rem' },
  removeExBtn: { background: 'none', border: 'none', color: '#ff5555', fontSize: '0.68rem', fontWeight: '700', cursor: 'pointer' },
  schemeRow: { display: 'flex', alignItems: 'center', gap: 14, marginTop: 8 },
  stepperBox: { display: 'flex', alignItems: 'center', gap: 6 },
  miniLabel: { fontSize: '0.65rem', color: '#888', fontWeight: '700' },
  stepperInput: { width: 44, padding: '0.2rem 0.3rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'transparent', color: '#fff', textAlign: 'center', fontSize: '0.78rem' },
  bwToggle: { display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', marginLeft: 'auto' },
  libraryContainer: { borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 10, marginTop: 6 },
  exResultScroll: { maxHeight: 170, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 },
  exSelectRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.45rem 0.6rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '8px' },
  customExRow: { display: 'flex', gap: 8, marginTop: 10 }
};