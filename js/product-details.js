/**
 * Product Details JavaScript
 * Handles core functionality, product loading, gallery, and product options
 * Version: 2.0 - Improved cart integration
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

            // In a real application, this would fetch from an API
            // For demo purposes, we'll simulate loading
            await simulateLoading();
            
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
     * Simulate loading delay for demo purposes
     */
    async function simulateLoading() {
        return new Promise(resolve => setTimeout(resolve, 500));
    }

    /**
     * Load product data from server or localStorage
     * @param {string} productId - The product ID to load
     * @returns {Promise<Object>} The product data
     */
    async function loadProductData(productId) {
        // In a real application, this would fetch from an API endpoint
        // For demo purposes, we'll hardcode a product or use localStorage
        try {
            // Try to find product in localStorage (which would have been set in admin panel)
            const savedProducts = localStorage.getItem('afrimart_products');
            if (savedProducts) {
                const products = JSON.parse(savedProducts);
                const product = products.find(p => p.id === productId);
                if (product) return product;
            }
            
            // Fall back to hard-coded example
            return {
                id: productId,
                name: 'Premium African Product',
                price: 14.99,
                oldPrice: 19.99,
                description: 'Authentic African product with premium quality.',
                category: 'Specialty Items',
                ratingCount: 24,
                stock: 15,
                sku: `AFM-${productId}`,
                images: [
                    {
                        thumbnail: 'images/product-thumb.jpg',
                        large: 'images/product-large.jpg'
                    },
                    {
                        thumbnail: 'images/product-thumb-2.jpg',
                        large: 'images/product-large-2.jpg'
                    }
                ],
                variants: {
                    Size: [
                        { id: 'small', name: 'Small', available: true },
                        { id: 'medium', name: 'Medium', available: true },
                        { id: 'large', name: 'Large', available: false }
                    ],
                    Type: [
                        { id: 'standard', name: 'Standard', available: true },
                        { id: 'premium', name: 'Premium', available: true }
                    ]
                }
            };
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
        if (!elements.gallery.mainImage || !currentProduct.images || !currentProduct.images.length) return;

        // Set main image
        elements.gallery.mainImage.src = currentProduct.images[0].large;
        elements.gallery.mainImage.alt = currentProduct.name;

        // Create thumbnails if we have a thumbnail container
        if (elements.gallery.thumbnails) {
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
        }

        // Initialize zoom functionality if enabled
        if (zoomEnabled && elements.gallery.zoomLens && elements.gallery.zoomResult) {
            initZoom();
        }
    }

    /**
     * Handle thumbnail click event
     * @param {Event} e - The click event
     */
    function handleThumbnailClick(e) {
        if (!elements.gallery.thumbnails) return;
        
        // Remove active class from all thumbnails
        elements.gallery.thumbnails.querySelectorAll('.thumbnail')
            .forEach(thumb => thumb.classList.remove('active'));

        // Add active class to clicked thumbnail
        this.classList.add('active');

        // Update main image
        const newImage = this.dataset.image;
        if (elements.gallery.mainImage && newImage) {
            elements.gallery.mainImage.src = newImage;
        }

        // Update zoom if enabled
        if (zoomEnabled) {
            updateZoom();
        }
    }

    /**
     * Initialize zoom functionality
     */
    function initZoom() {
        if (!elements.gallery.zoomLens || !elements.gallery.zoomResult || !elements.gallery.mainImage) return;

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
        if (!elements.gallery.mainImage || !elements.gallery.zoomLens) {
            return { x: 0, y: 0 };
        }
        
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
     * Update zoom background when switching images
     */
    function updateZoom() {
        if (!elements.gallery.zoomResult || !elements.gallery.mainImage) return;
        
        elements.gallery.zoomResult.style.backgroundImage = `url(${elements.gallery.mainImage.src})`;
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
        if (!variantGroup) return;
        
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
        if (!elements.options.variantsContainer) return;
        
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
            if (elements.info.price) {
                elements.info.price.textContent = formatPrice(variant.price);
            }
            
            if (elements.info.oldPrice) {
                if (variant.oldPrice) {
                    elements.info.oldPrice.textContent = formatPrice(variant.oldPrice);
                    elements.info.oldPrice.style.display = 'inline';
                } else {
                    elements.info.oldPrice.style.display = 'none';
                }
            }

            // Update stock status
            updateStockStatus(variant.stock);

            // Update SKU
            if (elements.info.sku) {
                elements.info.sku.textContent = variant.sku;
            }

            // Enable/disable add to cart button based on stock
            if (elements.actions.addToCart) {
                elements.actions.addToCart.disabled = variant.stock === 0;
            }
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

        if (plus) {
            plus.addEventListener('click', () => {
                const currentValue = parseInt(input.value);
                const maxValue = parseInt(input.getAttribute('max')) || 99;
                if (currentValue < maxValue) {
                    input.value = currentValue + 1;
                    updateQuantityState();
                }
            });
        }

        if (minus) {
            minus.addEventListener('click', () => {
                const currentValue = parseInt(input.value);
                const minValue = parseInt(input.getAttribute('min')) || 1;
                if (currentValue > minValue) {
                    input.value = currentValue - 1;
                    updateQuantityState();
                }
            });
        }

        if (input) {
            input.addEventListener('change', () => {
                let value = parseInt(input.value);
                const min = parseInt(input.getAttribute('min')) || 1;
                const max = parseInt(input.getAttribute('max')) || 99;

                value = Math.min(Math.max(value, min), max);
                input.value = value;
                updateQuantityState();
            });
        }

        // Initialize quantity state
        updateQuantityState();
    }

    /**
     * Update quantity selector state
     */
    function updateQuantityState() {
        if (!elements.options.quantityInput) return;
        
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
        if (!currentProduct) return;
        
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
        if (!currentProduct) return;
        
        if (elements.breadcrumb.product) {
            elements.breadcrumb.product.textContent = currentProduct.name;
        }
        
        if (elements.breadcrumb.category) {
            elements.breadcrumb.category.textContent = currentProduct.category || 'Products';
        }
    }

    /**
     * Initialize product actions (like add to cart)
     */
    function initProductActions() {
        // Add to cart button
        if (elements.actions.addToCart && currentProduct) {
            elements.actions.addToCart.addEventListener('click', function() {
                // Get selected variant information
                let variantInfo = "";
                let selectedVariantIds = {};
                
                if (elements.options.variantsContainer) {
                    const selectedVariants = [];
                    elements.options.variantsContainer.querySelectorAll('.variant-group').forEach(group => {
                        const type = group.dataset.variantType;
                        const selectedOption = group.querySelector('.variant-option.active');
                        if (selectedOption) {
                            selectedVariants.push(`${type}: ${selectedOption.textContent.trim()}`);
                            selectedVariantIds[type] = selectedOption.dataset.variantId;
                        }
                    });
                    
                    if (selectedVariants.length > 0) {
                        variantInfo = selectedVariants.join(", ");
                    }
                }
                
                // Get quantity
                const quantity = parseInt(elements.options.quantityInput?.value) || 1;
                
                // Get product information
                let productImage = '';
                if (elements.gallery.mainImage) {
                    productImage = elements.gallery.mainImage.src;
                }
                
                // Find variant-specific price if applicable
                let price = currentProduct.price;
                if (Object.keys(selectedVariantIds).length > 0) {
                    const variant = findMatchingVariant(selectedVariantIds);
                    if (variant && variant.price) {
                        price = variant.price;
                    }
                }
                
                // Create product object
                const product = {
                    id: currentProduct.id,
                    title: currentProduct.name,
                    price: formatPrice(price),
                    quantity: quantity,
                    image: productImage,
                    variant: variantInfo
                };
                
                // Add to cart using global cart function
                let success = false;
                
                if (typeof window.AfriMartCart !== 'undefined' && typeof window.AfriMartCart.addToCart === 'function') {
                    success = window.AfriMartCart.addToCart(product);
                } else if (typeof window.addToCart === 'function') {
                    success = window.addToCart(product);
                } else {
                    console.error('Cart functionality not found. Make sure cart.js is loaded.');
                    
                    // Fallback visual feedback
                    const originalText = this.textContent;
                    this.innerHTML = '<i class="fas fa-check"></i> Added to Cart!';
                    
                    setTimeout(() => {
                        this.textContent = originalText;
                    }, 1500);
                    
                    return;
                }
                
                // Visual feedback on success
                if (success !== false) {
                    const originalText = this.textContent;
                    this.innerHTML = '<i class="fas fa-check"></i> Added to Cart!';
                    
                    setTimeout(() => {
                        this.textContent = originalText;
                    }, 1500);
                }
            });
        }
        
        // Wishlist functionality
        if (elements.actions.wishlist) {
            elements.actions.wishlist.addEventListener('click', function() {
                this.classList.toggle('active');
                const icon = this.querySelector('i');
                if (icon) {
                    if (icon.classList.contains('far')) {
                        icon.classList.remove('far');
                        icon.classList.add('fas');
                    } else {
                        icon.classList.remove('fas');
                        icon.classList.add('far');
                    }
                }
            });
        }
    }

    /**
     * Update product information displayed on the page
     */
    function updateProductInfo() {
        if (!currentProduct) return;
        
        // Update title
        if (elements.info.title) {
            elements.info.title.textContent = currentProduct.name;
        }
        
        // Update price
        if (elements.info.price) {
            elements.info.price.textContent = formatPrice(currentProduct.price);
        }
        
        // Update old price if available
        if (elements.info.oldPrice) {
            if (currentProduct.oldPrice) {
                elements.info.oldPrice.textContent = formatPrice(currentProduct.oldPrice);
                elements.info.oldPrice.style.display = 'inline';
            } else {
                elements.info.oldPrice.style.display = 'none';
            }
        }
        
        // Update rating count
        if (elements.info.ratingCount) {
            elements.info.ratingCount.textContent = currentProduct.ratingCount || 0;
        }
        
        // Update stock status
        updateStockStatus(currentProduct.stock);
        
        // Update SKU
        if (elements.info.sku) {
            elements.info.sku.textContent = currentProduct.sku || 'N/A';
        }
    }

    /**
     * Find matching variant based on selected options
     * @param {Object} selectedVariants - Selected variant IDs
     * @returns {Object|null} - Matching variant or null
     */
    function findMatchingVariant(selectedVariants) {
        // In a real app, this would check a product database for the specific variant
        // For demo purposes, we'll return a modified version of the current product
        if (!currentProduct || !selectedVariants || Object.keys(selectedVariants).length === 0) {
            return null;
        }
        
        // Combine the base product with any variant-specific changes
        const variant = {
            ...currentProduct,
            price: currentProduct.price,
            oldPrice: currentProduct.oldPrice,
            stock: currentProduct.stock,
            sku: currentProduct.sku
        };
        
        // Check for premium variants and adjust price
        if (selectedVariants.Type === 'premium') {
            variant.price = currentProduct.price * 1.2; // 20% more for premium
        }
        
        // Adjust stock based on variant availability
        if (selectedVariants.Size === 'large') {
            variant.stock = 0; // Out of stock for large size
        }
        
        // Update SKU based on variants
        const variantCodes = [];
        Object.entries(selectedVariants).forEach(([type, id]) => {
            variantCodes.push(id.substring(0, 3).toUpperCase());
        });
        
        if (variantCodes.length > 0) {
            variant.sku = `${currentProduct.sku}-${variantCodes.join('-')}`;
        }
        
        return variant;
    }

    /**
     * Update stock status based on selected variant
     * @param {number} stock - Stock amount
     */
    function updateStockStatus(stock) {
        if (!elements.info.stock) return;
        
        if (stock > 10) {
            elements.info.stock.textContent = 'In Stock';
            elements.info.stock.className = 'stock-status in-stock';
        } else if (stock > 0) {
            elements.info.stock.textContent = `Only ${stock} left in stock`;
            elements.info.stock.className = 'stock-status low-stock';
        } else {
            elements.info.stock.textContent = 'Out of Stock';
            elements.info.stock.className = 'stock-status out-of-stock';
        }
        
        // Enable/disable add to cart button
        if (elements.actions.addToCart) {
            elements.actions.addToCart.disabled = stock === 0;
        }
    }

    // Utility functions
    function getProductIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('product') || urlParams.get('id');
    }

    function showLoading(show) {
        if (!elements.loadingOverlay) return;
        
        elements.loadingOverlay.style.display = show ? 'flex' : 'none';
        isLoading = show;
    }

    function showError(show) {
        if (!elements.errorMessage || !elements.container) return;
        
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
        updateProductInfo
    };
})();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', ProductDetails.init);