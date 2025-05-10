/**
 * Product Details JavaScript
 * Handles core functionality, product loading, gallery, and product options
 * Version: 2.1 - Fixed to use S3 integration
 */

// IIFE to avoid global scope pollution
const ProductDetails = (() => {
    // Private variables
    let currentProduct = null;
    let isLoading = false;
    let zoomEnabled = window.innerWidth > 768;
    
    // API Base URL for Netlify functions
    const API_BASE_URL = '/.netlify/functions/s3-handler';

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
     * Get products from S3
     */
    async function getProductsFromS3() {
        try {
            const response = await fetch(`${API_BASE_URL}/get-products`);
            if (!response.ok) throw new Error('Failed to get products from S3');
            
            const data = await response.json();
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error('Error getting products from S3:', error);
            // Fallback to localStorage if S3 fails
            const savedProducts = localStorage.getItem('afrimart_products');
            return savedProducts ? JSON.parse(savedProducts) : [];
        }
    }

    /**
     * Load product data from S3 or localStorage
     * @param {string} productId - The product ID to load
     * @returns {Promise<Object>} The product data
     */
    async function loadProductData(productId) {
        try {
            // Get all products from S3
            const products = await getProductsFromS3();
            
            // Find the specific product
            const product = products.find(p => p.id === productId);
            
            if (product) {
                // Ensure product has all required properties
                return {
                    ...product,
                    images: product.images || [
                        {
                            thumbnail: product.image,
                            large: product.image
                        }
                    ],
                    variants: product.variants || {},
                    stock: product.stock || 15,
                    ratingCount: product.ratingCount || 24
                };
            }
            
            // Fall back to hard-coded example if product not found
            return {
                id: productId,
                name: 'Premium African Product',
                price: '$14.99',
                oldPrice: '$19.99',
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
                    price: price,
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
            elements.info.price.textContent = currentProduct.price;
        }
        
        // Update old price if available
        if (elements.info.oldPrice) {
            if (currentProduct.oldPrice) {
                elements.info.oldPrice.textContent = currentProduct.oldPrice;
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

    // Return public methods
    return {
        init,
        updateProductInfo
    };
})();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', ProductDetails.init);