ALTER TABLE tasks
ADD COLUMN priority VARCHAR(50) NOT NULL DEFAULT 'medium';

CREATE INDEX idx_tasks_priority ON tasks(priority);
