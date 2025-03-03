/*
* AfriMart Depot - Shop Page JavaScript
* Version: 3.0 - Backend Integration
*/

document.addEventListener('DOMContentLoaded', function() {
  'use strict';

  // Initialize AOS Animation if available
  if (typeof AOS !== 'undefined') {
    AOS.init({
      duration: 800,
      easing: 'ease-in-out',
      once: true,
      mirror: false
    });
  }

  // Check if API Service is available
  if (!window.ApiService) {
    console.error('ApiService not found - cannot load products');
    const productsGrid = document.querySelector('.products-grid');
    if (productsGrid) {
      productsGrid.innerHTML = `
        <div class="error-message">
          <i class="fas fa-exclamation-circle"></i>
          <p>Could not connect to product service. Please try again later.</p>
        </div>
      `;
    }
    return;
  }

  // State Management
  const state = {
    products: [],
    categories: [],
    currentCategory: 'all',
    currentSort: 'newest',
    loading: false,
    error: null
  };

  // DOM Elements
  const productsGrid = document.querySelector('.products-grid');
  const categoryLinks = document.querySelectorAll('.category-link');
  const sortSelect = document.getElementById('sort-by');
  const searchInput = document.getElementById('searchInput');
  const resultsCount = document.querySelector('.shop-results-count p');

  // Loading indicator
  function showLoading() {
    state.loading = true;
    
    if (productsGrid) {
      productsGrid.innerHTML = `
        <div class="loading-indicator">
          <i class="fas fa-spinner fa-spin fa-2x"></i>
          <p>Loading products...</p>
        </div>
      `;
    }
  }

  function hideLoading() {
    state.loading = false;
  }

  // Error handling
  function showError(message) {
    state.error = message;
    
    if (productsGrid) {
      productsGrid.innerHTML = `
        <div class="error-message">
          <i class="fas fa-exclamation-circle"></i>
          <p>${message}</p>
        </div>
      `;
    }
    
    // Show error as toast
    showToast(message, 'error');
  }

  // Fetch all products from the API
  async function fetchProducts() {
    try {
      showLoading();
      
      // Build query parameters
      const params = new URLSearchParams();
      
      // Add category filter
      if (state.currentCategory && state.currentCategory !== 'all') {
        params.append('category', state.currentCategory);
      }
      
      // Add sort parameter
      if (state.currentSort) {
        params.append('sort', state.currentSort);
      }
      
      // Check for search parameter in URL
      const urlParams = new URLSearchParams(window.location.search);
      const searchQuery = urlParams.get('search');
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      
      // Make API request
      const response = await window.ApiService.get(`/products?${params.toString()}`);
      
      if (response.success) {
        state.products = response.products;
        renderProducts();
        updateResultsCount();
      } else {
        showError('Failed to load products. Please try again.');
        console.error('API Error:', response.error);
      }
    } catch (error) {
      showError('An error occurred while loading products. Please try again.');
      console.error('Fetch Error:', error);
    } finally {
      hideLoading();
    }
  }

  // Fetch all categories from the API
  async function fetchCategories() {
    try {
      // Make API request
      const response = await window.ApiService.get('/categories');
      
      if (response.success) {
        state.categories = response.categories;
        renderCategories();
      } else {
        console.error('API Error:', response.error);
      }
    } catch (error) {
      console.error('Fetch Error:', error);
    }
  }

  // Render categories in sidebar
  function renderCategories() {
    const categoryList = document.getElementById('categoryList');
    const footerCategories = document.getElementById('footerCategories');
    
    if (!categoryList || !state.categories.length) return;
    
    // Build HTML for category list
    let categoryHTML = '';
    let footerCategoryHTML = '';
    
    // Always keep "All Products" category
    categoryHTML = `
      <li class="category-item">
        <a href="#" class="category-link ${state.currentCategory === 'all' ? 'active' : ''}" data-category="all">
          <span class="category-name">All Products</span>
          <span class="category-count">${state.categories.reduce((total, cat) => total + cat.product_count, 0)}</span>
        </a>
      </li>
    `;
    
    state.categories.forEach(category => {
      categoryHTML += `
        <li class="category-item">
          <a href="#" class="category-link ${state.currentCategory === category.slug ? 'active' : ''}" data-category="${category.slug}">
            <span class="category-name">${category.name}</span>
            <span class="category-count">${category.product_count}</span>
          </a>
        </li>
      `;
      
      footerCategoryHTML += `
        <li><a href="shop.html?category=${category.slug}">${category.name}</a></li>
      `;
    });
    
    // Update category list
    categoryList.innerHTML = categoryHTML;
    
    // Update footer categories
    if (footerCategories) {
      footerCategories.innerHTML = footerCategoryHTML;
    }
    
    // Add click events to category links
    setupCategoryLinks();
  }

  // Setup category link click events
  function setupCategoryLinks() {
    const categoryLinks = document.querySelectorAll('.category-link');
    
    categoryLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Update active category
        categoryLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        
        // Update current category
        state.currentCategory = link.getAttribute('data-category');
        
        // Update URL parameter
        const url = new URL(window.location);
        if (state.currentCategory === 'all') {
          url.searchParams.delete('category');
        } else {
          url.searchParams.set('category', state.currentCategory);
        }
        window.history.pushState({}, '', url);
        
        // Reload products with new category
        fetchProducts();
      });
    });
  }

  // Render products in grid
  function renderProducts() {
    if (!productsGrid) return;
    
    if (state.products.length === 0) {
      productsGrid.innerHTML = `
        <div class="no-products-found">
          <i class="fas fa-search"></i>
          <h3>No products found</h3>
          <p>Try adjusting your search or filter criteria</p>
        </div>
      `;
      return;
    }
    
    let productsHTML = '';
    
    state.products.forEach(product => {
      // Determine if product has a badge
      let badgeHTML = '';
      if (product.old_price && product.old_price > product.price) {
        const discountPercent = Math.round((1 - product.price / product.old_price) * 100);
        badgeHTML = `<div class="product-badge best">${discountPercent}% OFF</div>`;
      } else if (product.is_featured) {
        badgeHTML = `<div class="product-badge popular">Featured</div>`;
      }
      
      // Format price display
      let priceHTML = '';
      if (product.old_price && product.old_price > product.price) {
        priceHTML = `
          <span class="price">$${product.price.toFixed(2)}</span>
          <span class="old-price">$${product.old_price.toFixed(2)}</span>
        `;
      } else {
        priceHTML = `<span class="price">$${product.price.toFixed(2)}</span>`;
      }
      
      // Get proper image URL
      const imageUrl = window.ApiService.getImageUrl(product.image_main) || 'images/placeholder.jpg';
      
      productsHTML += `
        <div class="product-card" data-product-id="${product.id}" data-aos="fade-up">
          ${badgeHTML}
          <div class="product-image">
            <img src="${imageUrl}" alt="${product.title}">
            <div class="product-actions">
              <button class="action-btn quick-view" data-product="${product.slug}">
                <i class="fas fa-eye"></i>
              </button>
              <button class="action-btn add-to-wishlist">
                <i class="far fa-heart"></i>
              </button>
            </div>
          </div>
          <div class="product-info">
            <h3 class="product-title">
              <a href="product-details.html?product=${product.slug}">${product.title}</a>
            </h3>
            <div class="product-rating">
              <i class="fas fa-star"></i>
              <i class="fas fa-star"></i>
              <i class="fas fa-star"></i>
              <i class="fas fa-star"></i>
              <i class="fas fa-star-half-alt"></i>
              <span>(${Math.floor(Math.random() * 30) + 5})</span>
            </div>
            <div class="product-price">
              ${priceHTML}
              <span class="unit">${product.unit || ''}</span>
            </div>
            <button class="add-to-cart" ${product.stock <= 0 ? 'disabled' : ''}>
              <i class="fas fa-shopping-cart"></i> ${product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
            </button>
          </div>
        </div>
      `;
    });
    
    productsGrid.innerHTML = productsHTML;
    
    // Initialize product card events
    initProductCards();
    
    // Re-initialize AOS animations
    if (typeof AOS !== 'undefined') {
      AOS.refresh();
    }
  }

  // Update results count
  function updateResultsCount() {
    if (resultsCount) {
      resultsCount.textContent = `Showing ${state.products.length} products`;
    }
  }

  // Initialize product card events
  function initProductCards() {
    // Quick View functionality
    const quickViewButtons = document.querySelectorAll('.quick-view');
    if (quickViewButtons.length) {
      quickViewButtons.forEach(button => {
        button.addEventListener('click', () => {
          const productSlug = button.getAttribute('data-product');
          openQuickView(productSlug);
        });
      });
    }
    
    // Add to Cart functionality
    const addToCartButtons = document.querySelectorAll('.add-to-cart');
    if (addToCartButtons.length && window.CartService) {
      addToCartButtons.forEach(button => {
        button.addEventListener('click', () => {
          if (button.hasAttribute('disabled')) return;
          
          const productCard = button.closest('.product-card');
          const productId = parseInt(productCard.dataset.productId);
          
          // Find product in state.products
          const product = state.products.find(p => p.id === productId);
          
          if (product) {
            window.CartService.addToCart(product);
            
            // Update button UI
            const originalText = button.innerHTML;
            button.innerHTML = '<i class="fas fa-check"></i> Added!';
            button.classList.add('added');
            
            // Show toast notification
            showToast(`${product.title} added to cart!`, 'success');
            
            // Reset button after 1.5 seconds
            setTimeout(() => {
              button.innerHTML = originalText;
              button.classList.remove('added');
            }, 1500);
          }
        });
      });
    }
    
    // Wishlist functionality
    const wishlistButtons = document.querySelectorAll('.add-to-wishlist');
    if (wishlistButtons.length) {
      wishlistButtons.forEach(button => {
        button.addEventListener('click', () => {
          const icon = button.querySelector('i');
          
          if (icon.classList.contains('far')) {
            icon.classList.remove('far');
            icon.classList.add('fas');
            icon.style.color = '#dc3545';
            showToast('Product added to wishlist!', 'success');
          } else {
            icon.classList.remove('fas');
            icon.classList.add('far');
            icon.style.color = '';
            showToast('Product removed from wishlist!', 'info');
          }
        });
      });
    }
  }

  // Toast Notification System
  function showToast(message, type = 'info') {
    // Check for toast container
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.className = 'toast-container';
      document.body.appendChild(toastContainer);
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Add icon based on type
    let icon = '';
    switch(type) {
      case 'success': 
        icon = '<i class="fas fa-check-circle"></i>';
        break;
      case 'error':
        icon = '<i class="fas fa-exclamation-circle"></i>';
        break;
      case 'info':
        icon = '<i class="fas fa-info-circle"></i>';
        break;
      case 'warning':
        icon = '<i class="fas fa-exclamation-triangle"></i>';
        break;
    }
    
    toast.innerHTML = `
      <div class="toast-content">
        ${icon}
        <span>${message}</span>
      </div>
      <button class="toast-close"><i class="fas fa-times"></i></button>
    `;
    
    // Add to container
    toastContainer.appendChild(toast);
    
    // Add close button event
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
      toast.classList.add('toast-closing');
      setTimeout(() => {
        toast.remove();
        if (toastContainer.children.length === 0) {
          toastContainer.remove();
        }
      }, 300);
    });
    
    // Auto hide after 3 seconds
    setTimeout(() => {
      if (toast.parentNode) {
        toast.classList.add('toast-closing');
        setTimeout(() => {
          toast.remove();
          if (toastContainer.children.length === 0) {
            toastContainer.remove();
          }
        }, 300);
      }
    }, 3000);
  }

  // Search functionality
  if (searchInput) {
    // Check if there's a search query in URL
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('search');
    if (searchQuery) {
      searchInput.value = searchQuery;
    }
    
    // Add search event
    searchInput.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') {
        const searchTerm = searchInput.value.trim();
        const url = new URL(window.location);
        
        if (searchTerm) {
          url.searchParams.set('search', searchTerm);
        } else {
          url.searchParams.delete('search');
        }
        
        window.location.href = url.toString();
      }
    });
  }

  // Sort products
  if (sortSelect) {
    // Set initial value from URL or default
    const urlParams = new URLSearchParams(window.location.search);
    const sortParam = urlParams.get('sort');
    if (sortParam) {
      sortSelect.value = sortParam;
      state.currentSort = sortParam;
    }
    
    sortSelect.addEventListener('change', () => {
      state.currentSort = sortSelect.value;
      
      // Update URL
      const url = new URL(window.location);
      url.searchParams.set('sort', state.currentSort);
      window.history.pushState({}, '', url);
      
      // Reload products
      fetchProducts();
    });
  }

  // View Toggle (Grid/List)
  const viewButtons = document.querySelectorAll('.view-option');
  if (viewButtons.length && productsGrid) {
    viewButtons.forEach(button => {
      button.addEventListener('click', () => {
        viewButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        if (button.classList.contains('list-view')) {
          productsGrid.classList.add('list-view');
          localStorage.setItem('viewMode', 'list');
        } else {
          productsGrid.classList.remove('list-view');
          localStorage.setItem('viewMode', 'grid');
        }
      });
    });
    
    // Check saved view mode preference
    const savedViewMode = localStorage.getItem('viewMode');
    if (savedViewMode === 'list') {
      productsGrid.classList.add('list-view');
      viewButtons.forEach(btn => {
        btn.classList.toggle('active', btn.classList.contains('list-view'));
      });
    }
  }

  // Check for category parameter in URL
  const urlParams = new URLSearchParams(window.location.search);
  const categoryParam = urlParams.get('category');
  if (categoryParam) {
    state.currentCategory = categoryParam;
  }

  // Initialize
  async function init() {
    try {
      await fetchCategories();
      await fetchProducts();
    } catch (error) {
      console.error('Initialization error:', error);
      showError('Failed to initialize shop. Please try again later.');
    }
  }

  // Start initialization
  init();
});