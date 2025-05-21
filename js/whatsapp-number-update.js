/**
 * WhatsApp Checkout Number Update
 * This script updates the destination WhatsApp number for the checkout process
 */

document.addEventListener('DOMContentLoaded', function() {
    'use strict';
  
    // ==================
    // WhatsApp Checkout Configuration
    // ==================
  
    // Set your WhatsApp number here (with country code, no spaces or special characters)
    const WHATSAPP_NUMBER = '0018048060130'; // Change to your desired number
    
    /**
     * Updates all WhatsApp checkout links and buttons to use the new number
     */
    function updateWhatsAppCheckoutNumber() {
      // 1. Find all WhatsApp checkout buttons (common classes and selectors)
      const whatsappButtons = document.querySelectorAll(
        '.checkout-btn, .whatsapp-checkout, .mini-checkout-btn, a[href*="wa.me"], a[href*="whatsapp.com/send"]'
      );
      
      whatsappButtons.forEach(button => {
        // If it's a link with href
        if (button.href && (button.href.includes('wa.me') || button.href.includes('whatsapp.com/send'))) {
          // Extract the existing parameters
          const url = new URL(button.href);
          let params = new URLSearchParams(url.search);
          
          // Create new URL with the updated phone number
          if (button.href.includes('wa.me')) {
            // Format: https://wa.me/NUMBER?text=MESSAGE
            const oldPath = url.pathname.replace('/', '');
            button.href = button.href.replace(oldPath, WHATSAPP_NUMBER);
          } else {
            // Format: https://api.whatsapp.com/send?phone=NUMBER&text=MESSAGE
            params.set('phone', WHATSAPP_NUMBER);
            button.href = `${url.origin}${url.pathname}?${params.toString()}`;
          }
        } 
        
        // Store the new number in data attribute for JS functions
        button.setAttribute('data-whatsapp-number', WHATSAPP_NUMBER);
      });
      
      // 2. Update any checkout functions that might be using the WhatsApp number
      updateCheckoutFunctions();
    }
    
    /**
     * Update any JavaScript functions that handle the checkout process
     */
    function updateCheckoutFunctions() {
      // If the site uses the AfriMartCart global object
      if (typeof window.AfriMartCart !== 'undefined') {
        // Backup the original checkout function if it exists
        const originalCheckoutFunction = window.AfriMartCart.checkoutViaWhatsApp;
        
        if (typeof originalCheckoutFunction === 'function') {
          // Override the checkout function to use our number
          window.AfriMartCart.checkoutViaWhatsApp = function() {
            // Get cart data and totals
            const cart = window.AfriMartCart.getCartItems ? 
                         window.AfriMartCart.getCartItems() : 
                         getCartFromStorage().items || [];
            
            if (cart.length === 0) {
              if (typeof window.showAddedToCartNotification === 'function') {
                window.showAddedToCartNotification('Your cart is empty');
              } else {
                alert('Your cart is empty');
              }
              return;
            }
    
            // Format cart items into a message
            let message = '🛒 New Order from AfriMart Depot\n\n';
            message += '*Order Items:*\n';
            
            let total = 0;
            cart.forEach((item, index) => {
              const price = parseFloat(item.price.replace(/[^\d.-]/g, '')) || 0;
              const itemTotal = price * item.quantity;
              total += itemTotal;
              
              message += `${index + 1}. ${item.title}\n`;
              message += `   Quantity: ${item.quantity}\n`;
              message += `   Price: ${item.price}\n`;
              message += `   Subtotal: $${itemTotal.toFixed(2)}\n\n`;
            });
    
            // Add order summary
            message += '*Order Summary:*\n';
            message += `Subtotal: $${total.toFixed(2)}\n`;
            
            // Add shipping cost if available
            const shippingCost = document.querySelector('.shipping-cost')?.textContent;
            if (shippingCost) {
              message += `Shipping: ${shippingCost}\n`;
            }
            
            // Add tax if available
            const taxAmount = document.querySelector('.tax-amount')?.textContent;
            if (taxAmount) {
              message += `Tax: ${taxAmount}\n`;
            }
            
            // Add total
            const orderTotal = document.querySelector('.order-total')?.textContent;
            message += `Total: ${orderTotal || `$${total.toFixed(2)}`}\n\n`;
            
            // Add customer information if available
            const customerName = document.querySelector('input[name="name"]')?.value;
            const customerEmail = document.querySelector('input[name="email"]')?.value;
            const customerPhone = document.querySelector('input[name="phone"]')?.value;
            const customerAddress = document.querySelector('textarea[name="address"]')?.value;
            
            if (customerName || customerEmail || customerPhone || customerAddress) {
              message += '*Customer Information:*\n';
              if (customerName) message += `Name: ${customerName}\n`;
              if (customerEmail) message += `Email: ${customerEmail}\n`;
              if (customerPhone) message += `Phone: ${customerPhone}\n`;
              if (customerAddress) message += `Address: ${customerAddress}\n`;
            }
    
            // Encode the message for WhatsApp URL
            const encodedMessage = encodeURIComponent(message);
            
            // Create WhatsApp URL with the new number
            const whatsappUrl = `https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${encodedMessage}`;
            
            // Open WhatsApp in new tab
            window.open(whatsappUrl, '_blank');
            
            // Clear cart after successful checkout (optional - can be commented out)
            setTimeout(() => {
              if (typeof window.AfriMartCart !== 'undefined' && typeof window.AfriMartCart.clearCart === 'function') {
                window.AfriMartCart.clearCart();
              } else {
                localStorage.removeItem('afrimartCart');
                updateCartDisplay();
              }
              console.log("Order sent to WhatsApp, cart cleared.");
            }, 1500);
          };
        }
      }
      
      // Override any standalone checkout functions
      if (typeof window.checkoutViaWhatsApp === 'function') {
        const originalStandaloneCheckout = window.checkoutViaWhatsApp;
        
        window.checkoutViaWhatsApp = function() {
          // Similar implementation as above but for standalone function
          // Get cart from localStorage or global state
          const cart = getCartFromStorage().items || [];
          
          if (cart.length === 0) {
            alert('Your cart is empty');
            return;
          }
          
          // Format message and open WhatsApp with new number (similar to above)
          // Implementation similar to the AfriMartCart.checkoutViaWhatsApp function
          // but adapted for the standalone function context
          
          // Rather than duplicating all the code, we'll call a helper function
          processCheckout(cart);
        };
      }
    }
    
    /**
     * Helper function to process checkout with the new WhatsApp number
     */
    function processCheckout(cart) {
      if (!cart || cart.length === 0) return;
      
      // Format cart items into a message (similar to above function)
      let message = '🛒 New Order from AfriMart Depot\n\n';
      message += '*Order Items:*\n';
      
      let total = 0;
      cart.forEach((item, index) => {
        const price = parseFloat(item.price.replace(/[^\d.-]/g, '')) || 0;
        const itemTotal = price * item.quantity;
        total += itemTotal;
        
        message += `${index + 1}. ${item.title}\n`;
        message += `   Quantity: ${item.quantity}\n`;
        message += `   Price: ${item.price}\n`;
        message += `   Subtotal: $${itemTotal.toFixed(2)}\n\n`;
      });
      
      // Add order summary (similar to above)
      message += '*Order Summary:*\n';
      message += `Subtotal: $${total.toFixed(2)}\n`;
      
      // Add shipping, tax, etc. (similar to above)
      
      // Encode and open WhatsApp
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${encodedMessage}`;
      window.open(whatsappUrl, '_blank');
    }
    
    /**
     * Helper function to get cart from storage
     */
    function getCartFromStorage() {
      const savedCart = localStorage.getItem('afrimartCart');
      if (savedCart) {
        try {
          return JSON.parse(savedCart);
        } catch (e) {
          return { items: [] };
        }
      }
      return { items: [] };
    }
    
    /**
     * Helper function to update cart display after changes
     */
    function updateCartDisplay() {
      // Update cart count display if the function exists
      if (typeof window.CartEnhancer !== 'undefined' && 
          typeof window.CartEnhancer.updateCartCountDisplay === 'function') {
        window.CartEnhancer.updateCartCountDisplay();
      }
      
      // Or if there's a global function
      if (typeof window.updateCartDisplay === 'function') {
        window.updateCartDisplay();
      }
      
      // Or if it's part of AfriMartCart
      if (typeof window.AfriMartCart !== 'undefined' && 
          typeof window.AfriMartCart.updateCartDisplay === 'function') {
        window.AfriMartCart.updateCartDisplay();
      }
    }
    
    // Add click event listeners to "Checkout" buttons that might be added dynamically
    document.body.addEventListener('click', function(e) {
      const checkoutBtn = e.target.closest('.checkout-btn, .mini-checkout-btn, a[href*="wa.me"], a[href*="whatsapp.com/send"]');
      
      if (checkoutBtn) {
        // If this is a direct WhatsApp link
        if (checkoutBtn.tagName === 'A' && 
            (checkoutBtn.href.includes('wa.me') || checkoutBtn.href.includes('whatsapp.com/send'))) {
          // Let the link work normally as we've already updated its href
          return;
        }
        
        // If it's a button meant to trigger WhatsApp checkout programmatically
        if (!checkoutBtn.tagName || checkoutBtn.tagName !== 'A') {
          e.preventDefault();
          
          // Call the appropriate checkout function
          if (typeof window.AfriMartCart !== 'undefined' && 
              typeof window.AfriMartCart.checkoutViaWhatsApp === 'function') {
            window.AfriMartCart.checkoutViaWhatsApp();
          } else if (typeof window.checkoutViaWhatsApp === 'function') {
            window.checkoutViaWhatsApp();
          } else {
            // Fallback: Manually construct WhatsApp checkout
            const cart = getCartFromStorage().items || [];
            processCheckout(cart);
          }
        }
      }
    });
    
    // Run the initial update
    updateWhatsAppCheckoutNumber();
    
    // Make the function available globally
    window.updateWhatsAppCheckoutNumber = updateWhatsAppCheckoutNumber;
    
    // Rerun on any significant page change (history events)
    window.addEventListener('popstate', updateWhatsAppCheckoutNumber);
    
    // Log confirmation
    console.log('WhatsApp Checkout Number updated to: +' + WHATSAPP_NUMBER);
  });