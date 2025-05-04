/*
* AfriMart Depot - Shop Page JavaScript
* Version: 2.5 - Added dynamic product loading from localStorage and S3
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
  // DOM Elements
  // ==================

  // Category filtering
  const categoryLinks = document.querySelectorAll('.category-link');
  const productCards = document.querySelectorAll('.product-card');
  
  // Product view and sorting
  const sortSelect = document.getElementById('sort-by');
  const viewButtons = document.querySelectorAll('.view-option');
  const productsGrid = document.querySelector('.products-grid');
  
  // Quick view modal
  const quickViewButtons = document.querySelectorAll('.quick-view');
  const quickViewModal = document.querySelector('.quick-view-modal');
  
  // Price range filter
  const priceFilterBtn = document.querySelector('.filter-price-btn');
  const priceFromValue = document.querySelector('.price-range-from .price-value');
  const priceToValue = document.querySelector('.price-range-to .price-value');

  // Load more products button
  const loadMoreBtn = document.querySelector('.load-more-btn');
  
  // Pagination
  const paginationLinks = document.querySelectorAll('.page-link');

  // ==================
  // S3 Integration Functions
  // ==================
  
  async function getProductsFromS3() {
    try {
      const response = await fetch(`${API_BASE_URL}/get-products`);
      if (!response.ok) throw new Error('Failed to get products from S3');
      
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error getting products from S3:', error);
      // Fallback to localStorage
      const savedProducts = localStorage.getItem('afrimart_products');
      return savedProducts ? JSON.parse(savedProducts) : [];
    }
  }
  
  // ==================
  // Load Products from localStorage and S3
  // ==================
  
  async function loadProductsFromStorage() {
    // First try to get from S3
    const products = await getProductsFromS3();
    const productsGrid = document.querySelector('.products-grid');
    
    if (!productsGrid) return;
    
    // Save the "load more" button and pagination if they exist
    const loadMoreSection = productsGrid.querySelector('.load-more');
    const paginationSection = productsGrid.querySelector('.pagination');
    
    // Clear existing products
    productsGrid.innerHTML = '';
    
    if (products.length === 0) {
      productsGrid.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; padding: 40px;">No products available yet.</p>';
      if (loadMoreSection) productsGrid.appendChild(loadMoreSection);
      if (paginationSection) productsGrid.appendChild(paginationSection);
      return;
    }
    
    products.forEach((product, index) => {
      const productCard = createProductCard(product, index);
      productsGrid.appendChild(productCard);
    });
    
    // Re-add load more and pagination sections
    if (loadMoreSection) productsGrid.appendChild(loadMoreSection);
    if (paginationSection) productsGrid.appendChild(paginationSection);
    
    // Update the results count
    updateResultsCount();
    
    // Reinitialize all dynamic features
    initializeProductFeatures();
  }
  
  function createProductCard(product, index) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.setAttribute('data-category', product.category);
    card.setAttribute('data-product-id', product.id);
    card.setAttribute('data-aos', 'fade-up');
    card.setAttribute('data-aos-delay', (index % 4) * 100);
    
    const badgeHtml = product.badge ? `<div class="product-badge ${product.badge.replace(/\s+/g, '-').toLowerCase()}">${product.badge}</div>` : '';
    
    card.innerHTML = `
      ${badgeHtml}
      <div class="product-image">
        <img src="${product.image}" alt="${product.name}">
        <div class="product-actions">
          <button class="action-btn quick-view" data-product="${product.id}">
            <i class="fas fa-eye"></i>
          </button>
          <button class="action-btn add-to-wishlist">
            <i class="far fa-heart"></i>
          </button>
        </div>
      </div>
      <div class="product-info">
        <h3 class="product-title">
          <a href="product-details.html?product=${product.id}">${product.name}</a>
        </h3>
        <div class="product-description">
          <p>${product.description || ''}</p>
        </div>
        <div class="product-rating">
          <i class="fas fa-star"></i>
          <i class="fas fa-star"></i>
          <i class="fas fa-star"></i>
          <i class="fas fa-star"></i>
          <i class="fas fa-star-half-alt"></i>
          <span>(${Math.floor(Math.random() * 50) + 10})</span>
        </div>
        <div class="product-price">
          <span class="price">${product.price}</span>
          <span class="unit">${product.unit}</span>
        </div>
        <button class="add-to-cart">Add to Cart</button>
      </div>
    `;
    
    return card;
  }
  
  function initializeProductFeatures() {
    // Reinitialize all product features
    setupProductHoverEffects();
    setupAddToCartButtons();
    setupWishlistButtons();
    setupQuickView();
    setupQuantitySelectors();
    
    // Reinitialize AOS for new elements
    if (typeof AOS !== 'undefined') {
      AOS.refresh();
    }
  }
  
  // ==================
  // Category Filtering
  // ==================
  
  if (categoryLinks.length) {
    // Function to update results count display
    function updateResultsCount() {
      const allProducts = document.querySelectorAll('.product-card');
      const visibleProducts = document.querySelectorAll('.product-card:not([style*="display: none"])');
      const resultsCountEl = document.querySelector('.shop-results-count p');
      
      if (resultsCountEl) {
        resultsCountEl.textContent = `Showing 1-${visibleProducts.length} of ${allProducts.length} results`;
      }
    }
    
    // Add click event to category links
    categoryLinks.forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Update active link
        categoryLinks.forEach(item => item.classList.remove('active'));
        this.classList.add('active');
        
        const selectedCategory = this.getAttribute('data-category');
        const allProducts = document.querySelectorAll('.product-card');
        
        // Filter products
        allProducts.forEach(card => {
          if (selectedCategory === 'all' || card.getAttribute('data-category') === selectedCategory) {
            card.style.display = 'flex';
            setTimeout(() => {
              card.classList.add('visible');
            }, 10);
          } else {
            card.classList.remove('visible');
            setTimeout(() => {
              card.style.display = 'none';
            }, 300);
          }
        });
        
        // Update results count
        updateResultsCount();
      });
    });
    
    // Check for URL parameter to filter on page load
    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = urlParams.get('category');
    
    if (categoryParam) {
      const categoryLink = document.querySelector(`.category-link[data-category="${categoryParam}"]`);
      if (categoryLink) {
        categoryLink.click();
      }
    }
  }
  
  // ==================
  // Product Sorting
  // ==================
  
  if (sortSelect && productsGrid) {
    sortSelect.addEventListener('change', function() {
      const sortValue = this.value;
      
      if (productsGrid) {
        const products = Array.from(productsGrid.querySelectorAll('.product-card'));
        
        products.sort((a, b) => {
          const getPriceValue = (el) => {
            const priceEl = el.querySelector('.price');
            return priceEl ? parseFloat(priceEl.textContent.replace('$', '')) : 0;
          };
          
          switch (sortValue) {
            case 'price-low':
              return getPriceValue(a) - getPriceValue(b);
            case 'price-high':
              return getPriceValue(b) - getPriceValue(a);
            case 'newest':
              // Using data attribute for date if available, otherwise DOM order
              const getDateValue = (el) => {
                return el.dataset.date ? new Date(el.dataset.date).getTime() : 0;
              };
              return getDateValue(b) - getDateValue(a);
            default: // popularity - based on rating count
              const getRatingCount = (el) => {
                const ratingCountEl = el.querySelector('.product-rating span');
                return ratingCountEl ? parseInt(ratingCountEl.textContent.replace(/[()]/g, '')) : 0;
              };
              return getRatingCount(b) - getRatingCount(a);
          }
        });
        
        // Remove products from DOM and append in new order
        const loadMore = productsGrid.querySelector('.load-more');
        const pagination = productsGrid.querySelector('.pagination');
        
        products.forEach(product => {
          productsGrid.appendChild(product);
        });
        
        // Re-add load more and pagination
        if (loadMore) productsGrid.appendChild(loadMore);
        if (pagination) productsGrid.appendChild(pagination);
      }
    });
  }
  
  // ==================
  // View Toggle (Grid/List)
  // ==================
  
  if (viewButtons.length && productsGrid) {
    viewButtons.forEach(button => {
      button.addEventListener('click', function() {
        // Update active button
        viewButtons.forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        
        // Toggle view
        if (this.classList.contains('list-view')) {
          productsGrid.classList.add('list-view');
          // Save preference to localStorage
          localStorage.setItem('afrimart_shop_view', 'list');
        } else {
          productsGrid.classList.remove('list-view');
          // Save preference to localStorage
          localStorage.setItem('afrimart_shop_view', 'grid');
        }
      });
    });
    
    // Load saved view preference on page load
    const savedView = localStorage.getItem('afrimart_shop_view');
    if (savedView === 'list') {
      productsGrid.classList.add('list-view');
      viewButtons.forEach(btn => {
        btn.classList.toggle('active', btn.classList.contains('list-view'));
      });
    }
  }
  
  // ==================
  // Quick View Functionality
  // ==================
  
  function setupQuickView() {
    const quickViewButtons = document.querySelectorAll('.quick-view');
    const quickViewModal = document.querySelector('.quick-view-modal');
    
    if (quickViewButtons.length && quickViewModal) {
      const modalOverlay = quickViewModal.querySelector('.modal-overlay');
      const modalClose = quickViewModal.querySelector('.modal-close');
      const productTitle = quickViewModal.querySelector('.product-title');
      const productImage = quickViewModal.querySelector('.main-image img');
      const productPrice = quickViewModal.querySelector('.current-price');
      const productUnit = quickViewModal.querySelector('.unit');
      const productDescription = quickViewModal.querySelector('.product-description p');
      const productCategory = quickViewModal.querySelector('.meta-value');
      const productRating = quickViewModal.querySelector('.stars');
      const reviewCount = quickViewModal.querySelector('.review-count');
      
      // Function to open modal with product data
      function openQuickViewModal(product) {
        if (!productTitle || !productImage || !productPrice) return;
        
        // Update modal content
        productTitle.textContent = product.title;
        productImage.src = product.image;
        productImage.alt = product.title;
        productPrice.textContent = product.price;
        
        if (productUnit) {
          productUnit.textContent = product.unit || '';
        }
        
        if (productDescription) {
          productDescription.textContent = product.description || '';
        }
        
        if (productCategory) {
          const category = product.category || '';
          productCategory.textContent = category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ');
        }
        
        if (productRating && product.rating) {
          productRating.innerHTML = product.rating;
        }
        
        if (reviewCount && product.reviewCount) {
          reviewCount.textContent = product.reviewCount;
        }
        
        // Update thumbnails (using the same image for all thumbnails if not provided)
        const thumbnails = quickViewModal.querySelectorAll('.thumbnail img');
        if (thumbnails.length) {
          thumbnails.forEach(thumb => {
            thumb.src = product.image;
            thumb.alt = product.title;
          });
        }
        
        // Add product ID to add to cart button
        const addToCartBtn = quickViewModal.querySelector('.add-to-cart-btn');
        if (addToCartBtn) {
          addToCartBtn.setAttribute('data-product-id', product.id || '');
        }
        
        // Show modal
        quickViewModal.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
      
      // Function to close modal
      function closeModal() {
        quickViewModal.classList.remove('active');
        document.body.style.overflow = 'auto';
      }
      
      // Add click event to quick view buttons
      quickViewButtons.forEach(button => {
        button.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          
          const productCard = this.closest('.product-card');
          if (!productCard) return;
          
          // Get product data
          const productId = productCard.dataset.productId || productCard.dataset.id || '';
          const title = productCard.querySelector('.product-title a').textContent;
          const image = productCard.querySelector('.product-image img').src;
          const price = productCard.querySelector('.price').textContent;
          const unit = productCard.querySelector('.unit')?.textContent || '';
          const description = productCard.querySelector('.product-description p')?.textContent || '';
          const category = productCard.getAttribute('data-category') || '';
          const rating = productCard.querySelector('.product-rating')?.innerHTML || '';
          const reviewCountEl = productCard.querySelector('.product-rating span');
          const reviewCount = reviewCountEl ? `(${reviewCountEl.textContent})` : '';
          
          // Create product object
          const product = {
            id: productId,
            title: title,
            image: image,
            price: price,
            unit: unit,
            description: description,
            category: category,
            rating: rating,
            reviewCount: reviewCount
          };
          
          // Open modal with product data
          openQuickViewModal(product);
        });
      });
      
      // Close modal on click outside or close button
      if (modalOverlay) {
        modalOverlay.addEventListener('click', closeModal);
      }
      
      if (modalClose) {
        modalClose.addEventListener('click', closeModal);
      }
      
      // Close modal on escape key
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && quickViewModal.classList.contains('active')) {
          closeModal();
        }
      });
      
      // Handle add to cart button in modal
      const modalAddToCartBtn = quickViewModal.querySelector('.add-to-cart-btn');
      if (modalAddToCartBtn) {
        modalAddToCartBtn.addEventListener('click', function() {
          const productId = this.getAttribute('data-product-id');
          const title = productTitle.textContent;
          const price = productPrice.textContent;
          const image = productImage.src;
          
          // Get quantity if there's a quantity input
          let quantity = 1;
          const quantityInput = quickViewModal.querySelector('.quantity-input');
          if (quantityInput) {
            quantity = parseInt(quantityInput.value) || 1;
          }
          
          // Create product object
          const product = {
            id: productId,
            title: title,
            price: price,
            quantity: quantity,
            image: image
          };
          
          // Add to cart using global function
          if (typeof window.AfriMartCart !== 'undefined' && typeof window.AfriMartCart.addToCart === 'function') {
            window.AfriMartCart.addToCart(product);
          } else if (typeof window.addToCart === 'function') {
            window.addToCart(product);
          } else {
            console.error('addToCart function not found. Make sure cart.js is loaded before shop.js');
            
            // Fallback implementation
            this.innerHTML = '<i class="fas fa-check"></i> Added!';
            this.classList.add('added');
            
            setTimeout(() => {
              this.innerHTML = 'Add to Cart';
              this.classList.remove('added');
            }, 1500);
          }
          
          // Close modal after adding to cart
          setTimeout(() => {
            closeModal();
          }, 1000);
        });
      }
    }
  }
  
  // ==================
  // Quantity Selector
  // ==================
  
  function setupQuantitySelectors() {
    const quantitySelectors = document.querySelectorAll('.quantity-selector');
    
    if (quantitySelectors.length) {
      quantitySelectors.forEach(selector => {
        const minusBtn = selector.querySelector('.minus');
        const plusBtn = selector.querySelector('.plus');
        const input = selector.querySelector('.quantity-input');
        
        if (minusBtn && plusBtn && input) {
          // Decrease quantity
          minusBtn.addEventListener('click', function() {
            let value = parseInt(input.value);
            value = Math.max(1, value - 1);
            input.value = value;
            
            // Trigger change event
            input.dispatchEvent(new Event('change'));
          });
          
          // Increase quantity
          plusBtn.addEventListener('click', function() {
            let value = parseInt(input.value);
            const max = parseInt(input.getAttribute('max') || 99);
            value = Math.min(max, value + 1);
            input.value = value;
            
            // Trigger change event
            input.dispatchEvent(new Event('change'));
          });
          
          // Direct input
          input.addEventListener('change', function() {
            let value = parseInt(this.value);
            const min = parseInt(this.getAttribute('min') || 1);
            const max = parseInt(this.getAttribute('max') || 99);
            
            if (isNaN(value) || value < min) {
              value = min;
            } else if (value > max) {
              value = max;
            }
            
            this.value = value;
          });
        }
      });
    }
  }
  
  // ==================
  // Thumbnail Selection
  // ==================
  
  function setupThumbnailGallery() {
    const thumbnails = document.querySelectorAll('.thumbnail');
    const mainImage = document.querySelector('.main-image img');
    
    if (thumbnails.length && mainImage) {
      thumbnails.forEach(thumbnail => {
        thumbnail.addEventListener('click', function() {
          // Update active state
          thumbnails.forEach(item => item.classList.remove('active'));
          this.classList.add('active');
          
          // Update main image
          const thumbnailImg = this.querySelector('img');
          if (thumbnailImg) {
            mainImage.src = thumbnailImg.src;
            mainImage.alt = thumbnailImg.alt;
          }
        });
      });
    }
  }
  
  // ==================
  // Add to Cart
  // ==================
  
  function setupAddToCartButtons() {
    const addToCartButtons = document.querySelectorAll('.add-to-cart');
    
    if (addToCartButtons.length) {
      addToCartButtons.forEach(button => {
        button.addEventListener('click', function(e) {
          e.preventDefault();
          
          // Get product info from the product card
          const productCard = this.closest('.product-card');
          if (!productCard) return;
          
          // Get product data
          const productId = productCard.dataset.productId || productCard.dataset.id || `product_${Date.now()}`;
          const productTitle = productCard.querySelector('.product-title a')?.textContent || 'Product';
          const productImage = productCard.querySelector('.product-image img')?.src || '';
          const productPrice = productCard.querySelector('.price')?.textContent || '$0.00';
          
          // Get quantity if available
          let quantity = 1;
          const quantityInput = productCard.querySelector('.quick-quantity');
          if (quantityInput) {
            quantity = parseInt(quantityInput.value) || 1;
          }
          
          // Create product object
          const product = {
            id: productId,
            title: productTitle,
            price: productPrice,
            quantity: quantity,
            image: productImage
          };
          
          // Add to cart using the global function
          if (typeof window.AfriMartCart !== 'undefined' && typeof window.AfriMartCart.addToCart === 'function') {
            window.AfriMartCart.addToCart(product);
          } else if (typeof window.addToCart === 'function') {
            window.addToCart(product);
          } else {
            console.error('addToCart function not found. Make sure cart.js is loaded before shop.js');
            
            // Fallback visual feedback
            this.innerHTML = '<i class="fas fa-check"></i> Added!';
            this.classList.add('added');
            
            setTimeout(() => {
              this.innerHTML = 'Add to Cart';
              this.classList.remove('added');
            }, 1500);
          }
        });
      });
    }
  }
  
  // ==================
  // Quick Add Controls
  // ==================
  
  function setupQuickAddControls() {
    const quickAddControls = document.querySelectorAll('.quick-add-container');
    
    if (quickAddControls.length) {
      quickAddControls.forEach(container => {
        const minusBtn = container.querySelector('.quick-minus');
        const plusBtn = container.querySelector('.quick-plus');
        const input = container.querySelector('.quick-quantity');
        
        if (minusBtn && plusBtn && input) {
          // Decrease quantity
          minusBtn.addEventListener('click', function() {
            let value = parseInt(input.value);
            if (value > 1) {
              input.value = value - 1;
            }
          });
          
          // Increase quantity
          plusBtn.addEventListener('click', function() {
            let value = parseInt(input.value);
            const maxValue = parseInt(input.getAttribute('max') || 10);
            if (value < maxValue) {
              input.value = value + 1;
            }
          });
          
          // Manual input
          input.addEventListener('change', function() {
            let value = parseInt(this.value);
            const minValue = parseInt(this.getAttribute('min') || 1);
            const maxValue = parseInt(this.getAttribute('max') || 10);
            
            if (isNaN(value) || value < minValue) {
              value = minValue;
            } else if (value > maxValue) {
              value = maxValue;
            }
            
            this.value = value;
          });
        }
      });
    }
  }
  
  // ==================
  // Add to Wishlist
  // ==================
  
  function setupWishlistButtons() {
    const wishlistButtons = document.querySelectorAll('.add-to-wishlist, .wishlist-btn');
    
    if (wishlistButtons.length) {
      wishlistButtons.forEach(button => {
        button.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          
          const icon = this.querySelector('i');
          
          if (icon) {
            if (icon.classList.contains('far')) {
              // Add to wishlist
              icon.classList.remove('far');
              icon.classList.add('fas');
              icon.style.color = '#dc3545';
              showToast('Product added to wishlist!', 'success');
            } else {
              // Remove from wishlist
              icon.classList.remove('fas');
              icon.classList.add('far');
              icon.style.color = '';
              showToast('Product removed from wishlist!', 'info');
            }
          }
        });
      });
    }
  }
  
  // ==================
  // Load More Products
  // ==================
  
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', function() {
      // Add loading state
      this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
      this.disabled = true;
      
      // In a real implementation, this would trigger AJAX to load more products
      // For demo purposes, we simulate loading with a delay
      setTimeout(() => {
        this.textContent = 'No More Products';
        this.disabled = true;
        
        showToast('All products have been loaded', 'info');
      }, 1500);
    });
  }
  
  // ==================
  // Pagination
  // ==================
  
  if (paginationLinks.length) {
    paginationLinks.forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Update active state
        paginationLinks.forEach(item => item.classList.remove('active'));
        this.classList.add('active');
        
        // In a real implementation, this would navigate to the corresponding page
        // For demo purposes, we'll just scroll to top
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      });
    });
  }
  
  // ==================
  // Price Range Filter
  // ==================
  
  if (priceFilterBtn && priceFromValue && priceToValue) {
    // Initialize a simple price slider UI
    const priceSliderUI = document.querySelector('.price-slider-ui');
    
    if (priceSliderUI) {
      // For a real implementation, use a library like noUiSlider
      // This is a simplified version for demonstration
      let isDragging = false;
      let activeHandle = null;
      const minPrice = 0;
      const maxPrice = 50;
      
      priceSliderUI.addEventListener('mousedown', function(e) {
        isDragging = true;
        updatePriceFromPosition(e.offsetX);
      });
      
      document.addEventListener('mousemove', function(e) {
        if (isDragging && priceSliderUI) {
          const rect = priceSliderUI.getBoundingClientRect();
          const x = e.clientX - rect.left;
          updatePriceFromPosition(x);
        }
      });
      
      document.addEventListener('mouseup', function() {
        isDragging = false;
        activeHandle = null;
      });
      
      function updatePriceFromPosition(x) {
        const width = priceSliderUI.offsetWidth;
        const percentage = Math.min(Math.max(x / width, 0), 1);
        const price = minPrice + (maxPrice - minPrice) * percentage;
        
        // Decide which handle to update based on position or previous state
        if (activeHandle === 'min' || (!activeHandle && price < parseFloat(priceToValue.textContent.replace('$', '')))) {
          activeHandle = 'min';
          priceFromValue.textContent = '$' + Math.round(price);
        } else {
          activeHandle = 'max';
          priceToValue.textContent = '$' + Math.round(price);
        }
      }
    }
    
    // Filter button click handler
    priceFilterBtn.addEventListener('click', function() {
      const minPrice = parseFloat(priceFromValue.textContent.replace('$', ''));
      const maxPrice = parseFloat(priceToValue.textContent.replace('$', ''));
      
      // Validate price range
      if (minPrice > maxPrice) {
        showToast('Minimum price cannot be greater than maximum price', 'error');
        return;
      }
      
      let visibleCount = 0;
      const allProducts = document.querySelectorAll('.product-card');
      
      // Filter products based on price range
      allProducts.forEach(product => {
        const priceEl = product.querySelector('.price');
        if (priceEl) {
          const price = parseFloat(priceEl.textContent.replace('$', ''));
          
          if (price >= minPrice && price <= maxPrice) {
            product.style.display = 'flex';
            product.classList.add('visible');
            visibleCount++;
          } else {
            product.classList.remove('visible');
            product.style.display = 'none';
          }
        }
      });
      
      // Update results count
      const resultsCountEl = document.querySelector('.shop-results-count p');
      if (resultsCountEl) {
        const totalProducts = allProducts.length;
        resultsCountEl.textContent = `Showing 1-${visibleCount} of ${totalProducts} results`;
      }
      
      showToast(`Showing products between $${minPrice} and $${maxPrice}`, 'success');
    });
  }
  
  // ==================
  // Product Hover Effects
  // ==================
  
  function setupProductHoverEffects() {
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
 
  // ==================
  // Toast Notifications
  // ==================
  
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
  
  // ==================
  // Lazy Loading Images
  // ==================
  
  function setupLazyLoading() {
    const lazyImages = document.querySelectorAll('.product-image img');
    
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            const src = img.getAttribute('data-src');
            
            if (src) {
              img.src = src;
              img.removeAttribute('data-src');
            }
            
            imageObserver.unobserve(img);
          }
        });
      });
      
      lazyImages.forEach(img => {
        // Only apply if not already loaded
        if (!img.complete || img.naturalHeight === 0) {
          const src = img.src;
          img.setAttribute('data-src', src);
          img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"%3E%3Cpath d="M20 30 L30 20 L30 30 Z" stroke="%23ddd" fill="%23eee"/%3E%3Crect width="30" height="20" x="5" y="10" stroke="%23ddd" fill="%23eee" /%3E%3Ccircle cx="15" cy="15" r="3" stroke="%23ddd" fill="%23eee"/%3E%3C/svg%3E';
          imageObserver.observe(img);
        }
      });
    } else {
      // Fallback for browsers that don't support IntersectionObserver
      lazyImages.forEach(img => {
        const src = img.getAttribute('data-src');
        if (src) {
          img.src = src;
        }
      });
    }
  }
  
  // ==================
  // Initialize Shop Page
  // ==================
  
  // Check if this is a product details page (from URL)
  const urlParams = new URLSearchParams(window.location.search);
  const productParam = urlParams.get('product') || urlParams.get('id');
  
  if (productParam) {
    // If we have a specific product parameter, scroll to that product
    const targetProduct = document.querySelector(`.product-card[data-product-id="${productParam}"]`) || 
                          document.querySelector(`.product-card[data-id="${productParam}"]`);
    
    if (targetProduct) {
      // Highlight the product
      setTimeout(() => {
        targetProduct.classList.add('highlighted');
        
        // Scroll to the product
        targetProduct.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Remove highlight after a few seconds
        setTimeout(() => {
          targetProduct.classList.remove('highlighted');
        }, 3000);
      }, 500);
    }
  }
  
  // Add product IDs to all product cards if missing
  document.querySelectorAll('.product-card').forEach((card, index) => {
    if (!card.dataset.productId && !card.dataset.id) {
      // Generate a consistent ID based on the product title or index
      const titleElement = card.querySelector('.product-title a') || card.querySelector('.product-title');
      const title = titleElement ? titleElement.textContent.trim() : '';
      
      const productId = title ? 
                       title.toLowerCase().replace(/[^a-z0-9]/g, '-') : 
                       `product-${index + 1}`;
      
      card.dataset.productId = productId;
    }
  });
  
  // Load products from localStorage and S3
  loadProductsFromStorage();
  
  // Initialize all dynamic features
  initializeProductFeatures();
  
  // Initialize thumbnail gallery
  setupThumbnailGallery();
  
  // Initialize quick add controls
  setupQuickAddControls();
  
  // Initialize lazy loading
  setupLazyLoading();
 });