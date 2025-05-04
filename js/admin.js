/*
* AfriMart Depot - Admin Dashboard JavaScript
* Version: 2.1 - Added S3 integration
*/

document.addEventListener('DOMContentLoaded', function() {
    'use strict';

    // ==================
    // Constants
    // ==================
    const API_BASE_URL = '/.netlify/functions/s3-handler';
    const ORDERS_KEY = 'afrimart_orders';
    const SETTINGS_KEY = 'afrimart_settings';
    const ACTIVITY_KEY = 'afrimart_recent_activity';
    
    // ==================
    // DOM Elements
    // ==================
    const sidebar = document.getElementById('sidebar');
    const toggleSidebar = document.getElementById('toggleSidebar');
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.section');
    const pageTitle = document.querySelector('.page-title');
    
    // Product Modal
    const productModal = document.getElementById('productModal');
    const closeModal = document.getElementById('closeModal');
    const addProductBtn = document.getElementById('addProductBtn');
    const productForm = document.getElementById('productForm');
    const saveProductBtn = document.getElementById('saveProductBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const modalTitle = document.getElementById('modalTitle');
    
    // Product Form Fields
    const productId = document.getElementById('productId');
    const productName = document.getElementById('productName');
    const productCategory = document.getElementById('productCategory');
    const productPrice = document.getElementById('productPrice');
    const productUnit = document.getElementById('productUnit');
    const productDescription = document.getElementById('productDescription');
    const productImage = document.getElementById('productImage');
    const productBadge = document.getElementById('productBadge');
    const imageUpload = document.getElementById('imageUpload');
    const imagePreview = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');
    const removeImage = document.getElementById('removeImage');
    
    // Filters and Search
    const categoryFilter = document.getElementById('categoryFilter');
    const productSearch = document.getElementById('productSearch');
    const statsTimeFrame = document.getElementById('statsTimeFrame');
    const orderStatusFilter = document.getElementById('orderStatusFilter');
    
    // Lists and Containers
    const productsGrid = document.getElementById('productsGrid');
    const ordersList = document.getElementById('ordersList');
    const recentActivity = document.getElementById('recentActivity');
    
    // Stats Elements
    const totalProducts = document.getElementById('totalProducts');
    const totalOrders = document.getElementById('totalOrders');
    const totalRevenue = document.getElementById('totalRevenue');
    
    // Loading and Toast
    const loadingOverlay = document.getElementById('loadingOverlay');
    const toast = document.getElementById('toast');
    
    // ==================
    // State Management
    // ==================
    let currentEditingProduct = null;
    let currentImageData = null;
    
    // ==================
    // S3 Storage Functions
    // ==================
    
    async function getProductsFromS3() {
        try {
            const response = await fetch(`${API_BASE_URL}/get-products`);
            if (!response.ok) throw new Error('Failed to get products from S3');
            
            const data = await response.json();
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error('Error getting products from S3:', error);
            // Fallback to localStorage if S3 fails
            const savedProducts = localStorage.getItem('afrimart_products');
            return savedProducts ? JSON.parse(savedProducts) : [];
        }
    }
    
    async function saveProductsToS3(products) {
        try {
            const response = await fetch(`${API_BASE_URL}/save-products`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(products)
            });
            
            if (!response.ok) throw new Error('Failed to save products to S3');
            
            // Also save to localStorage as backup
            localStorage.setItem('afrimart_products', JSON.stringify(products));
            return true;
        } catch (error) {
            console.error('Error saving products to S3:', error);
            // Save to localStorage as fallback
            localStorage.setItem('afrimart_products', JSON.stringify(products));
            return false;
        }
    }
    
    async function getOrdersFromS3() {
        try {
            const response = await fetch(`${API_BASE_URL}/get-orders`);
            if (!response.ok) throw new Error('Failed to get orders from S3');
            
            const data = await response.json();
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error('Error getting orders from S3:', error);
            // Fallback to localStorage if S3 fails
            const savedOrders = localStorage.getItem('afrimart_orders');
            return savedOrders ? JSON.parse(savedOrders) : [];
        }
    }
    
    async function saveOrdersToS3(orders) {
        try {
            const response = await fetch(`${API_BASE_URL}/save-orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orders)
            });
            
            if (!response.ok) throw new Error('Failed to save orders to S3');
            
            // Also save to localStorage as backup
            localStorage.setItem('afrimart_orders', JSON.stringify(orders));
            return true;
        } catch (error) {
            console.error('Error saving orders to S3:', error);
            // Save to localStorage as fallback
            localStorage.setItem('afrimart_orders', JSON.stringify(orders));
            return false;
        }
    }
    
    // ==================
    // Initialization
    // ==================
    async function init() {
        console.log('Initializing admin panel...');
        initializeEventListeners();
        loadCategories();
        await loadDashboardStats();
        await loadProducts();
        await loadOrders();
        loadSettings();
        updateRecentActivity();
    }
    
    // ==================
    // Event Listeners
    // ==================
    function initializeEventListeners() {
        console.log('Setting up event listeners...');
        
        // Sidebar Navigation - Desktop toggle
        if (toggleSidebar) {
            toggleSidebar.addEventListener('click', () => {
                console.log('Toggling sidebar...');
                sidebar.classList.toggle('collapsed');
                localStorage.setItem('sidebar_collapsed', sidebar.classList.contains('collapsed'));
            });
        }
        
        // Mobile menu toggle
        if (mobileMenuToggle) {
            mobileMenuToggle.addEventListener('click', () => {
                console.log('Toggling mobile menu...');
                sidebar.classList.toggle('active');
            });
        }
        
        // Navigation links
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const sectionName = link.dataset.section;
                console.log('Switching to section:', sectionName);
                
                // Update active nav link
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                
                // Update active section
                sections.forEach(s => s.classList.remove('active'));
                const targetSection = document.getElementById(`${sectionName}Section`);
                if (targetSection) {
                    targetSection.classList.add('active');
                }
                
                // Update page title
                if (pageTitle) {
                    pageTitle.textContent = sectionName.charAt(0).toUpperCase() + sectionName.slice(1);
                }
                
                // Close mobile sidebar
                if (window.innerWidth <= 992) {
                    sidebar.classList.remove('active');
                }
            });
        });
        
        // Product Modal
        if (addProductBtn) {
            addProductBtn.addEventListener('click', () => openProductModal());
        }
        if (closeModal) {
            closeModal.addEventListener('click', closeProductModal);
        }
        if (cancelBtn) {
            cancelBtn.addEventListener('click', closeProductModal);
        }
        if (productForm) {
            productForm.addEventListener('submit', handleProductSubmit);
        }
        
        // Image Upload
        if (imageUpload) {
            imageUpload.addEventListener('click', () => {
                if (productImage) productImage.click();
            });
        }
        if (productImage) {
            productImage.addEventListener('change', handleImageUpload);
        }
        if (removeImage) {
            removeImage.addEventListener('click', handleRemoveImage);
        }
        
        // Drag and drop for image upload
        if (imageUpload) {
            imageUpload.addEventListener('dragover', (e) => {
                e.preventDefault();
                imageUpload.classList.add('dragover');
            });
            
            imageUpload.addEventListener('dragleave', () => {
                imageUpload.classList.remove('dragover');
            });
            
            imageUpload.addEventListener('drop', (e) => {
                e.preventDefault();
                imageUpload.classList.remove('dragover');
                const file = e.dataTransfer.files[0];
                if (file && file.type.startsWith('image/')) {
                    handleImageFile(file);
                }
            });
        }
        
        // Filters
        if (categoryFilter) {
            categoryFilter.addEventListener('change', filterProducts);
        }
        if (productSearch) {
            productSearch.addEventListener('input', filterProducts);
        }
        if (orderStatusFilter) {
            orderStatusFilter.addEventListener('change', filterOrders);
        }
        
        // Settings
        const settingsForm = document.getElementById('settingsForm');
        if (settingsForm) {
            settingsForm.addEventListener('submit', handleSettingsSubmit);
        }
        
        // Click outside modal to close
        window.addEventListener('click', (e) => {
            if (e.target === productModal) {
                closeProductModal();
            }
        });
        
        // Restore sidebar state
        const sidebarCollapsed = localStorage.getItem('sidebar_collapsed');
        if (sidebarCollapsed === 'true') {
            sidebar.classList.add('collapsed');
        }
    }
    
    // ==================
    // Product Management
    // ==================
    function openProductModal(product = null) {
        currentEditingProduct = product;
        
        if (product) {
            modalTitle.textContent = 'Edit Product';
            productId.value = product.id;
            productName.value = product.name;
            productCategory.value = product.category;
            productPrice.value = product.price.replace('$', '');
            productUnit.value = product.unit;
            productDescription.value = product.description;
            productBadge.value = product.badge || '';
            
            if (product.image) {
                previewImg.src = product.image;
                imagePreview.style.display = 'block';
                currentImageData = product.image;
            }
        } else {
            modalTitle.textContent = 'Add Product';
            productForm.reset();
            imagePreview.style.display = 'none';
            currentImageData = null;
        }
        
        productModal.classList.add('active');
    }
    
    function closeProductModal() {
        productModal.classList.remove('active');
        productForm.reset();
        currentEditingProduct = null;
        currentImageData = null;
    }
    
    async function handleProductSubmit(e) {
        e.preventDefault();
        showLoading();
        
        const product = {
            id: currentEditingProduct ? currentEditingProduct.id : Date.now().toString(),
            name: productName.value,
            category: productCategory.value,
            price: '$' + parseFloat(productPrice.value).toFixed(2),
            unit: productUnit.value,
            description: productDescription.value,
            badge: productBadge.value,
            image: currentImageData || 'images/placeholder.jpg'
        };
        
        let products = await getProducts();
        
        if (currentEditingProduct) {
            const index = products.findIndex(p => p.id === product.id);
            if (index > -1) {
                products[index] = product;
            }
        } else {
            products.push(product);
        }
        
        await saveProducts(products);
        await loadProducts();
        closeProductModal();
        showToast('Product saved successfully!');
        hideLoading();
        addRecentActivity('product', product.name, currentEditingProduct ? 'updated' : 'added');
    }
    
    function handleImageUpload(e) {
        const file = e.target.files[0];
        if (file) {
            handleImageFile(file);
        }
    }
    
    function handleImageFile(file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            currentImageData = e.target.result;
            previewImg.src = currentImageData;
            imagePreview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
    
    function handleRemoveImage() {
        currentImageData = null;
        imagePreview.style.display = 'none';
        if (productImage) productImage.value = '';
    }
    
    async function deleteProduct(productId) {
        if (confirm('Are you sure you want to delete this product?')) {
            showLoading();
            let products = await getProducts();
            const product = products.find(p => p.id === productId);
            products = products.filter(p => p.id !== productId);
            await saveProducts(products);
            await loadProducts();
            showToast('Product deleted successfully!');
            hideLoading();
            if (product) {
                addRecentActivity('product', product.name, 'deleted');
            }
        }
    }
    
    // ==================
    // Product Display & Filtering
    // ==================
    async function loadProducts() {
        const products = await getProducts();
        updateProductCount(products.length);
        
        if (products.length === 0) {
            productsGrid.innerHTML = `
                <div class="text-center w-100">
                    <p>No products found. Click "Add Product" to get started.</p>
                </div>
            `;
            return;
        }
        
        renderProducts(products);
    }
    
    function renderProducts(products) {
        productsGrid.innerHTML = products.map(product => `
            <div class="product-card" data-id="${product.id}" data-category="${product.category}">
                <div class="product-image">
                    ${product.badge ? `<div class="product-badge ${product.badge.replace(/\s+/g, '-').toLowerCase()}">${product.badge}</div>` : ''}
                    <img src="${product.image}" alt="${product.name}" onerror="this.src='images/placeholder.jpg'">
                </div>
                <div class="product-info">
                    <h3 class="product-title">${product.name}</h3>
                    <p class="product-category">${formatCategory(product.category)}</p>
                    <p class="product-price">${product.price}</p>
                    <div class="product-actions">
                        <button class="btn-edit" onclick="editProduct('${product.id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn-delete" onclick="deleteProduct('${product.id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    async function filterProducts() {
        const searchTerm = productSearch.value.toLowerCase();
        const selectedCategory = categoryFilter.value;
        const products = await getProducts();
        
        const filteredProducts = products.filter(product => {
            const matchesSearch = product.name.toLowerCase().includes(searchTerm) ||
                                product.description?.toLowerCase().includes(searchTerm);
            const matchesCategory = !selectedCategory || product.category === selectedCategory;
            
            return matchesSearch && matchesCategory;
        });
        
        renderProducts(filteredProducts);
    }
    
    // ==================
    // Order Management
    // ==================
    async function loadOrders() {
        const orders = await getOrders();
        updateOrderCount(orders.length);
        updateRevenue(orders);
        
        if (orders.length === 0) {
            ordersList.innerHTML = `
                <div class="text-center">
                    <p>No orders yet.</p>
                </div>
            `;
            return;
        }
        
        renderOrders(orders);
    }
    
    function renderOrders(orders) {
        ordersList.innerHTML = orders.map(order => `
            <div class="order-card">
                <div class="order-header">
                    <div>
                        <h3 class="order-id">Order #${order.id}</h3>
                        <p class="order-date">${new Date(order.timestamp).toLocaleDateString()}</p>
                    </div>
                    <span class="order-status status-${getOrderStatus(order)}">
                        ${getOrderStatus(order).charAt(0).toUpperCase() + getOrderStatus(order).slice(1)}
                    </span>
                </div>
                <div class="order-details">
                    <p class="order-items"><strong>Items:</strong> ${order.items.map(item => `${item.title} (${item.quantity})`).join(', ')}</p>
                    <p class="order-total"><strong>Total:</strong> $${order.total}</p>
                </div>
                <div class="order-actions">
                    <button class="btn btn-secondary" onclick="deleteOrder('${order.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    async function deleteOrder(orderId) {
        if (confirm('Are you sure you want to delete this order?')) {
            showLoading();
            let orders = await getOrders();
            orders = orders.filter(o => o.id !== orderId);
            await saveOrders(orders);
            await loadOrders();
            showToast('Order deleted successfully!');
            hideLoading();
        }
    }
    
    async function filterOrders() {
        const selectedStatus = orderStatusFilter.value;
        const orders = await getOrders();
        
        const filteredOrders = orders.filter(order => {
            const status = getOrderStatus(order);
            return !selectedStatus || status === selectedStatus;
        });
        
        renderOrders(filteredOrders);
    }
    
    function getOrderStatus(order) {
        // Default implementation - you can enhance based on your needs
        return 'completed';
    }
    
    // ==================
    // Dashboard Stats
    // ==================
    async function loadDashboardStats() {
        const products = await getProducts();
        const orders = await getOrders();
        
        updateProductCount(products.length);
        updateOrderCount(orders.length);
        updateRevenue(orders);
    }
    
    function updateProductCount(count) {
        if (totalProducts) totalProducts.textContent = count;
    }
    
    function updateOrderCount(count) {
        if (totalOrders) totalOrders.textContent = count;
    }
    
    function updateRevenue(orders) {
        const revenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
        if (totalRevenue) totalRevenue.textContent = `$${revenue.toFixed(2)}`;
    }
    
    // ==================
    // Recent Activity
    // ==================
    function updateRecentActivity() {
        const activity = getRecentActivity();
        if (activity.length === 0) {
            recentActivity.innerHTML = `<p>No recent activity</p>`;
            return;
        }
        
        recentActivity.innerHTML = activity.slice(0, 5).map(item => `
            <div class="activity-item">
                <div class="activity-icon">
                    ${item.type === 'product' ? '<i class="fas fa-box"></i>' : '<i class="fas fa-shopping-cart"></i>'}
                </div>
                <div class="activity-details">
                    <p class="activity-title">${formatActivityText(item)}</p>
                    <p class="activity-time">${timeAgo(item.timestamp)}</p>
                </div>
            </div>
        `).join('');
    }
    
    function addRecentActivity(type, name, action) {
        const activity = getRecentActivity();
        activity.unshift({
            type,
            name,
            action,
            timestamp: new Date().toISOString()
        });
        
        // Keep only last 50 activities
        saveRecentActivity(activity.slice(0, 50));
        updateRecentActivity();
    }
    
    function formatActivityText(item) {
        if (item.type === 'product') {
            return `Product "${item.name}" was ${item.action}`;
        } else if (item.type === 'order') {
            return `Order #${item.name} was ${item.action}`;
        }
        return '';
    }
    
    function timeAgo(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);
        
        if (seconds < 60) return 'just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        const days = Math.floor(hours / 24);
        return `${days} day${days > 1 ? 's' : ''} ago`;
    }
    
    // ==================
    // Settings Management
    // ==================
    function loadSettings() {
        const settings = getSettings();
        
        const storeName = document.getElementById('storeName');
        const whatsappNumber = document.getElementById('whatsappNumber');
        const taxRate = document.getElementById('taxRate');
        
        if (storeName) storeName.value = settings.storeName || 'AfriMart Depot';
        if (whatsappNumber) whatsappNumber.value = settings.whatsappNumber || '18048060130';
        if (taxRate) taxRate.value = settings.taxRate || '8';
    }
    
    function handleSettingsSubmit(e) {
        e.preventDefault();
        showLoading();
        
        const settings = {
            storeName: document.getElementById('storeName').value,
            whatsappNumber: document.getElementById('whatsappNumber').value,
            taxRate: document.getElementById('taxRate').value
        };
        
        saveSettings(settings);
        showToast('Settings saved successfully!');
        hideLoading();
    }
    
    // ==================
    // Storage Functions
    // ==================
    async function getProducts() {
        return await getProductsFromS3();
    }
    
    async function saveProducts(products) {
        return await saveProductsToS3(products);
    }
    
    async function getOrders() {
        return await getOrdersFromS3();
    }
    
    async function saveOrders(orders) {
        return await saveOrdersToS3(orders);
    }
    
    function getSettings() {
        return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
    }
    
    function saveSettings(settings) {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    }
    
    function getRecentActivity() {
        return JSON.parse(localStorage.getItem(ACTIVITY_KEY) || '[]');
    }
    
    function saveRecentActivity(activity) {
        localStorage.setItem(ACTIVITY_KEY, JSON.stringify(activity));
    }
    
    // ==================
    // Utility Functions
    // ==================
    function formatCategory(category) {
        return category.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }
    
    function loadCategories() {
        if (categoryFilter) {
            categoryFilter.innerHTML = `
                <option value="">All Categories</option>
                <option value="dried-seafood">Dried Seafood</option>
                <option value="fresh-seafood">Fresh Seafood</option>
                <option value="snacks">Snacks</option>
                <option value="spices-herbs">Spices & Herbs</option>
                <option value="vegetables">Vegetables</option>
                <option value="grains-flours">Grains & Flours</option>
                <option value="specialty">Specialty Items</option>
            `;
        }
    }
    
    function showLoading() {
        if (loadingOverlay) loadingOverlay.classList.add('active');
    }
    
    function hideLoading() {
        if (loadingOverlay) loadingOverlay.classList.remove('active');
    }
    
    function showToast(message) {
        const toastMessage = toast.querySelector('.toast-message');
        if (toastMessage) {
            toastMessage.textContent = message;
            toast.classList.add('show');
            
            setTimeout(() => {
                toast.classList.remove('show');
            }, 3000);
        }
    }
    
    // ==================
    // Global Functions (for onclick handlers)
    // ==================
    window.editProduct = function(productId) {
        getProducts().then(products => {
            const product = products.find(p => p.id === productId);
            if (product) {
                openProductModal(product);
            }
        });
    };
    
    window.deleteProduct = deleteProduct;
    window.deleteOrder = deleteOrder;
    
    // ==================
    // Initialize Application
    // ==================
    init();
});