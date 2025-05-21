/**
 * WhatsApp Checkout Number Update
 * This script updates the destination WhatsApp number for the checkout process
 */

document.addEventListener('DOMContentLoaded', function() {
  'use strict';

  // ==================
  // WhatsApp Checkout Configuration
  // ==================

  // Set your WhatsApp number here (with country code, no + or leading zeros not part of the country code)
  const WHATSAPP_NUMBER = '18048060130'; // CORRECTED: US number format for WhatsApp API
  
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
          // wa.me can handle numbers with or without '+' if they are digits with country code.
          // Using just digits is safer and more consistent here.
          const oldPath = url.pathname.replace('/', '');
          button.href = button.href.replace(oldPath, WHATSAPP_NUMBER);
        } else {
          // Format: https://api.whatsapp.com/send?phone=NUMBER&text=MESSAGE
          // 'phone' parameter expects digits only, with country code.
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
      
      if (typeof originalCheckoutFunction === 'function' || !window.AfriMartCart.checkoutViaWhatsApp) { // Also override if it doesn't exist yet
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
          
          // Add shipping cost if available (ensure elements exist)
          const shippingCostEl = document.querySelector('.shipping-cost');
          if (shippingCostEl) {
            message += `Shipping: ${shippingCostEl.textContent}\n`;
          }
          
          // Add tax if available
          const taxAmountEl = document.querySelector('.tax-amount');
          if (taxAmountEl) {
            message += `Tax: ${taxAmountEl.textContent}\n`;
          }
          
          // Add total
          const orderTotalEl = document.querySelector('.order-total');
          message += `Total: ${orderTotalEl ? orderTotalEl.textContent : `$${total.toFixed(2)}`}\n\n`;
          
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
      // const originalStandaloneCheckout = window.checkoutViaWhatsApp; // No need to call original
      
      window.checkoutViaWhatsApp = function() {
        const cart = getCartFromStorage().items || [];
        processCheckout(cart);
      };
    }
  }
  
  /**
   * Helper function to process checkout with the new WhatsApp number
   */
  function processCheckout(cart) {
    if (!cart || cart.length === 0) {
      alert('Your cart is empty');
      return;
    }
    
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
    
    message += '*Order Summary:*\n';
    message += `Subtotal: $${total.toFixed(2)}\n`;
    
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
    if (typeof window.CartEnhancer !== 'undefined' && 
        typeof window.CartEnhancer.updateCartCountDisplay === 'function') {
      window.CartEnhancer.updateCartCountDisplay();
    }
    
    if (typeof window.updateCartDisplay === 'function' && window.updateCartDisplay !== updateCartDisplay) { // Avoid self-recursion
      window.updateCartDisplay();
    }
    
    if (typeof window.AfriMartCart !== 'undefined' && 
        typeof window.AfriMartCart.updateCartDisplay === 'function') {
      window.AfriMartCart.updateCartDisplay();
    }
  }
  
  // Add click event listeners to "Checkout" buttons that might be added dynamically
  document.body.addEventListener('click', function(e) {
    const checkoutBtn = e.target.closest('.checkout-btn, .mini-checkout-btn, a[href*="wa.me"], a[href*="whatsapp.com/send"]');
    
    if (checkoutBtn) {
      if (checkoutBtn.tagName === 'A' && 
          (checkoutBtn.href.includes('wa.me') || checkoutBtn.href.includes('whatsapp.com/send'))) {
        return; // Let the link work normally as href is updated
      }
      
      if (!checkoutBtn.tagName || checkoutBtn.tagName !== 'A') {
        e.preventDefault();
        
        if (typeof window.AfriMartCart !== 'undefined' && 
            typeof window.AfriMartCart.checkoutViaWhatsApp === 'function') {
          window.AfriMartCart.checkoutViaWhatsApp();
        } else if (typeof window.checkoutViaWhatsApp === 'function') {
          window.checkoutViaWhatsApp();
        } else {
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
  
  console.log('WhatsApp Checkout Number updated to: ' + WHATSAPP_NUMBER); // Log corrected number
});