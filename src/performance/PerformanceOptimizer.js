/**
 * ⚡ PERFORMANCE OPTIMIZER ENTERPRISE
 * Sistema avançado de otimização de performance
 */

class PerformanceOptimizer {
    constructor() {
        this.cache = new Map();
        this.debounceTimers = new Map();
        this.intersectionObserver = null;
        this.performanceMetrics = {};
        
        this.initializeLazyLoading();
        this.initializeImageOptimization();
        this.initializeResourcePreloading();
        this.measureCoreWebVitals();
    }

    /**
     * Debounce function otimizada
     */
    debounce(func, wait, key = 'default') {
        return (...args) => {
            if (this.debounceTimers.has(key)) {
                clearTimeout(this.debounceTimers.get(key));
            }
            
            const timer = setTimeout(() => {
                this.debounceTimers.delete(key);
                func.apply(this, args);
            }, wait);
            
            this.debounceTimers.set(key, timer);
        };
    }

    /**
     * Throttle function para eventos de alta frequência
     */
    throttle(func, limit, key = 'default') {
        let inThrottle;
        return (...args) => {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * Cache inteligente com TTL
     */
    setCache(key, value, ttl = 300000) { // 5 minutos padrão
        this.cache.set(key, {
            value,
            expires: Date.now() + ttl
        });
    }

    /**
     * Recupera do cache com verificação de expiração
     */
    getCache(key) {
        const item = this.cache.get(key);
        if (!item) return null;
        
        if (Date.now() > item.expires) {
            this.cache.delete(key);
            return null;
        }
        
        return item.value;
    }

    /**
     * Lazy loading para imagens e conteúdo
     */
    initializeLazyLoading() {
        if ('IntersectionObserver' in window) {
            this.intersectionObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const element = entry.target;
                        
                        if (element.dataset.src) {
                            element.src = element.dataset.src;
                            element.removeAttribute('data-src');
                        }
                        
                        if (element.dataset.background) {
                            element.style.backgroundImage = `url(${element.dataset.background})`;
                            element.removeAttribute('data-background');
                        }
                        
                        element.classList.add('loaded');
                        this.intersectionObserver.unobserve(element);
                    }
                });
            }, {
                rootMargin: '50px 0px',
                threshold: 0.01
            });

            // Auto-aplicar em imagens com data-src
            this.observeLazyElements();
        }
    }

    /**
     * Observa elementos para lazy loading
     */
    observeLazyElements() {
        const lazyElements = document.querySelectorAll('[data-src], [data-background]');
        lazyElements.forEach(element => {
            this.intersectionObserver.observe(element);
        });
    }

    /**
     * Otimização de imagens dinâmica
     */
    initializeImageOptimization() {
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            if (!img.loading) {
                img.loading = 'lazy';
            }
            
            // Decode assíncrono para imagens críticas
            if (img.classList.contains('critical')) {
                img.decoding = 'async';
            }
        });
    }

    /**
     * Preload de recursos críticos
     */
    initializeResourcePreloading() {
        // Preload de fontes críticas
        this.preloadResource('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap', 'style');
        
        // Preload de APIs críticas
        this.preloadAPIEndpoints([
            'https://api.bling.com.br/Api/v3/produtos',
            'https://www.bling.com.br/Api/v3/oauth/token'
        ]);
    }

    /**
     * Preload genérico de recursos
     */
    preloadResource(href, as = 'fetch', crossorigin = 'anonymous') {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = href;
        link.as = as;
        if (crossorigin) link.crossOrigin = crossorigin;
        document.head.appendChild(link);
    }

    /**
     * Warming de endpoints de API
     */
    preloadAPIEndpoints(endpoints) {
        endpoints.forEach(endpoint => {
            // DNS prefetch
            const url = new URL(endpoint);
            const dnsLink = document.createElement('link');
            dnsLink.rel = 'dns-prefetch';
            dnsLink.href = url.origin;
            document.head.appendChild(dnsLink);
            
            // Preconnect para HTTPS
            if (url.protocol === 'https:') {
                const preconnectLink = document.createElement('link');
                preconnectLink.rel = 'preconnect';
                preconnectLink.href = url.origin;
                preconnectLink.crossOrigin = 'anonymous';
                document.head.appendChild(preconnectLink);
            }
        });
    }

    /**
     * Medição de Core Web Vitals
     */
    measureCoreWebVitals() {
        // Largest Contentful Paint
        this.measureLCP();
        
        // First Input Delay
        this.measureFID();
        
        // Cumulative Layout Shift
        this.measureCLS();
        
        // Time to First Byte
        this.measureTTFB();
    }

    /**
     * Measure Largest Contentful Paint
     */
    measureLCP() {
        if ('PerformanceObserver' in window) {
            try {
                const observer = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    this.performanceMetrics.lcp = lastEntry.startTime;
                    
                    if (window.reportMetric) {
                        window.reportMetric('lcp', lastEntry.startTime);
                    }
                });
                observer.observe({entryTypes: ['largest-contentful-paint']});
            } catch (error) {
                console.warn('LCP measurement not supported');
            }
        }
    }

    /**
     * Measure First Input Delay
     */
    measureFID() {
        if ('PerformanceObserver' in window) {
            try {
                const observer = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach(entry => {
                        const fid = entry.processingStart - entry.startTime;
                        this.performanceMetrics.fid = fid;
                        
                        if (window.reportMetric) {
                            window.reportMetric('fid', fid);
                        }
                    });
                });
                observer.observe({entryTypes: ['first-input']});
            } catch (error) {
                console.warn('FID measurement not supported');
            }
        }
    }

    /**
     * Measure Cumulative Layout Shift
     */
    measureCLS() {
        if ('PerformanceObserver' in window) {
            try {
                let clsValue = 0;
                const observer = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach(entry => {
                        if (!entry.hadRecentInput) {
                            clsValue += entry.value;
                        }
                    });
                    this.performanceMetrics.cls = clsValue;
                    
                    if (window.reportMetric) {
                        window.reportMetric('cls', clsValue);
                    }
                });
                observer.observe({entryTypes: ['layout-shift']});
            } catch (error) {
                console.warn('CLS measurement not supported');
            }
        }
    }

    /**
     * Measure Time to First Byte
     */
    measureTTFB() {
        if ('performance' in window && 'getEntriesByType' in performance) {
            const navigation = performance.getEntriesByType('navigation')[0];
            if (navigation) {
                const ttfb = navigation.responseStart - navigation.requestStart;
                this.performanceMetrics.ttfb = ttfb;
                
                if (window.reportMetric) {
                    window.reportMetric('ttfb', ttfb);
                }
            }
        }
    }

    /**
     * Virtual Scrolling para listas grandes
     */
    createVirtualList(container, items, itemHeight, renderItem) {
        const containerHeight = container.clientHeight;
        const visibleCount = Math.ceil(containerHeight / itemHeight);
        const buffer = 3; // Buffer de itens extras
        
        let scrollTop = 0;
        let startIndex = 0;
        let endIndex = Math.min(visibleCount + buffer, items.length);
        
        const renderList = () => {
            container.innerHTML = '';
            
            // Spacer superior
            if (startIndex > 0) {
                const topSpacer = document.createElement('div');
                topSpacer.style.height = `${startIndex * itemHeight}px`;
                container.appendChild(topSpacer);
            }
            
            // Itens visíveis
            for (let i = startIndex; i < endIndex; i++) {
                const element = renderItem(items[i], i);
                element.style.height = `${itemHeight}px`;
                container.appendChild(element);
            }
            
            // Spacer inferior
            if (endIndex < items.length) {
                const bottomSpacer = document.createElement('div');
                bottomSpacer.style.height = `${(items.length - endIndex) * itemHeight}px`;
                container.appendChild(bottomSpacer);
            }
        };
        
        const handleScroll = this.throttle(() => {
            scrollTop = container.scrollTop;
            startIndex = Math.floor(scrollTop / itemHeight);
            endIndex = Math.min(startIndex + visibleCount + buffer, items.length);
            renderList();
        }, 16); // 60fps
        
        container.addEventListener('scroll', handleScroll);
        renderList();
        
        return {
            updateItems: (newItems) => {
                items = newItems;
                endIndex = Math.min(visibleCount + buffer, items.length);
                renderList();
            },
            destroy: () => {
                container.removeEventListener('scroll', handleScroll);
            }
        };
    }

    /**
     * Otimização de requests com cache e retry
     */
    async optimizedFetch(url, options = {}) {
        const cacheKey = `fetch_${url}_${JSON.stringify(options)}`;
        
        // Verificar cache primeiro
        const cached = this.getCache(cacheKey);
        if (cached) {
            return cached;
        }
        
        const defaultOptions = {
            retry: 3,
            timeout: 10000,
            ...options
        };
        
        for (let attempt = 1; attempt <= defaultOptions.retry; attempt++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), defaultOptions.timeout);
                
                const response = await fetch(url, {
                    ...defaultOptions,
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const data = await response.json();
                
                // Cache successful responses
                this.setCache(cacheKey, data, 300000); // 5 minutos
                
                return data;
                
            } catch (error) {
                if (attempt === defaultOptions.retry) {
                    if (window.reportError) {
                        window.reportError(error, {
                            type: 'fetch_error',
                            url,
                            attempt
                        });
                    }
                    throw error;
                }
                
                // Exponential backoff
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
            }
        }
    }

    /**
     * Service Worker registration para cache avançado
     */
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('Service Worker registrado:', registration);
                return registration;
            } catch (error) {
                console.error('Erro ao registrar Service Worker:', error);
                if (window.reportError) {
                    window.reportError(error, { type: 'service_worker_registration' });
                }
            }
        }
    }

    /**
     * Relatório de performance
     */
    getPerformanceReport() {
        return {
            metrics: this.performanceMetrics,
            cacheSize: this.cache.size,
            timers: this.debounceTimers.size,
            timestamp: new Date().toISOString(),
            navigation: performance.getEntriesByType('navigation')[0],
            resources: performance.getEntriesByType('resource').length
        };
    }

    /**
     * Cleanup de recursos
     */
    cleanup() {
        this.cache.clear();
        this.debounceTimers.forEach(timer => clearTimeout(timer));
        this.debounceTimers.clear();
        
        if (this.intersectionObserver) {
            this.intersectionObserver.disconnect();
        }
    }
}

// Inicializar otimizador
const performanceOptimizer = new PerformanceOptimizer();

// Export para uso global
window.PerformanceOptimizer = PerformanceOptimizer;
window.performanceOptimizer = performanceOptimizer;

// Registrar Service Worker automaticamente
performanceOptimizer.registerServiceWorker();

export default performanceOptimizer;
