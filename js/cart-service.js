/**
 * AfriMart Depot - Cart Service
 * 
 * Manages shopping cart functionality with localStorage persistence
 * Provides methods for adding, updating, and removing items
 */

const CartService = (() => {
    // Private cart data
    let cart = [];
    
    // Load cart from localStorage on initialization
    function init() {
        const savedCart = localStorage.getItem('afrimart_cart');
        if (savedCart) {
            try {
                cart = JSON.parse(savedCart);
            } catch (e) {
                cart = [];
                localStorage.setItem('afrimart_cart', JSON.stringify(cart));
            }
        }
    }
    
    // Save cart to localStorage
    function saveCart() {
        localStorage.setItem('afrimart_cart', JSON.stringify(cart));
    }
    
    // Update cart count display in UI
    function updateCartCountUI() {
        const cartCountElements = document.querySelectorAll('.cart-count');
        const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
        
        cartCountElements.forEach(el => {
            el.textContent = totalItems;
        });
    }
    
    // Public methods
    return {
        // Initialize cart
        init: () => {
            init();
            updateCartCountUI();
        },
        
        // Get cart items
        getCart: () => cart,
        
        // Add item to cart
        addToCart: (product, quantity = 1) => {
            // Check if item already exists in cart
            const existingItem = cart.find(item => item.id === product.id);
            
            if (existingItem) {
                existingItem.quantity += quantity;
            } else {
                cart.push({
                    id: product.id,
                    title: product.title,
                    price: product.price,
                    image: product.image_main,
                    quantity: quantity,
                    unit: product.unit || ''
                });
            }
            
            saveCart();
            updateCartCountUI();
            
            return true;
        },
        
        // Update item quantity
        updateQuantity: (productId, quantity) => {
            const item = cart.find(item => item.id === productId);
            if (item) {
                item.quantity = quantity;
                saveCart();
                updateCartCountUI();
                return true;
            }
            return false;
        },
        
        // Remove item from cart
        removeItem: (productId) => {
            cart = cart.filter(item => item.id !== productId);
            saveCart();
            updateCartCountUI();
            return true;
        },
        
        // Clear entire cart
        clearCart: () => {
            cart = [];
            saveCart();
            updateCartCountUI();
            return true;
        },
        
        // Calculate cart subtotal
        getSubtotal: () => {
            return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
        },
        
        // Get total number of items in cart
        getItemCount: () => {
            return cart.reduce((total, item) => total + item.quantity, 0);
        }
    };
})();

// Initialize cart service and make it globally available
document.addEventListener('DOMContentLoaded', function() {
    CartService.init();
    window.CartService = CartService;
});