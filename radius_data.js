import pool from './database.js';

// Get dashboard statistics
export async function getDashboardStats() {
    try {
        const [results] = await pool.execute(`
            SELECT 
                (SELECT COUNT(*) FROM radacct WHERE acctstoptime IS NULL) as active_sessions,
                (SELECT COUNT(DISTINCT username) FROM radacct WHERE acctstarttime >= DATE_SUB(NOW(), INTERVAL 24 HOUR)) as users_24h,
                (SELECT COALESCE(SUM(acctinputoctets + acctoutputoctets), 0) FROM radacct WHERE acctstarttime >= DATE_SUB(NOW(), INTERVAL 24 HOUR)) as data_24h,
                (SELECT COUNT(*) FROM radpostauth WHERE authdate >= DATE_SUB(NOW(), INTERVAL 1 HOUR)) as auth_1h
        `);
        
        return results[0] || {
            active_sessions: 0,
            users_24h: 0,
            data_24h: 0,
            auth_1h: 0
        };
    } catch (error) {
        console.error('Error getting dashboard stats:', error);
        throw error;
    }
}

// Get accounting records with pagination
export async function getAccountingRecords(page = 1, limit = 50) {
    try {
        const offset = (page - 1) * limit;
        
        const [records] = await pool.execute(`
            SELECT 
                radacctid,
                acctsessionid,
                acctuniqueid,
                username,
                realm,
                nasipaddress,
                nasportid,
                nasporttype,
                acctstarttime,
                acctstoptime,
                acctsessiontime,
                acctauthentic,
                connectinfo_start,
                connectinfo_stop,
                acctinputoctets,
                acctoutputoctets,
                calledstationid,
                callingstationid,
                acctterminatecause,
                servicetype,
                framedprotocol,
                framedipaddress
            FROM radacct 
            ORDER BY acctstarttime DESC 
            LIMIT ? OFFSET ?
        `, [limit, offset]);

        const [countResult] = await pool.execute('SELECT COUNT(*) as total FROM radacct');
        const total = countResult[0].total;

        return {
            records,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    } catch (error) {
        console.error('Error getting accounting records:', error);
        throw error;
    }
}

// Get authentication records
export async function getAuthRecords(page = 1, limit = 50) {
    try {
        const offset = (page - 1) * limit;
        
        const [records] = await pool.execute(`
            SELECT 
                id,
                username,
                pass,
                reply,
                authdate
            FROM radpostauth 
            ORDER BY authdate DESC 
            LIMIT ? OFFSET ?
        `, [limit, offset]);

        const [countResult] = await pool.execute('SELECT COUNT(*) as total FROM radpostauth');
        const total = countResult[0].total;

        return {
            records,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    } catch (error) {
        console.error('Error getting auth records:', error);
        throw error;
    }
}

// Get user-specific data
export async function getUserData(username) {
    try {
        // Get user's accounting records
        const [accountingRecords] = await pool.execute(`
            SELECT * FROM radacct 
            WHERE username = ? 
            ORDER BY acctstarttime DESC 
            LIMIT 100
        `, [username]);

        // Get user's authentication records
        const [authRecords] = await pool.execute(`
            SELECT * FROM radpostauth 
            WHERE username = ? 
            ORDER BY authdate DESC 
            LIMIT 50
        `, [username]);

        // Get user statistics
        const [stats] = await pool.execute(`
            SELECT 
                COUNT(*) as total_sessions,
                COALESCE(SUM(acctsessiontime), 0) as total_time,
                COALESCE(SUM(acctinputoctets + acctoutputoctets), 0) as total_data,
                MAX(acctstarttime) as last_session
            FROM radacct 
            WHERE username = ?
        `, [username]);

        return {
            username,
            accountingRecords,
            authRecords,
            stats: stats[0] || {
                total_sessions: 0,
                total_time: 0,
                total_data: 0,
                last_session: null
            }
        };
    } catch (error) {
        console.error('Error getting user data:', error);
        throw error;
    }
}

// Get usage reports
export async function getUsageReports(startDate, endDate, username = null) {
    try {
        let query = `
            SELECT 
                username,
                COUNT(*) as sessions,
                COALESCE(SUM(acctsessiontime), 0) as total_time,
                COALESCE(SUM(acctinputoctets), 0) as input_octets,
                COALESCE(SUM(acctoutputoctets), 0) as output_octets,
                COALESCE(SUM(acctinputoctets + acctoutputoctets), 0) as total_octets
            FROM radacct 
            WHERE 1=1
        `;
        
        const params = [];
        
        if (startDate) {
            query += ' AND acctstarttime >= ?';
            params.push(startDate);
        }
        
        if (endDate) {
            query += ' AND acctstarttime <= ?';
            params.push(endDate);
        }
        
        if (username) {
            query += ' AND username = ?';
            params.push(username);
        }
        
        query += ' GROUP BY username ORDER BY total_octets DESC';
        
        const [records] = await pool.execute(query, params);
        
        return records;
    } catch (error) {
        console.error('Error getting usage reports:', error);
        throw error;
    }
}

// Get active sessions
export async function getActiveSessions() {
    try {
        const [sessions] = await pool.execute(`
            SELECT 
                radacctid,
                acctsessionid,
                username,
                nasipaddress,
                nasportid,
                acctstarttime,
                acctsessiontime,
                acctinputoctets,
                acctoutputoctets,
                callingstationid,
                framedipaddress
            FROM radacct 
            WHERE acctstoptime IS NULL 
            ORDER BY acctstarttime DESC
        `);
        
        return sessions;
    } catch (error) {
        console.error('Error getting active sessions:', error);
        throw error;
    }
}

// Terminate a session
export async function terminateSession(sessionId) {
    try {
        const [result] = await pool.execute(`
            UPDATE radacct 
            SET acctstoptime = NOW(), 
                acctsessiontime = TIMESTAMPDIFF(SECOND, acctstarttime, NOW()),
                acctterminatecause = 'Admin-Reset'
            WHERE radacctid = ? AND acctstoptime IS NULL
        `, [sessionId]);
        
        return result.affectedRows > 0;
    } catch (error) {
        console.error('Error terminating session:', error);
        throw error;
    }
}

// Format bytes to human readable
export function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Format duration to human readable
export function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
        return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${secs}s`;
    } else {
        return `${secs}s`;
    }
}
