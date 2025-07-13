import mysql from 'mysql2/promise';
import dotenv from 'dotenv' 
import dgram from 'dgram';
import radius from 'radius';
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
export function authenticateUser(username, callback) {
    const { secret, server, port, password } = radiusConfig;

    const attributes = [
        [1, Buffer.from(username)], // User-Name
        [2, Buffer.from(password)],  // User-Password
        [4, Buffer.from('13.245.75.199')], // NAS-IP-Address
        [5, Buffer.from('NAS-Port')],      // NAS-Port
        [80, Buffer.alloc(16)]             // Message-Authenticator
    ];

    const message = radius.encode({
        code: 'Access-Request',
        secret,
        attributes,
    });

    const socket = dgram.createSocket('udp4');

    socket.on('error', (err) => {
        console.error('Socket error:', err);
        callback(err);
    });

    socket.on('message', (msg) => {
        try {
            console.log('Raw RADIUS response:', msg.toString('hex')); // Log raw response
            const response = radius.decode({ packet: msg, secret });
            console.log('Decoded response:', response); // Log full response
            callback(null, response.code === 'Access-Accept');
        } catch (err) {
            console.error('Decode error:', err);
            callback(err);
        } finally {
            socket.close();
        }
    });

    console.log('Sending RADIUS request for user:', username);
    socket.send(message, 0, message.length, port, server, (err) => {
        if (err) {
            console.error('Send error:', err);
            socket.close();
            return callback(err);
        }
    });
}

export async function insertUserData(data) {
    try {
        if (!data.email || !data.fullName || !data.terms) {
            throw new Error('Missing required fields');
        }

        // Insert into radcheck for authentication
        await pool.query(`
            INSERT INTO radcheck 
            (username, attribute, op, value)
            VALUES (?, 'Cleartext-Password', ':=', ?)
        `, [data.email, USER_PASSWORD]);

        // Insert into user profile table 
        await pool.query(`
            INSERT INTO user_profiles 
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
        await pool.query(`DELETE FROM user_profiles WHERE email = ?`, [email]);

        return { success: true, deletedCount: result.affectedRows };

    } catch (error) {
        console.error('Error deleting user:', error);
        throw error;
    }
}

// Admin functions
export async function showDatabase() {
    try {
        // Get all user profiles
        const [fullData] = await pool.query('SELECT * FROM user_profiles');
        
        // Get user groups with their full names
        const [groups] = await pool.query(`
            SELECT rg.UserName as email, rg.GroupName, up.fullName
            FROM radusergroup rg
            LEFT JOIN user_profiles up ON rg.UserName = up.email
        `);
        
        return { fullData, groups };
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



