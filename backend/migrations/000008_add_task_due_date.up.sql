DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='tasks' AND column_name='due_date'
    ) THEN
        ALTER TABLE tasks ADD COLUMN due_date TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date) WHERE due_date IS NOT NULL;

COMMENT ON COLUMN tasks.due_date IS 'Дедлайн задачи (NULL = без ограничения)';