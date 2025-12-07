DROP INDEX IF EXISTS idx_boards_project_id;
ALTER TABLE boards DROP COLUMN IF EXISTS settings;