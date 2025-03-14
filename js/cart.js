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

  // Cart functionality
  const cartItems = document.querySelectorAll('.cart-item');
  const cartSubtotal = document.getElementById('cart-subtotal');
  const shippingCost = document.getElementById('shipping-cost');
  const taxAmount = document.getElementById('tax-amount');
  const orderTotal = document.getElementById('order-total');
  const discountAmount = document.getElementById('discount-amount');
  const discountRow = document.querySelector('.discount-row');
  
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

  // Discount codes (in a real application, these would be validated server-side)
  const validDiscountCodes = {
    'WELCOME10': 10, // 10% off
    'AFRIMART20': 20, // 20% off
    'FREESHIP': 'freeshipping' // Free shipping
  };

  // Function to format currency
  function formatCurrency(amount) {
    return '$' + parseFloat(amount).toFixed(2);
  }

  // Function to calculate cart totals
  function calculateTotals() {
    let subtotal = 0;
    let shipping = parseFloat(shippingCost.textContent.replace('$', ''));
    let discount = 0;
    
    // Calculate subtotal
    cartItems.forEach(item => {
      const subtotalElement = item.querySelector('.subtotal');
      subtotal += parseFloat(subtotalElement.textContent.replace('$', ''));
    });
    
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

  // Quantity selector functionality
  cartItems.forEach(item => {
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
  const removeButtons = document.querySelectorAll('.remove-item');
  
  removeButtons.forEach(button => {
    button.addEventListener('click', function() {
      const cartItem = this.closest('.cart-item');
      
      // Add fade-out animation
      cartItem.style.transition = 'opacity 0.3s ease';
      cartItem.style.opacity = '0';
      
      // Remove after animation
      setTimeout(() => {
        cartItem.remove();
        
        // Update total number of items in cart
        const remainingItems = document.querySelectorAll('.cart-item').length;
        document.querySelector('.cart-items h2').textContent = `Your Cart (${remainingItems} items)`;
        document.querySelector('.cart-count').textContent = remainingItems;
        
        // Show empty cart message if no items remain
        if (remainingItems === 0) {
          document.querySelector('.cart-with-items').style.display = 'none';
          document.querySelector('.empty-cart').style.display = 'block';
        }
        
        // Recalculate totals
        calculateTotals();
      }, 300);
    });
  });

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
  if (clearCartBtn) {
    clearCartBtn.addEventListener('click', function() {
      if (confirm('Are you sure you want to clear your cart?')) {
        // Add fade-out animation to all items
        cartItems.forEach(item => {
          item.style.transition = 'opacity 0.3s ease';
          item.style.opacity = '0';
        });
        
        // Remove after animation
        setTimeout(() => {
          document.querySelector('.cart-with-items').style.display = 'none';
          document.querySelector('.empty-cart').style.display = 'block';
          document.querySelector('.cart-count').textContent = '0';
        }, 300);
      }
    });
  }

  // Initialize calculations on page load
  calculateTotals();

  // Related Products Slider (simplified version)
  const relatedProducts = document.querySelectorAll('.related-products-slider .product-card');
  
  relatedProducts.forEach(product => {
    product.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-10px)';
      this.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.1)';
    });
    
    product.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0)';
      this.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.1)';
    });
  });

  // Add to Cart in Related Products
  const addToCartButtons = document.querySelectorAll('.related-products-slider .add-to-cart');
  
  addToCartButtons.forEach(button => {
    button.addEventListener('click', function() {
      const productCard = this.closest('.product-card');
      const productTitle = productCard.querySelector('.product-title a').textContent;
      
      // Animation
      this.textContent = 'Added!';
      this.style.backgroundColor = '#28a745';
      
      // Increment cart count
      const cartCount = document.querySelector('.cart-count');
      let count = parseInt(cartCount.textContent);
      cartCount.textContent = count + 1;
      
      // Reset button after animation
      setTimeout(() => {
        this.textContent = 'Add to Cart';
        this.style.backgroundColor = '';
        
        // Show notification (this would be more sophisticated in a real implementation)
        alert(`${productTitle} has been added to your cart!`);
      }, 1500);
    });
  });

  // Checkout via WhatsApp 
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Prepare order message
      let orderMessage = "Hello! I'd like to place an order from AfriMart Depot:\n\n";
      
      // Get cart items
      const cartItems = document.querySelectorAll('.cart-item');
      let subtotal = document.getElementById('cart-subtotal').textContent;
      let shipping = document.getElementById('shipping-cost').textContent;
      let tax = document.getElementById('tax-amount').textContent;
      let total = document.getElementById('order-total').textContent;
      let discount = "0.00";
      
      if (discountRow && discountRow.style.display !== 'none') {
        discount = discountAmount.textContent;
      }
      
      // Add customer information placeholder
      orderMessage += "Customer Information:\n";
      orderMessage += "Name: [Please provide your name]\n";
      orderMessage += "Address: [Please provide your delivery address]\n";
      orderMessage += "Phone: [Please provide your phone number]\n\n";
      
      // Add items to message
      orderMessage += "Order Items:\n";
      cartItems.forEach(item => {
        const title = item.querySelector('.product-title').textContent;
        const variant = item.querySelector('.product-variant')?.textContent || '';
        const quantity = item.querySelector('.quantity-input').value;
        const price = item.querySelector('.subtotal').textContent;
        
        orderMessage += `• ${title} ${variant} (${quantity}) - ${price}\n`;
      });
      
      // Add summary
      orderMessage += `\nOrder Summary:\n`;
      orderMessage += `Subtotal: ${subtotal}\n`;
      
      // Only add discount if it exists
      if (discountRow && discountRow.style.display !== 'none') {
        orderMessage += `Discount: ${discount}\n`;
      }
      
      orderMessage += `Shipping: ${shipping}\n`;
      orderMessage += `Tax: ${tax}\n`;
      orderMessage += `Total: ${total}\n\n`;
      
      // Add shipping method
      let shippingMethod = "Standard";
      shippingOptions.forEach(option => {
        if (option.checked) {
          shippingMethod = option.id.charAt(0).toUpperCase() + option.id.slice(1);
        }
      });
      orderMessage += `Shipping Method: ${shippingMethod}\n\n`;
      
      orderMessage += "Please confirm my order. Thank you!";
      
      // Encode message for WhatsApp URL
      const encodedMessage = encodeURIComponent(orderMessage);
      
      // Open WhatsApp with pre-filled message
      window.open(`https://wa.me/18048060130?text=${encodedMessage}`, '_blank');
    });
  }
});