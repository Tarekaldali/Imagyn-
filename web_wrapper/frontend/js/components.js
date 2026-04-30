/* =====================================================
   COMPONENTS MODULE - ComfyUI Studio
   Interactive UI components and utilities
   ===================================================== */

class ComponentManager {
    constructor() {
        this.components = new Map();
        this.eventListeners = new Map();
        this.initialized = false;
    }

    // Initialize all components
    init() {
        if (this.initialized) return;
        
        console.log('🎛️ Initializing UI components...');
        
        // Initialize components in order
        this.initSliders();
        this.initSelectors();
        this.initButtons();
        this.initModals();
        this.initTooltips();
        this.initAdvancedToggle();
        this.initAspectRatio();
        this.initWorkflowSelector();
        this.initSeedControl();
        this.initPromptActions();
        
        this.initialized = true;
        console.log('✅ All components initialized');
    }

    // Slider components
    initSliders() {
        const sliders = document.querySelectorAll('input[type="range"]');
        
        sliders.forEach(slider => {
            const valueDisplay = document.querySelector(`#${slider.id} + .slider-value`) || 
                                document.querySelector(`.slider-value[data-for="${slider.id}"]`) ||
                                slider.parentElement.querySelector('.slider-value');
            
            if (valueDisplay) {
                // Update display value
                const updateValue = () => {
                    let value = slider.value;
                    
                    // Format based on slider type
                    if (slider.id === 'cfg_scale') {
                        value = parseFloat(value).toFixed(1);
                    } else if (slider.id.includes('strength')) {
                        value = parseFloat(value).toFixed(2);
                    }
                    
                    valueDisplay.textContent = value;
                };
                
                // Initial update
                updateValue();
                
                // Listen for changes
                slider.addEventListener('input', updateValue);
                slider.addEventListener('change', updateValue);
                
                // Store reference
                this.components.set(slider.id, { element: slider, valueDisplay });
            }
        });
        
        console.log('🎚️ Sliders initialized:', sliders.length);
    }

    // Button interactions
    initButtons() {
        // Preset buttons
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handlePresetClick(btn);
            });
        });

        // Icon buttons with tooltips
        document.querySelectorAll('.btn-icon').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleIconButtonClick(btn);
            });
        });

        // Random buttons
        const randomPromptBtn = document.getElementById('randomPrompt');
        if (randomPromptBtn) {
            randomPromptBtn.addEventListener('click', () => this.generateRandomPrompt());
        }

        const randomSeedBtn = document.getElementById('randomSeed');
        if (randomSeedBtn) {
            randomSeedBtn.addEventListener('click', () => this.generateRandomSeed());
        }

        console.log('🔘 Buttons initialized');
    }

    // Handle preset button clicks
    handlePresetClick(btn) {
        const group = btn.parentElement;
        const value = btn.dataset.value;
        
        // Remove active from siblings
        group.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
        
        // Add active to clicked button
        btn.classList.add('active');
        
        // Update associated input
        const settingGroup = btn.closest('.setting-group');
        const input = settingGroup.querySelector('input[type="range"], select');
        
        if (input && value) {
            input.value = value;
            
            // Trigger change event
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
        }
        
        // Visual feedback
        this.addRippleEffect(btn);
    }

    // Handle icon button clicks
    handleIconButtonClick(btn) {
        const btnId = btn.id;
        
        switch (btnId) {
            case 'modelSwap':
                this.randomizeModel();
                break;
            case 'clearPrompt':
                this.clearPrompt();
                break;
            case 'settingsBtn':
                this.toggleSettings();
                break;
            case 'gallerySort':
                this.toggleGallerySort();
                break;
            case 'galleryFilter':
                this.toggleGalleryFilter();
                break;
        }
        
        // Visual feedback
        this.addRippleEffect(btn);
    }

    // Modal management
    initModals() {
        const modals = document.querySelectorAll('.modal');
        
        modals.forEach(modal => {
            const closeBtn = modal.querySelector('.modal-close');
            
            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.closeModal(modal));
            }
            
            // Close on backdrop click
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal);
                }
            });
            
            // ESC key handling
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && modal.classList.contains('visible')) {
                    this.closeModal(modal);
                }
            });
        });
        
        console.log('🖼️ Modals initialized:', modals.length);
    }

    // Advanced toggle
    initAdvancedToggle() {
        const toggle = document.getElementById('advancedToggle');
        const content = document.getElementById('advancedContent');
        const icon = toggle?.querySelector('.toggle-icon');
        
        if (toggle && content) {
            toggle.addEventListener('click', () => {
                const isExpanded = content.classList.contains('expanded');
                
                if (isExpanded) {
                    content.classList.remove('expanded');
                    icon?.classList.remove('rotated');
                } else {
                    content.classList.add('expanded');
                    icon?.classList.add('rotated');
                }
                
                // Save state
                localStorage.setItem('advancedExpanded', !isExpanded);
            });
            
            // Restore state
            const savedState = localStorage.getItem('advancedExpanded') === 'true';
            if (savedState) {
                content.classList.add('expanded');
                icon?.classList.add('rotated');
            }
        }
        
        console.log('⚙️ Advanced toggle initialized');
    }

    // Aspect ratio selector
    initAspectRatio() {
        const ratioOptions = document.querySelectorAll('.aspect-option');
        
        ratioOptions.forEach(option => {
            option.addEventListener('click', () => {
                // Remove active from all options
                ratioOptions.forEach(opt => opt.classList.remove('active'));
                
                // Add active to clicked option
                option.classList.add('active');
                
                // Get size data
                const size = option.dataset.size;
                if (size) {
                    const [width, height] = size.split('x').map(Number);
                    
                    // Update hidden inputs or form data
                    const widthSlider = document.getElementById('width');
                    const heightSlider = document.getElementById('height');
                    
                    if (widthSlider) {
                        widthSlider.value = width;
                        widthSlider.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                    
                    if (heightSlider) {
                        heightSlider.value = height;
                        heightSlider.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                    
                    console.log(`📐 Aspect ratio changed to: ${width}x${height}`);
                }
                
                // Visual feedback
                this.addRippleEffect(option);
            });
        });
        
        console.log('📐 Aspect ratio selector initialized');
    }

    // Workflow selector
    initWorkflowSelector() {
        const workflowOptions = document.querySelectorAll('.workflow-option');
        
        workflowOptions.forEach(option => {
            if (!option.classList.contains('disabled')) {
                option.addEventListener('click', () => {
                    // Remove active from all options
                    workflowOptions.forEach(opt => opt.classList.remove('active'));
                    
                    // Add active to clicked option
                    option.classList.add('active');
                    
                    const workflow = option.dataset.workflow;
                    console.log(`🔄 Workflow changed to: ${workflow}`);
                    
                    // Visual feedback
                    this.addRippleEffect(option);
                });
            }
        });
        
        console.log('🔄 Workflow selector initialized');
    }

    // Seed control
    initSeedControl() {
        const seedModes = document.querySelectorAll('.seed-mode');
        const seedInput = document.getElementById('seedInput');
        
        seedModes.forEach(mode => {
            mode.addEventListener('click', () => {
                const modeType = mode.dataset.mode;
                
                // Remove active from all modes
                seedModes.forEach(m => m.classList.remove('active'));
                
                // Add active to clicked mode
                mode.classList.add('active');
                
                // Show/hide seed input
                if (seedInput) {
                    if (modeType === 'custom') {
                        seedInput.style.display = 'block';
                        seedInput.focus();
                    } else {
                        seedInput.style.display = 'none';
                    }
                }
                
                console.log(`🎲 Seed mode changed to: ${modeType}`);
            });
        });
        
        console.log('🎲 Seed control initialized');
    }

    // Prompt actions
    initPromptActions() {
        const promptInput = document.getElementById('promptInput');
        
        if (promptInput) {
            // Auto-resize textarea
            promptInput.addEventListener('input', () => {
                promptInput.style.height = 'auto';
                promptInput.style.height = promptInput.scrollHeight + 'px';
            });
            
            // Character counter (optional)
            this.updateCharacterCount(promptInput);
            
            promptInput.addEventListener('input', () => {
                this.updateCharacterCount(promptInput);
            });
        }
        
        console.log('📝 Prompt actions initialized');
    }

    // Tooltip system
    initTooltips() {
        const elementsWithTooltips = document.querySelectorAll('[data-tooltip]');
        
        elementsWithTooltips.forEach(element => {
            element.addEventListener('mouseenter', (e) => {
                this.showTooltip(e.target, e.target.dataset.tooltip);
            });
            
            element.addEventListener('mouseleave', () => {
                this.hideTooltip();
            });
        });
        
        console.log('💬 Tooltips initialized:', elementsWithTooltips.length);
    }

    // Custom selectors
    initSelectors() {
        const selectors = document.querySelectorAll('.custom-select');
        
        selectors.forEach(select => {
            // Add loading state handling
            if (select.innerHTML.includes('Loading')) {
                select.classList.add('loading');
            }
            
            select.addEventListener('change', () => {
                select.classList.remove('loading');
                
                // Visual feedback
                this.addRippleEffect(select);
            });
        });
        
        console.log('📋 Selectors initialized:', selectors.length);
    }

    // Utility methods
    addRippleEffect(element) {
        const ripple = document.createElement('span');
        ripple.classList.add('ripple');
        
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        
        ripple.style.cssText = `
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.3);
            transform: scale(0);
            animation: ripple-animation 0.6s linear;
            width: ${size}px;
            height: ${size}px;
            left: ${rect.width / 2 - size / 2}px;
            top: ${rect.height / 2 - size / 2}px;
            pointer-events: none;
        `;
        
        element.style.position = 'relative';
        element.style.overflow = 'hidden';
        element.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }

    // Modal utilities
    openModal(modalId, data = {}) {
        const modal = document.getElementById(modalId);
        if (modal) {
            // Populate modal with data
            if (data.image) {
                const img = modal.querySelector('#modalImage');
                if (img) img.src = data.image;
            }
            
            if (data.metadata) {
                const metadata = modal.querySelector('#imageMetadata');
                if (metadata) metadata.innerHTML = this.formatMetadata(data.metadata);
            }
            
            modal.classList.add('visible');
            document.body.style.overflow = 'hidden';
        }
    }

    closeModal(modal) {
        modal.classList.remove('visible');
        document.body.style.overflow = '';
    }

    // Tooltip utilities
    showTooltip(element, text) {
        this.hideTooltip(); // Remove existing tooltip
        
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = text;
        
        document.body.appendChild(tooltip);
        
        const rect = element.getBoundingClientRect();
        tooltip.style.cssText = `
            position: absolute;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 0.875rem;
            white-space: nowrap;
            z-index: 10000;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.2s;
            left: ${rect.left + rect.width / 2}px;
            top: ${rect.top - 10}px;
            transform: translate(-50%, -100%);
        `;
        
        setTimeout(() => tooltip.style.opacity = '1', 10);
        
        this.currentTooltip = tooltip;
    }

    hideTooltip() {
        if (this.currentTooltip) {
            this.currentTooltip.remove();
            this.currentTooltip = null;
        }
    }

    // Random utilities
    generateRandomPrompt() {
        const prompts = [
            "A serene landscape with mountains and a lake",
            "A futuristic cityscape at sunset",
            "A magical forest with glowing flowers",
            "An elegant portrait in renaissance style",
            "A cozy coffee shop on a rainy day",
            "Abstract art with vibrant colors",
            "A steampunk mechanical bird",
            "A peaceful zen garden",
            "A dramatic storm over the ocean",
            "A fantasy castle in the clouds"
        ];
        
        const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
        const promptInput = document.getElementById('promptInput');
        
        if (promptInput) {
            promptInput.value = randomPrompt;
            promptInput.dispatchEvent(new Event('input', { bubbles: true }));
            
            // Visual feedback
            promptInput.style.background = 'rgba(37, 99, 235, 0.2)';
            setTimeout(() => {
                promptInput.style.background = '';
            }, 1000);
        }
        
        console.log('🎲 Random prompt generated:', randomPrompt);
    }

    generateRandomSeed() {
        const randomSeed = Math.floor(Math.random() * 1000000);
        const seedInput = document.getElementById('seedInput');
        
        if (seedInput) {
            seedInput.value = randomSeed;
            seedInput.style.display = 'block';
            
            // Switch to custom mode
            const customMode = document.querySelector('.seed-mode[data-mode="custom"]');
            if (customMode) {
                document.querySelectorAll('.seed-mode').forEach(m => m.classList.remove('active'));
                customMode.classList.add('active');
            }
        }
        
        console.log('🎲 Random seed generated:', randomSeed);
    }

    clearPrompt() {
        const promptInput = document.getElementById('promptInput');
        if (promptInput) {
            promptInput.value = '';
            promptInput.focus();
            promptInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
    }

    randomizeModel() {
        const modelSelect = document.getElementById('modelSelect');
        if (modelSelect && modelSelect.options.length > 1) {
            const randomIndex = Math.floor(Math.random() * (modelSelect.options.length - 1)) + 1;
            modelSelect.selectedIndex = randomIndex;
            modelSelect.dispatchEvent(new Event('change', { bubbles: true }));
            
            console.log('🎲 Random model selected:', modelSelect.value);
        }
    }

    updateCharacterCount(textarea) {
        const maxLength = 500; // Reasonable limit
        const currentLength = textarea.value.length;
        
        let counter = textarea.parentElement.querySelector('.char-counter');
        if (!counter && currentLength > maxLength * 0.8) {
            counter = document.createElement('div');
            counter.className = 'char-counter';
            counter.style.cssText = `
                font-size: 0.75rem;
                color: rgba(255, 255, 255, 0.6);
                text-align: right;
                margin-top: 4px;
            `;
            textarea.parentElement.appendChild(counter);
        }
        
        if (counter) {
            counter.textContent = `${currentLength}/${maxLength}`;
            
            if (currentLength > maxLength) {
                counter.style.color = '#ef4444';
            } else if (currentLength > maxLength * 0.9) {
                counter.style.color = '#f59e0b';
            } else {
                counter.style.color = 'rgba(255, 255, 255, 0.6)';
            }
        }
    }

    formatMetadata(metadata) {
        return Object.entries(metadata)
            .map(([key, value]) => `<div><strong>${key}:</strong> ${value}</div>`)
            .join('');
    }

    // Settings toggle
    toggleSettings() {
        console.log('⚙️ Settings panel toggled');
        // Implement settings panel
    }

    toggleGallerySort() {
        console.log('🔄 Gallery sort toggled');
        // Implement gallery sorting
    }

    toggleGalleryFilter() {
        console.log('🔍 Gallery filter toggled');
        // Implement gallery filtering
    }

    // Cleanup method
    destroy() {
        this.eventListeners.forEach((listeners, element) => {
            listeners.forEach(({ event, handler }) => {
                element.removeEventListener(event, handler);
            });
        });
        
        this.eventListeners.clear();
        this.components.clear();
        this.initialized = false;
    }
}

// Add ripple animation CSS
const rippleCSS = `
@keyframes ripple-animation {
    to {
        transform: scale(4);
        opacity: 0;
    }
}
`;

if (!document.querySelector('#ripple-styles')) {
    const style = document.createElement('style');
    style.id = 'ripple-styles';
    style.textContent = rippleCSS;
    document.head.appendChild(style);
}

// Export component manager
window.ComponentManager = ComponentManager;
window.components = new ComponentManager();

// Performance monitoring
if (typeof performance !== 'undefined' && performance.mark) {
    performance.mark('components-module-loaded');
}