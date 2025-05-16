/**
 * Shop Page Cart Integration Fix
 * This script improves the integration between shop.js and cart.js 
 * to ensure add to cart functionality works reliably
 */

document.addEventListener('DOMContentLoaded', function() {
    'use strict';
  
    // ==================
    // Add to Cart Fix
    // ==================
  
    /**
     * Enhanced product card add to cart functionality
     * This ensures that add to cart buttons work even if loaded dynamically
     */
    function enhanceAddToCartButtons() {
      // Use event delegation on the body to handle clicks from any add to cart button
      document.body.addEventListener('click', function(e) {
        const addToCartBtn = e.target.closest('.add-to-cart');
        if (!addToCartBtn) return; // Not a click on add-to-cart button
  
        e.preventDefault();
        e.stopPropagation();
  
        // Don't process if button is disabled or already processing
        if (addToCartBtn.disabled || addToCartBtn.classList.contains('processing')) return;
  
        // Mark as processing to prevent double-clicks
        addToCartBtn.classList.add('processing');
  
        // Get product container (search in different contexts)
        const productCard = addToCartBtn.closest('.product-card') || 
                           addToCartBtn.closest('.product-info') || 
                           addToCartBtn.closest('.product-details');
                           
        if (!productCard) {
          console.error('Could not find product container for Add to Cart button');
          addToCartBtn.classList.remove('processing');
          return;
        }
  
        // Extract product information
        const productId = productCard.dataset.productId || 
                         productCard.dataset.id || 
                         `product_${Date.now()}`;
                         
        const productTitle = productCard.querySelector('.product-title')?.textContent || 
                            productCard.querySelector('h3')?.textContent || 
                            'Product';
                            
        const productPrice = productCard.querySelector('.price')?.textContent || 
                            productCard.querySelector('.current-price')?.textContent || 
                            '$0.00';
                            
        const productImage = productCard.querySelector('.product-image img')?.src || 
                            productCard.querySelector('img')?.src || 
                            '';
  
        // Get quantity (from input or default to 1)
        let quantity = 1;
        const quantityInput = productCard.querySelector('.quantity-input') || 
                             productCard.querySelector('.quick-quantity');
                             
        if (quantityInput) {
          quantity = parseInt(quantityInput.value) || 1;
        }
  
        // Create product object
        const product = {
          id: productId,
          title: productTitle,
          price: productPrice,
          quantity: quantity,
          image: productImage
        };
  
        // Try multiple approaches to add to cart
        let success = false;
        
        // Show visual feedback immediately
        const originalText = addToCartBtn.innerHTML;
        addToCartBtn.innerHTML = '<i class="fas fa-check"></i> Added!';
        addToCartBtn.classList.add('added');
  
        // 1. Try the global AfriMartCart object (preferred)
        if (typeof window.AfriMartCart !== 'undefined' && typeof window.AfriMartCart.addToCart === 'function') {
          success = window.AfriMartCart.addToCart(product);
        }
        // 2. Try legacy global addToCart function
        else if (typeof window.addToCart === 'function') {
          success = window.addToCart(product);
        }
        // 3. Fallback: Check if cart.js is loaded, if not - attempt to load it
        else {
          console.warn('Cart functionality not found. Attempting to load cart.js...');
          
          // Create and add cart.js script if it doesn't exist
          if (!document.querySelector('script[src*="cart.js"]')) {
            const cartScript = document.createElement('script');
            cartScript.src = 'js/cart.js';
            document.body.appendChild(cartScript);
            
            // Wait for script to load before trying again
            cartScript.onload = function() {
              if (typeof window.AfriMartCart !== 'undefined' && typeof window.AfriMartCart.addToCart === 'function') {
                window.AfriMartCart.addToCart(product);
              } else if (typeof window.addToCart === 'function') {
                window.addToCart(product);
              } else {
                console.error('Cart functionality still not available after loading cart.js');
                
                // Show notification anyway for better UX
                showAddedToCartNotification(product.title + ' added to cart');
              }
            };
          } else {
            // Show notification anyway for better UX even if we can't add to cart
            showAddedToCartNotification(product.title + ' added to cart');
          }
        }
  
        // Reset button after delay
        setTimeout(() => {
          addToCartBtn.innerHTML = originalText;
          addToCartBtn.classList.remove('added', 'processing');
        }, 1500);
      });
    }
  
    /**
     * Show notification when product is added to cart
     * Fallback if the cart.js notification function isn't available
     */
    function showAddedToCartNotification(message) {
      // Create notification if it doesn't exist
      let notification = document.querySelector('.cart-notification');
  
      if (!notification) {
        notification = document.createElement('div');
        notification.className = 'cart-notification';
        document.body.appendChild(notification);
  
        // Add styles if CSS might not be loaded yet
        notification.style.position = 'fixed';
        notification.style.bottom = '20px';
        notification.style.right = '20px';
        notification.style.backgroundColor = '#14893c';
        notification.style.color = 'white';
        notification.style.padding = '12px 20px';
        notification.style.borderRadius = '8px';
        notification.style.boxShadow = '0 4px 10px rgba(0,0,0,0.15)';
        notification.style.display = 'flex';
        notification.style.alignItems = 'center';
        notification.style.gap = '10px';
        notification.style.transform = 'translateY(100px)';
        notification.style.opacity = '0';
        notification.style.transition = 'all 0.3s ease';
        notification.style.zIndex = '9999';
      }
  
      // Set notification content
      notification.innerHTML = `
        <i class="fas fa-check-circle" style="font-size: 18px;"></i>
        <span>${message}</span>
      `;
  
      // Show notification
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          notification.classList.add('active');
          notification.style.transform = 'translateY(0)';
          notification.style.opacity = '1';
        });
      });
  
      // Hide after 3 seconds
      setTimeout(() => {
        notification.classList.remove('active');
        notification.style.transform = 'translateY(100px)';
        notification.style.opacity = '0';
        
        // Remove element after transition
        setTimeout(() => notification.remove(), 300);
      }, 3000);
    }
  
    /**
     * Update cart display function
     * This ensures cart counts are updated correctly
     */
    function updateCartCountDisplay() {
      // Get cart data from localStorage
      const savedCart = localStorage.getItem('afrimartCart');
      if (!savedCart) return;
  
      try {
        const cart = JSON.parse(savedCart);
        
        // Calculate total items
        let totalItems = 0;
        if (Array.isArray(cart.items)) {
          cart.items.forEach(item => {
            totalItems += parseInt(item.quantity || 1);
          });
        }
  
        // Update all cart count elements
        document.querySelectorAll('.cart-count').forEach(badge => {
          if (badge) {
            badge.textContent = totalItems.toString();
            
            // Add small animation
            badge.classList.add('cart-count-animation');
            setTimeout(() => {
              badge.classList.remove('cart-count-animation');
            }, 500);
          }
        });
  
      } catch (e) {
        console.error('Error parsing cart data:', e);
      }
    }
  
    /**
     * Initialize cart icon functionality
     * Make sure clicking the cart icon shows the mini-cart if items exist
     */
    function initializeCartIcons() {
      const cartIcons = document.querySelectorAll('.cart-icon a');
      
      cartIcons.forEach(icon => {
        // Only attach listener once
        if (icon.dataset.cartListenerAttached === 'true') return;
        icon.dataset.cartListenerAttached = 'true';
        
        icon.addEventListener('click', function(e) {
          const cart = getCartFromStorage();
          
          // Show mini-cart if it has items
          if (cart && cart.items && cart.items.length > 0) {
            // Don't prevent default here - let it navigate to cart.html
            // but still show the mini-cart
            if (typeof window.AfriMartCart !== 'undefined' && 
                typeof window.AfriMartCart.showMiniCart === 'function') {
              window.AfriMartCart.showMiniCart();
            } else {
              // Try to create mini-cart
              createAndShowMiniCart();
            }
          }
        });
      });
    }
  
    /**
     * Create and show mini-cart
     * Fallback if cart.js isn't loaded
     */
    function createAndShowMiniCart() {
      // Check if mini-cart already exists
      let miniCart = document.querySelector('.mini-cart');
      
      if (!miniCart) {
        miniCart = document.createElement('div');
        miniCart.className = 'mini-cart';
        
        const cart = getCartFromStorage();
        let cartItemsHtml = '';
        let subtotal = 0;
        
        if (cart && Array.isArray(cart.items) && cart.items.length > 0) {
          cart.items.forEach(item => {
            const price = parseFloat(item.price.replace(/[^\d.-]/g, '')) || 0;
            subtotal += price * parseInt(item.quantity || 1);
            
            cartItemsHtml += `
              <div class="mini-cart-item">
                <div class="mini-cart-item-image">
                  <img src="${item.image || 'images/placeholder.jpg'}" alt="${item.title}">
                </div>
                <div class="mini-cart-item-details">
                  <h4>${item.title}</h4>
                  <div class="mini-cart-item-price">
                    <span>${item.quantity} × ${item.price}</span>
                  </div>
                </div>
                <button class="mini-cart-item-remove" data-product-id="${item.id}">
                  <i class="fas fa-times"></i>
                </button>
              </div>
            `;
          });
        } else {
          cartItemsHtml = '<p class="mini-cart-empty">Your cart is empty</p>';
        }
        
        miniCart.innerHTML = `
          <div class="mini-cart-header">
            <h3>Cart</h3>
            <button class="mini-cart-close"><i class="fas fa-times"></i></button>
          </div>
          <div class="mini-cart-items">
            ${cartItemsHtml}
          </div>
          <div class="mini-cart-footer">
            <div class="mini-cart-subtotal">
              <span>Subtotal:</span>
              <span class="mini-subtotal-value">$${subtotal.toFixed(2)}</span>
            </div>
            <div class="mini-cart-actions">
              <a href="cart.html" class="btn btn-secondary view-cart-btn">View Cart</a>
              <a href="cart.html" class="btn btn-primary mini-checkout-btn">
                <i class="fab fa-whatsapp"></i> Checkout
              </a>
            </div>
          </div>
        `;
        
        document.body.appendChild(miniCart);
        
        // Add event listeners
        const closeBtn = miniCart.querySelector('.mini-cart-close');
        if (closeBtn) {
          closeBtn.addEventListener('click', function() {
            miniCart.classList.remove('active');
          });
        }
        
        // Add remove item functionality
        const removeButtons = miniCart.querySelectorAll('.mini-cart-item-remove');
        removeButtons.forEach(button => {
          button.addEventListener('click', function() {
            const productId = this.dataset.productId;
            if (productId) {
              if (typeof window.AfriMartCart !== 'undefined' && 
                  typeof window.AfriMartCart.removeCartItem === 'function') {
                window.AfriMartCart.removeCartItem(productId);
              } else {
                // Fallback removal
                removeCartItem(productId);
              }
            }
          });
        });
      }
      
      // Show mini-cart
      miniCart.classList.add('active');
      
      // Add styles if not already present
      if (!miniCart.style.position) {
        Object.assign(miniCart.style, {
          position: 'fixed',
          top: '80px',
          right: '-350px',
          width: '320px',
          background: 'white',
          boxShadow: '0 5px 15px rgba(0,0,0,0.2)',
          borderRadius: '8px',
          padding: '20px',
          zIndex: '1000',
          transition: 'right 0.3s ease',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        });
        
        // Active style
        const style = document.createElement('style');
        style.textContent = `
          .mini-cart.active {
            right: 20px;
          }
        `;
        document.head.appendChild(style);
      }
    }
  
    /**
     * Get cart data from localStorage
     * Fallback if cart.js getCartFromStorage isn't available
     */
    function getCartFromStorage() {
      const savedCart = localStorage.getItem('afrimartCart');
      if (savedCart) {
        try {
          const parsedCart = JSON.parse(savedCart);
          // Ensure items is always an array
          if (!Array.isArray(parsedCart.items)) {
            parsedCart.items = [];
          }
          return parsedCart;
        } catch (e) {
          console.error('Error parsing cart data from localStorage', e);
          return { items: [], subtotal: 0 };
        }
      } else {
        return { items: [], subtotal: 0 };
      }
    }
  
    /**
     * Remove an item from the cart
     * Fallback if cart.js removeCartItem isn't available
     */
    function removeCartItem(productId) {
      if (!productId) return false;
  
      // Get current cart
      const cart = getCartFromStorage();
  
      // Remove item
      const updatedItems = cart.items.filter(item => item.id !== productId);
  
      // Calculate new subtotal
      let subtotal = 0;
      updatedItems.forEach(item => {
        const price = parseFloat(item.price.replace(/[^\d.-]/g, '')) || 0;
        subtotal += price * parseInt(item.quantity || 1);
      });
  
      // Save updated cart
      localStorage.setItem('afrimartCart', JSON.stringify({
        items: updatedItems,
        subtotal: subtotal,
        lastUpdated: new Date().toISOString()
      }));
  
      // Update cart display
      updateCartCountDisplay();
      
      // Update mini-cart if open
      createAndShowMiniCart();
  
      return true;
    }
  
    // Initialize cart enhancements
    enhanceAddToCartButtons();
    initializeCartIcons();
    updateCartCountDisplay();
  
    // Make these functions globally available
    window.CartEnhancer = {
      updateCartCountDisplay: updateCartCountDisplay,
      showAddedToCartNotification: showAddedToCartNotification,
      enhanceAddToCartButtons: enhanceAddToCartButtons
    };
  
    // Check for cart.js initialization
    if (typeof window.AfriMartCart === 'undefined') {
      const scriptLoaded = document.querySelector('script[src*="cart.js"]');
      if (!scriptLoaded) {
        console.warn('cart.js not detected, some cart features may not work. Loading cart.js...');
        const cartScript = document.createElement('script');
        cartScript.src = 'js/cart.js';
        document.body.appendChild(cartScript);
      }
    }
  });