/*
* AfriMart Depot - Blog & Recipes JavaScript
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
  
    // Featured Recipes Slider
    const featuredSlider = document.querySelector('.featured-slider');
    
    if (featuredSlider) {
      const featuredCards = featuredSlider.querySelectorAll('.featured-card');
      const prevButton = document.querySelector('.prev-slide');
      const nextButton = document.querySelector('.next-slide');
      
      // Set initial state
      let currentIndex = 0;
      let slidesToShow = getSlidesToShow();
      
      // Determine number of slides to show based on viewport width
      function getSlidesToShow() {
        if (window.innerWidth >= 992) {
          return 3;
        } else if (window.innerWidth >= 768) {
          return 2;
        } else {
          return 1;
        }
      }
      
      // Show/hide slides based on current index
      function updateSlider() {
        featuredCards.forEach((card, index) => {
          if (index >= currentIndex && index < currentIndex + slidesToShow) {
            card.style.display = 'block';
          } else {
            card.style.display = 'none';
          }
        });
        
        // Disable/enable prev/next buttons
        prevButton.disabled = currentIndex === 0;
        nextButton.disabled = currentIndex + slidesToShow >= featuredCards.length;
        
        prevButton.style.opacity = prevButton.disabled ? '0.5' : '1';
        nextButton.style.opacity = nextButton.disabled ? '0.5' : '1';
      }
      
      // Initialize the slider
      updateSlider();
      
      // Add event listeners to buttons
      if (prevButton && nextButton) {
        prevButton.addEventListener('click', function() {
          if (currentIndex > 0) {
            currentIndex--;
            updateSlider();
          }
        });
        
        nextButton.addEventListener('click', function() {
          if (currentIndex + slidesToShow < featuredCards.length) {
            currentIndex++;
            updateSlider();
          }
        });
      }
      
      // Handle window resize
      window.addEventListener('resize', function() {
        const newSlidesToShow = getSlidesToShow();
        if (newSlidesToShow !== slidesToShow) {
          slidesToShow = newSlidesToShow;
          // Reset to first slide on resize
          currentIndex = 0;
          updateSlider();
        }
      });
    }
  
    // Products Slider
    const productsSlider = document.querySelector('.products-slider');
    
    if (productsSlider) {
      const productCards = productsSlider.querySelectorAll('.product-card');
      const prevButton = document.querySelector('.prev-product');
      const nextButton = document.querySelector('.next-product');
      
      // Set initial state
      let currentIndex = 0;
      let slidesToShow = getProductSlidesToShow();
      
      // Determine number of slides to show based on viewport width
      function getProductSlidesToShow() {
        if (window.innerWidth >= 1200) {
          return 4;
        } else if (window.innerWidth >= 992) {
          return 3;
        } else if (window.innerWidth >= 768) {
          return 2;
        } else {
          return 1;
        }
      }
      
      // Show/hide slides based on current index
      function updateProductSlider() {
        productCards.forEach((card, index) => {
          if (index >= currentIndex && index < currentIndex + slidesToShow) {
            card.style.display = 'block';
          } else {
            card.style.display = 'none';
          }
        });
        
        // Disable/enable prev/next buttons
        prevButton.disabled = currentIndex === 0;
        nextButton.disabled = currentIndex + slidesToShow >= productCards.length;
        
        prevButton.style.opacity = prevButton.disabled ? '0.5' : '1';
        nextButton.style.opacity = nextButton.disabled ? '0.5' : '1';
      }
      
      // Initialize the slider
      updateProductSlider();
      
      // Add event listeners to buttons
      if (prevButton && nextButton) {
        prevButton.addEventListener('click', function() {
          if (currentIndex > 0) {
            currentIndex--;
            updateProductSlider();
          }
        });
        
        nextButton.addEventListener('click', function() {
          if (currentIndex + slidesToShow < productCards.length) {
            currentIndex++;
            updateProductSlider();
          }
        });
      }
      
      // Handle window resize
      window.addEventListener('resize', function() {
        const newSlidesToShow = getProductSlidesToShow();
        if (newSlidesToShow !== slidesToShow) {
          slidesToShow = newSlidesToShow;
          // Reset to first slide on resize
          currentIndex = 0;
          updateProductSlider();
        }
      });
    }
  
    // Add to Cart functionality
    const addToCartButtons = document.querySelectorAll('.add-to-cart');
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
            button.textContent = 'Add to Cart';
            button.style.backgroundColor = '';
          }, 1500);
        });
      });
    }
  
    // Handle search form submission
    const searchForms = document.querySelectorAll('.search-form');
    
    if (searchForms.length) {
      searchForms.forEach(form => {
        form.addEventListener('submit', function(e) {
          e.preventDefault();
          const searchInput = this.querySelector('input');
          const searchTerm = searchInput.value.trim();
          
          if (searchTerm) {
            // Redirect to search results page (in a real app)
            // For demo purposes, we'll just show an alert
            alert(`Searching for: ${searchTerm}`);
            searchInput.value = '';
          }
        });
      });
    }
  
    // Newsletter subscription
    const newsletterForms = document.querySelectorAll('.newsletter-form');
    
    if (newsletterForms.length) {
      newsletterForms.forEach(form => {
        form.addEventListener('submit', function(e) {
          e.preventDefault();
          const emailInput = this.querySelector('input[type="email"]');
          const email = emailInput.value.trim();
          
          if (email && isValidEmail(email)) {
            // Show success message (in a real app this would send to server)
            alert('Thank you for subscribing to our newsletter!');
            form.reset();
          } else {
            alert('Please enter a valid email address.');
          }
        });
      });
      
      function isValidEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
      }
    }
  
    // Category and Tag filtering
    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = urlParams.get('category');
    const tagParam = urlParams.get('tag');
    
    // In a real app, this would filter posts based on the parameters
    if (categoryParam || tagParam) {
      let filterText = '';
      
      if (categoryParam) {
        filterText = `Showing posts in category: ${categoryParam.replace('-', ' ')}`;
      } else if (tagParam) {
        filterText = `Showing posts with tag: ${tagParam.replace('-', ' ')}`;
      }
      
      // We'll just log it for demo purposes
      console.log(filterText);
    }
  
    // Smooth scrolling for anchor links
    const anchors = document.querySelectorAll('a[href^="#"]:not([href="#"])');
    
    if (anchors.length) {
      anchors.forEach(anchor => {
        anchor.addEventListener('click', function(e) {
          e.preventDefault();
          
          const targetId = this.getAttribute('href');
          const targetElement = document.querySelector(targetId);
          
          if (targetElement) {
            window.scrollTo({
              top: targetElement.offsetTop - 100,
              behavior: 'smooth'
            });
          }
        });
      });
    }
  
    // Parallax effect for CTA section
    const ctaSection = document.querySelector('.cta-section');
    
    if (ctaSection) {
      window.addEventListener('scroll', function() {
        const scrollPosition = window.pageYOffset;
        const sectionPosition = ctaSection.offsetTop;
        const distance = scrollPosition - sectionPosition;
        
        if (distance < window.innerHeight && distance > -window.innerHeight) {
          ctaSection.style.backgroundPositionY = `${distance * 0.1}px`;
        }
      });
    }
  });