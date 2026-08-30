// frontend/src/lib/supabase-state.js
import { supabase } from './supabase.js'

/**
 * Fetch the entire user state blob from Supabase
 */
export async function fetchUserState() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

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
 * Save the entire state blob back to Supabase (with automatic Unicode sanitization)
 */
export async function saveUserState(stateBlob) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Sanitize the JSON string to remove null bytes (\u0000) and unsupported control characters
  // that cause Postgres 22P05 unicode escape sequence crashes.
  let cleanBlob = stateBlob
  try {
    const rawString = JSON.stringify(stateBlob)
    const sanitizedString = rawString.replace(/\\u0000/g, '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    cleanBlob = JSON.parse(sanitizedString)
  } catch (err) {
    console.warn('Could not sanitize state blob, falling back to original:', err)
  }

  const { error } = await supabase
    .from('app_state')
    .upsert({
      user_id: user.id,
      state: cleanBlob,
      updated_at: new Date().toISOString()
    })

  if (error) {
    console.error('Error saving state:', error)
    throw error
  }
}