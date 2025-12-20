-- Add linked_transaction_id to tasks for recurring expense reminders
-- This creates a link between a recurring transaction and its payment reminder task

ALTER TABLE tasks
ADD COLUMN linked_transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL;

-- Create unique index to prevent duplicate tasks for the same transaction
-- Only one active (non-done) task per transaction at a time
CREATE UNIQUE INDEX idx_tasks_linked_transaction_unique
ON tasks(linked_transaction_id)
WHERE linked_transaction_id IS NOT NULL AND status != 'done';

-- Index for efficient lookups
CREATE INDEX idx_tasks_linked_transaction ON tasks(linked_transaction_id)
WHERE linked_transaction_id IS NOT NULL;
