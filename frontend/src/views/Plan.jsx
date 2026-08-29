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
import PlanWizard from '../components/PlanWizard.jsx';
import WorkoutBuddyModal from '../components/WorkoutBuddyModal.jsx';
import Icon from '../components/Icon.jsx';
import { Button } from '../components/ui.jsx';
import { glyphOf, DEFAULT_GLYPH } from '../lib/glyphs.js';

export default function Plan({ rankWeeks = null } = {}) {
  const nav = useNavigate();
  const location = useLocation();
  const S = useStore((s) => s.S);
  const update = useStore((s) => s.update);
  const rank = getStreakRank(rankWeeks ?? streakWeeks(S));

  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isDuoModalOpen, setIsDuoModalOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState('');
  const fileInputRef = useRef(null);

  // Auto-detect incoming Forge Duo token from URL query params
  useEffect(() => {
    const searchStr = location.search || (window.location.hash.includes('?') ? window.location.hash.split('?')[1] : '');
    const params = new URLSearchParams(searchStr);
    const token = params.get('buddyToken');

    if (token) {
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
    update((s) => {
      if (!s.customEx) s.customEx = [];
      if (!s.exercises) s.exercises = [];

      // Merge custom exercises if present
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

  const addRoutine = () => {
    const r = { id: uid(), name: t('New routine'), emoji: DEFAULT_GLYPH, ex: [] };
    update((s) => {
      s.routines.push(r);
    });
    nav('/plan/r/' + r.id);
  };

  // Handler for PlanWizard completion
  const handleWizardGenerate = (wizardData) => {
    const { routines, newCustomExercises, updatedWeek, updatedCfg } = generatePlanFromWizard(wizardData, S);

    update((s) => {
      if (!s.customEx) s.customEx = [];
      if (!s.exercises) s.exercises = [];
      if (!s.routines) s.routines = [];
      if (!s.cfg) s.cfg = {};

      const existingCustomIds = new Set(s.customEx.map((x) => x.id));
      const uniqueCustom = newCustomExercises.filter((x) => !existingCustomIds.has(x.id));

      s.customEx = [...s.customEx, ...uniqueCustom];
      s.exercises = [...s.exercises, ...uniqueCustom];
      s.routines = routines;
      s.week = updatedWeek;
      s.cfg = { ...s.cfg, ...updatedCfg };
    });

    setImportMsg(`⚔️ Custom plan generated with ${routines.length} routines!`);
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
        const parsed = parseWorkoutTextToRoutines(extractedText, S.exercises || []);
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

  return (
    <>
      <div className="hdr" style={planStyles.header}>
        <div>
          <div style={{ ...planStyles.eyebrow, color: rank.badgeColor }}>{t('Discipline & routines')}</div>
          <h1 style={planStyles.viewTitle}>{t('Training plan')}</h1>
          <div className="sub">{t('Your weekly routine')} · {rank.fullTitle}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ ...planStyles.rankPill, color: rank.badgeColor, borderColor: rank.badgeColor, boxShadow: `0 0 12px ${rank.glowColor}` }}>
            LVL {rank.level} · {rank.kanji}
          </div>
          <button className="iconbtn" onClick={planToolsSheet} aria-label={t('Share your plan')} title={t('Share your plan')}>
            <Icon name="upload" />
          </button>
        </div>
      </div>

      {/* ACTIVE FORGE DUO NOTIFICATION BAR */}
      {S.buddy && (
        <div style={{ ...planStyles.duoActiveCard, borderColor: rank.badgeColor }}>
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
              color: rank.badgeColor,
            }}
          >
            Manage Link
          </button>
        </div>
      )}

      {/* 🧙‍♂️ CREATE A PLAN WIZARD BANNER */}
      <div style={{ ...planStyles.surface, padding: '1.2rem', marginTop: '1rem', borderLeft: `4px solid ${rank.badgeColor}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: '800', fontSize: '1rem' }}>Create Custom Plan</div>
            <div style={{ fontSize: '0.75rem', color: '#aaa', marginTop: '0.2rem' }}>
              Step-by-step wizard: weeks, rotation, body parts & sets/reps
            </div>
          </div>
          <Button
            variant="primary"
            onClick={() => setIsWizardOpen(true)}
            style={{ backgroundColor: rank.badgeColor, color: '#0e0e12', fontWeight: '800', fontSize: '0.78rem' }}
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
            <span style={{ fontSize: '0.75rem', fontWeight: '800', color: rank.badgeColor }}>
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
        <div style={{ margin: '0.4rem 0 0.8rem', fontSize: '0.78rem', color: rank.badgeColor, fontWeight: '700' }}>
          {importMsg}
        </div>
      )}

      <div className="cols">
        <div>
          <h4 className="sec">{t('Week schedule')}</h4>
          <div className="list" style={{ ...planStyles.surface, display: 'flex', flexDirection: 'column' }}>
            {[1, 2, 3, 4, 5, 6, 0].map((d) => {
              const r = S.routines.find((x) => x.id === S.week[d]);
              return (
                <div key={d} className="item" style={{ borderLeft: `3px solid ${rank.badgeColor}` }} onClick={() => dayAssignSheet(d)}>
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
            <Button size="sm" variant="tinted" icon="plus" onClick={addRoutine} style={{ ...planStyles.newRoutineBtn, backgroundColor: rank.badgeColor }}>
              {t('Routine')}
            </Button>
          </div>
          {S.routines.length ? (
            <div className="list" style={planStyles.routineList}>
              {S.routines.map((r) => (
                <div key={r.id} className="item" style={{ ...planStyles.routineCard, borderLeft: `4px solid ${rank.badgeColor}` }} onClick={() => nav('/plan/r/' + r.id)}>
                  <span className="lrow-i"><Icon name={glyphOf(r.emoji)} /></span>
                  <div className="grow">
                    <div className="row space-between">
                      <div className="tt">{r.name}</div>
                      <span style={{ ...planStyles.activeTag, color: rank.badgeColor }}>{t('Active')}</span>
                    </div>
                    <div className="ss">{exCount(r.ex.length)}</div>
                  </div>
                  <Icon name="chevronRight" className="chev" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="empty">
                <div className="ico"><Icon name="clipboard" /></div>
                {t('No routines yet.')}<br />{t('Use the wizard above or load the starter plan.')}
              </div>
              <Button icon="sparkles" onClick={loadStarterPlan}>{t('Load starter plan (Push / Pull / Legs)')}</Button>
            </>
          )}
        </div>
      </div>

      {/* Plan Wizard Modal */}
      <PlanWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onGenerate={handleWizardGenerate}
        badgeColor={rank.badgeColor}
      />

      {/* Forge Duo Modal */}
      <WorkoutBuddyModal
        isOpen={isDuoModalOpen}
        onClose={() => setIsDuoModalOpen(false)}
        S={S}
        badgeColor={rank.badgeColor}
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
  routineList: { display: 'flex', flexDirection: 'column', gap: '0.9rem' },
  routineCard: { backgroundColor: 'rgba(18, 18, 22, 0.75)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '20px', boxShadow: '0 8px 30px rgba(0, 0, 0, 0.35)', padding: '1.15rem' },
  activeTag: { fontSize: '0.7rem', fontWeight: '700' },
};