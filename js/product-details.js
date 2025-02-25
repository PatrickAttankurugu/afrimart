/**
 * Product Details JavaScript - Part 1
 * Handles core functionality, product loading, gallery, and product options
 * Version: 1.1
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
            // Get product ID from URL
            const productId = getProductIdFromUrl();
            if (!productId) throw new Error('Product ID not found');

            // Show loading state
            showLoading(true);

            // Load product data
            currentProduct = await loadProductData(productId);
            
            // Initialize all components
            initializeProduct();
            
            // Hide loading state
            showLoading(false);

        } catch (error) {
            console.error('Failed to initialize product page:', error);
            showError(true);
        }
    }

    /**
     * Load product data from server
     * @param {string} productId - The product ID to load
     * @returns {Promise<Object>} The product data
     */
    async function loadProductData(productId) {
        try {
            const response = await fetch(`/api/products/${productId}`);
            if (!response.ok) throw new Error('Product not found');
            
            const product = await response.json();
            return product;

        } catch (error) {
            throw new Error(`Failed to load product: ${error.message}`);
        }
    }

    /**
     * Initialize all product components with loaded data
     */
    function initializeProduct() {
        if (!currentProduct) return;

        // Update page metadata
        updateMetadata();
        
        // Update breadcrumb
        updateBreadcrumb();
        
        // Initialize gallery
        initGallery();
        
        // Initialize product options
        initProductOptions();
        
        // Initialize quantity selector
        initQuantitySelector();
        
        // Initialize product actions
        initProductActions();
        
        // Update product information
        updateProductInfo();
    }

    /**
     * Initialize the product gallery and zoom functionality
     */
    function initGallery() {
        if (!elements.gallery.mainImage || !currentProduct.images.length) return;

        // Set main image
        elements.gallery.mainImage.src = currentProduct.images[0].large;
        elements.gallery.mainImage.alt = currentProduct.name;

        // Create thumbnails
        const thumbnailsHtml = currentProduct.images.map((image, index) => `
            <div class="thumbnail ${index === 0 ? 'active' : ''}" 
                 data-image="${image.large}"
                 role="button"
                 tabindex="0"
                 aria-label="Product image ${index + 1}">
                <img src="${image.thumbnail}" alt="${currentProduct.name} - View ${index + 1}">
            </div>
        `).join('');

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
     * Initialize product options (variants)
     */
    function initProductOptions() {
        if (!currentProduct.variants || !elements.options.variantsContainer) return;

        // Create HTML for each variant type
        const variantsHtml = Object.entries(currentProduct.variants).map(([type, options]) => `
            <div class="variant-group" data-variant-type="${type}">
                <label class="variant-label">${type}</label>
                <div class="variant-options">
                    ${options.map((option, index) => `
                        <button class="variant-option ${index === 0 ? 'active' : ''} 
                                ${option.available ? '' : 'disabled'}"
                                data-variant-id="${option.id}"
                                ${option.available ? '' : 'disabled'}
                                aria-label="${option.name}"
                                title="${option.available ? option.name : 'Out of stock'}">
                            ${option.name}
                        </button>
                    `).join('')}
                </div>
            </div>
        `).join('');

        elements.options.variantsContainer.innerHTML = variantsHtml;

        // Add event listeners to variant options
        elements.options.variantsContainer.querySelectorAll('.variant-option').forEach(option => {
            option.addEventListener('click', handleVariantSelection);
        });
    }

    /**
     * Handle variant selection
     * @param {Event} e - Click event
     */
    function handleVariantSelection(e) {
        const variantGroup = e.target.closest('.variant-group');
        
        // Remove active class from all options in this group
        variantGroup.querySelectorAll('.variant-option')
            .forEach(opt => opt.classList.remove('active'));

        // Add active class to selected option
        e.target.classList.add('active');

        // Update product based on selected variants
        updateProductVariant();
    }

    /**
     * Update product information based on selected variant
     */
    function updateProductVariant() {
        const selectedVariants = {};
        
        // Get all selected variants
        elements.options.variantsContainer.querySelectorAll('.variant-group').forEach(group => {
            const type = group.dataset.variantType;
            const selectedOption = group.querySelector('.variant-option.active');
            if (selectedOption) {
                selectedVariants[type] = selectedOption.dataset.variantId;
            }
        });

        // Find matching variant combination
        const variant = findMatchingVariant(selectedVariants);
        
        if (variant) {
            // Update price
            elements.info.price.textContent = formatPrice(variant.price);
            if (variant.oldPrice) {
                elements.info.oldPrice.textContent = formatPrice(variant.oldPrice);
                elements.info.oldPrice.style.display = 'inline';
            } else {
                elements.info.oldPrice.style.display = 'none';
            }

            // Update stock status
            updateStockStatus(variant.stock);

            // Update SKU
            if (elements.info.sku) {
                elements.info.sku.textContent = variant.sku;
            }

            // Enable/disable add to cart button
            elements.actions.addToCart.disabled = variant.stock === 0;
        }
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
        document.title = currentProduct.name;
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
            metaDescription.setAttribute('content', currentProduct.description);
        }
    }

    /**
     * Update breadcrumb navigation
     */
    function updateBreadcrumb() {
        elements.breadcrumb.product.textContent = currentProduct.name;
        // Assuming category is available in currentProduct
        elements.breadcrumb.category.textContent = currentProduct.category;
    }

    /**
     * Initialize product actions (like add to cart)
     */
    function initProductActions() {
        elements.actions.addToCart.addEventListener('click', () => {
            // Logic to add product to cart
            console.log('Add to cart clicked');
        });
        // Add more actions as needed
    }

    /**
     * Update product information displayed on the page
     */
    function updateProductInfo() {
        elements.info.title.textContent = currentProduct.name;
        elements.info.price.textContent = formatPrice(currentProduct.price);
        elements.info.ratingCount.textContent = currentProduct.ratingCount || 0;
        elements.info.stock.textContent = currentProduct.stock > 0 ? 'In Stock' : 'Out of Stock';
        elements.info.sku.textContent = currentProduct.sku || 'N/A';
    }

    /**
     * Find matching variant based on selected options
     * @param {Object} selectedVariants - Selected variant IDs
     * @returns {Object|null} - Matching variant or null
     */
    function findMatchingVariant(selectedVariants) {
        return currentProduct.variants.find(variant => {
            return Object.keys(selectedVariants).every(type => {
                return variant[type] === selectedVariants[type];
            });
        }) || null;
    }

    /**
     * Update stock status based on selected variant
     * @param {number} stock - Stock amount
     */
    function updateStockStatus(stock) {
        elements.info.stock.textContent = stock > 0 ? 'In Stock' : 'Out of Stock';
        elements.actions.addToCart.disabled = stock === 0;
    }

    // Utility functions
    function getProductIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id');
    }

    function showLoading(show) {
        elements.loadingOverlay.style.display = show ? 'flex' : 'none';
        isLoading = show;
    }

    function showError(show) {
        elements.errorMessage.style.display = show ? 'block' : 'none';
        elements.container.style.display = show ? 'none' : 'block';
    }

    function formatPrice(price) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(price);
    }

    // Event listeners
    window.addEventListener('resize', () => {
        zoomEnabled = window.innerWidth > 768;
        if (zoomEnabled) {
            initZoom();
        }
    });

    // Return public methods
    return {
        init,
        updateProductInfo: updateProductInfo
    };
})();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', ProductDetails.init);