-- Feedback notes from testers of the public demo.
-- No name, email or IP address is stored. Notes are deleted after 90 days.
CREATE TABLE feedback_notes (
  -- Random id made on the phone, so a note that is retried isn't stored twice.
  note_id TEXT PRIMARY KEY,
  -- Server time the note arrived (ISO 8601). Drives the daily cap and deletion.
  received_at TEXT NOT NULL,
  text TEXT NOT NULL,
  -- The screen the note was sent from, e.g. /sites/site-coldfoot.
  screen TEXT NOT NULL,
  -- The site or operator the note is about, when sent from its page.
  record_id TEXT,
  app_version TEXT NOT NULL
);

CREATE INDEX feedback_notes_received_at ON feedback_notes (received_at);
