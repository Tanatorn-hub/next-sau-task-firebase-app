// lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'

// Create a single supabase client for interacting with your database
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase URL or Anon Key. Please check your .env.local file.")
}

export const supabase = createClient(supabaseUrl, supabaseKey)
