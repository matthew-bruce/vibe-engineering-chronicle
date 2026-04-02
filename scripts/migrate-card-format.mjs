/**
 * Migration: add card_format column and seed two cards.
 * Run once: node scripts/migrate-card-format.mjs
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL     = 'https://wvdwmywfxbvawulnoako.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? process.argv[2];

if (!SUPABASE_ANON_KEY) {
  console.error('Usage: SUPABASE_ANON_KEY=<key> node scripts/migrate-card-format.mjs');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── 1. Add column via rpc if available ──────────────────────────────────────
// NOTE: The anon key cannot run DDL.  Run this SQL manually in the Supabase
// SQL Editor if the rpc call below fails:
//
//   ALTER TABLE cards ADD COLUMN IF NOT EXISTS card_format text;
//
const { error: ddlError } = await supabase.rpc('exec_sql', {
  sql: 'ALTER TABLE cards ADD COLUMN IF NOT EXISTS card_format text;',
});
if (ddlError) {
  console.warn('DDL via rpc failed (expected with anon key) — apply manually:');
  console.warn('  ALTER TABLE cards ADD COLUMN IF NOT EXISTS card_format text;');
  console.warn('  Error:', ddlError.message);
} else {
  console.log('✓ card_format column added');
}

// ── 2. Set card_format on two specific cards ─────────────────────────────────
const CARDS = [
  'a96ef615-e142-484f-a976-42be219b2699', // DJI vacuum card
  'd00b16a4-e479-4ceb-a057-0236d3cd9362', // Rosie cancer vaccine card
];

const { error: updateError } = await supabase
  .from('cards')
  .update({ card_format: 'fact_or_fiction' })
  .in('card_id', CARDS);

if (updateError) {
  console.warn('UPDATE failed — apply manually:');
  console.warn(`  UPDATE cards SET card_format = 'fact_or_fiction'`);
  console.warn(`  WHERE card_id IN ('${CARDS.join("', '")}');`);
  console.warn('  Error:', updateError.message);
} else {
  console.log('✓ card_format set on 2 cards');
}
