-- Monitoring subscriptions are kept separately from individual Gumroad sales.
-- A membership renewal receives a new sale_id, but retains its subscription_id.

CREATE TABLE IF NOT EXISTS monitoring_subscriptions (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id TEXT        NOT NULL UNIQUE,
  scan_id         UUID        REFERENCES scans(id) ON DELETE SET NULL,
  email           TEXT        NOT NULL,
  status          TEXT        NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'cancelled', 'ended', 'failed')),
  next_scan_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_scanned_at TIMESTAMPTZ,
  latest_score    INTEGER     CHECK (latest_score >= 0 AND latest_score <= 100),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_monitoring_subscriptions_due
  ON monitoring_subscriptions (status, next_scan_at);

ALTER TABLE monitoring_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_all_monitoring_subscriptions"
  ON monitoring_subscriptions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
