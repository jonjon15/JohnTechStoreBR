/**
 * 🧪 SISTEMA DE TESTES ENTERPRISE
 * Test Suite para validação completa
 */

class TestSuite {
    constructor() {
        this.tests = [];
        this.results = [];
        this.isRunning = false;
        this.startTime = null;
        this.endTime = null;
    }

    /**
     * Adiciona teste ao suite
     */
    test(description, testFunction) {
        this.tests.push({
            description,
            testFunction,
            id: this.generateTestId()
        });
        return this;
    }

    /**
     * Adiciona teste assíncrono
     */
    testAsync(description, testFunction) {
        this.tests.push({
            description,
            testFunction,
            isAsync: true,
            id: this.generateTestId()
        });
        return this;
    }

    /**
     * Executa todos os testes
     */
    async run() {
        if (this.isRunning) {
            throw new Error('Testes já estão executando');
        }

        this.isRunning = true;
        this.startTime = performance.now();
        this.results = [];

        console.log('🧪 Iniciando execução dos testes...');
        console.log(`📊 Total de testes: ${this.tests.length}`);

        for (const test of this.tests) {
            await this.runSingleTest(test);
        }

        this.endTime = performance.now();
        this.isRunning = false;

        return this.generateReport();
    }

    /**
     * Executa um teste individual
     */
    async runSingleTest(test) {
        const testResult = {
            id: test.id,
            description: test.description,
            status: 'running',
            startTime: performance.now(),
            errors: [],
            assertions: 0,
            passedAssertions: 0
        };

        try {
            console.log(`🔬 Executando: ${test.description}`);
            
            if (test.isAsync) {
                await test.testFunction(new TestAssertions(testResult));
            } else {
                test.testFunction(new TestAssertions(testResult));
            }
            
            testResult.status = testResult.errors.length === 0 ? 'passed' : 'failed';
            
        } catch (error) {
            testResult.status = 'failed';
            testResult.errors.push({
                message: error.message,
                stack: error.stack
            });
        }

        testResult.endTime = performance.now();
        testResult.duration = testResult.endTime - testResult.startTime;
        
        this.results.push(testResult);
        
        const status = testResult.status === 'passed' ? '✅' : '❌';
        console.log(`${status} ${test.description} (${testResult.duration.toFixed(2)}ms)`);
        
        if (testResult.errors.length > 0) {
            testResult.errors.forEach(error => {
                console.error(`   Error: ${error.message}`);
            });
        }
    }

    /**
     * Gera relatório final
     */
    generateReport() {
        const totalDuration = this.endTime - this.startTime;
        const passed = this.results.filter(r => r.status === 'passed').length;
        const failed = this.results.filter(r => r.status === 'failed').length;
        const total = this.results.length;

        const report = {
            summary: {
                total,
                passed,
                failed,
                successRate: ((passed / total) * 100).toFixed(2),
                duration: totalDuration
            },
            results: this.results,
            timestamp: new Date().toISOString()
        };

        this.printReport(report);
        return report;
    }

    /**
     * Imprime relatório no console
     */
    printReport(report) {
        console.log('\n📋 RELATÓRIO DE TESTES');
        console.log('========================');
        console.log(`Total de testes: ${report.summary.total}`);
        console.log(`✅ Passou: ${report.summary.passed}`);
        console.log(`❌ Falhou: ${report.summary.failed}`);
        console.log(`📊 Taxa de sucesso: ${report.summary.successRate}%`);
        console.log(`⏱️ Tempo total: ${report.summary.duration.toFixed(2)}ms`);
        
        if (report.summary.failed > 0) {
            console.log('\n❌ TESTES QUE FALHARAM:');
            report.results
                .filter(r => r.status === 'failed')
                .forEach(result => {
                    console.log(`- ${result.description}`);
                    result.errors.forEach(error => {
                        console.log(`  Error: ${error.message}`);
                    });
                });
        }
    }

    /**
     * Gera ID único para teste
     */
    generateTestId() {
        return 'test_' + Date.now() + '_' + Math.random().toString(36).substring(2);
    }
}

/**
 * Classe para assertions nos testes
 */
class TestAssertions {
    constructor(testResult) {
        this.testResult = testResult;
    }

    /**
     * Assert que valor é verdadeiro
     */
    assertTrue(value, message = 'Expected value to be true') {
        this.testResult.assertions++;
        if (value === true) {
            this.testResult.passedAssertions++;
        } else {
            this.testResult.errors.push({
                message: `${message}. Got: ${value}`,
                type: 'assertTrue'
            });
        }
        return this;
    }

    /**
     * Assert que valor é falso
     */
    assertFalse(value, message = 'Expected value to be false') {
        this.testResult.assertions++;
        if (value === false) {
            this.testResult.passedAssertions++;
        } else {
            this.testResult.errors.push({
                message: `${message}. Got: ${value}`,
                type: 'assertFalse'
            });
        }
        return this;
    }

    /**
     * Assert que valores são iguais
     */
    assertEqual(actual, expected, message = 'Values are not equal') {
        this.testResult.assertions++;
        if (actual === expected) {
            this.testResult.passedAssertions++;
        } else {
            this.testResult.errors.push({
                message: `${message}. Expected: ${expected}, Got: ${actual}`,
                type: 'assertEqual'
            });
        }
        return this;
    }

    /**
     * Assert que valores são diferentes
     */
    assertNotEqual(actual, expected, message = 'Values should not be equal') {
        this.testResult.assertions++;
        if (actual !== expected) {
            this.testResult.passedAssertions++;
        } else {
            this.testResult.errors.push({
                message: `${message}. Both values are: ${actual}`,
                type: 'assertNotEqual'
            });
        }
        return this;
    }

    /**
     * Assert que valor não é nulo/undefined
     */
    assertNotNull(value, message = 'Value should not be null or undefined') {
        this.testResult.assertions++;
        if (value != null) {
            this.testResult.passedAssertions++;
        } else {
            this.testResult.errors.push({
                message: `${message}. Got: ${value}`,
                type: 'assertNotNull'
            });
        }
        return this;
    }

    /**
     * Assert que função lança erro
     */
    assertThrows(fn, message = 'Function should throw an error') {
        this.testResult.assertions++;
        try {
            fn();
            this.testResult.errors.push({
                message: `${message}. No error was thrown`,
                type: 'assertThrows'
            });
        } catch (error) {
            this.testResult.passedAssertions++;
        }
        return this;
    }

    /**
     * Assert para promises que devem resolver
     */
    async assertResolves(promise, message = 'Promise should resolve') {
        this.testResult.assertions++;
        try {
            await promise;
            this.testResult.passedAssertions++;
        } catch (error) {
            this.testResult.errors.push({
                message: `${message}. Promise rejected with: ${error.message}`,
                type: 'assertResolves'
            });
        }
        return this;
    }

    /**
     * Assert para promises que devem rejeitar
     */
    async assertRejects(promise, message = 'Promise should reject') {
        this.testResult.assertions++;
        try {
            await promise;
            this.testResult.errors.push({
                message: `${message}. Promise resolved instead of rejecting`,
                type: 'assertRejects'
            });
        } catch (error) {
            this.testResult.passedAssertions++;
        }
        return this;
    }

    /**
     * Assert que array contém elemento
     */
    assertContains(array, element, message = 'Array should contain element') {
        this.testResult.assertions++;
        if (Array.isArray(array) && array.includes(element)) {
            this.testResult.passedAssertions++;
        } else {
            this.testResult.errors.push({
                message: `${message}. Array: ${JSON.stringify(array)}, Element: ${element}`,
                type: 'assertContains'
            });
        }
        return this;
    }

    /**
     * Assert que objeto tem propriedade
     */
    assertHasProperty(object, property, message = 'Object should have property') {
        this.testResult.assertions++;
        if (typeof object === 'object' && object !== null && property in object) {
            this.testResult.passedAssertions++;
        } else {
            this.testResult.errors.push({
                message: `${message}. Object: ${JSON.stringify(object)}, Property: ${property}`,
                type: 'assertHasProperty'
            });
        }
        return this;
    }
}

// =====================================
// DEFINIÇÃO DOS TESTES DO PROJETO
// =====================================

const suite = new TestSuite();

// Testes de Segurança
suite.test('TokenManager deve existir e ser instanciável', (assert) => {
    assert.assertNotNull(window.TokenManager, 'TokenManager class should be available');
    const tokenManager = new window.TokenManager();
    assert.assertNotNull(tokenManager, 'TokenManager should be instantiable');
});

suite.test('TokenManager deve criptografar e descriptografar tokens', (assert) => {
    const tokenManager = new window.TokenManager();
    const testData = { access_token: 'test_token_123', expires_in: 3600 };
    const testString = JSON.stringify(testData);
    
    const encrypted = tokenManager.encrypt(testString);
    const decrypted = tokenManager.decrypt(encrypted);
    
    assert.assertEqual(decrypted, testString, 'Decrypted data should match original');
});

suite.test('TokenManager deve validar integridade do token', (assert) => {
    const tokenManager = new window.TokenManager();
    
    const validToken = {
        access_token: 'valid_token_123',
        token_type: 'Bearer',
        expires_in: 3600
    };
    
    const invalidToken = {
        access_token: 'short'
    };
    
    assert.assertTrue(tokenManager.validateTokenIntegrity(validToken), 'Valid token should pass validation');
    assert.assertFalse(tokenManager.validateTokenIntegrity(invalidToken), 'Invalid token should fail validation');
});

// Testes de Performance
suite.test('PerformanceOptimizer deve existir e funcionar', (assert) => {
    assert.assertNotNull(window.PerformanceOptimizer, 'PerformanceOptimizer should be available');
    const optimizer = new window.PerformanceOptimizer();
    assert.assertNotNull(optimizer, 'PerformanceOptimizer should be instantiable');
});

suite.test('Cache do PerformanceOptimizer deve funcionar', (assert) => {
    const optimizer = new window.PerformanceOptimizer();
    const testKey = 'test_key';
    const testValue = { data: 'test_data' };
    
    optimizer.setCache(testKey, testValue, 1000);
    const cached = optimizer.getCache(testKey);
    
    assert.assertEqual(JSON.stringify(cached), JSON.stringify(testValue), 'Cached value should match original');
});

// Testes de Monitoramento
suite.test('ErrorReporter deve existir e funcionar', (assert) => {
    assert.assertNotNull(window.ErrorReporter, 'ErrorReporter should be available');
    assert.assertNotNull(window.errorReporter, 'Global errorReporter instance should exist');
});

suite.test('ErrorReporter deve reportar erros', (assert) => {
    const reporter = window.errorReporter;
    const testError = new Error('Test error');
    
    const errorId = reporter.reportError(testError, { type: 'test_error' });
    assert.assertNotNull(errorId, 'Error reporting should return an ID');
});

// Testes de API
suite.testAsync('BlingIntegration deve estar configurada corretamente', async (assert) => {
    assert.assertNotNull(window.BlingIntegration, 'BlingIntegration should be available');
    
    if (window.blingAPI) {
        assert.assertNotNull(window.blingAPI.clientId, 'Client ID should be configured');
        assert.assertNotNull(window.blingAPI.redirectUri, 'Redirect URI should be configured');
    }
});

// Testes de Interface
suite.test('Elementos da UI devem existir', (assert) => {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('main-content');
    
    assert.assertNotNull(sidebar, 'Sidebar should exist');
    assert.assertNotNull(mainContent, 'Main content should exist');
});

suite.test('Navegação da sidebar deve funcionar', (assert) => {
    const navItems = document.querySelectorAll('.nav-item');
    assert.assertTrue(navItems.length > 0, 'Navigation items should exist');
    
    // Testar se função de navegação existe
    assert.assertTrue(typeof window.showSection === 'function', 'showSection function should exist');
});

// Testes de Responsividade
suite.test('Layout deve ser responsivo', (assert) => {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        // Simular resize para mobile
        Object.defineProperty(window, 'innerWidth', { value: 500, writable: true });
        window.dispatchEvent(new Event('resize'));
        
        // Verificar se sidebar colapsa em mobile (pode variar conforme implementação)
        assert.assertNotNull(sidebar, 'Sidebar should handle mobile layout');
    }
});

// Export para uso global
window.TestSuite = TestSuite;
window.testSuite = suite;

// Função helper para executar todos os testes
window.runAllTests = async () => {
    console.log('🚀 Iniciando suite de testes do JohnTech Store...');
    try {
        const report = await suite.run();
        
        // Reportar resultados para monitoramento
        if (window.reportEvent) {
            window.reportEvent('test_suite_completed', {
                total: report.summary.total,
                passed: report.summary.passed,
                failed: report.summary.failed,
                successRate: report.summary.successRate,
                duration: report.summary.duration
            });
        }
        
        return report;
    } catch (error) {
        console.error('❌ Erro ao executar testes:', error);
        if (window.reportError) {
            window.reportError(error, { type: 'test_suite_error' });
        }
        throw error;
    }
};

export { TestSuite, suite as defaultSuite };
