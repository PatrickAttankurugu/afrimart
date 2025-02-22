/*
* AfriMart Depot - Shop Page JavaScript
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
      const visibleProducts = document.querySelectorAll('.product-card[style="display: flex;"]').length;
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
            productRating.innerHTML = rating;
            
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
    
    // Add to Cart
    const addToCartButtons = document.querySelectorAll('.add-to-cart, .add-to-cart-btn');
    const cartCount = document.querySelector('.cart-count');
    
    if (addToCartButtons.length && cartCount) {
      let count = parseInt(cartCount.textContent);
      
      addToCartButtons.forEach(button => {
        button.addEventListener('click', function() {
          count++;
          cartCount.textContent = count;
          
          // Add animation effect
          button.textContent = 'Added!';
          button.style.backgroundColor = '#28a745';
          
          setTimeout(() => {
            button.textContent = button.classList.contains('add-to-cart-btn') ? 'Add to Cart' : 'Add to Cart';
            button.style.backgroundColor = '';
          }, 1500);
        });
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
            } else {
              icon.classList.remove('fas');
              icon.classList.add('far');
              icon.style.color = '';
            }
          }
        });
      });
    }
    
    // Load More Products
    const loadMoreBtn = document.querySelector('.load-more-btn');
    
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', function() {
        // This would normally fetch more products from the server
        // For demo purposes, we'll just show a message
        this.textContent = 'No More Products';
        this.disabled = true;
        setTimeout(() => {
          this.textContent = 'Load More Products';
          this.disabled = false;
        }, 2000);
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
  });