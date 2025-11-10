DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='tasks' AND column_name='priority'
    ) THEN
        ALTER TABLE tasks ADD COLUMN priority VARCHAR(50) NOT NULL DEFAULT 'medium';
        CREATE INDEX idx_tasks_priority ON tasks(priority);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='project_members' AND column_name='role'
    ) THEN
        ALTER TABLE project_members ADD COLUMN role VARCHAR(50) NOT NULL DEFAULT 'member';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='boards' AND column_name='data'
    ) THEN
        ALTER TABLE boards ADD COLUMN data JSONB;
    END IF;
END $$;
