/* =====================================================
   APP MODULE - ComfyUI Studio
   Application initialization and coordination
   ===================================================== */

class AppManager {
    constructor() {
        this.initialized = false;
        this.modules = {};
        this.config = {
            version: '1.0.0',
            debug: true,
            theme: 'dark',
            performance: {
                enableAnimations: true,
                enableParticles: true,
                maxConcurrent: 3
            }
        };
    }

    // Initialize the application
    async init() {
        if (this.initialized) return;
        
        console.log('🚀 Initializing ComfyUI Studio...');
        
        try {
            // Show loading screen
            this.showLoadingScreen();
            
            // Initialize core modules
            await this.initializeModules();
            
            // Setup global event handlers
            this.setupGlobalHandlers();
            
            // Setup form handlers
            this.setupFormHandlers();
            
            // Initialize UI components
            this.initializeUI();
            
            // Load user preferences
            this.loadUserPreferences();
            
            // Hide loading screen
            this.hideLoadingScreen();
            
            this.initialized = true;
            console.log('✅ ComfyUI Studio initialized successfully');
            
            // Show welcome message
            this.showWelcomeMessage();
            
        } catch (error) {
            console.error('❌ Failed to initialize app:', error);
            this.showError('Failed to initialize application', error);
        }
    }

    // Initialize all modules
    async initializeModules() {
        const modules = [
            { name: 'api', instance: window.api },
            { name: 'components', instance: window.components },
            { name: 'gallery', instance: window.gallery },
            { name: 'queue', instance: window.queue }
        ];

        for (const module of modules) {
            try {
                if (module.instance && typeof module.instance.init === 'function') {
                    await module.instance.init();
                    this.modules[module.name] = module.instance;
                    console.log(`✅ ${module.name} module initialized`);
                }
            } catch (error) {
                console.error(`❌ Failed to initialize ${module.name} module:`, error);
            }
        }
    }

    // Setup global event handlers
    setupGlobalHandlers() {
        // Handle keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // Handle beforeunload
        window.addEventListener('beforeunload', (e) => {
            if (this.hasUnsavedChanges()) {
                e.preventDefault();
                return 'You have unsaved changes. Are you sure you want to leave?';
            }
        });

        // Handle visibility change
        document.addEventListener('visibilitychange', () => {
            this.handleVisibilityChange();
        });

        // Handle online/offline
        window.addEventListener('online', () => {
            this.handleConnectionChange(true);
        });

        window.addEventListener('offline', () => {
            this.handleConnectionChange(false);
        });
    }

    // Setup form handlers
    setupFormHandlers() {
        // Main generation form
        const generationForm = document.getElementById('generationForm');
        if (generationForm) {
            generationForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleGeneration(e);
            });
        }

        // Generate button (blue circle)
        const generateBtn = document.getElementById('generateBtn');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => {
                this.handleGeneration();
            });
        }

        // Queue button (pink circle)
        const queueBtn = document.getElementById('queueBtn');
        if (queueBtn) {
            queueBtn.addEventListener('click', () => {
                this.handleQueue();
            });
        }

        // Settings form
        const settingsForm = document.getElementById('settingsForm');
        if (settingsForm) {
            settingsForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSettingsSubmit(e);
            });
        }
    }

    // Initialize UI components
    initializeUI() {
        // Initialize tooltips
        this.initializeTooltips();
        
        // Initialize modals
        this.initializeModals();
        
        // Initialize theme
        this.initializeTheme();
        
        // Initialize animations
        this.initializeAnimations();
        
        // Load initial data
        this.loadInitialData();
    }

    // Handle generation request
    async handleGeneration(event) {
        try {
            console.log('🎨 Starting generation...');
            
            // Get form data
            const formData = this.getFormData();
            
            // Validate form data
            if (!this.validateFormData(formData)) {
                return;
            }
            
            // Submit to queue
            if (this.modules.queue) {
                await this.modules.queue.submitGeneration(formData);
            }
            
        } catch (error) {
            console.error('❌ Generation failed:', error);
            this.showError('Generation failed', error);
        }
    }

    // Handle queue request
    async handleQueue() {
        try {
            // Add current settings to queue without generating
            const formData = this.getFormData();
            
            if (!this.validateFormData(formData)) {
                return;
            }
            
            // Add to queue
            if (this.modules.queue) {
                await this.modules.queue.submitGeneration(formData);
                this.showNotification('Added to queue!', 'success');
            }
            
        } catch (error) {
            console.error('❌ Queue failed:', error);
            this.showError('Failed to add to queue', error);
        }
    }

    // Get form data
    getFormData() {
        const formData = {};
        
        // Get prompt
        const promptInput = document.getElementById('promptInput');
        if (promptInput) {
            formData.prompt = promptInput.value.trim();
        }
        
        // Get negative prompt
        const negativePromptInput = document.getElementById('negativePromptInput');
        if (negativePromptInput) {
            formData.negative_prompt = negativePromptInput.value.trim();
        }
        
        // Get model
        const modelSelect = document.getElementById('modelSelect');
        if (modelSelect) {
            formData.model = modelSelect.value;
        }
        
        // Get LoRA
        const loraSelect = document.getElementById('loraSelect');
        if (loraSelect) {
            formData.lora = loraSelect.value;
        }
        
        // Get LoRA strength
        const loraStrengthSlider = document.getElementById('loraStrengthSlider');
        if (loraStrengthSlider) {
            formData.lora_strength = parseFloat(loraStrengthSlider.value);
        }
        
        // Get steps
        const stepsSlider = document.getElementById('stepsSlider');
        if (stepsSlider) {
            formData.steps = parseInt(stepsSlider.value);
        }
        
        // Get CFG scale
        const cfgSlider = document.getElementById('cfgSlider');
        if (cfgSlider) {
            formData.cfg_scale = parseFloat(cfgSlider.value);
        }
        
        // Get sampler
        const samplerSelect = document.getElementById('samplerSelect');
        if (samplerSelect) {
            formData.sampler = samplerSelect.value;
        }
        
        // Get scheduler
        const schedulerSelect = document.getElementById('schedulerSelect');
        if (schedulerSelect) {
            formData.scheduler = schedulerSelect.value;
        }
        
        return formData;
    }

    // Validate form data
    validateFormData(data) {
        if (!data.prompt || data.prompt.length === 0) {
            this.showError('Please enter a prompt');
            return false;
        }
        
        if (data.prompt.length > 1000) {
            this.showError('Prompt is too long (max 1000 characters)');
            return false;
        }
        
        return true;
    }

    // Handle keyboard shortcuts
    handleKeyboardShortcuts(event) {
        // Ctrl/Cmd + Enter = Generate
        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
            event.preventDefault();
            this.handleGeneration();
            return;
        }
        
        // Ctrl/Cmd + Shift + Enter = Queue
        if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'Enter') {
            event.preventDefault();
            this.handleQueue();
            return;
        }
        
        // Escape = Close modals
        if (event.key === 'Escape') {
            this.closeAllModals();
            return;
        }
    }

    // Handle window resize
    handleResize() {
        // Update gallery layout
        if (this.modules.gallery) {
            this.modules.gallery.handleResize();
        }
        
        // Update any responsive components
        this.updateResponsiveComponents();
    }

    // Handle visibility change
    handleVisibilityChange() {
        if (document.hidden) {
            // Page is hidden - pause animations, reduce polling
            this.pauseBackgroundActivities();
        } else {
            // Page is visible - resume activities
            this.resumeBackgroundActivities();
        }
    }

    // Handle connection change
    handleConnectionChange(isOnline) {
        if (isOnline) {
            this.showNotification('Connection restored', 'success');
            this.resumeBackgroundActivities();
        } else {
            this.showNotification('Connection lost', 'warning');
            this.pauseBackgroundActivities();
        }
    }

    // Initialize tooltips
    initializeTooltips() {
        const tooltipElements = document.querySelectorAll('[data-tooltip]');
        tooltipElements.forEach(element => {
            if (this.modules.components) {
                this.modules.components.initializeTooltip(element);
            }
        });
    }

    // Initialize modals
    initializeModals() {
        const modalElements = document.querySelectorAll('.modal');
        modalElements.forEach(modal => {
            if (this.modules.components) {
                this.modules.components.initializeModal(modal);
            }
        });
    }

    // Initialize theme
    initializeTheme() {
        const savedTheme = localStorage.getItem('comfyui-theme') || 'dark';
        this.setTheme(savedTheme);
    }

    // Set theme
    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.config.theme = theme;
        localStorage.setItem('comfyui-theme', theme);
    }

    // Initialize animations
    initializeAnimations() {
        if (this.config.performance.enableAnimations) {
            document.body.classList.add('animations-enabled');
        }
    }

    // Load initial data
    async loadInitialData() {
        try {
            // Load models
            if (this.modules.api) {
                const models = await this.modules.api.getModels();
                this.populateModelSelect(models);
            }
            
            // Load LoRAs
            if (this.modules.api) {
                const loras = await this.modules.api.getLoras();
                this.populateLoraSelect(loras);
            }
            
        } catch (error) {
            console.error('❌ Failed to load initial data:', error);
        }
    }

    // Populate model select
    populateModelSelect(models) {
        const modelSelect = document.getElementById('modelSelect');
        if (!modelSelect || !models) return;
        
        modelSelect.innerHTML = '';
        models.forEach(model => {
            const option = document.createElement('option');
            option.value = model.name;
            option.textContent = model.display_name || model.name;
            modelSelect.appendChild(option);
        });
    }

    // Populate LoRA select
    populateLoraSelect(loras) {
        const loraSelect = document.getElementById('loraSelect');
        if (!loraSelect || !loras) return;
        
        loraSelect.innerHTML = '<option value="">None</option>';
        loras.forEach(lora => {
            const option = document.createElement('option');
            option.value = lora.name;
            option.textContent = lora.display_name || lora.name;
            loraSelect.appendChild(option);
        });
    }

    // Load user preferences
    loadUserPreferences() {
        try {
            const prefs = JSON.parse(localStorage.getItem('comfyui-preferences') || '{}');
            
            // Apply preferences
            if (prefs.theme) {
                this.setTheme(prefs.theme);
            }
            
            if (prefs.performance) {
                Object.assign(this.config.performance, prefs.performance);
            }
            
        } catch (error) {
            console.error('Failed to load preferences:', error);
        }
    }

    // Save user preferences
    saveUserPreferences() {
        try {
            const prefs = {
                theme: this.config.theme,
                performance: this.config.performance
            };
            
            localStorage.setItem('comfyui-preferences', JSON.stringify(prefs));
        } catch (error) {
            console.error('Failed to save preferences:', error);
        }
    }

    // Show loading screen
    showLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.display = 'flex';
        }
    }

    // Hide loading screen
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }
    }

    // Show welcome message
    showWelcomeMessage() {
        this.showNotification('Welcome to ComfyUI Studio! 🎨', 'success');
    }

    // Show notification
    showNotification(message, type = 'info') {
        if (this.modules.queue) {
            this.modules.queue.showNotification(message, type);
        }
    }

    // Show error
    showError(message, error = null) {
        console.error(message, error);
        this.showNotification(message, 'error');
    }

    // Close all modals
    closeAllModals() {
        const modals = document.querySelectorAll('.modal.active');
        modals.forEach(modal => {
            modal.classList.remove('active');
        });
    }

    // Check for unsaved changes
    hasUnsavedChanges() {
        // Check if there are any unsaved changes
        const prompt = document.getElementById('promptInput')?.value;
        return prompt && prompt.trim().length > 0;
    }

    // Pause background activities
    pauseBackgroundActivities() {
        if (this.modules.queue) {
            this.modules.queue.stopUpdates();
        }
    }

    // Resume background activities
    resumeBackgroundActivities() {
        if (this.modules.queue) {
            this.modules.queue.startUpdates();
        }
    }

    // Update responsive components
    updateResponsiveComponents() {
        // Update gallery grid
        const gallery = document.querySelector('.gallery-grid');
        if (gallery) {
            const width = gallery.offsetWidth;
            const columns = Math.floor(width / 200); // 200px per column
            gallery.style.gridTemplateColumns = `repeat(${Math.max(1, columns)}, 1fr)`;
        }
    }

    // Get app status
    getStatus() {
        return {
            initialized: this.initialized,
            modules: Object.keys(this.modules),
            config: this.config,
            performance: this.getPerformanceMetrics()
        };
    }

    // Get performance metrics
    getPerformanceMetrics() {
        if (typeof performance === 'undefined') return null;
        
        return {
            memory: performance.memory ? {
                used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
            } : null,
            timing: performance.timing ? {
                load: performance.timing.loadEventEnd - performance.timing.navigationStart,
                domReady: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart
            } : null
        };
    }

    // Cleanup
    destroy() {
        // Stop all modules
        Object.values(this.modules).forEach(module => {
            if (typeof module.destroy === 'function') {
                module.destroy();
            }
        });
        
        // Save preferences
        this.saveUserPreferences();
        
        this.initialized = false;
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Create global app instance
    window.app = new AppManager();
    
    // Initialize the app
    window.app.init().catch(error => {
        console.error('❌ Failed to initialize app:', error);
    });
});

// Performance monitoring
if (typeof performance !== 'undefined' && performance.mark) {
    performance.mark('app-module-loaded');
}

// Export for debugging
window.AppManager = AppManager;