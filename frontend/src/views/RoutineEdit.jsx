// frontend/src/views/RoutineEdit.jsx
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore.js';
import { EXDB } from '../lib/exercises.js';

export default function RoutineEdit() {
  const { id } = useParams();
  const nav = useNavigate();
  const S = useStore((s) => s.S) || {};
  const update = useStore((s) => s.update);

  // Safe routine lookup
  const routinesList = Array.isArray(S?.routines) ? S.routines : [];
  const routine = routinesList.find((r) => String(r.id) === String(id));

  // Build a lookup map safely
  const dbMap = new Map((EXDB || []).map((x) => [String(x.id), x]));

  const getExerciseInfo = (exItem) => {
    const rawId = typeof exItem === 'object' ? String(exItem?.id || '') : String(exItem || '');
    
    // 1. Direct object properties if present
    if (typeof exItem === 'object' && (exItem.n || exItem.name)) {
      return {
        id: rawId,
        n: exItem.n || exItem.name,
        bp: exItem.bp || exItem.bodyPart || 'General',
        tg: exItem.tg || exItem.target || '',
      };
    }

    // 2. Check catalog database
    if (dbMap.has(rawId)) {
      const found = dbMap.get(rawId);
      return {
        id: rawId,
        n: found.n || found.name || rawId,
        bp: found.bp || 'General',
        tg: found.tg || '',
      };
    }

    // 3. Check custom exercises in state
    const customList = Array.isArray(S?.customEx) ? S.customEx : [];
    const customFound = customList.find((x) => String(x.id) === rawId);
    if (customFound) {
      return {
        id: rawId,
        n: customFound.n || customFound.name || rawId,
        bp: customFound.bp || 'General',
        tg: customFound.tg || '',
      };
    }

    // 4. Clean fallback text
    const cleanName = isNaN(Number(rawId))
      ? rawId.replace(/^custom_/, '').replace(/_/g, ' ')
      : `Exercise #${rawId}`;

    return {
      id: rawId,
      n: cleanName.charAt(0).toUpperCase() + cleanName.slice(1),
      bp: 'General',
      tg: '',
    };
  };

  const getExConfig = (exId) => {
    return S?.cfg?.[exId] || { sets: 3, reps: 10, weight: 0 };
  };

  const handleUpdateExConfig = (exId, field, val) => {
    if (typeof update !== 'function') return;
    update((s) => {
      if (!s.cfg) s.cfg = {};
      if (!s.cfg[exId]) s.cfg[exId] = { sets: 3, reps: 10, weight: 0 };
      s.cfg[exId][field] = Number(val) || 0;
    });
  };

  const handleRemoveExercise = (indexToRemove) => {
    if (typeof update !== 'function') return;
    update((s) => {
      const r = s.routines?.find((x) => String(x.id) === String(id));
      if (r && Array.isArray(r.ex)) {
        r.ex.splice(indexToRemove, 1);
      }
    });
  };

  if (!routine) {
    return (
      <div style={styles.container}>
        <div style={styles.emptyCard}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Routine Not Found</h2>
          <p style={{ color: '#888', fontSize: '0.82rem', marginBottom: '1.2rem' }}>
            ID: {id || 'None'}
          </p>
          <button
            type="button"
            onClick={() => nav('/plan')}
            style={styles.doneBtn}
          >
            ← Back to Plan
          </button>
        </div>
      </div>
    );
  }

  const exercises = Array.isArray(routine.ex) ? routine.ex : [];

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button type="button" onClick={() => nav('/plan')} style={styles.backBtn}>
          ← Back
        </button>
        <h1 style={styles.title}>{routine.name || 'Edit Routine'}</h1>
        <span style={{ fontSize: '1.4rem' }}>{routine.emoji || '⚡'}</span>
      </div>

      {/* Routine Exercises Header */}
      <div style={styles.sectionTitle}>
        EXERCISES IN THIS ROUTINE ({exercises.length})
      </div>

      {exercises.length > 0 ? (
        <div style={styles.list}>
          {exercises.map((exItem, idx) => {
            const exInfo = getExerciseInfo(exItem);
            const exId = exInfo.id;
            const cfg = getExConfig(exId);

            return (
              <div key={`${exId}_${idx}`} style={styles.exerciseCard}>
                <div style={styles.cardTop}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <span style={styles.indexBadge}>#{idx + 1}</span>
                    <div>
                      <div style={styles.exerciseName}>{exInfo.n}</div>
                      
                      {/* Body Part & Target Muscle Badges */}
                      <div style={styles.tagRow}>
                        {exInfo.bp && (
                          <span style={styles.bpBadge}>
                            {exInfo.bp}
                          </span>
                        )}
                        {exInfo.tg && (
                          <span style={styles.tgBadge}>
                            🎯 {exInfo.tg}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => handleRemoveExercise(idx)}
                    style={styles.deleteBtn}
                    title="Remove from routine"
                  >
                    ✕
                  </button>
                </div>

                {/* Sets, Reps & Target Weight */}
                <div style={styles.configRow}>
                  <div style={styles.configItem}>
                    <label style={styles.cfgLabel}>SETS</label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={cfg.sets ?? 3}
                      onChange={(e) => handleUpdateExConfig(exId, 'sets', e.target.value)}
                      style={styles.cfgInput}
                    />
                  </div>
                  <div style={styles.configItem}>
                    <label style={styles.cfgLabel}>REPS</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={cfg.reps ?? 10}
                      onChange={(e) => handleUpdateExConfig(exId, 'reps', e.target.value)}
                      style={styles.cfgInput}
                    />
                  </div>
                  <div style={styles.configItem}>
                    <label style={styles.cfgLabel}>TARGET (KG)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={cfg.weight || ''}
                      placeholder="0"
                      onChange={(e) => handleUpdateExConfig(exId, 'weight', e.target.value)}
                      style={styles.cfgInput}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={styles.emptyCard}>
          <p style={{ color: '#888', margin: '0 0 1rem' }}>No exercises in this routine yet.</p>
          <button
            type="button"
            onClick={() => nav(`/library?routineId=${routine.id}`)}
            style={styles.addMoreBtn}
          >
            + Add Exercises from Library
          </button>
        </div>
      )}

      {/* Action Footer */}
      <div style={{ marginTop: '1.2rem', display: 'flex', gap: '0.8rem' }}>
        <button
          type="button"
          onClick={() => nav(`/library?routineId=${routine.id}`)}
          style={styles.addMoreBtn}
        >
          + Add More Exercises
        </button>
        <button
          type="button"
          onClick={() => nav('/plan')}
          style={styles.doneBtn}
        >
          Save & Return ⚔️
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '2rem 1.2rem 6rem',
    maxWidth: '500px',
    margin: '0 auto',
    color: '#fff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '1.2rem',
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: '#aaa',
    fontSize: '0.85rem',
    cursor: 'pointer',
    padding: '0.3rem 0',
  },
  title: {
    fontSize: '1.4rem',
    fontWeight: '800',
    margin: 0,
  },
  sectionTitle: {
    fontSize: '0.7rem',
    fontWeight: '800',
    color: '#888',
    letterSpacing: '0.8px',
    marginBottom: '0.8rem',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  exerciseCard: {
    backgroundColor: 'rgba(20, 20, 26, 0.88)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '16px',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.85rem',
  },
  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  indexBadge: {
    fontSize: '0.68rem',
    fontWeight: '800',
    color: '#888',
    backgroundColor: 'rgba(255,255,255,0.06)',
    padding: '0.2rem 0.45rem',
    borderRadius: '8px',
    marginTop: '2px',
  },
  exerciseName: {
    fontSize: '0.98rem',
    fontWeight: '700',
    color: '#fff',
    lineHeight: 1.3,
  },
  tagRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    marginTop: '4px',
  },
  bpBadge: {
    fontSize: '0.65rem',
    fontWeight: '700',
    color: '#34D399',
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    padding: '2px 7px',
    borderRadius: '6px',
    textTransform: 'capitalize',
  },
  tgBadge: {
    fontSize: '0.65rem',
    fontWeight: '600',
    color: '#93C5FD',
    backgroundColor: 'rgba(147, 197, 253, 0.12)',
    padding: '2px 7px',
    borderRadius: '6px',
    textTransform: 'capitalize',
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    color: '#666',
    fontSize: '1rem',
    cursor: 'pointer',
    padding: '0.2rem',
  },
  configRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '0.6rem',
    backgroundColor: 'rgba(0,0,0,0.35)',
    padding: '0.6rem',
    borderRadius: '12px',
  },
  configItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    alignItems: 'center',
  },
  cfgLabel: {
    fontSize: '0.62rem',
    fontWeight: '800',
    color: '#888',
    letterSpacing: '0.5px',
  },
  cfgInput: {
    width: '100%',
    maxWidth: '70px',
    textAlign: 'center',
    padding: '0.35rem 0.4rem',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '0.85rem',
    fontWeight: '700',
    outline: 'none',
  },
  emptyCard: {
    padding: '2.5rem 1rem',
    backgroundColor: 'rgba(20, 20, 26, 0.6)',
    borderRadius: '16px',
    border: '1px dashed rgba(255,255,255,0.15)',
    textAlign: 'center',
  },
  addMoreBtn: {
    flex: 1,
    padding: '0.8rem',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '14px',
    color: '#fff',
    fontWeight: '700',
    fontSize: '0.82rem',
    cursor: 'pointer',
  },
  doneBtn: {
    flex: 1,
    padding: '0.8rem',
    backgroundColor: '#34D399',
    border: 'none',
    borderRadius: '14px',
    color: '#000',
    fontWeight: '800',
    fontSize: '0.82rem',
    cursor: 'pointer',
  },
};