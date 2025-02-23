/*
* AfriMart Depot - Main JavaScript
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
        }
        
        prevButton.addEventListener('click', function() {
          goToSlide(currentIndex - 1);
        });
        
        nextButton.addEventListener('click', function() {
          goToSlide(currentIndex + 1);
        });
        
        // Responsive slides
        window.addEventListener('resize', function() {
          const newSlidesToShow = getSlidesToShow();
          if (slidesToShow !== newSlidesToShow) {
            goToSlide(0);
          }
        });
        
        // Initialize
        updateSliderPosition();
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
      let count = 0;
      
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
        } else {
          emailInput.classList.add('error');
          
          setTimeout(() => {
            emailInput.classList.remove('error');
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
    
    if (parallaxElements.length) {
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
  });