// frontend/src/components/PlanWizard.jsx
import React, { useState } from 'react';
import { MAJOR_MUSCLE_GROUPS, EXDB, exOr } from '../lib/exercises.js';

const FALLBACK_EX_CATALOG = [
  { id: '0001', n: 'Barbell Bench Press', bp: 'chest', tg: 'pectorals' },
  { id: '0005', n: 'Incline Dumbbell Press', bp: 'chest', tg: 'upper chest' },
  { id: '0007', n: 'Dumbbell Chest Flys', bp: 'chest', tg: 'inner chest' },
  { id: '0100', n: 'Pull-ups', bp: 'back', tg: 'lats' },
  { id: '0102', n: 'Lat Pulldown', bp: 'back', tg: 'lats' },
  { id: '0106', n: 'Barbell Bent Over Row', bp: 'back', tg: 'upper back' },
  { id: '0108', n: 'T-Bar Row', bp: 'back', tg: 'mid back' },
  { id: '0112', n: 'Barbell Deadlift', bp: 'back', tg: 'lower back' },
  { id: '0117', n: 'Barbell Shrugs', bp: 'back', tg: 'traps' },
  { id: '0200', n: 'Overhead Barbell Press', bp: 'shoulders', tg: 'front delts' },
  { id: '0202', n: 'Arnold Press', bp: 'shoulders', tg: 'all delts' },
  { id: '0204', n: 'Dumbbell Lateral Raise', bp: 'shoulders', tg: 'side delts' },
  { id: '0300', n: 'Barbell Curl', bp: 'biceps', tg: 'biceps' },
  { id: '0305', n: 'Hammer Curls', bp: 'biceps', tg: 'brachialis' },
  { id: '0350', n: 'Triceps Rope Pushdown', bp: 'triceps', tg: 'triceps' },
  { id: '0355', n: 'Skull Crushers', bp: 'triceps', tg: 'long head' },
  { id: '0500', n: 'Barbell Back Squat', bp: 'legs', tg: 'quads' },
  { id: '0503', n: 'Leg Press (45 Deg)', bp: 'legs', tg: 'quads' },
  { id: '0507', n: 'Bulgarian Split Squats', bp: 'legs', tg: 'glutes & quads' },
  { id: '0550', n: 'Lying Leg Curl', bp: 'legs', tg: 'hamstrings' },
  { id: '0552', n: 'Romanian Deadlift', bp: 'legs', tg: 'hamstrings' },
  { id: '0560', n: 'Standing Calf Raise', bp: 'legs', tg: 'calves' },
  { id: '0600', n: 'Floor Crunches', bp: 'core', tg: 'upper abs' },
  { id: '0602', n: 'Hanging Leg Raises', bp: 'core', tg: 'lower abs' },
  { id: '0605', n: 'Plank', bp: 'core', tg: 'core stabilizers' },
];

const DEFAULT_MUSCLE_EXERCISES = {
  chest: ['0001', '0005', '0007'],
  back: ['0100', '0102', '0106'],
  shoulders: ['0200', '0204'],
  biceps: ['0300', '0305'],
  triceps: ['0350', '0355'],
  legs: ['0500', '0503', '0550', '0552'],
  core: ['0602', '0605'],
};

const DAYS = [
  { id: 1, name: 'Monday' },
  { id: 2, name: 'Tuesday' },
  { id: 3, name: 'Wednesday' },
  { id: 4, name: 'Thursday' },
  { id: 5, name: 'Friday' },
  { id: 6, name: 'Saturday' },
  { id: 0, name: 'Sunday' },
];

const FREQUENCY_OPTIONS = [
  { days: 2, label: '2 Days / Week' },
  { days: 3, label: '3 Days / Week' },
  { days: 4, label: '4 Days / Week' },
  { days: 5, label: '5 Days / Week' },
  { days: 6, label: '6 Days / Week' },
  { days: 7, label: 'Every Day' },
];

// Generates sensible default active days based on selected frequency
function getDefaultWeekSplit(numDays) {
  const blank = {
    1: { active: false, muscles: [], exercises: [] },
    2: { active: false, muscles: [], exercises: [] },
    3: { active: false, muscles: [], exercises: [] },
    4: { active: false, muscles: [], exercises: [] },
    5: { active: false, muscles: [], exercises: [] },
    6: { active: false, muscles: [], exercises: [] },
    0: { active: false, muscles: [], exercises: [] },
  };

  switch (numDays) {
    case 2:
      blank[1] = { active: true, muscles: ['chest', 'back'], exercises: ['0001', '0100'] };
      blank[4] = { active: true, muscles: ['legs', 'shoulders'], exercises: ['0500', '0200'] };
      break;
    case 3:
      blank[1] = { active: true, muscles: ['chest', 'triceps'], exercises: ['0001', '0005', '0350'] };
      blank[3] = { active: true, muscles: ['back', 'biceps'], exercises: ['0100', '0102', '0300'] };
      blank[5] = { active: true, muscles: ['legs', 'core'], exercises: ['0500', '0552', '0602'] };
      break;
    case 4:
      blank[1] = { active: true, muscles: ['chest', 'back'], exercises: ['0001', '0100'] };
      blank[2] = { active: true, muscles: ['legs', 'core'], exercises: ['0500', '0602'] };
      blank[4] = { active: true, muscles: ['shoulders', 'arms'], exercises: ['0200', '0300', '0350'] };
      blank[5] = { active: true, muscles: ['legs', 'core'], exercises: ['0503', '0550'] };
      break;
    case 6:
      blank[1] = { active: true, muscles: ['chest', 'triceps'], exercises: ['0001', '0350'] };
      blank[2] = { active: true, muscles: ['back', 'biceps'], exercises: ['0100', '0300'] };
      blank[3] = { active: true, muscles: ['legs', 'core'], exercises: ['0500', '0602'] };
      blank[4] = { active: true, muscles: ['chest', 'shoulders'], exercises: ['0005', '0200'] };
      blank[5] = { active: true, muscles: ['back', 'arms'], exercises: ['0102', '0305'] };
      blank[6] = { active: true, muscles: ['legs', 'core'], exercises: ['0503', '0605'] };
      break;
    case 7:
      DAYS.forEach((d) => {
        blank[d.id] = { active: true, muscles: ['chest', 'back'], exercises: ['0001', '0100'] };
      });
      break;
    case 5:
    default:
      blank[1] = { active: true, muscles: ['chest', 'back'], exercises: ['0001', '0100'] };
      blank[2] = { active: true, muscles: ['shoulders', 'triceps'], exercises: ['0200', '0350'] };
      blank[3] = { active: true, muscles: ['legs', 'core'], exercises: ['0500', '0602'] };
      blank[4] = { active: true, muscles: ['chest', 'biceps'], exercises: ['0005', '0300'] };
      blank[5] = { active: true, muscles: ['back', 'legs'], exercises: ['0102', '0552'] };
      break;
  }
  return blank;
}

export default function PlanWizard({ isOpen, onClose, onGenerate, badgeColor = '#34D399' }) {
  const [step, setStep] = useState(1);
  const [targetDays, setTargetDays] = useState(3);
  const [activeTab, setActiveTab] = useState('A');
  const [openMuscleDropdown, setOpenMuscleDropdown] = useState(null);
  const [currentEditDay, setCurrentEditDay] = useState(1);

  const [showInlinePicker, setShowInlinePicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Initialized dynamically to match 3 days by default
  const [weekA, setWeekA] = useState(getDefaultWeekSplit(3));
  const [weekB, setWeekB] = useState(getDefaultWeekSplit(3));

  const [exConfigs, setExConfigs] = useState({
    '0001': { sets: 3, reps: 10, weight: 0 },
    '0005': { sets: 3, reps: 10, weight: 0 },
    '0100': { sets: 3, reps: 10, weight: 0 },
    '0102': { sets: 3, reps: 10, weight: 0 },
    '0200': { sets: 3, reps: 10, weight: 0 },
    '0300': { sets: 3, reps: 10, weight: 0 },
    '0350': { sets: 3, reps: 10, weight: 0 },
    '0500': { sets: 3, reps: 10, weight: 0 },
    '0552': { sets: 3, reps: 10, weight: 0 },
    '0602': { sets: 3, reps: 10, weight: 0 },
  });

  if (!isOpen) return null;

  const currentPlan = activeTab === 'A' ? weekA : weekB;
  const setPlan = activeTab === 'A' ? setWeekA : setWeekB;
  const activeCount = Object.values(currentPlan).filter((d) => d.active).length;

  // Handles choosing days in Step 1 and updating Step 2 accordingly
  const handleSelectFrequency = (days) => {
    setTargetDays(days);
    const newSplitA = getDefaultWeekSplit(days);
    const newSplitB = getDefaultWeekSplit(days);
    setWeekA(newSplitA);
    setWeekB(newSplitB);
  };

  const toggleDayActive = (dayId) => {
    setPlan((prev) => {
      const conf = prev[dayId] || { active: false, muscles: [], exercises: [] };
      return { ...prev, [dayId]: { ...conf, active: !conf.active } };
    });
  };

  const toggleMuscle = (dayId, muscleId) => {
    setPlan((prev) => {
      const conf = prev[dayId] || { active: true, muscles: [], exercises: [] };
      const muscles = conf.muscles || [];
      const exists = muscles.includes(muscleId);
      const updatedMuscles = exists ? muscles.filter((m) => m !== muscleId) : [...muscles, muscleId];

      let updatedEx = [...(conf.exercises || [])];
      if (!exists && DEFAULT_MUSCLE_EXERCISES[muscleId]) {
        DEFAULT_MUSCLE_EXERCISES[muscleId].forEach((id) => {
          if (!updatedEx.includes(id)) {
            updatedEx.push(id);
            setExConfigs((prevCfg) => ({
              ...prevCfg,
              [id]: prevCfg[id] || { sets: 3, reps: 10, weight: 0 },
            }));
          }
        });
      }

      return {
        ...prev,
        [dayId]: { ...conf, muscles: updatedMuscles, exercises: updatedEx },
      };
    });
  };

  const handleAddExerciseDirect = (dayId, exId) => {
    setPlan((prev) => {
      const conf = prev[dayId] || { active: true, muscles: [], exercises: [] };
      const exList = conf.exercises || [];
      if (exList.includes(String(exId))) return prev;
      return {
        ...prev,
        [dayId]: { ...conf, exercises: [...exList, String(exId)] },
      };
    });
    setExConfigs((prev) => ({
      ...prev,
      [exId]: prev[exId] || { sets: 3, reps: 10, weight: 0 },
    }));
  };

  const handleRemoveExercise = (dayId, exId) => {
    setPlan((prev) => {
      const conf = prev[dayId] || { active: true, muscles: [], exercises: [] };
      return {
        ...prev,
        [dayId]: {
          ...conf,
          exercises: (conf.exercises || []).filter((id) => String(id) !== String(exId)),
        },
      };
    });
  };

  const updateSetOrRep = (exId, field, delta) => {
    setExConfigs((prev) => {
      const cur = prev[exId] || { sets: 3, reps: 10, weight: 0 };
      const nextVal = Math.max(1, (cur[field] || (field === 'sets' ? 3 : 10)) + delta);
      return {
        ...prev,
        [exId]: { ...cur, [field]: nextVal },
      };
    });
  };

  const handleGenerateRoutines = () => {
    const activeDays = DAYS.filter((d) => currentPlan[d.id]?.active);
    const generatedRoutines = [];
    const updatedWeek = { 0: null, 1: null, 2: null, 3: null, 4: null, 5: null, 6: null };
    const updatedCfg = { ...exConfigs };

    activeDays.forEach((d) => {
      const conf = currentPlan[d.id];
      const rId = 'r_' + d.id + '_' + Date.now();
      const muscleTitle = (conf.muscles || []).map((m) => m.charAt(0).toUpperCase() + m.slice(1)).join(' & ') || 'Workout';
      const exList = conf.exercises?.length ? conf.exercises : ['0001', '0100', '0500'];

      generatedRoutines.push({
        id: rId,
        name: `${d.name} (${muscleTitle})`,
        emoji: '⚡',
        ex: exList,
      });

      exList.forEach((exId) => {
        if (!updatedCfg[exId]) {
          updatedCfg[exId] = { sets: 3, reps: 10, weight: 0 };
        }
      });

      updatedWeek[d.id] = rId;
    });

    if (typeof onGenerate === 'function') {
      onGenerate({
        routines: generatedRoutines,
        newCustomExercises: [],
        updatedWeek,
        updatedCfg,
      });
    }
    onClose();
  };

  const fullCatalog = Array.isArray(EXDB) && EXDB.length > 0 ? EXDB : FALLBACK_EX_CATALOG;
  const currentDayMuscles = currentPlan[currentEditDay]?.muscles || [];
  const currentDayExercises = currentPlan[currentEditDay]?.exercises || [];

  const filteredCatalog = fullCatalog.filter((x) => {
    const matchesSearch = !searchQuery || (x.n && x.n.toLowerCase().includes(searchQuery.toLowerCase()));
    if (!matchesSearch) return false;
    if (!searchQuery && currentDayMuscles.length > 0) {
      return currentDayMuscles.some((m) => (x.bp && x.bp.toLowerCase().includes(m)) || (x.tg && x.tg.toLowerCase().includes(m)));
    }
    return true;
  });

  return (
    <div style={wizardStyles.backdrop} onClick={onClose}>
      <div style={wizardStyles.card} onClick={(e) => e.stopPropagation()}>
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.72rem', fontWeight: '800', color: badgeColor, letterSpacing: '1px' }}>
              STEP {step} OF 3
            </span>
            <h2 style={{ fontSize: '1.45rem', fontWeight: '800', margin: '3px 0 0', color: '#fff' }}>
              {step === 1 && 'Weekly Training Frequency'}
              {step === 2 && 'Custom Weekly Split'}
              {step === 3 && 'Review & Select Exercises'}
            </h2>
          </div>
          <button type="button" onClick={onClose} style={wizardStyles.closeBtn}>✕</button>
        </div>

        {/* ================= STEP 1: Frequency ================= */}
        {step === 1 && (
          <div>
            <p style={wizardStyles.stepDescription}>
              How many days per week do you want to work out? You can choose any days as rest days on the next step.
            </p>

            <div style={wizardStyles.frequencyGrid}>
              {FREQUENCY_OPTIONS.map((opt) => {
                const isSelected = targetDays === opt.days;
                return (
                  <button
                    key={opt.days}
                    type="button"
                    onClick={() => handleSelectFrequency(opt.days)}
                    style={{
                      ...wizardStyles.frequencyCard,
                      borderColor: isSelected ? badgeColor : 'rgba(255, 255, 255, 0.08)',
                      backgroundColor: isSelected ? 'rgba(52, 211, 153, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '2rem',
                        fontWeight: '800',
                        color: isSelected ? badgeColor : '#fff',
                        lineHeight: 1.1,
                      }}
                    >
                      {opt.days}
                    </div>
                    <div
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: '700',
                        color: isSelected ? '#fff' : '#888',
                        marginTop: '6px',
                      }}
                    >
                      {opt.label}
                    </div>
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '1.6rem' }}>
              <button type="button" onClick={onClose} style={wizardStyles.cancelBtn}>
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setStep(2)}
                style={{ ...wizardStyles.nextBtn, backgroundColor: badgeColor }}
              >
                Next: Configure Split ➔
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 2: Custom Split ================= */}
        {step === 2 && (
          <div>
            <div style={wizardStyles.periodizationTabs}>
              <button
                type="button"
                onClick={() => { setActiveTab('A'); setOpenMuscleDropdown(null); }}
                style={{
                  ...wizardStyles.tabBtn,
                  backgroundColor: activeTab === 'A' ? badgeColor : 'transparent',
                  color: activeTab === 'A' ? '#000' : '#888',
                }}
              >
                Week A (Odd Weeks: 1, 3)
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('B'); setOpenMuscleDropdown(null); }}
                style={{
                  ...wizardStyles.tabBtn,
                  backgroundColor: activeTab === 'B' ? badgeColor : 'transparent',
                  color: activeTab === 'B' ? '#000' : '#888',
                }}
              >
                Week B (Even Weeks: 2, 4)
              </button>
            </div>

            <div style={wizardStyles.statusBar}>
              <span style={{ color: '#888', fontSize: '0.78rem', fontWeight: '700' }}>
                Target: {targetDays} Training Days
              </span>
              <span style={{ color: badgeColor, fontSize: '0.78rem', fontWeight: '800' }}>
                {activeCount} Active Days Selected
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '320px', overflowY: 'auto', paddingRight: '2px' }}>
              {DAYS.map((d) => {
                const conf = currentPlan[d.id] || { active: false, muscles: [] };
                const isOpen = openMuscleDropdown === d.id;

                return (
                  <div key={d.id} style={wizardStyles.dayContainer}>
                    <div style={wizardStyles.dayMainRow}>
                      <button
                        type="button"
                        onClick={() => toggleDayActive(d.id)}
                        style={{
                          ...wizardStyles.statusToggleBtn,
                          backgroundColor: conf.active ? badgeColor : 'rgba(255, 255, 255, 0.08)',
                          color: conf.active ? '#000' : '#777',
                        }}
                      >
                        {conf.active ? 'ACTIVE' : 'REST'}
                      </button>

                      <span style={{ width: '85px', fontWeight: '700', fontSize: '0.88rem', color: '#fff' }}>
                        {d.name}
                      </span>

                      {conf.active ? (
                        <div
                          onClick={() => setOpenMuscleDropdown(isOpen ? null : d.id)}
                          style={{
                            ...wizardStyles.muscleSelectorBox,
                            borderColor: isOpen ? badgeColor : 'rgba(255, 255, 255, 0.15)',
                          }}
                        >
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', flex: 1 }}>
                            {conf.muscles?.length > 0 ? (
                              conf.muscles.map((m) => {
                                const mg = MAJOR_MUSCLE_GROUPS.find((g) => g.id === m);
                                return (
                                  <span key={m} style={wizardStyles.musclePillTag}>
                                    {mg?.icon || '🛡️'} {mg?.label || m}
                                  </span>
                                );
                              })
                            ) : (
                              <span style={{ color: '#666', fontSize: '0.78rem' }}>-- Select Muscle Groups --</span>
                            )}
                          </div>
                          <span style={{ color: '#888', fontSize: '0.65rem' }}>▼</span>
                        </div>
                      ) : (
                        <div
                          onClick={() => toggleDayActive(d.id)}
                          style={wizardStyles.restPlaceholderBox}
                        >
                          Rest Day ☕ <span style={{ fontSize: '0.7rem', color: '#555' }}>(Tap to activate)</span>
                        </div>
                      )}
                    </div>

                    {isOpen && conf.active && (
                      <div style={wizardStyles.muscleDropdownGrid}>
                        {MAJOR_MUSCLE_GROUPS.map((mg) => {
                          const isSelected = conf.muscles?.includes(mg.id);
                          return (
                            <button
                              key={mg.id}
                              type="button"
                              onClick={() => toggleMuscle(d.id, mg.id)}
                              style={{
                                ...wizardStyles.muscleGridItem,
                                backgroundColor: isSelected ? 'rgba(52, 211, 153, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                                borderColor: isSelected ? badgeColor : 'rgba(255, 255, 255, 0.08)',
                                color: isSelected ? badgeColor : '#ccc',
                              }}
                            >
                              <span>{mg.icon}</span> {mg.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '1.2rem' }}>
              <button type="button" onClick={() => setStep(1)} style={wizardStyles.cancelBtn}>
                ← Back
              </button>
              <button
                type="button"
                onClick={() => {
                  const firstActive = DAYS.find((d) => currentPlan[d.id]?.active);
                  if (firstActive) setCurrentEditDay(firstActive.id);
                  setStep(3);
                }}
                style={{ ...wizardStyles.nextBtn, backgroundColor: badgeColor }}
              >
                Choose Exercises ➔
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 3: Sets & Reps Column Headers ================= */}
        {step === 3 && (
          <div>
            <p style={{ color: '#888', fontSize: '0.82rem', marginBottom: '0.8rem' }}>
              Review exercises and customize target sets/reps for each workout:
            </p>

            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '6px', marginBottom: '10px' }}>
              {DAYS.filter((d) => currentPlan[d.id]?.active).map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => {
                    setCurrentEditDay(d.id);
                    setShowInlinePicker(false);
                    setSearchQuery('');
                  }}
                  style={{
                    ...wizardStyles.dayTabBtn,
                    backgroundColor: currentEditDay === d.id ? badgeColor : 'rgba(255,255,255,0.05)',
                    color: currentEditDay === d.id ? '#000' : '#fff',
                  }}
                >
                  {d.name.slice(0, 3)}
                </button>
              ))}
            </div>

            {/* Column Headers */}
            <div style={wizardStyles.tableColumnHeader}>
              <span style={{ flex: 1 }}>EXERCISE</span>
              <span style={{ width: '68px', textAlign: 'center' }}>SETS</span>
              <span style={{ width: '68px', textAlign: 'center' }}>REPS</span>
              <span style={{ width: '22px' }} />
            </div>

            <div style={{ maxHeight: showInlinePicker ? '140px' : '230px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {currentDayExercises.map((exId) => {
                const ex = (typeof exOr === 'function' ? exOr(exId) : null) || { id: exId, n: `Exercise #${exId}`, bp: 'General' };
                const cfg = exConfigs[exId] || { sets: 3, reps: 10 };

                return (
                  <div key={exId} style={wizardStyles.exerciseRow}>
                    <div style={{ flex: 1, minWidth: 0, paddingRight: '6px' }}>
                      <div style={{ fontWeight: '700', fontSize: '0.86rem', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {ex.n}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#888', textTransform: 'capitalize' }}>
                        {ex.bp} {ex.tg ? `• ${ex.tg}` : ''}
                      </div>
                    </div>

                    <div style={wizardStyles.volumeStepper}>
                      <button type="button" onClick={() => updateSetOrRep(exId, 'sets', -1)} style={wizardStyles.stepperBtn}>-</button>
                      <span style={wizardStyles.stepperVal}>{cfg.sets}</span>
                      <button type="button" onClick={() => updateSetOrRep(exId, 'sets', 1)} style={wizardStyles.stepperBtn}>+</button>
                    </div>

                    <div style={wizardStyles.volumeStepper}>
                      <button type="button" onClick={() => updateSetOrRep(exId, 'reps', -1)} style={wizardStyles.stepperBtn}>-</button>
                      <span style={wizardStyles.stepperVal}>{cfg.reps}</span>
                      <button type="button" onClick={() => updateSetOrRep(exId, 'reps', 1)} style={wizardStyles.stepperBtn}>+</button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveExercise(currentEditDay, exId)}
                      style={wizardStyles.deleteBtn}
                      title="Remove exercise"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>

            {showInlinePicker ? (
              <div style={wizardStyles.inlinePickerCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: '800', color: badgeColor }}>
                    ⚡ SELECT EXERCISE
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowInlinePicker(false)}
                    style={{ background: 'none', border: 'none', color: '#888', fontSize: '0.8rem', cursor: 'pointer' }}
                  >
                    Close
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="Search exercise..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={wizardStyles.searchInput}
                  autoFocus
                />

                <div style={{ maxHeight: '140px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {filteredCatalog.slice(0, 20).map((ex) => {
                    const alreadyAdded = currentDayExercises.includes(String(ex.id));
                    return (
                      <div
                        key={ex.id}
                        onClick={() => {
                          if (alreadyAdded) handleRemoveExercise(currentEditDay, ex.id);
                          else handleAddExerciseDirect(currentEditDay, ex.id);
                        }}
                        style={{
                          ...wizardStyles.pickerItem,
                          backgroundColor: alreadyAdded ? 'rgba(52, 211, 153, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                          borderColor: alreadyAdded ? badgeColor : 'rgba(255, 255, 255, 0.06)',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '0.82rem', fontWeight: '700', color: alreadyAdded ? badgeColor : '#fff' }}>{ex.n}</div>
                          <div style={{ fontSize: '0.65rem', color: '#888', textTransform: 'capitalize' }}>
                            {ex.bp} {ex.tg ? `• ${ex.tg}` : ''}
                          </div>
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: '800', color: alreadyAdded ? '#ef4444' : badgeColor }}>
                          {alreadyAdded ? '✓ Added' : '+ Add'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowInlinePicker(true)}
                style={{ ...wizardStyles.addExerciseBtn, color: badgeColor, borderColor: badgeColor }}
              >
                + Add / Swap Exercises
              </button>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '1.2rem' }}>
              <button type="button" onClick={() => setStep(2)} style={wizardStyles.cancelBtn}>
                ← Back
              </button>
              <button
                type="button"
                onClick={handleGenerateRoutines}
                style={{ ...wizardStyles.nextBtn, backgroundColor: badgeColor }}
              >
                Generate Routines ⚔️
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const wizardStyles = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
    padding: '1rem',
  },
  card: {
    width: '100%',
    maxWidth: '460px',
    backgroundColor: '#121218',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '26px',
    padding: '1.5rem',
    boxShadow: '0 24px 60px rgba(0, 0, 0, 0.85)',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#888',
    fontSize: '1.3rem',
    cursor: 'pointer',
  },
  stepDescription: {
    color: '#999',
    fontSize: '0.85rem',
    lineHeight: 1.4,
    marginBottom: '1.3rem',
  },
  frequencyGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '10px',
  },
  frequencyCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1.1rem 0.6rem',
    borderRadius: '16px',
    border: '1px solid',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  cancelBtn: {
    flex: 1,
    padding: '0.85rem',
    borderRadius: '14px',
    border: '1px solid rgba(255, 255, 255, 0.14)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: '#fff',
    fontWeight: '800',
    fontSize: '0.85rem',
    cursor: 'pointer',
  },
  nextBtn: {
    flex: 2,
    padding: '0.85rem',
    borderRadius: '14px',
    border: 'none',
    color: '#000',
    fontWeight: '800',
    fontSize: '0.85rem',
    cursor: 'pointer',
    boxShadow: '0 4px 18px rgba(52, 211, 153, 0.3)',
  },
  periodizationTabs: {
    display: 'flex',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    padding: '3px',
    marginBottom: '0.8rem',
  },
  tabBtn: {
    flex: 1,
    padding: '0.55rem 0.6rem',
    borderRadius: '10px',
    border: 'none',
    fontWeight: '800',
    fontSize: '0.74rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  statusBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '10px',
    padding: '6px 10px',
    marginBottom: '0.8rem',
  },
  dayContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '14px',
    padding: '0.45rem 0.5rem',
  },
  dayMainRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  statusToggleBtn: {
    border: 'none',
    borderRadius: '8px',
    padding: '4px 8px',
    fontSize: '0.68rem',
    fontWeight: '800',
    cursor: 'pointer',
    letterSpacing: '0.4px',
  },
  muscleSelectorBox: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '4px 8px',
    borderRadius: '10px',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    border: '1px solid',
    cursor: 'pointer',
    minHeight: '34px',
  },
  restPlaceholderBox: {
    flex: 1,
    padding: '6px 8px',
    borderRadius: '10px',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    border: '1px dashed rgba(255, 255, 255, 0.08)',
    color: '#666',
    fontSize: '0.78rem',
    cursor: 'pointer',
  },
  musclePillTag: {
    fontSize: '0.68rem',
    fontWeight: '700',
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    border: '1px solid rgba(52, 211, 153, 0.35)',
    color: '#34D399',
    padding: '2px 6px',
    borderRadius: '6px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
  },
  muscleDropdownGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '6px',
    marginTop: '4px',
    paddingTop: '6px',
    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
  },
  muscleGridItem: {
    padding: '6px 8px',
    borderRadius: '8px',
    border: '1px solid',
    fontSize: '0.75rem',
    fontWeight: '700',
    cursor: 'pointer',
    textAlign: 'left',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  dayTabBtn: {
    padding: '6px 12px',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.1)',
    fontWeight: '800',
    fontSize: '0.78rem',
    cursor: 'pointer',
    flexShrink: 0,
  },
  tableColumnHeader: {
    display: 'flex',
    alignItems: 'center',
    padding: '0 8px 6px',
    fontSize: '0.65rem',
    fontWeight: '800',
    color: '#666',
    letterSpacing: '0.8px',
  },
  exerciseRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '7px 10px',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '12px',
  },
  volumeStepper: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    padding: '2px',
    width: '68px',
    justifyContent: 'space-between',
  },
  stepperBtn: {
    background: 'none',
    border: 'none',
    color: '#888',
    padding: '2px 5px',
    cursor: 'pointer',
    fontWeight: '800',
    fontSize: '0.75rem',
  },
  stepperVal: {
    fontSize: '0.75rem',
    fontWeight: '800',
    color: '#34D399',
    textAlign: 'center',
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    color: '#EF4444',
    fontSize: '0.9rem',
    cursor: 'pointer',
    padding: '2px 4px',
  },
  addExerciseBtn: {
    width: '100%',
    padding: '10px',
    borderRadius: '12px',
    backgroundColor: 'rgba(52, 211, 153, 0.08)',
    border: '1px dashed',
    fontWeight: '800',
    fontSize: '0.78rem',
    cursor: 'pointer',
    marginTop: '6px',
  },
  inlinePickerCard: {
    marginTop: '8px',
    padding: '10px',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: '14px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
  },
  searchInput: {
    width: '100%',
    padding: '6px 8px',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: '#fff',
    fontSize: '0.78rem',
    outline: 'none',
    boxSizing: 'border-box',
    marginBottom: '6px',
  },
  pickerItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 8px',
    borderRadius: '8px',
    border: '1px solid',
    cursor: 'pointer',
  },
};