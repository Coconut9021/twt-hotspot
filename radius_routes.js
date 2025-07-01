import express from 'express';
import { 
    getAccountingRecords, 
    getAuthRecords, 
    getUserData, 
    getUsageReports, 
    getActiveSessions,
    getDashboardStats 
} from './radius_data.js';

const router = express.Router();

// RADIUS Dashboard
router.get('/dashboard', async (req, res) => {
    try {
        const stats = await getDashboardStats();
        res.render('radius/dashboard', { stats });
    } catch (error) {
        console.error('Error loading RADIUS dashboard:', error);
        res.status(500).send('Error loading dashboard');
    }
});

// Accounting records
router.get('/accounting', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const records = await getAccountingRecords(page, limit);
        res.render('radius/accounting', { records, page, limit });
    } catch (error) {
        console.error('Error loading accounting records:', error);
        res.status(500).send('Error loading accounting records');
    }
});

// Authentication records
router.get('/auth', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const records = await getAuthRecords(page, limit);
        res.render('radius/auth', { records, page, limit });
    } catch (error) {
        console.error('Error loading auth records:', error);
        res.status(500).send('Error loading auth records');
    }
});

// User-specific data
router.get('/user/:username', async (req, res) => {
    try {
        const username = req.params.username;
        const userData = await getUserData(username);
        res.render('radius/user', { userData, username });
    } catch (error) {
        console.error('Error loading user data:', error);
        res.status(500).send('Error loading user data');
    }
});

// Data usage reports
router.get('/usage', async (req, res) => {
    try {
        const startDate = req.query.start_date;
        const endDate = req.query.end_date;
        const username = req.query.username;
        const usageData = await getUsageReports(startDate, endDate, username);
        res.render('radius/usage', { usageData, startDate, endDate, username });
    } catch (error) {
        console.error('Error loading usage reports:', error);
        res.status(500).send('Error loading usage reports');
    }
});

// Active sessions
router.get('/active', async (req, res) => {
    try {
        const activeSessions = await getActiveSessions();
        res.render('radius/active', { activeSessions });
    } catch (error) {
        console.error('Error loading active sessions:', error);
        res.status(500).send('Error loading active sessions');
    }
});

// API endpoints for AJAX requests
router.get('/api/stats', async (req, res) => {
    try {
        const stats = await getDashboardStats();
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/api/active-sessions', async (req, res) => {
    try {
        const sessions = await getActiveSessions();
        res.json(sessions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
