// frontend/src/lib/supabase-state.js
import { supabase } from './supabase.js'

/**
 * Fetch the user state blob or recent entries from Supabase
 */
export async function fetchUserState() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Option A: If you are still using an app_state table for overall sync
  const { data, error } = await supabase
    .from('app_state')
    .select('state')
    .eq('user_id', user.id)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching state:', error)
    throw error
  }

  return data?.state || null
}

/**
 * Save the state blob back to Supabase and sync daily entries into public.entries
 */
export async function saveUserState(stateBlob) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // 1. Sanitize JSON string to prevent Postgres 22P05 unicode/null-byte errors
  let cleanBlob = stateBlob
  try {
    const rawString = JSON.stringify(stateBlob)
    const sanitizedString = rawString.replace(/\\u0000/g, '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    cleanBlob = JSON.parse(sanitizedString)
  } catch (err) {
    console.warn('Could not sanitize state blob, falling back to original:', err)
  }

  // 2. Save entire state blob to app_state table (maintains your existing sync setup)
  const { error } = await supabase
    .from('app_state')
    .upsert({
      user_id: user.id,
      state: cleanBlob,
      updated_at: new Date().toISOString()
    })

  if (error) {
    console.error('Error saving state to app_state:', error)
    throw error
  }

  // 3. (Optional) If you want to automatically mirror daily workouts/weights into your new public.entries table:
  try {
    if (cleanBlob?.workouts && Array.isArray(cleanBlob.workouts)) {
      for (const workout of cleanBlob.workouts) {
        if (!workout.date) continue
        await supabase.from('entries').upsert({
          date: workout.date.split('T')[0], // format as YYYY-MM-DD
          workout: workout,
          updated_at: new Date().toISOString()
        }, { onConflict: 'date' })
      }
    }
  } catch (entryErr) {
    console.warn('Could not sync individual entries to public.entries:', entryErr)
  }
}