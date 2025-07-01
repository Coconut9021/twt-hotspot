import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class RadiusLogProcessor {
    constructor(options = {}) {
        this.logDirectory = options.logDirectory || '/var/log/freeradius';
        this.processInterval = options.processInterval || 30000; // 30 seconds
        this.isProcessing = false;
        this.lastProcessedTime = new Date();
    }

    start() {
        console.log('Starting RADIUS log processor...');
        this.processLogs();
        this.intervalId = setInterval(() => {
            this.processLogs();
        }, this.processInterval);
    }

    stop() {
        console.log('Stopping RADIUS log processor...');
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    async processLogs() {
        if (this.isProcessing) {
            console.log('Log processing already in progress, skipping...');
            return;
        }

        this.isProcessing = true;
        
        try {
            console.log('Processing RADIUS logs...');
            
            // Process different types of logs
            await this.processRadiusLog();
            await this.processAuthLog();
            
            this.lastProcessedTime = new Date();
            console.log('Log processing completed successfully');
            
        } catch (error) {
            console.error('Error processing logs:', error);
        } finally {
            this.isProcessing = false;
        }
    }

    async processRadiusLog() {
        const logFile = path.join(this.logDirectory, 'radius.log');
        
        if (!fs.existsSync(logFile)) {
            console.log('RADIUS log file not found:', logFile);
            return;
        }

        try {
            const stats = fs.statSync(logFile);
            if (stats.mtime <= this.lastProcessedTime) {
                console.log('No new entries in radius.log');
                return;
            }

            const logContent = fs.readFileSync(logFile, 'utf8');
            const lines = logContent.split('\n');
            
            for (const line of lines) {
                if (line.trim()) {
                    await this.parseRadiusLogLine(line);
                }
            }
            
        } catch (error) {
            console.error('Error processing radius.log:', error);
        }
    }

    async processAuthLog() {
        const logFile = path.join(this.logDirectory, 'auth.log');
        
        if (!fs.existsSync(logFile)) {
            console.log('Auth log file not found:', logFile);
            return;
        }

        try {
            const stats = fs.statSync(logFile);
            if (stats.mtime <= this.lastProcessedTime) {
                console.log('No new entries in auth.log');
                return;
            }

            const logContent = fs.readFileSync(logFile, 'utf8');
            const lines = logContent.split('\n');
            
            for (const line of lines) {
                if (line.trim()) {
                    await this.parseAuthLogLine(line);
                }
            }
            
        } catch (error) {
            console.error('Error processing auth.log:', error);
        }
    }

    async parseRadiusLogLine(line) {
        try {
            // Example line format: 
            // Mon Jan  1 12:00:00 2024 : Auth: Login OK: [user] (from client localhost port 0)
            
            const authMatch = line.match(/^(\w+\s+\w+\s+\d+\s+\d+:\d+:\d+\s+\d+)\s+:\s+Auth:\s+(.+):\s+\[([^\]]+)\]/);
            
            if (authMatch) {
                const [, timestamp, status, username] = authMatch;
                const authDate = new Date(timestamp);
                
                await this.insertAuthRecord({
                    username,
                    pass: status.includes('OK') ? 'Accept' : 'Reject',
                    reply: status,
                    authdate: authDate
                });
            }
            
        } catch (error) {
            console.error('Error parsing radius log line:', error, line);
        }
    }

    async parseAuthLogLine(line) {
        try {
            // Parse authentication log entries
            // This would depend on your specific log format
            
            const match = line.match(/^(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})\s+(.+)/);
            
            if (match) {
                const [, timestamp, message] = match;
                const authDate = new Date(timestamp);
                
                // Extract username and status from message
                const userMatch = message.match(/user\s+([^\s]+)/i);
                const username = userMatch ? userMatch[1] : 'unknown';
                
                const isSuccess = message.toLowerCase().includes('accept') || 
                                message.toLowerCase().includes('success');
                
                await this.insertAuthRecord({
                    username,
                    pass: isSuccess ? 'Accept' : 'Reject',
                    reply: message,
                    authdate: authDate
                });
            }
            
        } catch (error) {
            console.error('Error parsing auth log line:', error, line);
        }
    }

    async insertAuthRecord(record) {
        try {
            // Check if record already exists to avoid duplicates
            const [existing] = await pool.execute(
                'SELECT id FROM radpostauth WHERE username = ? AND authdate = ? AND reply = ?',
                [record.username, record.authdate, record.reply]
            );

            if (existing.length === 0) {
                await pool.execute(
                    'INSERT INTO radpostauth (username, pass, reply, authdate) VALUES (?, ?, ?, ?)',
                    [record.username, record.pass, record.reply, record.authdate]
                );
                console.log('Inserted auth record for user:', record.username);
            }
            
        } catch (error) {
            console.error('Error inserting auth record:', error);
        }
    }

    // Method to manually trigger log processing
    async forceProcess() {
        this.lastProcessedTime = new Date(0); // Reset to force processing
        await this.processLogs();
    }

    // Method to get processing status
    getStatus() {
        return {
            isProcessing: this.isProcessing,
            lastProcessedTime: this.lastProcessedTime,
            logDirectory: this.logDirectory,
            processInterval: this.processInterval
        };
    }
}

// Export both the class and a default instance
export default RadiusLogProcessor;

// Create and export a default instance
export const logProcessor = new RadiusLogProcessor();

// Auto-start if this file is run directly
if (process.argv[1] === __filename) {
    console.log('Starting RADIUS log processor as standalone service...');
    
    logProcessor.start();
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('Received SIGINT, shutting down gracefully...');
        logProcessor.stop();
        process.exit(0);
    });
    
    process.on('SIGTERM', () => {
        console.log('Received SIGTERM, shutting down gracefully...');
        logProcessor.stop();
        process.exit(0);
    });
}
