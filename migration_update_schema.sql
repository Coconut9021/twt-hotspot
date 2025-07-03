-- Migration to add user fields to radcheck table
-- Run this after setting up the basic RADIUS schema

ALTER TABLE radcheck ADD COLUMN IF NOT EXISTS fullName VARCHAR(100);
ALTER TABLE radcheck ADD COLUMN IF NOT EXISTS email VARCHAR(100);
ALTER TABLE radcheck ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE radcheck ADD COLUMN IF NOT EXISTS company VARCHAR(100);
ALTER TABLE radcheck ADD COLUMN IF NOT EXISTS terms BOOLEAN DEFAULT FALSE;
ALTER TABLE radcheck ADD COLUMN IF NOT EXISTS marketing BOOLEAN DEFAULT FALSE;
ALTER TABLE radcheck ADD COLUMN IF NOT EXISTS sessionTimeout INT DEFAULT 3600;
ALTER TABLE radcheck ADD COLUMN IF NOT EXISTS createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_radcheck_email ON radcheck(email);
CREATE INDEX IF NOT EXISTS idx_radcheck_created ON radcheck(createdAt);
