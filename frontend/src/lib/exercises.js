import { EXDB } from './exercises-data.js'
import { t } from './i18n.js'

export { EXDB }
export const EXIDX = {}
EXDB.forEach(e => { EXIDX[e.id] = e })
export const BODYPARTS = [...new Set(EXDB.map(e => e.bp))].sort()

// Equipment options present in a given list of exercises, most common first (issue #6).
// Deriving them from the *already filtered* list keeps the chip row short and means
// every body-part × equipment combination on screen has results behind it.
export function equipmentOf(list) {
  const c = {}
  list.forEach(e => { if (e.eq) c[e.eq] = (c[e.eq] || 0) + 1 })
  return Object.keys(c).sort((a, b) => c[b] - c[a] || (a < b ? -1 : 1))
}

// Custom (user-created) exercises live in synced state S.customEx (issue #11) and are
// merged into the id index here so every EXIDX[id] lookup keeps working unchanged.
let customIds = []
export function registerCustom(list) {
  customIds.forEach(id => delete EXIDX[id])
  customIds = (list || []).map(e => e.id)
  ;(list || []).forEach(e => { EXIDX[e.id] = e })
}
// Full searchable catalogue — customs first so your own exercises are easy to find.
export const allExercises = st => [...(st.customEx || []), ...EXDB]

// Media normally sits next to the app (img/ and gif/, mounted into the web container).
// A build can point them somewhere else — the demo build pulls them off a CDN instead of
// shipping ~140 MB of images into the deployment.
const IMG_BASE = import.meta.env.VITE_IMG_BASE || 'img/'
const GIF_BASE = import.meta.env.VITE_GIF_BASE || 'gif/'
export const imgSrc = ex => IMG_BASE + ex.img
export const gifSrc = ex => GIF_BASE + ex.gif

// Cardio exercises log time + speed instead of weight × reps.
export const isCardio = idOrEx => (typeof idOrEx === 'string' ? EXIDX[idOrEx] : idOrEx)?.bp === 'cardio'

// Exercises the dataset already knows carry no external load (issue #32) — a quarter of the
// catalogue. This seeds the `bw` flag on a fresh config so a push-up never asks for a weight
// nobody was going to enter. It is only the default: the flag lives on the config, so a dip
// done with a belt can turn it off and a custom exercise can turn it on.
export const isBodyweightEq = idOrEx =>
  (typeof idOrEx === 'string' ? EXIDX[idOrEx] : idOrEx)?.eq === 'body weight'

// An id that resolves to nothing — a plan file built against a different exercise dataset,
// a custom exercise deleted on another device before the sync arrived — still has to
// render. A placeholder keeps it visible (and removable) instead of taking the whole view
// down on the first `ex.n`.
// In frontend/src/lib/exercises.js
export const exOr = id => {
  if (EXIDX[id]) return EXIDX[id];
  
  // Format clean name from ID if missing (e.g. 'custom_incline_dumbbell_press' -> 'Incline Dumbbell Press')
  const fallbackName = typeof id === 'string' 
    ? id.replace(/^(ex_|custom_)/, '').split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    : 'Exercise';

  return {
    id,
    n: fallbackName,
    bp: 'general',
    tg: 'general',
    eq: 'other',
    sm: [],
    st: []
  };
};
// frontend/src/lib/exercises.js (append at bottom)

export const MAJOR_MUSCLE_GROUPS = [
  { id: 'chest', label: 'Chest', icon: '🛡️', bodyPart: 'chest' },
  { id: 'back', label: 'Back', icon: '🦅', bodyPart: 'back' },
  { id: 'shoulders', label: 'Shoulders', icon: '🎯', bodyPart: 'shoulders' },
  { id: 'biceps', label: 'Biceps', icon: '💪', bodyPart: 'upper arms' },
  { id: 'triceps', label: 'Triceps', icon: '⚡', bodyPart: 'upper arms' },
  { id: 'legs', label: 'Legs', icon: '🦵', bodyPart: 'upper legs' },
  { id: 'core', label: 'Core', icon: '🔥', bodyPart: 'waist' },
];