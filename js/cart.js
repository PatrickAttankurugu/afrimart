/*
* AfriMart Depot - Shopping Cart JavaScript
* Version: 3.3 - Fixed cart icon link and quantity increment logic
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
        return JSON.parse(savedCart);
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
    // Calculate subtotal
    const subtotal = calculateSubtotal(cartItems);

    // Format the cart data
    const cartData = {
      items: cartItems,
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

    // Update mini-cart if it's open
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
      const price = parseFloat(item.price.replace(/[^\d.-]/g, ''));
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

    // Check selected shipping option
    shippingOptions.forEach(option => {
      if (option.checked) {
        switch (option.id) {
          case 'standard':
            shipping = 5.99;
            break;
          case 'express':
            shipping = 12.99;
            break;
          case 'free':
            shipping = 0;
            break;
        }
      }
    });

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
                shipping = 5.99;
            }
        }
    }


    // Check for discount
    let discount = 0;
    if (discountRow && discountRow.style.display !== 'none' && discountAmount) {
      const discountText = discountAmount.textContent.replace(/[^\d.-]/g, '');
      discount = parseFloat(discountText);
      if (isNaN(discount)) discount = 0; // Ensure discount is a number
    }

    // Calculate tax (8% of subtotal after discount)
    const taxRate = 0.08;
    const taxableAmount = Math.max(0, subtotal - discount); // Ensure taxable amount isn't negative
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

    if (!isCartPage) return items;

    document.querySelectorAll('.cart-item').forEach(item => {
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
    cart.items.forEach(item => {
      totalItems += parseInt(item.quantity || 1);
    });

    // Update all cart count badges
    document.querySelectorAll('.cart-count').forEach(badge => {
      badge.textContent = totalItems.toString();
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
      if (cart.items.length === 0) {
        showEmptyCartMessage();
      } else {
        hideEmptyCartMessage();
      }
    }

    // Update mini-cart if it's visible
    if (document.querySelector('.mini-cart.active')) {
      updateMiniCartItems();
    }
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
    }

    // Set notification content
    notification.innerHTML = `
      <i class="fas fa-check-circle"></i>
      <span>${message}</span>
    `;

    // Show notification
    notification.classList.add('active');

    // Hide after 3 seconds
    setTimeout(() => {
      notification.classList.remove('active');
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
    }

    // Update mini-cart contents
    updateMiniCartItems();

    // Show mini-cart
    miniCart.classList.add('active');

    // Auto-hide after delay
    setTimeout(() => {
      if (miniCart.classList.contains('active')) {
        miniCart.classList.remove('active');
      }
    }, 5000);
  }

  /**
   * Create mini-cart element
   * @returns {HTMLElement} Mini-cart element
   */
  function createMiniCart() {
    // Mini-cart HTML template
    const miniCartHTML = `
      <div class="mini-cart">
        <div class="mini-cart-header">
          <h3>Cart</h3>
          <button class="mini-cart-close"><i class="fas fa-times"></i></button>
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

    // Create element
    const miniCartElement = document.createElement('div');
    miniCartElement.innerHTML = miniCartHTML;
    document.body.appendChild(miniCartElement.firstElementChild);

    // Get mini-cart
    const miniCart = document.querySelector('.mini-cart');

    // Add event listeners
    const closeBtn = miniCart.querySelector('.mini-cart-close');
    const checkoutBtn = miniCart.querySelector('.mini-checkout-btn');

    closeBtn.addEventListener('click', () => {
      miniCart.classList.remove('active');
    });

    checkoutBtn.addEventListener('click', () => {
      checkoutViaWhatsApp();
    });

    return miniCart;
  }

  /**
   * Update items in mini-cart
   */
  function updateMiniCartItems() {
    const miniCart = document.querySelector('.mini-cart');
    if (!miniCart) return;

    const miniCartItems = miniCart.querySelector('.mini-cart-items');
    const miniSubtotal = miniCart.querySelector('.mini-subtotal-value');

    // Get cart from localStorage
    const cart = getCartFromStorage();

    // Clear existing items
    miniCartItems.innerHTML = '';

    // Add items
    if (cart.items.length === 0) {
      miniCartItems.innerHTML = '<p class="mini-cart-empty">Your cart is empty</p>';
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
          <button class="mini-cart-item-remove" data-product-id="${item.id}">
            <i class="fas fa-times"></i>
          </button>
        `;

        miniCartItems.appendChild(itemElement);

        // Calculate subtotal
        const price = parseFloat(item.price.replace(/[^\d.-]/g, ''));
        subtotal += price * parseInt(item.quantity);
      });

      // Update subtotal
      miniSubtotal.textContent = formatCurrency(subtotal);

      // Add event listeners to remove buttons
      miniCartItems.querySelectorAll('.mini-cart-item-remove').forEach(button => {
        button.addEventListener('click', function(e) {
          e.stopPropagation();
          const productId = this.dataset.productId;
          removeCartItem(productId);
        });
      });
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
   * Checkout via WhatsApp
   */
  function checkoutViaWhatsApp() {
    // Get cart data
    let cartItemsData;

    if (isCartPage) {
      cartItemsData = extractCartItemsFromDOM();
    } else {
      const cart = getCartFromStorage();
      cartItemsData = cart.items;
    }

    // Exit if cart is empty
    if (!cartItemsData || !cartItemsData.length) {
      alert('Your cart is empty. Please add items before checkout.');
      return;
    }

    // Build WhatsApp message
    let orderMessage = "📦 *My AfriMart Depot Order:*\n\n";

    // Add items section
    orderMessage += "*Items in my cart:*\n";
    cartItemsData.forEach((item, index) => {
      orderMessage += `${index+1}. ${item.title}${item.variant ? ` - ${item.variant}` : ''}\n`;
      orderMessage += `   • Price: ${item.price}\n`;
      orderMessage += `   • Quantity: ${item.quantity}\n`;

      const price = parseFloat(item.price.replace(/[^\d.-]/g, ''));
      const quantity = parseInt(item.quantity);
      const itemSubtotal = price * quantity;

      orderMessage += `   • Subtotal: ${formatCurrency(itemSubtotal)}\n\n`;
    });

    // Calculate summary amounts
    const subtotal = calculateSubtotal(cartItemsData);
    let shipping = 5.99; // Default
    let discount = 0;

    // Get selected shipping if on cart page
    if (isCartPage && shippingOptions) {
      shippingOptions.forEach(option => {
        if (option.checked) {
          switch (option.id) {
            case 'express':
              shipping = 12.99;
              break;
            case 'free':
              shipping = 0;
              break;
          }
        }
      });
    }

    // Get discount if applied on cart page
    if (isCartPage && discountRow && discountRow.style.display !== 'none' && discountAmount) {
        const discountText = discountAmount.textContent.replace(/[^\d.-]/g, '');
        discount = parseFloat(discountText);
        if (isNaN(discount)) discount = 0; // Ensure discount is a number
    }


    // Calculate tax and total
    const taxRate = 0.08;
    const taxableAmount = Math.max(0, subtotal - discount); // Ensure taxable amount isn't negative
    const tax = taxableAmount * taxRate;
    const total = taxableAmount + tax + shipping;

    // Add summary section
    orderMessage += "*Order Summary:*\n";
    orderMessage += `• Subtotal: ${formatCurrency(subtotal)}\n`;

    if (discount > 0) {
      orderMessage += `• Discount: -${formatCurrency(discount)}\n`;
    }

    orderMessage += `• Shipping: ${formatCurrency(shipping)}\n`;
    orderMessage += `• Tax: ${formatCurrency(tax)}\n`;
    orderMessage += `• Total: ${formatCurrency(total)}\n\n`;

    // Add shipping method
    let shippingMethod = "Standard";
    if (isCartPage && shippingOptions) {
      shippingOptions.forEach(option => {
        if (option.checked) {
          shippingMethod = option.id.charAt(0).toUpperCase() + option.id.slice(1);
        }
      });
    }
    orderMessage += `*Shipping Method:* ${shippingMethod}\n\n`;

    // Add customer info template
    orderMessage += "👤 *My Information:*\n";
    orderMessage += "Name: \n";
    orderMessage += "Address: \n";
    orderMessage += "Phone: \n";
    orderMessage += "Email: \n\n";

    orderMessage += "✅ Please confirm my order. Thank you!";

    // Encode message for WhatsApp URL
    const encodedMessage = encodeURIComponent(orderMessage);

    // Open WhatsApp with pre-filled message
    window.open(`https://wa.me/18048060130?text=${encodedMessage}`, '_blank');
  }

  // ==================
  // Event Handlers and Initialization
  // ==================

  /**
   * Initialize cart on cart page
   */
  function initCartPage() {
    if (!isCartPage) return;

    // Populate cart page with items from localStorage if empty
    if (cartItemsContainer && cartItemsContainer.children.length === 0) {
      const cart = getCartFromStorage();

      if (cart.items.length > 0) {
        // Add each item to the cart
        cart.items.forEach(item => {
          const itemElement = document.createElement('div');
          itemElement.className = 'cart-item';
          itemElement.dataset.productId = item.id;
          itemElement.innerHTML = `
            <div class="product-col">
              <div class="product-info">
                <div class="product-image">
                  <img src="${item.image || 'images/placeholder.jpg'}" alt="${item.title}">
                </div>
                <div class="product-details">
                  <h3 class="product-title">${item.title}</h3>
                  <p class="product-variant">${item.variant || ''}</p>
                </div>
              </div>
            </div>
            <div class="price-col">
              <span class="price">${item.price}</span>
            </div>
            <div class="quantity-col">
              <div class="quantity-selector">
                <button class="quantity-btn minus">-</button>
                <input type="number" class="quantity-input" value="${item.quantity}" min="1" max="99">
                <button class="quantity-btn plus">+</button>
              </div>
            </div>
            <div class="subtotal-col">
              <span class="subtotal">${formatCurrency(parseFloat(item.price.replace(/[^\d.-]/g, '')) * parseInt(item.quantity))}</span>
            </div>
            <div class="remove-col">
              <button class="remove-item">
                <i class="fas fa-times"></i>
              </button>
            </div>
          `;

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
        showEmptyCartMessage();
    }


    // Setup shipping option change handlers
    if (shippingOptions) {
      shippingOptions.forEach(option => {
        option.addEventListener('change', function() {
          let shippingValue = 5.99; // Default

          switch (this.id) {
            case 'standard':
              shippingValue = 5.99;
              break;
            case 'express':
              shippingValue = 12.99;
              break;
            case 'free':
              shippingValue = 0;
              break;
          }

          if (shippingCost) {
            shippingCost.textContent = formatCurrency(shippingValue);
          }

          // Recalculate totals
          calculateCartTotals();
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

        if (!code) {
          if (discountErrorMsg) {
            discountErrorMsg.textContent = 'Please enter a discount code.';
            discountErrorMsg.style.display = 'block';
          }
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

              if (shippingCost) {
                shippingCost.textContent = '$0.00';
              }
            }

            // Show success message
            if (discountSuccessMsg) {
              discountSuccessMsg.textContent = 'Free shipping applied successfully!';
              discountSuccessMsg.style.display = 'block';
            }

             // Ensure discount row is hidden for free shipping
             if (discountRow && discountAmount) {
                discountRow.style.display = 'none';
                discountAmount.textContent = '-$0.00';
            }

          } else {
            // Apply percentage discount
            const subtotalValue = parseFloat(cartSubtotal.textContent.replace(/[^\d.-]/g, ''));
            const discountValue = subtotalValue * (discount / 100);

            // Show discount row
            if (discountRow && discountAmount) {
              discountRow.style.display = 'flex';
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
                calculateCartTotals(); // Recalculate without discount
            }
        }
      });
    }

    // Setup update cart button
    if (updateCartBtn) {
      updateCartBtn.addEventListener('click', function() {
        // Add animation to indicate update
        this.innerHTML = '<i class="fas fa-check"></i> Cart Updated';
        this.classList.add('btn-success');

        // Update cart data
        const cartItemsData = extractCartItemsFromDOM();
        saveCartToStorage(cartItemsData);

        // Recalculate totals
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
          saveCartToStorage([]);

          // Fade out all items
          document.querySelectorAll('.cart-item').forEach(item => {
            item.style.transition = 'opacity 0.3s ease';
            item.style.opacity = '0';
          });

          // Update UI after animation
          setTimeout(() => {
            // Remove all items
            if (cartItemsContainer) {
              cartItemsContainer.innerHTML = '';
            }

            // Show empty cart message
            showEmptyCartMessage();

            // Reset cart counts
            document.querySelectorAll('.cart-count').forEach(badge => {
              badge.textContent = '0';
            });

             // Reset totals
             calculateCartTotals();

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


          }, 300);
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
   * Setup event handlers for cart items
   */
  function setupCartItemEvents() {
    if (!isCartPage) return;

    // Use event delegation on the container for better performance
    if (cartItemsContainer) {
        cartItemsContainer.addEventListener('click', function(e) {
            const target = e.target;
            const cartItem = target.closest('.cart-item');
            if (!cartItem) return;

            const productId = cartItem.dataset.productId;
            const quantityInput = cartItem.querySelector('.quantity-input');

            // Handle remove button click
            if (target.closest('.remove-item')) {
                if (productId) {
                    removeCartItem(productId);
                }
                return; // Stop further processing for remove click
            }

            // Handle quantity minus button click
            if (target.closest('.quantity-btn.minus')) {
                if (quantityInput) {
                    const currentValue = parseInt(quantityInput.value);
                    if (currentValue > 1) {
                        quantityInput.value = currentValue - 1;
                        updateItemSubtotal(quantityInput);
                    }
                }
                return; // Stop further processing
            }

            // Handle quantity plus button click
            if (target.closest('.quantity-btn.plus')) {
                if (quantityInput) {
                    const currentValue = parseInt(quantityInput.value);
                    const maxValue = parseInt(quantityInput.getAttribute('max') || 99);
                    if (currentValue < maxValue) {
                        quantityInput.value = currentValue + 1;
                        updateItemSubtotal(quantityInput);
                    }
                }
                return; // Stop further processing
            }
        });

        // Handle direct input change on quantity fields
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
                updateItemSubtotal(quantityInput);
            }
        });
    }
}


  /**
   * Setup cart icon click handlers
   */
  function setupCartIconClickHandlers() {
    const cartIcons = document.querySelectorAll('.cart-icon a');

    cartIcons.forEach(icon => {
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
   * Note: This function might be redundant if shop.js also initializes similar buttons.
   * Ensure only one initialization happens or they are compatible.
   */
  function initAddToCartButtons() {
    const addToCartButtons = document.querySelectorAll('.add-to-cart');

    addToCartButtons.forEach(button => {
      // Check if listener already attached to avoid duplicates
      if (!button.hasAttribute('data-cart-listener')) {
        button.setAttribute('data-cart-listener', 'true'); // Mark as attached

        button.addEventListener('click', function() {
          const productContainer = this.closest('.product-card') || this.closest('.product-info') || this.closest('.product-details'); // Added .product-details for modal
          if (!productContainer) {
              console.error('Could not find product container for Add to Cart button.');
              return;
          }

          // Get product data
          let productId, productTitle, productPrice, productImage, productQuantity = 1;

          // Determine if on product page or shop/other
          const isOnProductPage = document.querySelector('.product-details-section') !== null;

          if (isOnProductPage) {
            productId = new URLSearchParams(window.location.search).get('product') || new URLSearchParams(window.location.search).get('id') || `product_${Date.now()}`;
            const titleElement = document.querySelector('.product-title') || document.querySelector('h1');
            productTitle = titleElement ? titleElement.textContent.trim() : 'Product';
            const priceElement = document.querySelector('.current-price') || document.querySelector('.price');
            productPrice = priceElement ? priceElement.textContent.trim() : '$0.00';
            const imageElement = document.querySelector('.main-product-image') || document.querySelector('.main-image img'); // Adjusted selector for modal/product page
            productImage = imageElement ? imageElement.src : '';
            const quantityInput = document.querySelector('.quantity-input');
            productQuantity = quantityInput ? parseInt(quantityInput.value) || 1 : 1;
          } else {
            // On shop or other pages (like blog sidebars)
            productId = productContainer.dataset.productId || productContainer.dataset.id || `product_${Date.now()}`;
            const titleElement = productContainer.querySelector('.product-title') || productContainer.querySelector('h3 a') || productContainer.querySelector('h3');
            productTitle = titleElement ? (titleElement.textContent || titleElement.innerText).trim() : 'Product';
            const priceElement = productContainer.querySelector('.price');
            productPrice = priceElement ? priceElement.textContent.trim() : '$0.00';
            const imageElement = productContainer.querySelector('.product-image img') || productContainer.querySelector('img');
            productImage = imageElement ? imageElement.src : '';
            const quantityInput = productContainer.querySelector('.quick-quantity'); // Check for quick add quantity
            productQuantity = quantityInput ? parseInt(quantityInput.value) || 1 : 1;
          }


          const product = {
            id: productId,
            title: productTitle,
            price: productPrice,
            quantity: productQuantity,
            image: productImage
          };

          // Add to cart using the global function
          addToCart(product);

          // Visual feedback
          const originalText = this.innerHTML;
          this.innerHTML = '<i class="fas fa-check"></i> Added!';
          this.classList.add('added');

          // Reset button after animation
          setTimeout(() => {
            this.innerHTML = originalText;
            this.classList.remove('added');
          }, 1500);
        });
      }
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
      updateCartDisplay();
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

  // Initialize cart functionality
  initCartPage();

  // Setup add to cart buttons (ensure this doesn't conflict with shop.js)
  // If shop.js also calls initAddToCartButtons, potentially remove this call or make the function safe to call multiple times.
  initAddToCartButtons();

  // Setup cart icon click handlers
  setupCartIconClickHandlers();

  // Add a delayed update to ensure all elements are properly loaded
  setTimeout(updateCartDisplay, 500);
});