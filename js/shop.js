/*
* AfriMart Depot - Shop Page JavaScript
* Version: 1.1
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

  // Category Filtering
  const categoryLinks = document.querySelectorAll('.category-link');
  const productCards = document.querySelectorAll('.product-card');
  
  if (categoryLinks.length && productCards.length) {
    categoryLinks.forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Update active link
        categoryLinks.forEach(item => item.classList.remove('active'));
        this.classList.add('active');
        
        const selectedCategory = this.getAttribute('data-category');
        
        // Filter products
        productCards.forEach(card => {
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
  
  function updateResultsCount() {
    const visibleProducts = document.querySelectorAll('.product-card[style*="display: flex"]').length;
    const resultsCountEl = document.querySelector('.shop-results-count p');
    
    if (resultsCountEl) {
      const totalProducts = document.querySelectorAll('.product-card').length;
      resultsCountEl.textContent = `Showing 1-${visibleProducts} of ${totalProducts} results`;
    }
  }
  
  // Sort Products
  const sortSelect = document.getElementById('sort-by');
  
  if (sortSelect) {
    sortSelect.addEventListener('change', function() {
      const sortValue = this.value;
      const productsGrid = document.querySelector('.products-grid');
      
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
              // Assuming there's a data attribute for date or just using the DOM order
              return Array.from(productsGrid.children).indexOf(b) - Array.from(productsGrid.children).indexOf(a);
            default: // popularity - based on rating count
              const getRatingCount = (el) => {
                const ratingCountEl = el.querySelector('.product-rating span');
                return ratingCountEl ? parseInt(ratingCountEl.textContent.replace(/[()]/g, '')) : 0;
              };
              return getRatingCount(b) - getRatingCount(a);
          }
        });
        
        // Remove products from DOM and append in new order
        products.forEach(product => {
          productsGrid.appendChild(product);
        });
      }
    });
  }
  
  // View Toggle (Grid/List)
  const viewButtons = document.querySelectorAll('.view-option');
  const productsGrid = document.querySelector('.products-grid');
  
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
  
  // Quick View Modal
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
    
    quickViewButtons.forEach(button => {
      button.addEventListener('click', function() {
        const productCard = this.closest('.product-card');
        
        if (productCard) {
          // Get product data
          const title = productCard.querySelector('.product-title a').textContent;
          const image = productCard.querySelector('.product-image img').src;
          const price = productCard.querySelector('.price').textContent;
          const unit = productCard.querySelector('.unit').textContent;
          const description = productCard.querySelector('.product-description p').textContent;
          const category = productCard.getAttribute('data-category');
          const rating = productCard.querySelector('.product-rating').innerHTML;
          
          // Update modal content
          productTitle.textContent = title;
          productImage.src = image;
          productImage.alt = title;
          productPrice.textContent = price;
          productUnit.textContent = unit;
          productDescription.textContent = description;
          productCategory.textContent = category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ');
          
          if (productRating) {
            productRating.innerHTML = rating;
          }
          
          // Update thumbnails (using the same image for all thumbnails in this example)
          const thumbnails = quickViewModal.querySelectorAll('.thumbnail img');
          thumbnails.forEach(thumb => {
            thumb.src = image;
            thumb.alt = title;
          });
          
          // Show modal
          quickViewModal.classList.add('active');
          document.body.style.overflow = 'hidden';
        }
      });
    });
    
    // Close modal on click outside or close button
    if (modalOverlay) {
      modalOverlay.addEventListener('click', closeModal);
    }
    
    if (modalClose) {
      modalClose.addEventListener('click', closeModal);
    }
    
    function closeModal() {
      quickViewModal.classList.remove('active');
      document.body.style.overflow = 'auto';
    }
    
    // Close modal on escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && quickViewModal.classList.contains('active')) {
        closeModal();
      }
    });
  }
  
  // Quantity Selector
  const quantitySelectors = document.querySelectorAll('.quantity-selector');
  
  if (quantitySelectors.length) {
    quantitySelectors.forEach(selector => {
      const minusBtn = selector.querySelector('.minus');
      const plusBtn = selector.querySelector('.plus');
      const input = selector.querySelector('.quantity-input');
      
      if (minusBtn && plusBtn && input) {
        minusBtn.addEventListener('click', function() {
          let value = parseInt(input.value);
          value = Math.max(1, value - 1);
          input.value = value;
        });
        
        plusBtn.addEventListener('click', function() {
          let value = parseInt(input.value);
          value += 1;
          input.value = value;
        });
        
        input.addEventListener('input', function() {
          let value = parseInt(this.value);
          if (isNaN(value) || value < 1) {
            this.value = 1;
          }
        });
      }
    });
  }
  
  // Thumbnail Image Selection
  const thumbnails = document.querySelectorAll('.thumbnail');
  const mainImage = document.querySelector('.main-image img');
  
  if (thumbnails.length && mainImage) {
    thumbnails.forEach(thumbnail => {
      thumbnail.addEventListener('click', function() {
        thumbnails.forEach(item => item.classList.remove('active'));
        this.classList.add('active');
        
        const thumbnailImg = this.querySelector('img');
        if (thumbnailImg) {
          mainImage.src = thumbnailImg.src;
          mainImage.alt = thumbnailImg.alt;
        }
      });
    });
  }
  
  // IMPROVED ADD TO CART FUNCTIONALITY
  const addToCartButtons = document.querySelectorAll('.add-to-cart');
  
  if (addToCartButtons.length) {
    addToCartButtons.forEach(button => {
      button.addEventListener('click', function() {
        // Get product info
        const productCard = this.closest('.product-card');
        if (!productCard) return;
        
        const productTitle = productCard.querySelector('.product-title a').textContent;
        const productImage = productCard.querySelector('.product-image img').src;
        const productPrice = productCard.querySelector('.price').textContent;
        const productId = productCard.dataset.productId || 'product_' + Date.now();
        
        // Get quantity if there's a quantity input, otherwise default to 1
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
        
        // Add to cart (using the global function defined in cart.js)
        if (typeof window.addToCart === 'function') {
          window.addToCart(product);
        } else {
          console.error('addToCart function not found. Make sure cart.js is loaded before shop.js');
          
          // Fallback implementation if cart.js isn't loaded correctly
          // This is just a visual feedback for the user
          button.innerHTML = '<i class="fas fa-check"></i> Added!';
          button.style.backgroundColor = '#28a745';
          
          setTimeout(() => {
            button.innerHTML = 'Add to Cart';
            button.style.backgroundColor = '';
          }, 1500);
        }
      });
    });
  }
  
  // Quick Add Quantity Controls (for products with quantity selectors)
  const quickAddControls = document.querySelectorAll('.quick-add-container');
  
  if (quickAddControls.length) {
    quickAddControls.forEach(container => {
      const minusBtn = container.querySelector('.quick-minus');
      const plusBtn = container.querySelector('.quick-plus');
      const input = container.querySelector('.quick-quantity');
      
      if (minusBtn && plusBtn && input) {
        minusBtn.addEventListener('click', function() {
          let value = parseInt(input.value);
          if (value > 1) {
            input.value = value - 1;
          }
        });
        
        plusBtn.addEventListener('click', function() {
          let value = parseInt(input.value);
          const maxValue = parseInt(input.getAttribute('max') || 10);
          if (value < maxValue) {
            input.value = value + 1;
          }
        });
        
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
  
  // Add to Wishlist
  const wishlistButtons = document.querySelectorAll('.add-to-wishlist, .wishlist-btn');
  
  if (wishlistButtons.length) {
    wishlistButtons.forEach(button => {
      button.addEventListener('click', function() {
        const icon = this.querySelector('i');
        
        if (icon) {
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
        }
      });
    });
  }
  
  // Load More Products
  const loadMoreBtn = document.querySelector('.load-more-btn');
  
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', function() {
      this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
      this.disabled = true;
      
      // Simulate loading more products with a delay
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
        // For demo purposes, we'll just scroll to top
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      });
    });
  }
  
  // Price Range Filter
  const priceFilterBtn = document.querySelector('.filter-price-btn');
  const priceFromValue = document.querySelector('.price-range-from .price-value');
  const priceToValue = document.querySelector('.price-range-to .price-value');
  
  if (priceFilterBtn && priceFromValue && priceToValue) {
    // Initialize a simple price slider UI
    const priceSliderUI = document.querySelector('.price-slider-ui');
    
    if (priceSliderUI) {
      // For a real implementation, you would use a library like noUiSlider
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
      
      // Filter products based on price range
      productCards.forEach(product => {
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
        const totalProducts = productCards.length;
        resultsCountEl.textContent = `Showing 1-${visibleCount} of ${totalProducts} results`;
      }
      
      showToast(`Showing products between $${minPrice} and $${maxPrice}`, 'success');
    });
  }
  
  // Enhanced Product Hover Effects
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
  
  // Lazy Loading Images for Performance
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
      const src = img.src;
      img.setAttribute('data-src', src);
      img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"%3E%3Cpath d="M20 30 L30 20 L30 30 Z" stroke="%23ddd" fill="%23eee"/%3E%3Crect width="30" height="20" x="5" y="10" stroke="%23ddd" fill="%23eee" /%3E%3Ccircle cx="15" cy="15" r="3" stroke="%23ddd" fill="%23eee"/%3E%3C/svg%3E';
      imageObserver.observe(img);
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
});