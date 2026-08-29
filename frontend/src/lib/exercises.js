// frontend/src/lib/exercises.js
import { EXDB } from './exercises-data.js'
import { t } from './i18n.js'

export { EXDB }

// Map for fast lookup by multiple ID variations
export const EXIDX = {}
EXDB.forEach((e) => {
  // Map exact ID
  EXIDX[String(e.id)] = e;
  // Map numerical ID if numeric
  const numId = Number(e.id);
  if (!isNaN(numId)) {
    EXIDX[String(numId)] = e;
    EXIDX[String(numId).padStart(4, '0')] = e;
  }
  // Map lowercase exercise name as secondary index key
  if (e.n) {
    EXIDX[e.n.toLowerCase().trim()] = e;
  }
})

export const BODYPARTS = [...new Set(EXDB.map((e) => e.bp))].sort()

export function equipmentOf(list) {
  const c = {}
  list.forEach((e) => {
    if (e.eq) c[e.eq] = (c[e.eq] || 0) + 1
  })
  return Object.keys(c).sort((a, b) => c[b] - c[a] || (a < b ? -1 : 1))
}

let customIds = []
export function registerCustom(list) {
  customIds.forEach((id) => delete EXIDX[id])
  customIds = (list || []).map((e) => e.id)
  ;(list || []).forEach((e) => {
    EXIDX[String(e.id)] = e
    if (e.n) EXIDX[e.n.toLowerCase().trim()] = e
  })
}

export const allExercises = (st) => [...(st?.customEx || []), ...EXDB]

const IMG_BASE = import.meta.env.VITE_IMG_BASE || 'img/'
const GIF_BASE = import.meta.env.VITE_GIF_BASE || 'gif/'
export const imgSrc = (ex) => (ex?.img ? IMG_BASE + ex.img : null)
export const gifSrc = (ex) => (ex?.gif ? GIF_BASE + ex.gif : null)

export const isCardio = (idOrEx) =>
  (typeof idOrEx === 'string' ? EXIDX[idOrEx] : idOrEx)?.bp === 'cardio'

export const isBodyweightEq = (idOrEx) =>
  (typeof idOrEx === 'string' ? EXIDX[idOrEx] : idOrEx)?.eq === 'body weight'

/**
 * Robust Exercise Resolver:
 * Matches "0001", "1", 1, "0100", custom slugs, or exact names
 */
export const exOr = (id, st = null) => {
  if (!id) return { id: '', n: 'Exercise', bp: 'General', tg: '', eq: '' }

  // If already an exercise object with name
  if (typeof id === 'object') {
    if (id.n) return id;
    if (id.name) return { ...id, n: id.name };
    id = id.id || '';
  }

  const strId = String(id).trim();
  const numId = Number(strId);
  const paddedId = !isNaN(numId) ? String(numId).padStart(4, '0') : strId;
  const strippedId = !isNaN(numId) ? String(numId) : strId;

  // 1. Direct Index Check (exact, padded, or stripped)
  if (EXIDX[strId]) return EXIDX[strId];
  if (EXIDX[paddedId]) return EXIDX[paddedId];
  if (EXIDX[strippedId]) return EXIDX[strippedId];

  // 2. Search EXDB list dynamically
  const foundInCatalog = EXDB.find(
    (e) =>
      String(e.id) === strId ||
      String(e.id) === paddedId ||
      String(e.id) === strippedId ||
      (e.n && e.n.toLowerCase() === strId.toLowerCase())
  );
  if (foundInCatalog) return foundInCatalog;

  // 3. Search Custom Exercises in Store
  if (st?.customEx && Array.isArray(st.customEx)) {
    const foundCustom = st.customEx.find(
      (e) =>
        String(e.id) === strId ||
        String(e.id) === paddedId ||
        String(e.id) === strippedId ||
        (e.n && e.n.toLowerCase() === strId.toLowerCase())
    );
    if (foundCustom) return foundCustom;
  }

  // 4. Format clean name from slug (e.g., 'custom_incline_dumbbell_press' -> 'Incline Dumbbell Press')
  if (strId.startsWith('custom_') || strId.startsWith('ex_')) {
    const cleanName = strId
      .replace(/^(ex_|custom_)/, '')
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    return {
      id: strId,
      n: cleanName,
      bp: 'General',
      tg: '',
      eq: 'other',
      sm: [],
      st: [],
    };
  }

  return {
    id: strId,
    n: !isNaN(numId) ? `Exercise #${strId}` : strId,
    bp: 'General',
    tg: '',
    eq: 'other',
    sm: [],
    st: [],
  };
};

export const exById = exOr;

export const MAJOR_MUSCLE_GROUPS = [
  { id: 'chest', label: 'Chest', icon: '🛡️', bodyPart: 'chest' },
  { id: 'back', label: 'Back', icon: '🦅', bodyPart: 'back' },
  { id: 'shoulders', label: 'Shoulders', icon: '🎯', bodyPart: 'shoulders' },
  { id: 'biceps', label: 'Biceps', icon: '💪', bodyPart: 'upper arms' },
  { id: 'triceps', label: 'Triceps', icon: '⚡', bodyPart: 'upper arms' },
  { id: 'legs', label: 'Legs', icon: '🦵', bodyPart: 'upper legs' },
  { id: 'core', label: 'Core', icon: '🔥', bodyPart: 'waist' },
];

export function getExerciseMediaUrl(ex) {
  if (!ex) return null;
  if (ex.gifUrl || ex.mediaUrl || ex.animation) {
    return ex.gifUrl || ex.mediaUrl || ex.animation;
  }
  if (ex.gif) return gifSrc(ex);
  if (ex.img) return imgSrc(ex);

  const idStr = String(ex.id || '').padStart(4, '0');
  return `/exercises/${idStr}.gif`;
}