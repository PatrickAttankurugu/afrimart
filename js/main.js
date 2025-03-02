/*
* AfriMart Depot - Main JavaScript
* Version: 2.0
*/

// API configuration
const API_BASE_URL = 'https://35.175.245.151/api';
// Fallback to local development if needed
// const API_BASE_URL = 'http://localhost:5000/api';

// Common utility functions for API requests
const ApiService = {
  /**
   * Make a GET request to the API
   * @param {string} endpoint - API endpoint to call
   * @returns {Promise} - Promise with the response data
   */
  get: async function(endpoint) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  },
  
  /**
   * Make a POST request to the API
   * @param {string} endpoint - API endpoint to call
   * @param {Object} data - Data to send in the request body
   * @returns {Promise} - Promise with the response data
   */
  post: async function(endpoint, data) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }
};

// Cart service to manage shopping cart
const CartService = {
  // Key for storing cart in localStorage
  STORAGE_KEY: 'afrimart_cart',
  
  /**
   * Get current cart from localStorage
   * @returns {Array} - Array of cart items
   */
  getCart: function() {
    const cart = localStorage.getItem(this.STORAGE_KEY);
    return cart ? JSON.parse(cart) : [];
  },
  
  /**
   * Save cart to localStorage
   * @param {Array} cart - Cart items to save
   */
  saveCart: function(cart) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cart));
    this.updateCartCount();
  },
  
  /**
   * Add item to cart
   * @param {Object} product - Product to add to cart
   * @param {number} quantity - Quantity to add
   */
  addToCart: function(product, quantity = 1) {
    const cart = this.getCart();
    
    // Check if product already exists in cart
    const existingItemIndex = cart.findIndex(item => item.id === product.id);
    
    if (existingItemIndex !== -1) {
      // Update quantity if product already in cart
      cart[existingItemIndex].quantity += quantity;
    } else {
      // Add new item to cart
      cart.push({
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.image_main,
        quantity: quantity,
        unit: product.unit || ''
      });
    }
    
    this.saveCart(cart);
    return cart;
  },
  
  /**
   * Update item quantity in cart
   * @param {number} productId - Product ID to update
   * @param {number} quantity - New quantity
   */
  updateQuantity: function(productId, quantity) {
    const cart = this.getCart();
    const itemIndex = cart.findIndex(item => item.id === productId);
    
    if (itemIndex !== -1) {
      if (quantity > 0) {
        cart[itemIndex].quantity = quantity;
      } else {
        // Remove item if quantity is 0 or negative
        cart.splice(itemIndex, 1);
      }
      
      this.saveCart(cart);
    }
    
    return cart;
  },
  
  /**
   * Remove item from cart
   * @param {number} productId - Product ID to remove
   */
  removeItem: function(productId) {
    const cart = this.getCart();
    const updatedCart = cart.filter(item => item.id !== productId);
    this.saveCart(updatedCart);
    return updatedCart;
  },
  
  /**
   * Clear entire cart
   */
  clearCart: function() {
    localStorage.removeItem(this.STORAGE_KEY);
    this.updateCartCount();
  },
  
  /**
   * Calculate cart subtotal
   * @returns {number} - Cart subtotal
   */
  calculateSubtotal: function() {
    const cart = this.getCart();
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  },
  
  /**
   * Update cart count in the UI
   */
  updateCartCount: function() {
    const cart = this.getCart();
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    
    // Update all cart count elements
    document.querySelectorAll('.cart-count').forEach(el => {
      el.textContent = count;
    });
  }
};

document.addEventListener('DOMContentLoaded', function() {
  'use strict';

  // Initialize AOS Animation
  AOS.init({
    duration: 800,
    easing: 'ease-in-out',
    once: true,
    mirror: false,
    disable: 'mobile' // Disable on mobile for better performance
  });

  // Header scroll state
  const header = document.querySelector('.header');
  const scrollThreshold = 100;

  function handleHeaderScroll() {
    if (window.scrollY > scrollThreshold) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', handleHeaderScroll);
  
  // Initial check for header scroll state when page loads
  handleHeaderScroll();
  
  // Fix header height issues - ensure header is properly sized
  function updateHeaderSizing() {
    const headerHeight = header.offsetHeight;
    document.documentElement.style.setProperty('--header-height', `${headerHeight}px`);
    
    // Update content margin based on header height
    const heroSections = document.querySelectorAll('.hero-section, .contact-hero-section, .page-title-section');
    
    heroSections.forEach(section => {
      if (section) {
        section.style.marginTop = `${headerHeight}px`;
      }
    });
  }
  
  // Run once on load and whenever window is resized
  updateHeaderSizing();
  window.addEventListener('resize', updateHeaderSizing);
  
  // Mobile Menu Toggle
  const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
  const mobileMenu = document.querySelector('.mobile-menu');
  const closeMenu = document.querySelector('.close-menu');
  
  if (mobileMenuToggle && mobileMenu && closeMenu) {
    mobileMenuToggle.addEventListener('click', function() {
      mobileMenu.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
    
    closeMenu.addEventListener('click', function() {
      mobileMenu.classList.remove('active');
      document.body.style.overflow = 'auto';
    });
    
    // Close mobile menu when clicking outside of it
    document.addEventListener('click', function(event) {
      if (mobileMenu.classList.contains('active') && 
          !mobileMenu.contains(event.target) && 
          !mobileMenuToggle.contains(event.target)) {
        mobileMenu.classList.remove('active');
        document.body.style.overflow = 'auto';
      }
    });
  }
  
  // Logo sizing fix - prevent oversized logos
  const logo = document.querySelector('.logo img');
  if (logo) {
    logo.onload = function() {
      if (this.naturalHeight > 100) {
        this.style.height = '60px';
        this.style.width = 'auto';
      }
      updateHeaderSizing();
    };
    
    // If logo already loaded, run check immediately
    if (logo.complete) {
      if (logo.naturalHeight > 100) {
        logo.style.height = '60px';
        logo.style.width = 'auto';
      }
      updateHeaderSizing();
    }
  }

  // Update cart count on page load
  CartService.updateCartCount();
  
  // Add to Cart Functionality
  const addToCartButtons = document.querySelectorAll('.add-to-cart');
  
  if (addToCartButtons.length) {
    // Get initial count from localStorage or default to 0
    let count = CartService.getCart().reduce((total, item) => total + item.quantity, 0);
    
    // Update cart count display initially
    document.querySelectorAll('.cart-count').forEach(el => {
      el.textContent = count;
    });
    
    addToCartButtons.forEach(button => {
      button.addEventListener('click', function() {
        // Get product information from data attributes or parent elements
        const productCard = this.closest('.product-card');
        
        if (productCard) {
          const productId = parseInt(productCard.dataset.productId || productCard.dataset.id || 0);
          const productTitle = productCard.querySelector('.product-title a').textContent;
          const productPrice = parseFloat(productCard.querySelector('.price').textContent.replace('$', ''));
          const productImage = productCard.querySelector('.product-image img').src;
          const productUnit = productCard.querySelector('.unit')?.textContent || '';
          
          // Add to cart
          const product = {
            id: productId,
            title: productTitle,
            price: productPrice,
            image_main: productImage,
            unit: productUnit
          };
          
          CartService.addToCart(product);
          
          // Update UI
          count = CartService.getCart().reduce((total, item) => total + item.quantity, 0);
          document.querySelectorAll('.cart-count').forEach(el => {
            el.textContent = count;
          });
          
          // Add animation effect
          const originalText = button.textContent;
          button.innerHTML = '<i class="fas fa-check"></i> Added!';
          button.classList.add('added');
          
          setTimeout(() => {
            button.innerHTML = originalText;
            button.classList.remove('added');
          }, 1500);
          
          // Show mini cart notification
          showCartNotification(productTitle);
        }
      });
    });
  }
  
  function showCartNotification(productName) {
    // Check if notification already exists
    let notification = document.querySelector('.cart-notification');
    
    if (!notification) {
      // Create notification if it doesn't exist
      notification = document.createElement('div');
      notification.className = 'cart-notification';
      notification.innerHTML = `<i class="fas fa-check-circle"></i> ${productName} added to cart`;
      document.body.appendChild(notification);
    } else {
      notification.innerHTML = `<i class="fas fa-check-circle"></i> ${productName} added to cart`;
    }
    
    // Show notification
    notification.classList.add('active');
    
    // Hide after 3 seconds
    setTimeout(() => {
      notification.classList.remove('active');
    }, 3000);
  }
  
  // Newsletter Form Submission
  const newsletterForm = document.querySelector('.newsletter-form');
  
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const emailInput = this.querySelector('input[type="email"]');
      const email = emailInput.value.trim();
      
      if (email && isValidEmail(email)) {
        // Simulating form submission
        newsletterForm.innerHTML = `
          <div class="success-message">
            <i class="fas fa-check-circle"></i>
            <p>Thank you for subscribing to our newsletter!</p>
          </div>
        `;
        
        // Store email in localStorage to remember the subscription
        localStorage.setItem('newsletter_subscribed', 'true');
        localStorage.setItem('newsletter_email', email);
      } else {
        emailInput.classList.add('error');
        
        // Show error message
        let errorMsg = emailInput.nextElementSibling;
        if (!errorMsg || !errorMsg.classList.contains('error-message')) {
          errorMsg = document.createElement('div');
          errorMsg.className = 'error-message';
          errorMsg.textContent = 'Please enter a valid email address';
          emailInput.parentNode.insertBefore(errorMsg, emailInput.nextSibling);
        }
        
        setTimeout(() => {
          emailInput.classList.remove('error');
          if (errorMsg) {
            errorMsg.style.display = 'none';
          }
        }, 3000);
      }
    });
    
    function isValidEmail(email) {
      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return regex.test(email);
    }
  }
  
  // Back to Top Button
  const backToTopButton = document.getElementById('backToTop');
  
  if (backToTopButton) {
    window.addEventListener('scroll', function() {
      if (window.scrollY > 300) {
        backToTopButton.classList.add('active');
      } else {
        backToTopButton.classList.remove('active');
      }
    });
    
    backToTopButton.addEventListener('click', function(e) {
      e.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }
  
  // Parallax Effect
  const parallaxElements = document.querySelectorAll('.parallax-window');
  
  if (parallaxElements.length && window.innerWidth > 768) {
    parallaxElements.forEach(element => {
      const imageUrl = element.getAttribute('data-image-src');
      if (imageUrl) {
        element.style.backgroundImage = `url(${imageUrl})`;
        element.style.backgroundAttachment = 'fixed';
        element.style.backgroundPosition = 'center';
        element.style.backgroundRepeat = 'no-repeat';
        element.style.backgroundSize = 'cover';
      }
    });
    
    // Add parallax scroll effect
    window.addEventListener('scroll', function() {
      parallaxElements.forEach(element => {
        const scrollPosition = window.scrollY;
        const elementTop = element.offsetTop;
        const elementHeight = element.offsetHeight;
        const viewportHeight = window.innerHeight;
        
        // Check if element is in viewport
        if (scrollPosition + viewportHeight > elementTop && 
            scrollPosition < elementTop + elementHeight) {
          
          // Calculate parallax offset
          const offset = (scrollPosition - elementTop) * 0.4;
          element.style.backgroundPositionY = `calc(50% + ${offset}px)`;
        }
      });
    });
  }

  // Animate on Scroll for elements not using AOS library
  function animateOnScroll() {
    const elements = document.querySelectorAll('.animate-on-scroll:not(.animated)');
    
    elements.forEach(element => {
      const elementPosition = element.getBoundingClientRect().top;
      const windowHeight = window.innerHeight;
      
      if (elementPosition < windowHeight - 100) {
        const animationClass = element.getAttribute('data-animation') || 'fade-in';
        element.classList.add('animated', animationClass);
      }
    });
  }
  
  window.addEventListener('scroll', animateOnScroll);
  animateOnScroll(); // Initial check on page load
  
  // Fix search functionality
  const searchBox = document.querySelector('.search-box');
  if (searchBox) {
    const searchInput = searchBox.querySelector('input');
    const searchIcon = searchBox.querySelector('.search-icon');
    
    if (searchIcon && searchInput) {
      searchIcon.addEventListener('click', function() {
        searchInput.focus();
      });
      
      // Add search form submission
      searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (searchInput.value.trim()) {
            window.location.href = `shop.html?search=${encodeURIComponent(searchInput.value.trim())}`;
          }
        }
      });
    }
  }
  
  // Expose global utilities and services
  window.ApiService = ApiService;
  window.CartService = CartService;
  
  // Add CSS for cart notification
  const style = document.createElement('style');
  style.textContent = `
    .cart-notification {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background-color: var(--primary-color, #28a745);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.15);
      display: flex;
      align-items: center;
      gap: 10px;
      transform: translateY(100px);
      opacity: 0;
      transition: all 0.3s ease;
      z-index: 9999;
    }
    
    .cart-notification.active {
      transform: translateY(0);
      opacity: 1;
    }
    
    .cart-notification i {
      font-size: 18px;
    }
    
    .add-to-cart.added {
      background-color: #28a745;
    }
  `;
  document.head.appendChild(style);
});