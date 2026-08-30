// frontend/src/lib/supabase-state.js
import { supabase } from './supabase.js'

/**
 * Fetch and reconstruct the entire user state from public.entries
 */
export async function fetchUserState() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: entries, error } = await supabase
    .from('entries')
    .select('*')
    .order('date', { ascending: false })

  if (error) {
    console.error('Error fetching entries:', error)
    throw error
  }

  if (!entries || entries.length === 0) return null

  const reconstructedState = {
    workouts: [],
    bodyweight: [],
    profile: {},
    bioScan: {},
    diet: { targets: { calories: 2400, protein: 180, carbs: 250, fat: 65, water: 3.5 }, logs: {} },
    _ts: Date.now()
  }

  entries.forEach(entry => {
    if (entry.workout) {
      if (Array.isArray(entry.workout)) {
        reconstructedState.workouts.push(...entry.workout)
      } else {
        reconstructedState.workouts.push(entry.workout)
      }
    }

    if (entry.weight !== null && entry.weight !== undefined) {
      reconstructedState.bodyweight.push({
        date: entry.date,
        weight: entry.weight
      })
    }

    if (entry.diet && entry.date) {
      reconstructedState.diet.logs[entry.date] = entry.diet
    }

    // Grab the latest profile and bioscan data found in entries
    if (entry.profile && Object.keys(reconstructedState.profile).length === 0) {
      reconstructedState.profile = entry.profile
    }
    if (entry.bioscan && Object.keys(reconstructedState.bioScan).length === 0) {
      reconstructedState.bioScan = entry.bioscan
    }
  })

  return reconstructedState
}

/**
 * Save every piece of data (Profile, BioScan, Workouts, Weight, Diet) into public.entries
 */
export async function saveUserState(stateBlob) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  let cleanBlob = stateBlob
  try {
    const rawString = JSON.stringify(stateBlob)
    const sanitizedString = rawString.replace(/\\u0000/g, '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    cleanBlob = JSON.parse(sanitizedString)
  } catch (err) {
    console.warn('Could not sanitize state blob:', err)
  }

  const dateMap = {}
  const getDateKey = (dateInput) => {
    if (!dateInput) return new Date().toISOString().split('T')[0]
    return new Date(dateInput).toISOString().split('T')[0]
  }

  const todayKey = getDateKey(new Date())
  if (!dateMap[todayKey]) {
    dateMap[todayKey] = { date: todayKey, workout: [], diet: null, weight: null, profile: cleanBlob.profile || null, bioscan: cleanBlob.bioScan || null }
  }

  // Group Workouts
  if (cleanBlob?.workouts && Array.isArray(cleanBlob.workouts)) {
    cleanBlob.workouts.forEach(w => {
      const dKey = getDateKey(w.date || w.completedAt || w.start)
      if (!dateMap[dKey]) dateMap[dKey] = { date: dKey, workout: [], diet: null, weight: null, profile: null, bioscan: null }
      dateMap[dKey].workout.push(w)
    })
  }

  // Group Bodyweight
  if (cleanBlob?.bodyweight && Array.isArray(cleanBlob.bodyweight)) {
    cleanBlob.bodyweight.forEach(bw => {
      const dKey = getDateKey(bw.date)
      if (!dateMap[dKey]) dateMap[dKey] = { date: dKey, workout: [], diet: null, weight: null, profile: null, bioscan: null }
      dateMap[dKey].weight = bw.weight
    })
  }

  // Group Diet logs
  if (cleanBlob?.diet?.logs) {
    Object.entries(cleanBlob.diet.logs).forEach(([dateKey, dietData]) => {
      const dKey = getDateKey(dateKey)
      if (!dateMap[dKey]) dateMap[dKey] = { date: dKey, workout: [], diet: null, weight: null, profile: null, bioscan: null }
      dateMap[dKey].diet = dietData
    })
  }

  // Attach profile and bioscan to today's entry so they always save
  dateMap[todayKey].profile = cleanBlob.profile || null
  dateMap[todayKey].bioscan = cleanBlob.bioScan || null

  const entriesToUpsert = Object.values(dateMap).map(entry => ({
    date: entry.date,
    weight: entry.weight,
    workout: entry.workout.length > 0 ? entry.workout : null,
    diet: entry.diet,
    profile: entry.profile,
    bioscan: entry.bioscan,
    updated_at: new Date().toISOString()
  }))

  if (entriesToUpsert.length > 0) {
    const { error } = await supabase
      .from('entries')
      .upsert(entriesToUpsert, { onConflict: 'date' })

    if (error) {
      console.error('Error saving entries to Supabase:', error)
      throw error
    }
  }
}