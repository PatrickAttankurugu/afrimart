/*
* AfriMart Depot - Shop Page JavaScript
* Version: 2.0
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

  // State Management
  const state = {
    products: [],
    categories: [],
    currentCategory: 'all',
    currentSort: 'popularity',
    priceRange: {
      min: 0,
      max: 50
    },
    loading: false,
    error: null
  };

  // DOM Elements
  const productsGrid = document.querySelector('.products-grid');
  const categoryLinks = document.querySelectorAll('.category-link');
  const sortSelect = document.getElementById('sort-by');
  const priceFilterBtn = document.querySelector('.filter-price-btn');
  const loadMoreBtn = document.querySelector('.load-more-btn');

  // Loading indicator
  function showLoading() {
    state.loading = true;
    
    if (productsGrid) {
      // Create loading spinner if it doesn't exist
      let loadingEl = document.getElementById('products-loading');
      if (!loadingEl) {
        loadingEl = document.createElement('div');
        loadingEl.id = 'products-loading';
        loadingEl.className = 'loading-spinner';
        loadingEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i><p>Loading products...</p>';
        productsGrid.parentNode.insertBefore(loadingEl, productsGrid);
      } else {
        loadingEl.style.display = 'flex';
      }
      
      // Hide products grid while loading
      productsGrid.style.opacity = '0.5';
    }
  }

  function hideLoading() {
    state.loading = false;
    
    const loadingEl = document.getElementById('products-loading');
    if (loadingEl) {
      loadingEl.style.display = 'none';
    }
    
    if (productsGrid) {
      productsGrid.style.opacity = '1';
    }
  }

  // Error handling
  function showError(message) {
    state.error = message;
    
    const errorEl = document.getElementById('products-error') || document.createElement('div');
    errorEl.id = 'products-error';
    errorEl.className = 'error-message';
    errorEl.innerHTML = `<i class="fas fa-exclamation-circle"></i><p>${message}</p>`;
    
    if (!document.getElementById('products-error') && productsGrid) {
      productsGrid.parentNode.insertBefore(errorEl, productsGrid);
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
        // Map frontend sort options to API sort parameters
        const sortMap = {
          'popularity': 'popularity',
          'price-low': 'price_low',
          'price-high': 'price_high',
          'newest': 'newest',
          'name': 'name'
        };
        
        params.append('sort', sortMap[state.currentSort] || 'newest');
      }
      
      // Check for search parameter in URL
      const urlParams = new URLSearchParams(window.location.search);
      const searchQuery = urlParams.get('search');
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      
      // Make API request using the ApiService
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
      // Make API request using ApiService
      const response = await window.ApiService.get('/categories');
      
      if (response.success) {
        state.categories = response.categories;
        updateCategoryLinks();
      } else {
        console.error('API Error:', response.error);
      }
    } catch (error) {
      console.error('Fetch Error:', error);
    }
  }

  // Update category links with counts from API
  function updateCategoryLinks() {
    if (!categoryLinks.length || !state.categories.length) return;
    
    categoryLinks.forEach(link => {
      const categorySlug = link.getAttribute('data-category');
      const countElement = link.querySelector('.category-count');
      
      if (categorySlug === 'all') {
        // Update "All Products" count
        const totalProducts = state.categories.reduce((total, cat) => total + cat.product_count, 0);
        if (countElement) {
          countElement.textContent = totalProducts;
        }
      } else {
        // Update specific category count
        const category = state.categories.find(cat => cat.slug === categorySlug);
        if (category && countElement) {
          countElement.textContent = category.product_count;
        }
      }
    });
  }

  // Render products to the grid
  function renderProducts() {
    if (!productsGrid || !state.products.length) return;
    
    // Clear existing products
    productsGrid.innerHTML = '';
    
    // Generate HTML for each product
    state.products.forEach(product => {
      const productCard = document.createElement('div');
      productCard.className = 'product-card visible';
      productCard.dataset.category = product.category ? product.category.slug : '';
      productCard.dataset.productId = product.id;
      
      // Create badge for sale items or featured products
      let badgeHtml = '';
      if (product.is_on_sale) {
        badgeHtml = `<div class="product-badge">${product.discount_percentage}% OFF</div>`;
      } else if (product.is_featured) {
        badgeHtml = `<div class="product-badge">Featured</div>`;
      }
      
      // Create price HTML
      let priceHtml = '';
      if (product.old_price) {
        priceHtml = `
          <span class="price">$${product.price.toFixed(2)}</span>
          <span class="old-price">$${product.old_price.toFixed(2)}</span>
        `;
      } else {
        priceHtml = `<span class="price">$${product.price.toFixed(2)}</span>`;
      }
      
      // Create product card HTML
      productCard.innerHTML = `
        ${badgeHtml}
        <div class="product-image">
          <img src="${product.image_main || 'images/placeholder.jpg'}" alt="${product.title}">
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
          <div class="product-description">
            <p>${product.description ? product.description.substring(0, 100) + '...' : ''}</p>
          </div>
          <div class="product-rating">
            <i class="fas fa-star"></i>
            <i class="fas fa-star"></i>
            <i class="fas fa-star"></i>
            <i class="fas fa-star"></i>
            <i class="fas fa-star-half-alt"></i>
            <span>(${Math.floor(Math.random() * 30) + 5})</span>
          </div>
          <div class="product-price">
            ${priceHtml}
            <span class="unit">${product.unit || ''}</span>
          </div>
          <button class="add-to-cart">Add to Cart</button>
        </div>
      `;
      
      // Add the product card to the grid
      productsGrid.appendChild(productCard);
    });
    
    // If no products found
    if (state.products.length === 0) {
      productsGrid.innerHTML = `
        <div class="no-products-found">
          <i class="fas fa-search"></i>
          <h3>No products found</h3>
          <p>Try adjusting your search or filter criteria</p>
        </div>
      `;
    }
    
    // Reinitialize product card events
    initProductCards();
  }

  // Initialize product card events
  function initProductCards() {
    // Quick View functionality
    const quickViewButtons = document.querySelectorAll('.quick-view');
    if (quickViewButtons.length) {
      quickViewButtons.forEach(button => {
        button.addEventListener('click', function() {
          const productSlug = this.getAttribute('data-product');
          openQuickView(productSlug);
        });
      });
    }
    
    // Add to Cart functionality
    const addToCartButtons = document.querySelectorAll('.add-to-cart');
    if (addToCartButtons.length) {
      addToCartButtons.forEach(button => {
        button.addEventListener('click', function() {
          const productCard = this.closest('.product-card');
          const productId = parseInt(productCard.dataset.productId);
          
          // Find product data
          const product = state.products.find(p => p.id === productId);
          
          if (product) {
            window.CartService.addToCart(product);
            
            // Update UI
            const originalText = this.textContent;
            this.innerHTML = '<i class="fas fa-check"></i> Added!';
            this.style.backgroundColor = '#28a745';
            
            // Show notification
            showToast(`${product.title} added to cart!`, 'success');
            
            setTimeout(() => {
              this.innerHTML = originalText;
              this.style.backgroundColor = '';
            }, 1500);
          }
        });
      });
    }
    
    // Wishlist functionality
    const wishlistButtons = document.querySelectorAll('.add-to-wishlist');
    if (wishlistButtons.length) {
      wishlistButtons.forEach(button => {
        button.addEventListener('click', function() {
          const icon = this.querySelector('i');
          
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
    
    // Enhanced hover effects
    const productCards = document.querySelectorAll('.product-card');
    productCards.forEach(card => {
      card.addEventListener('mouseenter', function() {
        const actions = this.querySelector('.product-actions');
        const img = this.querySelector('.product-image img');
        
        if (actions) {
          actions.style.opacity = '1';
          actions.style.transform = 'translateX(0)';
        }
        
        if (img) {
          img.style.transform = 'scale(1.05)';
        }
      });
      
      card.addEventListener('mouseleave', function() {
        const actions = this.querySelector('.product-actions');
        const img = this.querySelector('.product-image img');
        
        if (actions) {
          actions.style.opacity = '0';
          actions.style.transform = 'translateX(20px)';
        }
        
        if (img) {
          img.style.transform = 'scale(1)';
        }
      });
    });
  }

  // Update results count
  function updateResultsCount() {
    const resultsCountEl = document.querySelector('.shop-results-count p');
    
    if (resultsCountEl) {
      const visibleProducts = state.products.length;
      const totalProducts = state.categories.reduce((total, cat) => total + cat.product_count, 0);
      
      resultsCountEl.textContent = `Showing ${visibleProducts > 0 ? '1' : '0'}-${visibleProducts} of ${totalProducts} results`;
    }
  }

  // Open Quick View Modal
  async function openQuickView(productSlug) {
    const quickViewModal = document.querySelector('.quick-view-modal');
    if (!quickViewModal) return;
    
    try {
      // Show loading state in modal
      quickViewModal.classList.add('active');
      quickViewModal.querySelector('.modal-content').innerHTML = `
        <div class="loading-spinner">
          <i class="fas fa-spinner fa-spin"></i>
          <p>Loading product details...</p>
        </div>
      `;
      
      // Fetch product details using ApiService
      const response = await window.ApiService.get(`/products/${productSlug}`);
      
      if (response.success) {
        const product = response.product;
        
        // Format price display
        let priceHtml = '';
        if (product.old_price) {
          priceHtml = `
            <span class="current-price">$${product.price.toFixed(2)}</span>
            <span class="old-price">$${product.old_price.toFixed(2)}</span>
          `;
        } else {
          priceHtml = `<span class="current-price">$${product.price.toFixed(2)}</span>`;
        }
        
        // Create star rating
        const stars = `
          <i class="fas fa-star"></i>
          <i class="fas fa-star"></i>
          <i class="fas fa-star"></i>
          <i class="fas fa-star"></i>
          <i class="fas fa-star-half-alt"></i>
        `;
        
        // Generate modal content
        const modalContent = `
          <div class="product-quick-view">
            <div class="product-images">
              <div class="main-image">
                <img src="${product.image_main || 'images/placeholder.jpg'}" alt="${product.title}">
              </div>
              <div class="thumbnail-images">
                <div class="thumbnail active">
                  <img src="${product.image_main || 'images/placeholder.jpg'}" alt="Thumbnail 1">
                </div>
                ${product.additional_images && product.additional_images.length ? 
                  product.additional_images.map((img, i) => `
                    <div class="thumbnail">
                      <img src="${img.image_path}" alt="Thumbnail ${i + 2}">
                    </div>
                  `).join('') : ''}
              </div>
            </div>
            <div class="product-details">
              <h2 class="product-title">${product.title}</h2>
              <div class="product-rating">
                <div class="stars">
                  ${stars}
                </div>
                <span class="review-count">(${Math.floor(Math.random() * 40) + 10} reviews)</span>
              </div>
              <div class="product-price">
                ${priceHtml}
                <span class="unit">${product.unit || ''}</span>
              </div>
              <div class="product-description">
                <p>${product.description || 'No description available.'}</p>
              </div>
              <div class="product-meta">
                <div class="meta-item">
                  <span class="meta-label">Category:</span>
                  <span class="meta-value">${product.category ? product.category.name : 'Uncategorized'}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">SKU:</span>
                  <span class="meta-value">${product.sku || 'N/A'}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Availability:</span>
                  <span class="meta-value ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}">
                    ${product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                  </span>
                </div>
              </div>
              <div class="product-quantity">
                <label>Quantity:</label>
                <div class="quantity-selector">
                  <button class="quantity-btn minus">-</button>
                  <input type="number" class="quantity-input" value="1" min="1" max="${product.stock}" ${product.stock <= 0 ? 'disabled' : ''}>
                  <button class="quantity-btn plus">+</button>
                </div>
              </div>
              <div class="product-actions">
                <button class="btn btn-primary add-to-cart-btn" data-product-id="${product.id}" ${product.stock <= 0 ? 'disabled' : ''}>
                  Add to Cart
                </button>
                <a href="product-details.html?product=${product.slug}" class="btn btn-secondary">View Details</a>
                <button class="wishlist-btn">
                  <i class="far fa-heart"></i>
                  <span>Add to Wishlist</span>
                </button>
              </div>
            </div>
          </div>
        `;
        
        // Update modal content
        quickViewModal.querySelector('.modal-content').innerHTML = modalContent;
        
        // Initialize quantity selector
        initQuantitySelector(quickViewModal);
        
        // Initialize add to cart button
        const addToCartBtn = quickViewModal.querySelector('.add-to-cart-btn');
        if (addToCartBtn) {
          addToCartBtn.addEventListener('click', function() {
            const productId = parseInt(this.getAttribute('data-product-id'));
            const quantityInput = quickViewModal.querySelector('.quantity-input');
            const quantity = parseInt(quantityInput.value) || 1;
            
            window.CartService.addToCart(product, quantity);
            
            // Show success message
            showToast(`${product.title} added to cart!`, 'success');
            
            // Close modal
            quickViewModal.classList.remove('active');
          });
        }
        
        // Initialize thumbnail switching
        const thumbnails = quickViewModal.querySelectorAll('.thumbnail');
        const mainImage = quickViewModal.querySelector('.main-image img');
        
        if (thumbnails.length && mainImage) {
          thumbnails.forEach(thumb => {
            thumb.addEventListener('click', function() {
              thumbnails.forEach(t => t.classList.remove('active'));
              this.classList.add('active');
              
              const thumbImg = this.querySelector('img');
              if (thumbImg) {
                mainImage.src = thumbImg.src;
              }
            });
          });
        }
      } else {
        quickViewModal.querySelector('.modal-content').innerHTML = `
          <div class="error-message">
            <i class="fas fa-exclamation-circle"></i>
            <p>Failed to load product details. Please try again.</p>
          </div>
        `;
      }
    } catch (error) {
      console.error('Quick View Error:', error);
      quickViewModal.querySelector('.modal-content').innerHTML = `
        <div class="error-message">
          <i class="fas fa-exclamation-circle"></i>
          <p>An error occurred. Please try again.</p>
        </div>
      `;
    }
    
    // Add close functionality
    const modalOverlay = quickViewModal.querySelector('.modal-overlay');
    const modalClose = quickViewModal.querySelector('.modal-close');
    
    if (modalOverlay) {
      modalOverlay.addEventListener('click', closeQuickView);
    }
    
    if (modalClose) {
      modalClose.addEventListener('click', closeQuickView);
    }
    
    // Close on escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && quickViewModal.classList.contains('active')) {
        closeQuickView();
      }
    });
    
    function closeQuickView() {
      quickViewModal.classList.remove('active');
    }
  }

  // Initialize quantity selector in modal
  function initQuantitySelector(container) {
    const minusBtn = container.querySelector('.minus');
    const plusBtn = container.querySelector('.plus');
    const input = container.querySelector('.quantity-input');
    
    if (minusBtn && plusBtn && input) {
      minusBtn.addEventListener('click', function() {
        let value = parseInt(input.value);
        value = Math.max(1, value - 1);
        input.value = value;
      });
      
      plusBtn.addEventListener('click', function() {
        let value = parseInt(input.value);
        const max = parseInt(input.getAttribute('max') || 10);
        value = Math.min(max, value + 1);
        input.value = value;
      });
      
      input.addEventListener('input', function() {
        let value = parseInt(this.value);
        const min = parseInt(this.getAttribute('min') || 1);
        const max = parseInt(this.getAttribute('max') || 10);
        
        if (isNaN(value) || value < min) {
          this.value = min;
        } else if (value > max) {
          this.value = max;
        }
      });
    }
  }

  // Toast Notification System
  function showToast(message, type = 'info') {
    // Check if toast container exists, create if not
    let toastContainer = document.querySelector('.toast-container');
    
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.className = 'toast-container';
      document.body.appendChild(toastContainer);
      
      // Add styles
      toastContainer.style.position = 'fixed';
      toastContainer.style.bottom = '20px';
      toastContainer.style.right = '20px';
      toastContainer.style.zIndex = '9999';
      toastContainer.style.display = 'flex';
      toastContainer.style.flexDirection = 'column';
      toastContainer.style.alignItems = 'flex-end';
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Create toast content
    let icon = '';
    switch (type) {
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
    
    // Style the toast
    toast.style.backgroundColor = type === 'success' ? '#28a745' : 
                              type === 'error' ? '#dc3545' : 
                              type === 'warning' ? '#ffc107' : '#17a2b8';
    toast.style.color = type === 'warning' ? '#212529' : '#fff';
    toast.style.padding = '12px 20px';
    toast.style.borderRadius = '4px';
    toast.style.marginTop = '10px';
    toast.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
    toast.style.display = 'flex';
    toast.style.justifyContent = 'space-between';
    toast.style.alignItems = 'center';
    toast.style.minWidth = '250px';
    toast.style.transform = 'translateX(100%)';
    toast.style.opacity = '0';
    toast.style.transition = 'all 0.3s ease-in-out';
    
    // Close button
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.style.background = 'none';
    closeBtn.style.border = 'none';
    closeBtn.style.color = 'inherit';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.padding = '0';
    closeBtn.style.marginLeft = '10px';
    
    closeBtn.addEventListener('click', function() {
      removeToast(toast);
    });
    
    // Add to container
    toastContainer.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => {
      toast.style.transform = 'translateX(0)';
      toast.style.opacity = '1';
    }, 10);
    
    // Auto remove after delay
    setTimeout(() => {
      removeToast(toast);
    }, 3000);
    
    function removeToast(toast) {
      toast.style.transform = 'translateX(100%)';
      toast.style.opacity = '0';
      
      setTimeout(() => {
        toast.remove();
        
        // Remove container if empty
        if (toastContainer.children.length === 0) {
          toastContainer.remove();
        }
      }, 300);
    }
  }

  // Category Filtering
  if (categoryLinks.length) {
    categoryLinks.forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Update active link
        categoryLinks.forEach(item => item.classList.remove('active'));
        this.classList.add('active');
        
        // Get selected category
        state.currentCategory = this.getAttribute('data-category');
        
        // Fetch products with new category filter
        fetchProducts();
      });
    });
    
    // Check for URL parameter to filter on page load
    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = urlParams.get('category');
    
    if (categoryParam) {
      const categoryLink = document.querySelector(`.category-link[data-category="${categoryParam}"]`);
      if (categoryLink) {
        state.currentCategory = categoryParam;
        
        // Update active link
        categoryLinks.forEach(item => item.classList.remove('active'));
        categoryLink.classList.add('active');
      }
    }
  }

  // Sort Products
  if (sortSelect) {
    sortSelect.addEventListener('change', function() {
      state.currentSort = this.value;
      fetchProducts();
    });
  }

  // Price Range Filter
  if (priceFilterBtn) {
    priceFilterBtn.addEventListener('click', function() {
      const minPrice = parseFloat(document.querySelector('.price-range-from .price-value').textContent.replace('$', ''));
      const maxPrice = parseFloat(document.querySelector('.price-range-to .price-value').textContent.replace('$', ''));
      
      // Validate price range
      if (minPrice > maxPrice) {
        showToast('Minimum price cannot be greater than maximum price', 'error');
        return;
      }
      
      // Update state
      state.priceRange.min = minPrice;
      state.priceRange.max = maxPrice;
      
      // Add price range to URL parameters for API request
      const params = new URLSearchParams(window.location.search);
      params.set('min_price', minPrice);
      params.set('max_price', maxPrice);
      
      // Update browser URL without reload
      window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
      
      // Fetch products with filters
      fetchProducts();
    });
  }

  // View Toggle (Grid/List)
  const viewButtons = document.querySelectorAll('.view-option');
  
  if (viewButtons.length && productsGrid) {
    viewButtons.forEach(button => {
      button.addEventListener('click', function() {
        viewButtons.forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        
        if (this.classList.contains('list-view')) {
          productsGrid.classList.add('list-view');
        } else {
          productsGrid.classList.remove('list-view');
        }
      });
    });
  }

  // Load More Products
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', function() {
      this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
      this.disabled = true;
      
      // In a real implementation, this would fetch the next page of products
      // For now, just show a message
      setTimeout(() => {
        this.textContent = 'No More Products';
        this.disabled = true;
        
        showToast('All products have been loaded', 'info');
      }, 1500);
    });
  }

  // Pagination
  const paginationLinks = document.querySelectorAll('.page-link');
  
  if (paginationLinks.length) {
    paginationLinks.forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        
        paginationLinks.forEach(item => item.classList.remove('active'));
        this.classList.add('active');
        
        // This would normally load the corresponding page
        // For now, just scroll to top
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      });
    });
  }

  // Initialize on page load
  async function initPage() {
    // Fetch categories first
    await fetchCategories();
    
    // Then fetch products
    await fetchProducts();
  }

  // Check if ApiService is available
  if (window.ApiService) {
    // Start initialization
    initPage();
  } else {
    console.error('ApiService not found. Make sure api-service.js is loaded before shop.js');
    showError('Could not connect to product service. Please try again later.');
  }
});