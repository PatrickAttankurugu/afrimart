/*
* AfriMart Depot - Contact Page JavaScript
* Version: 2.0
*/

document.addEventListener('DOMContentLoaded', function() {
  'use strict';

  // Initialize AOS Animation Library
  AOS.init({
    duration: 800,
    easing: 'ease-in-out',
    once: true,
    mirror: false,
    disable: 'mobile'
  });

  // Initialize Parallax Effect for hero and newsletter sections
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
  }

  // Header Scroll State
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
  handleHeaderScroll(); // Call initially to set the correct state

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

  // Contact Form Validation & Submission
  const contactForm = document.getElementById('contact-form');
  const successMessage = document.querySelector('.success-message');
  const errorMessage = document.querySelector('.error-message');

  if (contactForm) {
    const formInputs = contactForm.querySelectorAll('input, textarea');
    
    // Input validation styling on blur
    formInputs.forEach(input => {
      // Skip the checkbox
      if (input.type !== 'checkbox') {
        input.addEventListener('blur', function() {
          validateInput(this);
        });
      }
      
      // Clear validation styling on focus
      input.addEventListener('focus', function() {
        this.classList.remove('is-invalid');
        this.classList.remove('is-valid');
        
        // Hide error messages when user starts typing
        if (errorMessage.style.display === 'block') {
          errorMessage.style.display = 'none';
        }
      });
    });
    
    // Form submission
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Validate all inputs
      let isFormValid = true;
      formInputs.forEach(input => {
        if (!validateInput(input)) {
          isFormValid = false;
        }
      });
      
      if (!isFormValid) {
        showErrorMessage('Please fill in all required fields correctly.');
        return;
      }
      
      // Hide messages initially
      successMessage.style.display = 'none';
      errorMessage.style.display = 'none';
      
      // Show loading state
      const submitButton = contactForm.querySelector('button[type="submit"]');
      const originalButtonText = submitButton.textContent;
      submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
      submitButton.disabled = true;
      
      // Disable form elements during submission
      formInputs.forEach(input => {
        input.disabled = true;
      });
      
      // Simulate form submission (in a real application, replace with AJAX call to server)
      setTimeout(function() {
        // Hide loading state
        submitButton.innerHTML = originalButtonText;
        submitButton.disabled = false;
        
        // Enable form elements after submission
        formInputs.forEach(input => {
          input.disabled = false;
        });
        
        // Show success message with animation
        successMessage.style.display = 'block';
        successMessage.classList.add('fadeInUp');
        
        // Reset form
        contactForm.reset();
        formInputs.forEach(input => {
          if (input.type !== 'checkbox') {
            input.classList.remove('is-valid');
          }
        });
        
        // Scroll to success message
        successMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 2000);
    });
    
    // Input validation function
    function validateInput(input) {
      // Skip validation for non-required inputs
      if (!input.hasAttribute('required')) {
        return true;
      }
      
      let isValid = true;
      
      if (input.type === 'checkbox') {
        isValid = input.checked;
        const checkmark = input.nextElementSibling;
        if (!isValid) {
          checkmark.style.borderColor = '#dc3545';
        } else {
          checkmark.style.borderColor = '';
        }
      } else if (input.type === 'email') {
        isValid = input.value.trim() !== '' && isValidEmail(input.value.trim());
        toggleValidationClasses(input, isValid);
      } else {
        isValid = input.value.trim() !== '';
        toggleValidationClasses(input, isValid);
      }
      
      return isValid;
    }
    
    // Toggle validation classes
    function toggleValidationClasses(input, isValid) {
      if (isValid) {
        input.classList.remove('is-invalid');
        input.classList.add('is-valid');
      } else {
        input.classList.remove('is-valid');
        input.classList.add('is-invalid');
      }
    }
    
    // Show error message
    function showErrorMessage(message) {
      errorMessage.textContent = message;
      errorMessage.style.display = 'block';
      errorMessage.classList.add('fadeInUp');
      
      // Scroll to error message
      errorMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    
    // Email validation function
    function isValidEmail(email) {
      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return regex.test(email);
    }
  }

  // Initialize Google Map
  const mapWrapper = document.querySelector('.map-wrapper');
  
  if (mapWrapper) {
    // Add loading state to map
    mapWrapper.classList.add('loading');
    
    // Listen for iframe load event
    const mapIframe = mapWrapper.querySelector('iframe');
    if (mapIframe) {
      mapIframe.addEventListener('load', function() {
        // Remove loading state when map is loaded
        setTimeout(() => {
          mapWrapper.classList.remove('loading');
        }, 500); // Small delay for smoother transition
      });
    } else {
      // If no iframe found, remove loading state after a timeout
      setTimeout(() => {
        mapWrapper.classList.remove('loading');
      }, 1500);
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
        // Save original content
        const originalContent = newsletterForm.innerHTML;
        
        // Show success message
        newsletterForm.innerHTML = `
          <div class="success-message fadeInUp">
            <i class="fas fa-check-circle"></i>
            <p>Thank you for subscribing to our newsletter!</p>
          </div>
        `;
        
        // Restore form after some time (in a real application, this wouldn't happen)
        setTimeout(() => {
          newsletterForm.innerHTML = originalContent;
          const newEmailInput = newsletterForm.querySelector('input[type="email"]');
          if (newEmailInput) {
            newEmailInput.value = '';
          }
        }, 5000);
      } else {
        // Show error styling
        emailInput.classList.add('is-invalid');
        
        // Remove error styling after 3 seconds
        setTimeout(() => {
          emailInput.classList.remove('is-invalid');
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

  // Add parallax scroll effect to hero section
  const heroSection = document.querySelector('.contact-hero-section');
  if (heroSection) {
    window.addEventListener('scroll', function() {
      const scrollPosition = window.scrollY;
      if (scrollPosition < 600) {
        const translateY = scrollPosition * 0.3;
        heroSection.querySelector('.hero-content').style.transform = `translateY(${translateY}px)`;
      }
    });
  }

  // Add CSS classes for animation on scroll
  const animateElements = document.querySelectorAll('.contact-info-card, .social-icon, .form-group, .map-wrapper');
  
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };
  
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('fadeInUp');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);
    
    animateElements.forEach(element => {
      observer.observe(element);
    });
  } else {
    // Fallback for browsers that don't support IntersectionObserver
    animateElements.forEach(element => {
      element.classList.add('fadeInUp');
    });
  }
});

// Add form validation styling
document.head.insertAdjacentHTML('beforeend', `
<style>
  .is-invalid {
    border-color: #dc3545 !important;
    box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.1) !important;
    background-color: #fff !important;
  }
  
  .is-valid {
    border-color: #28a745 !important;
    box-shadow: 0 0 0 3px rgba(40, 167, 69, 0.1) !important;
    background-color: #fff !important;
  }
  
  .is-invalid:focus {
    border-color: #dc3545 !important;
  }
  
  .is-valid:focus {
    border-color: #28a745 !important;
  }
  
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translate3d(0, 30px, 0);
    }
    to {
      opacity: 1;
      transform: translate3d(0, 0, 0);
    }
  }
  
  .fadeInUp {
    animation: fadeInUp 0.6s ease-out;
  }
</style>
`);