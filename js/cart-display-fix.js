/**
 * Cart Display Fix
 * Fixes the issue where cart items appear incorrectly at the bottom of the shop page
 */

document.addEventListener('DOMContentLoaded', function() {
    'use strict';
  
    // ==================
    // Cart Display Fix
    // ==================
  
    /**
     * Fix for incorrectly displayed cart items at the bottom of the page
     * This happens when cart items are being inappropriately rendered directly to the page
     */
    function fixCartDisplay() {
      // 1. Check if we're on a shop or product page
      const isShopPage = document.querySelector('.shop-section') !== null;
      const isProductPage = document.querySelector('.product-details-section') !== null;
      
      if (!isShopPage && !isProductPage) return;
      
      // 2. Find and remove any incorrectly placed cart items at the page bottom
      const bodyChildren = document.body.children;
      for (let i = 0; i < bodyChildren.length; i++) {
        const element = bodyChildren[i];
        
        // Look for cart-related text or elements that shouldn't be directly in the body
        if (element.textContent && 
            (element.textContent.includes('Subtotal:') || 
             element.textContent.includes('View Cart') ||
             element.textContent.includes('Checkout'))) {
          
          // Check if this is a bare text node or simple element incorrectly placed
          if (element.tagName === undefined || 
              !['HEADER', 'MAIN', 'FOOTER', 'SECTION', 'NAV', 'DIV'].includes(element.tagName.toUpperCase())) {
            
            console.log('Removing incorrectly placed cart element:', element);
            element.remove();
            i--; // Adjust index since we removed an element
          }
        }
        
        // Check for × symbol that appears in cart removal buttons
        if (element.textContent === "×" || 
            element.textContent === "x" ||
            element.textContent.includes(' × $')) {
          console.log('Removing cart removal button:', element);
          element.remove();
          i--; // Adjust index since we removed an element
        }
      }
      
      // 3. Properly encapsulate the mini-cart if it exists but is malformed
      const miniCart = document.querySelector('.mini-cart');
      if (miniCart && miniCart.parentElement === document.body) {
        // Check if it's structured correctly
        if (!miniCart.querySelector('.mini-cart-header') || 
            !miniCart.querySelector('.mini-cart-items') ||
            !miniCart.querySelector('.mini-cart-footer')) {
          
          // The mini-cart is malformed, let's fix its structure
          const miniCartContent = miniCart.innerHTML;
          miniCart.innerHTML = `
            <div class="mini-cart-header">
              <h3>Cart</h3>
              <button class="mini-cart-close"><i class="fas fa-times"></i></button>
            </div>
            <div class="mini-cart-items">
              ${miniCartContent}
            </div>
            <div class="mini-cart-footer">
              <div class="mini-cart-subtotal">
                <span>Subtotal:</span>
                <span class="mini-subtotal-value"></span>
              </div>
              <div class="mini-cart-actions">
                <a href="cart.html" class="btn btn-secondary view-cart-btn">View Cart</a>
                <a href="cart.html" class="btn btn-primary mini-checkout-btn">
                  <i class="fab fa-whatsapp"></i> Checkout
                </a>
              </div>
            </div>
          `;
          
          // Add event listener to close button
          const closeBtn = miniCart.querySelector('.mini-cart-close');
          if (closeBtn) {
            closeBtn.addEventListener('click', function() {
              miniCart.classList.remove('active');
            });
          }
        }
      }
      
      // 4. Fix any cart items that appear as bare DOM elements
      const cartItems = document.querySelectorAll('[data-product-id]');
      cartItems.forEach(item => {
        // Check if this is a bare cart item not inside a proper container
        if (item.parentElement === document.body || 
            item.parentElement.tagName === 'BODY') {
          console.log('Removing incorrectly placed cart item:', item);
          item.remove();
        }
      });
    }
  
    /**
     * Enhance the cart.js addToCart function to prevent incorrect display
     */
    function enhanceCartFunctions() {
      // Store the original addToCart function if it exists
      let originalAddToCart = null;
      if (typeof window.addToCart === 'function') {
        originalAddToCart = window.addToCart;
      } else if (typeof window.AfriMartCart !== 'undefined' && 
                 typeof window.AfriMartCart.addToCart === 'function') {
        originalAddToCart = window.AfriMartCart.addToCart;
      }
      
      // Replace with enhanced version that cleans up after itself
      if (originalAddToCart) {
        const enhancedAddToCart = function(product) {
          // Call the original function
          const result = originalAddToCart(product);
          
          // Clean up any incorrectly displayed elements
          setTimeout(fixCartDisplay, 100);
          return result;
        };
        
        // Replace the global functions
        if (typeof window.addToCart === 'function') {
          window.addToCart = enhancedAddToCart;
        }
        
        if (typeof window.AfriMartCart !== 'undefined') {
          window.AfriMartCart.addToCart = enhancedAddToCart;
        }
      }
    }
  
    /**
     * Fix cart styling issues
     */
    function fixCartStyling() {
      // Add CSS to fix cart styling issues
      const style = document.createElement('style');
      style.textContent = `
        /* Ensure cart items don't appear at page bottom */
        body > div:not(.container):not(.header):not(.footer):not(.modal):not(.toast-container):not([class]) {
          display: none !important;
        }
        
        /* Fix mini-cart styling */
        .mini-cart {
          position: fixed !important;
          top: 80px !important;
          right: -350px !important;
          width: 320px !important;
          background: white !important;
          box-shadow: 0 5px 15px rgba(0,0,0,0.2) !important;
          border-radius: 8px !important;
          padding: 20px !important;
          z-index: 1000 !important;
          transition: right 0.3s ease !important;
          max-height: 80vh !important;
          display: flex !important;
          flex-direction: column !important;
          overflow: hidden !important;
        }
        
        .mini-cart.active {
          right: 20px !important;
        }
        
        /* Hide bare text nodes that might be cart data */
        body > :not(div):not(header):not(main):not(footer):not(section):not(nav) {
          display: none !important;
        }
      `;
      document.head.appendChild(style);
    }
  
    // Run the fixes
    fixCartDisplay();
    enhanceCartFunctions();
    fixCartStyling();
    
    // Run fixes again after a short delay to catch any elements added after initial load
    setTimeout(fixCartDisplay, 500);
    
    // Add a MutationObserver to detect and fix any new cart elements that appear
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.addedNodes.length) {
          fixCartDisplay();
        }
      });
    });
    
    // Start observing the body for added nodes
    observer.observe(document.body, { childList: true, subtree: true });
    
    // Make fix function available globally
    window.fixCartDisplay = fixCartDisplay;
  });