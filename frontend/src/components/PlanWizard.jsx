// frontend/src/components/PlanWizard.jsx
import React, { useState, useRef, useEffect } from 'react';

// Strictly the 7 major muscle groups requested
const MUSCLE_GROUPS = [
  { id: 'chest', label: 'Chest', icon: '🛡️' },
  { id: 'back', label: 'Back', icon: '🦅' },
  { id: 'shoulders', label: 'Shoulders', icon: '🎯' },
  { id: 'biceps', label: 'Biceps', icon: '💪' },
  { id: 'triceps', label: 'Triceps', icon: '⚡' },
  { id: 'legs', label: 'Legs', icon: '🦵' },
  { id: 'core', label: 'Core', icon: '🔥' },
];

const DAYS_OF_WEEK = [
  { id: 1, name: 'Monday' },
  { id: 2, name: 'Tuesday' },
  { id: 3, name: 'Wednesday' },
  { id: 4, name: 'Thursday' },
  { id: 5, name: 'Friday' },
  { id: 6, name: 'Saturday' },
  { id: 0, name: 'Sunday' },
];

export default function PlanWizard({ isOpen, onClose, onGenerate, badgeColor = '#34D399' }) {
  const [step, setStep] = useState(1); // Step 1: Training Frequency | Step 2: Split Config | Step 3: Confirmation
  const [daysPerWeek, setDaysPerWeek] = useState(4); // Default 4 workout days
  const [currentWeekTab, setCurrentWeekTab] = useState('A'); // 'A' | 'B'
  const [openDropdownDay, setOpenDropdownDay] = useState(null);

  // Split state tracking
  const [splitWeekA, setSplitWeekA] = useState({
    1: [],
    2: [],
    3: [],
    4: [],
    5: 'Rest',
    6: 'Rest',
    0: 'Rest',
  });

  const [splitWeekB, setSplitWeekB] = useState({
    1: [],
    2: [],
    3: [],
    4: [],
    5: 'Rest',
    6: 'Rest',
    0: 'Rest',
  });

  const dropdownRef = useRef(null);

  // Auto-close popover on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdownDay(null);
      }
    };
    if (openDropdownDay !== null) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdownDay]);

  if (!isOpen) return null;

  const activeSplit = currentWeekTab === 'A' ? splitWeekA : splitWeekB;
  const setActiveSplit = currentWeekTab === 'A' ? setSplitWeekA : setSplitWeekB;

  // Calculate current active workout days count
  const activeDaysCount = Object.values(activeSplit).filter((v) => v !== 'Rest').length;

  const toggleMuscleSelection = (dayId, muscleId) => {
    setActiveSplit((prev) => {
      const currentList = Array.isArray(prev[dayId]) ? prev[dayId] : [];
      const updated = currentList.includes(muscleId)
        ? currentList.filter((id) => id !== muscleId)
        : [...currentList, muscleId];

      return {
        ...prev,
        [dayId]: updated,
      };
    });
  };

  const toggleActiveRest = (dayId) => {
    const isCurrentlyRest = activeSplit[dayId] === 'Rest';
    setActiveSplit((prev) => ({
      ...prev,
      [dayId]: isCurrentlyRest ? [] : 'Rest',
    }));
    if (openDropdownDay === dayId) {
      setOpenDropdownDay(null);
    }
  };

  const handleNext = () => {
    if (step === 1) {
      // Setup default active/rest days based on selected frequency
      const initialA = { 1: 'Rest', 2: 'Rest', 3: 'Rest', 4: 'Rest', 5: 'Rest', 6: 'Rest', 0: 'Rest' };
      const initialB = { 1: 'Rest', 2: 'Rest', 3: 'Rest', 4: 'Rest', 5: 'Rest', 6: 'Rest', 0: 'Rest' };

      const activeDayKeys = [1, 2, 3, 4, 5, 6, 0].slice(0, daysPerWeek);
      activeDayKeys.forEach((d) => {
        initialA[d] = [];
        initialB[d] = [];
      });

      setSplitWeekA(initialA);
      setSplitWeekB(initialB);
      setStep(2);
    } else if (step === 2) {
      if (typeof onGenerate === 'function') {
        onGenerate({
          daysPerWeek,
          splitWeekA,
          splitWeekB,
        });
      }
      onClose();
      setStep(1);
    }
  };

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div style={styles.header}>
          <div>
            <span style={{ fontSize: '0.68rem', fontWeight: '800', color: badgeColor, letterSpacing: '1px' }}>
              STEP {step} OF 2
            </span>
            <h2 style={{ margin: '0.2rem 0', fontSize: '1.25rem', color: '#fff' }}>
              {step === 1 ? 'Weekly Training Frequency' : 'Custom Weekly Split'}
            </h2>
          </div>
          <button type="button" onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        {/* STEP 1: CHOOSE HOW MANY DAYS TO TRAIN */}
        {step === 1 && (
          <div style={{ margin: '1rem 0 1.5rem' }}>
            <div style={{ fontSize: '0.85rem', color: '#aaa', marginBottom: '1.2rem', lineHeight: 1.4 }}>
              How many days per week do you want to work out? You can choose any days as rest days on the next step.
            </div>

            <div style={styles.frequencyGrid}>
              {[2, 3, 4, 5, 6, 7].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setDaysPerWeek(num)}
                  style={{
                    ...styles.frequencyBtn,
                    borderColor: daysPerWeek === num ? badgeColor : 'rgba(255,255,255,0.1)',
                    backgroundColor: daysPerWeek === num ? 'rgba(52, 211, 153, 0.15)' : 'rgba(255,255,255,0.04)',
                    color: daysPerWeek === num ? '#fff' : '#aaa',
                  }}
                >
                  <span style={{ fontSize: '1.4rem', fontWeight: '800', color: daysPerWeek === num ? badgeColor : '#fff' }}>
                    {num}
                  </span>
                  <span style={{ fontSize: '0.72rem', fontWeight: '600' }}>
                    {num === 7 ? 'Every Day' : `${num} Days / Week`}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: DYNAMIC REST & WORKOUT DAY ASSIGNMENT */}
        {step === 2 && (
          <>
            {/* Tab Switcher: Week A / Week B */}
            <div style={styles.weekTabRow}>
              <button
                type="button"
                style={{
                  ...styles.weekTabBtn,
                  backgroundColor: currentWeekTab === 'A' ? badgeColor : 'rgba(255,255,255,0.06)',
                  color: currentWeekTab === 'A' ? '#000' : '#888',
                }}
                onClick={() => {
                  setCurrentWeekTab('A');
                  setOpenDropdownDay(null);
                }}
              >
                Week A (Odd Weeks: 1, 3)
              </button>
              <button
                type="button"
                style={{
                  ...styles.weekTabBtn,
                  backgroundColor: currentWeekTab === 'B' ? badgeColor : 'rgba(255,255,255,0.06)',
                  color: currentWeekTab === 'B' ? '#000' : '#888',
                }}
                onClick={() => {
                  setCurrentWeekTab('B');
                  setOpenDropdownDay(null);
                }}
              >
                Week B (Even Weeks: 2, 4)
              </button>
            </div>

            {/* Target vs Selected Indicator */}
            <div style={styles.targetStatusBar}>
              <span style={{ fontSize: '0.75rem', color: '#888' }}>
                Target: <strong>{daysPerWeek} Training Days</strong>
              </span>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: '800',
                  color: activeDaysCount === daysPerWeek ? badgeColor : '#FBBF24',
                }}
              >
                {activeDaysCount} Active Days Selected
              </span>
            </div>

            {/* Day Rows with Multi-Select Popovers */}
            <div style={styles.daysContainer}>
              {DAYS_OF_WEEK.map((day) => {
                const rawVal = activeSplit[day.id];
                const isRest = rawVal === 'Rest';
                const selectedArray = Array.isArray(rawVal) ? rawVal : [];
                const isDropdownOpen = openDropdownDay === day.id;

                return (
                  <div key={day.id} style={{ position: 'relative' }}>
                    <div style={styles.dayRow}>
                      {/* Active / Rest Toggle Badge (Clickable for EVERY day) */}
                      <button
                        type="button"
                        onClick={() => toggleActiveRest(day.id)}
                        style={{
                          ...styles.statusBadge,
                          backgroundColor: isRest ? 'rgba(255,255,255,0.08)' : badgeColor,
                          color: isRest ? '#888' : '#000',
                        }}
                        title="Tap to toggle Rest / Active"
                      >
                        {isRest ? 'REST' : 'ACTIVE'}
                      </button>

                      {/* Day Name */}
                      <span style={styles.dayName}>{day.name}</span>

                      {/* Multi-Select Trigger Button or Rest indicator */}
                      {isRest ? (
                        <div
                          style={styles.restPlaceholder}
                          onClick={() => toggleActiveRest(day.id)}
                        >
                          Rest Day ☕ (Tap to activate)
                        </div>
                      ) : (
                        <div
                          onClick={() => setOpenDropdownDay(isDropdownOpen ? null : day.id)}
                          style={{
                            ...styles.selectTrigger,
                            borderColor: selectedArray.length > 0 ? badgeColor : 'rgba(255,255,255,0.15)',
                          }}
                        >
                          <div style={styles.selectedDisplay}>
                            {selectedArray.length === 0 ? (
                              <span style={{ color: '#666' }}>-- Select Muscle Groups --</span>
                            ) : (
                              selectedArray.map((mId) => {
                                const group = MUSCLE_GROUPS.find((g) => g.id === mId);
                                return (
                                  <span key={mId} style={styles.selectedPill}>
                                    {group?.icon} {group?.label}
                                  </span>
                                );
                              })
                            )}
                          </div>
                          <span style={{ fontSize: '0.75rem', color: '#888' }}>▼</span>
                        </div>
                      )}
                    </div>

                    {/* Multi-Select Dropdown Popover */}
                    {isDropdownOpen && !isRest && (
                      <div ref={dropdownRef} style={styles.multiSelectDropdown}>
                        <div style={styles.dropdownHeader}>
                          <span>FOCUS FOR {day.name.toUpperCase()}</span>
                          <span style={{ color: badgeColor, fontWeight: '800' }}>
                            {selectedArray.length} Selected
                          </span>
                        </div>

                        <div style={styles.optionsList}>
                          {MUSCLE_GROUPS.map((group) => {
                            const isChecked = selectedArray.includes(group.id);
                            return (
                              <div
                                key={group.id}
                                onClick={() => toggleMuscleSelection(day.id, group.id)}
                                style={{
                                  ...styles.optionRow,
                                  backgroundColor: isChecked ? 'rgba(52, 211, 153, 0.15)' : 'transparent',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ fontSize: '1.1rem' }}>{group.icon}</span>
                                  <span
                                    style={{
                                      fontSize: '0.85rem',
                                      fontWeight: isChecked ? '700' : '500',
                                      color: isChecked ? '#fff' : '#ccc',
                                    }}
                                  >
                                    {group.label}
                                  </span>
                                </div>
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {}}
                                  style={styles.checkboxInput}
                                />
                              </div>
                            );
                          })}
                        </div>

                        <div style={{ padding: '0.6rem 0.8rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                          <button
                            type="button"
                            onClick={() => setOpenDropdownDay(null)}
                            style={{ ...styles.doneMiniBtn, backgroundColor: badgeColor }}
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Footer Navigation */}
        <div style={styles.footerRow}>
          <button
            type="button"
            onClick={() => (step === 2 ? setStep(1) : onClose())}
            style={styles.backBtn}
          >
            {step === 1 ? 'Cancel' : '← Back'}
          </button>
          <button
            type="button"
            onClick={handleNext}
            style={{ ...styles.nextBtn, backgroundColor: badgeColor }}
          >
            {step === 1 ? 'Next: Configure Split →' : 'Generate Routines ⚔️'}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
  },
  modal: {
    width: '100%',
    maxWidth: '460px',
    backgroundColor: 'rgba(18, 18, 22, 0.98)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '24px',
    padding: '1.4rem',
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
    color: '#fff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1rem',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#888',
    fontSize: '1.2rem',
    cursor: 'pointer',
    padding: 0,
  },
  frequencyGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '0.75rem',
  },
  frequencyBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem 0.5rem',
    borderRadius: '16px',
    border: '1px solid',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    gap: '4px',
  },
  weekTabRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.5rem',
    marginBottom: '0.8rem',
  },
  weekTabBtn: {
    padding: '0.65rem 0.5rem',
    borderRadius: '12px',
    border: 'none',
    fontSize: '0.78rem',
    fontWeight: '800',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  targetStatusBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.4rem 0.6rem',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: '10px',
    marginBottom: '0.8rem',
  },
  daysContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    marginBottom: '1.4rem',
    maxHeight: '360px',
    overflowY: 'auto',
    paddingRight: '4px',
  },
  dayRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  statusBadge: {
    width: '65px',
    padding: '0.4rem 0',
    borderRadius: '8px',
    border: 'none',
    fontSize: '0.68rem',
    fontWeight: '800',
    letterSpacing: '0.5px',
    cursor: 'pointer',
    textAlign: 'center',
    flexShrink: 0,
  },
  dayName: {
    width: '80px',
    fontSize: '0.85rem',
    fontWeight: '700',
    color: '#fff',
    flexShrink: 0,
  },
  selectTrigger: {
    flex: 1,
    minHeight: '38px',
    padding: '0.35rem 0.65rem',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    boxSizing: 'border-box',
  },
  selectedDisplay: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
    alignItems: 'center',
    fontSize: '0.78rem',
  },
  selectedPill: {
    backgroundColor: 'rgba(52, 211, 153, 0.2)',
    color: '#34D399',
    border: '1px solid rgba(52, 211, 153, 0.3)',
    borderRadius: '8px',
    padding: '2px 6px',
    fontSize: '0.72rem',
    fontWeight: '700',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '3px',
  },
  restPlaceholder: {
    flex: 1,
    padding: '0.55rem 0.75rem',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '12px',
    color: '#666',
    fontSize: '0.78rem',
    fontStyle: 'italic',
    cursor: 'pointer',
  },
  multiSelectDropdown: {
    position: 'absolute',
    top: 'calc(100% + 4px)',
    left: '145px',
    right: 0,
    backgroundColor: '#181820',
    border: '1px solid rgba(255, 255, 255, 0.18)',
    borderRadius: '16px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.9)',
    zIndex: 100,
    overflow: 'hidden',
  },
  dropdownHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0.6rem 0.8rem',
    fontSize: '0.65rem',
    fontWeight: '800',
    color: '#888',
    letterSpacing: '0.6px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  },
  optionsList: {
    maxHeight: '190px',
    overflowY: 'auto',
  },
  optionRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.5rem 0.8rem',
    cursor: 'pointer',
    transition: 'background 0.15s ease',
  },
  checkboxInput: {
    accentColor: '#34D399',
    width: '15px',
    height: '15px',
    cursor: 'pointer',
  },
  doneMiniBtn: {
    width: '100%',
    padding: '0.45rem',
    borderRadius: '10px',
    border: 'none',
    color: '#000',
    fontWeight: '800',
    fontSize: '0.75rem',
    cursor: 'pointer',
  },
  footerRow: {
    display: 'flex',
    gap: '0.8rem',
  },
  backBtn: {
    flex: 1,
    padding: '0.85rem',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '14px',
    color: '#fff',
    fontWeight: '800',
    fontSize: '0.85rem',
    cursor: 'pointer',
  },
  nextBtn: {
    flex: 1,
    padding: '0.85rem',
    border: 'none',
    borderRadius: '14px',
    color: '#000',
    fontWeight: '800',
    fontSize: '0.85rem',
    cursor: 'pointer',
  },
};