/**
 * 📊 SISTEMA DE MONITORAMENTO ENTERPRISE
 * ErrorReporter - Tracking e análise de erros em produção
 */

class ErrorReporter {
    constructor() {
        this.isProduction = window.location.hostname !== 'localhost';
        this.sessionId = this.generateSessionId();
        this.errorQueue = [];
        this.maxQueueSize = 50;
        this.flushInterval = 30000; // 30 segundos
        
        this.initializeErrorTracking();
        this.startPeriodicFlush();
    }

    /**
     * Gera ID único da sessão
     */
    generateSessionId() {
        return 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2);
    }

    /**
     * Inicializa tracking global de erros
     */
    initializeErrorTracking() {
        // Global error handler
        window.addEventListener('error', (event) => {
            this.reportError(event.error || new Error(event.message), {
                type: 'javascript_error',
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });
        });

        // Unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.reportError(new Error(event.reason), {
                type: 'unhandled_promise_rejection'
            });
        });

        // Performance monitoring
        if (typeof PerformanceObserver !== 'undefined') {
            this.initPerformanceMonitoring();
        }
    }

    /**
     * Monitoramento de performance
     */
    initPerformanceMonitoring() {
        try {
            // Largest Contentful Paint
            const lcpObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1];
                this.reportMetric('lcp', lastEntry.startTime);
            });
            lcpObserver.observe({entryTypes: ['largest-contentful-paint']});

            // First Input Delay
            const fidObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    this.reportMetric('fid', entry.processingStart - entry.startTime);
                });
            });
            fidObserver.observe({entryTypes: ['first-input']});

            // Cumulative Layout Shift
            const clsObserver = new PerformanceObserver((list) => {
                let clsValue = 0;
                const entries = list.getEntries();
                entries.forEach(entry => {
                    if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                    }
                });
                this.reportMetric('cls', clsValue);
            });
            clsObserver.observe({entryTypes: ['layout-shift']});

        } catch (error) {
            console.warn('Performance monitoring not supported:', error);
        }
    }

    /**
     * Reporta erro com contexto detalhado
     */
    reportError(error, context = {}) {
        const errorReport = {
            id: this.generateErrorId(),
            timestamp: new Date().toISOString(),
            sessionId: this.sessionId,
            error: {
                name: error.name,
                message: error.message,
                stack: error.stack,
                type: context.type || 'unknown'
            },
            context: {
                ...context,
                url: window.location.href,
                userAgent: navigator.userAgent,
                viewport: {
                    width: window.innerWidth,
                    height: window.innerHeight
                },
                timestamp: Date.now()
            },
            breadcrumbs: this.getBreadcrumbs(),
            user: this.getUserContext()
        };

        this.addToQueue(errorReport);
        
        // Log local para desenvolvimento
        if (!this.isProduction) {
            console.error('🚨 Error Report:', errorReport);
        }

        return errorReport.id;
    }

    /**
     * Reporta métricas de performance
     */
    reportMetric(name, value, context = {}) {
        const metricReport = {
            id: this.generateErrorId(),
            timestamp: new Date().toISOString(),
            sessionId: this.sessionId,
            type: 'metric',
            metric: {
                name,
                value,
                context
            },
            url: window.location.href
        };

        this.addToQueue(metricReport);

        if (!this.isProduction) {
            console.log(`📊 Metric [${name}]:`, value, 'ms');
        }
    }

    /**
     * Reporta evento customizado
     */
    reportEvent(eventName, data = {}, level = 'info') {
        const eventReport = {
            id: this.generateErrorId(),
            timestamp: new Date().toISOString(),
            sessionId: this.sessionId,
            type: 'event',
            event: {
                name: eventName,
                level,
                data
            },
            context: {
                url: window.location.href,
                timestamp: Date.now()
            }
        };

        this.addToQueue(eventReport);

        if (!this.isProduction) {
            console.log(`📝 Event [${eventName}]:`, data);
        }
    }

    /**
     * Adiciona item à fila de envio
     */
    addToQueue(item) {
        this.errorQueue.push(item);
        
        if (this.errorQueue.length >= this.maxQueueSize) {
            this.flush();
        }
    }

    /**
     * Envia dados para serviço de monitoramento
     */
    async flush() {
        if (this.errorQueue.length === 0) return;

        const dataToSend = [...this.errorQueue];
        this.errorQueue = [];

        try {
            // Em produção, enviar para serviço real (Sentry, LogRocket, etc.)
            if (this.isProduction) {
                await this.sendToMonitoringService(dataToSend);
            } else {
                console.log('📤 Flushing monitoring data:', dataToSend);
            }
        } catch (error) {
            console.warn('Failed to send monitoring data:', error);
            // Re-adicionar à fila em caso de erro
            this.errorQueue.unshift(...dataToSend);
        }
    }

    /**
     * Envia dados para serviço de monitoramento
     */
    async sendToMonitoringService(data) {
        // Implementação para serviço real de monitoramento
        const endpoint = '/api/monitoring'; // Endpoint fictício
        
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    project: 'johntechstore-br',
                    environment: this.isProduction ? 'production' : 'development',
                    data
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.warn('Monitoring service unavailable:', error);
            throw error;
        }
    }

    /**
     * Inicia flush periódico
     */
    startPeriodicFlush() {
        setInterval(() => {
            this.flush();
        }, this.flushInterval);

        // Flush ao sair da página
        window.addEventListener('beforeunload', () => {
            this.flush();
        });
    }

    /**
     * Gera ID único para erro
     */
    generateErrorId() {
        return 'err_' + Date.now() + '_' + Math.random().toString(36).substring(2);
    }

    /**
     * Obtém breadcrumbs (rastro de ações)
     */
    getBreadcrumbs() {
        // Implementação básica - em produção usar library específica
        return window.breadcrumbs || [];
    }

    /**
     * Obtém contexto do usuário
     */
    getUserContext() {
        const token = window.tokenManager?.getToken();
        return {
            authenticated: !!token,
            sessionDuration: Date.now() - this.sessionStartTime,
            hasRefreshToken: !!window.tokenManager?.getRefreshToken()
        };
    }

    /**
     * Relatório de saúde do sistema
     */
    getHealthReport() {
        return {
            sessionId: this.sessionId,
            queueSize: this.errorQueue.length,
            isMonitoring: true,
            lastFlush: this.lastFlushTime,
            environment: this.isProduction ? 'production' : 'development'
        };
    }

    /**
     * Configura contexto adicional
     */
    setContext(key, value) {
        if (!window.monitoringContext) {
            window.monitoringContext = {};
        }
        window.monitoringContext[key] = value;
    }

    /**
     * Adiciona breadcrumb manual
     */
    addBreadcrumb(message, category = 'manual', level = 'info') {
        if (!window.breadcrumbs) {
            window.breadcrumbs = [];
        }

        window.breadcrumbs.push({
            timestamp: new Date().toISOString(),
            message,
            category,
            level
        });

        // Manter apenas os últimos 50 breadcrumbs
        if (window.breadcrumbs.length > 50) {
            window.breadcrumbs.shift();
        }
    }
}

// Inicializar sistema de monitoramento
const errorReporter = new ErrorReporter();

// Export para uso global
window.ErrorReporter = ErrorReporter;
window.errorReporter = errorReporter;

// Helper functions globais
window.reportError = (error, context) => errorReporter.reportError(error, context);
window.reportEvent = (name, data, level) => errorReporter.reportEvent(name, data, level);
window.reportMetric = (name, value, context) => errorReporter.reportMetric(name, value, context);

export default errorReporter;
