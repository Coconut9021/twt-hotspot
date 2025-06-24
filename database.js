import mysql from 'mysql2/promise';
import dotenv from 'dotenv' 
import { cleanPhoneNumber, scrubCompany } from './utils.js'

dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || undefined,
    database: process.env.DB_NAME
});

// Export the pool directly 
export default pool; 

// Export individual functions as named exports
export async function showDatabase() {
    const [rows] = await pool.query(`SELECT * FROM radcheck`);
    return rows;

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

export async function insertUserData(data) {
    try {
        const phone = cleanPhoneNumber(data.phone);
        const company = scrubCompany(data.company);

        await pool.query(`
            INSERT INTO radcheck 
            (fullName, email, phone, company, terms, marketing) 
            VALUES (?, ?, ?, ?, ?, ?)
        `, [data.fullName, data.email, phone, company, data.terms, data.marketing]);
        
        return { success: true };
    } catch (error) {
        console.error('Error inserting user data:', error);
        throw error;
    }
}

