/* =====================================================
   API MODULE - ComfyUI Studio
   Handles all API communications
   ===================================================== */

class ComfyUIAPI {
    constructor() {
        this.baseURL = '';
        this.retryAttempts = 3;
        this.timeout = 30000;
    }

    // Generic API request method
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: this.timeout,
        };

        const finalOptions = { ...defaultOptions, ...options };

        for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), finalOptions.timeout);

                const response = await fetch(url, {
                    ...finalOptions,
                    signal: controller.signal,
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    return await response.json();
                }
                return await response.text();

            } catch (error) {
                console.warn(`API request attempt ${attempt} failed:`, error);
                
                if (attempt === this.retryAttempts) {
                    throw error;
                }
                
                // Exponential backoff
                await this.delay(Math.pow(2, attempt) * 1000);
            }
        }
    }

    // Utility method for delays
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Get available models
    async getModels() {
        try {
            console.log('🔄 Fetching available models...');
            const models = await this.request('/models');
            console.log('✅ Models loaded:', models.length, 'models');
            return models;
        } catch (error) {
            console.error('❌ Failed to fetch models:', error);
            throw new Error('Failed to load models. Please check your connection.');
        }
    }

    // Get available LoRAs
    async getLoras() {
        try {
            console.log('🔄 Fetching available LoRAs...');
            const loras = await this.request('/loras');
            console.log('✅ LoRAs loaded:', loras.length, 'LoRAs');
            return loras;
        } catch (error) {
            console.error('❌ Failed to fetch LoRAs:', error);
            throw new Error('Failed to load LoRAs. Please check your connection.');
        }
    }

    // Submit generation request
    async generateImage(params) {
        try {
            console.log('🎨 Submitting generation request:', params);
            
            // Validate required parameters
            this.validateGenerationParams(params);
            
            const result = await this.request('/generate', {
                method: 'POST',
                body: JSON.stringify(params),
            });
            
            console.log('✅ Generation submitted successfully:', result);
            return result;
        } catch (error) {
            console.error('❌ Failed to submit generation:', error);
            throw error;
        }
    }

    // Validate generation parameters
    validateGenerationParams(params) {
        const required = ['prompt', 'model'];
        const missing = required.filter(param => !params[param] || params[param].trim() === '');
        
        if (missing.length > 0) {
            throw new Error(`Missing required parameters: ${missing.join(', ')}`);
        }

        // Validate numeric parameters
        const numericParams = {
            width: { min: 256, max: 2048 },
            height: { min: 256, max: 2048 },
            steps: { min: 1, max: 100 },
            cfg_scale: { min: 1, max: 20 },
        };

        for (const [param, bounds] of Object.entries(numericParams)) {
            if (params[param] !== undefined) {
                const value = Number(params[param]);
                if (isNaN(value) || value < bounds.min || value > bounds.max) {
                    throw new Error(`${param} must be between ${bounds.min} and ${bounds.max}`);
                }
            }
        }
    }

    // Get queue status
    async getQueueStatus() {
        try {
            const status = await this.request('/queue');
            return status;
        } catch (error) {
            console.error('❌ Failed to fetch queue status:', error);
            return {
                pending: [],
                running: [],
                history: [],
                queue_length: 0,
                active_generations: 0,
                max_concurrent: 3
            };
        }
    }

    // Get specific queue item
    async getQueueItem(itemId) {
        try {
            const item = await this.request(`/queue/${itemId}`);
            return item;
        } catch (error) {
            console.error(`❌ Failed to fetch queue item ${itemId}:`, error);
            throw error;
        }
    }

    // Cancel queue item
    async cancelQueueItem(itemId) {
        try {
            console.log(`🚫 Cancelling queue item: ${itemId}`);
            const result = await this.request(`/queue/${itemId}/cancel`, {
                method: 'POST',
            });
            console.log('✅ Queue item cancelled successfully');
            return result;
        } catch (error) {
            console.error(`❌ Failed to cancel queue item ${itemId}:`, error);
            throw error;
        }
    }

    // Clear queue
    async clearQueue() {
        try {
            console.log('🧹 Clearing queue...');
            const result = await this.request('/queue/clear', {
                method: 'POST',
            });
            console.log('✅ Queue cleared successfully');
            return result;
        } catch (error) {
            console.error('❌ Failed to clear queue:', error);
            throw error;
        }
    }

    // Get system info
    async getSystemInfo() {
        try {
            const info = await this.request('/system/info');
            return info;
        } catch (error) {
            console.error('❌ Failed to fetch system info:', error);
            return {
                vram_usage: 'Unknown',
                estimated_time: 'Unknown',
                gpu_name: 'Unknown'
            };
        }
    }

    // Download image
    async downloadImage(imageUrl, filename) {
        try {
            const response = await fetch(imageUrl);
            if (!response.ok) {
                throw new Error(`Failed to download image: ${response.statusText}`);
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = filename || 'generated-image.png';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            window.URL.revokeObjectURL(url);
            console.log('✅ Image downloaded successfully');
        } catch (error) {
            console.error('❌ Failed to download image:', error);
            throw error;
        }
    }
}

// Export API instance
window.ComfyUIAPI = ComfyUIAPI;
window.api = new ComfyUIAPI();

// Performance monitoring
if (typeof performance !== 'undefined' && performance.mark) {
    performance.mark('api-module-loaded');
}