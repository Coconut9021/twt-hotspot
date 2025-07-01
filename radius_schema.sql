-- FreeRADIUS MySQL Database Schema
-- This schema is compatible with FreeRADIUS 3.x

-- Database creation (uncomment if needed)
-- CREATE DATABASE radius;
-- USE radius;

-- Table structure for table 'radacct'
-- This table stores accounting information
CREATE TABLE IF NOT EXISTS `radacct` (
  `radacctid` bigint(21) NOT NULL AUTO_INCREMENT,
  `acctsessionid` varchar(64) NOT NULL DEFAULT '',
  `acctuniqueid` varchar(32) NOT NULL DEFAULT '',
  `username` varchar(64) NOT NULL DEFAULT '',
  `realm` varchar(64) DEFAULT '',
  `nasipaddress` varchar(15) NOT NULL DEFAULT '',
  `nasportid` varchar(15) DEFAULT NULL,
  `nasporttype` varchar(32) DEFAULT NULL,
  `acctstarttime` datetime NULL DEFAULT NULL,
  `acctupdatetime` datetime NULL DEFAULT NULL,
  `acctstoptime` datetime NULL DEFAULT NULL,
  `acctinterval` int(12) DEFAULT NULL,
  `acctsessiontime` int(12) unsigned DEFAULT NULL,
  `acctauthentic` varchar(32) DEFAULT NULL,
  `connectinfo_start` varchar(50) DEFAULT NULL,
  `connectinfo_stop` varchar(50) DEFAULT NULL,
  `acctinputoctets` bigint(20) DEFAULT NULL,
  `acctoutputoctets` bigint(20) DEFAULT NULL,
  `calledstationid` varchar(50) NOT NULL DEFAULT '',
  `callingstationid` varchar(50) NOT NULL DEFAULT '',
  `acctterminatecause` varchar(32) NOT NULL DEFAULT '',
  `servicetype` varchar(32) DEFAULT NULL,
  `framedprotocol` varchar(32) DEFAULT NULL,
  `framedipaddress` varchar(15) NOT NULL DEFAULT '',
  PRIMARY KEY (`radacctid`),
  UNIQUE KEY `acctuniqueid` (`acctuniqueid`),
  KEY `username` (`username`),
  KEY `framedipaddress` (`framedipaddress`),
  KEY `acctsessionid` (`acctsessionid`),
  KEY `acctsessiontime` (`acctsessiontime`),
  KEY `acctstarttime` (`acctstarttime`),
  KEY `acctinterval` (`acctinterval`),
  KEY `acctstoptime` (`acctstoptime`),
  KEY `nasipaddress` (`nasipaddress`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Table structure for table 'radcheck'
-- This table stores user check items
CREATE TABLE IF NOT EXISTS `radcheck` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `username` varchar(64) NOT NULL DEFAULT '',
  `attribute` varchar(64) NOT NULL DEFAULT '',
  `op` char(2) NOT NULL DEFAULT '==',
  `value` varchar(253) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`),
  KEY `username` (`username`(32))
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Table structure for table 'radgroupcheck'
-- This table stores group check items
CREATE TABLE IF NOT EXISTS `radgroupcheck` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `groupname` varchar(64) NOT NULL DEFAULT '',
  `attribute` varchar(64) NOT NULL DEFAULT '',
  `op` char(2) NOT NULL DEFAULT '==',
  `value` varchar(253) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`),
  KEY `groupname` (`groupname`(32))
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Table structure for table 'radgroupreply'
-- This table stores group reply items
CREATE TABLE IF NOT EXISTS `radgroupreply` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `groupname` varchar(64) NOT NULL DEFAULT '',
  `attribute` varchar(64) NOT NULL DEFAULT '',
  `op` char(2) NOT NULL DEFAULT '=',
  `value` varchar(253) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`),
  KEY `groupname` (`groupname`(32))
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Table structure for table 'radpostauth'
-- This table stores post-authentication logging information
CREATE TABLE IF NOT EXISTS `radpostauth` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(64) NOT NULL DEFAULT '',
  `pass` varchar(64) NOT NULL DEFAULT '',
  `reply` varchar(32) NOT NULL DEFAULT '',
  `authdate` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `username` (`username`),
  KEY `authdate` (`authdate`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Table structure for table 'radreply'
-- This table stores user reply items
CREATE TABLE IF NOT EXISTS `radreply` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `username` varchar(64) NOT NULL DEFAULT '',
  `attribute` varchar(64) NOT NULL DEFAULT '',
  `op` char(2) NOT NULL DEFAULT '=',
  `value` varchar(253) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`),
  KEY `username` (`username`(32))
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Table structure for table 'radusergroup'
-- This table stores user-to-group mappings
CREATE TABLE IF NOT EXISTS `radusergroup` (
  `username` varchar(64) NOT NULL DEFAULT '',
  `groupname` varchar(64) NOT NULL DEFAULT '',
  `priority` int(11) NOT NULL DEFAULT 1,
  KEY `username` (`username`(32))
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Table structure for table 'nas'
-- This table stores NAS (Network Access Server) information
CREATE TABLE IF NOT EXISTS `nas` (
  `id` int(10) NOT NULL AUTO_INCREMENT,
  `nasname` varchar(128) NOT NULL,
  `shortname` varchar(32) DEFAULT NULL,
  `type` varchar(30) NOT NULL DEFAULT 'other',
  `ports` int(5) DEFAULT NULL,
  `secret` varchar(60) NOT NULL DEFAULT 'secret',
  `server` varchar(64) DEFAULT NULL,
  `community` varchar(50) DEFAULT NULL,
  `description` varchar(200) DEFAULT 'RADIUS Client',
  PRIMARY KEY (`id`),
  KEY `nasname` (`nasname`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Create indexes for better performance
CREATE INDEX idx_radacct_username_start ON radacct (username, acctstarttime);
CREATE INDEX idx_radacct_stop_null ON radacct (acctstoptime);
CREATE INDEX idx_radacct_start_user ON radacct (acctstarttime, username);
CREATE INDEX idx_radacct_stop_user ON radacct (acctstoptime, username);

-- Sample data for testing (optional)
-- Insert sample NAS entries
INSERT IGNORE INTO `nas` (`nasname`, `shortname`, `type`, `ports`, `secret`, `description`) VALUES
('127.0.0.1', 'localhost', 'other', 1812, 'testing123', 'Local test server'),
('192.168.1.1', 'gateway', 'cisco', 1812, 'secret123', 'Main gateway'),
('10.0.0.1', 'hotspot', 'other', 1812, 'hotspot123', 'Hotspot controller');

-- Insert sample user for testing
INSERT IGNORE INTO `radcheck` (`username`, `attribute`, `op`, `value`) VALUES
('testuser', 'Cleartext-Password', ':=', 'testpass'),
('admin', 'Cleartext-Password', ':=', 'admin123');

-- Insert sample group
INSERT IGNORE INTO `radgroupcheck` (`groupname`, `attribute`, `op`, `value`) VALUES
('default', 'Simultaneous-Use', ':=', '1');

INSERT IGNORE INTO `radgroupreply` (`groupname`, `attribute`, `op`, `value`) VALUES
('default', 'Session-Timeout', ':=', '3600'),
('default', 'Idle-Timeout', ':=', '600');

-- Assign users to groups
INSERT IGNORE INTO `radusergroup` (`username`, `groupname`, `priority`) VALUES
('testuser', 'default', 1),
('admin', 'default', 1);

-- Create a view for easy session monitoring
CREATE OR REPLACE VIEW active_sessions AS
SELECT 
    r.radacctid,
    r.username,
    r.nasipaddress,
    r.acctstarttime,
    r.framedipaddress,
    r.callingstationid,
    r.acctsessiontime,
    r.acctinputoctets,
    r.acctoutputoctets,
    TIMESTAMPDIFF(SECOND, r.acctstarttime, NOW()) AS duration_seconds
FROM radacct r
WHERE r.acctstoptime IS NULL
ORDER BY r.acctstarttime DESC;

-- Create a view for daily usage statistics
CREATE OR REPLACE VIEW daily_usage AS
SELECT 
    DATE(acctstarttime) as usage_date,
    COUNT(DISTINCT username) as unique_users,
    COUNT(*) as total_sessions,
    SUM(acctsessiontime) as total_time,
    SUM(acctinputoctets + acctoutputoctets) as total_bytes
FROM radacct 
WHERE acctstarttime >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
GROUP BY DATE(acctstarttime)
ORDER BY usage_date DESC;

-- Create a view for user statistics
CREATE OR REPLACE VIEW user_stats AS
SELECT 
    username,
    COUNT(*) as total_sessions,
    SUM(acctsessiontime) as total_time,
    SUM(acctinputoctets + acctoutputoctets) as total_bytes,
    MAX(acctstarttime) as last_session,
    MIN(acctstarttime) as first_session
FROM radacct 
GROUP BY username
ORDER BY total_bytes DESC;
