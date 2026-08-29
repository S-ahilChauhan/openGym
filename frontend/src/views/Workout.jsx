// frontend/src/views/Workout.jsx
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore.js'
import { useUI } from '../store/useUI.js'
import { exOr, EXDB } from '../lib/exercises.js'
import {
  effectiveRoutine,
  lastEntryFor,
  bestWeightFor,
  setsDoneActive,
  supersetUnits,
  unitOf,
  setLabel,
  modeOf,
  isBw,
  isPerSide,
  sideReps,
  repStep,
} from '../lib/history.js'
import { fmtNum, fmtDate, todayISO, exCount, DAYN } from '../lib/format.js'
import { beep, vibrate } from '../lib/sound.js'
import { t } from '../lib/i18n.js'
import Media from '../components/Media.jsx'
import {
  startFlow,
  exerciseDetailSheet,
  topWeightSheet,
  finishWorkout,
  workoutCompleteSheet,
  confirmSheet,
} from '../sheets.jsx'
import Icon from '../components/Icon.jsx'
import { Button, Check } from '../components/ui.jsx'
import { glyphOf } from '../lib/glyphs.js'

// Robust fallback exercise definitions
const FALLBACK_EX_CATALOG = [
  { id: '0001', n: 'Barbell Bench Press', bp: 'Chest', tg: 'Pectorals', eq: 'barbell' },
  { id: '0005', n: 'Incline Dumbbell Press', bp: 'Chest', tg: 'Upper Chest', eq: 'dumbbell' },
  { id: '0007', n: 'Dumbbell Chest Flys', bp: 'Chest', tg: 'Inner Chest', eq: 'dumbbell' },
  { id: '0100', n: 'Pull-ups', bp: 'Back', tg: 'Lats', eq: 'bodyweight' },
  { id: '0102', n: 'Lat Pulldown (Wide Grip)', bp: 'Back', tg: 'Lats', eq: 'cable' },
  { id: '0106', n: 'Barbell Bent Over Row', bp: 'Back', tg: 'Upper Back', eq: 'barbell' },
  { id: '0108', n: 'T-Bar Row', bp: 'Back', tg: 'Mid Back', eq: 'barbell' },
  { id: '0112', n: 'Barbell Deadlift', bp: 'Back', tg: 'Lower Back & Glutes', eq: 'barbell' },
  { id: '0117', n: 'Barbell Shrugs', bp: 'Back', tg: 'Traps', eq: 'barbell' },
  { id: '0200', n: 'Overhead Barbell Press', bp: 'Shoulders', tg: 'Front Delts', eq: 'barbell' },
  { id: '0202', n: 'Arnold Press', bp: 'Shoulders', tg: 'All Delts', eq: 'dumbbell' },
  { id: '0204', n: 'Dumbbell Lateral Raise', bp: 'Shoulders', tg: 'Side Delts', eq: 'dumbbell' },
  { id: '0300', n: 'Standing Barbell Curl', bp: 'Arms', tg: 'Biceps', eq: 'barbell' },
  { id: '0305', n: 'Dumbbell Hammer Curls', bp: 'Arms', tg: 'Biceps & Brachialis', eq: 'dumbbell' },
  { id: '0350', n: 'Triceps Rope Pushdown', bp: 'Arms', tg: 'Triceps Lateral', eq: 'cable' },
  { id: '0355', n: 'Skull Crushers', bp: 'Arms', tg: 'Triceps Long Head', eq: 'barbell' },
  { id: '0500', n: 'Barbell Back Squat', bp: 'Legs', tg: 'Quads & Glutes', eq: 'barbell' },
  { id: '0503', n: 'Leg Press (45 Degree)', bp: 'Legs', tg: 'Quads', eq: 'machine' },
  { id: '0507', n: 'Bulgarian Split Squats', bp: 'Legs', tg: 'Quads & Glutes', eq: 'dumbbell' },
  { id: '0550', n: 'Lying Leg Curl Machine', bp: 'Legs', tg: 'Hamstrings', eq: 'machine' },
  { id: '0552', n: 'Romanian Deadlift (Barbell)', bp: 'Legs', tg: 'Hamstrings', eq: 'barbell' },
  { id: '0560', n: 'Standing Calf Raise', bp: 'Legs', tg: 'Calves', eq: 'machine' },
  { id: '0600', n: 'Floor Crunches', bp: 'Core', tg: 'Upper Abs', eq: 'bodyweight' },
  { id: '0602', n: 'Hanging Leg Raises', bp: 'Core', tg: 'Lower Abs', eq: 'bodyweight' },
  { id: '0604', n: 'Lying Leg Raises', bp: 'Core', tg: 'Lower Abs', eq: 'bodyweight' },
  { id: '0605', n: 'Standard Plank', bp: 'Core', tg: 'Core Stabilizers', eq: 'bodyweight' },
]

function getExerciseDetails(exId, S) {
  const rawId = String(exId || '').trim()
  const numId = Number(rawId)
  const paddedId = !isNaN(numId) ? String(numId).padStart(4, '0') : rawId

  // 1. Direct helper lookup
  if (typeof exOr === 'function') {
    const res = exOr(rawId, S)
    if (res && res.n && res.n !== 'Exercise' && !res.n.startsWith('Exercise #')) return res
  }

  // 2. Catalog check
  const catalog = Array.isArray(EXDB) && EXDB.length > 0 ? EXDB : FALLBACK_EX_CATALOG
  const found = catalog.find((x) => String(x.id) === rawId || String(x.id) === paddedId)
  if (found) return found

  // 3. Fallback name derivation
  if (rawId.startsWith('custom_') || rawId.startsWith('ex_')) {
    const n = rawId.replace(/^(custom_|ex_)/, '').split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    return { id: rawId, n, bp: 'Custom', tg: 'Custom' }
  }

  return { id: rawId, n: isNaN(numId) && rawId ? rawId : `Exercise #${rawId || '1'}`, bp: 'General', tg: '' }
}

/* ---------- Start Chooser View ---------- */
function StartChooser() {
  const nav = useNavigate()
  const S = useStore((s) => s.S) || {}
  const todayR = typeof effectiveRoutine === 'function' ? effectiveRoutine(S, todayISO()) : null
  const todayOvr = S?.dayPlan?.[todayISO()] !== undefined
  const routinesList = Array.isArray(S?.routines) ? S.routines : []
  const others = routinesList.filter((r) => r !== todayR)

  return (
    <div className="narrow" style={{ padding: '1rem 0' }}>
      <div className="hdr" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '1rem', marginBottom: '1.2rem' }}>
        <div>
          <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#34D399', letterSpacing: '1px' }}>ACTIVE SESSION</span>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800', margin: '0.2rem 0' }}>{t('Start workout')}</h1>
          <div className="sub" style={{ color: '#888' }}>
            {t(DAYN[new Date().getDay()])} — {todayR ? t('today is {0}', todayR.name) : t('Rest day schedule')}
          </div>
        </div>
      </div>

      {todayR && (
        <div style={workoutStyles.heroCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.8rem' }}>
            <span style={workoutStyles.accentBadge}>
              ⚡ {t("Today's routine")}{todayOvr ? ' · Rescheduled' : ''}
            </span>
            <span style={{ fontSize: '1.8rem' }}>{glyphOf(todayR.emoji) ? <Icon name={glyphOf(todayR.emoji)} /> : '🏋️'}</span>
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#fff' }}>{todayR.name}</div>
          <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '2px', marginBottom: '1.2rem' }}>
            {exCount(todayR.ex?.length || 0)} exercises planned
          </div>
          <Button variant="primary" icon="play" onClick={() => startFlow(todayR.id)} style={workoutStyles.startPrimaryBtn}>
            {t('Start {0}', todayR.name)}
          </Button>
        </div>
      )}

      {others.length > 0 && (
        <div style={{ marginTop: '1.5rem' }}>
          <h4 style={workoutStyles.sectionTitle}>{t('Other routines')}</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {others.map((r) => (
              <div key={r.id} style={workoutStyles.routineItem} onClick={() => startFlow(r.id)}>
                <span style={workoutStyles.routineIcon}>
                  <Icon name={glyphOf(r.emoji)} />
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '700', fontSize: '0.92rem', color: '#fff' }}>{r.name}</div>
                  <div style={{ fontSize: '0.72rem', color: '#777' }}>{exCount(r.ex?.length || 0)}</div>
                </div>
                <span style={workoutStyles.quickStartTag}>{t('Start')} →</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: '1.2rem' }}>
        <button type="button" onClick={() => startFlow(null)} style={workoutStyles.freestyleBtn}>
          <Icon name="shuffle" />
          <span>{t('Freestyle workout (pick as you go)')}</span>
        </button>
      </div>

      {!routinesList.length && (
        <div style={{ marginTop: '1rem' }}>
          <Button variant="primary" onClick={() => nav('/plan')} style={{ width: '100%' }}>
            {t('Build a plan first')}
          </Button>
        </div>
      )}
    </div>
  )
}

/* ---------- Elapsed Clock ---------- */
function Elapsed({ start }) {
  const [tStr, setTStr] = useState('0:00')
  useEffect(() => {
    const tick = () => {
      const s = Math.floor((Date.now() - (start || Date.now())) / 1000)
      setTStr(Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'))
    }
    tick()
    const iv = setInterval(tick, 1000)
    return () => clearInterval(iv)
  }, [start])
  return <span>{tStr}</span>
}

/* ---------- Exercise Block ---------- */
function ExerciseBlock({ entryIdx, compact, onToggle, onField, onAddSet, onRemoveSet }) {
  const S = useStore((s) => s.S) || {}
  const entry = S?.active?.entries?.[entryIdx]
  if (!entry) return null

  const ex = getExerciseDetails(entry.id, S)
  const mode = typeof modeOf === 'function' ? modeOf({ ...(entry.target || {}), id: entry.id }) : 'reps'
  const cardio = mode === 'cardio'
  const timed = mode === 'time'
  const last = typeof lastEntryFor === 'function' ? lastEntryFor(S, entry.id) : null
  const best = cardio ? 0 : Math.max(typeof bestWeightFor === 'function' ? bestWeightFor(S, entry.id) : 0, (S?.exWeights?.[entry.id] || {}).w || 0)

  const cfg = { ...(entry.target || {}), id: entry.id }
  const bw = !cardio && typeof isBw === 'function' && isBw(cfg)
  const repStepVal = typeof repStep === 'function' ? repStep(cfg) : 1

  const bump = (s, i, field, step, dir) => {
    const currentVal = Number(s[field] || 0)
    const nextVal = Math.max(0, Math.round((currentVal + dir * step) * 100) / 100)
    onField(i, field, nextVal)
  }

  const setsList = Array.isArray(entry.sets) ? entry.sets : []

  return (
    <div>
      {/* Exercise Visual / GIF Player */}
      <Media ex={ex} key={entry.id} compact={compact} minimizable />

      {/* Exercise Title Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.4rem', marginBottom: '0.6rem' }}>
        <div>
          <h2 style={{ fontSize: compact ? '1.3rem' : '1.55rem', fontWeight: '800', margin: 0, color: '#ffffff', letterSpacing: '-0.3px' }}>
            {ex.n}
          </h2>
          <div style={{ display: 'flex', gap: '6px', marginTop: '5px', flexWrap: 'wrap' }}>
            {ex.bp && <span style={workoutStyles.metaBadge}>{ex.bp}</span>}
            {ex.tg && <span style={workoutStyles.metaAccentBadge}>🎯 {ex.tg}</span>}
            {ex.eq && <span style={workoutStyles.metaBadge}>⚙️ {ex.eq}</span>}
            {best > 0 && <span style={workoutStyles.metaBadge}>🏆 Best: {fmtNum(best)} {S.unit || 'kg'}</span>}
          </div>
        </div>
        <button
          type="button"
          onClick={() => exerciseDetailSheet(ex)}
          style={workoutStyles.infoBtn}
          title="Exercise details & history"
        >
          <Icon name="info" />
        </button>
      </div>

      {last && (
        <div style={{ fontSize: '0.72rem', color: '#777', marginBottom: '0.75rem' }}>
          {t('Last time')} ({fmtDate(last.d)}): {Array.isArray(last.sets) ? last.sets.map((s) => setLabel(entry.id, s, last.target)).join(', ') : ''}
        </div>
      )}

      {/* Sets Tracker Glassmorphism Card */}
      <div style={workoutStyles.setCard}>
        {/* Table Column Headers */}
        <div style={workoutStyles.setCardHeader}>
          <span style={{ width: '28px', textAlign: 'center' }}>SET</span>
          <span style={{ flex: 1, textAlign: 'center' }}>
            {cardio ? 'DURATION (MIN)' : timed ? 'SECONDS' : bw ? 'ADDED WEIGHT' : `WEIGHT (${S.unit || 'KG'})`}
          </span>
          <span style={{ flex: 1, textAlign: 'center' }}>
            {cardio ? 'SPEED (KM/H)' : 'REPS'}
          </span>
          <span style={{ width: '42px', textAlign: 'center' }}>DONE</span>
        </div>

        {/* Set Rows with Dark Aesthetic Steppers */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {setsList.map((s, i) => (
            <div
              key={i}
              style={{
                ...workoutStyles.setRow,
                backgroundColor: s.done ? 'rgba(52, 211, 153, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                borderColor: s.done ? 'rgba(52, 211, 153, 0.45)' : 'rgba(255, 255, 255, 0.08)',
              }}
            >
              <div style={workoutStyles.setIndexBadge}>{i + 1}</div>

              {/* Weight / Duration Stepper */}
              <div style={workoutStyles.stepperBox}>
                <button
                  type="button"
                  style={workoutStyles.stepBtn}
                  onClick={() => bump(s, i, cardio ? 'min' : timed ? 'sec' : 'w', cardio ? 1 : timed ? 5 : 2.5, -1)}
                >
                  <Icon name="minus" />
                </button>
                <div style={workoutStyles.inputWrap}>
                  <input
                    type="number"
                    step="any"
                    value={cardio ? (s.min ?? '') : timed ? (s.sec ?? '') : (s.w ?? '')}
                    placeholder="0"
                    onChange={(e) => onField(i, cardio ? 'min' : timed ? 'sec' : 'w', e.target.value === '' ? 0 : Number(e.target.value))}
                    style={workoutStyles.nativeDarkInput}
                  />
                </div>
                <button
                  type="button"
                  style={workoutStyles.stepBtn}
                  onClick={() => bump(s, i, cardio ? 'min' : timed ? 'sec' : 'w', cardio ? 1 : timed ? 5 : 2.5, 1)}
                >
                  <Icon name="plus" />
                </button>
              </div>

              {/* Reps / Speed Stepper */}
              <div style={workoutStyles.stepperBox}>
                <button
                  type="button"
                  style={workoutStyles.stepBtn}
                  onClick={() => bump(s, i, cardio ? 'speed' : 'r', cardio ? 0.5 : repStepVal, -1)}
                >
                  <Icon name="minus" />
                </button>
                <div style={workoutStyles.inputWrap}>
                  <input
                    type="number"
                    step="any"
                    value={cardio ? (s.speed ?? '') : (s.r ?? 10)}
                    placeholder="10"
                    onChange={(e) => onField(i, cardio ? 'speed' : 'r', e.target.value === '' ? 0 : Number(e.target.value))}
                    style={workoutStyles.nativeDarkInput}
                  />
                </div>
                <button
                  type="button"
                  style={workoutStyles.stepBtn}
                  onClick={() => bump(s, i, cardio ? 'speed' : 'r', cardio ? 0.5 : repStepVal, 1)}
                >
                  <Icon name="plus" />
                </button>
              </div>

              {/* Checkbox Trigger */}
              <div style={{ width: '42px', display: 'flex', justifyContent: 'center' }}>
                <Check checked={!!s.done} onChange={() => onToggle(i)} />
              </div>
            </div>
          ))}
        </div>

        {/* Set Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            type="button"
            disabled={setsList.length <= 1}
            onClick={onRemoveSet}
            style={{ ...workoutStyles.secondaryBtn, opacity: setsList.length <= 1 ? 0.35 : 1 }}
          >
            <Icon name="minus" /> Remove Set
          </button>
          <button type="button" onClick={onAddSet} style={workoutStyles.secondaryBtn}>
            <Icon name="plus" /> Add Set
          </button>
        </div>
      </div>
    </div>
  )
}

/* ---------- Active Workout Screen Container ---------- */
function ActiveWorkout() {
  const nav = useNavigate()
  const S = useStore((s) => s.S) || {}
  const update = useStore((s) => s.update)
  const { startRest, stopRest } = useUI()
  const A = S?.active || { entries: [], cur: 0, name: 'Workout', start: Date.now() }

  // Ensure all routine entries load with pre-populated sets & reps (default 3 sets x 10 reps)
  useEffect(() => {
    if (A?.entries && A.entries.length > 0) {
      let modified = false
      const updatedEntries = A.entries.map((entry) => {
        if (!entry.sets || entry.sets.length === 0) {
          modified = true
          const cfg = S?.cfg?.[entry.id] || {}
          const targetSets = cfg.sets || 3
          const targetReps = cfg.reps || 10
          const defaultWeight = cfg.weight || 0

          const generatedSets = []
          for (let i = 0; i < targetSets; i++) {
            generatedSets.push({ w: defaultWeight, r: targetReps, done: false })
          }
          return { ...entry, sets: generatedSets }
        }
        return entry
      })

      if (modified) {
        update((s) => {
          if (s?.active) s.active.entries = updatedEntries
        })
      }
    }
  }, [])

  const entriesList = Array.isArray(A.entries) ? A.entries : []
  const units = typeof supersetUnits === 'function' ? supersetUnits(entriesList) : entriesList.map((_, i) => [i])
  const cur = Math.min(A.cur || 0, Math.max(0, entriesList.length - 1))
  const unit = entriesList.length && typeof unitOf === 'function' ? unitOf(units, cur) : []
  const unitIdx = units.findIndex((u) => u === unit)

  const total = entriesList.reduce((n, e) => n + (e.sets?.length || 0), 0)
  const done = typeof setsDoneActive === 'function' ? setsDoneActive(A) : 0
  const progressPercent = total > 0 ? (done / total) * 100 : 0

  const mutEntry = (idx, fn) =>
    update((s) => {
      if (s?.active?.entries?.[idx]) fn(s.active.entries[idx])
    }, true)

  const setField = (idx, i, field, v) =>
    mutEntry(idx, (e) => {
      if (!e.sets?.[i]) return
      if (v == null) delete e.sets[i][field]
      else e.sets[i][field] = v
    })

  const addSet = (idx) =>
    mutEntry(idx, (e) => {
      if (!e.sets) e.sets = []
      const l = e.sets[e.sets.length - 1]
      e.sets.push({
        w: l ? l.w : 0,
        r: l ? l.r : 10,
        done: false,
      })
    })

  const removeSet = (idx) =>
    mutEntry(idx, (e) => {
      if (e.sets?.length > 1) e.sets.pop()
    })

  const toggle = (idx, i) => {
    let askTop = false
    let workoutDone = false

    mutEntry(idx, (e) => {
      if (!e.sets?.[i]) return
      e.sets[i].done = !e.sets[i].done
      if (e.sets[i].done) {
        beep(S?.sound, 1040, 0.12)
        vibrate(30)
        const isLastExInUnit = idx === unit[unit.length - 1]
        const unitDone = unit.every((ui) => (ui === idx ? e : A.entries[ui])?.sets?.every((x) => x.done))
        if (isLastExInUnit && !unitDone) startRest(S?.restSec || 90)
        else if (unitDone) stopRest()
        if (unitDone && unitIdx >= units.length - 1) workoutDone = true

        if (e.sets.every((x) => x.done) && !e.asked) {
          e.asked = true
          askTop = true
        }
      }
    })

    if (askTop) topWeightSheet(idx)
    else if (workoutDone) workoutCompleteSheet()
  }

  return (
    <div className="narrow" style={workoutStyles.workoutContainerShield}>
      {/* Active Workout Top Header */}
      <div style={workoutStyles.activeHeader}>
        <button
          type="button"
          style={workoutStyles.headerIconBtn}
          aria-label={t('Discard')}
          onClick={() =>
            confirmSheet({
              title: t('Discard workout?'),
              message: t('The sets you logged in this session will be lost.'),
              confirmText: t('Discard'),
              danger: true,
              onConfirm: () => {
                update((s) => {
                  s.active = null
                })
                stopRest()
                nav('/home')
              },
            })
          }
        >
          <Icon name="xmark" />
        </button>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: '800', fontSize: '1.05rem', color: '#fff' }}>{A.name}</div>
          <div style={{ fontSize: '0.75rem', color: '#34D399', fontWeight: '800', marginTop: '2px' }}>
            ⏱️ <Elapsed start={A.start} /> · {done}/{total} Sets Logged
          </div>
        </div>

        <button
          type="button"
          style={{ ...workoutStyles.headerIconBtn, color: '#34D399', borderColor: 'rgba(52, 211, 153, 0.35)' }}
          aria-label={t('Finish')}
          onClick={finishWorkout}
        >
          <Icon name="check" />
        </button>
      </div>

      {/* Glowing Progress Bar */}
      <div style={workoutStyles.progressBarOuter}>
        <div style={{ ...workoutStyles.progressBarInner, width: `${progressPercent}%` }} />
      </div>

      {/* Step Indicator */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '1rem 0 0.5rem' }}>
        <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#777', letterSpacing: '0.8px' }}>
          EXERCISE {cur + 1} OF {entriesList.length}
        </span>
        <span style={{ fontSize: '0.72rem', color: '#34D399', fontWeight: '800' }}>
          {Math.round(progressPercent)}% COMPLETE
        </span>
      </div>

      {/* Active Exercise Block */}
      {entriesList.length > 0 && (
        <ExerciseBlock
          entryIdx={cur}
          onToggle={(i) => toggle(cur, i)}
          onField={(i, f, v) => setField(cur, i, f, v)}
          onAddSet={() => addSet(cur)}
          onRemoveSet={() => removeSet(cur)}
        />
      )}

      {/* Floating Bottom Controller (Comfortably elevated above bottom tabs) */}
      <div style={workoutStyles.floatingFooterBar}>
        <button
          type="button"
          disabled={cur <= 0}
          onClick={() => update((s) => { s.active.cur = cur - 1 })}
          style={{ ...workoutStyles.navBtn, opacity: cur <= 0 ? 0.3 : 1 }}
        >
          ← Prev
        </button>

        <button
          type="button"
          onClick={finishWorkout}
          style={workoutStyles.finishFooterBtn}
        >
          Finish Workout 🏁
        </button>

        <button
          type="button"
          disabled={cur >= entriesList.length - 1}
          onClick={() => update((s) => { s.active.cur = cur + 1 })}
          style={{ ...workoutStyles.navBtn, opacity: cur >= entriesList.length - 1 ? 0.3 : 1 }}
        >
          Next →
        </button>
      </div>
    </div>
  )
}

export default function Workout() {
  const active = useStore((s) => s?.S?.active)
  return active ? <ActiveWorkout /> : <StartChooser />
}

const workoutStyles = {
  workoutContainerShield: {
    paddingBottom: '120px',
    backgroundColor: 'rgba(10, 10, 14, 0.7)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderRadius: '24px',
    padding: '0.8rem',
  },
  heroCard: {
    backgroundColor: 'rgba(20, 20, 26, 0.95)',
    border: '1px solid rgba(52, 211, 153, 0.3)',
    borderRadius: '24px',
    padding: '1.4rem',
    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
    backdropFilter: 'blur(16px)',
  },
  accentBadge: {
    fontSize: '0.72rem',
    fontWeight: '800',
    color: '#34D399',
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    padding: '4px 8px',
    borderRadius: '8px',
  },
  startPrimaryBtn: {
    width: '100%',
    padding: '0.85rem',
    borderRadius: '14px',
    fontWeight: '800',
    backgroundColor: '#34D399',
    color: '#000',
    fontSize: '0.9rem',
  },
  sectionTitle: {
    fontSize: '0.75rem',
    fontWeight: '800',
    color: '#888',
    letterSpacing: '0.8px',
    textTransform: 'uppercase',
    marginBottom: '0.6rem',
  },
  routineItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '16px',
    padding: '0.75rem 1rem',
    cursor: 'pointer',
  },
  routineIcon: {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.2rem',
  },
  quickStartTag: {
    fontSize: '0.75rem',
    fontWeight: '800',
    color: '#34D399',
  },
  freestyleBtn: {
    width: '100%',
    padding: '0.8rem',
    borderRadius: '14px',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#aaa',
    fontSize: '0.82rem',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    cursor: 'pointer',
  },
  activeHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '0.4rem',
    paddingBottom: '0.8rem',
  },
  headerIconBtn: {
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  progressBarOuter: {
    width: '100%',
    height: '4px',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  progressBarInner: {
    height: '100%',
    backgroundColor: '#34D399',
    boxShadow: '0 0 12px rgba(52, 211, 153, 0.8)',
    transition: 'width 0.3s ease',
  },
  infoBtn: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    color: '#aaa',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  metaBadge: {
    fontSize: '0.68rem',
    fontWeight: '700',
    color: '#888',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    padding: '3px 8px',
    borderRadius: '6px',
    textTransform: 'capitalize',
  },
  metaAccentBadge: {
    fontSize: '0.68rem',
    fontWeight: '800',
    color: '#34D399',
    backgroundColor: 'rgba(52, 211, 153, 0.14)',
    padding: '3px 8px',
    borderRadius: '6px',
    textTransform: 'capitalize',
  },
  setCard: {
    backgroundColor: 'rgba(18, 18, 24, 0.95)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '22px',
    padding: '1.1rem',
    boxShadow: '0 16px 40px rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(20px)',
  },
  setCardHeader: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '0.65rem',
    fontWeight: '800',
    color: '#777',
    letterSpacing: '0.8px',
    paddingBottom: '0.6rem',
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
    marginBottom: '0.75rem',
  },
  setRow: {
    display: 'flex',
    alignItems: 'center',
    borderRadius: '14px',
    border: '1px solid',
    padding: '0.45rem 0.5rem',
    transition: 'all 0.2s ease',
  },
  setIndexBadge: {
    width: '28px',
    fontSize: '0.85rem',
    fontWeight: '800',
    color: '#777',
    textAlign: 'center',
  },
  stepperBox: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    margin: '0 4px',
    overflow: 'hidden',
  },
  stepBtn: {
    background: 'none',
    border: 'none',
    color: '#777',
    padding: '0.45rem 0.65rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  },
  inputWrap: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nativeDarkInput: {
    width: '100%',
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: '#ffffff',
    fontSize: '1rem',
    fontWeight: '800',
    textAlign: 'center',
    fontFamily: 'inherit',
  },
  secondaryBtn: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '10px',
    color: '#aaa',
    fontSize: '0.74rem',
    fontWeight: '700',
    padding: '0.45rem 0.8rem',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    cursor: 'pointer',
  },
  floatingFooterBar: {
    position: 'fixed',
    bottom: '78px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: 'calc(100% - 2rem)',
    maxWidth: '430px',
    backgroundColor: 'rgba(16, 16, 22, 0.96)',
    border: '1px solid rgba(255, 255, 255, 0.16)',
    borderRadius: '22px',
    padding: '0.55rem 0.65rem',
    display: 'flex',
    gap: '8px',
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.85)',
    backdropFilter: 'blur(24px)',
    zIndex: 90,
  },
  navBtn: {
    flex: 1,
    padding: '0.7rem 0.5rem',
    borderRadius: '14px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    color: '#fff',
    fontWeight: '800',
    fontSize: '0.8rem',
    cursor: 'pointer',
  },
  finishFooterBtn: {
    flex: 2,
    padding: '0.7rem 0.8rem',
    borderRadius: '14px',
    border: 'none',
    backgroundColor: '#34D399',
    color: '#000',
    fontWeight: '800',
    fontSize: '0.82rem',
    cursor: 'pointer',
  },
}