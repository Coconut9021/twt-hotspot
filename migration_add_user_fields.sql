-- Migration script to add user registration columns to existing radcheck table
-- Run this if you already have a radcheck table without the user registration fields

-- Add new columns to radcheck table
ALTER TABLE `radcheck` 
ADD COLUMN `fullName` varchar(255) DEFAULT NULL AFTER `value`,
ADD COLUMN `email` varchar(255) DEFAULT NULL AFTER `fullName`,
ADD COLUMN `phone` varchar(20) DEFAULT NULL AFTER `email`,
ADD COLUMN `company` varchar(255) DEFAULT NULL AFTER `phone`,
ADD COLUMN `terms` tinyint(1) DEFAULT 0 AFTER `company`,
ADD COLUMN `marketing` tinyint(1) DEFAULT 0 AFTER `terms`,
ADD COLUMN `created_at` timestamp NOT NULL DEFAULT current_timestamp() AFTER `marketing`,
ADD COLUMN `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() AFTER `created_at`;

-- Add indexes for better performance
ALTER TABLE `radcheck` 
ADD KEY `email` (`email`),
ADD KEY `created_at` (`created_at`);

-- Create a view for user registration statistics
CREATE OR REPLACE VIEW user_registration_stats AS
SELECT 
    COUNT(*) as total_registrations,
    COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as registrations_today,
    COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as registrations_7d,
    COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as registrations_30d,
    COUNT(CASE WHEN marketing = 1 THEN 1 END) as marketing_opted_in
FROM radcheck
WHERE fullName IS NOT NULL;
