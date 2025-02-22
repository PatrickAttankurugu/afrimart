/*
* AfriMart Depot - About Page JavaScript
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
  
    // FAQ Accordion
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
            accItem.querySelector('.accordion-content').style.maxHeight = null;
            accItem.querySelector('.accordion-header i').className = 'fas fa-plus';
          });
          
          // If the clicked item wasn't active, open it
          if (!isActive) {
            item.classList.add('active');
            content.style.maxHeight = content.scrollHeight + 'px';
            icon.className = 'fas fa-minus';
          }
        });
      });
      
      // Open the first item by default
      accordionItems[0].classList.add('active');
      accordionItems[0].querySelector('.accordion-content').style.maxHeight = 
        accordionItems[0].querySelector('.accordion-content').scrollHeight + 'px';
      accordionItems[0].querySelector('.accordion-header i').className = 'fas fa-minus';
    }
    
    // Testimonials Slider
    const testimonialSlider = document.querySelector('.testimonials-slider');
    
    if (testimonialSlider) {
      const sliderWrapper = testimonialSlider.querySelector('.testimonials-wrapper');
      const testimonials = sliderWrapper.querySelectorAll('.testimonial-card');
      const dots = testimonialSlider.querySelectorAll('.dot');
      let currentIndex = 0;
      
      function showTestimonial(index) {
        // Hide all testimonials
        testimonials.forEach(testimonial => {
          testimonial.style.display = 'none';
        });
        
        // Show the current testimonial
        testimonials[index].style.display = 'block';
        
        // Update the dots
        dots.forEach((dot, i) => {
          dot.classList.toggle('active', i === index);
        });
      }
      
      // Set up dot navigation
      dots.forEach((dot, i) => {
        dot.addEventListener('click', function() {
          currentIndex = i;
          showTestimonial(currentIndex);
        });
      });
      
      // Auto rotate testimonials
      function autoRotate() {
        currentIndex = (currentIndex + 1) % testimonials.length;
        showTestimonial(currentIndex);
      }
      
      let interval = setInterval(autoRotate, 5000);
      
      // Pause auto-rotation on hover
      testimonialSlider.addEventListener('mouseenter', function() {
        clearInterval(interval);
      });
      
      testimonialSlider.addEventListener('mouseleave', function() {
        interval = setInterval(autoRotate, 5000);
      });
      
      // Initialize slider
      showTestimonial(currentIndex);
    }
    
    // Team member hover effect
    const teamMembers = document.querySelectorAll('.team-member');
    
    if (teamMembers.length) {
      teamMembers.forEach(member => {
        member.addEventListener('mouseenter', function() {
          this.classList.add('hovered');
        });
        
        member.addEventListener('mouseleave', function() {
          this.classList.remove('hovered');
        });
      });
    }
  });