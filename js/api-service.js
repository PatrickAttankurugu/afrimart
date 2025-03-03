/**
 * AfriMart Depot - API Service
 * 
 * Central service for making API calls to the backend server
 * This handles all communication with the backend API
 */

const ApiService = (() => {
    // Backend API base URL 
    const API_BASE_URL = 'https://35.175.245.151/api';
    
    // Helper function for making API requests
    async function fetchAPI(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        
        try {
            // Add a timeout for requests
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds timeout
            
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    ...options.headers
                },
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            // Handle HTTP errors
            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                console.error(`HTTP error ${response.status}: ${response.statusText}`, errorData);
                return {
                    success: false,
                    status: response.status,
                    error: errorData?.error || `Server returned ${response.status}: ${response.statusText}`
                };
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error(`API error (${endpoint}):`, error);
            
            // Provide more helpful error messages
            if (error.name === 'AbortError') {
                return {
                    success: false,
                    error: 'Request timed out. Please try again later.'
                };
            }
            
            return {
                success: false,
                error: 'Network error. Please check your connection and try again.'
            };
        }
    }
    
    // Public methods
    return {
        // GET request
        get: (endpoint) => fetchAPI(endpoint),
        
        // POST request with data
        post: (endpoint, data) => fetchAPI(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        }),
        
        // PUT request with data
        put: (endpoint, data) => fetchAPI(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        }),
        
        // DELETE request
        delete: (endpoint) => fetchAPI(endpoint, {
            method: 'DELETE'
        }),
        
        // Get the base URL (useful for constructing image URLs)
        getBaseUrl: () => {
            // Return API base URL without the /api suffix
            return API_BASE_URL.replace(/\/api$/, '');
        }
    };
})();

// Cart service to manage shopping cart
const CartService = {
    // Key for storing cart in localStorage
    STORAGE_KEY: 'afrimart_cart',
    
    /**
     * Get current cart from localStorage
     * @returns {Array} - Array of cart items
     */
    getCart: function() {
        const cart = localStorage.getItem(this.STORAGE_KEY);
        return cart ? JSON.parse(cart) : [];
    },
    
    /**
     * Save cart to localStorage
     * @param {Array} cart - Cart items to save
     */
    saveCart: function(cart) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cart));
        this.updateCartCount();
    },
    
    /**
     * Add item to cart
     * @param {Object} product - Product to add to cart
     * @param {number} quantity - Quantity to add
     */
    addToCart: function(product, quantity = 1) {
        const cart = this.getCart();
        
        // Check if product already exists in cart
        const existingItemIndex = cart.findIndex(item => item.id === product.id);
        
        if (existingItemIndex !== -1) {
            // Update quantity if product already in cart
            cart[existingItemIndex].quantity += quantity;
        } else {
            // Add new item to cart
            cart.push({
                id: product.id,
                title: product.title,
                price: product.price,
                image: product.image_main,
                quantity: quantity,
                unit: product.unit || ''
            });
        }
        
        this.saveCart(cart);
        return cart;
    },
    
    /**
     * Update item quantity in cart
     * @param {number} productId - Product ID to update
     * @param {number} quantity - New quantity
     */
    updateQuantity: function(productId, quantity) {
        const cart = this.getCart();
        const itemIndex = cart.findIndex(item => item.id === productId);
        
        if (itemIndex !== -1) {
            if (quantity > 0) {
                cart[itemIndex].quantity = quantity;
            } else {
                // Remove item if quantity is 0 or negative
                cart.splice(itemIndex, 1);
            }
            
            this.saveCart(cart);
        }
        
        return cart;
    },
    
    /**
     * Remove item from cart
     * @param {number} productId - Product ID to remove
     */
    removeItem: function(productId) {
        const cart = this.getCart();
        const updatedCart = cart.filter(item => item.id !== productId);
        this.saveCart(updatedCart);
        return updatedCart;
    },
    
    /**
     * Clear entire cart
     */
    clearCart: function() {
        localStorage.removeItem(this.STORAGE_KEY);
        this.updateCartCount();
    },
    
    /**
     * Calculate cart subtotal
     * @returns {number} - Cart subtotal
     */
    calculateSubtotal: function() {
        const cart = this.getCart();
        return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    },
    
    /**
     * Update cart count in the UI
     */
    updateCartCount: function() {
        const cart = this.getCart();
        const count = cart.reduce((total, item) => total + item.quantity, 0);
        
        // Update all cart count elements
        document.querySelectorAll('.cart-count').forEach(el => {
            el.textContent = count;
        });
    }
};

// Make services globally available
window.ApiService = ApiService;
window.CartService = CartService;