import { supabase } from './supabaseClient'

const SUPABASE_CONFIGURED = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)

// Upload a data URL (base64) to Supabase Storage and return public URL
export async function uploadDataUrlToSupabase(dataUrl, destPath = null) {
  if (!SUPABASE_CONFIGURED || !supabase) return null
  const bucket = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || 'images'
  try {
    // convert data URL to blob
    const res = await fetch(dataUrl)
    const blob = await res.blob()
    const filename = destPath || `images/${Date.now()}-${Math.random().toString(36).slice(2,8)}.png`

    const { error } = await supabase.storage.from(bucket).upload(filename, blob, { upsert: true })
    if (error) {
      console.warn('Supabase storage upload failed', error)
      return null
    }

    // create public URL
    const { data } = supabase.storage.from(bucket).getPublicUrl(filename)
    return data?.publicUrl || null
  } catch (e) {
    console.warn('uploadDataUrlToSupabase failed', e)
    return null
  }
}
