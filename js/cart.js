/*
* AfriMart Depot - Shopping Cart JavaScript
* Version: 3.5 - Added S3 integration
*/

document.addEventListener('DOMContentLoaded', function() {
  'use strict';

  // API Base URL for Netlify functions
  const API_BASE_URL = '/.netlify/functions/s3-handler';

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
  const miniCheckoutBtn = document.querySelector('.mini-checkout-btn');

  // Page detection
  const isCartPage = document.querySelector('.cart-section') !== null;
  const isShopPage = document.querySelector('.shop-section') !== null;
  const isProductPage = document.querySelector('.product-details-section') !== null;

  // Cart count elements
  const cartCountElements = document.querySelectorAll('.cart-count');

  // Discount codes
  const validDiscountCodes = {
    'WELCOME10': 10,
    'AFRIMART20': 20,
    'FREESHIP': 'freeshipping'
  };

  // ==================
  // S3 Storage Functions
  // ==================

  async function getCartFromS3() {
    try {
      const response = await fetch(`${API_BASE_URL}/get-orders`);
      if (!response.ok) throw new Error('Failed to get from S3');
      
      const data = await response.json();
      return Array.isArray(data) ? data : { items: [] };
    } catch (error) {
      console.error('Error getting from S3:', error);
      // Fallback to localStorage in case of error
      const savedCart = localStorage.getItem('afrimartCart');
      if (savedCart) {
        try {
          return JSON.parse(savedCart);
        } catch (e) {
          console.error('Error parsing cart data from localStorage', e);
        }
      }
      return { items: [] };
    }
  }

  async function saveCartToS3(cartItems) {
    try {
      const response = await fetch(`${API_BASE_URL}/save-orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(cartItems)
      });
      
      if (!response.ok) throw new Error('Failed to save to S3');
      
      // Also save to localStorage as backup
      localStorage.setItem('afrimartCart', JSON.stringify(cartItems));
      return true;
    } catch (error) {
      console.error('Error saving to S3:', error);
      // Save to localStorage as fallback
      localStorage.setItem('afrimartCart', JSON.stringify(cartItems));
      return false;
    }
  }

  // ==================
  // Cart Core Functions
  // ==================

  async function getCartFromStorage() {
    const cart = await getCartFromS3();
    if (!Array.isArray(cart.items)) {
      cart.items = [];
    }
    return cart;
  }

  async function saveCartToStorage(cartItems) {
    const itemsToSave = Array.isArray(cartItems) ? cartItems : [];
    const subtotal = calculateSubtotal(itemsToSave);

    const cartData = {
      items: itemsToSave,
      subtotal: subtotal,
      lastUpdated: new Date().toISOString()
    };

    await saveCartToS3(cartData);
    updateCartDisplay();
  }

  async function addToCart(product) {
    if (!product || !product.id || !product.title || !product.price) {
      console.error('Invalid product object', product);
      return false;
    }

    if (!product.quantity || isNaN(parseInt(product.quantity))) {
      product.quantity = 1;
    } else {
      product.quantity = parseInt(product.quantity);
    }

    const cart = await getCartFromStorage();
    const existingProductIndex = cart.items.findIndex(item => item.id === product.id);

    if (existingProductIndex !== -1) {
      if (product.quantity > 1) {
          const newQty = parseInt(cart.items[existingProductIndex].quantity) + product.quantity;
          cart.items[existingProductIndex].quantity = Math.min(newQty, 99);
          await saveCartToStorage(cart.items);
          showAddedToCartNotification(`${product.title} quantity updated`);
          showMiniCart();
          return true;
      } else {
          showAddedToCartNotification(`${product.title} is already in your cart`);
          showMiniCart();
          return false;
      }
    } else {
      cart.items.push({
        id: product.id,
        title: product.title,
        price: product.price,
        quantity: Math.min(product.quantity, 99),
        image: product.image || '',
        variant: product.variant || ''
      });
      await saveCartToStorage(cart.items);
      showAddedToCartNotification(`${product.title} added to cart`);
      showMiniCart();
      return true;
    }
  }

  async function removeCartItem(productId) {
    if (!productId) return false;

    const cart = await getCartFromStorage();
    const updatedItems = cart.items.filter(item => item.id !== productId);
    await saveCartToStorage(updatedItems);

    if (isCartPage) {
      const itemToRemove = document.querySelector(`.cart-item[data-product-id="${productId}"]`);
      if (itemToRemove) {
        itemToRemove.style.transition = 'opacity 0.3s ease';
        itemToRemove.style.opacity = '0';

        setTimeout(() => {
          itemToRemove.remove();
          calculateCartTotals();
          if (updatedItems.length === 0) {
            showEmptyCartMessage();
          }
        }, 300);
      }
    }

    updateMiniCartItems();
    return true;
  }

  async function updateCartItemQuantity(productId, quantity) {
    if (!productId || isNaN(parseInt(quantity))) return false;

    quantity = Math.max(1, Math.min(99, parseInt(quantity)));
    const cart = await getCartFromStorage();
    const existingProductIndex = cart.items.findIndex(item => item.id === productId);

    if (existingProductIndex !== -1) {
      cart.items[existingProductIndex].quantity = quantity;
      await saveCartToStorage(cart.items);
      return true;
    }

    return false;
  }

  function calculateSubtotal(cartItems) {
    let subtotal = 0;
    if (!cartItems || !Array.isArray(cartItems)) return subtotal;

    cartItems.forEach(item => {
      const price = parseFloat(item.price?.replace(/[^\d.-]/g, '')) || 0;
      const quantity = parseInt(item.quantity || 1);

      if (!isNaN(price) && !isNaN(quantity)) {
        subtotal += price * quantity;
      }
    });

    return subtotal;
  }

  function formatCurrency(amount) {
    const numAmount = Number(amount);
    if (isNaN(numAmount)) {
        return '$0.00';
    }
    return '$' + numAmount.toFixed(2);
  }

  async function calculateCartTotals() {
    if (!isCartPage) return;

    const cartItemsData = extractCartItemsFromDOM();
    let subtotal = calculateSubtotal(cartItemsData);
    let shipping = 5.99;
    const selectedShippingInput = document.querySelector('input[name="shipping"]:checked');

    if (freeShippingOption) {
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
            if (freeShippingOption.checked) {
                const standardOption = document.getElementById('standard');
                if (standardOption) standardOption.checked = true;
            }
        }
    }

    if (selectedShippingInput) {
        switch (selectedShippingInput.id) {
            case 'standard':
                shipping = 5.99;
                break;
            case 'express':
                shipping = 12.99;
                break;
            case 'free':
                shipping = (subtotal >= 50) ? 0 : 5.99;
                if (shipping === 5.99 && document.getElementById('free').checked) {
                    const standardOption = document.getElementById('standard');
                    if (standardOption) standardOption.checked = true;
                }
                break;
            default:
                shipping = 5.99;
        }
    }

    let discount = 0;
    if (discountRow && discountRow.style.display !== 'none' && discountAmount) {
      const discountText = discountAmount.textContent.replace(/[^\d.-]/g, '');
      discount = parseFloat(discountText) || 0;
      if (discount > 0) discount = -discount;
    }

    const taxRate = 0.08;
    const taxableAmount = Math.max(0, subtotal + discount);
    const tax = taxableAmount * taxRate;
    const total = taxableAmount + tax + shipping;

    if (cartSubtotal) cartSubtotal.textContent = formatCurrency(subtotal);
    if (shippingCost) shippingCost.textContent = formatCurrency(shipping);
    if (taxAmount) taxAmount.textContent = formatCurrency(tax);
    if (orderTotal) orderTotal.textContent = formatCurrency(total);
  }

  function extractCartItemsFromDOM() {
    const items = [];
    if (!isCartPage || !cartItemsContainer) return items;

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

  async function updateCartDisplay() {
    const cart = await getCartFromStorage();
    let totalItems = 0;
    if (Array.isArray(cart.items)) {
        cart.items.forEach(item => {
            totalItems += parseInt(item.quantity || 1);
        });
    }

    document.querySelectorAll('.cart-count').forEach(badge => {
        if (badge) {
             badge.textContent = totalItems.toString();
        }
    });

    if (isCartPage && itemsCountDisplay) {
      itemsCountDisplay.textContent = totalItems;
    }

    const floatingCount = document.querySelector('.floating-count');
    if (floatingCount) {
      floatingCount.textContent = totalItems;
    }

    if (isCartPage) {
      const itemCount = Array.isArray(cart.items) ? cart.items.length : 0;
      if (itemCount === 0) {
          showEmptyCartMessage();
      } else {
          hideEmptyCartMessage();
      }
    }

    updateMiniCartItems();
  }

  function showAddedToCartNotification(message) {
    let notification = document.querySelector('.cart-notification');

    if (!notification) {
      notification = document.createElement('div');
      notification.className = 'cart-notification';
      document.body.appendChild(notification);

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

    notification.innerHTML = `
      <i class="fas fa-check-circle" style="font-size: 18px;"></i>
      <span>${message}</span>
    `;

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            notification.classList.add('active');
            notification.style.transform = 'translateY(0)';
            notification.style.opacity = '1';
        });
    });

    setTimeout(() => {
      notification.classList.remove('active');
      notification.style.transform = 'translateY(100px)';
      notification.style.opacity = '0';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  function showMiniCart() {
    let miniCart = document.querySelector('.mini-cart');

    if (!miniCart) {
      miniCart = createMiniCart();
       if (!miniCart) return;
    }

    updateMiniCartItems();
    miniCart.classList.add('active');
  }

  function createMiniCart() {
     if (!document.body) {
        console.error("Cannot create mini-cart: document body not ready.");
        return null;
    }

    if (document.querySelector('.mini-cart')) {
        return document.querySelector('.mini-cart');
    }

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

    let tempContainer = document.createElement('div');
    tempContainer.innerHTML = miniCartHTML;
    const miniCartElement = tempContainer.firstElementChild;

    document.body.appendChild(miniCartElement);
    const miniCart = document.querySelector('.mini-cart');

    const closeBtn = miniCart.querySelector('.mini-cart-close');
    const checkoutBtn = miniCart.querySelector('.mini-checkout-btn');

    closeBtn.addEventListener('click', () => {
      miniCart.classList.remove('active');
    });

     if (checkoutBtn) {
         checkoutBtn.addEventListener('click', () => {
             checkoutViaWhatsApp();
         });
     }

    document.addEventListener('click', function(event) {
        const isClickInsideCart = miniCart.contains(event.target);
        const cartIconLink = document.querySelector('.cart-icon a');
        const isClickOnCartIcon = cartIconLink ? cartIconLink.contains(event.target) : false;

        if (!isClickInsideCart && !isClickOnCartIcon && miniCart.classList.contains('active')) {
            miniCart.classList.remove('active');
        }
    });

    return miniCart;
  }

  async function updateMiniCartItems() {
    const miniCart = document.querySelector('.mini-cart');
    if (!miniCart) return;

    const miniCartItemsContainer = miniCart.querySelector('.mini-cart-items');
    const miniSubtotal = miniCart.querySelector('.mini-subtotal-value');

    if (!miniCartItemsContainer || !miniSubtotal) {
        console.error("Mini-cart structure incomplete.");
        return;
    }

    const cart = await getCartFromStorage();
    miniCartItemsContainer.innerHTML = '';

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

        const price = parseFloat(item.price?.replace(/[^\d.-]/g, '')) || 0;
        if (!isNaN(price)) {
            subtotal += price * parseInt(item.quantity || 1);
        }
      });

      miniSubtotal.textContent = formatCurrency(subtotal);

      miniCartItemsContainer.removeEventListener('click', handleMiniCartRemove);
      miniCartItemsContainer.addEventListener('click', handleMiniCartRemove);
    }
  }

  function handleMiniCartRemove(e) {
        const removeButton = e.target.closest('.mini-cart-item-remove');
        if (removeButton) {
            e.stopPropagation();
            const productId = removeButton.dataset.productId;
            removeCartItem(productId);
        }
    }

  function showEmptyCartMessage() {
    if (!isCartPage) return;

    if (emptyCartSection) {
      emptyCartSection.style.display = 'block';
    }

    if (cartWithItemsSection) {
      cartWithItemsSection.style.display = 'none';
    }
  }

  function hideEmptyCartMessage() {
    if (!isCartPage) return;

    if (emptyCartSection) {
      emptyCartSection.style.display = 'none';
    }

    if (cartWithItemsSection) {
      cartWithItemsSection.style.display = 'block';
    }
  }

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
    subtotalElement.textContent = formatCurrency(subtotal);
    updateCartItemQuantity(productId, quantity);
    calculateCartTotals();
  }

  // ==================
  // Order Storage Function
  // ==================
  
  async function storeOrder(items, cartInfo) {
    const order = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      items: items,
      subtotal: cartInfo.subtotal,
      shipping: cartInfo.shipping,
      tax: cartInfo.tax,
      total: cartInfo.total,
      customer: 'WhatsApp Order' // Basic customer info
    };
    
    let orders = await getOrders();
    orders.push(order);
    await saveOrders(orders);
  }

  async function getOrders() {
    try {
      let orders = localStorage.getItem('afrimart_orders');
      return orders ? JSON.parse(orders) : [];
    } catch (error) {
      console.error('Error getting orders:', error);
      return [];
    }
  }

  async function saveOrders(orders) {
    try {
      localStorage.setItem('afrimart_orders', JSON.stringify(orders));
    } catch (error) {
      console.error('Error saving orders:', error);
    }
  }

  // ==================
  // Checkout Functions
  // ==================

  async function checkoutViaWhatsApp() {
    const cart = await getCartFromStorage();
    const cartItems = cart.items || [];
    
    if (cartItems.length === 0) {
        showAddedToCartNotification('Your cart is empty');
        return;
    }

    // Collect current cart totals
    const subtotal = parseFloat((document.getElementById('cart-subtotal')?.textContent || '$0').replace(/[^\d.-]/g, ''));
    const shipping = parseFloat((document.getElementById('shipping-cost')?.textContent || '$0').replace(/[^\d.-]/g, ''));
    const tax = parseFloat((document.getElementById('tax-amount')?.textContent || '$0').replace(/[^\d.-]/g, ''));
    const total = parseFloat((document.getElementById('order-total')?.textContent || '$0').replace(/[^\d.-]/g, ''));

    // Store order before sending to WhatsApp
    await storeOrder(cartItems, { subtotal, shipping, tax, total });

    // Format cart items into a message
    let message = '🛒 New Order from AfriMart Depot\n\n';
    message += '*Order Items:*\n';
    
    cartItems.forEach((item, index) => {
        const price = parseFloat(item.price.replace(/[^\d.-]/g, '')) || 0;
        const itemTotal = price * item.quantity;
        
        message += `${index + 1}. ${item.title}\n`;
        message += `   Quantity: ${item.quantity}\n`;
        message += `   Price: ${item.price}\n`;
        message += `   Subtotal: $${itemTotal.toFixed(2)}\n\n`;
    });

    message += '*Order Summary:*\n';
    message += `Subtotal: $${subtotal.toFixed(2)}\n`;
    message += `Shipping: $${shipping.toFixed(2)}\n`;
    message += `Tax: $${tax.toFixed(2)}\n`;
    message += `Total: $${total.toFixed(2)}\n\n`;
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappNumber = '233545014267'.replace(/\D/g, '');
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${whatsappNumber}&text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
    
    setTimeout(() => {
        if (typeof window.AfriMartCart !== 'undefined' && typeof window.AfriMartCart.clearCart === 'function') {
            window.AfriMartCart.clearCart();
        } else {
            saveCartToS3({ items: [] });
            updateCartDisplay();
        }
        console.log("Order sent to WhatsApp, cart cleared.");
    }, 1500);
  }

  // ==================
  // Event Handlers and Initialization
  // ==================

  async function initCartPage() {
    if (!isCartPage) return;

    if (!cartItemsContainer) {
         console.error("Cart items container (.cart-item-list) not found.");
         showEmptyCartMessage();
         return;
     }

    if (cartItemsContainer.children.length === 0) {
      const cart = await getCartFromStorage();

      if (Array.isArray(cart.items) && cart.items.length > 0) {
        cart.items.forEach(item => {
          const template = document.getElementById('cart-item-template');
          let itemElement;
          if (template && template.content) {
              itemElement = template.content.firstElementChild.cloneNode(true);
              itemElement.dataset.productId = item.id;
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
              itemElement = document.createElement('div');
              itemElement.className = 'cart-item';
              itemElement.dataset.productId = item.id;
               itemElement.innerHTML = `
                    <div class="product-col"> <div class="product-info"> <div class="product-image"> <img src="${item.image || 'images/placeholder.jpg'}" alt="${item.title}"> </div> <div class="product-details"> <h3 class="product-title">${item.title}</h3> <p class="product-variant">${item.variant || ''}</p> </div> </div> </div> <div class="price-col"> <span class="price">${item.price}</span> </div> <div class="quantity-col"> <div class="quantity-selector"> <button class="quantity-btn minus">-</button> <input type="number" class="quantity-input" value="${item.quantity}" min="1" max="99"> <button class="quantity-btn plus">+</button> </div> </div> <div class="subtotal-col"> <span class="subtotal">${formatCurrency((parseFloat(item.price?.replace(/[^\d.-]/g, ''))||0) * parseInt(item.quantity||1))}</span> </div> <div class="remove-col"> <button class="remove-item" aria-label="Remove ${item.title}"> <i class="fas fa-times"></i> </button> </div>
               `;
          }
          cartItemsContainer.appendChild(itemElement);
        });

        setupCartItemEvents();
        calculateCartTotals();
        hideEmptyCartMessage();
      } else {
        showEmptyCartMessage();
      }
    } else if (cartItemsContainer && cartItemsContainer.children.length > 0) {
        setupCartItemEvents();
        calculateCartTotals();
        hideEmptyCartMessage();
    } else {
        showEmptyCartMessage();
    }

    if (shippingOptions) {
      shippingOptions.forEach(option => {
        option.addEventListener('change', function() {
          calculateCartTotals();
        });
      });
    }

    if (applyDiscountBtn && discountCodeInput) {
      applyDiscountBtn.addEventListener('click', function() {
        const code = discountCodeInput.value.trim().toUpperCase();

        if (discountSuccessMsg) discountSuccessMsg.style.display = 'none';
        if (discountErrorMsg) discountErrorMsg.style.display = 'none';
        if (discountRow && discountAmount) {
            discountRow.style.display = 'none';
            discountAmount.textContent = '-$0.00';
        }

        if (!code) {
          if (discountErrorMsg) {
            discountErrorMsg.textContent = 'Please enter a discount code.';
            discountErrorMsg.style.display = 'block';
          }
          calculateCartTotals();
          return;
        }

        if (validDiscountCodes.hasOwnProperty(code)) {
          const discount = validDiscountCodes[code];

          if (discount === 'freeshipping') {
            if (freeShippingOption) {
              freeShippingOption.checked = true;
              freeShippingOption.disabled = false;

              const freeShippingLabel = document.querySelector('label[for="free"]');
              if (freeShippingLabel) {
                freeShippingLabel.classList.remove('disabled');
              }

              freeShippingOption.dispatchEvent(new Event('change'));
            }

            if (discountSuccessMsg) {
              discountSuccessMsg.textContent = 'Free shipping applied successfully!';
              discountSuccessMsg.style.display = 'block';
            }

             if (discountRow && discountAmount) {
                discountRow.style.display = 'none';
                discountAmount.textContent = '-$0.00';
            }

          } else {
            const subtotalValue = parseFloat(cartSubtotal?.textContent.replace(/[^\d.-]/g, '')) || 0;
            const discountValue = subtotalValue * (discount / 100);

            if (discountRow && discountAmount) {
              discountRow.style.display = 'flex';
               discountAmount.textContent = '-' + formatCurrency(discountValue);
            }
 
            if (discountSuccessMsg) {
              discountSuccessMsg.textContent = `${discount}% discount applied successfully!`;
              discountSuccessMsg.style.display = 'block';
            }
          }
 
          if (discountCodeInput) discountCodeInput.disabled = true;
          if (applyDiscountBtn) applyDiscountBtn.disabled = true;
 
          calculateCartTotals();
        } else {
          if (discountErrorMsg) {
            discountErrorMsg.textContent = 'Invalid discount code. Please try again.';
            discountErrorMsg.style.display = 'block';
          }
          if (discountRow && discountAmount) {
                discountRow.style.display = 'none';
                discountAmount.textContent = '-$0.00';
            }
            calculateCartTotals();
        }
      });
    }
 
    if (updateCartBtn) {
      updateCartBtn.addEventListener('click', async function() {
        this.innerHTML = '<i class="fas fa-check"></i> Cart Updated';
        this.classList.add('btn-success');
 
        const cartItemsData = extractCartItemsFromDOM();
        await saveCartToStorage(cartItemsData);
        calculateCartTotals();
 
        setTimeout(() => {
          this.innerHTML = '<i class="fas fa-sync-alt"></i> Update Cart';
          this.classList.remove('btn-success');
        }, 2000);
      });
    }
 
    if (clearCartBtn) {
      clearCartBtn.addEventListener('click', async function() {
        if (confirm('Are you sure you want to clear your cart?')) {
          await saveCartToStorage([]);
 
          if(cartItemsContainer){
              Array.from(cartItemsContainer.children).forEach(item => {
                item.style.transition = 'opacity 0.3s ease';
                item.style.opacity = '0';
              });
          }
 
          setTimeout(() => {
            if (cartItemsContainer) {
              cartItemsContainer.innerHTML = '';
            }
 
            showEmptyCartMessage();
            calculateCartTotals();
 
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
 
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', function(e) {
        e.preventDefault();
        checkoutViaWhatsApp();
      });
    }
  }
 
  function setupCartItemEvents() {
    if (!isCartPage || !cartItemsContainer) return;
 
    cartItemsContainer.addEventListener('click', function(e) {
        const target = e.target;
        const cartItem = target.closest('.cart-item');
        if (!cartItem) return;
 
        const productId = cartItem.dataset.productId;
        const quantityInput = cartItem.querySelector('.quantity-input');
 
        if (target.closest('.remove-item')) {
             e.stopPropagation();
            if (productId) {
                removeCartItem(productId);
            }
            return;
        }
 
        if (target.closest('.quantity-btn.minus')) {
             e.stopPropagation();
            if (quantityInput) {
                const currentValue = parseInt(quantityInput.value);
                if (currentValue > 1) {
                    quantityInput.value = currentValue - 1;
                    updateItemSubtotal(quantityInput);
                }
            }
            return;
        }
 
        if (target.closest('.quantity-btn.plus')) {
             e.stopPropagation();
            if (quantityInput) {
                const currentValue = parseInt(quantityInput.value);
                const maxValue = parseInt(quantityInput.getAttribute('max') || 99);
                if (currentValue < maxValue) {
                    quantityInput.value = currentValue + 1;
                    updateItemSubtotal(quantityInput);
                }
            }
            return;
        }
    });
 
    cartItemsContainer.addEventListener('change', function(e) {
        if (e.target.classList.contains('quantity-input')) {
            const quantityInput = e.target;
            let value = parseInt(quantityInput.value);
            const minValue = parseInt(quantityInput.getAttribute('min') || 1);
            const maxValue = parseInt(quantityInput.getAttribute('max') || 99);
 
            if (isNaN(value) || value < minValue) {
                value = minValue;
            } else if (value > maxValue) {
                value = maxValue;
            }
 
            quantityInput.value = value;
            updateItemSubtotal(quantityInput);
        }
    });
 }
 
  function setupCartIconClickHandlers() {
    const cartIcons = document.querySelectorAll('.cart-icon a');
 
    cartIcons.forEach(icon => {
      if (icon.dataset.cartListenerAttached === 'true') return;
        icon.dataset.cartListenerAttached = 'true';
 
        icon.addEventListener('click', async function(e) {
            const cart = await getCartFromStorage();
 
            if (cart.items && cart.items.length > 0) {
                showMiniCart();
            }
        });
    });
  }
 
   function initAddToCartButtons() {
    document.body.addEventListener('click', function(e) {
        const button = e.target.closest('.add-to-cart');
        if (!button) return;
 
        e.preventDefault();
        e.stopPropagation();
 
        if (button.disabled) return;
 
        const productContainer = button.closest('.product-card') || button.closest('.product-info') || button.closest('.product-details') || button.closest('.sidebar-widget .product-card');
        if (!productContainer) {
            console.error('Could not find product container for Add to Cart button.');
            return;
        }
 
        let productId, productTitle, productPrice, productImage, productQuantity = 1;
        let variantInfo = "";
 
        const isOnProductPage = document.querySelector('.product-details-section') !== null;
        const isInQuickView = button.closest('.quick-view-modal') !== null;
 
        if (isOnProductPage || isInQuickView) {
            const context = isInQuickView ? button.closest('.quick-view-modal') : document;
 
            productId = button.dataset.productId ||
                       context.querySelector('.add-to-cart-btn')?.dataset.productId ||
                       new URLSearchParams(window.location.search).get('product') ||
                       new URLSearchParams(window.location.search).get('id') ||
                       `product_${Date.now()}`;
 
            const titleElement = context.querySelector('.product-title') || context.querySelector('h2');
            productTitle = titleElement ? titleElement.textContent.trim() : 'Product';
 
            const priceElement = context.querySelector('.current-price') || context.querySelector('.price');
            productPrice = priceElement ? priceElement.textContent.trim() : '$0.00';
 
            const imageElement = context.querySelector('.main-image img') || document.querySelector('.main-product-image');
            productImage = imageElement ? imageElement.src : (productContainer.querySelector('img')?.src || '');
 
            const quantityInput = context.querySelector('.quantity-input');
            productQuantity = quantityInput ? parseInt(quantityInput.value) || 1 : 1;
 
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
            productId = productContainer.dataset.productId || productContainer.dataset.id || `product_${Date.now()}`;
            const titleElement = productContainer.querySelector('.product-title') || productContainer.querySelector('h3 a') || productContainer.querySelector('h3');
            productTitle = titleElement ? (titleElement.textContent || titleElement.innerText).trim() : 'Product';
            const priceElement = productContainer.querySelector('.price');
            productPrice = priceElement ? priceElement.textContent.trim() : '$0.00';
            const imageElement = productContainer.querySelector('.product-image img') || productContainer.querySelector('img');
            productImage = imageElement ? imageElement.src : '';
            const quantityInput = productContainer.querySelector('.quick-quantity');
            productQuantity = quantityInput ? parseInt(quantityInput.value) || 1 : 1;
             variantInfo = "";
        }
 
        const product = {
            id: productId,
            title: productTitle,
            price: productPrice,
            quantity: productQuantity,
            image: productImage,
            variant: variantInfo
        };
 
        addToCart(product);
 
        const originalHTML = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i> Added!';
        button.classList.add('added');
         button.disabled = true;
 
        setTimeout(() => {
             if(button) {
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
 
  window.AfriMartCart = {
    addToCart: addToCart,
    removeCartItem: removeCartItem,
    updateCartItemQuantity: updateCartItemQuantity,
    getCartItems: async function() {
      const cart = await getCartFromStorage();
      return cart.items;
    },
    clearCart: async function() {
      await saveCartToStorage([]);
      updateCartDisplay();
      if(isCartPage) {
           showEmptyCartMessage();
           calculateCartTotals();
           if (discountRow) discountRow.style.display = 'none';
           if (discountAmount) discountAmount.textContent = '-$0.00';
           if (discountCodeInput) {
               discountCodeInput.value = '';
               discountCodeInput.disabled = false;
           }
           if (applyDiscountBtn) applyDiscountBtn.disabled = false;
           if (discountSuccessMsg) discountSuccessMsg.style.display = 'none';
           if (discountErrorMsg) discountErrorMsg.style.display = 'none';
           const standardShipping = document.getElementById('standard');
           if (standardShipping) standardShipping.checked = true;
           calculateCartTotals();
        }
    },
    showMiniCart: showMiniCart,
    updateCartDisplay: updateCartDisplay
  };
 
  window.addToCart = addToCart;
 
  // ==================
  // Initialization
  // ==================
 
  updateCartDisplay();
  initCartPage();
  initAddToCartButtons();
  setupCartIconClickHandlers();
  createMiniCart();
  updateMiniCartItems();
 
  setTimeout(updateCartDisplay, 500);
 
 });