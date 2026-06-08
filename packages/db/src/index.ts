// @saas/db — shared Supabase client and TypeScript types
// Build types in S2 after schema is finalized.

import { createClient } from '@supabase/supabase-js'

// Server-side client (SERVICE_ROLE_KEY — bypasses RLS)
// Use ONLY in API routes and server components. Never expose to client.
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(url, key, { auth: { persistSession: false } })
}

// Client-side client (ANON_KEY — subject to RLS policies)
export function createBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(url, key)
}

// TODO S2: Add Database type definitions for all tables
// export type { Database } from './types'
