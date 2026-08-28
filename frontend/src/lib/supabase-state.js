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
 * Save the entire state blob back to Supabase
 */
export async function saveUserState(stateBlob) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('app_state')
    .upsert({
      user_id: user.id,
      state: stateBlob,
      updated_at: new Date().toISOString()
    })

  if (error) {
    console.error('Error saving state:', error)
    throw error
  }
}
