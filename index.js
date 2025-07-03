import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import pool, { showDatabase, insertUserData, deleteUser, findUserByCredentials } from './database.js' ;
import radiusRoutes from './radius_routes.js';
import { formatBytes, formatDuration } from './radius_data.js';

// Load environment variables
dotenv.config();

const app = express();

// RADIUS Configuration from environment
const RADIUS_CONFIG = {
    server: process.env.RADIUS_SERVER || '41.191.232.2',
    nas_ip: process.env.NAS_IP || '154.119.81.23',
    secret: process.env.RADIUS_SECRET || 'testing123',
    auth_port: 1812,
    acct_port: 1813
};

app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static("/public"));

// Set up EJS globals
app.locals.formatBytes = formatBytes;
app.locals.formatDuration = formatDuration;
app.locals.RADIUS_CONFIG = RADIUS_CONFIG;

// RADIUS routes
app.use('/radius', radiusRoutes);

// API route for RADIUS server status
app.get('/api/radius-status', (req, res) => {
    res.json({
        radius_server: RADIUS_CONFIG.server,
        nas_ip: RADIUS_CONFIG.nas_ip,
        auth_port: RADIUS_CONFIG.auth_port,
        acct_port: RADIUS_CONFIG.acct_port,
        status: 'active',
        server_type: 'FreeRADIUS',
        timestamp: new Date().toISOString()
    });
});

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
  res.render("index.ejs", { error: null });
})

app.get("/admin", async (req, res) => {
    try {
        // Empty data array - no sample users
        const data = [];
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

// This route is no longer needed as the main page handles the form
// app.get("/wifi-login", (req, res) => {
//   res.render('wifi-login.ejs', { 
//     registrationSuccess: true, // Assume success for now
//     userName: 'Guest'
//   });
// });

// This route is no longer needed as the main page handles the form
// app.post("/wifi-auth", async (req, res) => {
//   try {
//     const { email, phone } = req.body;
//
//     // Server-side validation for login credentials
//     if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
//       return res.status(400).render('index.ejs', { error: 'Please enter a valid email address.', registrationSuccess: false });
//     }
//     if (!phone || !/^07\d{8}$/.test(phone)) {
//         return res.status(400).render('index.ejs', { error: 'Please enter a valid 10-digit phone number starting with 07.', registrationSuccess: false });
//     }
//
//     const user = await findUserByCredentials(email, phone);
//
//     if (user) {
//       // Successful authentication
//       res.render('wifi-connected.ejs', {
//         connectionSuccess: true,
//         networkName: 'TWT-Guest'
//       });
//     } else {
//       // Failed authentication
//       res.render('index.ejs', {
//         error: 'Invalid credentials. Please check your email and phone number.',
//         registrationSuccess: false
//       });
//     }
//   } catch (error) {
//     console.error('Error during WiFi authentication:', error);
//     res.status(500).render('error.ejs', { error: 'An authentication error occurred. Please try again later.' });
//   }
// }) 

app.post("/register", async (req, res) => {
  const data = req.body;
  // Server-side validation
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    return res.status(400).render('index.ejs', { error: 'A valid email address is required.' });
  }
  if (!data.phone || !/^07\d{8}$/.test(data.phone)) {
    return res.status(400).render('index.ejs', { error: 'A valid 10-digit phone number starting with 07 is required.' });
  }

  // Bypassing database logic for now
  // try {
    // const existingUser = await findUserByCredentials(data.email, data.phone);
    // if (!existingUser) {
    //     await insertUserData(data);
    // }
    
    res.redirect('/success');

  // } catch (error) {
  //   console.error('Error processing form:', error);
  //   res.status(500).render('error.ejs', { error: 'Failed to process your request. Please ensure the database is running.' });
  // }
});

// Serve the success page
app.get('/success', (req, res) => {
    res.render('success');
});

const PORT = process.env.PORT || 8024;
app.listen(PORT, () => {
  console.log(`server running at http://localhost:${PORT}`);
});

