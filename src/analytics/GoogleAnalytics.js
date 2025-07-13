// Google Analytics 4 Integration
// Implementação completa de tracking para JohnTech Store BR

class AnalyticsManager {
    constructor() {
        this.GA_MEASUREMENT_ID = 'G-XXXXXXXXXX'; // Substituir pelo ID real
        this.isInitialized = false;
        this.init();
    }

    // Inicializar Google Analytics 4
    init() {
        // Carregar gtag script
        const script1 = document.createElement('script');
        script1.async = true;
        script1.src = `https://www.googletagmanager.com/gtag/js?id=${this.GA_MEASUREMENT_ID}`;
        document.head.appendChild(script1);

        // Configurar gtag
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', this.GA_MEASUREMENT_ID, {
            // Enhanced Ecommerce
            send_page_view: true,
            // Privacy settings
            anonymize_ip: true,
            // Custom dimensions
            custom_map: {
                'custom_parameter_1': 'user_type'
            }
        });

        // Definir gtag globalmente
        window.gtag = gtag;
        this.isInitialized = true;

        console.log('📊 Google Analytics 4 inicializado');
    }

    // Rastrear eventos customizados
    trackEvent(eventName, parameters = {}) {
        if (!this.isInitialized) {
            console.warn('Analytics não inicializado');
            return;
        }

        gtag('event', eventName, {
            event_category: parameters.category || 'engagement',
            event_label: parameters.label || '',
            value: parameters.value || 0,
            ...parameters
        });

        console.log(`📊 Evento rastreado: ${eventName}`, parameters);
    }

    // Eventos específicos do JohnTech Store
    trackScannerUsage(productCode, success) {
        this.trackEvent('scanner_usage', {
            category: 'scanner',
            label: productCode,
            success: success,
            value: success ? 1 : 0
        });
    }

    trackBlingIntegration(action, success) {
        this.trackEvent('bling_integration', {
            category: 'api',
            label: action,
            success: success,
            value: success ? 1 : 0
        });
    }

    trackDashboardAction(action, details = {}) {
        this.trackEvent('dashboard_action', {
            category: 'dashboard',
            label: action,
            ...details
        });
    }

    trackCompetitiveAdvantage(feature) {
        this.trackEvent('competitive_advantage', {
            category: 'positioning',
            label: feature,
            value: 1
        });
    }

    // Conversion tracking
    trackConversion(type, value = 0) {
        gtag('event', 'conversion', {
            send_to: this.GA_MEASUREMENT_ID,
            event_category: 'conversion',
            event_label: type,
            value: value
        });
    }

    // Enhanced Ecommerce - Produto visualizado
    trackProductView(productData) {
        gtag('event', 'view_item', {
            currency: 'BRL',
            value: productData.price || 0,
            items: [{
                item_id: productData.id,
                item_name: productData.name,
                item_category: productData.category || 'product',
                quantity: 1,
                price: productData.price || 0
            }]
        });
    }

    // Enhanced Ecommerce - Busca
    trackSearch(searchTerm, results) {
        gtag('event', 'search', {
            search_term: searchTerm,
            event_category: 'search',
            event_label: `${results} resultados`
        });
    }

    // Page views customizadas
    trackPageView(pageName, customParameters = {}) {
        gtag('config', this.GA_MEASUREMENT_ID, {
            page_title: pageName,
            page_location: window.location.href,
            ...customParameters
        });
    }

    // User engagement
    trackEngagement(action, duration = 0) {
        this.trackEvent('user_engagement', {
            category: 'engagement',
            label: action,
            value: duration
        });
    }

    // Competitor comparison
    trackCompetitorComparison(feature, ourAdvantage) {
        this.trackEvent('competitor_comparison', {
            category: 'competitive',
            label: feature,
            our_advantage: ourAdvantage
        });
    }

    // Performance metrics
    trackPerformance(metric, value) {
        this.trackEvent('performance_metric', {
            category: 'performance',
            label: metric,
            value: value
        });
    }

    // Web Vitals tracking
    trackWebVitals() {
        // Core Web Vitals
        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (entry.entryType === 'navigation') {
                    const fcp = entry.firstContentfulPaint;
                    const lcp = entry.largestContentfulPaint;
                    
                    if (fcp) {
                        this.trackPerformance('first_contentful_paint', Math.round(fcp));
                    }
                    if (lcp) {
                        this.trackPerformance('largest_contentful_paint', Math.round(lcp));
                    }
                }
            }
        });

        if ('PerformanceObserver' in window) {
            observer.observe({ entryTypes: ['navigation', 'paint'] });
        }
    }
}

// Inicializar Analytics Manager
const analytics = new AnalyticsManager();

// Rastrear Web Vitals automaticamente
analytics.trackWebVitals();

// Auto-track common events
document.addEventListener('DOMContentLoaded', () => {
    analytics.trackPageView('JohnTech Store - Dashboard');
    
    // Track scanner button clicks
    const scannerButton = document.getElementById('openScanner');
    if (scannerButton) {
        scannerButton.addEventListener('click', () => {
            analytics.trackDashboardAction('scanner_opened');
        });
    }

    // Track competitive advantages
    const competitiveFeatures = [
        'web_platform',
        'instant_access', 
        'zero_cost',
        'bling_integration',
        'barcode_scanner'
    ];

    competitiveFeatures.forEach(feature => {
        analytics.trackCompetitiveAdvantage(feature);
    });
});

// Export para uso em outros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnalyticsManager;
}

// Global access
window.JohnTechAnalytics = analytics;
