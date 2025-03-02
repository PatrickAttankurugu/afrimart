/**
 * AfriMart Depot - API Service
 * 
 * Central service for making API calls to the backend server
 * This handles all communication with the backend API
 */

const ApiService = (() => {
    // Backend API base URL - replace with your actual domain
    const API_BASE_URL = 'https://35.175.245.151/api';
    
    // Helper function for making API requests
    async function fetchAPI(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        
        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    ...options.headers
                },
                // Add credentials if needed for cookies
                // credentials: 'include',
            });
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error(`API error (${endpoint}):`, error);
            return {
                success: false,
                error: 'Network error. Please try again later.'
            };
        }
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
        })
    };
})();

// Make it globally available
window.ApiService = ApiService;