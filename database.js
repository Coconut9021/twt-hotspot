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
export async function database() {
    const [rows] = await pool.query(`SELECT * FROM radcheck`);
    return rows;

}   

export async function insertUserData(data) {
    const phone = cleanPhoneNumber(data.phone)
    const company = scrubCompany(data.company)

   await pool.query(`
  INSERT INTO radcheck 
  (fullName, email, phone, company, terms, marketing) 
  VALUES (?, ?, ?, ?, ?, ?)
`, [data.fullName, data.email, phone, company, data.terms, data.marketing]);
  
}
 

