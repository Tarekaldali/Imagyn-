import { supabase } from './supabaseClient'

const SUPABASE_CONFIGURED = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)

// Insert image metadata into `images` table. Returns inserted row or null.
export async function insertImageMetadata({ user_id = null, prompt = '', image_url = '', model_used = '', generation_time = null } = {}) {
  if (!SUPABASE_CONFIGURED || !supabase) return null
  try {
    const { data: authData } = await supabase.auth.getUser()
    const authUserId = authData?.user?.id
    if (!user_id && !authUserId) return null

    const payload = {
      user_id: user_id || authUserId,
      prompt,
      image_url,
      model_used,
      generation_time,
    }

    const { data, error } = await supabase.from('images').insert([payload]).select().limit(1)
    if (error) {
      console.warn('insertImageMetadata error', error)
      return null
    }
    return data?.[0] ?? null
  } catch (e) {
    console.warn('insertImageMetadata failed', e)
    return null
  }
}

export default { insertImageMetadata }
