/*
* AfriMart Depot - Main JavaScript
* Version: 2.0
*/

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
  
  // Product Slider
  const productSlider = document.querySelector('.product-slider');
  
  if (productSlider) {
    const sliderWrapper = productSlider.querySelector('.product-slider-wrapper');
    const slides = productSlider.querySelectorAll('.product-card');
    const prevButton = productSlider.querySelector('.prev-slide');
    const nextButton = productSlider.querySelector('.next-slide');
    
    if (sliderWrapper && slides.length && prevButton && nextButton) {
      let currentIndex = 0;
      const slidesToShow = getSlidesToShow();
      const totalSlides = slides.length;
      
      function getSlidesToShow() {
        if (window.innerWidth >= 992) {
          return 4;
        } else if (window.innerWidth >= 768) {
          return 2;
        } else {
          return 1;
        }
      }
      
      function updateSliderPosition() {
        const slideWidth = slides[0].offsetWidth + 30; // Including margin
        sliderWrapper.style.transform = `translateX(-${currentIndex * slideWidth}px)`;
      }
      
      function goToSlide(index) {
        currentIndex = Math.max(0, Math.min(index, totalSlides - slidesToShow));
        updateSliderPosition();
        
        // Update button states (optional)
        prevButton.classList.toggle('disabled', currentIndex === 0);
        nextButton.classList.toggle('disabled', currentIndex === totalSlides - slidesToShow);
      }
      
      prevButton.addEventListener('click', function() {
        if (currentIndex > 0) {
          goToSlide(currentIndex - 1);
        }
      });
      
      nextButton.addEventListener('click', function() {
        if (currentIndex < totalSlides - slidesToShow) {
          goToSlide(currentIndex + 1);
        }
      });
      
      // Responsive slides
      window.addEventListener('resize', function() {
        const newSlidesToShow = getSlidesToShow();
        if (slidesToShow !== newSlidesToShow) {
          goToSlide(0);
        }
        
        // Update slider position after resize
        setTimeout(updateSliderPosition, 100);
      });
      
      // Initialize
      updateSliderPosition();
      
      // Optional: Add touch swipe support for mobile
      let touchStartX = 0;
      let touchEndX = 0;
      
      sliderWrapper.addEventListener('touchstart', function(e) {
        touchStartX = e.changedTouches[0].screenX;
      }, { passive: true });
      
      sliderWrapper.addEventListener('touchend', function(e) {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
      }, { passive: true });
      
      function handleSwipe() {
        if (touchEndX < touchStartX - 50) {
          // Swipe left
          goToSlide(currentIndex + 1);
        } else if (touchEndX > touchStartX + 50) {
          // Swipe right
          goToSlide(currentIndex - 1);
        }
      }
    }
  }
  
  // Testimonials Slider
  const testimonialsSlider = document.querySelector('.testimonials-slider');
  
  if (testimonialsSlider) {
    const wrapper = testimonialsSlider.querySelector('.testimonials-wrapper');
    const cards = testimonialsSlider.querySelectorAll('.testimonial-card');
    const dots = testimonialsSlider.querySelectorAll('.dot');
    let currentSlide = 0;

    function updateSlider() {
      if (window.innerWidth < 769) {
        wrapper.style.transform = `translateX(-${currentSlide * 100}%)`;
      } else {
        currentSlide = 0; // Reset to the first slide on desktop
        wrapper.style.transform = 'translateX(0)';
      }
      updateDots();
    }
    
    // Add click event to dots
    dots.forEach((dot, index) => {
      dot.addEventListener('click', function() {
        currentSlide = index;
        updateSlider();
      });
    });
    
    // Add touch/swipe support
    let touchStartX = 0;
    let touchEndX = 0;
    
    wrapper.addEventListener('touchstart', function(e) {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    wrapper.addEventListener('touchend', function(e) {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    }, { passive: true });
    
    function handleSwipe() {
      const threshold = 50;
      
      if (touchEndX < touchStartX - threshold && currentSlide < cards.length - 1) {
        // Swipe left - next slide
        currentSlide++;
        updateSlider();
      } else if (touchEndX > touchStartX + threshold && currentSlide > 0) {
        // Swipe right - previous slide
        currentSlide--;
        updateSlider();
      }
    }

    window.addEventListener('resize', updateSlider);
    updateSlider(); // Call initially to set the correct state

    function updateDots() {
      dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentSlide);
      });
    }
  }
  
  // Countdown Timer
  const countdownTimer = document.querySelector('.countdown-timer');
  
  if (countdownTimer) {
    const daysElement = countdownTimer.querySelector('.days');
    const hoursElement = countdownTimer.querySelector('.hours');
    const minutesElement = countdownTimer.querySelector('.minutes');
    const secondsElement = countdownTimer.querySelector('.seconds');
    
    // Set the date we're counting down to (3 days from now)
    const now = new Date();
    const countDownDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    
    function updateCountdown() {
      // Get current date and time
      const now = new Date().getTime();
      
      // Find the distance between now and the countdown date
      const distance = countDownDate - now;
      
      // Time calculations for days, hours, minutes and seconds
      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);
      
      // Display the result
      daysElement.textContent = String(days).padStart(2, '0');
      hoursElement.textContent = String(hours).padStart(2, '0');
      minutesElement.textContent = String(minutes).padStart(2, '0');
      secondsElement.textContent = String(seconds).padStart(2, '0');
      
      // If the countdown is over, clear interval
      if (distance < 0) {
        clearInterval(countdownInterval);
        daysElement.textContent = '00';
        hoursElement.textContent = '00';
        minutesElement.textContent = '00';
        secondsElement.textContent = '00';
      }
    }
    
    // Initialize countdown
    updateCountdown();
    
    // Update the countdown every 1 second
    const countdownInterval = setInterval(updateCountdown, 1000);
  }
  
  // Add to Cart Functionality
  const addToCartButtons = document.querySelectorAll('.add-to-cart');
  const cartCount = document.querySelector('.cart-count');
  
  if (addToCartButtons.length && cartCount) {
    // Get initial count from localStorage or default to 0
    let count = parseInt(localStorage.getItem('cartCount') || '0');
    
    // Update cart count display initially
    cartCount.textContent = count;
    
    addToCartButtons.forEach(button => {
      button.addEventListener('click', function() {
        count++;
        cartCount.textContent = count;
        
        // Save to localStorage
        localStorage.setItem('cartCount', count.toString());
        
        // Add animation effect
        const originalText = button.textContent;
        button.innerHTML = '<i class="fas fa-check"></i> Added!';
        button.classList.add('added');
        
        setTimeout(() => {
          button.innerHTML = originalText;
          button.classList.remove('added');
        }, 1500);
        
        // Optional: Show mini cart notification
        showCartNotification();
      });
    });
    
    function showCartNotification() {
      // Check if notification already exists
      let notification = document.querySelector('.cart-notification');
      
      if (!notification) {
        // Create notification if it doesn't exist
        notification = document.createElement('div');
        notification.className = 'cart-notification';
        notification.innerHTML = '<i class="fas fa-check-circle"></i> Item added to cart';
        document.body.appendChild(notification);
      }
      
      // Show notification
      notification.classList.add('active');
      
      // Hide after 3 seconds
      setTimeout(() => {
        notification.classList.remove('active');
      }, 3000);
    }
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
  
  // Add CSS for cart notification
  const style = document.createElement('style');
  style.textContent = `
    .cart-notification {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background-color: var(--primary-color);
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