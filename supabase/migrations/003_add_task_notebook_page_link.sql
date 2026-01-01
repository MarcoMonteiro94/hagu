-- Add notebook_id and page_id to tasks for linking tasks to study materials
-- This allows tasks created from study pages to maintain their relationship

ALTER TABLE tasks
ADD COLUMN notebook_id UUID REFERENCES notebooks(id) ON DELETE SET NULL,
ADD COLUMN page_id UUID REFERENCES notebook_pages(id) ON DELETE SET NULL;

-- Index for efficient lookups by notebook
CREATE INDEX idx_tasks_notebook ON tasks(notebook_id)
WHERE notebook_id IS NOT NULL;

-- Index for efficient lookups by page
CREATE INDEX idx_tasks_page ON tasks(page_id)
WHERE page_id IS NOT NULL;
