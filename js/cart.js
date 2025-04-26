/*
* AfriMart Depot - Shopping Cart JavaScript
* Version: 3.4 - Simplified WhatsApp message for checkout
*/

document.addEventListener('DOMContentLoaded', function() {
  'use strict';

  // Initialize AOS Animation
  if (typeof AOS !== 'undefined') {
    AOS.init({
      duration: 800,
      easing: 'ease-in-out',
      once: true,
      mirror: false
    });
  }

  // ==================
  // DOM Element References
  // ==================

  // Cart page elements
  const cartItemsContainer = document.querySelector('.cart-item-list');
  const cartSubtotal = document.getElementById('cart-subtotal');
  const shippingCost = document.getElementById('shipping-cost');
  const taxAmount = document.getElementById('tax-amount');
  const orderTotal = document.getElementById('order-total');
  const discountAmount = document.getElementById('discount-amount');
  const discountRow = document.querySelector('.discount-row');
  const emptyCartSection = document.querySelector('.empty-cart');
  const cartWithItemsSection = document.querySelector('.cart-with-items');
  const itemsCountDisplay = document.querySelector('.items-count');

  // Shipping options
  const shippingOptions = document.querySelectorAll('input[name="shipping"]');
  const freeShippingOption = document.getElementById('free');

  // Discount code
  const discountCodeInput = document.getElementById('discount-code');
  const applyDiscountBtn = document.getElementById('apply-discount');
  const discountSuccessMsg = document.querySelector('.discount-message.success');
  const discountErrorMsg = document.querySelector('.discount-message.error');

  // Cart action buttons
  const updateCartBtn = document.getElementById('update-cart');
  const clearCartBtn = document.getElementById('clear-cart');
  const checkoutBtn = document.querySelector('.checkout-btn');
   const miniCheckoutBtn = document.querySelector('.mini-checkout-btn'); // Added for mini cart

  // Page detection (to run appropriate code)
  const isCartPage = document.querySelector('.cart-section') !== null;
  const isShopPage = document.querySelector('.shop-section') !== null;
  const isProductPage = document.querySelector('.product-details-section') !== null;

  // Find all cart count elements
  const cartCountElements = document.querySelectorAll('.cart-count');

  // Discount codes (in a real application, these would be validated server-side)
  const validDiscountCodes = {
    'WELCOME10': 10, // 10% off
    'AFRIMART20': 20, // 20% off
    'FREESHIP': 'freeshipping' // Free shipping
  };

  // ==================
  // Cart Core Functions
  // ==================

  /**
   * Get cart data from localStorage
   * @returns {Object} Cart data with items array and metadata
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
   * Save cart data to localStorage
   * @param {Array} cartItems - Array of cart item objects
   */
  function saveCartToStorage(cartItems) {
     // Ensure cartItems is an array
    const itemsToSave = Array.isArray(cartItems) ? cartItems : [];
    // Calculate subtotal
    const subtotal = calculateSubtotal(itemsToSave);

    // Format the cart data
    const cartData = {
      items: itemsToSave,
      subtotal: subtotal,
      lastUpdated: new Date().toISOString()
    };

    // Save to localStorage
    try {
      localStorage.setItem('afrimartCart', JSON.stringify(cartData));

      // Remove old cartCount from localStorage to prevent conflicts
      if (localStorage.getItem('cartCount')) {
        localStorage.removeItem('cartCount');
      }
    } catch (e) {
      console.error('Error saving cart data to localStorage', e);
    }

    // Update cart counts and displays
    updateCartDisplay();
  }

 /**
   * Add a product to the cart
   * @param {Object} product - Product object to add to cart
   * @returns {boolean} True if item was added/updated, false otherwise
   */
  function addToCart(product) {
    // Validate product has required fields
    if (!product || !product.id || !product.title || !product.price) {
      console.error('Invalid product object', product);
      return false; // Indicate failure
    }

    // Ensure product has a quantity, default to 1
    if (!product.quantity || isNaN(parseInt(product.quantity))) {
      product.quantity = 1;
    } else {
      product.quantity = parseInt(product.quantity);
    }

    const cart = getCartFromStorage();
    const existingProductIndex = cart.items.findIndex(item => item.id === product.id);

    if (existingProductIndex !== -1) {
      // Product exists
      // --- START MODIFICATION (Issue 2 Fix) ---
      // Only increment quantity if the incoming quantity is > 1
      if (product.quantity > 1) {
          const newQty = parseInt(cart.items[existingProductIndex].quantity) + product.quantity;
          cart.items[existingProductIndex].quantity = Math.min(newQty, 99); // Cap at 99
          saveCartToStorage(cart.items);
          showAddedToCartNotification(`${product.title} quantity updated`);
          showMiniCart();
          return true; // Quantity updated
      } else {
          // If incoming quantity is 1 and item exists, just notify it's already there
          showAddedToCartNotification(`${product.title} is already in your cart`);
          showMiniCart();
          return false; // Indicate quantity wasn't changed
      }
      // --- END MODIFICATION ---
    } else {
      // Product doesn't exist, add it
      cart.items.push({
        id: product.id,
        title: product.title,
        price: product.price,
        quantity: Math.min(product.quantity, 99), // Cap at 99
        image: product.image || '',
        variant: product.variant || ''
      });
      saveCartToStorage(cart.items);
      showAddedToCartNotification(`${product.title} added to cart`);
      showMiniCart();
      return true; // Item added
    }
  }

  /**
   * Remove an item from the cart
   * @param {string} productId - ID of product to remove
   */
  function removeCartItem(productId) {
    if (!productId) return false;

    // Get current cart
    const cart = getCartFromStorage();

    // Remove item
    const updatedItems = cart.items.filter(item => item.id !== productId);

    // Save updated cart
    saveCartToStorage(updatedItems);

    // If on cart page, update UI by removing the element
    if (isCartPage) {
      const itemToRemove = document.querySelector(`.cart-item[data-product-id="${productId}"]`);
      if (itemToRemove) {
        // Fade out animation
        itemToRemove.style.transition = 'opacity 0.3s ease';
        itemToRemove.style.opacity = '0';

        // Remove after animation
        setTimeout(() => {
          itemToRemove.remove();

          // Recalculate totals
          calculateCartTotals();

          // Check if cart is now empty
          if (updatedItems.length === 0) {
            showEmptyCartMessage();
          }
        }, 300);
      }
    }

    // Update mini-cart if it's open or exists
    updateMiniCartItems();

    return true;
  }

  /**
   * Update the quantity of an item in the cart
   * @param {string} productId - ID of product to update
   * @param {number} quantity - New quantity
   */
  function updateCartItemQuantity(productId, quantity) {
    if (!productId || isNaN(parseInt(quantity))) return false;

    // Ensure quantity is a valid number
    quantity = Math.max(1, Math.min(99, parseInt(quantity)));

    // Get current cart
    const cart = getCartFromStorage();

    // Find item
    const existingProductIndex = cart.items.findIndex(item => item.id === productId);

    if (existingProductIndex !== -1) {
      // Update quantity
      cart.items[existingProductIndex].quantity = quantity;

      // Save updated cart
      saveCartToStorage(cart.items);

      // Return success
      return true;
    }

    return false;
  }

  /**
   * Calculate subtotal from cart items
   * @param {Array} cartItems - Array of cart item objects
   * @returns {number} Subtotal
   */
  function calculateSubtotal(cartItems) {
    let subtotal = 0;

    if (!cartItems || !Array.isArray(cartItems)) return subtotal;

    cartItems.forEach(item => {
      // Extract numeric price from price string (e.g. "$12.99" -> 12.99)
      const price = parseFloat(item.price?.replace(/[^\d.-]/g, '')) || 0; // Added check for price existence
      const quantity = parseInt(item.quantity || 1);

      if (!isNaN(price) && !isNaN(quantity)) {
        subtotal += price * quantity;
      }
    });

    return subtotal;
  }

  /**
   * Format currency as dollar amount
   * @param {number} amount - Amount to format
   * @returns {string} Formatted amount with $ sign
   */
  function formatCurrency(amount) {
    // Ensure amount is treated as a number
    const numAmount = Number(amount);
    if (isNaN(numAmount)) {
        return '$0.00'; // Or handle error appropriately
    }
    return '$' + numAmount.toFixed(2);
  }


  /**
   * Calculate all cart totals
   * Updates DOM elements with calculated values
   */
  function calculateCartTotals() {
    if (!isCartPage) return;

    // Get cart items from DOM
    const cartItemsData = extractCartItemsFromDOM();

    // Calculate subtotal
    let subtotal = calculateSubtotal(cartItemsData);

    // Get shipping cost
    let shipping = 5.99; // Default to standard shipping
    const selectedShippingInput = document.querySelector('input[name="shipping"]:checked');


    // Check if free shipping is applicable (orders $50+)
    if (freeShippingOption) { // Check if element exists
        if (subtotal >= 50) {
            freeShippingOption.disabled = false;
            const freeShippingLabel = document.querySelector('label[for="free"]');
            if (freeShippingLabel) {
                freeShippingLabel.classList.remove('disabled');
            }
        } else {
            freeShippingOption.disabled = true;
            const freeShippingLabel = document.querySelector('label[for="free"]');
            if (freeShippingLabel) {
                freeShippingLabel.classList.add('disabled');
            }
            // If free shipping was selected but no longer applicable, switch to standard
            if (freeShippingOption.checked) {
                const standardOption = document.getElementById('standard');
                if (standardOption) standardOption.checked = true;
                // No need to set shipping = 5.99 here, it will be read below
            }
        }
    }

    // Read the actual checked shipping option's value
     if (selectedShippingInput) {
        switch (selectedShippingInput.id) {
            case 'standard':
                shipping = 5.99;
                break;
            case 'express':
                shipping = 12.99;
                break;
            case 'free':
                 // Only allow free shipping if subtotal is >= 50
                shipping = (subtotal >= 50) ? 0 : 5.99;
                // If subtotal dropped below 50, make sure standard is selected visually too
                if (shipping === 5.99 && document.getElementById('free').checked) {
                     const standardOption = document.getElementById('standard');
                     if (standardOption) standardOption.checked = true;
                }
                break;
            default:
                shipping = 5.99; // Fallback to standard
        }
    }


    // Check for discount
    let discount = 0;
    if (discountRow && discountRow.style.display !== 'none' && discountAmount) {
      const discountText = discountAmount.textContent.replace(/[^\d.-]/g, '');
      // Discount is displayed like "-$5.00", so parsing it should yield a negative number or 0
      discount = parseFloat(discountText) || 0;
       if (discount > 0) discount = -discount; // Ensure it's negative or zero
    }

    // Calculate tax (8% of subtotal after discount)
    const taxRate = 0.08;
    const taxableAmount = Math.max(0, subtotal + discount); // Discount is negative or 0
    const tax = taxableAmount * taxRate;

    // Calculate total
    const total = taxableAmount + tax + shipping;

    // Update UI
    if (cartSubtotal) cartSubtotal.textContent = formatCurrency(subtotal);
    if (shippingCost) shippingCost.textContent = formatCurrency(shipping);
    if (taxAmount) taxAmount.textContent = formatCurrency(tax);
    if (orderTotal) orderTotal.textContent = formatCurrency(total);

    // Save the current state to localStorage (optional, can be done on specific actions)
    // saveCartToStorage(cartItemsData); // Removed from here to avoid saving on every calculation
  }


  /**
   * Extract cart items from the DOM on the cart page
   * @returns {Array} Array of cart item objects
   */
  function extractCartItemsFromDOM() {
    const items = [];

    if (!isCartPage || !cartItemsContainer) return items; // Added check for cartItemsContainer

    cartItemsContainer.querySelectorAll('.cart-item').forEach(item => {
      const productId = item.dataset.productId;
      const title = item.querySelector('.product-title')?.textContent;
      const price = item.querySelector('.price')?.textContent;
      const quantity = item.querySelector('.quantity-input')?.value;
      const image = item.querySelector('.product-image img')?.src;
      const variant = item.querySelector('.product-variant')?.textContent || '';

      if (productId && title && price && quantity) {
        items.push({
          id: productId,
          title: title,
          price: price,
          quantity: parseInt(quantity),
          image: image,
          variant: variant
        });
      }
    });

    return items;
  }

  // ==================
  // UI Update Functions
  // ==================

  /**
   * Update all cart displays across the site
   * Updates cart counts, mini-cart, cart page, etc.
   */
  function updateCartDisplay() {
    // Get cart data
    const cart = getCartFromStorage();

    // Calculate total items
    let totalItems = 0;
    // Ensure cart.items is an array before iterating
     if (Array.isArray(cart.items)) {
        cart.items.forEach(item => {
            totalItems += parseInt(item.quantity || 1);
        });
    }

    // Update all cart count badges
    document.querySelectorAll('.cart-count').forEach(badge => {
        if (badge) { // Check if badge exists
             badge.textContent = totalItems.toString();
        }
    });

    // Update items count on cart page
    if (isCartPage && itemsCountDisplay) {
      itemsCountDisplay.textContent = totalItems;
    }

    // Update floating cart count if it exists
    const floatingCount = document.querySelector('.floating-count');
    if (floatingCount) {
      floatingCount.textContent = totalItems;
    }

    // Show/hide empty cart message on cart page
    if (isCartPage) {
      // Ensure cart.items exists and is an array
        const itemCount = Array.isArray(cart.items) ? cart.items.length : 0;
        if (itemCount === 0) {
            showEmptyCartMessage();
        } else {
            hideEmptyCartMessage();
        }
    }

    // Update mini-cart if it exists
    updateMiniCartItems(); // Always update mini-cart data regardless of visibility
  }

  /**
   * Show notification when item is added to cart
   * @param {string} message - Message to display
   */
  function showAddedToCartNotification(message) {
    // Create notification if it doesn't exist
    let notification = document.querySelector('.cart-notification');

    if (!notification) {
      notification = document.createElement('div');
      notification.className = 'cart-notification';
      document.body.appendChild(notification);

       // Add basic styles if CSS might not be loaded yet
        notification.style.position = 'fixed';
        notification.style.bottom = '20px';
        notification.style.right = '20px';
        notification.style.backgroundColor = '#14893c'; // Primary color
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
    // Use requestAnimationFrame for smoother animation start
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            notification.classList.add('active'); // Add class if CSS depends on it
            notification.style.transform = 'translateY(0)';
            notification.style.opacity = '1';
        });
    });


    // Hide after 3 seconds
    setTimeout(() => {
      notification.classList.remove('active'); // Remove class if CSS depends on it
      notification.style.transform = 'translateY(100px)';
      notification.style.opacity = '0';
       // Optional: Remove element after transition
       setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  /**
   * Create and show mini-cart
   */
  function showMiniCart() {
    // Create mini-cart if it doesn't exist
    let miniCart = document.querySelector('.mini-cart');

    if (!miniCart) {
      miniCart = createMiniCart();
       if (!miniCart) return; // Exit if creation failed
    }


    // Update mini-cart contents
    updateMiniCartItems();

    // Show mini-cart using classes for CSS transitions
    miniCart.classList.add('active');


    // Auto-hide after delay (optional)
    /*
    setTimeout(() => {
      if (miniCart.classList.contains('active')) {
        miniCart.classList.remove('active');
      }
    }, 5000);
    */
  }


  /**
   * Create mini-cart element
   * @returns {HTMLElement | null} Mini-cart element or null if body not ready
   */
  function createMiniCart() {
     if (!document.body) {
        console.error("Cannot create mini-cart: document body not ready.");
        return null;
    }

    // Avoid creating duplicates
    if (document.querySelector('.mini-cart')) {
        return document.querySelector('.mini-cart');
    }

    // Mini-cart HTML template
    const miniCartHTML = `
      <div class="mini-cart"> <div class="mini-cart-header">
          <h3>Cart</h3>
          <button class="mini-cart-close" aria-label="Close Cart"><i class="fas fa-times"></i></button>
        </div>
        <div class="mini-cart-items">
          </div>
        <div class="mini-cart-footer">
          <div class="mini-cart-subtotal">
            <span>Subtotal:</span>
            <span class="mini-subtotal-value">$0.00</span>
          </div>
          <div class="mini-cart-actions">
            <a href="cart.html" class="btn btn-secondary view-cart-btn">View Cart</a>
            <button class="btn btn-primary mini-checkout-btn">
              <i class="fab fa-whatsapp"></i> Checkout
            </button>
          </div>
        </div>
      </div>
    `;

    // Create container div if it doesn't exist (more robust)
    let tempContainer = document.createElement('div');
    tempContainer.innerHTML = miniCartHTML;
    const miniCartElement = tempContainer.firstElementChild;


    document.body.appendChild(miniCartElement);

    // Get mini-cart reference again after appending
    const miniCart = document.querySelector('.mini-cart'); // Use the class selector

    // Add event listeners
    const closeBtn = miniCart.querySelector('.mini-cart-close');
    const checkoutBtn = miniCart.querySelector('.mini-checkout-btn');

    closeBtn.addEventListener('click', () => {
      miniCart.classList.remove('active');
    });

     if (checkoutBtn) { // Check if button exists before adding listener
         checkoutBtn.addEventListener('click', () => {
             checkoutViaWhatsApp();
         });
     }


    // Listener to close mini-cart if clicked outside
    document.addEventListener('click', function(event) {
        const isClickInsideCart = miniCart.contains(event.target);
        // Check if the click target is the cart icon itself or inside it
        const cartIconLink = document.querySelector('.cart-icon a');
        const isClickOnCartIcon = cartIconLink ? cartIconLink.contains(event.target) : false;

        if (!isClickInsideCart && !isClickOnCartIcon && miniCart.classList.contains('active')) {
            miniCart.classList.remove('active');
        }
    });


    return miniCart;
  }


  /**
   * Update items in mini-cart
   */
  function updateMiniCartItems() {
    const miniCart = document.querySelector('.mini-cart');
    if (!miniCart) return; // Exit if mini-cart element doesn't exist

    const miniCartItemsContainer = miniCart.querySelector('.mini-cart-items');
    const miniSubtotal = miniCart.querySelector('.mini-subtotal-value');

    // Ensure containers exist before proceeding
    if (!miniCartItemsContainer || !miniSubtotal) {
        console.error("Mini-cart structure incomplete.");
        return;
    }


    // Get cart from localStorage
    const cart = getCartFromStorage();

    // Clear existing items
    miniCartItemsContainer.innerHTML = '';

    // Add items
    if (!Array.isArray(cart.items) || cart.items.length === 0) {
      miniCartItemsContainer.innerHTML = '<p class="mini-cart-empty">Your cart is empty</p>';
      miniSubtotal.textContent = '$0.00';
    } else {
      let subtotal = 0;

      cart.items.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'mini-cart-item';
        itemElement.innerHTML = `
          <div class="mini-cart-item-image">
            <img src="${item.image || 'images/placeholder.jpg'}" alt="${item.title}">
          </div>
          <div class="mini-cart-item-details">
            <h4>${item.title}</h4>
            <div class="mini-cart-item-price">
              <span>${item.quantity} × ${item.price}</span>
            </div>
          </div>
          <button class="mini-cart-item-remove" data-product-id="${item.id}" aria-label="Remove ${item.title}">
            <i class="fas fa-times"></i>
          </button>
        `;

        miniCartItemsContainer.appendChild(itemElement);

        // Calculate subtotal
        const price = parseFloat(item.price?.replace(/[^\d.-]/g, '')) || 0; // Added check for price existence
         if (!isNaN(price)) { // Check if price is valid
            subtotal += price * parseInt(item.quantity || 1);
        }
      });

      // Update subtotal
      miniSubtotal.textContent = formatCurrency(subtotal);

      // Add event listeners to remove buttons using event delegation
       miniCartItemsContainer.removeEventListener('click', handleMiniCartRemove); // Remove previous listener to avoid duplicates
       miniCartItemsContainer.addEventListener('click', handleMiniCartRemove); // Add new listener
    }
  }

   // Separate handler function for mini-cart remove button clicks
   function handleMiniCartRemove(e) {
        const removeButton = e.target.closest('.mini-cart-item-remove');
        if (removeButton) {
            e.stopPropagation(); // Prevent closing mini-cart if remove is clicked
            const productId = removeButton.dataset.productId;
            removeCartItem(productId);
        }
    }


  /**
   * Show empty cart message and hide cart items
   */
  function showEmptyCartMessage() {
    if (!isCartPage) return;

    if (emptyCartSection) {
      emptyCartSection.style.display = 'block';
    }

    if (cartWithItemsSection) {
      cartWithItemsSection.style.display = 'none';
    }
  }

  /**
   * Hide empty cart message and show cart items
   */
  function hideEmptyCartMessage() {
    if (!isCartPage) return;

    if (emptyCartSection) {
      emptyCartSection.style.display = 'none';
    }

    if (cartWithItemsSection) {
      cartWithItemsSection.style.display = 'block';
    }
  }

  /**
   * Update the subtotal for a specific cart item when quantity changes
   * @param {HTMLElement} quantityInput - Quantity input element
   */
  function updateItemSubtotal(quantityInput) {
    if (!isCartPage) return;

    const cartItem = quantityInput.closest('.cart-item');
    if (!cartItem) return;

    const priceElement = cartItem.querySelector('.price');
    const subtotalElement = cartItem.querySelector('.subtotal');
    const productId = cartItem.dataset.productId;

    if (!priceElement || !subtotalElement || !productId) return;

    const price = parseFloat(priceElement.textContent.replace(/[^\d.-]/g, ''));
    const quantity = parseInt(quantityInput.value);

    if (isNaN(price) || isNaN(quantity)) return;

    const subtotal = price * quantity;

    // Update DOM
    subtotalElement.textContent = formatCurrency(subtotal);

    // Update cart in storage
    updateCartItemQuantity(productId, quantity);

    // Recalculate totals
    calculateCartTotals();
  }

  // ==================
  // Checkout Functions
  // ==================

  /**
   * Checkout via WhatsApp (Simplified Message Version)
   */
  function checkoutViaWhatsApp() {
    // Get cart data and totals
    const cart = getCartFromStorage();
    const cartItems = cart.items || [];
    
    if (cartItems.length === 0) {
        showAddedToCartNotification('Your cart is empty');
        return;
    }

    // Format cart items into a message
    let message = '🛒 New Order from AfriMart Depot\n\n';
    message += '*Order Items:*\n';
    
    let total = 0;
    cartItems.forEach((item, index) => {
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

    // Encode the message for WhatsApp URL (without manual line break encoding)
    const encodedMessage = encodeURIComponent(message);
    
    // WhatsApp business number (properly format international number)
    const whatsappNumber = '233545014267'.replace(/\D/g, '');
    
    // Create WhatsApp URL with proper formatting
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${whatsappNumber}&text=${encodedMessage}`;
    
    // Open WhatsApp in new tab
    window.open(whatsappUrl, '_blank');
    
    // Clear cart after successful checkout
    setTimeout(() => {
        if (typeof window.AfriMartCart !== 'undefined' && typeof window.AfriMartCart.clearCart === 'function') {
            window.AfriMartCart.clearCart();
        } else {
            localStorage.removeItem('afrimartCart');
            updateCartDisplay();
        }
        console.log("Order sent to WhatsApp, cart cleared.");
    }, 1500);
  }


  // ==================
  // Event Handlers and Initialization
  // ==================

  /**
   * Initialize cart on cart page
   */
  function initCartPage() {
    if (!isCartPage) return;

     // Ensure cartItemsContainer exists
     if (!cartItemsContainer) {
         console.error("Cart items container (.cart-item-list) not found.");
         showEmptyCartMessage(); // Show empty state if container missing
         return;
     }

    // Populate cart page with items from localStorage if container is empty
    if (cartItemsContainer.children.length === 0) {
      const cart = getCartFromStorage();

      if (Array.isArray(cart.items) && cart.items.length > 0) {
        // Add each item to the cart
        cart.items.forEach(item => {
          // Use template if available
          const template = document.getElementById('cart-item-template');
          let itemElement;
          if (template && template.content) { // Check for template and content property
              itemElement = template.content.firstElementChild.cloneNode(true);
              itemElement.dataset.productId = item.id;
              // Safely query elements within the cloned template
              const imgEl = itemElement.querySelector('.product-image img');
              const titleEl = itemElement.querySelector('.product-title');
              const variantEl = itemElement.querySelector('.product-variant');
              const priceEl = itemElement.querySelector('.price');
              const quantityInputEl = itemElement.querySelector('.quantity-input');
              const subtotalEl = itemElement.querySelector('.subtotal');

              if (imgEl) {
                imgEl.src = item.image || 'images/placeholder.jpg';
                imgEl.alt = item.title;
              }
               if (titleEl) titleEl.textContent = item.title;
               if (variantEl) variantEl.textContent = item.variant || '';
               if (priceEl) priceEl.textContent = item.price;
               if (quantityInputEl) quantityInputEl.value = item.quantity;
               if (subtotalEl) subtotalEl.textContent = formatCurrency((parseFloat(item.price?.replace(/[^\d.-]/g, '')) || 0) * parseInt(item.quantity || 1));

          } else {
              console.warn("Cart item template not found or invalid. Creating manually.");
              // Fallback to manual creation
              itemElement = document.createElement('div');
              itemElement.className = 'cart-item';
              itemElement.dataset.productId = item.id;
               itemElement.innerHTML = `
                    <div class="product-col"> <div class="product-info"> <div class="product-image"> <img src="${item.image || 'images/placeholder.jpg'}" alt="${item.title}"> </div> <div class="product-details"> <h3 class="product-title">${item.title}</h3> <p class="product-variant">${item.variant || ''}</p> </div> </div> </div> <div class="price-col"> <span class="price">${item.price}</span> </div> <div class="quantity-col"> <div class="quantity-selector"> <button class="quantity-btn minus">-</button> <input type="number" class="quantity-input" value="${item.quantity}" min="1" max="99"> <button class="quantity-btn plus">+</button> </div> </div> <div class="subtotal-col"> <span class="subtotal">${formatCurrency((parseFloat(item.price?.replace(/[^\d.-]/g, ''))||0) * parseInt(item.quantity||1))}</span> </div> <div class="remove-col"> <button class="remove-item" aria-label="Remove ${item.title}"> <i class="fas fa-times"></i> </button> </div>
               `;
          }
          cartItemsContainer.appendChild(itemElement);
        });

        // Setup event handlers for cart items
        setupCartItemEvents();

        // Calculate totals
        calculateCartTotals();

        // Update UI
        hideEmptyCartMessage();
      } else {
        // Show empty cart message
        showEmptyCartMessage();
      }
    } else if (cartItemsContainer && cartItemsContainer.children.length > 0) {
        // If items are already in the DOM (e.g., from server-side rendering or template)
        setupCartItemEvents();
        calculateCartTotals();
        hideEmptyCartMessage();
    } else {
        // If container exists but is empty
        showEmptyCartMessage();
    }


    // Setup shipping option change handlers
    if (shippingOptions) {
      shippingOptions.forEach(option => {
        option.addEventListener('change', function() {
          calculateCartTotals(); // Recalculate totals when shipping changes
        });
      });
    }


    // Setup discount code button
    if (applyDiscountBtn && discountCodeInput) {
      applyDiscountBtn.addEventListener('click', function() {
        const code = discountCodeInput.value.trim().toUpperCase();

        // Hide previous messages
        if (discountSuccessMsg) discountSuccessMsg.style.display = 'none';
        if (discountErrorMsg) discountErrorMsg.style.display = 'none';
        // Reset discount row before applying new one
        if (discountRow && discountAmount) {
            discountRow.style.display = 'none';
            discountAmount.textContent = '-$0.00';
        }


        if (!code) {
          if (discountErrorMsg) {
            discountErrorMsg.textContent = 'Please enter a discount code.';
            discountErrorMsg.style.display = 'block';
          }
          calculateCartTotals(); // Recalculate in case discount was removed
          return;
        }

        if (validDiscountCodes.hasOwnProperty(code)) {
          const discount = validDiscountCodes[code];

          if (discount === 'freeshipping') {
            // Apply free shipping
            if (freeShippingOption) {
              freeShippingOption.checked = true;
              freeShippingOption.disabled = false;

              const freeShippingLabel = document.querySelector('label[for="free"]');
              if (freeShippingLabel) {
                freeShippingLabel.classList.remove('disabled');
              }

              // Trigger change event to update calculations
              freeShippingOption.dispatchEvent(new Event('change'));

            }

            // Show success message
            if (discountSuccessMsg) {
              discountSuccessMsg.textContent = 'Free shipping applied successfully!';
              discountSuccessMsg.style.display = 'block';
            }

             // Ensure discount amount row is hidden for free shipping discount
             if (discountRow && discountAmount) {
                discountRow.style.display = 'none';
                discountAmount.textContent = '-$0.00';
            }

          } else {
            // Apply percentage discount
            const subtotalValue = parseFloat(cartSubtotal?.textContent.replace(/[^\d.-]/g, '')) || 0;
            const discountValue = subtotalValue * (discount / 100);

            // Show discount row
            if (discountRow && discountAmount) {
              discountRow.style.display = 'flex';
               // Store discount as negative value for calculation, display as positive value with minus sign
               discountAmount.textContent = '-' + formatCurrency(discountValue);
            }

            // Show success message
            if (discountSuccessMsg) {
              discountSuccessMsg.textContent = `${discount}% discount applied successfully!`;
              discountSuccessMsg.style.display = 'block';
            }
          }

          // Disable input and button
          if (discountCodeInput) discountCodeInput.disabled = true;
          if (applyDiscountBtn) applyDiscountBtn.disabled = true;

          // Recalculate totals
          calculateCartTotals();
        } else {
          // Invalid code
          if (discountErrorMsg) {
            discountErrorMsg.textContent = 'Invalid discount code. Please try again.';
            discountErrorMsg.style.display = 'block';
          }
           // Ensure discount row is hidden if code is invalid
             if (discountRow && discountAmount) {
                discountRow.style.display = 'none';
                discountAmount.textContent = '-$0.00';
            }
            calculateCartTotals(); // Recalculate without discount
        }
      });
    }

    // Setup update cart button
    if (updateCartBtn) {
      updateCartBtn.addEventListener('click', function() {
        // Add animation to indicate update
        this.innerHTML = '<i class="fas fa-check"></i> Cart Updated';
        this.classList.add('btn-success');

        // Update cart data in storage based on current DOM state
        const cartItemsData = extractCartItemsFromDOM();
        saveCartToStorage(cartItemsData);

        // Recalculate totals (already happens in updateItemSubtotal, but good safety net)
        calculateCartTotals();

        // Reset button after animation
        setTimeout(() => {
          this.innerHTML = '<i class="fas fa-sync-alt"></i> Update Cart';
          this.classList.remove('btn-success');
        }, 2000);
      });
    }

    // Setup clear cart button
    if (clearCartBtn) {
      clearCartBtn.addEventListener('click', function() {
        if (confirm('Are you sure you want to clear your cart?')) {
          // Clear cart in storage
          saveCartToStorage([]); // This already calls updateCartDisplay

          // Fade out all items visually
          if(cartItemsContainer){
              Array.from(cartItemsContainer.children).forEach(item => {
                item.style.transition = 'opacity 0.3s ease';
                item.style.opacity = '0';
              });
          }


          // Update UI after animation
          setTimeout(() => {
            // Remove all items from DOM
            if (cartItemsContainer) {
              cartItemsContainer.innerHTML = '';
            }

            // Show empty cart message
            showEmptyCartMessage(); // This handles showing/hiding sections

             // Reset totals display and discount section
             calculateCartTotals(); // Recalculate totals to show $0.00

             if (discountRow) discountRow.style.display = 'none';
             if (discountAmount) discountAmount.textContent = '-$0.00';
             if (discountCodeInput) {
                 discountCodeInput.value = '';
                 discountCodeInput.disabled = false;
             }
             if (applyDiscountBtn) applyDiscountBtn.disabled = false;
             if (discountSuccessMsg) discountSuccessMsg.style.display = 'none';
             if (discountErrorMsg) discountErrorMsg.style.display = 'none';


          }, 300); // Wait for fade out before clearing DOM
        }
      });
    }

    // Setup checkout button
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', function(e) {
        e.preventDefault();
        checkoutViaWhatsApp();
      });
    }
  }


  /**
   * Setup event handlers for cart items using event delegation
   */
  function setupCartItemEvents() {
    if (!isCartPage || !cartItemsContainer) return; // Ensure we are on cart page and container exists

    // Use event delegation on the container
    cartItemsContainer.addEventListener('click', function(e) {
        const target = e.target;
        const cartItem = target.closest('.cart-item');
        if (!cartItem) return; // Click wasn't inside a cart item

        const productId = cartItem.dataset.productId;
        const quantityInput = cartItem.querySelector('.quantity-input');

        // Handle remove button click
        if (target.closest('.remove-item')) {
             e.stopPropagation(); // Prevent other listeners if remove clicked
            if (productId) {
                removeCartItem(productId);
            }
            return; // Stop further processing for remove click
        }

        // Handle quantity minus button click
        if (target.closest('.quantity-btn.minus')) {
             e.stopPropagation();
            if (quantityInput) {
                const currentValue = parseInt(quantityInput.value);
                if (currentValue > 1) {
                    quantityInput.value = currentValue - 1;
                    updateItemSubtotal(quantityInput); // Update subtotal and storage
                }
            }
            return; // Stop further processing
        }

        // Handle quantity plus button click
        if (target.closest('.quantity-btn.plus')) {
             e.stopPropagation();
            if (quantityInput) {
                const currentValue = parseInt(quantityInput.value);
                const maxValue = parseInt(quantityInput.getAttribute('max') || 99);
                if (currentValue < maxValue) {
                    quantityInput.value = currentValue + 1;
                    updateItemSubtotal(quantityInput); // Update subtotal and storage
                }
            }
            return; // Stop further processing
        }
    });

    // Handle direct input change on quantity fields using event delegation
    cartItemsContainer.addEventListener('change', function(e) {
        if (e.target.classList.contains('quantity-input')) {
            const quantityInput = e.target;
            let value = parseInt(quantityInput.value);
            const minValue = parseInt(quantityInput.getAttribute('min') || 1);
            const maxValue = parseInt(quantityInput.getAttribute('max') || 99);

            // Ensure valid value
            if (isNaN(value) || value < minValue) {
                value = minValue;
            } else if (value > maxValue) {
                value = maxValue;
            }

            quantityInput.value = value; // Update input field with corrected value
            updateItemSubtotal(quantityInput); // Update subtotal and storage
        }
    });
}


  /**
   * Setup cart icon click handlers
   */
  function setupCartIconClickHandlers() {
    const cartIcons = document.querySelectorAll('.cart-icon a');

    cartIcons.forEach(icon => {
      // Check if listener already attached
        if (icon.dataset.cartListenerAttached === 'true') return;
        icon.dataset.cartListenerAttached = 'true';

        icon.addEventListener('click', function(e) {
            const cart = getCartFromStorage();

            // --- START MODIFICATION (Issue 1 Fix) ---
            // Show mini-cart if it has items, but DO NOT prevent default navigation
            if (cart.items && cart.items.length > 0) {
                // e.preventDefault(); // <<< REMOVED THIS LINE
                showMiniCart();
            }
            // Allow the link to navigate to cart.html regardless
            // --- END MODIFICATION ---
        });
    });
  }


  /**
   * Initialize the "Add to Cart" buttons on shop and product pages
   */
   function initAddToCartButtons() {
    // Use event delegation on the body to handle clicks on potentially dynamically added buttons
    document.body.addEventListener('click', function(e) {
        const button = e.target.closest('.add-to-cart'); // Find closest add-to-cart button clicked
        if (!button) return; // Exit if the click wasn't on an add-to-cart button

        e.preventDefault(); // Prevent default button action if any
        e.stopPropagation();

         // Prevent multiple rapid clicks
        if (button.disabled) return;


        const productContainer = button.closest('.product-card') || button.closest('.product-info') || button.closest('.product-details') || button.closest('.sidebar-widget .product-card'); // Added more specific selectors
        if (!productContainer) {
            console.error('Could not find product container for Add to Cart button.');
            return;
        }

        // Get product data
        let productId, productTitle, productPrice, productImage, productQuantity = 1;
        let variantInfo = ""; // Initialize variant info

        // Determine context (product page vs shop/other)
        const isOnProductPage = document.querySelector('.product-details-section') !== null;
        const isInQuickView = button.closest('.quick-view-modal') !== null;


        if (isOnProductPage || isInQuickView) {
             // On product details page or quick view modal
            const context = isInQuickView ? button.closest('.quick-view-modal') : document;

            // Try getting ID from button first (set by quick view modal logic)
            productId = button.dataset.productId ||
                       context.querySelector('.add-to-cart-btn')?.dataset.productId || // Check dedicated button if exists
                       new URLSearchParams(window.location.search).get('product') ||
                       new URLSearchParams(window.location.search).get('id') ||
                       `product_${Date.now()}`;

            const titleElement = context.querySelector('.product-title') || context.querySelector('h2');
            productTitle = titleElement ? titleElement.textContent.trim() : 'Product';

            const priceElement = context.querySelector('.current-price') || context.querySelector('.price');
            productPrice = priceElement ? priceElement.textContent.trim() : '$0.00';

            const imageElement = context.querySelector('.main-image img') || document.querySelector('.main-product-image');
            productImage = imageElement ? imageElement.src : (productContainer.querySelector('img')?.src || ''); // Fallback

            const quantityInput = context.querySelector('.quantity-input');
            productQuantity = quantityInput ? parseInt(quantityInput.value) || 1 : 1;

            // Extract variant info
            const variantGroups = context.querySelectorAll('.variant-group');
                if (variantGroups && variantGroups.length > 0) {
                    const selectedVariants = [];
                    variantGroups.forEach(group => {
                        const type = group.dataset.variantType;
                        const selectedOption = group.querySelector('.variant-option.active');
                        if (selectedOption) {
                            selectedVariants.push(`${type}: ${selectedOption.textContent.trim()}`);
                        }
                    });
                    variantInfo = selectedVariants.join(", ");
                }

        } else {
             // On shop, blog sidebar, or other pages
            productId = productContainer.dataset.productId || productContainer.dataset.id || `product_${Date.now()}`;
            const titleElement = productContainer.querySelector('.product-title') || productContainer.querySelector('h3 a') || productContainer.querySelector('h3');
            productTitle = titleElement ? (titleElement.textContent || titleElement.innerText).trim() : 'Product';
            const priceElement = productContainer.querySelector('.price');
            productPrice = priceElement ? priceElement.textContent.trim() : '$0.00';
            const imageElement = productContainer.querySelector('.product-image img') || productContainer.querySelector('img');
            productImage = imageElement ? imageElement.src : '';
            const quantityInput = productContainer.querySelector('.quick-quantity');
            productQuantity = quantityInput ? parseInt(quantityInput.value) || 1 : 1;
             variantInfo = ""; // No variants on simple shop cards assumed
        }


        const product = {
            id: productId,
            title: productTitle,
            price: productPrice,
            quantity: productQuantity,
            image: productImage,
            variant: variantInfo // Add variant info
        };

        // Add to cart
        addToCart(product);

        // Visual feedback
        const originalHTML = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i> Added!';
        button.classList.add('added');
         button.disabled = true; // Briefly disable button


        // Reset button after animation
        setTimeout(() => {
             if(button) { // Check if button still exists
                button.innerHTML = originalHTML;
                button.classList.remove('added');
                 button.disabled = false;
             }
        }, 1500);
    });
}



  // ==================
  // Public API
  // ==================

  // Make cart functions globally available
  window.AfriMartCart = {
    addToCart: addToCart,
    removeCartItem: removeCartItem,
    updateCartItemQuantity: updateCartItemQuantity,
    getCartItems: function() {
      return getCartFromStorage().items;
    },
    clearCart: function() {
      saveCartToStorage([]);
      // Update display immediately after clearing
        updateCartDisplay();
        // If on cart page, also reset totals display and discount section
        if(isCartPage) {
             showEmptyCartMessage(); // Ensure empty message shows
             calculateCartTotals(); // Recalculate totals to show $0.00
             // Reset discount section
             if (discountRow) discountRow.style.display = 'none';
             if (discountAmount) discountAmount.textContent = '-$0.00';
             if (discountCodeInput) {
                 discountCodeInput.value = '';
                 discountCodeInput.disabled = false;
             }
             if (applyDiscountBtn) applyDiscountBtn.disabled = false;
             if (discountSuccessMsg) discountSuccessMsg.style.display = 'none';
             if (discountErrorMsg) discountErrorMsg.style.display = 'none';
             // Reset shipping to default
             const standardShipping = document.getElementById('standard');
             if (standardShipping) standardShipping.checked = true;
             calculateCartTotals(); // Recalculate with default shipping

        }
    },
    showMiniCart: showMiniCart,
    // Add direct access to update function for external calls
    updateCartDisplay: updateCartDisplay
  };

  // Export the global addToCart function for backward compatibility
  window.addToCart = addToCart;

  // ==================
  // Initialization
  // ==================

  // Initialize cart display as early as possible
  updateCartDisplay();

  // Initialize cart functionality if on cart page
  initCartPage();

  // Setup add to cart buttons (using event delegation now)
  initAddToCartButtons(); // This function now just sets up the body listener

  // Setup cart icon click handlers
  setupCartIconClickHandlers();

  // Create mini-cart structure on load so it's ready
  createMiniCart();
  updateMiniCartItems(); // Populate it


  // Add a delayed update to ensure all elements are properly loaded
  setTimeout(updateCartDisplay, 500);

});