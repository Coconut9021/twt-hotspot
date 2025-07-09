import mysql from 'mysql2/promise';
import dotenv from 'dotenv' 
import { cleanPhoneNumber, scrubCompany } from './utils.js'

dotenv.config();

// Verify required environment variables
// const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
// for (const envVar of requiredEnvVars) {
//     if (!process.env[envVar]) {
//         throw new Error(`Missing required environment variable: ${envVar}`);
//     }
// }

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Export the pool directly 
export default pool; 

// Test the connection
// export async function testConnection() {
//     try {
//         const connection = await pool.getConnection();
//         console.log('Successfully connected to database:', process.env.DB_NAME);
//         connection.release();
//     } catch (error) {
//         console.error('Database connection failed:', error);
//         process.exit(1);
//     }
// }

// RADIUS Authentication Functions
export async function authenticateUser(username, password) {
    try {
        const [users] = await pool.query(
            `SELECT * FROM radcheck 
             WHERE username = ? AND attribute = 'Cleartext-Password'`,
            [username]
        );

        if (users.length === 0) {
            return { success: false, message: 'User not found' };
        }

        const user = users[0];
        if (password !== user.value) {
            return { success: false, message: 'Invalid password' };
        }

        // Get user groups if needed
        const [groups] = await pool.query(
            `SELECT GroupName FROM radusergroup 
             WHERE UserName = ?`,
            [username]
        );

        return { 
            success: true,
            username: username,
            groups: groups.map(g => g.GroupName)
        };
    } catch (error) {
        console.error('Authentication error:', error);
        throw error;
    }
}

export async function insertUserData(data) {
    console.log('it gets this far')
    try {
        // const phone = cleanPhoneNumber(data.phone);
        // const company = scrubCompany(data.company);

        // Validate required fields
        if (!data.email || !data.fullName || !data.terms) {
            throw new Error('Missing required fields');
        }

        // Also create RADIUS user if needed
        if (data.email != null && data.fullName != null && data.terms == 'true') {
            await pool.query(`
                INSERT INTO radcheck 
                (username, attribute, op, value)
                VALUES (?, 'Cleartext-Password', ':=', ?)
            `, [data.email, process.env.USER_PASSWORD]);
        }

        return { success: true };
    } catch (error) {
        console.error('Error inserting user data:', error);
        throw error;
    }
}

export async function deleteUser(fullName, email) {
    try {
        const [result] = await pool.query(
            `DELETE FROM radcheck WHERE fullName = ? AND email = ?`, 
            [fullName, email]
        );
        
        if (result.affectedRows === 0) {
            throw new Error('User not found');
        }
        
        return { success: true, deletedCount: result.affectedRows };
    } catch (error) {
        console.error('Error deleting user:', error);
        throw error;
    }
}

// Admin functions
export async function showDatabase() {
    const [rows] = await pool.query(`SELECT * FROM radcheck`);
    return rows;
}



