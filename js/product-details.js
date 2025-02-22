/**
 * AfriMart Depot - Product Details JavaScript
 * Version: 1.0
 * 
 * This file contains all the JavaScript functionality for the product details page,
 * including image gallery, zoom functionality, quantity selector, tab switching,
 * review form handling, and related product slider.
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize AOS animation library
    AOS.init({
        duration: 800,
        easing: 'ease',
        once: true
    });

    // ==================
    // 1. Image Gallery & Zoom Functionality
    // ==================
    initImageGallery();
    initImageZoom();

    // ==================
    // 2. Quantity Selector
    // ==================
    initQuantitySelector();

    // ==================
    // 3. Size Options
    // ==================
    initSizeOptions();

    // ==================
    // 4. Product Tab Navigation
    // ==================
    initProductTabs();

    // ==================
    // 5. Reviews Functionality
    // ==================
    initReviewFunctionality();

    // ==================
    // 6. Back to Top Button
    // ==================
    initBackToTopButton();

    // ==================
    // 7. Cart Functionality
    // ==================
    initCartFunctionality();

    // ==================
    // 8. Wishlist Functionality
    // ==================
    initWishlistFunctionality();

    // ==================
    // 9. Social Share Functionality
    // ==================
    initSocialShareFunctionality();
});

/**
 * Initialize image gallery with thumbnail selection
 */
function initImageGallery() {
    const thumbnails = document.querySelectorAll('.thumbnail');
    const mainImage = document.getElementById('main-product-image');

    if (!thumbnails.length || !mainImage) return;

    thumbnails.forEach(thumbnail => {
        thumbnail.addEventListener('click', function() {
            // Remove active class from all thumbnails
            thumbnails.forEach(thumb => thumb.classList.remove('active'));
            
            // Add active class to clicked thumbnail
            this.classList.add('active');
            
            // Update main image source
            const imgSrc = this.getAttribute('data-img');
            if (imgSrc) {
                mainImage.src = imgSrc;
                
                // Also update zoom result background image if zoom is active
                updateZoomResultBackground(imgSrc);
            }
        });
    });
}

/**
 * Initialize image zoom functionality
 */
function initImageZoom() {
    const mainImage = document.getElementById('main-product-image');
    const zoomContainer = document.querySelector('.image-zoom-container');
    const zoomLens = document.querySelector('.zoom-lens');
    const zoomResult = document.querySelector('.zoom-result');

    if (!mainImage || !zoomContainer || !zoomLens || !zoomResult) return;

    let isZoomActive = false;

    // Calculate zoom ratios based on image and container sizes
    function calculateZoomRatio() {
        const zoomResultWidth = zoomResult.offsetWidth;
        const zoomResultHeight = zoomResult.offsetHeight;
        const zoomLensWidth = zoomLens.offsetWidth;
        const zoomLensHeight = zoomLens.offsetHeight;
        
        const xRatio = zoomResultWidth / zoomLensWidth;
        const yRatio = zoomResultHeight / zoomLensHeight;
        
        return { xRatio, yRatio };
    }

    // Update zoom result background based on current main image
    function updateZoomBackground(x, y, ratio) {
        const { xRatio, yRatio } = ratio;
        const backgroundX = -x * xRatio;
        const backgroundY = -y * yRatio;
        
        zoomResult.style.backgroundImage = `url('${mainImage.src}')`;
        zoomResult.style.backgroundSize = `${mainImage.width * xRatio}px ${mainImage.height * yRatio}px`;
        zoomResult.style.backgroundPosition = `${backgroundX}px ${backgroundY}px`;
    }

    // Update zoom result background when main image changes
    window.updateZoomResultBackground = function(imgSrc) {
        if (isZoomActive) {
            zoomResult.style.backgroundImage = `url('${imgSrc}')`;
        }
    };

    // Move zoom lens and update zoom result
    function moveLens(e) {
        // Prevent any default action
        e.preventDefault();
        
        // Get cursor position
        let pos = getCursorPos(e);
        let x = pos.x;
        let y = pos.y;
        
        // Prevent lens from going outside the image
        if (x > mainImage.width - zoomLens.offsetWidth) x = mainImage.width - zoomLens.offsetWidth;
        if (x < 0) x = 0;
        if (y > mainImage.height - zoomLens.offsetHeight) y = mainImage.height - zoomLens.offsetHeight;
        if (y < 0) y = 0;
        
        // Set position of the lens
        zoomLens.style.left = x + "px";
        zoomLens.style.top = y + "px";
        
        // Update zoom result
        const ratio = calculateZoomRatio();
        updateZoomBackground(x, y, ratio);
    }

    // Get cursor position relative to the image
    function getCursorPos(e) {
        let rect = mainImage.getBoundingClientRect();
        let x = e.clientX - rect.left;
        let y = e.clientY - rect.top;
        x = x - window.pageXOffset;
        y = y - window.pageYOffset;
        return { x, y };
    }

    // Show zoom functionality on mouse enter
    zoomContainer.addEventListener('mouseenter', function() {
        isZoomActive = true;
        zoomLens.style.display = 'block';
        zoomResult.style.display = 'block';
        
        // Set initial background image
        zoomResult.style.backgroundImage = `url('${mainImage.src}')`;
        
        // Set initial position
        const rect = mainImage.getBoundingClientRect();
        const initialX = rect.width / 2 - zoomLens.offsetWidth / 2;
        const initialY = rect.height / 2 - zoomLens.offsetHeight / 2;
        zoomLens.style.left = initialX + "px";
        zoomLens.style.top = initialY + "px";
        
        // Update zoom result
        const ratio = calculateZoomRatio();
        updateZoomBackground(initialX, initialY, ratio);
    });

    // Hide zoom functionality on mouse leave
    zoomContainer.addEventListener('mouseleave', function() {
        isZoomActive = false;
        zoomLens.style.display = 'none';
        zoomResult.style.display = 'none';
    });

    // Move lens on mouse move
    zoomContainer.addEventListener('mousemove', moveLens);
}

/**
 * Initialize quantity selector with increment/decrement buttons
 */
function initQuantitySelector() {
    const quantityInputs = document.querySelectorAll('.quantity-input');
    
    quantityInputs.forEach(input => {
        const minusBtn = input.previousElementSibling;
        const plusBtn = input.nextElementSibling;
        
        if (minusBtn && plusBtn) {
            // Decrement quantity
            minusBtn.addEventListener('click', function() {
                let currentValue = parseInt(input.value);
                let minValue = parseInt(input.getAttribute('min')) || 1;
                
                if (currentValue > minValue) {
                    input.value = currentValue - 1;
                    // Trigger change event to update any dependent elements
                    input.dispatchEvent(new Event('change'));
                }
            });
            
            // Increment quantity
            plusBtn.addEventListener('click', function() {
                let currentValue = parseInt(input.value);
                let maxValue = parseInt(input.getAttribute('max')) || 99;
                
                if (currentValue < maxValue) {
                    input.value = currentValue + 1;
                    // Trigger change event to update any dependent elements
                    input.dispatchEvent(new Event('change'));
                }
            });
            
            // Validate input on change
            input.addEventListener('change', function() {
                let currentValue = parseInt(input.value);
                let minValue = parseInt(input.getAttribute('min')) || 1;
                let maxValue = parseInt(input.getAttribute('max')) || 99;
                
                if (isNaN(currentValue) || currentValue < minValue) {
                    input.value = minValue;
                } else if (currentValue > maxValue) {
                    input.value = maxValue;
                }
            });
        }
    });
}

/**
 * Initialize size options with price updates
 */
function initSizeOptions() {
    const sizeButtons = document.querySelectorAll('.size-option .option-btn');
    const priceElement = document.querySelector('.product-price .current-price');
    const unitElement = document.querySelector('.product-price .unit');
    
    if (!sizeButtons.length || !priceElement || !unitElement) return;
    
    sizeButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all size buttons
            sizeButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Update price and unit
            const price = this.getAttribute('data-price');
            const unit = this.getAttribute('data-unit');
            
            if (price) priceElement.textContent = `$${price}`;
            if (unit) unitElement.textContent = unit;
        });
    });
}

/**
 * Initialize product tabs functionality
 */
function initProductTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    if (!tabButtons.length || !tabPanes.length) return;
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Get tab ID
            const tabId = this.getAttribute('data-tab');
            
            if (!tabId) return;
            
            // Remove active class from all tab buttons and panes
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));
            
            // Add active class to clicked button and corresponding pane
            this.classList.add('active');
            document.getElementById(tabId)?.classList.add('active');
            
            // Scroll to the tab content if on mobile
            if (window.innerWidth < 768) {
                const tabsContent = document.querySelector('.tabs-content');
                if (tabsContent) {
                    setTimeout(() => {
                        tabsContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 100);
                }
            }
        });
    });
}

/**
 * Initialize reviews section functionality
 */
function initReviewFunctionality() {
    // Initialize write review button
    const writeReviewBtn = document.querySelector('.write-review-btn');
    const reviewFormContainer = document.querySelector('.review-form-container');
    const reviewForm = document.getElementById('review-form');
    const cancelReviewBtn = document.querySelector('.cancel-review');
    const successMessage = document.querySelector('.review-form-container .success-message');

    if (writeReviewBtn && reviewFormContainer) {
        writeReviewBtn.addEventListener('click', function() {
            reviewFormContainer.style.display = 'block';
            reviewFormContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }

    if (cancelReviewBtn && reviewFormContainer) {
        cancelReviewBtn.addEventListener('click', function() {
            reviewFormContainer.style.display = 'none';
        });
    }

    // Initialize star rating selection in review form
    const starRating = document.querySelector('.star-rating');
    const ratingInput = document.getElementById('selected-rating');

    if (starRating && ratingInput) {
        const stars = starRating.querySelectorAll('i');

        stars.forEach(star => {
            // Hover effect
            star.addEventListener('mouseenter', function() {
                const rating = parseInt(this.getAttribute('data-rating'));

                // Update stars appearance on hover
                stars.forEach((s, index) => {
                    if (index < rating) {
                        s.className = 'fas fa-star';
                    } else {
                        s.className = 'far fa-star';
                    }
                });
            });

            // Click to select rating
            star.addEventListener('click', function() {
                const rating = parseInt(this.getAttribute('data-rating'));
                ratingInput.value = rating;

                // Update stars appearance
                stars.forEach((s, index) => {
                    if (index < rating) {
                        s.className = 'fas fa-star';
                    } else {
                        s.className = 'far fa-star';
                    }
                });
            });
        });

        // Reset stars on mouse leave if no rating selected
        starRating.addEventListener('mouseleave', function() {
            const currentRating = parseInt(ratingInput.value) || 0;

            stars.forEach((star, index) => {
                if (index < currentRating) {
                    star.className = 'fas fa-star';
                } else {
                    star.className = 'far fa-star';
                }
            });
        });
    }

    // Initialize helpful buttons
    const helpfulButtons = document.querySelectorAll('.helpful-btn');

    helpfulButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Get current count
            let text = this.textContent.trim();
            let count = parseInt(text.match(/\d+/)[0]) || 0;

            // Check if button is already active
            if (this.classList.contains('active')) {
                // Remove active class and decrease count
                this.classList.remove('active');
                count--;
            } else {
                // Add active class and increase count
                this.classList.add('active');
                count++;
            }

            // Update button text
            if (this.classList.contains('yes')) {
                this.innerHTML = `<i class="fas fa-thumbs-up"></i> Yes (${count})`;
            } else {
                this.innerHTML = `<i class="fas fa-thumbs-down"></i> No (${count})`;
            }
        });
    });

    // Initialize review filters
    const sortReviews = document.getElementById('sort-reviews');
    const filterReviews = document.getElementById('filter-reviews');

    if (sortReviews) {
        sortReviews.addEventListener('change', function() {
            // Sort reviews based on selection
            console.log('Sort reviews by:', this.value);
        });
    }

    if (filterReviews) {
        filterReviews.addEventListener('change', function() {
            // Filter reviews based on selection
            console.log('Filter reviews by:', this.value);
        });
    }

    // Initialize load more reviews button
    const loadMoreBtn = document.querySelector('.load-more-reviews');

    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', function() {
            console.log('Load more reviews');
            this.disabled = true;
            this.textContent = 'Loading...';

            setTimeout(() => {
                this.textContent = 'No More Reviews';
            }, 1000);
        });
    }

    // Initialize review form submission
    if (reviewForm) {
        reviewForm.addEventListener('submit', function(e) {
            e.preventDefault();

            console.log('Review form submitted');

            if (successMessage) {
                successMessage.style.display = 'block';

                // Reset form
                reviewForm.reset();

                // Hide form after delay
                setTimeout(() => {
                    reviewFormContainer.style.display = 'none';
                    successMessage.style.display = 'none';
                }, 3000);
            }
        });
    }
}

/**
 * Initialize back to top button functionality
 */
function initBackToTopButton() {
    const backToTopBtn = document.getElementById('backToTop');
    
    if (!backToTopBtn) return;
    
    // Show/hide button based on scroll position
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            backToTopBtn.style.display = 'flex';
            backToTopBtn.classList.add('show');
        } else {
            backToTopBtn.classList.remove('show');
            setTimeout(() => {
                if (!backToTopBtn.classList.contains('show')) {
                    backToTopBtn.style.display = 'none';
                }
            }, 300);
        }
    });
    
    // Scroll to top when button is clicked
    backToTopBtn.addEventListener('click', function(e) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

/**
 * Initialize cart functionality
 */
function initCartFunctionality() {
    const addToCartBtn = document.querySelector('.add-to-cart-btn');
    
    if (!addToCartBtn) return;
    
    addToCartBtn.addEventListener('click', function() {
        // Get product details
        const productTitle = document.querySelector('.product-title').textContent;
        const productPrice = document.querySelector('.current-price').textContent;
        const productQuantity = parseInt(document.querySelector('.quantity-input').value) || 1;
        
        // Add animation effect
        this.classList.add('adding');
        this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
        
        // Simulate adding to cart (in a real implementation, this would be an AJAX call)
        setTimeout(() => {
            // Reset button
            this.classList.remove('adding');
            this.innerHTML = '<i class="fas fa-check"></i> Added to Cart';
            
            // Update cart counter
            const cartCount = document.querySelector('.cart-count');
            if (cartCount) {
                const currentCount = parseInt(cartCount.textContent) || 0;
                cartCount.textContent = currentCount + productQuantity;
                
                // Add pulse animation to cart icon
                cartCount.classList.add('pulse');
                setTimeout(() => {
                    cartCount.classList.remove('pulse');
                }, 1000);
            }
            
            // Show success message
            showNotification(`${productTitle} has been added to your cart`, 'success');
            
            // Reset button after delay
            setTimeout(() => {
                this.innerHTML = '<i class="fas fa-shopping-cart"></i> Add to Cart';
            }, 2000);
        }, 1000);
    });
}

/**
 * Initialize wishlist functionality
 */
function initWishlistFunctionality() {
    const wishlistBtn = document.querySelector('.wishlist-btn');
    
    if (!wishlistBtn) return;
    
    wishlistBtn.addEventListener('click', function() {
        // Toggle active class
        this.classList.toggle('active');
        
        // Update icon
        const icon = this.querySelector('i');
        
        if (this.classList.contains('active')) {
            icon.className = 'fas fa-heart';
            showNotification('Product added to your wishlist', 'success');
        } else {
            icon.className = 'far fa-heart';
            showNotification('Product removed from your wishlist', 'info');
        }
    });
}

/**
 * Initialize social share functionality
 */
function initSocialShareFunctionality() {
    const shareButtons = document.querySelectorAll('.share-btn');
    
    if (!shareButtons.length) return;
    
    shareButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get current page URL
            const url = encodeURIComponent(window.location.href);
            const title = encodeURIComponent(document.title);
            
            // Determine which platform was clicked
            if (this.classList.contains('facebook')) {
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, 'facebook-share', 'width=580,height=296');
            } else if (this.classList.contains('twitter')) {
                window.open(`https://twitter.com/intent/tweet?text=${title}&url=${url}`, 'twitter-share', 'width=550,height=235');
            } else if (this.classList.contains('pinterest')) {
                // Get product image
                const image = encodeURIComponent(document.querySelector('.main-product-image').src);
                window.open(`https://pinterest.com/pin/create/button/?url=${url}&media=${image}&description=${title}`, 'pinterest-share', 'width=750,height=350');
            } else if (this.classList.contains('whatsapp')) {
                window.open(`https://api.whatsapp.com/send?text=${title} ${url}`, 'whatsapp-share', 'width=580,height=296');
            } else if (this.classList.contains('email')) {
                window.location.href = `mailto:?subject=${title}&body=Check out this product: ${url}`;
            }
        });
    });
}

/**
 * Show notification message
 * @param {string} message - The message to display
 * @param {string} type - The type of notification (success, error, info, warning)
 */
function showNotification(message, type = 'info') {
    // Check if a notification container already exists
    let notificationContainer = document.querySelector('.notification-container');
    
    // If not, create one
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.className = 'notification-container';
        document.body.appendChild(notificationContainer);
        
        // Add styles for the notification container
        notificationContainer.style.position = 'fixed';
        notificationContainer.style.top = '20px';
        notificationContainer.style.right = '20px';
        notificationContainer.style.zIndex = '9999';
        notificationContainer.style.display = 'flex';
        notificationContainer.style.flexDirection = 'column';
        notificationContainer.style.alignItems = 'flex-end';
    }
    
    // Create a new notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Add styles for the notification
    notification.style.backgroundColor = type === 'success' ? '#28a745' : 
                                          type === 'error' ? '#dc3545' : 
                                          type === 'warning' ? '#ffc107' : '#17a2b8';
    notification.style.color = type === 'warning' ? '#212529' : '#fff';
    notification.style.padding = '12px 20px';
    notification.style.borderRadius = '4px';
    notification.style.marginBottom = '10px';
    notification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
    notification.style.transform = 'translateX(100%)';
    notification.style.opacity = '0';
    notification.style.transition = 'all 0.3s ease-in-out';
    
    // Add the notification to the container
    notificationContainer.appendChild(notification);
    
    // Trigger animation
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
        notification.style.opacity = '1';
    }, 10);
    
    // Remove the notification after a delay
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        notification.style.opacity = '0';
        
        setTimeout(() => {
            notification.remove();
            
            // Remove the container if it's empty
            if (notificationContainer.children.length === 0) {
                notificationContainer.remove();
            }
        }, 300);
    }, 3000);
}