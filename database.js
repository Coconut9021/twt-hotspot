import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'twt_user',
    password: process.env.DB_PASSWORD || 'TWT_Secure_2024!',
    database: process.env.DB_DATABASE || 'twt_hotspot',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

<<<<<<< HEAD
export const showDatabase = async () => {
=======
// Export the pool directly 
export default pool; 

export async function showDatabase() {
    try {
        const [rows] = await pool.query(`SELECT * FROM radcheck`);
        return rows;
    } catch (error) {
        console.error('Error fetching database:', error);
        throw error;    
    }
}   

//deletes user data from the database
export async function deleteUser(fullName, email) {
>>>>>>> 1c84dfe88f474ab5f2940a8308bf436390404a3b
    try {
        const [rows] = await pool.execute('SELECT * FROM users ORDER BY created_at DESC');
        return rows;
    } catch (error) {
        console.error('Database error:', error);
        throw error;
    }
};

export const insertUserData = async (data) => {
    try {
        const [result] = await pool.execute(
            'INSERT INTO users (fullName, email, phone, company, terms, marketing) VALUES (?, ?, ?, ?, ?, ?)',
            [data.fullName, data.email, data.phone, data.company, data.terms ? 'Yes' : 'No', data.marketing ? 'Yes' : 'No']
        );
        return { success: true, insertId: result.insertId };
    } catch (error) {
        console.error('Insert error:', error);
        throw error;
    }
};

export const deleteUser = async (fullName, email) => {
    try {
        const [result] = await pool.execute(
            'DELETE FROM users WHERE fullName = ? AND email = ?',
            [fullName, email]
        );
        return { success: true, affectedRows: result.affectedRows };
    } catch (error) {
        console.error('Delete error:', error);
        throw error;
    }
};

<<<<<<< HEAD
export const findUserByCredentials = async (email, phone) => {
=======
//adds user data to the database
export async function insertUserData(data) {
>>>>>>> 1c84dfe88f474ab5f2940a8308bf436390404a3b
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM users WHERE email = ? AND phone = ?',
            [email, phone]
        );
        return rows[0] || null;
    } catch (error) {
        console.error('Find user error:', error);
        throw error;
    }
};

export default pool;
