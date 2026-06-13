-- Chapter lifecycle status
CREATE TYPE chapter_status AS ENUM (
  'DRAFT',       -- Chapter slot exists; no outline yet
  'OUTLINED',    -- Chapter has an outline; ready to generate
  'QUEUED',      -- Waiting for worker; queue position shown in UI
  'WRITING',     -- Generation in progress
  'COMPLETED'    -- Chapter text saved; chapter summary written
);

-- Generation job status
CREATE TYPE job_status AS ENUM (
  'PENDING',     -- Job just created
  'RUNNING',     -- Worker is processing
  'COMPLETED',   -- Finished successfully
  'FAILED',      -- Failed; chapter returns to OUTLINED
  'CANCELLED'    -- Cancelled (e.g. user archives novel while WRITING)
);

-- Stale flag reason
CREATE TYPE stale_reason AS ENUM (
  'UPSTREAM_TEXT_CHANGED',       -- Upstream chapter text changed
  'UPSTREAM_SUMMARY_CHANGED',   -- Upstream chapter summary changed
  'SYNOPSIS_CHANGED',           -- Novel synopsis changed
  'PREMISE_CHANGED',            -- Novel premise changed
  'METADATA_CHANGED'            -- Profile/canon changed
);

-- Plot checkpoint decision
CREATE TYPE checkpoint_decision AS ENUM (
  'APPROVE',     -- Continue generation
  'REJECT',      -- AI replans outline
  'EDIT'         -- User edits outline + direction
);

-- Generation trigger type
CREATE TYPE generation_type AS ENUM (
  'WRITE',           -- First-time chapter generation
  'FULL_REGEN',      -- Full chapter regeneration
  'PARTIAL_REWRITE', -- Partial rewrite of selected text
  'SYNC_MEMORY',     -- Story memory sync (re-summarize)
  'BLURB'            -- Blurb generation
);
