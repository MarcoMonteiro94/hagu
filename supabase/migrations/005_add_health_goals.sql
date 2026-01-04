-- Add health_goals column to user_settings table
-- Stores user health-related goals like weight target

ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS health_goals JSONB DEFAULT NULL;

COMMENT ON COLUMN user_settings.health_goals IS 'User health goals including weight target';
