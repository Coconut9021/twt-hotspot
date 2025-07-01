#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ServiceManager {
    constructor() {
        this.processes = new Map();
        this.isShuttingDown = false;
        this.config = this.loadConfig();
    }

    loadConfig() {
        // Default configuration
        const defaultConfig = {
            services: {
                web: {
                    script: 'index.js',
                    enabled: true,
                    env: process.env.NODE_ENV || 'development'
                },
                logProcessor: {
                    script: 'radius_log_processor.js',
                    enabled: false, // Disabled by default
                    env: process.env.NODE_ENV || 'development'
                }
            },
            options: {
                restartOnCrash: true,
                maxRestarts: 5,
                restartDelay: 5000 // 5 seconds
            }
        };

        // Try to load custom config
        const configPath = path.join(__dirname, 'service-config.json');
        if (fs.existsSync(configPath)) {
            try {
                const customConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                return { ...defaultConfig, ...customConfig };
            } catch (error) {
                console.error('Error loading service config, using defaults:', error);
            }
        }

        return defaultConfig;
    }

    startService(serviceName, serviceConfig) {
        if (this.processes.has(serviceName)) {
            console.log(`Service ${serviceName} is already running`);
            return;
        }

        const scriptPath = path.join(__dirname, serviceConfig.script);
        
        if (!fs.existsSync(scriptPath)) {
            console.error(`Service script not found: ${scriptPath}`);
            return;
        }

        console.log(`Starting service: ${serviceName}`);
        
        const child = spawn('node', [scriptPath], {
            cwd: __dirname,
            env: {
                ...process.env,
                NODE_ENV: serviceConfig.env
            },
            stdio: ['pipe', 'pipe', 'pipe']
        });

        const processInfo = {
            process: child,
            restartCount: 0,
            lastRestart: Date.now(),
            config: serviceConfig
        };

        this.processes.set(serviceName, processInfo);

        // Handle stdout
        child.stdout.on('data', (data) => {
            console.log(`[${serviceName}] ${data.toString().trim()}`);
        });

        // Handle stderr
        child.stderr.on('data', (data) => {
            console.error(`[${serviceName}] ERROR: ${data.toString().trim()}`);
        });

        // Handle process exit
        child.on('exit', (code, signal) => {
            console.log(`[${serviceName}] Process exited with code ${code}, signal ${signal}`);
            this.processes.delete(serviceName);

            if (!this.isShuttingDown && this.config.options.restartOnCrash) {
                this.handleServiceCrash(serviceName, serviceConfig, processInfo);
            }
        });

        // Handle process error
        child.on('error', (error) => {
            console.error(`[${serviceName}] Process error:`, error);
        });

        console.log(`Service ${serviceName} started with PID: ${child.pid}`);
    }

    handleServiceCrash(serviceName, serviceConfig, processInfo) {
        if (processInfo.restartCount >= this.config.options.maxRestarts) {
            console.error(`Service ${serviceName} has crashed too many times, not restarting`);
            return;
        }

        const timeSinceLastRestart = Date.now() - processInfo.lastRestart;
        if (timeSinceLastRestart < this.config.options.restartDelay) {
            console.log(`Waiting ${this.config.options.restartDelay}ms before restarting ${serviceName}`);
            setTimeout(() => {
                this.restartService(serviceName, serviceConfig, processInfo);
            }, this.config.options.restartDelay);
        } else {
            this.restartService(serviceName, serviceConfig, processInfo);
        }
    }

    restartService(serviceName, serviceConfig, processInfo) {
        console.log(`Restarting service: ${serviceName} (attempt ${processInfo.restartCount + 1})`);
        processInfo.restartCount++;
        processInfo.lastRestart = Date.now();
        this.startService(serviceName, serviceConfig);
    }

    stopService(serviceName) {
        const processInfo = this.processes.get(serviceName);
        if (!processInfo) {
            console.log(`Service ${serviceName} is not running`);
            return;
        }

        console.log(`Stopping service: ${serviceName}`);
        processInfo.process.kill('SIGTERM');
        
        // Force kill after 10 seconds if process doesn't exit gracefully
        setTimeout(() => {
            if (this.processes.has(serviceName)) {
                console.log(`Force killing service: ${serviceName}`);
                processInfo.process.kill('SIGKILL');
            }
        }, 10000);
    }

    startAllServices() {
        console.log('Starting all enabled services...');
        
        for (const [serviceName, serviceConfig] of Object.entries(this.config.services)) {
            if (serviceConfig.enabled) {
                this.startService(serviceName, serviceConfig);
            } else {
                console.log(`Service ${serviceName} is disabled, skipping`);
            }
        }
    }

    stopAllServices() {
        console.log('Stopping all services...');
        this.isShuttingDown = true;
        
        for (const serviceName of this.processes.keys()) {
            this.stopService(serviceName);
        }
    }

    getStatus() {
        const status = {
            running: [],
            stopped: []
        };

        for (const [serviceName, serviceConfig] of Object.entries(this.config.services)) {
            if (this.processes.has(serviceName)) {
                const processInfo = this.processes.get(serviceName);
                status.running.push({
                    name: serviceName,
                    pid: processInfo.process.pid,
                    restartCount: processInfo.restartCount,
                    uptime: Date.now() - processInfo.lastRestart
                });
            } else {
                status.stopped.push({
                    name: serviceName,
                    enabled: serviceConfig.enabled
                });
            }
        }

        return status;
    }

    printStatus() {
        const status = this.getStatus();
        
        console.log('\n=== Service Status ===');
        
        if (status.running.length > 0) {
            console.log('\nRunning Services:');
            status.running.forEach(service => {
                const uptimeMinutes = Math.floor(service.uptime / 60000);
                console.log(`  ${service.name}: PID ${service.pid}, Uptime: ${uptimeMinutes}m, Restarts: ${service.restartCount}`);
            });
        }

        if (status.stopped.length > 0) {
            console.log('\nStopped Services:');
            status.stopped.forEach(service => {
                const enabledText = service.enabled ? '(enabled)' : '(disabled)';
                console.log(`  ${service.name}: Not running ${enabledText}`);
            });
        }
        
        console.log('');
    }
}

// Main execution
const serviceManager = new ServiceManager();

// Handle command line arguments
const command = process.argv[2];

switch (command) {
    case 'start':
        serviceManager.startAllServices();
        break;
    
    case 'stop':
        serviceManager.stopAllServices();
        setTimeout(() => process.exit(0), 2000);
        break;
    
    case 'restart':
        serviceManager.stopAllServices();
        setTimeout(() => {
            serviceManager.startAllServices();
        }, 2000);
        break;
    
    case 'status':
        serviceManager.printStatus();
        process.exit(0);
        break;
    
    case 'service':
        const serviceName = process.argv[3];
        const serviceAction = process.argv[4];
        
        if (!serviceName || !serviceAction) {
            console.error('Usage: node start.js service <service-name> <start|stop|restart>');
            process.exit(1);
        }
        
        const serviceConfig = serviceManager.config.services[serviceName];
        if (!serviceConfig) {
            console.error(`Unknown service: ${serviceName}`);
            process.exit(1);
        }
        
        switch (serviceAction) {
            case 'start':
                serviceManager.startService(serviceName, serviceConfig);
                break;
            case 'stop':
                serviceManager.stopService(serviceName);
                break;
            case 'restart':
                serviceManager.stopService(serviceName);
                setTimeout(() => {
                    serviceManager.startService(serviceName, serviceConfig);
                }, 2000);
                break;
            default:
                console.error('Invalid service action. Use: start, stop, or restart');
                process.exit(1);
        }
        break;
    
    default:
        console.log('TWT Hotspot Service Manager');
        console.log('Usage:');
        console.log('  node start.js start           - Start all enabled services');
        console.log('  node start.js stop            - Stop all services');
        console.log('  node start.js restart         - Restart all services');
        console.log('  node start.js status          - Show service status');
        console.log('  node start.js service <name> <action> - Control individual service');
        console.log('');
        console.log('Available services:');
        Object.keys(serviceManager.config.services).forEach(name => {
            const config = serviceManager.config.services[name];
            console.log(`  ${name} (${config.enabled ? 'enabled' : 'disabled'})`);
        });
        
        // If no command provided, start all services
        if (!command) {
            console.log('\nStarting all services...');
            serviceManager.startAllServices();
        }
        break;
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\nReceived SIGINT, shutting down gracefully...');
    serviceManager.stopAllServices();
    setTimeout(() => process.exit(0), 3000);
});

process.on('SIGTERM', () => {
    console.log('\nReceived SIGTERM, shutting down gracefully...');
    serviceManager.stopAllServices();
    setTimeout(() => process.exit(0), 3000);
});

// Keep the process alive if services are running
if (command === 'start' || !command) {
    setInterval(() => {
        if (serviceManager.processes.size === 0 && !serviceManager.isShuttingDown) {
            console.log('No services running, exiting...');
            process.exit(0);
        }
    }, 5000);
}
