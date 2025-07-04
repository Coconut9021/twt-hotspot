import express from 'express';
import radius from 'node-radius';
import bodyParser from 'body-parser';
import dgram from 'dgram';
import path from 'path';
import session from 'express-session';
import ejs from 'ejs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

import { config } from 'dotenv';
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(session({
    secret: process.env.RADIUS_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 3600000 } // 1 hour
}));

// In-memory store for authenticated users (use database in production)
const authenticatedUsers = new Map();

// RADIUS Authentication Function
function authenticateUser(username, password) {
    return new Promise((resolve, reject) => {
        const client = dgram.createSocket('udp4');
        
        // Create RADIUS packet
        const packet = radius.encode({
            code: 'Access-Request',
            secret: RADIUS_SECRET,
            identifier: Math.floor(Math.random() * 256),
            attributes: [
                ['User-Name', username],
                ['User-Password', password],
                ['NAS-IP-Address', NAS_IP6],
                ['NAS-Port', 0]
            ]
        });

        // Set timeout
        const timeout = setTimeout(() => {
            client.close();
            reject(new Error('RADIUS request timeout'));
        }, 5000);

        client.on('message', (msg, rinfo) => {
            clearTimeout(timeout);
            
            try {
                const response = radius.decode({
                    packet: msg,
                    secret: RADIUS_SECRET
                });

                if (response.code === 'Access-Accept') {
                    const replyMessage = response.attributes['Reply-Message'];
                    resolve({
                        success: true,
                        message: replyMessage || 'Authentication successful'
                    });
                } else {
                    resolve({
                        success: false,
                        message: 'Invalid credentials'
                    });
                }
            } catch (error) {
                reject(error);
            }
            
            client.close();
        });

        client.on('error', (error) => {
            clearTimeout(timeout);
            client.close();
            reject(error);
        });

        client.send(packet, 0, packet.length, process.env.RADIUS_PORT, process.env.RADIUS_SERVER);
    });
}

// Routes
app.get('/', (req, res) => {
    // Check if user is already authenticated
    if (req.session.authenticated) {
        return res.redirect('/success');
    }
    
    res.sendFile(path.join(__dirname, 'views', 'index.ejs'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.ejs'));
});

app.post('/authenticate', async (req, res) => {
    const { email, name } = req.body;
    
    if (!email || !name) {
        return res.status(400).json({
            success: false,
            message: 'Username and password are required'
        });
    }

    try {
        console.log(`Attempting authentication for user: ${email}`);
        const result = await authenticateUser(email, name);
        
        if (result.success) {
            // Store authentication in session
            req.session.authenticated = true;
            req.session.username = email;
            
            // Store in memory (use database in production)
            authenticatedUsers.set(email, {
                authenticatedAt: new Date(),
                ipAddress: req.ip,
                sessionId: req.sessionID
            });
            
            console.log(`User ${email} authenticated successfully`);
            res.json({
                success: true,
                message: result.message,
                redirectUrl: '/success'
            });
        } else {
            console.log(`Authentication failed for user: ${email}`);
            res.status(401).json({
                success: false,
                message: result.message
            });
        }
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({
            success: false,
            message: 'Authentication service unavailable'
        });
    }
});

app.get('/success', (req, res) => {
    if (!req.session.authenticated) {
        return res.redirect('/login');
    }
    
    res.sendFile(path.join(__dirname, 'public', 'success.ejs'));
});

app.get('/logout', (req, res) => {
    const username = req.session.email;
    
    // Remove from authenticated users
    if (username) {
        authenticatedUsers.delete(email);
    }
    
    // Destroy session
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
        }
        res.redirect('/login');
    });
});

// API endpoint to check authentication status
app.get('/api/status', (req, res) => {
    res.json({
        authenticated: !!req.session.authenticated,
        username: req.session.username || null,
        authenticatedUsers: Array.from(authenticatedUsers.keys())
    });
});

// Test RADIUS connection
app.get('/test-radius', async (req, res) => {
    try {
        const result = await authenticateUser('testuser', 'testpass');
        res.json({
            message: 'RADIUS test completed',
            result: result
        });
    } catch (error) {
        res.status(500).json({
            message: 'RADIUS test failed',
            error: error.message
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Captive Portal running on http://localhost:${process.env.PORT}`);
    console.log(`RADIUS Server: ${process.env.RADIUS_SERVER}:${process.env.RADIUS_PORT}`);
    console.log('Test users: testuser/testpass, admin/admin123');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down gracefully...');
    process.exit(0);
});