/*
* AfriMart Depot - Shopping Cart JavaScript
* Version: 1.0
*/

document.addEventListener('DOMContentLoaded', function() {
  'use strict';

  // Initialize AOS Animation
  AOS.init({
    duration: 800,
    easing: 'ease-in-out',
    once: true,
    mirror: false
  });

  // State Management for Cart
  const cartState = {
    items: [],
    subtotal: 0,
    shipping: {
      method: 'standard',
      cost: 5.99
    },
    discount: {
      code: '',
      type: null, // percentage or freeshipping
      value: 0,
      applied: false
    },
    tax: 0,
    total: 0
  };

  // Cache DOM elements
  const elements = {
    cartContainer: document.querySelector('.cart-with-items'),
    emptyCart: document.querySelector('.empty-cart'),
    cartItemsList: document.querySelector('.cart-item-list'),
    cartActions: document.querySelector('.cart-actions'),
    cartCount: document.querySelector('.cart-count'),
    cartItemsTitle: document.querySelector('.cart-items h2'),
    
    // Summary elements
    subtotalEl: document.getElementById('cart-subtotal'),
    shippingCostEl: document.getElementById('shipping-cost'),
    discountEl: document.getElementById('discount-amount'),
    discountRow: document.querySelector('.discount-row'),
    taxAmountEl: document.getElementById('tax-amount'),
    orderTotalEl: document.getElementById('order-total'),
    
    // Discount code elements
    discountCodeInput: document.getElementById('discount-code'),
    applyDiscountBtn: document.getElementById('apply-discount'),
    discountSuccessMsg: document.querySelector('.discount-message.success'),
    discountErrorMsg: document.querySelector('.discount-message.error'),
    
    // Shipping options
    shippingOptions: document.querySelectorAll('input[name="shipping"]'),
    freeShippingOption: document.getElementById('free'),
    
    // Cart action buttons
    updateCartBtn: document.getElementById('update-cart'),
    clearCartBtn: document.getElementById('clear-cart'),
    checkoutBtn: document.querySelector('.checkout-btn')
  };

  // Valid discount codes 
  // In a real application, these would come from the backend
  const validDiscountCodes = {
    'WELCOME10': {
      type: 'percentage',
      value: 10 // 10% off
    },
    'AFRIMART20': {
      type: 'percentage',
      value: 20 // 20% off
    },
    'FREESHIP': {
      type: 'freeshipping'
    }
  };

  /**
   * Initialize cart functionality
   */
  function initCart() {
    // Load cart items from localStorage
    loadCartFromStorage();
    
    // Render cart items
    renderCartItems();
    
    // Calculate and update totals
    calculateTotals();
    
    // Initialize event listeners
    initEventListeners();
  }

  /**
   * Load cart items from localStorage
   */
  function loadCartFromStorage() {
    cartState.items = window.CartService.getCart();
    
    // Update cart count in header
    updateCartCount();
    
    // Toggle between empty cart and cart with items
    toggleCartDisplay();
  }

  /**
   * Update the cart count in the header
   */
  function updateCartCount() {
    const count = cartState.items.reduce((total, item) => total + item.quantity, 0);
    
    if (elements.cartCount) {
      elements.cartCount.textContent = count;
    }
    
    if (elements.cartItemsTitle) {
      elements.cartItemsTitle.textContent = `Your Cart (${count} item${count !== 1 ? 's' : ''})`;
    }
  }

  /**
   * Toggle between empty cart and cart with items display
   */
  function toggleCartDisplay() {
    if (cartState.items.length === 0) {
      if (elements.cartContainer) elements.cartContainer.style.display = 'none';
      if (elements.emptyCart) elements.emptyCart.style.display = 'block';
    } else {
      if (elements.cartContainer) elements.cartContainer.style.display = 'block';
      if (elements.emptyCart) elements.emptyCart.style.display = 'none';
    }
  }

  /**
   * Render cart items to the DOM
   */
  function renderCartItems() {
    if (!elements.cartItemsList) return;
    
    // Clear existing items
    elements.cartItemsList.innerHTML = '';
    
    // Create HTML for each cart item
    cartState.items.forEach(item => {
      const cartItemHtml = createCartItemHtml(item);
      elements.cartItemsList.innerHTML += cartItemHtml;
    });
    
    // Initialize event listeners for cart items
    initCartItemEvents();
  }

  /**
   * Create HTML for a cart item
   * @param {Object} item - Cart item data
   * @returns {string} - HTML string for cart item
   */
  function createCartItemHtml(item) {
    const subtotal = (item.price * item.quantity).toFixed(2);
    
    return `
      <div class="cart-item" data-product-id="${item.id}">
        <div class="product-col">
          <div class="product-info">
            <div class="product-image">
              <img src="${item.image}" alt="${item.title}">
            </div>
            <div class="product-details">
              <h3 class="product-title">${item.title}</h3>
              <p class="product-variant">Size: ${item.unit}</p>
            </div>
          </div>
        </div>
        <div class="price-col">
          <span class="price">$${item.price.toFixed(2)}</span>
        </div>
        <div class="quantity-col">
          <div class="quantity-selector">
            <button class="quantity-btn minus">-</button>
            <input type="number" class="quantity-input" value="${item.quantity}" min="1" max="10">
            <button class="quantity-btn plus">+</button>
          </div>
        </div>
        <div class="subtotal-col">
          <span class="subtotal">$${subtotal}</span>
        </div>
        <div class="remove-col">
          <button class="remove-item">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Initialize event listeners for cart items
   */
  function initCartItemEvents() {
    // Quantity selector functionality
    const quantitySelectors = document.querySelectorAll('.cart-item .quantity-selector');
    
    quantitySelectors.forEach(selector => {
      const minusBtn = selector.querySelector('.minus');
      const plusBtn = selector.querySelector('.plus');
      const quantityInput = selector.querySelector('.quantity-input');
      
      if (minusBtn && plusBtn && quantityInput) {
        // Decrease quantity
        minusBtn.addEventListener('click', function() {
          const currentValue = parseInt(quantityInput.value);
          if (currentValue > 1) {
            quantityInput.value = currentValue - 1;
            updateItemQuantity(quantityInput);
          }
        });
        
        // Increase quantity
        plusBtn.addEventListener('click', function() {
          const currentValue = parseInt(quantityInput.value);
          const maxValue = parseInt(quantityInput.getAttribute('max') || 10);
          if (currentValue < maxValue) {
            quantityInput.value = currentValue + 1;
            updateItemQuantity(quantityInput);
          }
        });
        
        // Manual input
        quantityInput.addEventListener('change', function() {
          updateItemQuantity(this);
        });
      }
    });
    
    // Remove item functionality
    const removeButtons = document.querySelectorAll('.remove-item');
    
    removeButtons.forEach(button => {
      button.addEventListener('click', function() {
        const cartItem = this.closest('.cart-item');
        const productId = parseInt(cartItem.dataset.productId);
        
        // Add fade-out animation
        cartItem.style.transition = 'opacity 0.3s ease';
        cartItem.style.opacity = '0';
        
        // Remove after animation
        setTimeout(() => {
          // Remove from cartState and localStorage
          removeCartItem(productId);
          
          // Update UI
          cartItem.remove();
          calculateTotals();
          
          // Update cart count
          updateCartCount();
          
          // Show empty cart if no items remain
          toggleCartDisplay();
        }, 300);
      });
    });
  }

  /**
   * Initialize event listeners for cart actions
   */
  function initEventListeners() {
    // Shipping option change
    if (elements.shippingOptions.length) {
      elements.shippingOptions.forEach(option => {
        option.addEventListener('change', function() {
          cartState.shipping.method = this.value;
          
          switch (this.value) {
            case 'standard':
              cartState.shipping.cost = 5.99;
              elements.shippingCostEl.textContent = '$5.99';
              break;
            case 'express':
              cartState.shipping.cost = 12.99;
              elements.shippingCostEl.textContent = '$12.99';
              break;
            case 'free':
              cartState.shipping.cost = 0;
              elements.shippingCostEl.textContent = '$0.00';
              break;
          }
          
          // Recalculate totals
          calculateTotals();
        });
      });
    }
    
    // Apply discount code
    if (elements.applyDiscountBtn) {
      elements.applyDiscountBtn.addEventListener('click', function() {
        const code = elements.discountCodeInput.value.trim().toUpperCase();
        
        // Hide previous messages
        if (elements.discountSuccessMsg) elements.discountSuccessMsg.style.display = 'none';
        if (elements.discountErrorMsg) elements.discountErrorMsg.style.display = 'none';
        
        if (code === '') {
          if (elements.discountErrorMsg) {
            elements.discountErrorMsg.textContent = 'Please enter a discount code.';
            elements.discountErrorMsg.style.display = 'block';
          }
          return;
        }
        
        if (validDiscountCodes.hasOwnProperty(code)) {
          const discount = validDiscountCodes[code];
          
          // Apply the discount
          cartState.discount.code = code;
          cartState.discount.type = discount.type;
          cartState.discount.value = discount.value || 0;
          cartState.discount.applied = true;
          
          if (discount.type === 'freeshipping') {
            // Apply free shipping
            elements.freeShippingOption.checked = true;
            elements.freeShippingOption.disabled = false;
            document.querySelector('label[for="free"]').classList.remove('disabled');
            elements.shippingCostEl.textContent = '$0.00';
            cartState.shipping.method = 'free';
            cartState.shipping.cost = 0;
            
            // Show success message
            if (elements.discountSuccessMsg) {
              elements.discountSuccessMsg.textContent = 'Free shipping applied successfully!';
              elements.discountSuccessMsg.style.display = 'block';
            }
          } else if (discount.type === 'percentage') {
            // Apply percentage discount
            const subtotal = calculateSubtotal();
            const discountValue = subtotal * (discount.value / 100);
            
            // Show discount row
            if (elements.discountRow) elements.discountRow.style.display = 'flex';
            if (elements.discountEl) elements.discountEl.textContent = '-' + formatCurrency(discountValue);
            
            // Show success message
            if (elements.discountSuccessMsg) {
              elements.discountSuccessMsg.textContent = `${discount.value}% discount applied successfully!`;
              elements.discountSuccessMsg.style.display = 'block';
            }
          }
          
          // Disable input and button after successful application
          elements.discountCodeInput.disabled = true;
          elements.applyDiscountBtn.disabled = true;
          
          // Recalculate totals
          calculateTotals();
        } else {
          // Invalid code
          if (elements.discountErrorMsg) {
            elements.discountErrorMsg.textContent = 'Invalid discount code. Please try again.';
            elements.discountErrorMsg.style.display = 'block';
          }
        }
      });
    }
    
    // Update cart button
    if (elements.updateCartBtn) {
      elements.updateCartBtn.addEventListener('click', function() {
        // Animation to indicate update
        this.textContent = 'Cart Updated';
        this.disabled = true;
        
        setTimeout(() => {
          this.textContent = 'Update Cart';
          this.disabled = false;
        }, 2000);
        
        // Recalculate totals (this would save to server in a real implementation)
        calculateTotals();
      });
    }
    
    // Clear cart button
    if (elements.clearCartBtn) {
      elements.clearCartBtn.addEventListener('click', function() {
        if (confirm('Are you sure you want to clear your cart?')) {
          // Add fade-out animation to all items
          document.querySelectorAll('.cart-item').forEach(item => {
            item.style.transition = 'opacity 0.3s ease';
            item.style.opacity = '0';
          });
          
          // Clear cart after animation
          setTimeout(() => {
            // Clear cart state and localStorage
            clearCart();
            
            // Update UI
            toggleCartDisplay();
            updateCartCount();
          }, 300);
        }
      });
    }
    
    // Checkout button
    if (elements.checkoutBtn) {
      elements.checkoutBtn.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Redirect to checkout page
        window.location.href = 'checkout.html';
      });
    }
  }

  /**
   * Update a cart item's quantity
   * @param {HTMLElement} input - Quantity input element
   */
  function updateItemQuantity(input) {
    const value = parseInt(input.value);
    const minValue = parseInt(input.getAttribute('min') || 1);
    const maxValue = parseInt(input.getAttribute('max') || 10);
    
    // Ensure valid value
    let quantity = value;
    if (isNaN(value) || value < minValue) {
      quantity = minValue;
      input.value = minValue;
    } else if (value > maxValue) {
      quantity = maxValue;
      input.value = maxValue;
    }
    
    const cartItem = input.closest('.cart-item');
    const productId = parseInt(cartItem.dataset.productId);
    
    // Update cart state and localStorage
    const itemIndex = cartState.items.findIndex(item => item.id === productId);
    if (itemIndex !== -1) {
      cartState.items[itemIndex].quantity = quantity;
      
      // Update localStorage
      window.CartService.updateQuantity(productId, quantity);
      
      // Update subtotal display
      const price = cartState.items[itemIndex].price;
      const subtotal = price * quantity;
      const subtotalEl = cartItem.querySelector('.subtotal');
      if (subtotalEl) {
        subtotalEl.textContent = formatCurrency(subtotal);
      }
      
      // Recalculate totals
      calculateTotals();
    }
  }

  /**
   * Remove a cart item
   * @param {number} productId - ID of product to remove
   */
  function removeCartItem(productId) {
    // Remove from cart state
    cartState.items = cartState.items.filter(item => item.id !== productId);
    
    // Remove from localStorage
    window.CartService.removeItem(productId);
  }

  /**
   * Clear the entire cart
   */
  function clearCart() {
    // Clear cart state
    cartState.items = [];
    
    // Clear localStorage
    window.CartService.clearCart();
  }

  /**
   * Calculate subtotal of all cart items
   * @returns {number} - Cart subtotal
   */
  function calculateSubtotal() {
    return cartState.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  /**
   * Calculate and update cart totals
   */
  function calculateTotals() {
    // Calculate subtotal
    const subtotal = calculateSubtotal();
    
    // Check if free shipping is applicable
    if (subtotal >= 50 && elements.freeShippingOption) {
      elements.freeShippingOption.disabled = false;
      document.querySelector('label[for="free"]').classList.remove('disabled');
      
      // If free shipping was previously selected, keep it
      if (cartState.shipping.method === 'free') {
        cartState.shipping.cost = 0;
        if (elements.shippingCostEl) elements.shippingCostEl.textContent = '$0.00';
      }
    } else if (elements.freeShippingOption) {
      elements.freeShippingOption.disabled = true;
      document.querySelector('label[for="free"]').classList.add('disabled');
      
      // If free shipping was selected but is no longer available, switch to standard
      if (cartState.shipping.method === 'free' && !cartState.discount.applied) {
        document.getElementById('standard').checked = true;
        cartState.shipping.method = 'standard';
        cartState.shipping.cost = 5.99;
        if (elements.shippingCostEl) elements.shippingCostEl.textContent = '$5.99';
      }
    }
    
    // Calculate discount if applicable
    let discount = 0;
    if (cartState.discount.applied && cartState.discount.type === 'percentage') {
      discount = subtotal * (cartState.discount.value / 100);
      
      // Show discount row
      if (elements.discountRow) elements.discountRow.style.display = 'flex';
      if (elements.discountEl) elements.discountEl.textContent = '-' + formatCurrency(discount);
    } else if (!cartState.discount.applied && elements.discountRow) {
      elements.discountRow.style.display = 'none';
    }
    
    // Calculate tax (8% of subtotal after discount)
    const taxRate = 0.08;
    const taxableAmount = subtotal - discount;
    const tax = taxableAmount * taxRate;
    
    // Calculate total
    const total = taxableAmount + tax + cartState.shipping.cost;
    
    // Update display
    if (elements.subtotalEl) elements.subtotalEl.textContent = formatCurrency(subtotal);
    if (elements.taxAmountEl) elements.taxAmountEl.textContent = formatCurrency(tax);
    if (elements.orderTotalEl) elements.orderTotalEl.textContent = formatCurrency(total);
    
    // Update state
    cartState.subtotal = subtotal;
    cartState.tax = tax;
    cartState.total = total;
  }

  /**
   * Format currency for display
   * @param {number} amount - Amount to format
   * @returns {string} - Formatted currency string
   */
  function formatCurrency(amount) {
    return '$' + parseFloat(amount).toFixed(2);
  }

  /**
   * Place an order with the backend API
   * @param {Object} orderData - Customer and shipping details
   * @returns {Promise} - Promise resolving to order response
   */
  async function placeOrder(orderData) {
    try {
      // Format order data
      const orderItems = cartState.items.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        price: item.price
      }));
      
      // Create order request object
      const orderRequest = {
        customer_name: orderData.name,
        customer_email: orderData.email,
        customer_phone: orderData.phone,
        shipping_address: formatShippingAddress(orderData),
        additional_notes: orderData.notes || '',
        items: orderItems,
        shipping_method: cartState.shipping.method,
        payment_method: orderData.payment_method || 'cash_on_delivery'
      };
      
      // Send order to API
      const response = await window.ApiService.post('/orders', orderRequest);
      
      if (response.success) {
        // Clear cart after successful order
        clearCart();
        return response;
      } else {
        throw new Error(response.error || 'Failed to place order');
      }
    } catch (error) {
      console.error('Order error:', error);
      throw error;
    }
  }

  /**
   * Format shipping address for API
   * @param {Object} addressData - Address form data
   * @returns {string} - Formatted address string
   */
  function formatShippingAddress(addressData) {
    return `${addressData.name}
${addressData.address_line1}
${addressData.address_line2 ? addressData.address_line2 + '\n' : ''}${addressData.city}, ${addressData.state} ${addressData.zip}
${addressData.country}`;
  }

  // Initialize cart functionality
  initCart();

  // Expose public methods for checkout page
  window.CartManager = {
    getCartState: () => cartState,
    getCartItems: () => cartState.items,
    getCartTotal: () => cartState.total,
    placeOrder: placeOrder,
    clearCart: clearCart
  };
});