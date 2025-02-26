/*
* AfriMart Depot - About Page JavaScript
* Version: 2.0
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

  // Team Member Flip Card Effect
  const teamMembers = document.querySelectorAll('.team-member');
  if (teamMembers.length) {
    teamMembers.forEach(member => {
      member.addEventListener('click', function() {
        this.querySelector('.member-card').classList.toggle('flipped');
      });

      // Add hover effect for desktop
      member.addEventListener('mouseenter', function() {
        if (window.innerWidth > 768) {
          this.querySelector('.member-card').classList.add('flipped');
        }
      });

      member.addEventListener('mouseleave', function() {
        if (window.innerWidth > 768) {
          this.querySelector('.member-card').classList.remove('flipped');
        }
      });
    });
  }

  // Interactive Map
  const mapMarkers = document.querySelectorAll('.map-marker');
  const locationInfos = document.querySelectorAll('.location-info');

  if (mapMarkers.length) {
    mapMarkers.forEach(marker => {
      marker.addEventListener('click', function() {
        const location = this.getAttribute('data-location');
        
        // Remove active class from all markers and info boxes
        mapMarkers.forEach(m => m.classList.remove('active'));
        locationInfos.forEach(info => info.classList.remove('active'));
        
        // Add active class to clicked marker and corresponding info box
        this.classList.add('active');
        document.querySelector(`.location-info.${location}`).classList.add('active');
      });
    });
  }

  // Testimonial Carousel
  const testimonialTrack = document.querySelector('.testimonial-track');
  const testimonialCards = document.querySelectorAll('.testimonial-card');
  const prevButton = document.querySelector('.prev-testimonial');
  const nextButton = document.querySelector('.next-testimonial');
  const dots = document.querySelectorAll('.testimonial-dots .dot');
  let currentIndex = 0;
  const cardWidth = 100; // 100% width

  function updateCarousel() {
    // Update the transform property to slide to the current index
    testimonialTrack.style.transform = `translateX(-${currentIndex * cardWidth}%)`;
    
    // Update active dot
    dots.forEach((dot, index) => {
      dot.classList.toggle('active', index === currentIndex);
    });
  }

  if (testimonialTrack && prevButton && nextButton) {
    // Previous button click handler
    prevButton.addEventListener('click', function() {
      currentIndex = currentIndex > 0 ? currentIndex - 1 : testimonialCards.length - 1;
      updateCarousel();
    });

    // Next button click handler
    nextButton.addEventListener('click', function() {
      currentIndex = currentIndex < testimonialCards.length - 1 ? currentIndex + 1 : 0;
      updateCarousel();
    });

    // Dot click handlers
    dots.forEach((dot, index) => {
      dot.addEventListener('click', function() {
        currentIndex = index;
        updateCarousel();
      });
    });

    // Auto-play the carousel
    let carouselInterval = setInterval(() => {
      currentIndex = (currentIndex + 1) % testimonialCards.length;
      updateCarousel();
    }, 5000);

    // Pause auto-play on hover/touch
    testimonialTrack.addEventListener('mouseenter', () => {
      clearInterval(carouselInterval);
    });

    testimonialTrack.addEventListener('mouseleave', () => {
      carouselInterval = setInterval(() => {
        currentIndex = (currentIndex + 1) % testimonialCards.length;
        updateCarousel();
      }, 5000);
    });

    // Touch events for mobile swiping
    let startX, moveX, currentTranslate;
    
    testimonialTrack.addEventListener('touchstart', (e) => {
      clearInterval(carouselInterval);
      startX = e.touches[0].clientX;
      currentTranslate = -currentIndex * cardWidth;
    }, { passive: true });

    testimonialTrack.addEventListener('touchmove', (e) => {
      moveX = e.touches[0].clientX;
      const diff = moveX - startX;
      const translate = (diff / testimonialTrack.offsetWidth) * 100;
      testimonialTrack.style.transform = `translateX(${currentTranslate + translate}%)`;
    }, { passive: true });

    testimonialTrack.addEventListener('touchend', (e) => {
      const diff = moveX - startX;
      
      if (diff > 50) {
        // Swipe right - previous slide
        currentIndex = Math.max(0, currentIndex - 1);
      } else if (diff < -50) {
        // Swipe left - next slide
        currentIndex = Math.min(testimonialCards.length - 1, currentIndex + 1);
      }
      
      updateCarousel();
      
      // Resume auto-play
      carouselInterval = setInterval(() => {
        currentIndex = (currentIndex + 1) % testimonialCards.length;
        updateCarousel();
      }, 5000);
    }, { passive: true });
  }

  // Video Modal
  const videoButton = document.getElementById('playVideo');
  
  if (videoButton) {
    videoButton.addEventListener('click', function() {
      // Create modal element
      const modal = document.createElement('div');
      modal.className = 'video-modal';
      
      // Create modal content
      modal.innerHTML = `
        <div class="video-modal-overlay"></div>
        <div class="video-modal-container">
          <div class="video-modal-content">
            <button class="video-modal-close" aria-label="Close video">
              <i class="fas fa-times"></i>
            </button>
            <div class="video-wrapper">
              <iframe width="560" height="315" src="https://www.youtube.com/embed/VIDEO_ID?autoplay=1" title="AfriMart Depot Video" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
            </div>
          </div>
        </div>
      `;
      
      // Append modal to body
      document.body.appendChild(modal);
      
      // Prevent body scrolling
      document.body.style.overflow = 'hidden';
      
      // Modal close button event listener
      const closeButton = modal.querySelector('.video-modal-close');
      const overlay = modal.querySelector('.video-modal-overlay');
      
      closeButton.addEventListener('click', closeVideoModal);
      overlay.addEventListener('click', closeVideoModal);
      
      // Close modal function
      function closeVideoModal() {
        document.body.removeChild(modal);
        document.body.style.overflow = '';
      }
      
      // Close on escape key
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && document.querySelector('.video-modal')) {
          closeVideoModal();
        }
      });
    });
  }

  // Partners Marquee Animation
  const marqueeContent = document.querySelector('.marquee-content');
  
  if (marqueeContent) {
    // Check if we need to animate (only on desktop)
    const shouldAnimate = window.innerWidth > 768;
    
    if (shouldAnimate) {
      // Set animation
      marqueeContent.style.animation = 'marquee 30s linear infinite';
      
      // Pause on hover
      marqueeContent.addEventListener('mouseenter', () => {
        marqueeContent.style.animationPlayState = 'paused';
      });
      
      marqueeContent.addEventListener('mouseleave', () => {
        marqueeContent.style.animationPlayState = 'running';
      });
    }
    
    // Update animation on window resize
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768) {
        marqueeContent.style.animation = 'marquee 30s linear infinite';
      } else {
        marqueeContent.style.animation = 'none';
      }
    });
  }

  // Image Gallery Interaction
  const galleryItems = document.querySelectorAll('.gallery-item');
  
  if (galleryItems.length) {
    galleryItems.forEach(item => {
      item.addEventListener('mouseenter', function() {
        // Scale up image slightly
        const img = this.querySelector('img');
        img.style.transform = 'scale(1.05)';
        
        // Fade in caption
        const caption = this.querySelector('.gallery-caption');
        caption.style.opacity = '1';
      });
      
      item.addEventListener('mouseleave', function() {
        // Scale back image
        const img = this.querySelector('img');
        img.style.transform = 'scale(1)';
        
        // Fade out caption
        const caption = this.querySelector('.gallery-caption');
        caption.style.opacity = '0.7';
      });
    });
  }

  // Parallax effect for sections with the parallax-window class
  const parallaxElements = document.querySelectorAll('.parallax-window');
  
  if (parallaxElements.length) {
    // Function to update parallax effect
    function updateParallax() {
      parallaxElements.forEach(element => {
        const scrollPosition = window.pageYOffset;
        const elementPosition = element.offsetTop;
        const distance = scrollPosition - elementPosition;
        
        // Only apply effect when element is in view
        if (scrollPosition + window.innerHeight > elementPosition && 
            scrollPosition < elementPosition + element.offsetHeight) {
          
          // Move background image at different speed than scroll
          const background = element.querySelector('.container');
          if (background) {
            background.style.transform = `translateY(${distance * 0.3}px)`;
          }
        }
      });
    }
    
    // Initial check
    updateParallax();
    
    // Update on scroll
    window.addEventListener('scroll', updateParallax);
  }

  // Values Card Interaction
  const valueCards = document.querySelectorAll('.value-card');
  
  if (valueCards.length) {
    valueCards.forEach(card => {
      card.addEventListener('mouseenter', function() {
        // Pulse animation for icon
        const icon = this.querySelector('.value-icon');
        icon.classList.add('pulse');
        
        // Highlight card
        this.classList.add('highlighted');
      });
      
      card.addEventListener('mouseleave', function() {
        // Remove animations
        const icon = this.querySelector('.value-icon');
        icon.classList.remove('pulse');
        
        // Remove highlight
        this.classList.remove('highlighted');
      });
    });
  }

  // Smooth scrolling for anchor links
  const anchorLinks = document.querySelectorAll('a[href^="#"]:not([href="#"])');
  
  if (anchorLinks.length) {
    anchorLinks.forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
          const headerOffset = 100;
          const elementPosition = targetElement.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
          
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      });
    });
  }

  // Back to top button
  const backToTopButton = document.getElementById('backToTop');
  
  if (backToTopButton) {
    // Show/hide button based on scroll position
    window.addEventListener('scroll', function() {
      if (window.pageYOffset > 300) {
        backToTopButton.classList.add('active');
      } else {
        backToTopButton.classList.remove('active');
      }
    });
    
    // Smooth scroll to top
    backToTopButton.addEventListener('click', function(e) {
      e.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }
});

// Add CSS animations keyframes dynamically
(function addKeyframes() {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); }
    }
    
    @keyframes marquee {
      0% { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
    
    @keyframes bounce {
      0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
      40% { transform: translateY(-10px); }
      60% { transform: translateY(-5px); }
    }
    
    .pulse {
      animation: pulse 1s infinite;
    }
  `;
  document.head.appendChild(style);
})();