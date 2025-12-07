DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='boards' AND column_name='data'
    ) THEN
        ALTER TABLE boards ADD COLUMN data JSONB DEFAULT '{"objects":[],"version":0}'::jsonb;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='boards' AND column_name='settings'
    ) THEN
        ALTER TABLE boards ADD COLUMN settings JSONB DEFAULT '{"backgroundColor":"#ffffff"}'::jsonb;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_boards_project_id ON boards(project_id);

COMMENT ON COLUMN boards.data IS 'JSON с объектами доски: {objects: [...], version: number}';
