/**
 * 💾 AUTO-SAVE SYSTEM ENTERPRISE
 * Sistema de salvamento automático para todos os arquivos
 */

class AutoSaveManager {
    constructor() {
        this.isEnabled = true;
        this.saveInterval = 30000; // 30 segundos
        this.pendingChanges = new Map();
        this.lastSaveTime = Date.now();
        this.saveQueue = [];
        this.isProcessingQueue = false;
        
        this.initializeAutoSave();
        this.bindEventListeners();
    }

    /**
     * Inicializa o sistema de auto-save
     */
    initializeAutoSave() {
        // Auto-save periódico
        setInterval(() => {
            if (this.pendingChanges.size > 0) {
                this.processSaveQueue();
            }
        }, this.saveInterval);

        // Save antes de sair da página
        window.addEventListener('beforeunload', () => {
            this.saveAllPending();
        });

        // Save quando a página perde foco
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.pendingChanges.size > 0) {
                this.saveAllPending();
            }
        });

        console.log('💾 Auto-Save System inicializado');
    }

    /**
     * Bind event listeners para detectar mudanças
     */
    bindEventListeners() {
        // Detectar mudanças em inputs
        document.addEventListener('input', (e) => {
            if (e.target.matches('input, textarea, select')) {
                this.markForSave(e.target.id || e.target.name, e.target.value);
            }
        });

        // Detectar mudanças em formulários
        document.addEventListener('change', (e) => {
            if (e.target.form) {
                this.saveFormData(e.target.form);
            }
        });

        // Detectar alterações no localStorage
        this.wrapLocalStorage();
    }

    /**
     * Marca item para salvamento
     */
    markForSave(key, value) {
        this.pendingChanges.set(key, {
            value,
            timestamp: Date.now(),
            type: 'form_data'
        });

        // Mostrar indicador de mudanças pendentes
        this.showSaveIndicator();
    }

    /**
     * Salva dados do formulário
     */
    saveFormData(form) {
        const formData = new FormData(form);
        const data = {};
        
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }

        this.pendingChanges.set(`form_${form.id || 'unnamed'}`, {
            value: data,
            timestamp: Date.now(),
            type: 'form'
        });
    }

    /**
     * Processa fila de salvamento
     */
    async processSaveQueue() {
        if (this.isProcessingQueue) return;
        
        this.isProcessingQueue = true;
        
        try {
            for (let [key, data] of this.pendingChanges.entries()) {
                await this.saveToStorage(key, data);
            }
            
            this.pendingChanges.clear();
            this.lastSaveTime = Date.now();
            this.hideSaveIndicator();
            
            console.log('💾 Auto-save completed successfully');
            
        } catch (error) {
            console.error('❌ Auto-save error:', error);
            if (window.reportError) {
                window.reportError(error, { type: 'auto_save_error' });
            }
        } finally {
            this.isProcessingQueue = false;
        }
    }

    /**
     * Salva no localStorage de forma segura
     */
    async saveToStorage(key, data) {
        try {
            const storageKey = `autosave_${key}`;
            const saveData = {
                ...data,
                savedAt: new Date().toISOString(),
                version: '1.2.0'
            };

            // Usar TokenManager se disponível para criptografia
            if (window.tokenManager && data.type === 'sensitive') {
                const encrypted = window.tokenManager.encrypt(JSON.stringify(saveData));
                localStorage.setItem(storageKey, encrypted);
            } else {
                localStorage.setItem(storageKey, JSON.stringify(saveData));
            }

            return true;
        } catch (error) {
            console.error(`Failed to save ${key}:`, error);
            return false;
        }
    }

    /**
     * Salva todas as mudanças pendentes
     */
    saveAllPending() {
        if (this.pendingChanges.size === 0) return;
        
        // Save síncrono para beforeunload
        for (let [key, data] of this.pendingChanges.entries()) {
            try {
                const storageKey = `autosave_${key}`;
                localStorage.setItem(storageKey, JSON.stringify({
                    ...data,
                    savedAt: new Date().toISOString(),
                    emergency: true
                }));
            } catch (error) {
                console.error(`Emergency save failed for ${key}:`, error);
            }
        }
        
        console.log('💾 Emergency save completed');
    }

    /**
     * Recupera dados salvos automaticamente
     */
    restoreAutoSavedData() {
        const autoSavedKeys = Object.keys(localStorage).filter(key => 
            key.startsWith('autosave_')
        );

        const restoredData = {};
        
        autoSavedKeys.forEach(key => {
            try {
                const originalKey = key.replace('autosave_', '');
                const data = JSON.parse(localStorage.getItem(key));
                
                // Verificar se não é muito antigo (24 horas)
                const saveTime = new Date(data.savedAt).getTime();
                const now = Date.now();
                const dayInMs = 24 * 60 * 60 * 1000;
                
                if (now - saveTime < dayInMs) {
                    restoredData[originalKey] = data;
                } else {
                    // Remove dados antigos
                    localStorage.removeItem(key);
                }
                
            } catch (error) {
                console.warn(`Failed to restore ${key}:`, error);
                localStorage.removeItem(key);
            }
        });

        if (Object.keys(restoredData).length > 0) {
            console.log('💾 Auto-saved data restored:', Object.keys(restoredData));
            this.applyRestoredData(restoredData);
        }

        return restoredData;
    }

    /**
     * Aplica dados restaurados aos elementos
     */
    applyRestoredData(data) {
        Object.entries(data).forEach(([key, saveData]) => {
            try {
                if (saveData.type === 'form_data') {
                    const element = document.getElementById(key) || document.querySelector(`[name="${key}"]`);
                    if (element) {
                        element.value = saveData.value;
                        element.classList.add('auto-restored');
                        
                        // Mostrar notificação de restauração
                        this.showRestoreNotification(key);
                    }
                } else if (saveData.type === 'form') {
                    const formId = key.replace('form_', '');
                    const form = document.getElementById(formId);
                    if (form && saveData.value) {
                        Object.entries(saveData.value).forEach(([fieldName, fieldValue]) => {
                            const field = form.querySelector(`[name="${fieldName}"]`);
                            if (field) {
                                field.value = fieldValue;
                                field.classList.add('auto-restored');
                            }
                        });
                    }
                }
            } catch (error) {
                console.warn(`Failed to apply restored data for ${key}:`, error);
            }
        });
    }

    /**
     * Mostra indicador de salvamento
     */
    showSaveIndicator() {
        let indicator = document.getElementById('auto-save-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'auto-save-indicator';
            indicator.innerHTML = '💾 Salvamento automático ativo...';
            indicator.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: #3b82f6;
                color: white;
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 12px;
                z-index: 10000;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                transition: all 0.3s ease;
            `;
            document.body.appendChild(indicator);
        }
        
        indicator.style.display = 'block';
    }

    /**
     * Esconde indicador de salvamento
     */
    hideSaveIndicator() {
        const indicator = document.getElementById('auto-save-indicator');
        if (indicator) {
            indicator.innerHTML = '✅ Salvo automaticamente';
            indicator.style.background = '#10b981';
            
            setTimeout(() => {
                indicator.style.display = 'none';
            }, 2000);
        }
    }

    /**
     * Mostra notificação de restauração
     */
    showRestoreNotification(key) {
        if (window.showNotification) {
            window.showNotification(`💾 Dados restaurados para: ${key}`, 'info');
        }
    }

    /**
     * Wrapper para localStorage para detectar mudanças
     */
    wrapLocalStorage() {
        const originalSetItem = localStorage.setItem;
        
        localStorage.setItem = (key, value) => {
            // Detectar mudanças importantes
            if (key.includes('bling_') || key.includes('token')) {
                this.markForSave(`localStorage_${key}`, value);
            }
            
            return originalSetItem.call(localStorage, key, value);
        };
    }

    /**
     * Limpa dados de auto-save antigos
     */
    cleanupOldData() {
        const keys = Object.keys(localStorage);
        const now = Date.now();
        const weekInMs = 7 * 24 * 60 * 60 * 1000;
        
        keys.forEach(key => {
            if (key.startsWith('autosave_')) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    const saveTime = new Date(data.savedAt).getTime();
                    
                    if (now - saveTime > weekInMs) {
                        localStorage.removeItem(key);
                    }
                } catch (error) {
                    localStorage.removeItem(key);
                }
            }
        });
    }

    /**
     * Configurações do auto-save
     */
    configure(options = {}) {
        if (options.interval) {
            this.saveInterval = options.interval;
        }
        
        if (options.enabled !== undefined) {
            this.isEnabled = options.enabled;
        }
        
        console.log('💾 Auto-save configured:', options);
    }

    /**
     * Status do auto-save
     */
    getStatus() {
        return {
            enabled: this.isEnabled,
            pendingChanges: this.pendingChanges.size,
            lastSaveTime: new Date(this.lastSaveTime).toISOString(),
            isProcessing: this.isProcessingQueue
        };
    }

    /**
     * Force save manual
     */
    forceSave() {
        console.log('💾 Force save triggered');
        return this.processSaveQueue();
    }
}

// Inicializar sistema de auto-save
const autoSaveManager = new AutoSaveManager();

// Restaurar dados quando a página carrega
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        autoSaveManager.restoreAutoSavedData();
        autoSaveManager.cleanupOldData();
    }, 1000);
});

// Export para uso global
window.AutoSaveManager = AutoSaveManager;
window.autoSaveManager = autoSaveManager;

// Funções helper globais
window.forceSave = () => autoSaveManager.forceSave();
window.getAutoSaveStatus = () => autoSaveManager.getStatus();

export default autoSaveManager;
