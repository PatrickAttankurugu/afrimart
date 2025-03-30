/*
* AfriMart Depot - Shopping Cart JavaScript
* Version: 2.0 - Enhanced Shopping Experience
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

  // Cart DOM Elements
  const cartItemsContainer = document.querySelector('.cart-item-list');
  const cartItems = document.querySelectorAll('.cart-item');
  const cartSubtotal = document.getElementById('cart-subtotal');
  const shippingCost = document.getElementById('shipping-cost');
  const taxAmount = document.getElementById('tax-amount');
  const orderTotal = document.getElementById('order-total');
  const discountAmount = document.getElementById('discount-amount');
  const discountRow = document.querySelector('.discount-row');
  const emptyCartSection = document.querySelector('.empty-cart');
  const cartWithItemsSection = document.querySelector('.cart-with-items');
  const cartCountBadges = document.querySelectorAll('.cart-count');
  
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

  // Discount codes (in a real application, these would be validated server-side)
  const validDiscountCodes = {
    'WELCOME10': 10, // 10% off
    'AFRIMART20': 20, // 20% off
    'FREESHIP': 'freeshipping' // Free shipping
  };

  // Mini-cart HTML template
  const miniCartTemplate = `
    <div class="mini-cart">
      <div class="mini-cart-header">
        <h3>Cart</h3>
        <button class="mini-cart-close"><i class="fas fa-times"></i></button>
      </div>
      <div class="mini-cart-items">
        <!-- Items will be dynamically added here -->
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

  // Function to create the mini-cart if it doesn't exist
  function createMiniCart() {
    // Check if mini-cart already exists
    if (!document.querySelector('.mini-cart')) {
      // Create mini-cart element
      const miniCartElement = document.createElement('div');
      miniCartElement.innerHTML = miniCartTemplate;
      document.body.appendChild(miniCartElement.firstElementChild);
      
      // Add event listeners
      const miniCart = document.querySelector('.mini-cart');
      const closeBtn = miniCart.querySelector('.mini-cart-close');
      const checkoutBtn = miniCart.querySelector('.mini-checkout-btn');
      
      closeBtn.addEventListener('click', () => {
        miniCart.classList.remove('active');
      });
      
      checkoutBtn.addEventListener('click', () => {
        checkoutViaWhatsApp();
      });
    }
    
    return document.querySelector('.mini-cart');
  }

  // Function to show notification when item is added to cart
  function showAddedToCartNotification(productName) {
    // Create notification if it doesn't exist
    let notification = document.querySelector('.added-to-cart-notification');
    if (!notification) {
      notification = document.createElement('div');
      notification.className = 'added-to-cart-notification';
      document.body.appendChild(notification);
    }
    
    // Set message
    notification.innerHTML = `
      <i class="fas fa-check-circle"></i> 
      <span>${productName} added to cart</span>
    `;
    
    // Show and then auto-hide
    notification.classList.add('active');
    setTimeout(() => {
      notification.classList.remove('active');
    }, 3000);
  }

  // Function to show mini-cart
  function showMiniCart() {
    const miniCart = createMiniCart();
    
    // Populate mini-cart with items from localStorage
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

  // Function to update items in mini-cart
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
            <img src="${item.image}" alt="${item.title}">
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
        subtotal += parseFloat(item.price.replace('$', '')) * parseInt(item.quantity);
      });
      
      // Update subtotal
      miniSubtotal.textContent = formatCurrency(subtotal);
      
      // Add event listeners to remove buttons
      miniCartItems.querySelectorAll('.mini-cart-item-remove').forEach(button => {
        button.addEventListener('click', function() {
          const productId = this.dataset.productId;
          removeCartItem(productId);
          updateMiniCartItems();
        });
      });
    }
  }

  // Function to create floating cart button for mobile
  function createFloatingCartButton() {
    // Only create on mobile
    if (window.innerWidth <= 768) {
      // Check if it already exists
      if (document.querySelector('.floating-cart-button')) return;
      
      const floatingCart = document.createElement('div');
      floatingCart.className = 'floating-cart-button';
      floatingCart.innerHTML = `
        <span class="floating-count">0</span>
        <i class="fas fa-shopping-cart"></i>
        <span class="floating-text">View Cart</span>
      `;
      
      document.body.appendChild(floatingCart);
      
      // Update count
      const cart = getCartFromStorage();
      floatingCart.querySelector('.floating-count').textContent = cart.items.length;
      
      // Add click event
      floatingCart.addEventListener('click', () => {
        window.location.href = 'cart.html';
      });
    }
  }

  // ==================
  // Storage Functions
  // ==================

  // Function to get cart from localStorage
  function getCartFromStorage() {
    const savedCart = localStorage.getItem('afrimartCart');
    if (savedCart) {
      return JSON.parse(savedCart);
    } else {
      return { items: [], subtotal: 0 };
    }
  }

  // Function to save cart to localStorage
  function saveCartToStorage(cartItems) {
    // Format the cart data
    const cartData = {
      items: cartItems,
      subtotal: calculateSubtotal(cartItems)
    };
    
    // Save to localStorage
    localStorage.setItem('afrimartCart', JSON.stringify(cartData));
    
    // Update cart counts
    updateCartCounts();
  }

  // Function to extract cart items from the DOM
  function extractCartItemsFromDOM() {
    const items = [];
    
    document.querySelectorAll('.cart-item').forEach(item => {
      items.push({
        id: item.dataset.productId,
        title: item.querySelector('.product-title').textContent,
        price: item.querySelector('.price').textContent,
        quantity: item.querySelector('.quantity-input').value,
        image: item.querySelector('.product-image img').src,
        variant: item.querySelector('.product-variant') ? item.querySelector('.product-variant').textContent : ''
      });
    });
    
    return items;
  }

  // Function to update cart counts across the site
  function updateCartCounts() {
    const cart = getCartFromStorage();
    const count = cart.items.length;
    
    // Update all cart count badges
    document.querySelectorAll('.cart-count').forEach(badge => {
      badge.textContent = count;
    });
    
    // Update floating cart count if it exists
    const floatingCount = document.querySelector('.floating-count');
    if (floatingCount) {
      floatingCount.textContent = count;
    }
    
    // Update cart title on cart page
    const cartTitle = document.querySelector('.cart-items h2');
    if (cartTitle) {
      cartTitle.textContent = `Your Cart (${count} items)`;
    }
    
    // Show/hide empty cart message on cart page
    if (isCartPage) {
      if (count === 0) {
        emptyCartSection.style.display = 'block';
        cartWithItemsSection.style.display = 'none';
      } else {
        emptyCartSection.style.display = 'none';
        cartWithItemsSection.style.display = 'block';
      }
    }
  }

  // Function to add item to cart (from product pages or shop)
  function addItemToCart(product) {
    // Get current cart
    const cart = getCartFromStorage();
    
    // Check if product already exists in cart
    const existingProductIndex = cart.items.findIndex(item => item.id === product.id);
    
    if (existingProductIndex !== -1) {
      // Product exists, update quantity
      const newQty = parseInt(cart.items[existingProductIndex].quantity) + parseInt(product.quantity);
      cart.items[existingProductIndex].quantity = newQty;
    } else {
      // Product doesn't exist, add it
      cart.items.push(product);
    }
    
    // Save updated cart
    saveCartToStorage(cart.items);
    
    // Show notification
    showAddedToCartNotification(product.title);
    
    // Show mini-cart
    showMiniCart();
  }

  // Function to remove item from cart
  function removeCartItem(productId) {
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
          calculateTotals();
          
          // Check if cart is now empty
          if (cart.items.length === 0) {
            emptyCartSection.style.display = 'block';
            cartWithItemsSection.style.display = 'none';
          }
        }, 300);
      }
    }
  }

  // ==================
  // Cart Calculations
  // ==================

  // Function to format currency
  function formatCurrency(amount) {
    return '$' + parseFloat(amount).toFixed(2);
  }

  // Function to calculate subtotal from cart items
  function calculateSubtotal(cartItems) {
    let subtotal = 0;
    
    cartItems.forEach(item => {
      const price = parseFloat(item.price.replace('$', ''));
      const quantity = parseInt(item.quantity);
      subtotal += price * quantity;
    });
    
    return subtotal;
  }

  // Function to calculate cart totals (on cart page)
  function calculateTotals() {
    if (!isCartPage) return;
    
    let subtotal = 0;
    let shipping = parseFloat(shippingCost.textContent.replace('$', ''));
    let discount = 0;
    
    // Extract items from DOM and calculate subtotal
    const cartItemsData = extractCartItemsFromDOM();
    subtotal = calculateSubtotal(cartItemsData);
    
    // Save the current state to localStorage
    saveCartToStorage(cartItemsData);
    
    // Check if free shipping is applicable
    if (subtotal >= 50) {
      freeShippingOption.disabled = false;
      document.querySelector('label[for="free"]').classList.remove('disabled');
      
      // If free shipping was previously selected, use it
      if (freeShippingOption.checked) {
        shipping = 0;
      }
    } else {
      freeShippingOption.disabled = true;
      document.querySelector('label[for="free"]').classList.add('disabled');
      
      // If free shipping was selected but is no longer available, switch to standard
      if (freeShippingOption.checked) {
        document.getElementById('standard').checked = true;
        shipping = 5.99;
      }
    }
    
    // Apply discount if applicable
    if (discountRow.style.display !== 'none') {
      const discountText = discountAmount.textContent.replace('$', '').replace('-', '');
      discount = parseFloat(discountText);
    }
    
    // Calculate tax (8% of subtotal after discount)
    const taxRate = 0.08;
    const taxableAmount = subtotal - discount;
    const tax = taxableAmount * taxRate;
    
    // Calculate total
    const total = taxableAmount + tax + shipping;
    
    // Update display
    cartSubtotal.textContent = formatCurrency(subtotal);
    taxAmount.textContent = formatCurrency(tax);
    orderTotal.textContent = formatCurrency(total);
  }

  // Function to update item subtotal when quantity changes
  function updateItemSubtotal(quantityInput) {
    const cartItem = quantityInput.closest('.cart-item');
    const priceElement = cartItem.querySelector('.price');
    const subtotalElement = cartItem.querySelector('.subtotal');
    
    const price = parseFloat(priceElement.textContent.replace('$', ''));
    const quantity = parseInt(quantityInput.value);
    const subtotal = price * quantity;
    
    subtotalElement.textContent = formatCurrency(subtotal);
    
    // Recalculate totals
    calculateTotals();
  }

  // ==================
  // WhatsApp Checkout
  // ==================

  // Function to checkout via WhatsApp
  function checkoutViaWhatsApp() {
    // Get items either from DOM (if on cart page) or localStorage
    let cartItemsData;
    if (isCartPage) {
      cartItemsData = extractCartItemsFromDOM();
    } else {
      const cart = getCartFromStorage();
      cartItemsData = cart.items;
    }
    
    // Exit if cart is empty
    if (cartItemsData.length === 0) {
      alert('Your cart is empty. Please add items before checkout.');
      return;
    }
    
    // Prepare values
    let subtotal = calculateSubtotal(cartItemsData);
    let shipping = isCartPage ? document.getElementById('shipping-cost').textContent : '$5.99';
    let tax = isCartPage ? document.getElementById('tax-amount').textContent : formatCurrency(subtotal * 0.08);
    let total = isCartPage ? document.getElementById('order-total').textContent : 
                formatCurrency(subtotal + parseFloat(shipping.replace('$', '')) + parseFloat(tax.replace('$', '')));
    
    // Build WhatsApp message
    let orderMessage = "📦 *My AfriMart Depot Order:*\n\n";
    
    // Add items section
    orderMessage += "*Items in my cart:*\n";
    cartItemsData.forEach((item, index) => {
      orderMessage += `${index+1}. ${item.title}${item.variant ? ` - ${item.variant}` : ''}\n`;
      orderMessage += `   • Price: ${item.price}\n`;
      orderMessage += `   • Quantity: ${item.quantity}\n`;
      orderMessage += `   • Subtotal: ${formatCurrency(parseFloat(item.price.replace('$', '')) * parseInt(item.quantity))}\n\n`;
    });
    
    // Add summary section
    orderMessage += "*Order Summary:*\n";
    orderMessage += `• Subtotal: ${formatCurrency(subtotal)}\n`;
    
    // Add discount if applicable on cart page
    if (isCartPage && discountRow && discountRow.style.display !== 'none') {
      orderMessage += `• Discount: ${discountAmount.textContent}\n`;
    }
    
    orderMessage += `• Shipping: ${shipping}\n`;
    orderMessage += `• Tax: ${tax}\n`;
    orderMessage += `• Total: ${total}\n\n`;
    
    // Selected shipping method if on cart page
    if (isCartPage) {
      let shippingMethod = "Standard";
      shippingOptions.forEach(option => {
        if (option.checked) {
          shippingMethod = option.id.charAt(0).toUpperCase() + option.id.slice(1);
        }
      });
      orderMessage += `*Shipping Method:* ${shippingMethod}\n\n`;
    }
    
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
  // Event Handlers
  // ==================

  // If on cart page, set up cart functionality
  if (isCartPage) {
    // Load cart from localStorage if cart page is empty
    if (cartItemsContainer && cartItemsContainer.children.length === 0) {
      const cart = getCartFromStorage();
      
      if (cart.items.length > 0) {
        // Populate cart with items from localStorage
        cart.items.forEach(item => {
          const itemElement = document.createElement('div');
          itemElement.className = 'cart-item';
          itemElement.dataset.productId = item.id;
          itemElement.innerHTML = `
            <div class="product-col">
              <div class="product-info">
                <div class="product-image">
                  <img src="${item.image}" alt="${item.title}">
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
                <input type="number" class="quantity-input" value="${item.quantity}" min="1" max="10">
                <button class="quantity-btn plus">+</button>
              </div>
            </div>
            <div class="subtotal-col">
              <span class="subtotal">${formatCurrency(parseFloat(item.price.replace('$', '')) * parseInt(item.quantity))}</span>
            </div>
            <div class="remove-col">
              <button class="remove-item">
                <i class="fas fa-times"></i>
              </button>
            </div>
          `;
          
          cartItemsContainer.appendChild(itemElement);
        });
        
        // Add event listeners to the new items
        setupCartItemEvents();
        
        // Calculate totals
        calculateTotals();
        
        // Update cart UI
        emptyCartSection.style.display = 'none';
        cartWithItemsSection.style.display = 'block';
      } else {
        // Show empty cart message
        emptyCartSection.style.display = 'block';
        cartWithItemsSection.style.display = 'none';
      }
    }
    
    // Setup event listeners for cart item interactions
    function setupCartItemEvents() {
      // Quantity selector functionality
      document.querySelectorAll('.cart-item').forEach(item => {
        const minusBtn = item.querySelector('.minus');
        const plusBtn = item.querySelector('.plus');
        const quantityInput = item.querySelector('.quantity-input');
        
        if (minusBtn && plusBtn && quantityInput) {
          // Decrease quantity
          minusBtn.addEventListener('click', function() {
            const currentValue = parseInt(quantityInput.value);
            if (currentValue > 1) {
              quantityInput.value = currentValue - 1;
              updateItemSubtotal(quantityInput);
            }
          });
          
          // Increase quantity
          plusBtn.addEventListener('click', function() {
            const currentValue = parseInt(quantityInput.value);
            const maxValue = parseInt(quantityInput.getAttribute('max') || 10);
            if (currentValue < maxValue) {
              quantityInput.value = currentValue + 1;
              updateItemSubtotal(quantityInput);
            }
          });
          
          // Manual input
          quantityInput.addEventListener('change', function() {
            let value = parseInt(this.value);
            const minValue = parseInt(this.getAttribute('min') || 1);
            const maxValue = parseInt(this.getAttribute('max') || 10);
            
            // Ensure valid value
            if (isNaN(value) || value < minValue) {
              value = minValue;
            } else if (value > maxValue) {
              value = maxValue;
            }
            
            this.value = value;
            updateItemSubtotal(this);
          });
        }
      });
      
      // Remove item functionality
      document.querySelectorAll('.remove-item').forEach(button => {
        button.addEventListener('click', function() {
          const cartItem = this.closest('.cart-item');
          const productId = cartItem.dataset.productId;
          
          // Remove from cart
          removeCartItem(productId);
        });
      });
    }
    
    // Run setup on existing cart items
    setupCartItemEvents();
    
    // Shipping option change
    shippingOptions.forEach(option => {
      option.addEventListener('change', function() {
        const value = this.value;
        
        switch (value) {
          case 'standard':
            shippingCost.textContent = '$5.99';
            break;
          case 'express':
            shippingCost.textContent = '$12.99';
            break;
          case 'free':
            shippingCost.textContent = '$0.00';
            break;
        }
        
        // Recalculate totals
        calculateTotals();
      });
    });
    
    // Apply discount code
    if (applyDiscountBtn) {
      applyDiscountBtn.addEventListener('click', function() {
        const code = discountCodeInput.value.trim().toUpperCase();
        
        // Hide previous messages
        discountSuccessMsg.style.display = 'none';
        discountErrorMsg.style.display = 'none';
        
        if (code === '') {
          discountErrorMsg.textContent = 'Please enter a discount code.';
          discountErrorMsg.style.display = 'block';
          return;
        }
        
        if (validDiscountCodes.hasOwnProperty(code)) {
          const discount = validDiscountCodes[code];
          
          if (discount === 'freeshipping') {
            // Apply free shipping
            document.getElementById('free').checked = true;
            document.getElementById('free').disabled = false;
            document.querySelector('label[for="free"]').classList.remove('disabled');
            shippingCost.textContent = '$0.00';
            
            // Show success message
            discountSuccessMsg.textContent = 'Free shipping applied successfully!';
            discountSuccessMsg.style.display = 'block';
          } else {
            // Apply percentage discount
            const subtotal = parseFloat(cartSubtotal.textContent.replace('$', ''));
            const discountValue = subtotal * (discount / 100);
            
            // Show discount row
            discountRow.style.display = 'flex';
            discountAmount.textContent = '-' + formatCurrency(discountValue);
            
            // Show success message
            discountSuccessMsg.textContent = `${discount}% discount applied successfully!`;
            discountSuccessMsg.style.display = 'block';
          }
          
          // Disable input and button after successful application
          discountCodeInput.disabled = true;
          applyDiscountBtn.disabled = true;
          
          // Recalculate totals
          calculateTotals();
        } else {
          // Invalid code
          discountErrorMsg.textContent = 'Invalid discount code. Please try again.';
          discountErrorMsg.style.display = 'block';
        }
      });
    }
    
    // Update cart button
    if (updateCartBtn) {
      updateCartBtn.addEventListener('click', function() {
        // Animation to indicate update
        this.innerHTML = '<i class="fas fa-check"></i> Cart Updated';
        this.classList.add('btn-success');
        
        // Extract cart items and save to storage
        const cartItemsData = extractCartItemsFromDOM();
        saveCartToStorage(cartItemsData);
        
        // Recalculate totals
        calculateTotals();
        
        setTimeout(() => {
          this.innerHTML = 'Update Cart';
          this.classList.remove('btn-success');
        }, 2000);
      });
    }
    
    // Clear cart button
    if (clearCartBtn) {
      clearCartBtn.addEventListener('click', function() {
        if (confirm('Are you sure you want to clear your cart?')) {
          // Clear cart in localStorage
          saveCartToStorage([]);
          
          // Add fade-out animation to all items
          document.querySelectorAll('.cart-item').forEach(item => {
            item.style.transition = 'opacity 0.3s ease';
            item.style.opacity = '0';
          });
          
          // Remove after animation
          setTimeout(() => {
            document.querySelector('.cart-with-items').style.display = 'none';
            document.querySelector('.empty-cart').style.display = 'block';
            document.querySelectorAll('.cart-count').forEach(badge => {
              badge.textContent = '0';
            });
          }, 300);
        }
      });
    }
    
    // Checkout button
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', function(e) {
        e.preventDefault();
        checkoutViaWhatsApp();
      });
    }
  }

  // Add to Cart for related products (on cart page)
  const addToCartButtons = document.querySelectorAll('.related-products-slider .add-to-cart');
  
  addToCartButtons.forEach(button => {
    button.addEventListener('click', function() {
      const productCard = this.closest('.product-card');
      const productTitle = productCard.querySelector('.product-title a').textContent;
      const productImage = productCard.querySelector('.product-image img').src;
      const productPrice = productCard.querySelector('.price').textContent;
      const productId = productCard.dataset.productId || 'related_' + Date.now();
      
      // Create product object
      const product = {
        id: productId,
        title: productTitle,
        price: productPrice,
        quantity: 1,
        image: productImage
      };
      
      // Add to cart
      addItemToCart(product);
      
      // Animation
      this.innerHTML = '<i class="fas fa-check"></i> Added!';
      this.style.backgroundColor = '#28a745';
      
      // Reset button after animation
      setTimeout(() => {
        this.innerHTML = 'Add to Cart';
        this.style.backgroundColor = '';
      }, 1500);
    });
  });

  // Add to Cart from other pages (shop.js or product-details.js would call this)
  window.addToCart = function(product) {
    addItemToCart(product);
  };

  // Create floating cart button on mobile if not on cart page
  if (!isCartPage && window.innerWidth <= 768) {
    createFloatingCartButton();
  }

  // Update cart counts on page load
  updateCartCounts();
});