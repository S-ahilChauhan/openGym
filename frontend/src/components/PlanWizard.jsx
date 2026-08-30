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

const DURATION_OPTIONS = [4, 6, 8, 12, 16];

const PROGRAM_STYLES = [
  {
    id: 'static',
    name: 'Static / Fixed Split',
    tag: '⚡ Standard',
    desc: 'Same workouts every week indefinitely. Simple linear progression.',
    weeks: ['A'],
  },
  {
    id: 'ab_alternating',
    name: 'A/B Alternating',
    tag: '🔥 2-Week Cycle',
    desc: 'Alternates Week A (Odd: 1, 3) and Week B (Even: 2, 4).',
    weeks: ['A', 'B'],
  },
  {
    id: 'abc_rotating',
    name: 'A/B/C Rotating',
    tag: '🔄 3-Week Cycle',
    desc: 'Three rotating workout variations in sequence (A → B → C).',
    weeks: ['A', 'B', 'C'],
  },
  {
    id: 'wave_loading',
    name: 'Wave Loading Block',
    tag: '🌊 4-Week Block',
    desc: 'Fixed lifts with intensity waving weekly (Heavy → Light → Peak → Deload).',
    weeks: ['A'],
  },
  {
    id: 'dup',
    name: 'Daily Undulating (DUP)',
    tag: '🎯 Intra-Week',
    desc: 'Varying rep & intensity schemes per session (Hypertrophy / Power / Strength).',
    weeks: ['A'],
  },
  {
    id: 'bro_split',
    name: 'Bodypart / Bro Split',
    tag: '💪 1 Muscle / Day',
    desc: 'Dedicated single muscle focus per session repeating weekly.',
    weeks: ['A'],
  },
  {
    id: 'conjugate',
    name: 'Conjugate Method',
    tag: '⚔️ Max Effort',
    desc: 'Rotating max effort and dynamic effort variations every session.',
    weeks: ['A', 'B'],
  },
];

function getExercisesForMuscles(muscles = []) {
  const catalog = Array.isArray(EXDB) && EXDB.length > 0 ? EXDB : FALLBACK_EX_CATALOG;
  if (!muscles || muscles.length === 0) return [];

  const foundIds = [];
  muscles.forEach((muscle) => {
    const mLower = muscle.toLowerCase();
    const matched = catalog.filter((x) => 
      (x.bp && x.bp.toLowerCase().includes(mLower)) || 
      (x.tg && x.tg.toLowerCase().includes(mLower))
    );
    matched.slice(0, 2).forEach((ex) => {
      if (!foundIds.includes(String(ex.id))) {
        foundIds.push(String(ex.id));
      }
    });
  });

  return foundIds.length > 0 ? foundIds : ['0001', '0100'];
}

function buildBlankWeek(numDays, weekVariant = 'A') {
  const blank = {
    1: { active: false, muscles: [], exercises: [] },
    2: { active: false, muscles: [], exercises: [] },
    3: { active: false, muscles: [], exercises: [] },
    4: { active: false, muscles: [], exercises: [] },
    5: { active: false, muscles: [], exercises: [] },
    6: { active: false, muscles: [], exercises: [] },
    0: { active: false, muscles: [], exercises: [] },
  };

  const assignDay = (dayId, muscles) => {
    blank[dayId] = {
      active: true,
      muscles,
      exercises: getExercisesForMuscles(muscles),
    };
  };

  if (numDays === 2) {
    if (weekVariant === 'B') {
      assignDay(1, ['back', 'biceps']);
      assignDay(4, ['chest', 'triceps']);
    } else {
      assignDay(1, ['chest', 'back']);
      assignDay(4, ['legs', 'shoulders']);
    }
  } else if (numDays === 3) {
    if (weekVariant === 'B') {
      assignDay(1, ['chest', 'back']);
      assignDay(3, ['shoulders', 'arms']);
      assignDay(5, ['legs', 'core']);
    } else if (weekVariant === 'C') {
      assignDay(1, ['chest', 'shoulders']);
      assignDay(3, ['back', 'legs']);
      assignDay(5, ['arms', 'core']);
    } else {
      assignDay(1, ['chest', 'triceps']);
      assignDay(3, ['back', 'biceps']);
      assignDay(5, ['legs', 'core']);
    }
  } else if (numDays === 4) {
    assignDay(1, ['chest', 'back']);
    assignDay(2, ['legs', 'core']);
    assignDay(4, ['shoulders', 'arms']);
    assignDay(5, ['legs', 'core']);
  } else if (numDays === 6) {
    assignDay(1, ['chest', 'triceps']);
    assignDay(2, ['back', 'biceps']);
    assignDay(3, ['legs', 'core']);
    assignDay(4, ['chest', 'shoulders']);
    assignDay(5, ['back', 'arms']);
    assignDay(6, ['legs', 'core']);
  } else if (numDays === 7) {
    DAYS.forEach((d) => assignDay(d.id, ['chest', 'back']));
  } else {
    assignDay(1, ['chest', 'back']);
    assignDay(2, ['shoulders', 'triceps']);
    assignDay(3, ['legs', 'core']);
    assignDay(4, ['chest', 'biceps']);
    assignDay(5, ['back', 'legs']);
  }

  return blank;
}

export default function PlanWizard({ isOpen, onClose, onGenerate, badgeColor = '#34D399' }) {
  const [step, setStep] = useState(1);
  const [targetDays, setTargetDays] = useState(3);
  const [durationWeeks, setDurationWeeks] = useState(8);
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [programStyle, setProgramStyle] = useState(PROGRAM_STYLES[1]);
  const [activeTab, setActiveTab] = useState('A');
  const [openMuscleDropdown, setOpenMuscleDropdown] = useState(null);
  const [currentEditDay, setCurrentEditDay] = useState(1);

  const [showInlinePicker, setShowInlinePicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [muscleFilterChip, setMuscleFilterChip] = useState('ALL');

  const [weekPlans, setWeekPlans] = useState({
    A: buildBlankWeek(3, 'A'),
    B: buildBlankWeek(3, 'B'),
    C: buildBlankWeek(3, 'C'),
  });

  const [exConfigs, setExConfigs] = useState({});

  if (!isOpen) return null;

  const availableWeekTabs = programStyle.weeks || ['A'];
  const currentPlan = weekPlans[activeTab] || weekPlans['A'];
  const activeCount = Object.values(currentPlan).filter((d) => d.active).length;

  const setPlan = (updater) => {
    setWeekPlans((prev) => ({
      ...prev,
      [activeTab]: updater(prev[activeTab] || prev['A']),
    }));
  };

  const handleSelectFrequency = (days) => {
    setTargetDays(days);
    setWeekPlans({
      A: buildBlankWeek(days, 'A'),
      B: buildBlankWeek(days, 'B'),
      C: buildBlankWeek(days, 'C'),
    });
  };

  const handleSelectProgramStyle = (style) => {
    setProgramStyle(style);
    setActiveTab(style.weeks[0] || 'A');
  };

  const toggleDayActive = (dayId) => {
    setPlan((prev) => {
      const conf = prev[dayId] || { active: false, muscles: [], exercises: [] };
      const nextActive = !conf.active;
      const initialMuscles = nextActive && conf.muscles.length === 0 ? ['chest', 'back'] : conf.muscles;
      const initialEx = nextActive && (!conf.exercises || conf.exercises.length === 0) 
        ? getExercisesForMuscles(initialMuscles) 
        : conf.exercises;

      return {
        ...prev,
        [dayId]: {
          ...conf,
          active: nextActive,
          muscles: initialMuscles,
          exercises: initialEx,
        },
      };
    });
  };

  const toggleMuscle = (dayId, muscleId) => {
    setPlan((prev) => {
      const conf = prev[dayId] || { active: true, muscles: [], exercises: [] };
      const currentMuscles = conf.muscles || [];
      const exists = currentMuscles.includes(muscleId);
      const updatedMuscles = exists 
        ? currentMuscles.filter((m) => m !== muscleId) 
        : [...currentMuscles, muscleId];

      const dynamicEx = getExercisesForMuscles(updatedMuscles);

      return {
        ...prev,
        [dayId]: {
          ...conf,
          muscles: updatedMuscles,
          exercises: dynamicEx,
        },
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
    const generatedRoutines = [];
    const updatedWeek = { 0: null, 1: null, 2: null, 3: null, 4: null, 5: null, 6: null };
    const updatedCfg = { ...exConfigs };

    availableWeekTabs.forEach((wKey) => {
      const weekData = weekPlans[wKey] || {};
      const activeDays = DAYS.filter((d) => weekData[d.id]?.active);

      activeDays.forEach((d) => {
        const conf = weekData[d.id];
        const rId = `r_${wKey}_${d.id}_${Date.now()}`;
        const muscleTitle = (conf.muscles || []).map((m) => m.charAt(0).toUpperCase() + m.slice(1)).join(' & ') || 'Workout';
        const exList = conf.exercises?.length ? conf.exercises : ['0001', '0100'];

        const weekLabel = availableWeekTabs.length > 1 ? `[W-${wKey}] ` : '';
        generatedRoutines.push({
          id: rId,
          name: `${weekLabel}${d.name} (${muscleTitle})`,
          emoji: '⚡',
          ex: exList,
        });

        exList.forEach((exId) => {
          if (!updatedCfg[exId]) {
            updatedCfg[exId] = { sets: 3, reps: 10, weight: 0 };
          }
        });

        if (wKey === 'A') {
          updatedWeek[d.id] = rId;
        }
      });
    });

    if (typeof onGenerate === 'function') {
      onGenerate({
        routines: generatedRoutines,
        newCustomExercises: [],
        updatedWeek,
        updatedCfg,
        startDate,
        durationWeeks,
        programStyle: programStyle.id,
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

    if (muscleFilterChip !== 'ALL') {
      const chipLower = muscleFilterChip.toLowerCase();
      return (x.bp && x.bp.toLowerCase().includes(chipLower)) || (x.tg && x.tg.toLowerCase().includes(chipLower));
    }

    if (currentDayMuscles.length > 0) {
      return currentDayMuscles.some((m) => 
        (x.bp && x.bp.toLowerCase().includes(m.toLowerCase())) || 
        (x.tg && x.tg.toLowerCase().includes(m.toLowerCase()))
      );
    }
    return true;
  });

  return (
    <div style={wizardStyles.backdrop} onClick={onClose}>
      <div style={wizardStyles.card} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.72rem', fontWeight: '800', color: badgeColor, letterSpacing: '1px' }}>
              STEP {step} OF 4
            </span>
            <h2 style={{ fontSize: '1.45rem', fontWeight: '800', margin: '3px 0 0', color: '#fff' }}>
              {step === 1 && 'Frequency & Duration'}
              {step === 2 && 'Program & Periodization'}
              {step === 3 && 'Assign Muscles to Days'}
              {step === 4 && 'Review & Select Exercises'}
            </h2>
          </div>
          <button type="button" onClick={onClose} style={wizardStyles.closeBtn}>✕</button>
        </div>

        {/* STEP 1: Frequency, Duration, & Start Date */}
        {step === 1 && (
          <div>
            <p style={wizardStyles.stepDescription}>
              Configure how often and for how long you plan to run this training block:
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
                    <div style={{ fontSize: '1.8rem', fontWeight: '800', color: isSelected ? badgeColor : '#fff', lineHeight: 1.1 }}>
                      {opt.days}
                    </div>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: isSelected ? '#fff' : '#888', marginTop: '4px' }}>
                      {opt.label}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Program Duration Selector */}
            <div style={{ marginTop: '1.1rem' }}>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '800', color: '#888', letterSpacing: '0.6px', marginBottom: '6px' }}>
                PROGRAM DURATION (TOTAL WEEKS)
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {DURATION_OPTIONS.map((w) => {
                  const isSelected = durationWeeks === w;
                  return (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setDurationWeeks(w)}
                      style={{
                        flex: 1,
                        padding: '0.6rem 0',
                        borderRadius: '12px',
                        border: '1px solid',
                        borderColor: isSelected ? badgeColor : 'rgba(255, 255, 255, 0.1)',
                        backgroundColor: isSelected ? 'rgba(52, 211, 153, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                        color: isSelected ? badgeColor : '#aaa',
                        fontWeight: '800',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                      }}
                    >
                      {w} Weeks
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Start Date Selector */}
            <div style={{ marginTop: '1.1rem' }}>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '800', color: '#888', letterSpacing: '0.6px', marginBottom: '6px' }}>
                PLAN START DATE
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '1.4rem' }}>
              <button type="button" onClick={onClose} style={wizardStyles.cancelBtn}>Cancel</button>
              <button
                type="button"
                onClick={() => setStep(2)}
                style={{ ...wizardStyles.nextBtn, backgroundColor: badgeColor }}
              >
                Next: Program Style ➔
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Program Style / Periodization */}
        {step === 2 && (
          <div>
            <p style={wizardStyles.stepDescription}>
              Choose how your workouts rotate or progress across your {durationWeeks}-week program:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '340px', overflowY: 'auto', paddingRight: '2px' }}>
              {PROGRAM_STYLES.map((style) => {
                const isSelected = programStyle.id === style.id;
                return (
                  <div
                    key={style.id}
                    onClick={() => handleSelectProgramStyle(style)}
                    style={{
                      ...wizardStyles.styleCard,
                      borderColor: isSelected ? badgeColor : 'rgba(255, 255, 255, 0.08)',
                      backgroundColor: isSelected ? 'rgba(52, 211, 153, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ ...wizardStyles.styleTag, color: badgeColor }}>{style.tag}</span>
                      <span style={{ fontSize: '0.7rem', color: isSelected ? badgeColor : '#666', fontWeight: '800' }}>
                        {isSelected ? '✓ SELECTED' : ''}
                      </span>
                    </div>
                    <div style={{ fontWeight: '800', fontSize: '0.94rem', color: '#fff', marginTop: '4px' }}>
                      {style.name}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#888', marginTop: '2px', lineHeight: 1.3 }}>
                      {style.desc}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '1.2rem' }}>
              <button type="button" onClick={() => setStep(1)} style={wizardStyles.cancelBtn}>← Back</button>
              <button
                type="button"
                onClick={() => setStep(3)}
                style={{ ...wizardStyles.nextBtn, backgroundColor: badgeColor }}
              >
                Next: Configure Split ➔
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Assign Muscles to Days */}
        {step === 3 && (
          <div>
            {availableWeekTabs.length > 1 && (
              <div style={wizardStyles.periodizationTabs}>
                {availableWeekTabs.map((wKey) => (
                  <button
                    key={wKey}
                    type="button"
                    onClick={() => { setActiveTab(wKey); setOpenMuscleDropdown(null); }}
                    style={{
                      ...wizardStyles.tabBtn,
                      backgroundColor: activeTab === wKey ? badgeColor : 'transparent',
                      color: activeTab === wKey ? '#000' : '#888',
                    }}
                  >
                    Week {wKey} {wKey === 'A' ? '(Odd: 1, 3)' : wKey === 'B' ? '(Even: 2, 4)' : '(Week 3)'}
                  </button>
                ))}
              </div>
            )}

            <div style={wizardStyles.statusBar}>
              <span style={{ color: '#888', fontSize: '0.78rem', fontWeight: '700' }}>
                {targetDays} Days / Wk · {durationWeeks} Weeks Total
              </span>
              <span style={{ color: badgeColor, fontSize: '0.78rem', fontWeight: '800' }}>
                {activeCount} Active Days in Week {activeTab}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '310px', overflowY: 'auto', paddingRight: '2px' }}>
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
                        <div onClick={() => toggleDayActive(d.id)} style={wizardStyles.restPlaceholderBox}>
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
              <button type="button" onClick={() => setStep(2)} style={wizardStyles.cancelBtn}>← Back</button>
              <button
                type="button"
                onClick={() => {
                  const firstActive = DAYS.find((d) => currentPlan[d.id]?.active);
                  if (firstActive) setCurrentEditDay(firstActive.id);
                  setStep(4);
                }}
                style={{ ...wizardStyles.nextBtn, backgroundColor: badgeColor }}
              >
                Choose Exercises ➔
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Review Exercises */}
        {step === 4 && (
          <div>
            {availableWeekTabs.length > 1 && (
              <div style={{ ...wizardStyles.periodizationTabs, marginBottom: '0.6rem' }}>
                {availableWeekTabs.map((wKey) => (
                  <button
                    key={wKey}
                    type="button"
                    onClick={() => {
                      setActiveTab(wKey);
                      setShowInlinePicker(false);
                      setSearchQuery('');
                      const firstActive = DAYS.find((d) => (weekPlans[wKey] || {})[d.id]?.active);
                      if (firstActive) setCurrentEditDay(firstActive.id);
                    }}
                    style={{
                      ...wizardStyles.tabBtn,
                      backgroundColor: activeTab === wKey ? badgeColor : 'transparent',
                      color: activeTab === wKey ? '#000' : '#888',
                    }}
                  >
                    Week {wKey}
                  </button>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '6px', marginBottom: '8px' }}>
              {DAYS.filter((d) => currentPlan[d.id]?.active).map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => {
                    setCurrentEditDay(d.id);
                    setShowInlinePicker(false);
                    setSearchQuery('');
                    setMuscleFilterChip('ALL');
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

            <div style={wizardStyles.tableColumnHeader}>
              <span style={{ flex: 1 }}>EXERCISE</span>
              <span style={{ width: '68px', textAlign: 'center' }}>SETS</span>
              <span style={{ width: '68px', textAlign: 'center' }}>REPS</span>
              <span style={{ width: '22px' }} />
            </div>

            <div style={{ maxHeight: showInlinePicker ? '125px' : '210px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
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
                  <span style={{ fontSize: '0.72rem', fontWeight: '800', color: badgeColor }}>
                    ⚡ FILTERED EXERCISES ({currentDayMuscles.join(', ') || 'All'})
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowInlinePicker(false)}
                    style={{ background: 'none', border: 'none', color: '#888', fontSize: '0.78rem', cursor: 'pointer' }}
                  >
                    Close
                  </button>
                </div>

                {currentDayMuscles.length > 1 && (
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '6px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => setMuscleFilterChip('ALL')}
                      style={{
                        ...wizardStyles.chipBtn,
                        backgroundColor: muscleFilterChip === 'ALL' ? badgeColor : 'rgba(255,255,255,0.06)',
                        color: muscleFilterChip === 'ALL' ? '#000' : '#aaa',
                      }}
                    >
                      All ({currentDayMuscles.length})
                    </button>
                    {currentDayMuscles.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMuscleFilterChip(m)}
                        style={{
                          ...wizardStyles.chipBtn,
                          backgroundColor: muscleFilterChip === m ? badgeColor : 'rgba(255,255,255,0.06)',
                          color: muscleFilterChip === m ? '#000' : '#aaa',
                        }}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                )}

                <input
                  type="text"
                  placeholder="Search inside assigned muscles..."
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
              <button type="button" onClick={() => setStep(3)} style={wizardStyles.cancelBtn}>← Back</button>
              <button
                type="button"
                onClick={handleGenerateRoutines}
                style={{ ...wizardStyles.nextBtn, backgroundColor: badgeColor }}
              >
                Generate {durationWeeks}-Week Plan ⚔️
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
    padding: '1.4rem',
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
    marginBottom: '1.1rem',
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
  styleCard: {
    padding: '0.75rem 0.9rem',
    borderRadius: '14px',
    border: '1px solid',
    cursor: 'pointer',
  },
  styleTag: {
    fontSize: '0.65rem',
    fontWeight: '800',
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    padding: '2px 6px',
    borderRadius: '6px',
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
  chipBtn: {
    padding: '3px 8px',
    borderRadius: '6px',
    border: 'none',
    fontSize: '0.68rem',
    fontWeight: '700',
    cursor: 'pointer',
    textTransform: 'capitalize',
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