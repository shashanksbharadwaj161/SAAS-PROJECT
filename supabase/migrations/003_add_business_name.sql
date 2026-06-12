-- Migration: 003_add_business_name.sql
-- Run manually in Supabase SQL Editor.
--
-- Adds an optional business name to scans. Captured by the scan widget so the
-- PDF evidence package can show "Business: [name] | Site: [url]" — lawyers need
-- the business name on the document header, not just the scanned URL.

ALTER TABLE scans
  ADD COLUMN IF NOT EXISTS business_name TEXT;
