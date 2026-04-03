-- Migration: add card_format column
-- Apply via Supabase Dashboard → SQL Editor

ALTER TABLE cards ADD COLUMN IF NOT EXISTS card_format text;

-- Seed: mark two specific cards as 'fact_or_fiction'
UPDATE cards
SET card_format = 'fact_or_fiction'
WHERE card_id IN (
  'a96ef615-e142-484f-a976-42be219b2699',  -- DJI vacuum card
  'd00b16a4-e479-4ceb-a057-0236d3cd9362'   -- Rosie cancer vaccine card
);
