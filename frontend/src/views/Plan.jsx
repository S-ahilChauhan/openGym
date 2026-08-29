// frontend/src/views/Plan.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../store/useStore.js';
import { DAYN, uid, exCount } from '../lib/format.js';
import { streakWeeks } from '../lib/history.js';
import { t } from '../lib/i18n.js';
import { getStreakRank } from '../utils/ranks.js';
import { dayAssignSheet, loadStarterPlan, planToolsSheet } from '../sheets.jsx';
import { extractTextFromPdf, parseWorkoutTextToRoutines } from '../utils/pdfParser.js';
import { generatePlanFromWizard } from '../utils/planGenerator.js';
import { unpackBuddyInviteToken } from '../utils/buddySync.js';
import * as ExLib from '../lib/exercises.js';
import PlanWizard from '../components/PlanWizard.jsx';
import WorkoutBuddyModal from '../components/WorkoutBuddyModal.jsx';
import Icon from '../components/Icon.jsx';
import { Button } from '../components/ui.jsx';
import { glyphOf, DEFAULT_GLYPH } from '../lib/glyphs.js';

// Fallback exercise list in case EXDB is loading or modified
const FALLBACK_EX_LIST = [
  { id: '0001', n: 'Barbell Bench Press', bp: 'chest', tg: 'pectorals' },
  { id: '0005', n: 'Incline Dumbbell Press', bp: 'chest', tg: 'pectorals' },
  { id: '0007', n: 'Dumbbell Chest Flys', bp: 'chest', tg: 'pectorals' },
  { id: '0100', n: 'Pull-ups', bp: 'back', tg: 'lats' },
  { id: '0102', n: 'Lat Pulldown (Wide Grip)', bp: 'back', tg: 'lats' },
  { id: '0106', n: 'Barbell Bent Over Row', bp: 'back', tg: 'upper back' },
  { id: '0108', n: 'T-Bar Row', bp: 'back', tg: 'upper back' },
  { id: '0112', n: 'Barbell Deadlift', bp: 'back', tg: 'spine' },
  { id: '0117', n: 'Barbell Shrugs', bp: 'back', tg: 'traps' },
  { id: '0200', n: 'Overhead Barbell Press (OHP)', bp: 'shoulders', tg: 'delts' },
  { id: '0202', n: 'Arnold Press', bp: 'shoulders', tg: 'delts' },
  { id: '0204', n: 'Dumbbell Lateral Raise', bp: 'shoulders', tg: 'delts' },
  { id: '0300', n: 'Standing Barbell Curl', bp: 'upper arms', tg: 'biceps' },
  { id: '0305', n: 'Dumbbell Hammer Curls', bp: 'upper arms', tg: 'biceps' },
  { id: '0350', n: 'Triceps Rope Pushdown', bp: 'upper arms', tg: 'triceps' },
  { id: '0355', n: 'Skull Crushers', bp: 'upper arms', tg: 'triceps' },
  { id: '0500', n: 'Barbell Back Squat', bp: 'upper legs', tg: 'quads' },
  { id: '0503', n: 'Leg Press (45 Degree)', bp: 'upper legs', tg: 'quads' },
  { id: '0507', n: 'Bulgarian Split Squats', bp: 'upper legs', tg: 'quads' },
  { id: '0550', n: 'Lying Leg Curl Machine', bp: 'upper legs', tg: 'hamstrings' },
  { id: '0552', n: 'Romanian Deadlift (Barbell)', bp: 'upper legs', tg: 'hamstrings' },
  { id: '0560', n: 'Standing Calf Raise', bp: 'lower legs', tg: 'calves' },
  { id: '0600', n: 'Floor Crunches', bp: 'waist', tg: 'abs' },
  { id: '0602', n: 'Hanging Leg Raises', bp: 'waist', tg: 'abs' },
  { id: '0604', n: 'Lying Leg Raises', bp: 'waist', tg: 'abs' },
  { id: '0605', n: 'Standard Plank', bp: 'waist', tg: 'abs' },
];

const PRESET_SPLITS = [
  {
    id: 'ppl',
    name: 'Push / Pull / Legs (PPL)',
    tag: '🔥 Popular',
    desc: 'Chest/Delts/Triceps • Back/Biceps • Quads/Hamstrings',
    defaultWeeks: 8,
    routines: [
      { name: 'Push (Chest & Triceps)', emoji: '🛡️', ex: ['0001', '0005', '0200', '0204', '0350', '0355'] },
      { name: 'Pull (Back & Biceps)', emoji: '🦅', ex: ['0100', '0102', '0106', '0117', '0300', '0305'] },
      { name: 'Legs & Core', emoji: '🦵', ex: ['0500', '0503', '0550', '0552', '0560', '0602'] },
    ],
    weekSchedule: (rIds) => ({
      1: rIds[0],
      2: rIds[1],
      3: rIds[2],
      4: null,
      5: rIds[0],
      6: rIds[1],
      0: null,
    }),
  },
  {
    id: 'upper_lower',
    name: 'Upper / Lower Split',
    tag: '⚔️ Strength & Mass',
    desc: '4-day balanced power split for progressive overload',
    defaultWeeks: 6,
    routines: [
      { name: 'Upper Body Power', emoji: '⚔️', ex: ['0001', '0106', '0200', '0204', '0300', '0350'] },
      { name: 'Lower Body & Core', emoji: '🦵', ex: ['0500', '0503', '0552', '0560', '0605'] },
    ],
    weekSchedule: (rIds) => ({
      1: rIds[0],
      2: rIds[1],
      3: null,
      4: rIds[0],
      5: rIds[1],
      6: null,
      0: null,
    }),
  },
  {
    id: 'arnold_split',
    name: 'Arnold Split',
    tag: '🏆 Classic Physique',
    desc: 'Chest & Back • Shoulders & Arms • Legs & Core',
    defaultWeeks: 8,
    routines: [
      { name: 'Chest & Back', emoji: '🛡️', ex: ['0001', '0005', '0100', '0108', '0007', '0112'] },
      { name: 'Shoulders & Arms', emoji: '💪', ex: ['0202', '0204', '0300', '0355', '0305', '0350'] },
      { name: 'Legs & Core', emoji: '🦵', ex: ['0500', '0507', '0550', '0560', '0600', '0604'] },
    ],
    weekSchedule: (rIds) => ({
      1: rIds[0],
      2: rIds[1],
      3: rIds[2],
      4: rIds[0],
      5: rIds[1],
      6: rIds[2],
      0: null,
    }),
  },
  {
    id: 'full_body_3day',
    name: 'Full Body (3-Day)',
    tag: '⚡ Time Efficient',
    desc: 'Full-body compound movements 3 days a week',
    defaultWeeks: 4,
    routines: [
      { name: 'Full Body A', emoji: '💥', ex: ['0500', '0001', '0106', '0204', '0605'] },
      { name: 'Full Body B', emoji: '⚡', ex: ['0112', '0200', '0102', '0300', '0350'] },
      { name: 'Full Body C', emoji: '🔥', ex: ['0503', '0005', '0100', '0552', '0602'] },
    ],
    weekSchedule: (rIds) => ({
      1: rIds[0],
      2: null,
      3: rIds[1],
      4: null,
      5: rIds[2],
      6: null,
      0: null,
    }),
  },
];

export default function Plan({ rankWeeks = null } = {}) {
  const nav = useNavigate();
  const location = useLocation();
  const S = useStore((s) => s.S) || {};
  const update = useStore((s) => s.update);
  const rank = getStreakRank(rankWeeks ?? (typeof streakWeeks === 'function' ? streakWeeks(S) : 0));

  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isDuoModalOpen, setIsDuoModalOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState('');
  const fileInputRef = useRef(null);

  // Template Customizer Modal States
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateWeeks, setTemplateWeeks] = useState(8);
  const [customizedRoutines, setCustomizedRoutines] = useState([]);
  const [activeRoutineIndex, setActiveRoutineIndex] = useState(0);
  const [showAddExModal, setShowAddExModal] = useState(false);
  const [exSearchQuery, setExSearchQuery] = useState('');

  // Robust exercise catalog resolution
  const exerciseCatalog = Array.isArray(ExLib?.EXDB) && ExLib.EXDB.length > 0 ? ExLib.EXDB : FALLBACK_EX_LIST;

  const resolveExercise = (exId) => {
    const rawId = String(exId || '');
    if (typeof ExLib?.exById === 'function') {
      const resolved = ExLib.exById(rawId, S);
      if (resolved) return resolved;
    }
    const found = exerciseCatalog.find((x) => String(x.id) === rawId);
    if (found) return found;

    const customFound = (S?.customEx || []).find((x) => String(x.id) === rawId);
    if (customFound) return customFound;

    return { n: `Exercise #${rawId}`, bp: 'General', tg: '' };
  };

  useEffect(() => {
    const searchStr = location.search || (window.location.hash.includes('?') ? window.location.hash.split('?')[1] : '');
    const params = new URLSearchParams(searchStr);
    const token = params.get('buddyToken');

    if (token && typeof unpackBuddyInviteToken === 'function') {
      const data = unpackBuddyInviteToken(token);
      if (data && data.routines) {
        const confirmed = window.confirm(
          `⚔️ Forge Duo Invite Received!\n\nSync ${data.creatorName}'s ${data.durationWeeks}-week training split into your schedule?`
        );
        if (confirmed) {
          applyDuoPlan(data);
        }
      }
    }
  }, [location]);

  const applyDuoPlan = (data) => {
    if (typeof update !== 'function') return;
    update((s) => {
      if (!s.customEx) s.customEx = [];
      if (!s.exercises) s.exercises = [];

      if (data.customEx && Array.isArray(data.customEx)) {
        const existingIds = new Set(s.customEx.map((x) => x.id));
        const newUnique = data.customEx.filter((x) => !existingIds.has(x.id));
        s.customEx = [...s.customEx, ...newUnique];
        s.exercises = [...(s.exercises || []), ...newUnique];
      }

      s.routines = data.routines || s.routines;
      s.week = data.week || s.week;
      s.buddy = {
        name: data.creatorName,
        durationWeeks: data.durationWeeks,
        syncedAt: data.createdAt || new Date().toISOString().slice(0, 10),
      };
    });

    setImportMsg(`⚔️ Forge Duo active with ${data.creatorName} (${data.durationWeeks} weeks synced)!`);
    setTimeout(() => setImportMsg(''), 5000);
  };

  const handleOpenTemplateModal = (preset) => {
    setSelectedTemplate(preset);
    setTemplateWeeks(preset.defaultWeeks || 8);
    setCustomizedRoutines(JSON.parse(JSON.stringify(preset.routines)));
    setActiveRoutineIndex(0);
  };

  const handleRemoveExercise = (rIdx, exIdx) => {
    setCustomizedRoutines((prev) => {
      const updated = [...prev];
      if (updated[rIdx]?.ex) {
        updated[rIdx].ex.splice(exIdx, 1);
      }
      return updated;
    });
  };

  const handleAddExerciseToRoutine = (exId) => {
    setCustomizedRoutines((prev) => {
      const updated = [...prev];
      if (updated[activeRoutineIndex] && !updated[activeRoutineIndex].ex.includes(exId)) {
        updated[activeRoutineIndex].ex.push(exId);
      }
      return updated;
    });
    setShowAddExModal(false);
    setExSearchQuery('');
  };

  const handleConfirmApplyTemplate = () => {
    if (!selectedTemplate || typeof update !== 'function') return;

    update((s) => {
      if (!s.routines) s.routines = [];
      if (!s.cfg) s.cfg = {};

      const createdRoutines = customizedRoutines.map((r) => ({
        id: uid(),
        name: r.name,
        emoji: r.emoji || DEFAULT_GLYPH,
        ex: r.ex || [],
      }));

      createdRoutines.forEach((cr) => {
        cr.ex.forEach((exId) => {
          if (!s.cfg[exId]) {
            s.cfg[exId] = { sets: 3, reps: 10, weight: 0 };
          }
        });
      });

      const rIds = createdRoutines.map((r) => r.id);
      s.routines = [...s.routines, ...createdRoutines];
      s.week = selectedTemplate.weekSchedule(rIds);
      s.planDurationWeeks = templateWeeks;
    });

    setImportMsg(`⚔️ Applied ${selectedTemplate.name} for ${templateWeeks} weeks!`);
    setSelectedTemplate(null);
    setTimeout(() => setImportMsg(''), 4500);
  };

  const addRoutine = () => {
    const r = { id: uid(), name: t('New routine'), emoji: DEFAULT_GLYPH, ex: [] };
    if (typeof update === 'function') {
      update((s) => {
        if (!s.routines) s.routines = [];
        s.routines.push(r);
      });
    }
    nav('/plan/r/' + r.id);
  };

  const handleWizardGenerate = (wizardData) => {
    if (typeof generatePlanFromWizard !== 'function') return;
    const { routines, newCustomExercises, updatedWeek, updatedCfg } = generatePlanFromWizard(wizardData, S);

    if (typeof update === 'function') {
      update((s) => {
        if (!s.customEx) s.customEx = [];
        if (!s.exercises) s.exercises = [];
        if (!s.routines) s.routines = [];
        if (!s.cfg) s.cfg = {};

        const existingCustomIds = new Set(s.customEx.map((x) => x.id));
        const uniqueCustom = (newCustomExercises || []).filter((x) => !existingCustomIds.has(x.id));

        s.customEx = [...s.customEx, ...uniqueCustom];
        s.exercises = [...s.exercises, ...uniqueCustom];
        s.routines = routines;
        s.week = updatedWeek;
        s.cfg = { ...s.cfg, ...updatedCfg };
      });
    }

    setImportMsg(`⚔️ Custom plan generated with ${routines?.length || 0} routines!`);
    setTimeout(() => setImportMsg(''), 4000);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportMsg('Importing workout plan...');

    try {
      let importedRoutines = [];
      let newCustomExercises = [];

      if (file.name.endsWith('.json') || file.type.includes('json')) {
        const text = await file.text();
        const parsedJson = JSON.parse(text);
        const routinesList = Array.isArray(parsedJson) ? parsedJson : (parsedJson.routines || []);

        routinesList.forEach((routine) => {
          const routineExIds = [];
          (routine.exercises || []).forEach((ex) => {
            const exerciseName = typeof ex === 'string' ? ex : ex.name;
            const exId = 'custom_' + exerciseName.toLowerCase().replace(/[^a-z0-9]/g, '_');

            newCustomExercises.push({
              id: exId,
              n: exerciseName,
              bp: 'general',
              tg: 'general',
              eq: 'other',
              custom: true,
            });

            routineExIds.push(exId);
          });

          importedRoutines.push({
            id: uid(),
            name: routine.name || 'Imported Routine',
            emoji: routine.emoji || DEFAULT_GLYPH,
            ex: routineExIds,
          });
        });
      } else {
        const extractedText = await extractTextFromPdf(file);
        const parsed = parseWorkoutTextToRoutines(extractedText, S?.exercises || []);
        importedRoutines = parsed.routines;
        newCustomExercises = parsed.newlyCreatedExercises || [];
      }

      if (!importedRoutines || importedRoutines.length === 0) {
        setImportMsg('No workouts found in file.');
        return;
      }

      update((s) => {
        if (!s.customEx) s.customEx = [];
        if (!s.exercises) s.exercises = [];
        if (!s.routines) s.routines = [];

        const existingCustomIds = new Set(s.customEx.map((x) => x.id));
        const uniqueCustom = newCustomExercises.filter((x) => !existingCustomIds.has(x.id));

        s.customEx = [...s.customEx, ...uniqueCustom];
        s.exercises = [...s.exercises, ...uniqueCustom];
        s.routines = [...s.routines, ...importedRoutines];
      });

      setImportMsg(`⚔️ Imported ${importedRoutines.length} routine(s) successfully!`);
    } catch (err) {
      console.error('File import error:', err);
      setImportMsg('Import failed: ' + (err.message || 'Check file format'));
    } finally {
      setImporting(false);
      setTimeout(() => setImportMsg(''), 4000);
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const routinesArray = Array.isArray(S?.routines) ? S.routines : [];

  return (
    <>
      <div className="hdr" style={planStyles.header}>
        <div>
          <div style={{ ...planStyles.eyebrow, color: rank?.badgeColor || '#34D399' }}>{t('Discipline & routines')}</div>
          <h1 style={planStyles.viewTitle}>{t('Training plan')}</h1>
          <div className="sub">{t('Your weekly routine')} · {rank?.fullTitle || 'Warrior'}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ ...planStyles.rankPill, color: rank?.badgeColor || '#34D399', borderColor: rank?.badgeColor || '#34D399', boxShadow: `0 0 12px ${rank?.glowColor || 'rgba(52,211,153,0.3)'}` }}>
            LVL {rank?.level || 1} · {rank?.kanji || '初心'}
          </div>
          <button className="iconbtn" onClick={planToolsSheet} aria-label={t('Share your plan')} title={t('Share your plan')}>
            <Icon name="upload" />
          </button>
        </div>
      </div>

      {/* ACTIVE FORGE DUO NOTIFICATION BAR */}
      {S?.buddy && (
        <div style={{ ...planStyles.duoActiveCard, borderColor: rank?.badgeColor || '#34D399' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.2rem' }}>⚔️</span>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#fff' }}>
                Forge Duo Active: {S.buddy.name}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#aaa' }}>
                {S.buddy.durationWeeks}-Week Split · Synced on {S.buddy.syncedAt}
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsDuoModalOpen(true)}
            style={{
              ...planStyles.duoSmallBtn,
              backgroundColor: 'rgba(255,255,255,0.08)',
              color: rank?.badgeColor || '#34D399',
            }}
          >
            Manage Link
          </button>
        </div>
      )}

      {/* 🏆 PRESET WORKOUT SPLIT SUGGESTIONS */}
      <div style={{ marginTop: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
          <h4 style={{ margin: 0, fontSize: '0.75rem', fontWeight: '800', color: '#888', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
            {t('Featured Split Templates')}
          </h4>
        </div>

        <div style={planStyles.presetScrollContainer}>
          {PRESET_SPLITS.map((preset) => (
            <div
              key={preset.id}
              style={planStyles.presetCard}
              onClick={() => handleOpenTemplateModal(preset)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={planStyles.presetTag}>{preset.tag}</span>
                <span style={{ fontSize: '0.7rem', color: '#777', fontWeight: '700' }}>
                  {preset.routines.length} Workouts
                </span>
              </div>
              
              <div style={planStyles.presetName}>{preset.name}</div>
              <div style={planStyles.presetDesc}>{preset.desc}</div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '0.6rem' }}>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {preset.routines.map((r, i) => (
                    <span key={i} style={{ fontSize: '1rem' }} title={r.name}>
                      {r.emoji}
                    </span>
                  ))}
                </div>
                <button
                  type="button"
                  style={{
                    ...planStyles.applySplitBtn,
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    borderColor: rank?.badgeColor || '#34D399',
                    color: rank?.badgeColor || '#34D399',
                  }}
                >
                  Customize & Plan →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 🧙‍♂️ CREATE A PLAN WIZARD BANNER */}
      <div style={{ ...planStyles.surface, padding: '1.1rem', marginTop: '0.9rem', borderLeft: `4px solid ${rank?.badgeColor || '#34D399'}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: '800', fontSize: '0.95rem' }}>Custom Plan Wizard</div>
            <div style={{ fontSize: '0.72rem', color: '#aaa', marginTop: '0.15rem' }}>
              Multi-week rotation, body part filters & sets/reps
            </div>
          </div>
          <Button
            variant="primary"
            onClick={() => setIsWizardOpen(true)}
            style={{ backgroundColor: rank?.badgeColor || '#34D399', color: '#0e0e12', fontWeight: '800', fontSize: '0.76rem' }}
          >
            ⚡ Start Wizard
          </Button>
        </div>
      </div>

      {/* ⚔️ FORGE DUO & FILE IMPORTER ROW */}
      <div style={planStyles.toolsGrid}>
        {/* Forge Duo Button Card */}
        <div style={{ ...planStyles.surface, padding: '1.1rem', cursor: 'pointer' }} onClick={() => setIsDuoModalOpen(true)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: '800', fontSize: '0.92rem', color: '#fff' }}>
                ⚔️ Forge Duo
              </div>
              <div style={{ fontSize: '0.72rem', color: '#888', marginTop: '0.15rem' }}>
                Sync split via QR code or email
              </div>
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: '800', color: rank?.badgeColor || '#34D399' }}>
              Sync →
            </span>
          </div>
        </div>

        {/* File Importer */}
        <div style={{ ...planStyles.surface, padding: '1.1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: '800', fontSize: '0.92rem' }}>Import File</div>
              <div style={{ fontSize: '0.72rem', color: '#888', marginTop: '0.15rem' }}>
                JSON / PDF routine parser
              </div>
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.pdf,application/json,application/pdf,text/plain"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                disabled={importing}
              />
              <button
                type="button"
                onClick={triggerFileInput}
                disabled={importing}
                style={{
                  padding: '0.4rem 0.75rem',
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.15)',
                  fontWeight: '700',
                  fontSize: '0.72rem',
                  borderRadius: '10px',
                  cursor: importing ? 'wait' : 'pointer',
                }}
              >
                {importing ? '...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {importMsg && (
        <div style={{ margin: '0.4rem 0 0.8rem', fontSize: '0.78rem', color: rank?.badgeColor || '#34D399', fontWeight: '700' }}>
          {importMsg}
        </div>
      )}

      <div className="cols">
        <div>
          <h4 className="sec">{t('Week schedule')}</h4>
          <div className="list" style={{ ...planStyles.surface, display: 'flex', flexDirection: 'column' }}>
            {[1, 2, 3, 4, 5, 6, 0].map((d) => {
              const r = routinesArray.find((x) => x.id === S?.week?.[d]);
              return (
                <div key={d} className="item" style={{ borderLeft: `3px solid ${rank?.badgeColor || '#34D399'}` }} onClick={() => dayAssignSheet(d)}>
                  <div className="grow"><div className="tt">{t(DAYN[d])}</div></div>
                  {r ? <span className="tag acc"><Icon name={glyphOf(r.emoji)} />{r.name}</span> : <span className="tag">{t('Rest')}</span>}
                  <Icon name="chevronRight" className="chev" />
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <div className="row space-between" style={{ marginTop: 22, marginBottom: 10 }}>
            <h4 className="sec" style={{ margin: 0 }}>{t('Routines')}</h4>
            <Button size="sm" variant="tinted" icon="plus" onClick={addRoutine} style={{ ...planStyles.newRoutineBtn, backgroundColor: rank?.badgeColor || '#34D399' }}>
              {t('Routine')}
            </Button>
          </div>
          {routinesArray.length ? (
            <div className="list" style={planStyles.routineList}>
              {routinesArray.map((r) => (
                <div key={r.id} className="item" style={{ ...planStyles.routineCard, borderLeft: `4px solid ${rank?.badgeColor || '#34D399'}` }} onClick={() => nav('/plan/r/' + r.id)}>
                  <span className="lrow-i"><Icon name={glyphOf(r.emoji)} /></span>
                  <div className="grow">
                    <div className="row space-between">
                      <div className="tt">{r.name}</div>
                      <span style={{ ...planStyles.activeTag, color: rank?.badgeColor || '#34D399' }}>{t('Active')}</span>
                    </div>
                    <div className="ss">{exCount(r.ex?.length || 0)}</div>
                  </div>
                  <Icon name="chevronRight" className="chev" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="empty">
                <div className="ico"><Icon name="clipboard" /></div>
                {t('No routines yet.')}<br />{t('Choose a preset split above or start the wizard.')}
              </div>
              <Button icon="sparkles" onClick={loadStarterPlan}>{t('Load starter plan (Push / Pull / Legs)')}</Button>
            </>
          )}
        </div>
      </div>

      {/* 🛠️ TEMPLATE CUSTOMIZATION & DURATION MODAL */}
      {selectedTemplate && (
        <div style={planStyles.modalBackdrop} onClick={() => setSelectedTemplate(null)}>
          <div style={planStyles.modalContent} onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.68rem', fontWeight: '800', color: rank?.badgeColor || '#34D399', letterSpacing: '0.8px' }}>
                  TEMPLATE CUSTOMIZER
                </span>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '800', margin: '0.2rem 0', color: '#fff' }}>
                  {selectedTemplate.name}
                </h2>
              </div>
              <button onClick={() => setSelectedTemplate(null)} style={planStyles.closeModalBtn}>✕</button>
            </div>

            {/* Duration Selector */}
            <div style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '0.8rem 1rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#fff' }}>Plan Duration</div>
                  <div style={{ fontSize: '0.7rem', color: '#888' }}>How many weeks will you follow this split?</div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[4, 6, 8, 12, 16].map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setTemplateWeeks(w)}
                      style={{
                        padding: '0.35rem 0.65rem',
                        borderRadius: '8px',
                        border: 'none',
                        fontSize: '0.75rem',
                        fontWeight: '800',
                        cursor: 'pointer',
                        backgroundColor: templateWeeks === w ? (rank?.badgeColor || '#34D399') : 'rgba(255,255,255,0.08)',
                        color: templateWeeks === w ? '#000' : '#aaa',
                      }}
                    >
                      {w}w
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Routine Switcher Tabs */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '0.9rem', overflowX: 'auto', paddingBottom: '4px' }}>
              {customizedRoutines.map((r, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveRoutineIndex(idx)}
                  style={{
                    padding: '0.5rem 0.8rem',
                    borderRadius: '12px',
                    border: '1px solid',
                    borderColor: activeRoutineIndex === idx ? (rank?.badgeColor || '#34D399') : 'rgba(255,255,255,0.1)',
                    backgroundColor: activeRoutineIndex === idx ? 'rgba(52, 211, 153, 0.15)' : 'rgba(255,255,255,0.03)',
                    color: activeRoutineIndex === idx ? '#fff' : '#888',
                    fontSize: '0.78rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <span>{r.emoji}</span>
                  <span>{r.name}</span>
                  <span style={{ fontSize: '0.65rem', color: '#777' }}>({r.ex?.length || 0})</span>
                </button>
              ))}
            </div>

            {/* Exercise List for Active Routine */}
            {customizedRoutines[activeRoutineIndex] && (
              <div style={{ maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '1rem', paddingRight: '4px' }}>
                {customizedRoutines[activeRoutineIndex].ex.map((exId, exIdx) => {
                  const ex = resolveExercise(exId);
                  return (
                    <div
                      key={`${exId}_${exIdx}`}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        backgroundColor: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '12px',
                        padding: '0.55rem 0.8rem',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#fff' }}>{ex.n}</div>
                        <div style={{ fontSize: '0.68rem', color: '#888', textTransform: 'capitalize' }}>
                          {ex.bp} {ex.tg ? `• ${ex.tg}` : ''}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveExercise(activeRoutineIndex, exIdx)}
                        style={{ background: 'none', border: 'none', color: '#ff5555', fontSize: '0.9rem', cursor: 'pointer', padding: '4px' }}
                        title="Remove exercise"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}

                <button
                  type="button"
                  onClick={() => setShowAddExModal(true)}
                  style={{
                    padding: '0.6rem',
                    borderRadius: '12px',
                    border: '1px dashed rgba(255,255,255,0.2)',
                    backgroundColor: 'rgba(255,255,255,0.02)',
                    color: rank?.badgeColor || '#34D399',
                    fontSize: '0.78rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    marginTop: '4px',
                  }}
                >
                  + Add Exercise to {customizedRoutines[activeRoutineIndex].name}
                </button>
              </div>
            )}

            {/* Modal Actions */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setSelectedTemplate(null)}
                style={{
                  flex: 1,
                  padding: '0.8rem',
                  borderRadius: '14px',
                  border: '1px solid rgba(255,255,255,0.15)',
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  color: '#fff',
                  fontWeight: '700',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmApplyTemplate}
                style={{
                  flex: 2,
                  padding: '0.8rem',
                  borderRadius: '14px',
                  border: 'none',
                  backgroundColor: rank?.badgeColor || '#34D399',
                  color: '#000',
                  fontWeight: '800',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                Apply {templateWeeks}-Week Split ⚔️
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔍 ADD EXERCISE SEARCH POPUP */}
      {showAddExModal && (
        <div style={planStyles.modalBackdrop} onClick={() => setShowAddExModal(false)}>
          <div style={{ ...planStyles.modalContent, maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', color: '#fff' }}>Add Exercise</h3>
              <button onClick={() => setShowAddExModal(false)} style={planStyles.closeModalBtn}>✕</button>
            </div>

            <input
              type="text"
              placeholder="Search exercise by name or muscle..."
              value={exSearchQuery}
              onChange={(e) => setExSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.6rem 0.8rem',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.15)',
                backgroundColor: 'rgba(255,255,255,0.06)',
                color: '#fff',
                fontSize: '0.82rem',
                outline: 'none',
                marginBottom: '0.8rem',
                boxSizing: 'border-box',
              }}
            />

            <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {exerciseCatalog
                .filter((x) =>
                  !exSearchQuery ||
                  (x.n && x.n.toLowerCase().includes(exSearchQuery.toLowerCase())) ||
                  (x.bp && x.bp.toLowerCase().includes(exSearchQuery.toLowerCase())) ||
                  (x.tg && x.tg.toLowerCase().includes(exSearchQuery.toLowerCase()))
                )
                .slice(0, 25)
                .map((ex) => (
                  <div
                    key={ex.id}
                    onClick={() => handleAddExerciseToRoutine(ex.id)}
                    style={{
                      padding: '0.5rem 0.75rem',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(255,255,255,0.03)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#fff' }}>{ex.n}</div>
                      <div style={{ fontSize: '0.65rem', color: '#888', textTransform: 'capitalize' }}>
                        {ex.bp} {ex.tg ? `• ${ex.tg}` : ''}
                      </div>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: rank?.badgeColor || '#34D399', fontWeight: '800' }}>+ Add</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Plan Wizard Modal */}
      <PlanWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onGenerate={handleWizardGenerate}
        badgeColor={rank?.badgeColor || '#34D399'}
      />

      {/* Forge Duo Modal */}
      <WorkoutBuddyModal
        isOpen={isDuoModalOpen}
        onClose={() => setIsDuoModalOpen(false)}
        S={S}
        badgeColor={rank?.badgeColor || '#34D399'}
        onApplyRoutine={applyDuoPlan}
      />
    </>
  );
}

const planStyles = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: 12 },
  eyebrow: { fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 3 },
  viewTitle: { fontSize: '1.8rem', fontWeight: '800', margin: '0.15rem 0 0', letterSpacing: '-0.5px' },
  rankPill: { border: '1px solid', borderRadius: '20px', padding: '0.35rem 0.75rem', fontSize: '0.72rem', fontWeight: '800', backgroundColor: 'rgba(20, 20, 25, 0.8)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' },
  newRoutineBtn: { border: 'none', color: '#0e0e12', fontWeight: '800', fontSize: '0.78rem', borderRadius: '16px', padding: '0.45rem 0.85rem' },
  surface: { backgroundColor: 'rgba(18, 18, 22, 0.75)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '20px', boxShadow: '0 8px 30px rgba(0, 0, 0, 0.35)' },
  toolsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.8rem', marginBottom: '0.8rem' },
  duoActiveCard: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(20, 20, 28, 0.85)', border: '1px solid', borderRadius: '16px', padding: '0.75rem 1rem', marginTop: '0.8rem', backdropFilter: 'blur(14px)' },
  duoSmallBtn: { border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '10px', padding: '0.35rem 0.65rem', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer' },
  presetScrollContainer: { display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.4rem', scrollSnapType: 'x mandatory' },
  presetCard: { flex: '0 0 250px', backgroundColor: 'rgba(18, 18, 24, 0.88)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '18px', padding: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.45rem', scrollSnapAlign: 'start', backdropFilter: 'blur(12px)', cursor: 'pointer' },
  presetTag: { fontSize: '0.65rem', fontWeight: '800', color: '#34D399', backgroundColor: 'rgba(52, 211, 153, 0.12)', padding: '2px 6px', borderRadius: '6px' },
  presetName: { fontSize: '0.92rem', fontWeight: '800', color: '#fff', marginTop: '0.15rem' },
  presetDesc: { fontSize: '0.7rem', color: '#888', lineHeight: 1.3 },
  applySplitBtn: { border: '1px solid', borderRadius: '10px', padding: '0.35rem 0.65rem', fontSize: '0.72rem', fontWeight: '800', cursor: 'pointer' },
  routineList: { display: 'flex', flexDirection: 'column', gap: '0.9rem' },
  routineCard: { backgroundColor: 'rgba(18, 18, 22, 0.75)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '20px', boxShadow: '0 8px 30px rgba(0, 0, 0, 0.35)', padding: '1.15rem' },
  activeTag: { fontSize: '0.7rem', fontWeight: '700' },
  modalBackdrop: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' },
  modalContent: { width: '100%', maxWidth: '460px', backgroundColor: 'rgba(18, 18, 24, 0.98)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '22px', padding: '1.3rem', boxShadow: '0 20px 50px rgba(0,0,0,0.8)', color: '#fff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
  closeModalBtn: { background: 'none', border: 'none', color: '#888', fontSize: '1.2rem', cursor: 'pointer', padding: 0 },
};