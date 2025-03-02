/**
 * Product Details JavaScript
 * Handles core functionality, product loading, gallery, and product options
 * Version: 2.0
 */

// IIFE to avoid global scope pollution
const ProductDetails = (() => {
    // Private variables
    let currentProduct = null;
    let isLoading = false;
    let zoomEnabled = window.innerWidth > 768;

    // Cache DOM elements
    const elements = {
        container: document.querySelector('.product-details-section'),
        gallery: {
            mainImage: document.querySelector('.main-product-image'),
            thumbnails: document.querySelector('.thumbnail-gallery'),
            zoomLens: document.querySelector('.zoom-lens'),
            zoomResult: document.querySelector('.zoom-result')
        },
        info: {
            title: document.querySelector('.product-title'),
            price: document.querySelector('.current-price'),
            oldPrice: document.querySelector('.old-price'),
            rating: document.querySelector('.rating-stars'),
            ratingCount: document.querySelector('.rating-count'),
            stock: document.querySelector('.stock-status'),
            sku: document.querySelector('.sku-value')
        },
        options: {
            variantsContainer: document.querySelector('.product-variants'),
            quantityInput: document.querySelector('.quantity-input'),
            quantityPlus: document.querySelector('.quantity-btn.plus'),
            quantityMinus: document.querySelector('.quantity-btn.minus')
        },
        actions: {
            addToCart: document.querySelector('.add-to-cart-btn'),
            wishlist: document.querySelector('.wishlist-btn')
        },
        breadcrumb: {
            category: document.querySelector('.category-link'),
            product: document.querySelector('.product-name')
        },
        loadingOverlay: document.querySelector('.loading-overlay'),
        errorMessage: document.querySelector('.error-message')
    };

    /**
     * Initialize the product details page
     */
    async function init() {
        try {
            // Get product slug from URL
            const productSlug = getProductSlugFromUrl();
            if (!productSlug) throw new Error('Product not found');

            // Show loading state
            showLoading(true);

            // Load product data from API
            currentProduct = await loadProductData(productSlug);
            
            // Initialize all components
            initializeProduct();
            
            // Hide loading state
            showLoading(false);

        } catch (error) {
            console.error('Failed to initialize product page:', error);
            showError(true, error.message);
        }
    }

    /**
     * Load product data from API
     * @param {string} productSlug - The product slug to load
     * @returns {Promise<Object>} The product data
     */
    async function loadProductData(productSlug) {
        try {
            // Check if ApiService is available
            if (!window.ApiService) {
                throw new Error('API service not available');
            }
            
            const response = await window.ApiService.get(`/products/${productSlug}`);
            
            if (!response.success) {
                throw new Error('Failed to load product data');
            }
            
            return response.product;

        } catch (error) {
            throw new Error(`Failed to load product: ${error.message}`);
        }
    }

    /**
     * Initialize all product components with loaded data
     */
    function initializeProduct() {
        if (!currentProduct) return;

        // Build product detail page HTML
        buildProductHTML();

        // Update page metadata
        updateMetadata();
        
        // Update breadcrumb
        updateBreadcrumb();
        
        // Initialize gallery
        initGallery();
        
        // Initialize quantity selector
        initQuantitySelector();
        
        // Initialize product actions
        initProductActions();
        
        // Initialize related products (if available)
        if (currentProduct.related_products && currentProduct.related_products.length) {
            initRelatedProducts();
        }
    }
    
    /**
     * Build the product detail HTML structure
     */
    function buildProductHTML() {
        if (!elements.container || !currentProduct) return;
        
        // Format price display
        let priceHtml = '';
        if (currentProduct.old_price) {
            priceHtml = `
                <span class="current-price">$${currentProduct.price.toFixed(2)}</span>
                <span class="old-price">$${currentProduct.old_price.toFixed(2)}</span>
                <span class="discount-label">Save ${currentProduct.discount_percentage}%</span>
            `;
        } else {
            priceHtml = `<span class="current-price">$${currentProduct.price.toFixed(2)}</span>`;
        }
        
        // Availability status
        const stockStatus = currentProduct.stock > 0 
            ? `<span class="stock-status in-stock">In Stock</span>` 
            : `<span class="stock-status out-of-stock">Out of Stock</span>`;
        
        // Product HTML structure
        const productHTML = `
            <div class="product-container">
                <div class="product-gallery">
                    <div class="main-image-container">
                        <img src="${currentProduct.image_main}" alt="${currentProduct.title}" class="main-product-image">
                        <div class="zoom-lens"></div>
                    </div>
                    <div class="zoom-result"></div>
                    <div class="thumbnail-gallery">
                        <!-- Thumbnails will be added dynamically -->
                    </div>
                </div>
                
                <div class="product-info">
                    <h1 class="product-title">${currentProduct.title}</h1>
                    
                    <div class="product-meta">
                        <div class="rating-wrapper">
                            <div class="rating-stars">
                                <i class="fas fa-star"></i>
                                <i class="fas fa-star"></i>
                                <i class="fas fa-star"></i>
                                <i class="fas fa-star"></i>
                                <i class="fas fa-star-half-alt"></i>
                            </div>
                            <span class="rating-count">(${Math.floor(Math.random() * 30) + 10} reviews)</span>
                        </div>
                        <div class="sku-wrapper">
                            <span class="sku-label">SKU:</span>
                            <span class="sku-value">${currentProduct.sku}</span>
                        </div>
                    </div>
                    
                    <div class="price-wrapper">
                        ${priceHtml}
                        <span class="unit">${currentProduct.unit || ''}</span>
                    </div>
                    
                    <div class="availability-wrapper">
                        ${stockStatus}
                    </div>
                    
                    <div class="product-description">
                        ${currentProduct.description || 'No description available.'}
                    </div>
                    
                    <div class="product-actions">
                        <div class="quantity-selector">
                            <label>Quantity:</label>
                            <div class="quantity-controls">
                                <button class="quantity-btn minus">-</button>
                                <input type="number" class="quantity-input" value="1" min="1" max="${currentProduct.stock}" ${currentProduct.stock <= 0 ? 'disabled' : ''}>
                                <button class="quantity-btn plus">+</button>
                            </div>
                        </div>
                        
                        <div class="action-buttons">
                            <button class="add-to-cart-btn" ${currentProduct.stock <= 0 ? 'disabled' : ''}>
                                <i class="fas fa-shopping-cart"></i> Add to Cart
                            </button>
                            <button class="wishlist-btn">
                                <i class="far fa-heart"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="product-category">
                        <span class="category-label">Category:</span>
                        <a href="shop.html?category=${currentProduct.category?.slug}" class="category-link">${currentProduct.category?.name || 'Uncategorized'}</a>
                    </div>
                    
                    <div class="product-share">
                        <span class="share-label">Share:</span>
                        <div class="social-icons">
                            <a href="#" class="social-icon" title="Share on Facebook">
                                <i class="fab fa-facebook-f"></i>
                            </a>
                            <a href="#" class="social-icon" title="Share on Twitter">
                                <i class="fab fa-twitter"></i>
                            </a>
                            <a href="#" class="social-icon" title="Share on Pinterest">
                                <i class="fab fa-pinterest-p"></i>
                            </a>
                            <a href="#" class="social-icon" title="Share via Email">
                                <i class="fas fa-envelope"></i>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Related Products (if available) -->
            <div class="related-products-section">
                <h2>You May Also Like</h2>
                <div class="related-products-slider"></div>
            </div>
        `;
        
        // Update the container with the product HTML
        elements.container.innerHTML = productHTML;
        
        // Update cached elements with new DOM elements
        updateCachedElements();
    }
    
    /**
     * Update cached DOM elements after rebuilding the product HTML
     */
    function updateCachedElements() {
        elements.gallery.mainImage = document.querySelector('.main-product-image');
        elements.gallery.thumbnails = document.querySelector('.thumbnail-gallery');
        elements.gallery.zoomLens = document.querySelector('.zoom-lens');
        elements.gallery.zoomResult = document.querySelector('.zoom-result');
        
        elements.info.title = document.querySelector('.product-title');
        elements.info.price = document.querySelector('.current-price');
        elements.info.oldPrice = document.querySelector('.old-price');
        elements.info.rating = document.querySelector('.rating-stars');
        elements.info.ratingCount = document.querySelector('.rating-count');
        elements.info.stock = document.querySelector('.stock-status');
        elements.info.sku = document.querySelector('.sku-value');
        
        elements.options.quantityInput = document.querySelector('.quantity-input');
        elements.options.quantityPlus = document.querySelector('.quantity-btn.plus');
        elements.options.quantityMinus = document.querySelector('.quantity-btn.minus');
        
        elements.actions.addToCart = document.querySelector('.add-to-cart-btn');
        elements.actions.wishlist = document.querySelector('.wishlist-btn');
    }

    /**
     * Initialize the product gallery and zoom functionality
     */
    function initGallery() {
        if (!elements.gallery.mainImage || !currentProduct.image_main) return;

        // Set main image
        elements.gallery.mainImage.src = currentProduct.image_main;
        elements.gallery.mainImage.alt = currentProduct.title;

        // Create thumbnails
        let thumbnailsHtml = `
            <div class="thumbnail active" 
                 data-image="${currentProduct.image_main}"
                 role="button"
                 tabindex="0"
                 aria-label="Product image 1">
                <img src="${currentProduct.image_main}" alt="${currentProduct.title} - Main View">
            </div>
        `;

        // Add additional images if available
        if (currentProduct.additional_images && currentProduct.additional_images.length) {
            currentProduct.additional_images.forEach((image, index) => {
                thumbnailsHtml += `
                    <div class="thumbnail" 
                         data-image="${image.image_path}"
                         role="button"
                         tabindex="0"
                         aria-label="Product image ${index + 2}">
                        <img src="${image.image_path}" alt="${currentProduct.title} - View ${index + 2}">
                    </div>
                `;
            });
        }

        elements.gallery.thumbnails.innerHTML = thumbnailsHtml;

        // Add thumbnail click handlers
        elements.gallery.thumbnails.querySelectorAll('.thumbnail').forEach(thumb => {
            thumb.addEventListener('click', handleThumbnailClick);
            thumb.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleThumbnailClick.call(thumb);
                }
            });
        });

        // Initialize zoom functionality if enabled
        if (zoomEnabled) {
            initZoom();
        }
    }

    /**
     * Handle thumbnail click event
     * @param {Event} e - The click event
     */
    function handleThumbnailClick(e) {
        // Remove active class from all thumbnails
        elements.gallery.thumbnails.querySelectorAll('.thumbnail')
            .forEach(thumb => thumb.classList.remove('active'));

        // Add active class to clicked thumbnail
        this.classList.add('active');

        // Update main image
        const newImage = this.dataset.image;
        elements.gallery.mainImage.src = newImage;

        // Update zoom if enabled
        if (zoomEnabled) {
            updateZoom();
        }
    }

    /**
     * Initialize zoom functionality
     */
    function initZoom() {
        if (!elements.gallery.zoomLens || !elements.gallery.zoomResult) return;

        const mainImage = elements.gallery.mainImage;
        const zoomLens = elements.gallery.zoomLens;
        const zoomResult = elements.gallery.zoomResult;

        mainImage.addEventListener('mousemove', (e) => {
            e.preventDefault();
            
            // Show zoom elements
            zoomLens.style.display = 'block';
            zoomResult.style.display = 'block';

            // Calculate zoom
            const { x, y } = getZoomPosition(e);

            // Update lens position
            zoomLens.style.left = `${x}px`;
            zoomLens.style.top = `${y}px`;

            // Update zoom result
            const cx = zoomResult.offsetWidth / zoomLens.offsetWidth;
            const cy = zoomResult.offsetHeight / zoomLens.offsetHeight;

            zoomResult.style.backgroundImage = `url(${mainImage.src})`;
            zoomResult.style.backgroundSize = `${mainImage.width * cx}px ${mainImage.height * cy}px`;
            zoomResult.style.backgroundPosition = `-${x * cx}px -${y * cy}px`;
        });

        // Hide zoom on mouse leave
        mainImage.addEventListener('mouseleave', () => {
            zoomLens.style.display = 'none';
            zoomResult.style.display = 'none';
        });
    }

    /**
     * Calculate zoom position
     * @param {Event} e - Mouse event
     * @returns {Object} x and y coordinates
     */
    function getZoomPosition(e) {
        const mainImage = elements.gallery.mainImage;
        const zoomLens = elements.gallery.zoomLens;
        
        const rect = mainImage.getBoundingClientRect();
        let x = e.clientX - rect.left - (zoomLens.offsetWidth / 2);
        let y = e.clientY - rect.top - (zoomLens.offsetHeight / 2);

        // Boundary checks
        const maxX = mainImage.width - zoomLens.offsetWidth;
        const maxY = mainImage.height - zoomLens.offsetHeight;

        x = Math.min(Math.max(0, x), maxX);
        y = Math.min(Math.max(0, y), maxY);

        return { x, y };
    }

    /**
     * Update zoom functionality
     */
    function updateZoom() {
        // This function is called when the main image is changed
        // Nothing to do here since the zoom is updated on mousemove
    }

    /**
     * Initialize quantity selector
     */
    function initQuantitySelector() {
        if (!elements.options.quantityInput) return;

        const input = elements.options.quantityInput;
        const plus = elements.options.quantityPlus;
        const minus = elements.options.quantityMinus;

        plus.addEventListener('click', () => {
            const currentValue = parseInt(input.value);
            const maxValue = parseInt(input.getAttribute('max')) || 99;
            if (currentValue < maxValue) {
                input.value = currentValue + 1;
                updateQuantityState();
            }
        });

        minus.addEventListener('click', () => {
            const currentValue = parseInt(input.value);
            const minValue = parseInt(input.getAttribute('min')) || 1;
            if (currentValue > minValue) {
                input.value = currentValue - 1;
                updateQuantityState();
            }
        });

        input.addEventListener('change', () => {
            let value = parseInt(input.value);
            const min = parseInt(input.getAttribute('min')) || 1;
            const max = parseInt(input.getAttribute('max')) || 99;

            value = Math.min(Math.max(value, min), max);
            input.value = value;
            updateQuantityState();
        });

        // Initialize quantity state
        updateQuantityState();
    }

    /**
     * Update quantity selector state
     */
    function updateQuantityState() {
        const input = elements.options.quantityInput;
        const plus = elements.options.quantityPlus;
        const minus = elements.options.quantityMinus;

        if (!input || !plus || !minus) return;

        const currentValue = parseInt(input.value);
        const minValue = parseInt(input.getAttribute('min')) || 1;
        const maxValue = parseInt(input.getAttribute('max')) || 99;

        minus.disabled = currentValue <= minValue;
        plus.disabled = currentValue >= maxValue;
    }

    /**
     * Update page metadata
     */
    function updateMetadata() {
        document.title = currentProduct.title + ' - AfriMart Depot';
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
            metaDescription.setAttribute('content', currentProduct.description);
        }
    }

    /**
     * Update breadcrumb navigation
     */
    function updateBreadcrumb() {
        const productNameEl = document.querySelector('.breadcrumb-item.current .product-name');
        const categoryLinkEl = document.querySelector('.breadcrumb-item .category-link');
        
        if (productNameEl) {
            productNameEl.textContent = currentProduct.title;
        }
        
        if (categoryLinkEl && currentProduct.category) {
            categoryLinkEl.textContent = currentProduct.category.name;
            categoryLinkEl.href = `shop.html?category=${currentProduct.category.slug}`;
        }
    }

    /**
     * Initialize product actions (like add to cart)
     */
    function initProductActions() {
        // Add to Cart button
        if (elements.actions.addToCart) {
            elements.actions.addToCart.addEventListener('click', () => {
                if (currentProduct.stock <= 0) return;
                
                const quantity = parseInt(elements.options.quantityInput.value) || 1;
                
                // Check if CartService is available
                if (window.CartService) {
                    window.CartService.addToCart(currentProduct, quantity);
                    
                    // Show success message
                    showSuccessModal(currentProduct.title, quantity);
                } else {
                    console.error('CartService not available');
                    showToast('Unable to add to cart. Please try again later.', 'error');
                }
            });
        }
        
        // Wishlist button
        if (elements.actions.wishlist) {
            elements.actions.wishlist.addEventListener('click', () => {
                const icon = elements.actions.wishlist.querySelector('i');
                
                if (icon.classList.contains('far')) {
                    icon.classList.remove('far');
                    icon.classList.add('fas');
                    icon.style.color = '#dc3545';
                    showToast('Product added to wishlist!', 'success');
                } else {
                    icon.classList.remove('fas');
                    icon.classList.add('far');
                    icon.style.color = '';
                    showToast('Product removed from wishlist!', 'info');
                }
            });
        }
    }
    
    /**
     * Initialize related products
     */
    function initRelatedProducts() {
        const sliderContainer = document.querySelector('.related-products-slider');
        if (!sliderContainer || !currentProduct.related_products) return;
        
        // Create HTML for related products
        let sliderHtml = '';
        currentProduct.related_products.forEach(product => {
            const priceHtml = product.old_price ? 
                `<span class="price">$${product.price.toFixed(2)}</span>
                 <span class="old-price">$${product.old_price.toFixed(2)}</span>` :
                `<span class="price">$${product.price.toFixed(2)}</span>`;
            
            sliderHtml += `
                <div class="product-card" data-product-id="${product.id}">
                    <div class="product-image">
                        <img src="${product.image_main || 'images/placeholder.jpg'}" alt="${product.title}">
                        <div class="product-actions">
                            <a href="product-details.html?product=${product.slug}" class="action-btn view-details">
                                <i class="fas fa-eye"></i>
                            </a>
                            <button class="action-btn add-to-wishlist">
                                <i class="far fa-heart"></i>
                            </button>
                        </div>
                    </div>
                    <div class="product-info">
                        <h3 class="product-title">
                            <a href="product-details.html?product=${product.slug}">${product.title}</a>
                        </h3>
                        <div class="product-price">
                            ${priceHtml}
                            <span class="unit">${product.unit || ''}</span>
                        </div>
                        <button class="add-to-cart">Add to Cart</button>
                    </div>
                </div>
            `;
        });
        
        sliderContainer.innerHTML = sliderHtml;
        
        // Add event listeners to related products
        const addToCartButtons = sliderContainer.querySelectorAll('.add-to-cart');
        if (addToCartButtons.length) {
            addToCartButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const productCard = this.closest('.product-card');
                    const productId = parseInt(productCard.dataset.productId);
                    
                    // Find this product in related products
                    const product = currentProduct.related_products.find(p => p.id === productId);
                    
                    if (product && window.CartService) {
                        window.CartService.addToCart(product);
                        
                        // Update UI
                        const originalText = this.textContent;
                        this.innerHTML = '<i class="fas fa-check"></i> Added!';
                        this.style.backgroundColor = '#28a745';
                        
                        // Show toast notification
                        showToast(`${product.title} added to cart!`, 'success');
                        
                        setTimeout(() => {
                            this.innerHTML = originalText;
                            this.style.backgroundColor = '';
                        }, 1500);
                    }
                });
            });
        }
    }

    /**
     * Show success modal after adding to cart
     * @param {string} productTitle - Title of the product
     * @param {number} quantity - Quantity added
     */
    function showSuccessModal(productTitle, quantity) {
        const cartSuccessModal = document.querySelector('.cart-success-modal');
        if (!cartSuccessModal) return;
        
        // Update modal content
        const modalContent = cartSuccessModal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.innerHTML = `
                <i class="fas fa-check-circle"></i>
                <h3>${quantity} item(s) added to your cart!</h3>
                <p>"${productTitle}" has been added to your shopping cart.</p>
                <div class="modal-buttons">
                    <button class="continue-shopping">Continue Shopping</button>
                    <a href="cart.html" class="view-cart">View Cart</a>
                </div>
            `;
        }
        
        // Show modal
        cartSuccessModal.style.display = 'flex';
        
        // Handle continue shopping button
        const continueBtn = cartSuccessModal.querySelector('.continue-shopping');
        if (continueBtn) {
            continueBtn.addEventListener('click', () => {
                cartSuccessModal.style.display = 'none';
            });
        }
        
        // Close on overlay click
        const modalOverlay = cartSuccessModal.querySelector('.modal-overlay');
        if (modalOverlay) {
            modalOverlay.addEventListener('click', () => {
                cartSuccessModal.style.display = 'none';
            });
        }
    }

    /**
     * Show toast notification
     * @param {string} message - Message to display
     * @param {string} type - Type of toast (success, error, info)
     */
    function showToast(message, type = 'info') {
        // Check for existing toast container
        let toastContainer = document.querySelector('.toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container';
            document.body.appendChild(toastContainer);
            
            // Style container
            Object.assign(toastContainer.style, {
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                zIndex: '9999',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end'
            });
        }
        
        // Create toast
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        // Icons based on type
        const icons = {
            success: '<i class="fas fa-check-circle"></i>',
            error: '<i class="fas fa-exclamation-circle"></i>',
            info: '<i class="fas fa-info-circle"></i>',
            warning: '<i class="fas fa-exclamation-triangle"></i>'
        };
        
        toast.innerHTML = `
            <div class="toast-content">
                ${icons[type] || icons.info}
                <span>${message}</span>
            </div>
            <button class="toast-close"><i class="fas fa-times"></i></button>
        `;
        
        // Style toast
        Object.assign(toast.style, {
            backgroundColor: type === 'success' ? '#28a745' : 
                            type === 'error' ? '#dc3545' : 
                            type === 'warning' ? '#ffc107' : '#17a2b8',
            color: type === 'warning' ? '#212529' : '#fff',
            padding: '12px 20px',
            borderRadius: '4px',
            marginTop: '10px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            minWidth: '250px',
            transform: 'translateX(100%)',
            opacity: '0',
            transition: 'all 0.3s ease-in-out'
        });
        
        // Add to container
        toastContainer.appendChild(toast);
        
        // Close button event
        const closeButton = toast.querySelector('.toast-close');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                removeToast();
            });
        }
        
        // Show toast with animation
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
            toast.style.opacity = '1';
        }, 10);
        
        // Auto hide after delay
        const timeout = setTimeout(removeToast, 3000);
        
        function removeToast() {
            clearTimeout(timeout);
            toast.style.transform = 'translateX(100%)';
            toast.style.opacity = '0';
            
            setTimeout(() => {
                toast.remove();
                
                // Remove container if empty
                if (toastContainer.children.length === 0) {
                    toastContainer.remove();
                }
            }, 300);
        }
    }

    // Utility functions
    function getProductSlugFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('product');
    }

    function showLoading(show) {
        if (!elements.loadingOverlay) return;
        
        elements.loadingOverlay.style.display = show ? 'flex' : 'none';
        isLoading = show;
    }

    function showError(show, message = 'Failed to load product. Please try again.') {
        if (!elements.errorMessage) return;
        
        // Update error message text
        const errorText = elements.errorMessage.querySelector('p');
        if (errorText) {
            errorText.textContent = message;
        }
        
        elements.errorMessage.hidden = !show;
        
        if (elements.container) {
            elements.container.style.display = show ? 'none' : 'block';
        }
        
        // Add retry button functionality
        const retryButton = elements.errorMessage.querySelector('.retry-button');
        if (retryButton) {
            retryButton.addEventListener('click', () => {
                showError(false);
                init(); // Re-initialize the page
            });
        }
    }

    // Event listeners
    window.addEventListener('resize', () => {
        zoomEnabled = window.innerWidth > 768;
        if (zoomEnabled && elements.gallery.mainImage) {
            initZoom();
        }
    });

    // Return public methods
    return {
        init
    };
})();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Check if ApiService is available
    if (window.ApiService) {
        ProductDetails.init();
    } else {
        console.error('ApiService not available. Make sure api-service.js is loaded before product-details.js');
        if (document.querySelector('.loading-overlay')) {
            document.querySelector('.loading-overlay').style.display = 'none';
        }
        if (document.querySelector('.error-message')) {
            const errorMessage = document.querySelector('.error-message');
            errorMessage.querySelector('p').textContent = 'Could not connect to product service. Please try again later.';
            errorMessage.hidden = false;
        }
    }
});