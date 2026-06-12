import { createClient, SupabaseClient } from '@supabase/supabase-js'

// ─────────────────────────────────────────────────────────────────────────────
// Database type definitions — mirrors supabase/migrations/*.sql exactly.
// Update here whenever a migration changes the schema.
// ─────────────────────────────────────────────────────────────────────────────

export interface Database {
  public: {
    Views: Record<string, never>
    Functions: Record<string, never>
    Tables: {
      scans: {
        Row: {
          id: string
          url: string
          business_name: string | null       // optional, shown on PDF header for legal reference
          raw_results: Record<string, unknown>
          score: number
          ip_hash: string | null
          created_at: string
        }
        Insert: {
          id?: string
          url: string
          business_name?: string | null
          raw_results?: Record<string, unknown>
          score: number
          ip_hash?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['scans']['Insert']>
        Relationships: []
      }

      payments: {
        Row: {
          id: string
          scan_id: string | null              // null for direct Gumroad purchases
          sale_id: string                     // Gumroad sale_id (unique)
          tier: 'basic' | 'premium' | 'monitoring'
          email: string
          pdf_urls: Record<string, string>    // { report: url, assessment: url, letter: url }
          created_at: string
        }
        Insert: {
          id?: string
          scan_id?: string | null
          sale_id: string
          tier: 'basic' | 'premium' | 'monitoring'
          email: string
          pdf_urls?: Record<string, string>
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['payments']['Insert']>
        Relationships: []
      }

      email_deliveries: {
        Row: {
          id: string
          payment_id: string
          email: string
          status: 'pending' | 'sent' | 'failed'
          sent_at: string | null
        }
        Insert: {
          id?: string
          payment_id: string
          email: string
          status?: 'pending' | 'sent' | 'failed'
          sent_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['email_deliveries']['Insert']>
        Relationships: []
      }

      shops: {
        Row: {
          id: string
          shopify_domain: string
          access_token: string               // encrypted via pgcrypto — never plaintext
          plan: 'trial' | 'active' | 'cancelled' | 'frozen'
          installed_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          shopify_domain: string
          access_token: string
          plan?: 'trial' | 'active' | 'cancelled' | 'frozen'
          installed_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['shops']['Insert']>
        Relationships: []
      }

      disputes: {
        Row: {
          id: string
          shop_id: string
          shopify_dispute_id: string
          amount: number                     // cents
          status: string
          type: string
          created_at: string
          raw_data: Record<string, unknown>
        }
        Insert: {
          id?: string
          shop_id: string
          shopify_dispute_id: string
          amount: number
          status: string
          type: string
          created_at?: string
          raw_data?: Record<string, unknown>
        }
        Update: Partial<Database['public']['Tables']['disputes']['Insert']>
        Relationships: []
      }

      vamp_snapshots: {
        Row: {
          id: string
          shop_id: string
          month: string                      // YYYY-MM
          dispute_count: number
          order_count: number
          ratio: number                      // e.g. 0.015 = 1.5%
          threshold_breached: boolean
          created_at: string
        }
        Insert: {
          id?: string
          shop_id: string
          month: string
          dispute_count?: number
          order_count?: number
          ratio?: number
          threshold_breached?: boolean
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['vamp_snapshots']['Insert']>
        Relationships: []
      }
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Typed client aliases
// ─────────────────────────────────────────────────────────────────────────────

export type ServiceClient = SupabaseClient<Database>
export type BrowserClient = SupabaseClient<Database>

// Server-side only — bypasses RLS via SERVICE_ROLE_KEY.
// Use exclusively in API routes and server components.
// Never import this in client components or expose the key to the browser.
export function createServiceClient(): ServiceClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing Supabase service role env vars')
  return createClient<Database>(url, key, { auth: { persistSession: false } })
}

// Client-side — subject to RLS policies defined in migrations.
export function createBrowserClient(): BrowserClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error('Missing Supabase anon env vars')
  return createClient<Database>(url, key)
}
