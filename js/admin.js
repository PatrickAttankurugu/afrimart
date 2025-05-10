/*
* AfriMart Depot - Admin Dashboard JavaScript
* Version: 2.3 - Integrated S3 image upload and refined S3 product/order handling.
*/

document.addEventListener('DOMContentLoaded', function() {
    'use strict';

    // ==================
    // Constants
    // ==================
    const API_BASE_URL = '/.netlify/functions/s3-handler'; // Base URL for S3 handler Netlify function
    const ORDERS_KEY = 'afrimart_orders'; // localStorage key for orders (fallback)
    const SETTINGS_KEY = 'afrimart_settings'; // localStorage key for settings
    const ACTIVITY_KEY = 'afrimart_recent_activity'; // localStorage key for recent activity

    // ==================
    // DOM Elements
    // ==================
    const sidebar = document.getElementById('sidebar');
    const toggleSidebar = document.getElementById('toggleSidebar');
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.section');
    const pageTitle = document.querySelector('.page-title');

    // Product Modal Elements
    const productModal = document.getElementById('productModal');
    const closeModal = document.getElementById('closeModal');
    const addProductBtn = document.getElementById('addProductBtn');
    const productForm = document.getElementById('productForm');
    const saveProductBtn = document.getElementById('saveProductBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const modalTitle = document.getElementById('modalTitle');

    // Product Form Fields
    const productIdField = document.getElementById('productId'); // Changed from productId to avoid conflict
    const productName = document.getElementById('productName');
    const productCategory = document.getElementById('productCategory');
    const productPrice = document.getElementById('productPrice');
    const productUnit = document.getElementById('productUnit');
    const productDescription = document.getElementById('productDescription');
    const productImageInput = document.getElementById('productImage'); // Changed from productImage to avoid conflict
    const productBadge = document.getElementById('productBadge');
    const imageUpload = document.getElementById('imageUpload');
    const imagePreview = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');
    const removeImageBtn = document.getElementById('removeImage'); // Changed from removeImage

    // Filters and Search Elements
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

    // Loading and Toast Elements
    const loadingOverlay = document.getElementById('loadingOverlay');
    const toast = document.getElementById('toast');
    const toastMessage = toast ? toast.querySelector('.toast-message') : null;


    // ==================
    // State Management
    // ==================
    let currentEditingProduct = null; // Stores the product being edited, or null if adding a new one
    let currentImageUrl = null; // Stores the S3 URL of the uploaded image for the current product form

    // ==================
    // S3 Storage Functions (Client-Side Wrappers)
    // ==================

    /**
     * Fetches products from the S3 backend.
     * @returns {Promise<Array>} A promise that resolves to an array of products.
     */
    async function getProductsFromS3() {
        try {
            console.log('[ADMIN-S3-PRODUCTS] Fetching products from S3 via Netlify function...');
            const response = await fetch(`${API_BASE_URL}?operation=get-products`);
            if (!response.ok) {
                const errorBody = await response.text();
                console.error('[ADMIN-S3-PRODUCTS] Failed to get products. Status:', response.status, 'Body:', errorBody);
                throw new Error(`Failed to get products from S3. Status: ${response.status}`);
            }
            const data = await response.json();
            console.log('[ADMIN-S3-PRODUCTS] Successfully fetched products:', data);
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error('[ADMIN-S3-PRODUCTS] Error getting products from S3:', error);
            showToast(`Error fetching products: ${error.message}`, 'error');
            const savedProducts = localStorage.getItem('afrimart_products'); // Fallback
            return savedProducts ? JSON.parse(savedProducts) : [];
        }
    }

    /**
     * Saves products to the S3 backend.
     * @param {Array} products - The array of products to save.
     * @returns {Promise<boolean>} A promise that resolves to true if successful, false otherwise.
     */
    async function saveProductsToS3(products) {
        try {
            console.log('[ADMIN-S3-PRODUCTS] Saving products to S3 via Netlify function...', products);
            const response = await fetch(`${API_BASE_URL}?operation=save-products`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(products)
            });
            if (!response.ok) {
                const errorBody = await response.text();
                console.error('[ADMIN-S3-PRODUCTS] Failed to save products. Status:', response.status, 'Body:', errorBody);
                throw new Error(`Failed to save products to S3. Status: ${response.status}`);
            }
            localStorage.setItem('afrimart_products', JSON.stringify(products)); // Backup
            console.log('[ADMIN-S3-PRODUCTS] Successfully saved products.');
            return true;
        } catch (error) {
            console.error('[ADMIN-S3-PRODUCTS] Error saving products to S3:', error);
            showToast(`Error saving products: ${error.message}`, 'error');
            localStorage.setItem('afrimart_products', JSON.stringify(products)); // Fallback
            return false;
        }
    }

    /**
     * Fetches orders from the S3 backend.
     * @returns {Promise<Array>} A promise that resolves to an array of orders.
     */
    async function getOrdersFromS3() {
        try {
            console.log('[ADMIN-S3-ORDERS] Fetching orders from S3 via Netlify function...');
            const response = await fetch(`${API_BASE_URL}?operation=get-orders`);
            if (!response.ok) {
                const errorBody = await response.text();
                console.error('[ADMIN-S3-ORDERS] Failed to get orders. Status:', response.status, 'Body:', errorBody);
                throw new Error(`Failed to get orders from S3. Status: ${response.status}`);
            }
            const data = await response.json();
            console.log('[ADMIN-S3-ORDERS] Successfully fetched orders:', data);
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error('[ADMIN-S3-ORDERS] Error getting orders from S3:', error);
            showToast(`Error fetching orders: ${error.message}`, 'error');
            const savedOrders = localStorage.getItem(ORDERS_KEY); // Fallback
            return savedOrders ? JSON.parse(savedOrders) : [];
        }
    }

    /**
     * Saves orders to the S3 backend.
     * @param {Array} orders - The array of orders to save.
     * @returns {Promise<boolean>} A promise that resolves to true if successful, false otherwise.
     */
    async function saveOrdersToS3(orders) {
        try {
            console.log('[ADMIN-S3-ORDERS] Saving orders to S3 via Netlify function...', orders);
            const response = await fetch(`${API_BASE_URL}?operation=save-orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orders)
            });
            if (!response.ok) {
                const errorBody = await response.text();
                console.error('[ADMIN-S3-ORDERS] Failed to save orders. Status:', response.status, 'Body:', errorBody);
                throw new Error(`Failed to save orders to S3. Status: ${response.status}`);
            }
            localStorage.setItem(ORDERS_KEY, JSON.stringify(orders)); // Backup
            console.log('[ADMIN-S3-ORDERS] Successfully saved orders.');
            return true;
        } catch (error) {
            console.error('[ADMIN-S3-ORDERS] Error saving orders to S3:', error);
            showToast(`Error saving orders: ${error.message}`, 'error');
            localStorage.setItem(ORDERS_KEY, JSON.stringify(orders)); // Fallback
            return false;
        }
    }

    /**
     * Uploads an image file to S3 via Netlify function.
     * @param {File} file - The image file to upload.
     * @returns {Promise<string|null>} A promise that resolves to the S3 URL of the uploaded image, or null on failure.
     */
    async function uploadImageToS3(file) {
        const formData = new FormData();
        formData.append('image', file); // 'image' should match the key expected by the backend

        try {
            console.log('[ADMIN-S3-IMAGE] Uploading image to S3...');
            showLoading('Uploading image...');
            const response = await fetch(`${API_BASE_URL}?operation=upload-image`, {
                method: 'POST',
                body: formData // FormData sets Content-Type automatically for multipart/form-data
            });

            if (!response.ok) {
                const errorBody = await response.text();
                console.error('[ADMIN-S3-IMAGE] Image upload failed. Status:', response.status, 'Body:', errorBody);
                throw new Error(`Image upload failed. Status: ${response.status}`);
            }

            const result = await response.json();
            console.log('[ADMIN-S3-IMAGE] Image uploaded successfully:', result);
            if (result.imageUrl) {
                return result.imageUrl;
            } else {
                throw new Error('Image URL not found in response.');
            }
        } catch (error) {
            console.error('[ADMIN-S3-IMAGE] Error uploading image:', error);
            showToast(`Error uploading image: ${error.message}`, 'error');
            return null;
        } finally {
            hideLoading();
        }
    }


    // ==================
    // Initialization
    // ==================
    /**
     * Initializes the admin panel: loads data, sets up event listeners.
     */
    async function init() {
        console.log('Initializing AfriMart Admin Panel...');
        initializeEventListeners();
        loadCategoriesIntoForm(); // Renamed from loadCategories
        await loadDashboardStats();
        await loadProducts();
        await loadOrders();
        loadSettings();
        updateRecentActivityDisplay(); // Renamed from updateRecentActivity
        console.log('Admin Panel Initialized.');
    }

    // ==================
    // Event Listeners
    // ==================
    /**
     * Sets up all primary event listeners for the admin panel.
     */
    function initializeEventListeners() {
        console.log('Setting up event listeners...');

        if (toggleSidebar) {
            toggleSidebar.addEventListener('click', () => {
                sidebar.classList.toggle('collapsed');
                localStorage.setItem('sidebar_collapsed', sidebar.classList.contains('collapsed'));
            });
        }

        if (mobileMenuToggle) {
            mobileMenuToggle.addEventListener('click', () => sidebar.classList.toggle('active'));
        }

        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const sectionName = link.dataset.section;
                navigateToSection(sectionName);
            });
        });

        if (addProductBtn) addProductBtn.addEventListener('click', () => openProductModal());
        if (closeModal) closeModal.addEventListener('click', closeProductModal);
        if (cancelBtn) cancelBtn.addEventListener('click', closeProductModal);
        if (productForm) productForm.addEventListener('submit', handleProductFormSubmit); // Renamed

        if (imageUpload) imageUpload.addEventListener('click', () => productImageInput.click());
        if (productImageInput) productImageInput.addEventListener('change', handleImageFileSelect); // Renamed
        if (removeImageBtn) removeImageBtn.addEventListener('click', handleRemoveImagePreview); // Renamed

        if (imageUpload) {
            imageUpload.addEventListener('dragover', (e) => { e.preventDefault(); imageUpload.classList.add('dragover'); });
            imageUpload.addEventListener('dragleave', () => imageUpload.classList.remove('dragover'));
            imageUpload.addEventListener('drop', handleImageDrop); // Renamed
        }

        if (categoryFilter) categoryFilter.addEventListener('change', filterProducts);
        if (productSearch) productSearch.addEventListener('input', filterProducts);
        if (orderStatusFilter) orderStatusFilter.addEventListener('change', filterOrders);

        const settingsForm = document.getElementById('settingsForm');
        if (settingsForm) settingsForm.addEventListener('submit', handleSettingsFormSubmit); // Renamed

        const debugS3Btn = document.getElementById('debugS3');
        if (debugS3Btn) debugS3Btn.addEventListener('click', debugS3Connection); // Renamed

        window.addEventListener('click', (e) => {
            if (productModal && e.target === productModal) closeProductModal();
        });

        const sidebarCollapsed = localStorage.getItem('sidebar_collapsed');
        if (sidebar && sidebarCollapsed === 'true') sidebar.classList.add('collapsed');
    }

    /**
     * Navigates to a specific section in the admin panel.
     * @param {string} sectionName - The name of the section to navigate to.
     */
    function navigateToSection(sectionName) {
        console.log('Switching to section:', sectionName);
        navLinks.forEach(l => l.classList.remove('active'));
        const activeLink = document.querySelector(`.nav-link[data-section="${sectionName}"]`);
        if (activeLink) activeLink.classList.add('active');

        sections.forEach(s => s.classList.remove('active'));
        const targetSection = document.getElementById(`${sectionName}Section`);
        if (targetSection) targetSection.classList.add('active');

        if (pageTitle) pageTitle.textContent = sectionName.charAt(0).toUpperCase() + sectionName.slice(1);

        if (sidebar && window.innerWidth <= 992) sidebar.classList.remove('active');
    }

    // ==================
    // Product Management
    // ==================
    /**
     * Opens the product modal, optionally pre-filling with product data for editing.
     * @param {Object|null} product - The product object to edit, or null for a new product.
     */
    function openProductModal(product = null) {
        currentEditingProduct = product;
        currentImageUrl = null; // Reset image URL for new/edit session

        if (product) {
            if (modalTitle) modalTitle.textContent = 'Edit Product';
            if (productIdField) productIdField.value = product.id;
            if (productName) productName.value = product.name;
            if (productCategory) productCategory.value = product.category;
            if (productPrice) productPrice.value = product.price.replace('$', '');
            if (productUnit) productUnit.value = product.unit || '';
            if (productDescription) productDescription.value = product.description || '';
            if (productBadge) productBadge.value = product.badge || '';

            if (product.image) {
                currentImageUrl = product.image; // Store the existing S3 URL
                if (previewImg) previewImg.src = product.image;
                if (imagePreview) imagePreview.style.display = 'block';
                if (imageUpload.querySelector('.upload-placeholder')) imageUpload.querySelector('.upload-placeholder').style.display = 'none';
            } else {
                 if (imagePreview) imagePreview.style.display = 'none';
                 if (imageUpload.querySelector('.upload-placeholder')) imageUpload.querySelector('.upload-placeholder').style.display = 'block';
            }
        } else {
            if (modalTitle) modalTitle.textContent = 'Add New Product';
            if (productForm) productForm.reset();
            if (productIdField) productIdField.value = ''; // Clear product ID for new product
            if (imagePreview) imagePreview.style.display = 'none';
            if (imageUpload.querySelector('.upload-placeholder')) imageUpload.querySelector('.upload-placeholder').style.display = 'block';

        }
        if (productModal) productModal.classList.add('active');
    }

    /**
     * Closes the product modal and resets its state.
     */
    function closeProductModal() {
        if (productModal) productModal.classList.remove('active');
        if (productForm) productForm.reset();
        currentEditingProduct = null;
        currentImageUrl = null;
        if (productImageInput) productImageInput.value = ''; // Clear file input
        if (imagePreview) imagePreview.style.display = 'none';
        if (previewImg) previewImg.src = '';
        if (imageUpload && imageUpload.querySelector('.upload-placeholder')) {
            imageUpload.querySelector('.upload-placeholder').style.display = 'block';
        }
    }

    /**
     * Handles the submission of the product form (add or edit).
     * @param {Event} e - The form submission event.
     */
    async function handleProductFormSubmit(e) {
        e.preventDefault();
        showLoading('Saving product...');

        // If a new image file was selected via input, currentImageUrl would be a base64 string.
        // If an existing image was kept, currentImageUrl would be the S3 URL.
        // If a new image was uploaded to S3 directly, currentImageUrl would be its S3 URL.
        // The `productImageInput.files[0]` check is crucial if we want to upload on form submit.
        // However, the current design aims to upload immediately upon selection.

        let finalImageUrl = currentImageUrl; // This should hold the S3 URL if a new image was uploaded, or existing S3 URL

        // If productImageInput has a file, it means a new file was selected but not yet uploaded
        // This case should ideally be handled by immediate upload in handleImageFileSelect
        if (productImageInput && productImageInput.files[0] && !currentImageUrl?.startsWith('https://')) {
            // This implies currentImageUrl might be a base64 if not uploaded yet.
            // For robustness, attempt upload if it's not an S3 URL.
            // However, the ideal flow is for currentImageUrl to *always* be an S3 URL by this point.
            console.warn("Image file selected but not yet an S3 URL. Attempting upload now.");
            const uploadedUrl = await uploadImageToS3(productImageInput.files[0]);
            if (uploadedUrl) {
                finalImageUrl = uploadedUrl;
            } else {
                showToast('Failed to upload new image. Please try again.', 'error');
                hideLoading();
                return; // Stop if image upload failed
            }
        }


        const productData = {
            id: productIdField.value || Date.now().toString(), // Use existing ID or generate new
            name: productName.value,
            category: productCategory.value,
            price: '$' + parseFloat(productPrice.value).toFixed(2),
            unit: productUnit.value || '',
            description: productDescription.value || '',
            badge: productBadge.value || '',
            image: finalImageUrl || 'images/placeholder.jpg' // Use S3 URL or placeholder
        };

        console.log('Product data to save:', productData);

        let products = await getProductsFromS3();
        if (currentEditingProduct && productIdField.value) { // Check productIdField.value for editing
            const index = products.findIndex(p => p.id === productIdField.value);
            if (index > -1) {
                products[index] = productData;
            } else { // If product not found by ID, treat as new (edge case)
                 products.push(productData);
            }
        } else {
            products.push(productData);
        }

        const success = await saveProductsToS3(products);
        if (success) {
            await loadProducts(); // Reload and re-render products
            closeProductModal();
            showToast(`Product ${currentEditingProduct ? 'updated' : 'added'} successfully!`);
            addRecentActivity('product', productData.name, currentEditingProduct ? 'updated' : 'added');
        } else {
            showToast('Failed to save product to S3. Data saved to localStorage as fallback.', 'error');
        }
        hideLoading();
    }

    /**
     * Handles the selection of an image file from the input.
     * Uploads the image to S3 immediately and updates the preview.
     * @param {Event} e - The file input change event.
     */
    async function handleImageFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            console.log('Image file selected:', file.name);
            const uploadedUrl = await uploadImageToS3(file);
            if (uploadedUrl) {
                currentImageUrl = uploadedUrl; // Store the S3 URL
                if (previewImg) previewImg.src = uploadedUrl;
                if (imagePreview) imagePreview.style.display = 'block';
                if (imageUpload.querySelector('.upload-placeholder')) imageUpload.querySelector('.upload-placeholder').style.display = 'none';

                showToast('Image uploaded successfully!', 'success');
            } else {
                // Reset if upload failed
                currentImageUrl = null;
                if (previewImg) previewImg.src = '';
                if (imagePreview) imagePreview.style.display = 'none';
                if (imageUpload.querySelector('.upload-placeholder')) imageUpload.querySelector('.upload-placeholder').style.display = 'block';
                if (productImageInput) productImageInput.value = ''; // Clear the file input
            }
        }
    }

    /**
     * Handles an image file dropped onto the upload area.
     * @param {DragEvent} e - The drop event.
     */
    async function handleImageDrop(e) {
        e.preventDefault();
        if(imageUpload) imageUpload.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            console.log('Image file dropped:', file.name);
            const uploadedUrl = await uploadImageToS3(file);
            if (uploadedUrl) {
                currentImageUrl = uploadedUrl;
                if (previewImg) previewImg.src = uploadedUrl;
                if (imagePreview) imagePreview.style.display = 'block';
                if (imageUpload.querySelector('.upload-placeholder')) imageUpload.querySelector('.upload-placeholder').style.display = 'none';
                showToast('Image uploaded successfully!', 'success');
            }
        }
    }

    /**
     * Removes the image preview and resets related state.
     */
    function handleRemoveImagePreview() {
        currentImageUrl = null;
        if (previewImg) previewImg.src = '';
        if (imagePreview) imagePreview.style.display = 'none';
        if (productImageInput) productImageInput.value = ''; // Clear file input
        if (imageUpload.querySelector('.upload-placeholder')) imageUpload.querySelector('.upload-placeholder').style.display = 'block';
        console.log('Image preview removed.');
    }

    /**
     * Deletes a product after confirmation.
     * @param {string} prodId - The ID of the product to delete.
     */
    async function deleteProduct(prodId) {
        if (confirm('Are you sure you want to delete this product?')) {
            showLoading('Deleting product...');
            let products = await getProductsFromS3();
            const productToDelete = products.find(p => p.id === prodId);
            products = products.filter(p => p.id !== prodId);
            const success = await saveProductsToS3(products);

            if (success) {
                await loadProducts();
                showToast('Product deleted successfully!');
                if (productToDelete) {
                    addRecentActivity('product', productToDelete.name, 'deleted');
                }
            } else {
                showToast('Failed to delete product from S3. Changes might not persist.', 'error');
            }
            hideLoading();
        }
    }

    // ==================
    // Product Display & Filtering
    // ==================
    /**
     * Loads products from S3 and renders them in the grid.
     */
    async function loadProducts() {
        showLoading('Loading products...');
        const products = await getProductsFromS3();
        updateProductCount(products.length);

        if (!productsGrid) {
            console.error("Products grid element not found.");
            hideLoading();
            return;
        }

        if (products.length === 0) {
            productsGrid.innerHTML = `<div class="text-center w-100"><p>No products found. Click "Add Product" to get started.</p></div>`;
        } else {
            renderProducts(products);
        }
        hideLoading();
    }

    /**
     * Renders an array of products into the products grid.
     * @param {Array} products - The array of products to render.
     */
    function renderProducts(products) {
        if (!productsGrid) return;
        productsGrid.innerHTML = products.map(product => `
            <div class="product-card" data-id="${product.id}" data-category="${product.category.toLowerCase()}">
                <div class="product-image">
                    ${product.badge ? `<div class="product-badge ${product.badge.replace(/\s+/g, '-').toLowerCase()}">${product.badge}</div>` : ''}
                    <img src="${product.image || 'images/placeholder.jpg'}" alt="${product.name}" onerror="this.onerror=null;this.src='images/placeholder.jpg';">
                </div>
                <div class="product-info">
                    <h3 class="product-title">${product.name}</h3>
                    <p class="product-category">${formatCategoryName(product.category)}</p>
                    <p class="product-price">${product.price}</p>
                    <div class="product-actions">
                        <button class="btn-edit" onclick="editProduct('${product.id}')"><i class="fas fa-edit"></i> Edit</button>
                        <button class="btn-delete" onclick="deleteProduct('${product.id}')"><i class="fas fa-trash"></i> Delete</button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    /**
     * Filters products based on search term and selected category.
     */
    async function filterProducts() {
        const searchTerm = productSearch ? productSearch.value.toLowerCase() : '';
        const selectedCategory = categoryFilter ? categoryFilter.value.toLowerCase() : '';
        const products = await getProductsFromS3();

        const filteredProducts = products.filter(product => {
            const nameMatch = product.name.toLowerCase().includes(searchTerm);
            const descriptionMatch = product.description ? product.description.toLowerCase().includes(searchTerm) : false;
            const categoryMatch = !selectedCategory || product.category.toLowerCase() === selectedCategory;
            return (nameMatch || descriptionMatch) && categoryMatch;
        });
        renderProducts(filteredProducts);
    }

    // ==================
    // Order Management
    // ==================
    /**
     * Loads orders from S3 and renders them.
     */
    async function loadOrders() {
        showLoading('Loading orders...');
        const orders = await getOrdersFromS3();
        updateOrderCount(orders.length);
        updateRevenue(orders);

        if (!ordersList) {
            console.error("Orders list element not found.");
            hideLoading();
            return;
        }

        if (orders.length === 0) {
            ordersList.innerHTML = `<div class="text-center"><p>No orders yet.</p></div>`;
        } else {
            renderOrders(orders);
        }
        hideLoading();
    }

    /**
     * Renders an array of orders into the orders list.
     * @param {Array} orders - The array of orders to render.
     */
    function renderOrders(orders) {
        if (!ordersList) return;
        ordersList.innerHTML = orders.map(order => `
            <div class="order-card">
                <div class="order-header">
                    <div>
                        <h3 class="order-id">Order #${order.id}</h3>
                        <p class="order-date">${new Date(order.timestamp).toLocaleDateString()}</p>
                    </div>
                    <span class="order-status status-${determineOrderStatus(order)}">
                        ${determineOrderStatus(order).charAt(0).toUpperCase() + determineOrderStatus(order).slice(1)}
                    </span>
                </div>
                <div class="order-details">
                    <p class="order-items"><strong>Items:</strong> ${order.items.map(item => `${item.title} (Qty: ${item.quantity})`).join(', ')}</p>
                    <p class="order-total"><strong>Total:</strong> ${typeof order.total === 'number' ? '$' + order.total.toFixed(2) : order.total || '$0.00'}</p>
                </div>
                <div class="order-actions">
                    <button class="btn btn-secondary" onclick="deleteOrder('${order.id}')"><i class="fas fa-trash"></i> Delete</button>
                </div>
            </div>
        `).join('');
    }

    /**
     * Deletes an order after confirmation.
     * @param {string} ordId - The ID of the order to delete.
     */
    async function deleteOrder(ordId) {
        if (confirm('Are you sure you want to delete this order?')) {
            showLoading('Deleting order...');
            let orders = await getOrdersFromS3();
            orders = orders.filter(o => o.id !== ordId);
            const success = await saveOrdersToS3(orders);
            if (success) {
                await loadOrders();
                showToast('Order deleted successfully!');
            } else {
                 showToast('Failed to delete order from S3. Changes might not persist.', 'error');
            }
            hideLoading();
        }
    }

    /**
     * Filters orders based on selected status.
     */
    async function filterOrders() {
        const selectedStatus = orderStatusFilter ? orderStatusFilter.value : '';
        const orders = await getOrdersFromS3();
        const filteredOrders = orders.filter(order => {
            const status = determineOrderStatus(order);
            return !selectedStatus || status === selectedStatus;
        });
        renderOrders(filteredOrders);
    }

    /**
     * Determines the status of an order (placeholder logic).
     * @param {Object} order - The order object.
     * @returns {string} The status of the order (e.g., 'completed', 'pending').
     */
    function determineOrderStatus(order) {
        // Basic placeholder logic. Implement your actual status determination here.
        return order.status || 'completed';
    }

    // ==================
    // Dashboard Stats
    // ==================
    /**
     * Loads and updates dashboard statistics.
     */
    async function loadDashboardStats() {
        const products = await getProductsFromS3();
        const orders = await getOrdersFromS3();
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
        const revenue = orders.reduce((sum, order) => sum + (parseFloat(String(order.total).replace('$', '')) || 0), 0);
        if (totalRevenue) totalRevenue.textContent = `$${revenue.toFixed(2)}`;
    }

    // ==================
    // Recent Activity
    // ==================
    /**
     * Updates the display of recent activities.
     */
    function updateRecentActivityDisplay() {
        if (!recentActivity) return;
        const activities = getRecentActivityFromStorage(); // Renamed
        if (activities.length === 0) {
            recentActivity.innerHTML = `<p>No recent activity.</p>`;
            return;
        }
        recentActivity.innerHTML = activities.slice(0, 5).map(item => `
            <div class="activity-item">
                <div class="activity-icon">
                    ${item.type === 'product' ? '<i class="fas fa-box"></i>' : '<i class="fas fa-shopping-cart"></i>'}
                </div>
                <div class="activity-details">
                    <p class="activity-title">${formatActivityLogText(item)}</p> {/* Renamed */}
                    <p class="activity-time">${formatTimeAgo(item.timestamp)}</p> {/* Renamed */}
                </div>
            </div>
        `).join('');
    }

    /**
     * Adds a new entry to the recent activity log.
     * @param {string} type - The type of activity (e.g., 'product', 'order').
     * @param {string} name - The name related to the activity (e.g., product name, order ID).
     * @param {string} action - The action performed (e.g., 'added', 'updated', 'deleted').
     */
    function addRecentActivity(type, name, action) {
        const activities = getRecentActivityFromStorage();
        activities.unshift({ type, name, action, timestamp: new Date().toISOString() });
        saveRecentActivityToStorage(activities.slice(0, 50)); // Keep last 50
        updateRecentActivityDisplay();
    }

    function formatActivityLogText(item) { // Renamed
        if (item.type === 'product') return `Product "${item.name}" was ${item.action}.`;
        if (item.type === 'order') return `Order #${item.name} was ${item.action}.`;
        return '';
    }

    function formatTimeAgo(timestamp) { // Renamed
        const date = new Date(timestamp);
        const now = new Date();
        const seconds = Math.round((now - date) / 1000);
        if (seconds < 60) return 'just now';
        const minutes = Math.round(seconds / 60);
        if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        const hours = Math.round(minutes / 60);
        if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        const days = Math.round(hours / 24);
        return `${days} day${days > 1 ? 's' : ''} ago`;
    }

    // ==================
    // Settings Management
    // ==================
    /**
     * Loads settings from localStorage and populates the settings form.
     */
    function loadSettings() {
        const settings = getSettingsFromStorage(); // Renamed
        const storeNameEl = document.getElementById('storeName');
        const whatsappNumberEl = document.getElementById('whatsappNumber');
        const taxRateEl = document.getElementById('taxRate');

        if (storeNameEl) storeNameEl.value = settings.storeName || 'AfriMart Depot';
        if (whatsappNumberEl) whatsappNumberEl.value = settings.whatsappNumber || '18048060130';
        if (taxRateEl) taxRateEl.value = settings.taxRate || '8';
    }

    /**
     * Handles the submission of the settings form.
     * @param {Event} e - The form submission event.
     */
    function handleSettingsFormSubmit(e) { // Renamed
        e.preventDefault();
        showLoading('Saving settings...');
        const settings = {
            storeName: document.getElementById('storeName').value,
            whatsappNumber: document.getElementById('whatsappNumber').value,
            taxRate: document.getElementById('taxRate').value
        };
        saveSettingsToStorage(settings); // Renamed
        showToast('Settings saved successfully!');
        hideLoading();
    }

    // ==================
    // Storage Functions (localStorage wrappers)
    // ==================
    // getProducts, saveProducts, getOrders, saveOrders are now S3 specific.
    // These are for settings and activity log which remain in localStorage for simplicity.
    function getSettingsFromStorage() { // Renamed
        return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
    }

    function saveSettingsToStorage(settings) { // Renamed
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    }

    function getRecentActivityFromStorage() { // Renamed
        return JSON.parse(localStorage.getItem(ACTIVITY_KEY) || '[]');
    }

    function saveRecentActivityToStorage(activity) { // Renamed
        localStorage.setItem(ACTIVITY_KEY, JSON.stringify(activity));
    }

    // ==================
    // Utility Functions
    // ==================
    /**
     * Formats a category string for display.
     * @param {string} category - The category string (e.g., 'dried-seafood').
     * @returns {string} The formatted category name (e.g., 'Dried Seafood').
     */
    function formatCategoryName(category) { // Renamed
        if (!category) return 'Uncategorized';
        return category.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }

    /**
     * Populates category dropdowns in forms.
     */
    function loadCategoriesIntoForm() { // Renamed
        const categorySelects = [productCategory, categoryFilter];
        const categories = [
            { value: "dried-seafood", text: "Dried Seafood" },
            { value: "fresh-seafood", text: "Fresh Seafood" },
            { value: "snacks", text: "Snacks" },
            { value: "spices-herbs", text: "Spices & Herbs" },
            { value: "vegetables", text: "Vegetables & Products" },
            { value: "grains-flours", text: "Grains & Flours" },
            { value: "specialty", text: "Specialty Items" }
        ];

        categorySelects.forEach(select => {
            if (select) {
                // Clear existing options except the first one ("All Categories" or "Select Category")
                const firstOption = select.options[0];
                select.innerHTML = '';
                if (firstOption) select.appendChild(firstOption);

                categories.forEach(cat => {
                    const option = document.createElement('option');
                    option.value = cat.value;
                    option.textContent = cat.text;
                    select.appendChild(option);
                });
            }
        });
    }

    function showLoading(message = 'Loading...') {
        if (loadingOverlay) {
            const msgElement = loadingOverlay.querySelector('p');
            if (msgElement) msgElement.textContent = message;
            loadingOverlay.classList.add('active');
        }
    }

    function hideLoading() {
        if (loadingOverlay) loadingOverlay.classList.remove('active');
    }

    function showToast(message, type = 'success') { // Added type parameter
        if (toast && toastMessage) {
            toastMessage.textContent = message;
            toast.className = 'toast'; // Reset classes
            toast.classList.add(`toast-${type}`); // Add type-specific class
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
            }, 3000);
        } else {
            console.warn("Toast elements not found. Message:", message);
            alert(message); // Fallback
        }
    }

    /**
     * Performs a series of checks and logs for S3 connection and functionality.
     */
    async function debugS3Connection() {
        console.log('[DEBUG_S3] Starting S3 Debug Sequence...');
        showLoading('Running S3 Debug...');

        try {
            // 1. Check Environment Variables (client-side can't see server-side env directly, so we call a check function)
            console.log('[DEBUG_S3] Checking Netlify Function Environment...');
            const envResponse = await fetch('/.netlify/functions/check-env');
            if (!envResponse.ok) throw new Error(`Env check failed: ${envResponse.status}`);
            const envData = await envResponse.json();
            console.log('[DEBUG_S3] Netlify Function Environment Variables (Presence Check):', envData);
            showToast('Environment check complete. See console.', 'info');

            // 2. Test Get Products
            console.log('[DEBUG_S3] Attempting to GET products.json...');
            const products = await getProductsFromS3(); // Uses the existing function
            console.log(`[DEBUG_S3] GET products.json successful. Found ${products.length} products.`);
            showToast(`Fetched ${products.length} products. See console.`, 'info');

            // 3. Test Save (PUT) Products - with a dummy product
            const dummyProduct = {
                id: `debug-${Date.now()}`,
                name: "S3 Debug Test Product",
                category: "specialty",
                price: "$0.01",
                image: "images/placeholder.jpg"
            };
            let currentProducts = await getProductsFromS3(); // Get current list
            const updatedProducts = [...currentProducts, dummyProduct]; // Add dummy

            console.log('[DEBUG_S3] Attempting to SAVE (PUT) products.json with a test product...');
            const saveSuccess = await saveProductsToS3(updatedProducts);
            if (saveSuccess) {
                console.log('[DEBUG_S3] SAVE products.json successful.');
                showToast('Test product saved to S3. See console.', 'success');

                // 4. Verify Save by Getting Again
                console.log('[DEBUG_S3] Verifying save by GETTING products.json again...');
                const productsAfterSave = await getProductsFromS3();
                const foundDummy = productsAfterSave.find(p => p.id === dummyProduct.id);
                if (foundDummy) {
                    console.log('[DEBUG_S3] Verification successful. Test product found.');
                    showToast('Test product verified in S3.', 'success');

                    // 5. Clean up - Remove the dummy product
                    console.log('[DEBUG_S3] Cleaning up: Removing test product...');
                    const cleanedProducts = productsAfterSave.filter(p => p.id !== dummyProduct.id);
                    const cleanupSuccess = await saveProductsToS3(cleanedProducts);
                    if (cleanupSuccess) {
                        console.log('[DEBUG_S3] Cleanup successful. Test product removed.');
                        showToast('Test product removed from S3.', 'info');
                    } else {
                        console.error('[DEBUG_S3] Cleanup FAILED. Manual cleanup of test product might be needed.');
                        showToast('Failed to remove test product from S3.', 'error');
                    }
                } else {
                    console.error('[DEBUG_S3] Verification FAILED. Test product not found after save.');
                    showToast('Test product NOT verified in S3.', 'error');
                }
            } else {
                console.error('[DEBUG_S3] SAVE products.json FAILED.');
                showToast('Failed to save test product to S3.', 'error');
            }

        } catch (error) {
            console.error('[DEBUG_S3] An error occurred during S3 debug:', error);
            showToast(`S3 Debug Error: ${error.message}. See console.`, 'error');
        } finally {
            hideLoading();
            console.log('[DEBUG_S3] S3 Debug Sequence Ended.');
        }
    }


    // ==================
    // Global Functions (for onclick handlers in HTML)
    // ==================
    window.editProduct = async function(prodId) { // Make it async
        console.log('Attempting to edit product with ID:', prodId);
        const products = await getProductsFromS3();
        const product = products.find(p => p.id === prodId);
        if (product) {
            openProductModal(product);
        } else {
            console.error('Product not found for editing:', prodId);
            showToast('Error: Product not found.', 'error');
        }
    };

    window.deleteProduct = deleteProduct; // Already async
    window.deleteOrder = deleteOrder;   // Already async

    // ==================
    // Initialize Application
    // ==================
    init();
});
