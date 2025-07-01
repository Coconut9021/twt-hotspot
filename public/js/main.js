// Main JavaScript file for TWT Hotspot
(function() {
    'use strict';

    // Global utility functions
    window.TWT = {
        // Format bytes to human readable format
        formatBytes: function(bytes, decimals = 2) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const dm = decimals < 0 ? 0 : decimals;
            const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
        },

        // Format duration to human readable format
        formatDuration: function(seconds) {
            if (!seconds || seconds === 0) return '0s';
            
            const days = Math.floor(seconds / 86400);
            const hours = Math.floor((seconds % 86400) / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const secs = seconds % 60;
            
            let result = '';
            if (days > 0) result += `${days}d `;
            if (hours > 0) result += `${hours}h `;
            if (minutes > 0) result += `${minutes}m `;
            if (secs > 0 || result === '') result += `${secs}s`;
            
            return result.trim();
        },

        // Show notification
        showNotification: function(message, type = 'info', duration = 5000) {
            const alertDiv = document.createElement('div');
            alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
            alertDiv.style.cssText = 'top: 80px; right: 20px; z-index: 1050; min-width: 300px; max-width: 500px;';
            
            const iconMap = {
                'success': 'check-circle',
                'danger': 'exclamation-triangle',
                'warning': 'exclamation-circle',
                'info': 'info-circle'
            };
            
            alertDiv.innerHTML = `
                <i class="fas fa-${iconMap[type] || 'info-circle'} me-2"></i>
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            `;
            
            document.body.appendChild(alertDiv);
            
            // Auto-remove after duration
            setTimeout(() => {
                if (alertDiv.parentNode) {
                    alertDiv.remove();
                }
            }, duration);
            
            return alertDiv;
        },

        // Show loading state
        showLoading: function(element, text = 'Loading...') {
            if (element) {
                element.dataset.originalText = element.innerHTML;
                element.innerHTML = `<i class="fas fa-spinner fa-spin me-1"></i>${text}`;
                element.disabled = true;
            }
        },

        // Hide loading state
        hideLoading: function(element) {
            if (element && element.dataset.originalText) {
                element.innerHTML = element.dataset.originalText;
                element.disabled = false;
                delete element.dataset.originalText;
            }
        },

        // AJAX helper
        ajax: function(url, options = {}) {
            const defaultOptions = {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            };
            
            const config = Object.assign({}, defaultOptions, options);
            
            return fetch(url, config)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.json();
                })
                .catch(error => {
                    console.error('AJAX Error:', error);
                    this.showNotification('An error occurred while communicating with the server', 'danger');
                    throw error;
                });
        },

        // Confirm dialog
        confirm: function(message, title = 'Confirm Action') {
            return new Promise((resolve) => {
                const modal = document.createElement('div');
                modal.className = 'modal fade';
                modal.innerHTML = `
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">${title}</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <p>${message}</p>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                <button type="button" class="btn btn-danger" id="confirm-yes">Confirm</button>
                            </div>
                        </div>
                    </div>
                `;
                
                document.body.appendChild(modal);
                
                const bsModal = new bootstrap.Modal(modal);
                bsModal.show();
                
                modal.querySelector('#confirm-yes').addEventListener('click', () => {
                    bsModal.hide();
                    resolve(true);
                });
                
                modal.addEventListener('hidden.bs.modal', () => {
                    modal.remove();
                    resolve(false);
                });
            });
        },

        // Copy to clipboard
        copyToClipboard: function(text) {
            if (navigator.clipboard) {
                navigator.clipboard.writeText(text).then(() => {
                    this.showNotification('Copied to clipboard', 'success', 2000);
                }).catch(() => {
                    this.fallbackCopyToClipboard(text);
                });
            } else {
                this.fallbackCopyToClipboard(text);
            }
        },

        // Fallback copy to clipboard
        fallbackCopyToClipboard: function(text) {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            try {
                document.execCommand('copy');
                this.showNotification('Copied to clipboard', 'success', 2000);
            } catch (err) {
                this.showNotification('Failed to copy to clipboard', 'danger');
            }
            
            document.body.removeChild(textArea);
        }
    };

    // System status checker
    class SystemStatus {
        constructor() {
            this.checkInterval = 60000; // 1 minute
            this.isChecking = false;
            this.lastCheck = null;
        }

        async checkStatus() {
            if (this.isChecking) return;
            this.isChecking = true;

            try {
                const response = await fetch('/api/system-status');
                const data = await response.json();
                this.updateStatusIndicators(data);
                this.lastCheck = new Date();
            } catch (error) {
                console.error('Error checking system status:', error);
                this.updateStatusIndicators({ error: true });
            } finally {
                this.isChecking = false;
            }
        }

        updateStatusIndicators(status) {
            // Update database status
            const dbIndicator = document.querySelector('.status-database');
            if (dbIndicator) {
                dbIndicator.className = `fas fa-circle ${status.database ? 'text-success' : 'text-danger'}`;
            }

            // Update RADIUS status
            const radiusIndicator = document.querySelector('.status-radius');
            if (radiusIndicator) {
                radiusIndicator.className = `fas fa-circle ${status.radius ? 'text-success' : 'text-danger'}`;
            }

            // Update status text
            const radiusStatusText = document.getElementById('radius-status');
            if (radiusStatusText) {
                radiusStatusText.textContent = status.radius ? 'Online' : 'Offline';
            }
        }

        start() {
            this.checkStatus();
            setInterval(() => this.checkStatus(), this.checkInterval);
        }
    }

    // Real-time updates
    class RealTimeUpdates {
        constructor() {
            this.updateInterval = 30000; // 30 seconds
            this.enabled = false;
        }

        start() {
            if (this.enabled) return;
            this.enabled = true;
            
            this.intervalId = setInterval(() => {
                this.updateDashboardStats();
                this.updateActiveSessions();
            }, this.updateInterval);
        }

        stop() {
            if (!this.enabled) return;
            this.enabled = false;
            
            if (this.intervalId) {
                clearInterval(this.intervalId);
                this.intervalId = null;
            }
        }

        async updateDashboardStats() {
            try {
                const response = await fetch('/radius/api/stats');
                const stats = await response.json();
                
                // Update stat cards
                this.updateStatCard('active-sessions', stats.active_sessions);
                this.updateStatCard('users-24h', stats.users_24h);
                this.updateStatCard('data-24h', TWT.formatBytes(stats.data_24h));
                this.updateStatCard('auth-1h', stats.auth_1h);
                
            } catch (error) {
                console.error('Error updating dashboard stats:', error);
            }
        }

        updateStatCard(id, value) {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        }

        async updateActiveSessions() {
            try {
                const response = await fetch('/radius/api/active-sessions');
                const sessions = await response.json();
                
                // Update active sessions count
                const activeSessionsCount = document.getElementById('active-sessions-count');
                if (activeSessionsCount) {
                    activeSessionsCount.textContent = sessions.length;
                }
                
            } catch (error) {
                console.error('Error updating active sessions:', error);
            }
        }
    }

    // Data tables helper
    class DataTableHelper {
        constructor(tableId, options = {}) {
            this.tableId = tableId;
            this.options = {
                pageSize: 25,
                sortable: true,
                searchable: true,
                ...options
            };
            this.currentPage = 1;
            this.sortColumn = null;
            this.sortDirection = 'asc';
            this.searchTerm = '';
        }

        init() {
            const table = document.getElementById(this.tableId);
            if (!table) return;

            this.addSortingHandlers(table);
            this.addSearchHandler();
            this.addPaginationHandlers();
        }

        addSortingHandlers(table) {
            if (!this.options.sortable) return;

            const headers = table.querySelectorAll('th[data-sortable]');
            headers.forEach(header => {
                header.style.cursor = 'pointer';
                header.addEventListener('click', () => {
                    const column = header.dataset.sortable;
                    this.sort(column);
                });
            });
        }

        sort(column) {
            if (this.sortColumn === column) {
                this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                this.sortColumn = column;
                this.sortDirection = 'asc';
            }
            
            // Emit sort event
            this.emit('sort', {
                column: this.sortColumn,
                direction: this.sortDirection
            });
        }

        emit(eventName, data) {
            const event = new CustomEvent(`datatable:${eventName}`, { detail: data });
            document.dispatchEvent(event);
        }
    }

    // Form validation helper
    class FormValidator {
        constructor(formId) {
            this.form = document.getElementById(formId);
            this.errors = {};
        }

        addRule(fieldName, validator, message) {
            if (!this.form) return;
            
            const field = this.form.querySelector(`[name="${fieldName}"]`);
            if (!field) return;

            field.addEventListener('blur', () => {
                this.validateField(fieldName, validator, message);
            });
        }

        validateField(fieldName, validator, message) {
            const field = this.form.querySelector(`[name="${fieldName}"]`);
            if (!field) return;

            const isValid = validator(field.value);
            
            if (isValid) {
                this.clearFieldError(fieldName);
            } else {
                this.showFieldError(fieldName, message);
            }

            return isValid;
        }

        showFieldError(fieldName, message) {
            const field = this.form.querySelector(`[name="${fieldName}"]`);
            if (!field) return;

            field.classList.add('is-invalid');
            
            let errorDiv = field.parentNode.querySelector('.invalid-feedback');
            if (!errorDiv) {
                errorDiv = document.createElement('div');
                errorDiv.className = 'invalid-feedback';
                field.parentNode.appendChild(errorDiv);
            }
            
            errorDiv.textContent = message;
            this.errors[fieldName] = message;
        }

        clearFieldError(fieldName) {
            const field = this.form.querySelector(`[name="${fieldName}"]`);
            if (!field) return;

            field.classList.remove('is-invalid');
            
            const errorDiv = field.parentNode.querySelector('.invalid-feedback');
            if (errorDiv) {
                errorDiv.remove();
            }
            
            delete this.errors[fieldName];
        }

        isValid() {
            return Object.keys(this.errors).length === 0;
        }
    }

    // Initialize everything when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        // Initialize system status checker
        const systemStatus = new SystemStatus();
        systemStatus.start();

        // Initialize real-time updates on dashboard
        if (document.body.classList.contains('dashboard-page')) {
            const realTimeUpdates = new RealTimeUpdates();
            realTimeUpdates.start();
        }

        // Initialize tooltips
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });

        // Initialize popovers
        const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
        popoverTriggerList.map(function (popoverTriggerEl) {
            return new bootstrap.Popover(popoverTriggerEl);
        });

        // Add copy-to-clipboard functionality
        document.querySelectorAll('[data-copy]').forEach(element => {
            element.addEventListener('click', function() {
                const text = this.dataset.copy || this.textContent;
                TWT.copyToClipboard(text);
            });
        });

        // Handle form submissions with loading states
        document.querySelectorAll('form[data-loading]').forEach(form => {
            form.addEventListener('submit', function(e) {
                const submitButton = this.querySelector('button[type="submit"]');
                if (submitButton) {
                    TWT.showLoading(submitButton);
                }
            });
        });

        // Auto-hide alerts after 5 seconds
        document.querySelectorAll('.alert:not(.alert-permanent)').forEach(alert => {
            setTimeout(() => {
                const bsAlert = new bootstrap.Alert(alert);
                bsAlert.close();
            }, 5000);
        });

        // Confirm delete actions
        document.querySelectorAll('[data-confirm-delete]').forEach(element => {
            element.addEventListener('click', async function(e) {
                e.preventDefault();
                
                const message = this.dataset.confirmDelete || 'Are you sure you want to delete this item?';
                const confirmed = await TWT.confirm(message, 'Confirm Delete');
                
                if (confirmed) {
                    // If it's a form, submit it
                    if (this.form) {
                        this.form.submit();
                    }
                    // If it's a link, follow it
                    else if (this.href) {
                        window.location.href = this.href;
                    }
                    // If it has an onclick, execute it
                    else if (this.onclick) {
                        this.onclick();
                    }
                }
            });
        });

        // Add smooth scrolling to anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    });

    // Expose classes globally
    window.TWT.SystemStatus = SystemStatus;
    window.TWT.RealTimeUpdates = RealTimeUpdates;
    window.TWT.DataTableHelper = DataTableHelper;
    window.TWT.FormValidator = FormValidator;

})();
