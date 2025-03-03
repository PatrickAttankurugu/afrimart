/**
 * AfriMart Depot - API Service
 * 
 * Central service for making API calls to the backend server
 * This handles all communication with the backend API
 */

const ApiService = (() => {
    // Update Backend API base URL to your AWS instance
    const API_BASE_URL = 'https://35.175.245.151/api';
    
    // Helper function for making API requests
    async function fetchAPI(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        
        try {
            // Add a timeout for requests
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds timeout
            
            // Default headers for all requests
            const headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...options.headers
            };
            
            // Add auth token for admin endpoints if available
            if (endpoint.includes('/admin/') || localStorage.getItem('admin_token')) {
                headers['Authorization'] = `Bearer ${localStorage.getItem('admin_token')}`;
            }
            
            const response = await fetch(url, {
                ...options,
                headers,
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            // Handle HTTP errors
            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                console.error(`HTTP error ${response.status}: ${response.statusText}`, errorData);
                return {
                    success: false,
                    status: response.status,
                    error: errorData?.error || `Server returned ${response.status}: ${response.statusText}`
                };
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error(`API error (${endpoint}):`, error);
            
            // Provide more helpful error messages
            if (error.name === 'AbortError') {
                return {
                    success: false,
                    error: 'Request timed out. Please try again later.'
                };
            }
            
            return {
                success: false,
                error: 'Network error. Please check your connection and try again.'
            };
        }
    }
    
    // Admin authentication helper
    async function adminLogin(email, password) {
        const response = await fetchAPI('/auth/login', {
            method: 'POST',
            body: JSON.stringify({
                email,
                password
            })
        });
        
        if (response.success && response.token) {
            localStorage.setItem('admin_token', response.token);
            return true;
        }
        
        return false;
    }
    
    // Public methods
    return {
        // GET request
        get: (endpoint) => fetchAPI(endpoint),
        
        // POST request with data
        post: (endpoint, data) => fetchAPI(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        }),
        
        // PUT request with data
        put: (endpoint, data) => fetchAPI(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        }),
        
        // DELETE request
        delete: (endpoint) => fetchAPI(endpoint, {
            method: 'DELETE'
        }),
        
        // Image URL helper
        getImageUrl: (imagePath) => {
            if (!imagePath) return '';
            
            // Handle both relative and absolute paths
            if (imagePath.startsWith('http')) {
                return imagePath;
            }
            
            return `${API_BASE_URL.replace('/api', '')}/static/${imagePath}`;
        },
        
        // Admin auth methods
        adminLogin,
        
        isAdminLoggedIn: () => !!localStorage.getItem('admin_token'),
        
        adminLogout: () => {
            localStorage.removeItem('admin_token');
            return true;
        }
    };
})();

// Make service globally available
window.ApiService = ApiService;