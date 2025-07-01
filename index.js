import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import pool, { showDatabase, insertUserData, deleteUser } from './database.js' ;
import radiusRoutes from './radius_routes.js';
import { formatBytes, formatDuration } from './radius_data.js';

// Load environment variables
dotenv.config();

const app = express();

app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static("/public"));

// Set up EJS globals
app.locals.formatBytes = formatBytes;
app.locals.formatDuration = formatDuration;

// RADIUS routes
app.use('/radius', radiusRoutes);

// API routes for system status
app.get('/api/system-status', async (req, res) => {
    try {
        // Test database connection
        const [rows] = await pool.execute('SELECT 1');
        const dbStatus = rows.length > 0;
        
        res.json({
            database: dbStatus,
            radius: true, // You can implement actual RADIUS server check here
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.json({
            database: false,
            radius: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

app.get('/api/uptime', (req, res) => {
    res.json({
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

app.get("/", (req, res) => {
  res.render("index.ejs");

})

app.get("/admin", async (req, res) => {
    try {
        const data = await showDatabase();
        res.render("admin.ejs", { data });
    } catch (error) {
        console.error('Error loading admin page:', error);
        res.status(500).send('Error loading admin page');
    }
});

app.post('/delete-user', async (req, res) => {
    try {
        const { fullName, email } = req.body;
        
        if (!fullName || !email) {
            return res.status(400).json({ 
                success: false, 
                error: 'Name and email are required' 
            });
        }

        const result = await deleteUser(fullName, email);
        res.json(result);
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

app.post("/success", (req, res) => {
  const data = req.body;
  insertUserData(data);
  res.render('success.ejs');
}) 

// app.get("/{*splat}", (req, res) => {
//    res.redirect("https://google.com");
//  });

const PORT = process.env.PORT || 3000;  

app.listen(PORT, () => {
  console.log(`server running at http://localhost:${PORT}`);
});

