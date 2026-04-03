-- Card Versioning System
-- Creates a table to store full snapshots of card state before any mutation.
-- Rows are never deleted by application code (only the oldest when > 50 per card).

CREATE TABLE IF NOT EXISTS card_versions (
  version_id      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id         uuid        NOT NULL REFERENCES cards(card_id),
  version_number  integer     NOT NULL,
  card_snapshot   jsonb       NOT NULL,
  versioned_at    timestamptz NOT NULL DEFAULT now(),
  versioned_by    text        NOT NULL CHECK (versioned_by IN ('user', 'enrichment_engine')),
  version_note    text,
  UNIQUE (card_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_card_versions_card_id
  ON card_versions (card_id, version_number DESC);
