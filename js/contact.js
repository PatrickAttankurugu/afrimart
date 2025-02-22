/*
* AfriMart Depot - Contact Page JavaScript
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
  
    // Contact Form Handling
    const contactForm = document.getElementById('contact-form');
    const successMessage = document.querySelector('.success-message');
    const errorMessage = document.querySelector('.error-message');
  
    if (contactForm) {
      contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
  
        // Simple client-side validation
        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');
        const subjectInput = document.getElementById('subject');
        const messageInput = document.getElementById('message');
        const privacyCheckbox = document.querySelector('input[name="privacy"]');
  
        let isValid = true;
  
        // Check required fields
        if (!nameInput.value.trim()) {
          nameInput.style.borderColor = '#dc3545';
          isValid = false;
        } else {
          nameInput.style.borderColor = '#e1e1e1';
        }
  
        if (!emailInput.value.trim() || !isValidEmail(emailInput.value)) {
          emailInput.style.borderColor = '#dc3545';
          isValid = false;
        } else {
          emailInput.style.borderColor = '#e1e1e1';
        }
  
        if (!subjectInput.value.trim()) {
          subjectInput.style.borderColor = '#dc3545';
          isValid = false;
        } else {
          subjectInput.style.borderColor = '#e1e1e1';
        }
  
        if (!messageInput.value.trim()) {
          messageInput.style.borderColor = '#dc3545';
          isValid = false;
        } else {
          messageInput.style.borderColor = '#e1e1e1';
        }
  
        if (!privacyCheckbox.checked) {
          privacyCheckbox.nextElementSibling.style.borderColor = '#dc3545';
          isValid = false;
        } else {
          privacyCheckbox.nextElementSibling.style.borderColor = '#e1e1e1';
        }
  
        if (!isValid) {
          errorMessage.textContent = 'Please fill in all required fields correctly.';
          errorMessage.style.display = 'block';
          successMessage.style.display = 'none';
          return;
        }
  
        // Hide messages initially
        successMessage.style.display = 'none';
        errorMessage.style.display = 'none';
  
        // Disable form elements during submission
        const formElements = contactForm.elements;
        for (let i = 0; i < formElements.length; i++) {
          formElements[i].disabled = true;
        }
  
        // Simulate form submission (in a real application, this would be an AJAX request to a server)
        setTimeout(function() {
          // Enable form elements after submission
          for (let i = 0; i < formElements.length; i++) {
            formElements[i].disabled = false;
          }
  
          // Show success message
          successMessage.style.display = 'block';
          
          // Reset form
          contactForm.reset();
          
          // Scroll to success message
          successMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 1500);
      });
  
      // Function to validate email format
      function isValidEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
      }
  
      // Reset form validation styles on input
      const formInputs = contactForm.querySelectorAll('input, textarea');
      formInputs.forEach(input => {
        input.addEventListener('input', function() {
          this.style.borderColor = '#e1e1e1';
          errorMessage.style.display = 'none';
        });
      });
    }
  
    // FAQ Accordion Functionality
    const accordionItems = document.querySelectorAll('.accordion-item');
    
    if (accordionItems.length) {
      accordionItems.forEach(item => {
        const header = item.querySelector('.accordion-header');
        const content = item.querySelector('.accordion-content');
        const icon = header.querySelector('i');
        
        header.addEventListener('click', function() {
          // Check if this item is already active
          const isActive = item.classList.contains('active');
          
          // Close all items
          accordionItems.forEach(accItem => {
            accItem.classList.remove('active');
            const accContent = accItem.querySelector('.accordion-content');
            accContent.style.maxHeight = null;
            const accIcon = accItem.querySelector('.accordion-header i');
            accIcon.className = 'fas fa-plus';
          });
          
          // If the clicked item wasn't active, open it
          if (!isActive) {
            item.classList.add('active');
            content.style.maxHeight = content.scrollHeight + 'px';
            icon.className = 'fas fa-minus';
          }
        });
      });
      
      // Open the first FAQ item in each category by default
      const categories = document.querySelectorAll('.faq-category');
      categories.forEach(category => {
        const firstItem = category.querySelector('.accordion-item');
        if (firstItem) {
          const header = firstItem.querySelector('.accordion-header');
          header.click();
        }
      });
    }
    
    // Initialize Google Map (this is a placeholder - in a real application, you would use the actual Google Maps API)
    // This is just to simulate the map loading effect
    const mapWrapper = document.querySelector('.map-wrapper');
    
    if (mapWrapper) {
      mapWrapper.classList.add('loading');
      
      setTimeout(() => {
        mapWrapper.classList.remove('loading');
      }, 1000);
    }
  });