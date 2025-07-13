/**
 * 🔒 SISTEMA DE SEGURANÇA ENTERPRISE
 * TokenManager - Gerenciamento seguro de tokens com encryption
 */

class TokenManager {
    constructor() {
        this.encryptionKey = this.generateEncryptionKey();
        this.storageKey = 'bling_secure_token';
        this.refreshKey = 'bling_refresh_token';
    }

    /**
     * Gera chave de criptografia baseada no dispositivo
     */
    generateEncryptionKey() {
        const deviceFingerprint = [
            navigator.userAgent,
            navigator.language,
            screen.width,
            screen.height,
            new Date().getTimezoneOffset()
        ].join('|');
        
        return btoa(deviceFingerprint).slice(0, 32);
    }

    /**
     * Criptografia forte usando crypto-js (AES)
     */
    encrypt(text) {
        if (typeof CryptoJS === 'undefined') {
            throw new Error('CryptoJS não está disponível. Importe crypto-js no seu projeto.');
        }
        return CryptoJS.AES.encrypt(text, this.encryptionKey).toString();
    }

    /**
     * Descriptografia forte usando crypto-js (AES)
     */
    decrypt(encryptedText) {
        try {
            if (typeof CryptoJS === 'undefined') {
                throw new Error('CryptoJS não está disponível. Importe crypto-js no seu projeto.');
            }
            const bytes = CryptoJS.AES.decrypt(encryptedText, this.encryptionKey);
            return bytes.toString(CryptoJS.enc.Utf8);
        } catch (error) {
            console.error('Erro na descriptografia:', error);
            return null;
        }
    }

    /**
     * Salva token de forma segura
     */
    saveToken(tokenData) {
        try {
            const tokenWithTimestamp = {
                ...tokenData,
                created_at: Date.now(),
                expires_at: Date.now() + (tokenData.expires_in * 1000)
            };

            const encryptedToken = this.encrypt(JSON.stringify(tokenWithTimestamp));
            localStorage.setItem(this.storageKey, encryptedToken);

            // Salvar refresh token separadamente
            if (tokenData.refresh_token) {
                const encryptedRefresh = this.encrypt(tokenData.refresh_token);
                localStorage.setItem(this.refreshKey, encryptedRefresh);
            }

            this.logSecurityEvent('TOKEN_SAVED', 'Token salvo com segurança');
            return true;
        } catch (error) {
            this.logSecurityEvent('TOKEN_SAVE_ERROR', error.message);
            return false;
        }
    }

    /**
     * Recupera token de forma segura
     */
    getToken() {
        try {
            const encryptedToken = localStorage.getItem(this.storageKey);
            if (!encryptedToken) return null;

            const decryptedToken = this.decrypt(encryptedToken);
            if (!decryptedToken) {
                this.clearTokens();
                return null;
            }

            const tokenData = JSON.parse(decryptedToken);

            // Verificar se token não expirou
            if (this.isTokenExpired(tokenData)) {
                this.logSecurityEvent('TOKEN_EXPIRED', 'Token expirado automaticamente removido');
                this.clearTokens();
                return null;
            }

            return tokenData;
        } catch (error) {
            this.logSecurityEvent('TOKEN_RETRIEVE_ERROR', error.message);
            this.clearTokens();
            return null;
        }
    }

    /**
     * Verifica se o token está expirado
     */
    isTokenExpired(tokenData) {
        const now = Date.now();
        const expiresAt = tokenData.expires_at || (tokenData.created_at + (tokenData.expires_in * 1000));
        return now >= expiresAt;
    }

    /**
     * Obtém refresh token
     */
    getRefreshToken() {
        try {
            const encryptedRefresh = localStorage.getItem(this.refreshKey);
            if (!encryptedRefresh) return null;

            return this.decrypt(encryptedRefresh);
        } catch (error) {
            this.logSecurityEvent('REFRESH_TOKEN_ERROR', error.message);
            return null;
        }
    }

    /**
     * Remove todos os tokens
     */
    clearTokens() {
        localStorage.removeItem(this.storageKey);
        localStorage.removeItem(this.refreshKey);
        this.logSecurityEvent('TOKENS_CLEARED', 'Todos os tokens foram removidos');
    }

    /**
     * Validação de integridade do token
     */
    validateTokenIntegrity(tokenData) {
        const requiredFields = ['access_token', 'token_type', 'expires_in'];
        const missingFields = requiredFields.filter(field => !tokenData[field]);
        
        if (missingFields.length > 0) {
            this.logSecurityEvent('TOKEN_INTEGRITY_FAIL', `Campos obrigatórios ausentes: ${missingFields.join(', ')}`);
            return false;
        }

        // Verificar formato do token
        if (typeof tokenData.access_token !== 'string' || tokenData.access_token.length < 10) {
            this.logSecurityEvent('TOKEN_FORMAT_INVALID', 'Formato do access_token inválido');
            return false;
        }

        return true;
    }

    /**
     * Log de eventos de segurança
     */
    logSecurityEvent(eventType, message) {
        const securityEvent = {
            timestamp: new Date().toISOString(),
            type: eventType,
            message: message,
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        console.log('🔒 Security Event:', securityEvent);

        // Em produção, enviar para serviço de monitoramento
        if (window.securityMonitor) {
            window.securityMonitor.report(securityEvent);
        }
    }

    /**
     * Gera relatório de segurança
     */
    getSecurityReport() {
        const token = this.getToken();
        const refreshToken = this.getRefreshToken();

        return {
            hasToken: !!token,
            hasRefreshToken: !!refreshToken,
            tokenValid: token ? !this.isTokenExpired(token) : false,
            encryptionEnabled: true,
            storageSecure: typeof Storage !== 'undefined',
            timestamp: new Date().toISOString()
        };
    }
}

// Singleton instance
const tokenManager = new TokenManager();

// Export para uso global
window.TokenManager = TokenManager;
window.tokenManager = tokenManager;

export default tokenManager;
