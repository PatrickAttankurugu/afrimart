/*
* AfriMart Depot - Shop Page JavaScript
* Version: 2.7 - Fully integrated with S3 for product loading and display.
*/

document.addEventListener('DOMContentLoaded', function() {
  'use strict';

  // ==================
  // Constants & Global Variables
  // ==================
  const API_BASE_URL = '/.netlify/functions/s3-handler'; // Base URL for S3 handler Netlify function
  let allProductsData = []; // To store all fetched products for client-side filtering/sorting
  let currentProductsView = []; // Products currently displayed after filtering/sorting
  const ITEMS_PER_PAGE = 12; // Number of products to show per page or load initially
  let currentPage = 1;

  // ==================
  // DOM Elements
  // ==================
  const productsGrid = document.querySelector('.products-grid');
  const categoryLinks = document.querySelectorAll('.category-link');
  const sortSelect = document.getElementById('sort-by');
  const viewButtons = document.querySelectorAll('.view-option');
  const quickViewModalElement = document.querySelector('.quick-view-modal'); // Renamed to avoid conflict
  const priceFilterBtn = document.querySelector('.filter-price-btn');
  const priceFromValueEl = document.querySelector('.price-range-from .price-value'); // Renamed
  const priceToValueEl = document.querySelector('.price-range-to .price-value'); // Renamed
  const loadMoreBtn = document.querySelector('.load-more-btn');
  const paginationContainer = document.querySelector('.pagination'); // Main pagination container
  const resultsCountEl = document.querySelector('.shop-results-count p');
  const shopLoadingOverlay = document.querySelector('.shop-loading-overlay'); // Assuming you add one

  // ==================
  // S3 Product Functions
  // ==================
  /**
   * Fetches all products from the S3 backend via Netlify function.
   * @returns {Promise<Array>} A promise that resolves to an array of products.
   */
  async function getProductsFromS3() {
    if (shopLoadingOverlay) shopLoadingOverlay.style.display = 'flex';
    try {
      console.log('[SHOP_JS] Fetching products from S3...');
      const response = await fetch(`${API_BASE_URL}?operation=get-products`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[SHOP_JS] Failed to fetch products:', response.status, errorText);
        throw new Error(`Failed to get products from S3. Status: ${response.status}`);
      }
      const data = await response.json();
      console.log('[SHOP_JS] Successfully fetched products:', data);
      allProductsData = Array.isArray(data) ? data : [];
      return allProductsData;
    } catch (error) {
      console.error('[SHOP_JS] Error getting products from S3:', error);
      showToast(`Error fetching products: ${error.message}. Please try again.`, 'error');
      allProductsData = []; // Reset on error
      return [];
    } finally {
      if (shopLoadingOverlay) shopLoadingOverlay.style.display = 'none';
    }
  }

  // ==================
  // Product Rendering & Display
  // ==================
  /**
   * Creates an HTML element for a single product card.
   * @param {Object} product - The product data.
   * @param {number} index - The index of the product (for AOS delay).
   * @returns {HTMLElement} The product card element.
   */
  function createProductCard(product, index) {
    const card = document.createElement('div');
    card.className = 'product-card';
    // Ensure product.id is a string and valid for dataset attribute
    const productId = String(product.id || `product-${index}`).replace(/[^a-zA-Z0-9-_]/g, '');
    card.setAttribute('data-product-id', productId);
    card.setAttribute('data-category', product.category ? product.category.toLowerCase() : 'uncategorized');
    card.setAttribute('data-price', parseFloat(String(product.price).replace('$', '')) || 0);
    card.setAttribute('data-aos', 'fade-up');
    card.setAttribute('data-aos-delay', (index % 4) * 100);

    const badgeHtml = product.badge ? `<div class="product-badge ${product.badge.replace(/\s+/g, '-').toLowerCase()}">${product.badge}</div>` : '';
    const imageSrc = product.image && product.image.startsWith('http') ? product.image : 'images/placeholder.jpg'; // Use placeholder if image is invalid

    card.innerHTML = `
      ${badgeHtml}
      <div class="product-image">
        <img src="${imageSrc}" alt="${product.name || 'Product Image'}" loading="lazy" onerror="this.onerror=null;this.src='images/placeholder.jpg';">
        <div class="product-actions">
          <button class="action-btn quick-view" data-product-id="${productId}" aria-label="Quick view ${product.name}">
            <i class="fas fa-eye"></i>
          </button>
          <button class="action-btn add-to-wishlist" aria-label="Add ${product.name} to wishlist">
            <i class="far fa-heart"></i>
          </button>
        </div>
      </div>
      <div class="product-info">
        <h3 class="product-title">
          <a href="product-details.html?product=${productId}">${product.name || 'Unnamed Product'}</a>
        </h3>
        <div class="product-description">
          <p>${product.description || 'No description available.'}</p>
        </div>
        <div class="product-rating">
          ${generateRatingStars(product.rating || 0)}
          <span>(${product.reviewCount || Math.floor(Math.random() * 50) + 5})</span>
        </div>
        <div class="product-price">
          <span class="price">${product.price || '$0.00'}</span>
          ${product.unit ? `<span class="unit">${product.unit}</span>` : ''}
        </div>
        <button class="add-to-cart" data-product-id="${productId}">Add to Cart</button>
      </div>
    `;
    return card;
  }

  /**
   * Generates HTML for star ratings.
   * @param {number} rating - The product rating (0-5).
   * @returns {string} HTML string for stars.
   */
  function generateRatingStars(rating) {
    let starsHtml = '';
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) {
        starsHtml += '<i class="fas fa-star"></i>';
      } else if (i - 0.5 <= rating) {
        starsHtml += '<i class="fas fa-star-half-alt"></i>';
      } else {
        starsHtml += '<i class="far fa-star"></i>';
      }
    }
    return starsHtml;
  }

  /**
   * Renders products in the grid.
   * @param {Array} productsToRender - Array of products to display.
   */
  function renderProducts(productsToRender) {
    if (!productsGrid) {
      console.error('[SHOP_JS] Products grid not found.');
      return;
    }
    productsGrid.innerHTML = ''; // Clear existing products

    if (productsToRender.length === 0) {
      productsGrid.innerHTML = '<p class="no-products-message" style="grid-column: 1 / -1; text-align: center; padding: 40px 0;">No products match your criteria.</p>';
    } else {
      productsToRender.forEach((product, index) => {
        const productCard = createProductCard(product, index);
        productsGrid.appendChild(productCard);
      });
    }
    // Re-initialize features that depend on product cards being in the DOM
    initializeDynamicProductFeatures();
    updateResultsCount(productsToRender.length, allProductsData.length);

    // Re-initialize AOS for new elements if AOS is defined
    if (typeof AOS !== 'undefined') {
      AOS.refresh();
    }
  }

  /**
   * Updates the display of how many products are being shown.
   * @param {number} visibleCount - Number of currently visible products.
   * @param {number} totalCount - Total number of products available (before filtering).
   */
  function updateResultsCount(visibleCount, totalCount) {
    if (resultsCountEl) {
      const startRange = totalCount > 0 && visibleCount > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0;
      const endRange = Math.min(startRange + visibleCount -1 , totalCount);

      if (visibleCount > 0) {
         resultsCountEl.textContent = `Showing ${startRange}-${endRange} of ${totalCount} results`;
      } else if (totalCount > 0) {
         resultsCountEl.textContent = `Showing 0 of ${totalCount} results`;
      }
      else {
         resultsCountEl.textContent = 'No products available.';
      }
    }
  }

  // ==================
  // Filtering, Sorting, Pagination
  // ==================

  /**
   * Applies all current filters, sorting, and pagination to the product list.
   */
  function applyFiltersAndSort() {
    let filtered = [...allProductsData];

    // Category Filter
    const activeCategoryLink = document.querySelector('.category-link.active');
    const selectedCategory = activeCategoryLink ? activeCategoryLink.dataset.category : 'all';
    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category && p.category.toLowerCase() === selectedCategory);
    }

    // Price Filter
    const minPrice = priceFromValueEl ? parseFloat(String(priceFromValueEl.textContent).replace('$', '')) : 0;
    const maxPrice = priceToValueEl ? parseFloat(String(priceToValueEl.textContent).replace('$', '')) : Infinity;
    if (!isNaN(minPrice) && !isNaN(maxPrice)) {
        filtered = filtered.filter(p => {
            const price = parseFloat(String(p.price).replace('$', ''));
            return price >= minPrice && price <= maxPrice;
        });
    }


    // Search Filter (if you add a search input for the shop page)
    // const searchTerm = shopSearchInput ? shopSearchInput.value.toLowerCase() : '';
    // if (searchTerm) {
    //   filtered = filtered.filter(p =>
    //     (p.name && p.name.toLowerCase().includes(searchTerm)) ||
    //     (p.description && p.description.toLowerCase().includes(searchTerm))
    //   );
    // }

    // Sorting
    const sortValue = sortSelect ? sortSelect.value : 'popularity';
    filtered.sort((a, b) => {
      const priceA = parseFloat(String(a.price).replace('$', ''));
      const priceB = parseFloat(String(b.price).replace('$', ''));
      // Add more robust date/popularity metrics if available in product data
      const dateA = new Date(a.dateAdded || 0).getTime();
      const dateB = new Date(b.dateAdded || 0).getTime();
      const popularityA = a.reviewCount || 0; // Example: use review count for popularity
      const popularityB = b.reviewCount || 0;

      switch (sortValue) {
        case 'price-low': return priceA - priceB;
        case 'price-high': return priceB - priceA;
        case 'newest': return dateB - dateA; // Assuming newer products have later dates
        case 'popularity': // Fallback or default
        default: return popularityB - popularityA; // Higher popularity first
      }
    });

    currentProductsView = filtered; // Store the fully filtered and sorted list

    // Pagination
    const paginatedProducts = paginateProducts(currentProductsView, currentPage, ITEMS_PER_PAGE);
    renderProducts(paginatedProducts);
    setupPagination(currentProductsView.length, ITEMS_PER_PAGE, currentPage);
    updateResultsCount(paginatedProducts.length, currentProductsView.length); // Pass correct counts
  }

  /**
   * Paginates an array of products.
   * @param {Array} products - The array of products to paginate.
   * @param {number} page - The current page number.
   * @param {number} itemsPerPage - Number of items per page.
   * @returns {Array} The slice of products for the current page.
   */
  function paginateProducts(products, page, itemsPerPage) {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return products.slice(startIndex, endIndex);
  }

  /**
   * Sets up pagination controls.
   * @param {number} totalItems - Total number of items to paginate.
   * @param {number} itemsPerPage - Number of items per page.
   * @param {number} activePage - The currently active page.
   */
  function setupPagination(totalItems, itemsPerPage, activePage) {
    if (!paginationContainer) return;
    paginationContainer.innerHTML = ''; // Clear existing pagination

    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalPages <= 1) {
        if (loadMoreBtn) loadMoreBtn.style.display = 'none'; // Hide load more if not needed
        return; // No pagination needed for 1 or 0 pages
    }


    // Previous Button
    const prevLi = document.createElement('li');
    prevLi.className = 'page-item';
    const prevLink = document.createElement('a');
    prevLink.className = 'page-link';
    prevLink.href = '#';
    prevLink.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevLink.setAttribute('aria-label', 'Previous page');
    if (activePage === 1) prevLink.classList.add('disabled');
    prevLink.addEventListener('click', (e) => {
      e.preventDefault();
      if (activePage > 1) {
        currentPage = activePage - 1;
        applyFiltersAndSort();
      }
    });
    prevLi.appendChild(prevLink);
    paginationContainer.appendChild(prevLi);

    // Page Number Links (simplified for brevity, can be made more complex)
    for (let i = 1; i <= totalPages; i++) {
      // Basic pagination: show first, last, current, and adjacent pages
      // More complex logic can be added for "..." indicators
      if (i === 1 || i === totalPages || (i >= activePage - 1 && i <= activePage + 1) ) {
        const pageLi = document.createElement('li');
        pageLi.className = 'page-item';
        const pageLink = document.createElement('a');
        pageLink.className = 'page-link';
        pageLink.href = '#';
        pageLink.textContent = i;
        if (i === activePage) pageLink.classList.add('active');
        pageLink.addEventListener('click', (e) => {
          e.preventDefault();
          currentPage = i;
          applyFiltersAndSort();
        });
        pageLi.appendChild(pageLink);
        paginationContainer.appendChild(pageLi);
      } else if (paginationContainer.lastChild && !paginationContainer.lastChild.classList.contains('page-dots')) {
        // Add ellipsis if there's a gap and no ellipsis yet
        const dotsLi = document.createElement('li');
        dotsLi.className = 'page-item page-dots disabled';
        const dotsSpan = document.createElement('span');
        dotsSpan.className = 'page-link';
        dotsSpan.textContent = '...';
        dotsLi.appendChild(dotsSpan);
        paginationContainer.appendChild(dotsLi);
      }
    }


    // Next Button
    const nextLi = document.createElement('li');
    nextLi.className = 'page-item';
    const nextLink = document.createElement('a');
    nextLink.className = 'page-link';
    nextLink.href = '#';
    nextLink.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextLink.setAttribute('aria-label', 'Next page');
    if (activePage === totalPages) nextLink.classList.add('disabled');
    nextLink.addEventListener('click', (e) => {
      e.preventDefault();
      if (activePage < totalPages) {
        currentPage = activePage + 1;
        applyFiltersAndSort();
      }
    });
    nextLi.appendChild(nextLink);
    paginationContainer.appendChild(nextLi);

    // Show/hide load more button based on pagination
    if (loadMoreBtn) {
        loadMoreBtn.style.display = activePage < totalPages ? 'inline-block' : 'none';
    }
  }


  // ==================
  // Event Handlers Setup
  // ==================

  /**
   * Sets up event listeners for static elements on the page.
   */
  function initializeStaticEventListeners() {
    // Category Links
    categoryLinks.forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        categoryLinks.forEach(item => item.classList.remove('active'));
        this.classList.add('active');
        currentPage = 1; // Reset to first page on category change
        applyFiltersAndSort();
      });
    });

    // Sort Select
    if (sortSelect) {
      sortSelect.addEventListener('change', () => {
        currentPage = 1; // Reset to first page on sort change
        applyFiltersAndSort();
      });
    }

    // View Toggle Buttons
    viewButtons.forEach(button => {
      button.addEventListener('click', function() {
        viewButtons.forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        if (productsGrid) {
            productsGrid.classList.toggle('list-view', this.classList.contains('list-view'));
        }
        localStorage.setItem('afrimart_shop_view', this.classList.contains('list-view') ? 'list' : 'grid');
      });
    });
     // Load saved view preference
    const savedShopView = localStorage.getItem('afrimart_shop_view');
    if (productsGrid && savedShopView === 'list') {
        productsGrid.classList.add('list-view');
        document.querySelector('.view-option.grid-view')?.classList.remove('active');
        document.querySelector('.view-option.list-view')?.classList.add('active');
    }


    // Price Filter Button
    if (priceFilterBtn) {
      priceFilterBtn.addEventListener('click', () => {
        currentPage = 1; // Reset to first page on price filter change
        applyFiltersAndSort();
        showToast('Price filter applied!', 'success');
      });
    }

    // Load More Button
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', function() {
        const totalPages = Math.ceil(currentProductsView.length / ITEMS_PER_PAGE);
        if (currentPage < totalPages) {
          currentPage++;
          // For "load more", we append rather than replace
          const nextPageProducts = paginateProducts(currentProductsView, currentPage, ITEMS_PER_PAGE);
          nextPageProducts.forEach((product, index) => {
            // Ensure product grid exists and the no-products message is not the only child
            if (productsGrid && productsGrid.querySelector('.product-card')) {
                 const productCard = createProductCard(product, (currentPage -1) * ITEMS_PER_PAGE + index);
                 productsGrid.appendChild(productCard);
            } else if (productsGrid) { // If grid was empty (e.g. due to "no products message")
                productsGrid.innerHTML = ''; // Clear message
                const productCard = createProductCard(product, (currentPage -1) * ITEMS_PER_PAGE + index);
                productsGrid.appendChild(productCard);
            }
          });
          initializeDynamicProductFeatures(); // Re-init for new cards
          setupPagination(currentProductsView.length, ITEMS_PER_PAGE, currentPage); // Update pagination state
          updateResultsCount( (currentPage * ITEMS_PER_PAGE > currentProductsView.length ? currentProductsView.length : currentPage * ITEMS_PER_PAGE) , currentProductsView.length);
        }
      });
    }
  }

  /**
   * Sets up event listeners for dynamically created product cards.
   * This should be called after products are rendered or re-rendered.
   */
  function initializeDynamicProductFeatures() {
    setupProductHoverEffects();
    setupAddToCartButtons();
    setupWishlistButtons();
    setupQuickViewModal();
    // Note: Quantity selectors are typically part of quick view or product details, not the main shop grid cards.
  }

  function setupProductHoverEffects() {
    document.querySelectorAll('.product-card').forEach(card => {
      card.addEventListener('mouseenter', function() {
        this.querySelector('.product-actions')?.style.setProperty('opacity', '1', 'important');
        this.querySelector('.product-actions')?.style.setProperty('transform', 'translateX(0)', 'important');
      });
      card.addEventListener('mouseleave', function() {
        this.querySelector('.product-actions')?.style.setProperty('opacity', '0');
        this.querySelector('.product-actions')?.style.setProperty('transform', 'translateX(20px)');
      });
    });
  }

  function setupAddToCartButtons() {
    document.querySelectorAll('.add-to-cart').forEach(button => {
      // Remove existing listener to prevent duplicates if re-initializing
      const newButton = button.cloneNode(true);
      button.parentNode.replaceChild(newButton, button);

      newButton.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation(); // Prevent event bubbling, e.g., if card is a link

        const productCard = this.closest('.product-card');
        if (!productCard) return;

        const productId = productCard.dataset.productId;
        const product = allProductsData.find(p => String(p.id) === productId); // Find from original data

        if (product) {
          const cartProduct = {
            id: product.id,
            title: product.name,
            price: product.price,
            quantity: 1, // Default quantity for direct add
            image: product.image,
            variant: '' // No variants on shop grid, or handle if data structure changes
          };

          if (typeof AfriMartCart !== 'undefined' && AfriMartCart.addToCart) {
            AfriMartCart.addToCart(cartProduct);
          } else {
            console.error('AfriMartCart or addToCart function is not available.');
            showToast('Error adding to cart. Please try again.', 'error');
            return;
          }

          // Visual feedback
          this.innerHTML = '<i class="fas fa-check"></i> Added!';
          this.classList.add('added');
          setTimeout(() => {
            this.innerHTML = 'Add to Cart';
            this.classList.remove('added');
          }, 1500);
        } else {
            console.error('Product data not found for ID:', productId);
            showToast('Could not add product. Please try again.', 'error');
        }
      });
    });
  }


  function setupWishlistButtons() {
    document.querySelectorAll('.add-to-wishlist').forEach(button => {
      const newButton = button.cloneNode(true);
      button.parentNode.replaceChild(newButton, button);

      newButton.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const icon = this.querySelector('i');
        if (icon) {
          const added = icon.classList.toggle('fas'); // Toggle solid heart
          icon.classList.toggle('far', !added);    // Toggle regular heart
          icon.style.color = added ? 'var(--secondary-color)' : ''; // Use CSS variable
          showToast(added ? 'Added to wishlist!' : 'Removed from wishlist', 'info');
        }
      });
    });
  }

  function setupQuickViewModal() {
    if (!quickViewModalElement) return;

    const modalOverlay = quickViewModalElement.querySelector('.modal-overlay');
    const modalClose = quickViewModalElement.querySelector('.modal-close');

    document.querySelectorAll('.quick-view').forEach(button => {
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);

        newButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const productId = this.dataset.productId;
            const product = allProductsData.find(p => String(p.id) === productId);

            if (product) {
                populateQuickViewModal(product);
                quickViewModalElement.classList.add('active');
                document.body.style.overflow = 'hidden';
            } else {
                console.error('Product not found for quick view:', productId);
                showToast('Product details not available.', 'error');
            }
        });
    });

    if (modalOverlay) modalOverlay.addEventListener('click', closeQuickViewModal);
    if (modalClose) modalClose.addEventListener('click', closeQuickViewModal);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && quickViewModalElement.classList.contains('active')) {
        closeQuickViewModal();
      }
    });

    // Add to cart from quick view modal
    const quickViewAddToCartBtn = quickViewModalElement.querySelector('.add-to-cart-btn');
    if (quickViewAddToCartBtn) {
        quickViewAddToCartBtn.addEventListener('click', function() {
            const productId = this.dataset.productId;
            const product = allProductsData.find(p => String(p.id) === productId);
            const quantityInput = quickViewModalElement.querySelector('.quantity-input');
            const quantity = quantityInput ? parseInt(quantityInput.value) : 1;

            if (product) {
                const cartProduct = { ...product, title: product.name, quantity: quantity }; // Adapt to cart structure
                 if (typeof AfriMartCart !== 'undefined' && AfriMartCart.addToCart) {
                    AfriMartCart.addToCart(cartProduct);
                } else {
                    console.error('AfriMartCart or addToCart function is not available.');
                    showToast('Error adding to cart. Please try again.', 'error');
                    return;
                }
                closeQuickViewModal();
            }
        });
    }
  }

  function populateQuickViewModal(product) {
    if (!quickViewModalElement) return;
    quickViewModalElement.querySelector('.product-title').textContent = product.name;
    quickViewModalElement.querySelector('.main-image img').src = product.image || 'images/placeholder.jpg';
    quickViewModalElement.querySelector('.main-image img').alt = product.name;
    quickViewModalElement.querySelector('.current-price').textContent = product.price;
    if(quickViewModalElement.querySelector('.unit')) quickViewModalElement.querySelector('.unit').textContent = product.unit || '';
    quickViewModalElement.querySelector('.product-description p').textContent = product.description || 'No description available.';
    quickViewModalElement.querySelector('.meta-value.category-value').textContent = product.category ? product.category.charAt(0).toUpperCase() + product.category.slice(1).replace('-', ' ') : 'N/A'; // Added category display
    quickViewModalElement.querySelector('.meta-value.sku-value').textContent = product.sku || `AFM-${product.id}`; // Added SKU
    quickViewModalElement.querySelector('.stars').innerHTML = generateRatingStars(product.rating || 0);
    quickViewModalElement.querySelector('.review-count').textContent = `(${product.reviewCount || 0} reviews)`;
    quickViewModalElement.querySelector('.add-to-cart-btn').dataset.productId = product.id;

    // Thumbnails (assuming product.images is an array of image URLs if available)
    const thumbnailContainer = quickViewModalElement.querySelector('.thumbnail-images');
    if (thumbnailContainer) {
        thumbnailContainer.innerHTML = ''; // Clear existing
        const imagesToShow = product.images && product.images.length > 0 ? product.images : [{thumbnail: product.image, large: product.image}]; // Fallback to main image
        imagesToShow.slice(0, 3).forEach((imgData, index) => { // Show up to 3 thumbnails
            const thumbDiv = document.createElement('div');
            thumbDiv.className = 'thumbnail' + (index === 0 ? ' active' : '');
            const thumbImg = document.createElement('img');
            thumbImg.src = typeof imgData === 'string' ? imgData : (imgData.thumbnail || product.image); // Handle if images is array of strings or objects
            thumbImg.alt = `Thumbnail ${index + 1}`;
            thumbImg.addEventListener('click', function() {
                quickViewModalElement.querySelector('.main-image img').src = typeof imgData === 'string' ? imgData : (imgData.large || product.image);
                thumbnailContainer.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
                this.parentElement.classList.add('active');
            });
            thumbDiv.appendChild(thumbImg);
            thumbnailContainer.appendChild(thumbDiv);
        });
    }
    // Initialize quantity selector within the modal
    const quantitySelector = quickViewModalElement.querySelector('.quantity-selector');
    if (quantitySelector) {
        const minusBtn = quantitySelector.querySelector('.minus');
        const plusBtn = quantitySelector.querySelector('.plus');
        const input = quantitySelector.querySelector('.quantity-input');
        input.value = 1; // Reset to 1

        minusBtn.onclick = () => { // Use onclick to override previous if any
            let val = parseInt(input.value);
            if (val > 1) input.value = val - 1;
        };
        plusBtn.onclick = () => {
            let val = parseInt(input.value);
            if (val < (product.stock || 10)) input.value = val + 1; // Use product stock if available
        };
    }
  }


  function closeQuickViewModal() {
    if (quickViewModalElement) quickViewModalElement.classList.remove('active');
    document.body.style.overflow = 'auto';
  }


  // ==================
  // Utility Functions
  // ==================
  /**
   * Displays a toast notification.
   * @param {string} message - The message to display.
   * @param {string} type - Type of toast ('success', 'error', 'info', 'warning').
   */
  function showToast(message, type = 'info') {
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.className = 'toast-container';
      document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    let iconClass = 'fas fa-info-circle';
    if (type === 'success') iconClass = 'fas fa-check-circle';
    else if (type === 'error') iconClass = 'fas fa-exclamation-circle';
    else if (type === 'warning') iconClass = 'fas fa-exclamation-triangle';

    toast.innerHTML = `
      <div class="toast-content">
        <i class="${iconClass}"></i>
        <span>${message}</span>
      </div>
      <button class="toast-close" aria-label="Close notification"><i class="fas fa-times"></i></button>
    `;
    toastContainer.appendChild(toast);

    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);

    // Auto remove
    const autoRemoveTimer = setTimeout(() => removeToast(toast), 5000);

    toast.querySelector('.toast-close').addEventListener('click', () => {
      clearTimeout(autoRemoveTimer);
      removeToast(toast);
    });
  }

  function removeToast(toast) {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.remove();
      const container = document.querySelector('.toast-container');
      if (container && !container.hasChildNodes()) {
        container.remove();
      }
    }, 400);
  }


  // ==================
  // Initial Page Load
  // ==================
  async function initializeShopPage() {
    if (typeof AOS !== 'undefined') AOS.init(); // Initialize AOS animations

    await getProductsFromS3(); // Fetch all products initially
    currentPage = 1;
    applyFiltersAndSort(); // Render initial set of products and setup pagination
    initializeStaticEventListeners(); // Setup listeners for static elements
    // Dynamic listeners are called within renderProducts via initializeDynamicProductFeatures

    // Handle category from URL param if present
    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = urlParams.get('category');
    if (categoryParam) {
      const targetCategoryLink = document.querySelector(`.category-link[data-category="${categoryParam}"]`);
      if (targetCategoryLink) {
        categoryLinks.forEach(link => link.classList.remove('active'));
        targetCategoryLink.classList.add('active');
        applyFiltersAndSort(); // Re-filter based on URL param
      }
    }
  }

  initializeShopPage(); // Start the shop page initialization
});
