-- =============================================================
-- Migration: 001_initial_schema.sql
-- Run manually in Supabase SQL Editor
--
-- IMPORTANT: Supabase free tier = 2 active projects max.
-- For production: run ADA tables in the "ada-tool" project,
--                 run VAMP tables in the "shopify-vamp" project.
-- For development: run everything in one project to conserve quota.
-- =============================================================


-- =============================================================
-- EXTENSIONS
-- =============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- =============================================================
-- ADA TOOL TABLES
-- =============================================================

CREATE TABLE IF NOT EXISTS scans (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  url          TEXT         NOT NULL,
  raw_results  JSONB        NOT NULL DEFAULT '{}',
  score        INTEGER      NOT NULL DEFAULT 0 CHECK (score >= 0),
  ip_hash      TEXT,                                       -- SHA-256 of IP for rate limiting, never raw IP
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id                        UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id                   UUID         NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
  stripe_payment_intent_id  TEXT         NOT NULL UNIQUE,
  tier                      TEXT         NOT NULL CHECK (tier IN ('basic', 'pro', 'monitoring')),
  email                     TEXT         NOT NULL,
  pdf_urls                  JSONB        NOT NULL DEFAULT '{}', -- { "report": url, "assessment": url, "letter": url }
  created_at                TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_deliveries (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id  UUID         NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  email       TEXT         NOT NULL,
  status      TEXT         NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at     TIMESTAMPTZ
);


-- =============================================================
-- SHOPIFY VAMP TABLES
-- =============================================================

CREATE TABLE IF NOT EXISTS shops (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  shopify_domain   TEXT         NOT NULL UNIQUE,   -- e.g. "mystore.myshopify.com"
  access_token     TEXT         NOT NULL,
    -- CRITICAL: MUST be stored as pgp_sym_encrypt(token, SHOPIFY_TOKEN_ENCRYPTION_KEY)
    -- NEVER insert a plaintext access token. Implemented in apps/shopify-vamp/lib/shopify.ts (S6).
  plan             TEXT         NOT NULL DEFAULT 'trial'
                CHECK (plan IN ('trial', 'active', 'cancelled', 'frozen')),
  installed_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS disputes (
  id                   UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id              UUID         NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  shopify_dispute_id   TEXT         NOT NULL,
  amount               INTEGER      NOT NULL DEFAULT 0,   -- dispute amount in cents
  status               TEXT         NOT NULL,             -- open | won | lost | accepted | under_review
  type                 TEXT         NOT NULL,             -- inquiry | chargeback
  created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  raw_data             JSONB        NOT NULL DEFAULT '{}',
  UNIQUE(shop_id, shopify_dispute_id)
);

CREATE TABLE IF NOT EXISTS vamp_snapshots (
  id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id             UUID          NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  month               TEXT          NOT NULL,              -- format: YYYY-MM (e.g. '2026-06')
  dispute_count       INTEGER       NOT NULL DEFAULT 0,    -- TC40 fraud + TC15 disputes this month
  order_count         INTEGER       NOT NULL DEFAULT 0,    -- settled CNP transactions (denominator)
  ratio               DECIMAL(8,6)  NOT NULL DEFAULT 0,   -- e.g. 0.015000 = 1.50%
  threshold_breached  BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  UNIQUE(shop_id, month)
);


-- =============================================================
-- INDEXES
-- =============================================================

CREATE INDEX IF NOT EXISTS idx_scans_created_at
  ON scans (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payments_scan_id
  ON payments (scan_id);

CREATE INDEX IF NOT EXISTS idx_payments_stripe_pi
  ON payments (stripe_payment_intent_id);

CREATE INDEX IF NOT EXISTS idx_email_deliveries_payment_id
  ON email_deliveries (payment_id);

CREATE INDEX IF NOT EXISTS idx_disputes_shop_id
  ON disputes (shop_id);

CREATE INDEX IF NOT EXISTS idx_disputes_shop_created
  ON disputes (shop_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_vamp_snapshots_shop_month
  ON vamp_snapshots (shop_id, month DESC);


-- =============================================================
-- ROW LEVEL SECURITY
-- All tables are locked down. Only the service_role (used in
-- API routes via SUPABASE_SERVICE_ROLE_KEY) can write.
-- Anon users can only INSERT a scan (the free scan flow).
-- =============================================================

ALTER TABLE scans             ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_deliveries  ENABLE ROW LEVEL SECURITY;
ALTER TABLE shops             ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE vamp_snapshots    ENABLE ROW LEVEL SECURITY;

-- scans: public INSERT (anonymous free scan), service_role reads/updates
CREATE POLICY "anon_insert_scans"
  ON scans FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "service_select_scans"
  ON scans FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "service_update_scans"
  ON scans FOR UPDATE
  TO service_role
  USING (true);

-- payments: service_role only
CREATE POLICY "service_all_payments"
  ON payments FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- email_deliveries: service_role only
CREATE POLICY "service_all_email_deliveries"
  ON email_deliveries FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- shops: service_role only (access_token is sensitive even when encrypted)
CREATE POLICY "service_all_shops"
  ON shops FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- disputes: service_role only
CREATE POLICY "service_all_disputes"
  ON disputes FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- vamp_snapshots: service_role only
CREATE POLICY "service_all_vamp_snapshots"
  ON vamp_snapshots FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
