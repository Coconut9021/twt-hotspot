import mysql from 'mysql2/promise';
import dotenv from 'dotenv' 

dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || undefined,
    database: process.env.DB_NAME
});

// Export the pool directly (as a default export if you want to import it as 'pool' in index.js)
export default pool; 

// Export individual functions as named exports
export async function database() {
    const [rows] = await pool.query(`SELECT * FROM radcheck`);
    return rows;

}


export async function insertUserData(data) {
   await pool.query(`
  INSERT INTO radcheck 
  (fullName, email, phone, company, terms, marketing) 
  VALUES (?, ?, ?, ?, ?, ?)
`, [data.fullName, data.email, data.phone, data.company, data.terms, data.marketing]);
  
}
 

