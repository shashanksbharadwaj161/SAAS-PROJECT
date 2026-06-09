-- Migration: 002_payments_gumroad.sql
-- Run manually in Supabase SQL Editor before testing S2.
--
-- Changes:
--   1. Make scan_id nullable — Gumroad sales arrive before a scan exists
--   2. Rename stripe_payment_intent_id → sale_id (payment-processor agnostic)
--   3. Update tier constraint: replace 'pro' with 'premium' to match $79 tier

-- 1. Make scan_id nullable
ALTER TABLE payments
  ALTER COLUMN scan_id DROP NOT NULL;

-- 2. Rename the payment identifier column
ALTER TABLE payments
  RENAME COLUMN stripe_payment_intent_id TO sale_id;

-- 3. Swap the tier check constraint
ALTER TABLE payments
  DROP CONSTRAINT IF EXISTS payments_tier_check;

ALTER TABLE payments
  ADD CONSTRAINT payments_tier_check
  CHECK (tier IN ('basic', 'premium', 'monitoring'));
