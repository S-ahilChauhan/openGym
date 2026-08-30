// frontend/src/store/useStore.js
import { create } from 'zustand'
import { supabase } from '../lib/supabase.js'
import { fetchUserState, saveUserState } from '../lib/supabase-state.js'
import { localTZ } from '../lib/format.js'
import { registerCustom } from '../lib/exercises.js'
import { DEMO, DEMO_SEEDED } from '../lib/demo.js'
import { MOBILE, nativeLoad, nativeSave, syncReminder } from '../lib/mobile.js'

const KEY = 'gym_state_v1'

export const INITIAL_BIO_SCAN = {
  reportDate: null,
  weight: null,
  height: '',
  age: null,
  gender: '',
  bmi: null,
  bmr: null,
  metabolicAge: null,
  bodyFatPct: null,
  subcutaneousFatPct: null,
  visceralFatIndex: null,
  fatMass: null,
  leanMass: null,
  muscleMass: null,
  boneMass: null,
  proteinPct: null,
  scores: {
    overall: null,
    bodyComposition: null,
    fatAnalysis: null,
    metabolicIndicators: null
  },
  targets: {
    idealWeight: null,
    weightControl: null,
    targetFatMass: null,
    targetBodyFat: null,
    targetMetabolicAge: null
  }
}

export const INITIAL_PROFILE = {
  name: '',
  heightCm: '',
  bio: '',
  bloodGroup: 'Select',
  restingHR: '',
  bloodPressure: '',
  injuries: 'None',
  allergies: 'None',
  somatotype: 'Mesomorph',
  dominantHand: 'Right',
  trainingDays: '4',
  sessionDuration: '60',
  equipment: 'Full Gym',
  avoidExercises: '',
  targetWeight: '',
  targetBodyFat: '',
  targetDate: '',
  goal: 'Hypertrophy',
  measurements: {
    chest: '',
    waist: '',
    hips: '',
    bicepL: '',
    bicepR: '',
    thighL: '',
    thighR: '',
    calfL: '',
    calfR: '',
    neck: '',
    shoulders: ''
  },
  measurementsUpdatedAt: null,
  waterPct: '',
  boneDensityScore: '',
  photos: { front: null, side: null, back: null, date: null }
}

export const DEF = {
  unit: 'kg', 
  restSec: 90, 
  sound: true, 
  keepAwake: true, 
  lang: 'en',
  theme: 'dark', 
  accent: 'lime', 
  body: 'male', 
  targetW: null,
  bodyweight: [],
  routines: [], 
  week: {}, 
  dayPlan: {},
  exWeights: {}, 
  workouts: [], 
  active: null, 
  customEx: [], 
  gifSize: 'full',
  reminder: { on: false, time: '08:00', tz: null }, 
  effort: null,
  bioScan: INITIAL_BIO_SCAN,
  profile: INITIAL_PROFILE
}

const clone = o => JSON.parse(JSON.stringify(o))

function loadState() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return Object.assign(clone(DEF), JSON.parse(raw))
  } catch (e) { /* ignore */ }
  return clone(DEF)
}

const hasData = st => !!((st.workouts || []).length || (st.routines || []).length || (st.bodyweight || []).length)

export const useStore = create((set, get) => {
  let pushTm = null
  let saveTm = null

  // Mobile build: mirror state into a file in the app's data directory
  const nativePersist = () => {
    clearTimeout(saveTm)
    saveTm = setTimeout(() => { saveTm = null; nativeSave(get().S); syncReminder(get().S) }, 800)
  }

  const persist = (S, push = true) => {
    S._ts = Date.now()
    registerCustom(S.customEx)
    localStorage.setItem(KEY, JSON.stringify(S))
    set({ S })
    if (MOBILE) nativePersist()
    if (push && get().user) {
      clearTimeout(pushTm)
      pushTm = setTimeout(() => get().pushState(), 1500)
    }
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'hidden') return
    if (MOBILE && saveTm) {
      clearTimeout(saveTm)
      saveTm = null
      nativeSave(get().S)
    }
    if (pushTm) {
      clearTimeout(pushTm)
      pushTm = null
      get().pushState()
    }
  })

  const clearLocalSession = () => {
    get().setUser(null)
    localStorage.removeItem('gym_guest')
    localStorage.removeItem('gym_dirty')
    localStorage.removeItem(KEY)
    persist(clone(DEF), false)
  }

  return {
    S: (() => { const s = loadState(); registerCustom(s.customEx); return s })(),
    user: (() => { try { return JSON.parse(localStorage.getItem('gym_user')) || null } catch { return null } })(),
    ready: false,

    update(mut, push = true) {
      const S = clone(get().S)
      mut(S)
      persist(S, push)
    },
    replaceState(S, push = false) { persist(clone(S), push) },

    isGuest: () => localStorage.getItem('gym_guest') === '1',
    setGuest(v) { if (v) localStorage.setItem('gym_guest', '1'); else localStorage.removeItem('gym_guest'); set({}) },

    setUser(u) {
      if (u) { localStorage.setItem('gym_user', JSON.stringify(u)); localStorage.removeItem('gym_guest') }
      else localStorage.removeItem('gym_user')
      set({ user: u })
    },

    async pushState() {
      if (!get().user) return
      clearTimeout(pushTm)
      try { await saveUserState(get().S); localStorage.removeItem('gym_dirty') }
      catch (e) { localStorage.setItem('gym_dirty', '1') }
    },
    async pullState() {
      try {
        const state = await fetchUserState()
        const S = get().S
        const dirty = localStorage.getItem('gym_dirty') === '1'
        if (state && (!hasData(S) || ((state._ts || 0) >= (S._ts || 0) && !dirty))) {
          const active = S.active
          const next = Object.assign(clone(DEF), state)
          if (active) next.active = active
          persist(next, false)
        } else if (hasData(S)) { await get().pushState() }
      } catch (e) { /* offline — keep local */ }
    },

    async signOut() {
      try { await get().pushState(); await supabase.auth.signOut() } catch (e) { /* */ }
      clearLocalSession()
    },

    async signOutAll() {
      await get().pushState()
      await supabase.auth.signOut({ scope: 'global' })
      clearLocalSession()
    },

    async resetDemo() {
      const { buildDemoState } = await import('../lib/demoSeed.js')
      localStorage.removeItem('gym_dirty')
      persist(Object.assign(clone(DEF), buildDemoState()), false)
    },

    async boot() {
      if (MOBILE) {
        const saved = await nativeLoad()
        const S = get().S
        if (saved && (!hasData(S) || (saved._ts || 0) >= (S._ts || 0))) {
          persist(Object.assign(clone(DEF), saved), false)
        } else if (hasData(S)) {
          nativeSave(S)
        }
        get().setGuest(true)
        syncReminder(get().S)
        set({ ready: true })
        return
      }

      if (DEMO) {
        if (!localStorage.getItem(DEMO_SEEDED)) {
          localStorage.setItem(DEMO_SEEDED, '1')
          await get().resetDemo()
        }
        get().setGuest(true)
        set({ ready: true })
        return
      }

      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          get().setUser(session.user)
          await get().pullState()
        } else get().setUser(null)

        const tz = localTZ()
        if (get().S.reminder?.on && get().S.reminder.tz !== tz) {
          get().update(s => { s.reminder = { ...s.reminder, tz } })
        }
      } catch (e) {
        get().setUser(null)
      }
      set({ ready: true })
    }
  }
})

export { hasData }