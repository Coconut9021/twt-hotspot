import mysql from 'mysql2/promise';
import dotenv from 'dotenv' 
import dgram from 'dgram';
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import cookieParser from 'cookie-parser';

import { cleanPhoneNumber, scrubCompany } from './utils.js'
import { verify } from 'crypto';

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


const radiusConfig = {
    secret: process.env.RADIUS_SECRET,
    port: process.env.RADIUS_PORT,
    server: process.env.RADIUS_SERVER,
    password: process.env.USER_PASSWORD
};

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
// RADIUS Authentication Functions
export async function authenticateUser(username) {
    try {
        const [checkRadCheck] = await pool.query(
            'SELECT username FROM radcheck WHERE username = ?', 
            [username]
        );
        
        if (checkRadCheck.length === 0) {
            return false;
        }
        
        const firstRow = checkRadCheck[0];
        const dbusername = firstRow.username;
        return true;
    } catch (err) {
        console.error("Error authenticating user:", err.message);
        throw err;
    }
}


export async function authenticateAdmin(username, password) {
    try {
        const [rows] = await pool.query(
            'SELECT password_hash FROM admins WHERE username = ?',
            [username]
        );
        
        if (rows.length === 0) {
            return false; // No user found
        }
        
        const hash = rows[0].password_hash; // Access the hash from the first row           
        const isMatch = await bcrypt.compare(password, hash);
        
        return isMatch;
    } catch (error) {
        console.error("Error authenticating the role of users:", error.message);
        throw error;
    }
}

export function authenticateToken(req, res, next) {
    // Check Authorization header first
    const authHeader = req.headers['authorization'];
    let token = authHeader && authHeader.split(' ')[1];
    
    // If no header token, check cookies
    if (!token) {
        token = req.cookies.token;
    }

    if (!token) {
        return res.sendStatus(401);
    }
    
    jwt.verify(token, process.env.USER_ACCESS_TOKEN, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

export async function insertUserData(data) {
    console.log(data)
    try {
        if (!data.email || !data.fullName || !data.terms) {
            throw new Error('Missing required fields');
        }

        // Insert into radcheck for authentication
        await pool.query(`
            INSERT INTO radcheck 
            (username, attribute, op, value)
            VALUES (?, 'Cleartext-Password', ':=', ?)
        `, [data.email, radiusConfig.password]);

        // Insert into user profile table 
        await pool.query(`
            INSERT INTO users 
            (email, fullName, phone, company, terms, marketing)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [data.email, data.fullName, data.phone, data.company, data.terms, data.marketing]);

        await pool.query(`
            INSERT INTO radusergroup
            (UserName, GroupName, priority)
            VALUES (?, 'user', 0)
        `, [data.email]);


        return { success: true };
    } catch (error) {
        console.error('Error inserting user data:', error);
        throw error;
    }
}

export async function deleteUser(email) {
    try {
        // Delete from all related tables
        await pool.query(`DELETE FROM radcheck WHERE username = ?`, [email]);
        await pool.query(`DELETE FROM radusergroup WHERE UserName = ?`, [email]);
        await pool.query(`DELETE FROM users WHERE email = ?`, [email]);

        return { success: true};

    } catch (error) {
        console.error('Error deleting user:', error);
        throw error;
    }
}

// Admin functions
export async function showDatabase() {
    try {
        // Get all user profiles
        const [fullData] = await pool.query('SELECT * FROM users');
        
        // Get user groups with their full names
        const [groups] = await pool.query(`
            SELECT rg.UserName as email, rg.GroupName, up.fullName
            FROM radusergroup rg
            LEFT JOIN users up ON rg.UserName = up.email
        `);

        const [dataUsage] = await pool.query(`
            SELECT username, framedipaddress, acctinputoctets, acctoutputoctets FROM radacct 
            `);
        
        return { fullData, groups, dataUsage };
    } catch (error) {
        console.error('Database error:', error);
        throw error;
    }
}

export async function checkAdmin(email) {
    try{
        const checkAdmin = await pool.query(`
            SELECT GroupName FROM radusergroup 
            WHERE UserName = ?`, [ email ] ); 
        if (checkAdmin[0][0].GroupName === "admin") {
            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.error('Error finding admin user:', error);
        throw error
    }
}



