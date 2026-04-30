/* =====================================================
   GALLERY MODULE - ComfyUI Studio
   Image gallery management and display
   ===================================================== */

class GalleryManager {
    constructor() {
        this.images = new Map();
        this.currentSort = 'newest';
        this.currentFilter = 'all';
        this.observers = new Map();
        this.initialized = false;
    }

    // Initialize gallery
    init() {
        if (this.initialized) return;
        
        console.log('🖼️ Initializing gallery...');
        
        this.setupContainers();
        this.setupObservers();
        this.loadStoredImages();
        
        this.initialized = true;
        console.log('✅ Gallery initialized');
    }

    // Setup gallery containers
    setupContainers() {
        this.galleryGrid = document.getElementById('galleryGrid');
        this.recentGrid = document.getElementById('recentGrid');
        
        if (!this.galleryGrid || !this.recentGrid) {
            console.error('❌ Gallery containers not found');
            return;
        }
    }

    // Setup intersection observers for lazy loading
    setupObservers() {
        if ('IntersectionObserver' in window) {
            this.imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.loadImage(entry.target);
                        this.imageObserver.unobserve(entry.target);
                    }
                });
            }, {
                threshold: 0.1,
                rootMargin: '50px'
            });
        }
    }

    // Add image to gallery
    addImage(imageData) {
        const id = imageData.id || this.generateId();
        const timestamp = imageData.timestamp || Date.now();
        
        const image = {
            id,
            url: imageData.url,
            thumbnail: imageData.thumbnail || imageData.url,
            prompt: imageData.prompt || '',
            metadata: imageData.metadata || {},
            timestamp,
            favorite: false,
            tags: imageData.tags || []
        };
        
        this.images.set(id, image);
        
        // Update displays
        this.updateRecentGrid();
        this.updateGalleryGrid();
        
        // Save to storage
        this.saveToStorage();
        
        console.log(`🖼️ Image added to gallery: ${id}`);
        
        return id;
    }

    // Remove image from gallery
    removeImage(id) {
        if (this.images.has(id)) {
            this.images.delete(id);
            this.updateRecentGrid();
            this.updateGalleryGrid();
            this.saveToStorage();
            console.log(`🗑️ Image removed from gallery: ${id}`);
        }
    }

    // Update recent images grid
    updateRecentGrid() {
        if (!this.recentGrid) return;
        
        const recentImages = Array.from(this.images.values())
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 8); // Show last 8 images
        
        if (recentImages.length === 0) {
            this.recentGrid.innerHTML = `
                <div class="recent-placeholder">
                    <i class="fas fa-image"></i>
                    <span>Your generated images will appear here</span>
                </div>
            `;
            return;
        }
        
        this.recentGrid.innerHTML = recentImages
            .map(image => this.createRecentImageHTML(image))
            .join('');
        
        // Setup lazy loading
        this.recentGrid.querySelectorAll('img[data-src]').forEach(img => {
            if (this.imageObserver) {
                this.imageObserver.observe(img);
            } else {
                this.loadImage(img);
            }
        });
    }

    // Update main gallery grid
    updateGalleryGrid() {
        if (!this.galleryGrid) return;
        
        const sortedImages = this.getSortedImages();
        const filteredImages = this.getFilteredImages(sortedImages);
        
        if (filteredImages.length === 0) {
            this.galleryGrid.innerHTML = `
                <div class="gallery-placeholder">
                    <i class="fas fa-folder-open"></i>
                    <span>No images in gallery</span>
                    <small>Generated images will be saved here</small>
                </div>
            `;
            return;
        }
        
        this.galleryGrid.innerHTML = filteredImages
            .map(image => this.createGalleryImageHTML(image))
            .join('');
        
        // Setup lazy loading
        this.galleryGrid.querySelectorAll('img[data-src]').forEach(img => {
            if (this.imageObserver) {
                this.imageObserver.observe(img);
            } else {
                this.loadImage(img);
            }
        });
    }

    // Create recent image HTML
    createRecentImageHTML(image) {
        return `
            <div class="recent-item" data-id="${image.id}" onclick="gallery.openImageModal('${image.id}')">
                <img data-src="${image.thumbnail}" alt="${this.escapeHtml(image.prompt)}" loading="lazy">
                <div class="recent-item-overlay">
                    <span class="recent-time">${this.formatTime(image.timestamp)}</span>
                </div>
            </div>
        `;
    }

    // Create gallery image HTML
    createGalleryImageHTML(image) {
        return `
            <div class="gallery-item" data-id="${image.id}">
                <img data-src="${image.thumbnail}" alt="${this.escapeHtml(image.prompt)}" loading="lazy">
                <div class="gallery-item-overlay">
                    <i class="fas fa-search-plus" onclick="gallery.openImageModal('${image.id}')"></i>
                </div>
                <div class="gallery-item-actions">
                    <button class="btn-icon" onclick="gallery.toggleFavorite('${image.id}')" 
                            title="${image.favorite ? 'Remove from favorites' : 'Add to favorites'}">
                        <i class="fas fa-heart ${image.favorite ? 'text-red-500' : ''}"></i>
                    </button>
                    <button class="btn-icon" onclick="gallery.downloadImage('${image.id}')" title="Download">
                        <i class="fas fa-download"></i>
                    </button>
                    <button class="btn-icon" onclick="gallery.removeImage('${image.id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    // Load image with lazy loading
    loadImage(img) {
        const src = img.dataset.src;
        if (src && !img.src) {
            img.src = src;
            img.classList.add('loaded');
            
            img.onload = () => {
                img.style.opacity = '1';
            };
            
            img.onerror = () => {
                img.src = this.getPlaceholderImage();
                img.classList.add('error');
            };
        }
    }

    // Open image modal
    openImageModal(imageId) {
        const image = this.images.get(imageId);
        if (!image) return;
        
        const modalData = {
            image: image.url,
            metadata: {
                'Prompt': image.prompt,
                'Created': new Date(image.timestamp).toLocaleString(),
                'ID': imageId,
                ...image.metadata
            }
        };
        
        if (window.components) {
            window.components.openModal('imageModal', modalData);
        }
    }

    // Toggle favorite status
    toggleFavorite(imageId) {
        const image = this.images.get(imageId);
        if (image) {
            image.favorite = !image.favorite;
            this.updateGalleryGrid();
            this.saveToStorage();
            console.log(`❤️ Image ${imageId} favorite status: ${image.favorite}`);
        }
    }

    // Download image
    async downloadImage(imageId) {
        const image = this.images.get(imageId);
        if (!image) return;
        
        try {
            const filename = `comfyui-${imageId}-${Date.now()}.png`;
            await window.api.downloadImage(image.url, filename);
        } catch (error) {
            console.error('❌ Failed to download image:', error);
            this.showNotification('Failed to download image', 'error');
        }
    }

    // Sorting methods
    setSortMode(mode) {
        this.currentSort = mode;
        this.updateGalleryGrid();
        console.log(`🔄 Gallery sort changed to: ${mode}`);
    }

    getSortedImages() {
        const images = Array.from(this.images.values());
        
        switch (this.currentSort) {
            case 'newest':
                return images.sort((a, b) => b.timestamp - a.timestamp);
            case 'oldest':
                return images.sort((a, b) => a.timestamp - b.timestamp);
            case 'favorites':
                return images.sort((a, b) => (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0));
            case 'prompt':
                return images.sort((a, b) => a.prompt.localeCompare(b.prompt));
            default:
                return images;
        }
    }

    // Filtering methods
    setFilter(filter) {
        this.currentFilter = filter;
        this.updateGalleryGrid();
        console.log(`🔍 Gallery filter changed to: ${filter}`);
    }

    getFilteredImages(images) {
        switch (this.currentFilter) {
            case 'favorites':
                return images.filter(img => img.favorite);
            case 'recent':
                const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
                return images.filter(img => img.timestamp > weekAgo);
            case 'all':
            default:
                return images;
        }
    }

    // Storage methods
    saveToStorage() {
        try {
            const data = Array.from(this.images.entries());
            localStorage.setItem('comfyui-gallery', JSON.stringify(data));
        } catch (error) {
            console.error('❌ Failed to save gallery to storage:', error);
        }
    }

    loadStoredImages() {
        try {
            const stored = localStorage.getItem('comfyui-gallery');
            if (stored) {
                const data = JSON.parse(stored);
                this.images = new Map(data);
                this.updateRecentGrid();
                this.updateGalleryGrid();
                console.log(`📚 Loaded ${this.images.size} images from storage`);
            }
        } catch (error) {
            console.error('❌ Failed to load gallery from storage:', error);
        }
    }

    // Clear all images
    clearGallery() {
        if (confirm('Are you sure you want to clear all images from the gallery?')) {
            this.images.clear();
            this.updateRecentGrid();
            this.updateGalleryGrid();
            this.saveToStorage();
            console.log('🧹 Gallery cleared');
        }
    }

    // Export gallery
    exportGallery() {
        const data = {
            version: '1.0',
            timestamp: Date.now(),
            images: Array.from(this.images.values())
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `comfyui-gallery-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
        console.log('📦 Gallery exported');
    }

    // Utility methods
    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }

    formatTime(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return `${Math.floor(diff / 86400000)}d ago`;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    getPlaceholderImage() {
        return 'data:image/svg+xml,' + encodeURIComponent(`
            <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
                <rect width="200" height="200" fill="#374151"/>
                <text x="100" y="100" text-anchor="middle" dy=".3em" fill="#9ca3af" font-family="Arial" font-size="14">Image not found</text>
            </svg>
        `);
    }

    showNotification(message, type = 'info') {
        // Simple notification system
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Get stats
    getStats() {
        return {
            total: this.images.size,
            favorites: Array.from(this.images.values()).filter(img => img.favorite).length,
            recent: Array.from(this.images.values()).filter(img => {
                const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
                return img.timestamp > weekAgo;
            }).length
        };
    }

    // Cleanup
    destroy() {
        if (this.imageObserver) {
            this.imageObserver.disconnect();
        }
        this.observers.clear();
        this.initialized = false;
    }
}

// Export gallery manager
window.GalleryManager = GalleryManager;
window.gallery = new GalleryManager();

// Performance monitoring
if (typeof performance !== 'undefined' && performance.mark) {
    performance.mark('gallery-module-loaded');
}