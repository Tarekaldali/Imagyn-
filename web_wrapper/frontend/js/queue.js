/* =====================================================
   QUEUE MODULE - ComfyUI Studio
   Queue management and real-time updates
   ===================================================== */

class QueueManager {
    constructor() {
        this.updateInterval = null;
        this.updateFrequency = 3000; // 3 seconds
        this.isUpdating = false;
        this.lastUpdate = 0;
        this.retryCount = 0;
        this.maxRetries = 3;
        this.initialized = false;
    }

    // Initialize queue manager
    init() {
        if (this.initialized) return;
        
        console.log('⏱️ Initializing queue manager...');
        
        this.setupEventListeners();
        this.startUpdates();
        
        this.initialized = true;
        console.log('✅ Queue manager initialized');
    }

    // Start automatic updates
    startUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        // Initial update
        this.updateQueue();
        
        // Set up interval
        this.updateInterval = setInterval(() => {
            this.updateQueue();
        }, this.updateFrequency);
        
        console.log('🔄 Queue updates started');
    }

    // Stop automatic updates
    stopUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        console.log('⏹️ Queue updates stopped');
    }

    // Update queue status
    async updateQueue() {
        if (this.isUpdating) return;
        
        this.isUpdating = true;
        
        try {
            const queueData = await window.api.getQueueStatus();
            this.processQueueUpdate(queueData);
            this.retryCount = 0; // Reset retry count on success
        } catch (error) {
            console.error('❌ Failed to update queue:', error);
            this.handleUpdateError();
        } finally {
            this.isUpdating = false;
            this.lastUpdate = Date.now();
        }
    }

    // Process queue update data
    processQueueUpdate(queueData) {
        // Update queue status display
        this.updateQueueStatus(queueData);
        
        // Update queue count in header
        this.updateQueueCount(queueData);
        
        // Check for completed items to add to gallery
        this.checkCompletedItems(queueData);
        
        // Update generation info
        this.updateGenerationInfo(queueData);
    }

    // Update queue status circles
    updateQueueStatus(queueData) {
        const queueStatus = document.getElementById('queueStatus');
        const queueCount = queueStatus?.querySelector('.queue-count');
        const queueEta = queueStatus?.querySelector('.queue-eta');
        
        if (queueCount) {
            queueCount.textContent = queueData.queue_length || 0;
        }
        
        if (queueEta) {
            if (queueData.active_generations > 0) {
                queueEta.textContent = 'Processing...';
                queueStatus?.classList.add('active');
            } else if (queueData.queue_length > 0) {
                queueEta.textContent = 'Queued';
                queueStatus?.classList.remove('active');
            } else {
                queueEta.textContent = 'Ready';
                queueStatus?.classList.remove('active');
            }
        }
    }

    // Update queue count display
    updateQueueCount(queueData) {
        // Update any queue count displays
        const countElements = document.querySelectorAll('[data-queue-count]');
        countElements.forEach(el => {
            el.textContent = queueData.queue_length || 0;
        });
    }

    // Check for newly completed items
    checkCompletedItems(queueData) {
        if (!queueData.history || !Array.isArray(queueData.history)) return;
        
        queueData.history.forEach(item => {
            if (item.image_url && item.status === 'completed') {
                this.addToGallery(item);
            }
        });
    }

    // Add completed item to gallery
    addToGallery(item) {
        if (!window.gallery) return;
        
        // Check if already added
        if (window.gallery.images.has(item.id)) return;
        
        const imageData = {
            id: item.id,
            url: item.image_url,
            prompt: item.prompt || '',
            timestamp: new Date(item.completed_at || item.created_at).getTime(),
            metadata: {
                'Model': item.model || 'Unknown',
                'Steps': item.steps || 'Unknown',
                'CFG Scale': item.cfg_scale || 'Unknown',
                'Size': `${item.width || '?'}x${item.height || '?'}`,
                'Seed': item.seed || 'Unknown',
                'LoRA': item.lora || 'None'
            }
        };
        
        window.gallery.addImage(imageData);
        console.log('🖼️ New image added to gallery:', item.id);
        
        // Show notification
        this.showNotification('Image generated successfully!', 'success');
    }

    // Update generation info display
    updateGenerationInfo(queueData) {
        const generationTime = document.getElementById('generationTime');
        const vramUsage = document.getElementById('vramUsage');
        
        // Estimate generation time based on queue
        if (generationTime) {
            const estimatedTime = this.estimateGenerationTime(queueData);
            generationTime.textContent = estimatedTime;
        }
        
        // Update VRAM usage if available
        if (vramUsage && queueData.system_info) {
            vramUsage.textContent = queueData.system_info.vram_usage || '~4.2GB';
        }
    }

    // Estimate generation time
    estimateGenerationTime(queueData) {
        const avgTime = 3; // Average 3 seconds per generation
        const queuePosition = queueData.queue_length || 0;
        const activeGens = queueData.active_generations || 0;
        
        if (activeGens > 0 && queuePosition === 0) {
            return '~2-5s';
        } else if (queuePosition > 0) {
            const estimatedSeconds = (queuePosition * avgTime) / Math.max(queueData.max_concurrent || 1, 1);
            
            if (estimatedSeconds < 60) {
                return `~${Math.ceil(estimatedSeconds)}s`;
            } else if (estimatedSeconds < 3600) {
                return `~${Math.ceil(estimatedSeconds / 60)}m`;
            } else {
                return `~${Math.ceil(estimatedSeconds / 3600)}h`;
            }
        }
        
        return '~3s';
    }

    // Handle update errors
    handleUpdateError() {
        this.retryCount++;
        
        if (this.retryCount >= this.maxRetries) {
            this.showNotification('Lost connection to server. Retrying...', 'warning');
            
            // Exponential backoff
            setTimeout(() => {
                this.retryCount = 0;
                this.updateQueue();
            }, Math.min(1000 * Math.pow(2, this.retryCount), 30000));
        }
    }

    // Submit generation request
    async submitGeneration(formData) {
        try {
            console.log('🎨 Submitting generation request...');
            
            // Show loading state
            this.showGenerationLoading(true);
            
            // Prepare request data
            const requestData = this.prepareRequestData(formData);
            
            // Submit to API
            const result = await window.api.generateImage(requestData);
            
            // Success feedback
            this.showNotification('Generation request submitted!', 'success');
            
            // Immediate queue update
            setTimeout(() => this.updateQueue(), 500);
            
            return result;
            
        } catch (error) {
            console.error('❌ Generation submission failed:', error);
            this.showNotification(error.message || 'Failed to submit generation', 'error');
            throw error;
        } finally {
            this.showGenerationLoading(false);
        }
    }

    // Prepare request data from form
    prepareRequestData(formData) {
        const data = {};
        
        // Extract form data
        if (formData instanceof FormData) {
            for (const [key, value] of formData.entries()) {
                data[key] = value;
            }
        } else {
            Object.assign(data, formData);
        }
        
        // Get aspect ratio from selected option
        const activeAspect = document.querySelector('.aspect-option.active');
        if (activeAspect) {
            const size = activeAspect.dataset.size;
            if (size) {
                const [width, height] = size.split('x').map(Number);
                data.width = width;
                data.height = height;
            }
        }
        
        // Get workflow type
        const activeWorkflow = document.querySelector('.workflow-option.active');
        if (activeWorkflow) {
            data.workflow = activeWorkflow.dataset.workflow;
        }
        
        // Handle seed
        const seedMode = document.querySelector('.seed-mode.active');
        if (seedMode?.dataset.mode === 'random') {
            data.seed = -1;
        } else {
            const seedInput = document.getElementById('seedInput');
            data.seed = seedInput?.value ? parseInt(seedInput.value) : -1;
        }
        
        // Convert numeric values
        const numericFields = ['width', 'height', 'steps', 'cfg_scale', 'seed', 'lora_strength'];
        numericFields.forEach(field => {
            if (data[field] !== undefined) {
                data[field] = Number(data[field]);
            }
        });
        
        // Default values
        const defaults = {
            width: 768,
            height: 768,
            steps: 25,
            cfg_scale: 7.0,
            seed: -1,
            lora_strength: 0.5
        };
        
        Object.keys(defaults).forEach(key => {
            if (data[key] === undefined || data[key] === '') {
                data[key] = defaults[key];
            }
        });
        
        return data;
    }

    // Show/hide generation loading state
    showGenerationLoading(loading) {
        const generateBtn = document.getElementById('generateImageBtn');
        const generateBtnMain = document.getElementById('generateBtn');
        
        [generateBtn, generateBtnMain].forEach(btn => {
            if (btn) {
                btn.disabled = loading;
                
                const icon = btn.querySelector('i');
                if (icon) {
                    if (loading) {
                        icon.className = 'fas fa-spinner animate-spin';
                    } else {
                        icon.className = 'fas fa-play';
                    }
                }
            }
        });
    }

    // Setup event listeners
    setupEventListeners() {
        // Queue status click handler
        const queueStatus = document.getElementById('queueStatus');
        if (queueStatus) {
            queueStatus.addEventListener('click', () => {
                this.showQueueModal();
            });
        }
        
        // Page visibility handling
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.stopUpdates();
            } else {
                this.startUpdates();
            }
        });
    }

    // Show queue modal
    showQueueModal() {
        window.open('/queue-studio', '_blank', 'width=1200,height=800');
    }

    // Notification system
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type} animate-fadeIn`;
        
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        
        notification.innerHTML = `
            <i class="${icons[type]}"></i>
            <span>${message}</span>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${colors[type]};
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            gap: 8px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            max-width: 400px;
            font-size: 0.875rem;
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }, type === 'error' ? 5000 : 3000);
        
        // Click to dismiss
        notification.addEventListener('click', () => {
            notification.remove();
        });
    }

    // Check server connection
    async checkConnection() {
        try {
            await window.api.getQueueStatus();
            return true;
        } catch (error) {
            return false;
        }
    }

    // Cleanup
    destroy() {
        this.stopUpdates();
        this.initialized = false;
    }
}

// Export queue manager
window.QueueManager = QueueManager;
window.queue = new QueueManager();

// Performance monitoring
if (typeof performance !== 'undefined' && performance.mark) {
    performance.mark('queue-module-loaded');
}