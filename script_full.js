// Florê - Premium Digital Catalog JavaScript
// Enhanced WhatsApp Integration with Detailed Order Summary

class FloralCatalogApp {
    constructor() {
        this.products = [];
        this.categories = [];
        this.cart = JSON.parse(localStorage.getItem('flore_cart')) || [];
        this.favorites = JSON.parse(localStorage.getItem('flore_favorites')) || [];
        this.currentFilter = 'all';
        this.currentSort = 'name';
        this.currentView = 'grid';
        this.searchQuery = '';
        this.currentPage = 1;
        this.productsPerPage = 12;
        this.isLoading = false;
        this.settings = {};
        
        this.init();
    }

    // Initialize Application
    async init() {
        try {
            await this.loadSettings();
            await this.loadCategories();
            await this.loadProducts();
            this.setupEventListeners();
            this.updateCartCount();
            this.updateFavoritesCount();
            this.trackPageView();
        } catch (error) {
            console.error('Initialization error:', error);
            this.showToast('Erro ao carregar aplicação', 'error');
        } finally {
            // Always hide loading screen
            this.hideLoadingScreen();
        }
    }

    // Load data from API
    async loadProducts() {
        try {
            const apiUrl = this.getApiUrl();
            const response = await fetch(`${apiUrl}/api/products`);
            if (response.ok) {
                this.products = await response.json();
                this.renderProducts();
            } else {
                // Fallback to sample data if API fails
                this.products = this.getSampleProducts();
                this.renderProducts();
            }
        } catch (error) {
            console.error('Error loading products:', error);
            this.products = this.getSampleProducts();
            this.renderProducts();
        }
    }

    async loadCategories() {
        try {
            const apiUrl = this.getApiUrl();
            const response = await fetch(`${apiUrl}/api/categories`);
            if (response.ok) {
                this.categories = await response.json();
            } else {
                this.categories = this.getSampleCategories();
            }
        } catch (error) {
            console.error('Error loading categories:', error);
            this.categories = this.getSampleCategories();
        }
    }

    async loadSettings() {
        try {
            const apiUrl = this.getApiUrl();
            const response = await fetch(`${apiUrl}/api/settings`);
            if (response.ok) {
                this.settings = await response.json();
                this.applySettings();
            } else {
                this.settings = this.getDefaultSettings();
                this.applySettings();
            }
        } catch (error) {
            console.error('Error loading settings:', error);
            this.settings = this.getDefaultSettings();
            this.applySettings();
        }
    }

    // Get API URL based on environment
    getApiUrl() {
        // Check if we're in development (localhost) or production
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'http://localhost:5000';
        } else {
            // Production backend URL
            return 'https://flore-backend.onrender.com';
        }
    }

    // Sample data for fallback
    getSampleProducts() {
        return [
            {
                id: '1',
                name: 'Buquê de Rosas Vermelhas',
                description: 'Elegante buquê com 12 rosas vermelhas frescas, perfeito para demonstrar amor e carinho.',
                price: 89.90,
                category: 'buques',
                imageUrl: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=400&h=300&fit=crop',
                featured: true,
                views: 156,
                tags: ['romântico', 'clássico', 'vermelho']
            },
            {
                id: '2',
                name: 'Arranjo de Girassóis',
                description: 'Arranjo vibrante com girassóis frescos que trazem alegria e energia positiva.',
                price: 65.00,
                category: 'arranjos',
                imageUrl: 'https://images.unsplash.com/photo-1471194402529-8e0f5a675de6?w=400&h=300&fit=crop',
                featured: false,
                views: 89,
                tags: ['alegre', 'amarelo', 'energia']
            },
            {
                id: '3',
                name: 'Cesta de Flores Mistas',
                description: 'Bela cesta com variedade de flores coloridas, ideal para presentear em ocasiões especiais.',
                price: 120.00,
                category: 'cestas',
                imageUrl: 'https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=400&h=300&fit=crop',
                featured: true,
                views: 203,
                tags: ['misto', 'colorido', 'presente']
            },
            {
                id: '4',
                name: 'Orquídea Phalaenopsis',
                description: 'Elegante orquídea em vaso decorativo, perfeita para decoração de ambientes sofisticados.',
                price: 95.00,
                category: 'plantas',
                imageUrl: 'https://images.unsplash.com/photo-1452827073306-6e6e661baf57?w=400&h=300&fit=crop',
                featured: false,
                views: 134,
                tags: ['elegante', 'sofisticado', 'duradouro']
            },
            {
                id: '5',
                name: 'Buquê de Tulipas',
                description: 'Delicado buquê com tulipas coloridas, simbolizando renovação e primavera.',
                price: 75.50,
                category: 'buques',
                imageUrl: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400&h=300&fit=crop',
                featured: false,
                views: 98,
                tags: ['primavera', 'delicado', 'colorido']
            },
            {
                id: '6',
                name: 'Arranjo Tropical',
                description: 'Exótico arranjo com flores tropicais que trazem um toque de paraíso ao ambiente.',
                price: 110.00,
                category: 'arranjos',
                imageUrl: 'https://images.unsplash.com/photo-1508610048659-a06b669e3321?w=400&h=300&fit=crop',
                featured: true,
                views: 167,
                tags: ['tropical', 'exótico', 'paraíso']
            }
        ];
    }

    getSampleCategories() {
        return [
            { id: 'buques', name: 'Buquês', description: 'Buquês elegantes para todas as ocasiões' },
            { id: 'arranjos', name: 'Arranjos', description: 'Arranjos florais únicos e criativos' },
            { id: 'cestas', name: 'Cestas', description: 'Cestas decorativas com flores variadas' },
            { id: 'plantas', name: 'Plantas', description: 'Plantas ornamentais para decoração' }
        ];
    }

    getDefaultSettings() {
        return {
            siteName: 'Florê',
            siteTagline: 'PREMIUM COLLECTION',
            heroTitle: 'Flores que encantam, momentos que marcam.',
            heroSubtitle: 'Arranjos feitos à mão com as flores mais frescas para celebrar a vida.',
            whatsapp: '5564999999999',
            address: 'Av. Hermógenes Coelho, 812 - Centro\nSão Luís de Montes Belos - GO',
            hours: 'Seg - Sex: 08:00 às 18:00\nSáb: 08:00 às 12:00'
        };
    }

    // Apply settings to the page
    applySettings() {
        // Update content based on settings
        const heroTitle = document.getElementById('hero-title');
        if (heroTitle && this.settings.heroTitle) {
            heroTitle.textContent = this.settings.heroTitle;
        }

        const heroSubtitle = document.getElementById('hero-subtitle');
        if (heroSubtitle && this.settings.heroSubtitle) {
            heroSubtitle.textContent = this.settings.heroSubtitle;
        }

        const contactAddress = document.getElementById('contact-address');
        if (contactAddress && this.settings.address) {
            contactAddress.innerHTML = this.settings.address.replace(/\n/g, '<br>');
        }

        const contactWhatsapp = document.getElementById('contact-whatsapp');
        if (contactWhatsapp && this.settings.whatsapp) {
            contactWhatsapp.textContent = this.settings.whatsapp;
        }

        const contactHours = document.getElementById('contact-hours');
        if (contactHours && this.settings.hours) {
            contactHours.innerHTML = this.settings.hours.replace(/\n/g, '<br>');
        }
    }

    // Setup Event Listeners
    setupEventListeners() {
        // Header scroll effect
        window.addEventListener('scroll', this.handleScroll.bind(this));

        // Mobile menu
        const mobileMenuButton = document.getElementById('mobile-menu-button');
        const mobileMenu = document.getElementById('mobile-menu');
        if (mobileMenuButton && mobileMenu) {
            mobileMenuButton.addEventListener('click', () => {
                mobileMenu.classList.toggle('hidden');
            });
        }

        // Search functionality
        const searchButton = document.getElementById('search-button');
        const searchBar = document.getElementById('search-bar');
        const searchInput = document.getElementById('search-input');
        const clearSearch = document.getElementById('clear-search');

        if (searchButton && searchBar) {
            searchButton.addEventListener('click', () => {
                searchBar.classList.toggle('hidden');
                if (!searchBar.classList.contains('hidden')) {
                    searchInput.focus();
                }
            });
        }

        if (searchInput) {
            searchInput.addEventListener('input', this.debounce(this.handleSearch.bind(this), 300));
        }

        if (clearSearch) {
            clearSearch.addEventListener('click', () => {
                searchInput.value = '';
                this.searchQuery = '';
                this.renderProducts();
            });
        }

        // Cart and favorites
        const cartButton = document.getElementById('cart-button');
        const favoritesButton = document.getElementById('favorites-button');

        if (cartButton) {
            cartButton.addEventListener('click', () => this.openCartModal());
        }

        if (favoritesButton) {
            favoritesButton.addEventListener('click', () => this.openFavoritesModal());
        }

        // WhatsApp buttons
        const whatsappDirect = document.getElementById('whatsapp-direct');
        if (whatsappDirect) {
            whatsappDirect.addEventListener('click', () => this.openWhatsAppDirect());
        }

        // View toggle
        const gridView = document.getElementById('grid-view');
        const listView = document.getElementById('list-view');

        if (gridView) {
            gridView.addEventListener('click', () => this.setView('grid'));
        }

        if (listView) {
            listView.addEventListener('click', () => this.setView('list'));
        }

        // Sort functionality
        const sortSelect = document.getElementById('sort-select');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.currentSort = e.target.value;
                this.renderProducts();
            });
        }

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });

        // Load more
        const loadMore = document.getElementById('load-more');
        if (loadMore) {
            loadMore.addEventListener('click', () => this.loadMoreProducts());
        }

        // Modal close buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('close-modal') || e.target.closest('.close-modal')) {
                this.closeAllModals();
            }
        });

        // Checkout form
        const checkoutForm = document.getElementById('checkout-form');
        if (checkoutForm) {
            checkoutForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.processCheckout();
            });
        }

        const checkoutBtn = document.getElementById('checkout-btn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => this.openCheckoutModal());
        }

        // Smooth scrolling for navigation links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    // Render products
    renderProducts() {
        const grid = document.getElementById('products-grid');
        if (!grid) return;

        let filteredProducts = this.products;

        // Apply search filter
        if (this.searchQuery) {
            filteredProducts = filteredProducts.filter(product => 
                product.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                product.description.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                product.tags.some(tag => tag.toLowerCase().includes(this.searchQuery.toLowerCase()))
            );
        }

        // Apply category filter
        if (this.currentFilter !== 'all') {
            filteredProducts = filteredProducts.filter(product => product.category === this.currentFilter);
        }

        // Apply sorting
        filteredProducts.sort((a, b) => {
            switch (this.currentSort) {
                case 'price-low':
                    return a.price - b.price;
                case 'price-high':
                    return b.price - a.price;
                case 'views':
                    return b.views - a.views;
                case 'name':
                default:
                    return a.name.localeCompare(b.name);
            }
        });

        // Pagination
        const startIndex = 0;
        const endIndex = this.currentPage * this.productsPerPage;
        const productsToShow = filteredProducts.slice(startIndex, endIndex);

        grid.innerHTML = '';

        productsToShow.forEach(product => {
            const productCard = this.createProductCard(product);
            grid.appendChild(productCard);
        });

        // Update load more button
        const loadMoreBtn = document.getElementById('load-more');
        if (loadMoreBtn) {
            if (endIndex >= filteredProducts.length) {
                loadMoreBtn.style.display = 'none';
            } else {
                loadMoreBtn.style.display = 'block';
            }
        }
    }

    createProductCard(product) {
        const card = document.createElement('div');
        card.className = 'product-card glass-effect rounded-2xl overflow-hidden border border-primary/20 hover-glow transition-all duration-300';
        
        const isFavorite = this.favorites.includes(product.id);
        
        card.innerHTML = `
            <div class="relative">
                <img src="${product.imageUrl || 'https://placehold.co/400x300/1a1a1a/C4A484?text=' + encodeURIComponent(product.name)}" 
                     alt="${product.name}" 
                     class="w-full h-48 object-cover"
                     onerror="this.src='https://placehold.co/400x300/1a1a1a/C4A484?text=' + encodeURIComponent('${product.name}')">
                
                <button class="favorite-btn absolute top-4 right-4 p-2 rounded-full glass-effect border border-primary/20 text-text-secondary hover:text-red-500 transition-colors ${isFavorite ? 'text-red-500' : ''}" 
                        data-product-id="${product.id}">
                    <svg class="w-5 h-5" fill="${isFavorite ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                    </svg>
                </button>
                
                ${product.featured ? '<div class="absolute top-4 left-4 bg-primary text-black px-3 py-1 rounded-full text-sm font-bold">Destaque</div>' : ''}
            </div>
            
            <div class="p-6">
                <div class="mb-4">
                    <h3 class="text-lg font-semibold text-primary mb-2">${product.name}</h3>
                    <p class="text-text-secondary text-sm line-clamp-2">${product.description}</p>
                </div>
                
                <div class="flex items-center justify-between mb-4">
                    <span class="text-2xl font-bold gradient-text">R$ ${product.price.toFixed(2)}</span>
                    <span class="text-text-secondary text-sm">${product.views} visualizações</span>
                </div>
                
                <div class="flex flex-wrap gap-2 mb-4">
                    ${product.tags.slice(0, 3).map(tag => `
                        <span class="px-2 py-1 bg-primary/20 text-primary text-xs rounded-full">${tag}</span>
                    `).join('')}
                </div>
                
                <div class="flex space-x-3">
                    <button class="view-product-btn flex-1 btn-primary py-3 rounded-xl font-medium transition-all duration-300 hover-glow" 
                            data-product-id="${product.id}">
                        Ver Detalhes
                    </button>
                    <button class="add-to-cart-btn p-3 glass-effect border border-primary/30 text-primary hover:bg-primary hover:text-black rounded-xl transition-all duration-300" 
                            data-product-id="${product.id}">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;

        // Add event listeners
        const favoriteBtn = card.querySelector('.favorite-btn');
        favoriteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleFavorite(product.id);
        });

        const viewBtn = card.querySelector('.view-product-btn');
        viewBtn.addEventListener('click', () => this.openProductModal(product.id));

        const addToCartBtn = card.querySelector('.add-to-cart-btn');
        addToCartBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.addToCart(product.id);
        });

        return card;
    }

    // Cart functionality
    addToCart(productId, quantity = 1) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        const existingItem = this.cart.find(item => item.id === productId);
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                imageUrl: product.imageUrl,
                quantity: quantity
            });
        }

        this.saveCart();
        this.updateCartCount();
        this.showToast(`${product.name} adicionado ao carrinho!`, 'success');
        this.trackEvent('add_to_cart', { product_id: productId, product_name: product.name });
    }

    removeFromCart(productId) {
        this.cart = this.cart.filter(item => item.id !== productId);
        this.saveCart();
        this.updateCartCount();
        this.renderCartItems();
    }

    updateCartQuantity(productId, quantity) {
        const item = this.cart.find(item => item.id === productId);
        if (item) {
            if (quantity <= 0) {
                this.removeFromCart(productId);
            } else {
                item.quantity = quantity;
                this.saveCart();
                this.renderCartItems();
            }
        }
    }

    saveCart() {
        localStorage.setItem('flore_cart', JSON.stringify(this.cart));
    }

    updateCartCount() {
        const count = this.cart.reduce((total, item) => total + item.quantity, 0);
        const cartCount = document.getElementById('cart-count');
        if (cartCount) {
            if (count > 0) {
                cartCount.textContent = count;
                cartCount.classList.remove('hidden');
            } else {
                cartCount.classList.add('hidden');
            }
        }
    }

    getCartTotal() {
        return this.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    // Favorites functionality
    toggleFavorite(productId) {
        const index = this.favorites.indexOf(productId);
        if (index > -1) {
            this.favorites.splice(index, 1);
            this.showToast('Removido dos favoritos', 'info');
        } else {
            this.favorites.push(productId);
            this.showToast('Adicionado aos favoritos!', 'success');
        }
        
        this.saveFavorites();
        this.updateFavoritesCount();
        this.renderProducts(); // Re-render to update favorite buttons
    }

    saveFavorites() {
        localStorage.setItem('flore_favorites', JSON.stringify(this.favorites));
    }

    updateFavoritesCount() {
        const count = this.favorites.length;
        const favoritesCount = document.getElementById('favorites-count');
        if (favoritesCount) {
            if (count > 0) {
                favoritesCount.textContent = count;
                favoritesCount.classList.remove('hidden');
            } else {
                favoritesCount.classList.add('hidden');
            }
        }
    }

    // Modal functionality
    openCartModal() {
        this.renderCartItems();
        document.getElementById('cart-modal').classList.remove('hidden');
    }

    renderCartItems() {
        const container = document.getElementById('cart-items');
        const totalElement = document.getElementById('cart-total');
        
        if (!container) return;

        if (this.cart.length === 0) {
            container.innerHTML = '<p class="text-text-secondary text-center py-8">Seu carrinho está vazio</p>';
            if (totalElement) totalElement.textContent = 'R$ 0,00';
            return;
        }

        container.innerHTML = '';
        
        this.cart.forEach(item => {
            const cartItem = document.createElement('div');
            cartItem.className = 'flex items-center space-x-4 p-4 glass-effect rounded-lg';
            cartItem.innerHTML = `
                <img src="${item.imageUrl || 'https://placehold.co/80x80/1a1a1a/C4A484?text=' + encodeURIComponent(item.name)}" 
                     alt="${item.name}" class="w-16 h-16 object-cover rounded-lg">
                <div class="flex-1">
                    <h4 class="font-semibold text-primary">${item.name}</h4>
                    <p class="text-text-secondary">R$ ${item.price.toFixed(2)}</p>
                </div>
                <div class="flex items-center space-x-2">
                    <button class="quantity-btn p-1 glass-effect border border-primary/30 text-primary rounded" 
                            onclick="app.updateCartQuantity('${item.id}', ${item.quantity - 1})">-</button>
                    <span class="w-8 text-center text-primary font-bold">${item.quantity}</span>
                    <button class="quantity-btn p-1 glass-effect border border-primary/30 text-primary rounded" 
                            onclick="app.updateCartQuantity('${item.id}', ${item.quantity + 1})">+</button>
                </div>
                <button class="text-red-400 hover:text-red-300 transition-colors" 
                        onclick="app.removeFromCart('${item.id}')">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                </button>
            `;
            container.appendChild(cartItem);
        });

        if (totalElement) {
            totalElement.textContent = `R$ ${this.getCartTotal().toFixed(2)}`;
        }
    }

    openCheckoutModal() {
        if (this.cart.length === 0) {
            this.showToast('Seu carrinho está vazio', 'error');
            return;
        }

        const checkoutTotal = document.getElementById('checkout-total');
        if (checkoutTotal) {
            checkoutTotal.textContent = `R$ ${this.getCartTotal().toFixed(2)}`;
        }

        this.closeAllModals();
        document.getElementById('checkout-modal').classList.remove('hidden');
    }

    async processCheckout() {
        const form = document.getElementById('checkout-form');
        const formData = new FormData(form);
        
        const orderData = {
            customer_name: formData.get('customer_name'),
            customer_phone: formData.get('customer_phone'),
            customer_email: formData.get('customer_email'),
            delivery_address: formData.get('delivery_address'),
            delivery_time: formData.get('delivery_time'),
            payment_method: formData.get('payment_method'),
            notes: formData.get('notes'),
            items: this.cart,
            total: this.getCartTotal()
        };

        // Validate required fields
        if (!orderData.customer_name || !orderData.customer_phone) {
            this.showToast('Por favor, preencha os campos obrigatórios', 'error');
            return;
        }

        try {
            const apiUrl = this.getApiUrl();
            // Send order to WhatsApp with enhanced summary
            const response = await fetch(`${apiUrl}/api/whatsapp/send-order`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderData)
            });

            if (response.ok) {
                const result = await response.json();
                
                // Save order to database
                await this.saveOrder(orderData);
                
                // Open WhatsApp with the formatted message
                window.open(result.whatsapp_url, '_blank');
                
                // Clear cart and close modal
                this.cart = [];
                this.saveCart();
                this.updateCartCount();
                this.closeAllModals();
                
                this.showToast('Pedido enviado para o WhatsApp!', 'success');
                this.trackEvent('purchase', { 
                    order_total: orderData.total,
                    items_count: orderData.items.length 
                });
            } else {
                throw new Error('Erro ao processar pedido');
            }
        } catch (error) {
            console.error('Checkout error:', error);
            this.showToast('Erro ao processar pedido. Tente novamente.', 'error');
        }
    }

    async saveOrder(orderData) {
        try {
            const apiUrl = this.getApiUrl();
            const response = await fetch(`${apiUrl}/api/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderData)
            });
            
            if (!response.ok) {
                console.error('Failed to save order to database');
            }
        } catch (error) {
            console.error('Error saving order:', error);
        }
    }

    openWhatsAppDirect() {
        const whatsappNumber = this.settings.whatsapp || '5564999999999';
        const message = encodeURIComponent('Olá! Gostaria de saber mais sobre os arranjos da Florê. 🌸');
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;
        window.open(whatsappUrl, '_blank');
        
        this.trackEvent('whatsapp_direct_contact');
    }

    closeAllModals() {
        document.querySelectorAll('.fixed').forEach(modal => {
            if (modal.id !== 'toast' && modal.id !== 'loading-screen') {
                modal.classList.add('hidden');
            }
        });
    }

    // Filter and search functionality
    setFilter(filter) {
        this.currentFilter = filter;
        this.currentPage = 1;
        
        // Update filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active', 'border-primary', 'text-primary');
            btn.classList.add('border-primary/30', 'text-text-secondary');
        });
        
        const activeBtn = document.querySelector(`[data-filter="${filter}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active', 'border-primary', 'text-primary');
            activeBtn.classList.remove('border-primary/30', 'text-text-secondary');
        }
        
        this.renderProducts();
    }

    handleSearch(e) {
        this.searchQuery = e.target.value;
        this.currentPage = 1;
        this.renderProducts();
    }

    setView(view) {
        this.currentView = view;
        
        // Update view buttons
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.remove('active', 'bg-primary', 'text-black');
            btn.classList.add('glass-effect', 'text-text-secondary');
        });
        
        const activeBtn = document.getElementById(`${view}-view`);
        if (activeBtn) {
            activeBtn.classList.add('active', 'bg-primary', 'text-black');
            activeBtn.classList.remove('glass-effect', 'text-text-secondary');
        }
        
        // Update grid classes based on view
        const grid = document.getElementById('products-grid');
        if (grid) {
            if (view === 'list') {
                grid.className = 'space-y-6';
            } else {
                grid.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8';
            }
        }
        
        this.renderProducts();
    }

    loadMoreProducts() {
        this.currentPage++;
        this.renderProducts();
    }

    // Utility functions
    handleScroll() {
        const header = document.getElementById('main-header');
        if (header) {
            if (window.scrollY > 100) {
                header.classList.add('navbar-blur');
            } else {
                header.classList.remove('navbar-blur');
            }
        }
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            setTimeout(() => {
                loadingScreen.classList.add('hidden');
            }, 1000);
        }
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        const icon = document.getElementById('toast-icon');
        const messageEl = document.getElementById('toast-message');

        const icons = {
            'success': '<svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>',
            'error': '<svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>',
            'info': '<svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'
        };

        if (icon) icon.innerHTML = icons[type] || icons['info'];
        if (messageEl) messageEl.textContent = message;
        if (toast) {
            toast.classList.remove('hidden');
            setTimeout(() => {
                toast.classList.add('hidden');
            }, 3000);
        }
    }

    // Analytics tracking
    async trackEvent(eventType, eventData = {}) {
        try {
            const apiUrl = this.getApiUrl();
            await fetch(`${apiUrl}/api/analytics`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    event_type: eventType,
                    event_data: eventData
                })
            });
        } catch (error) {
            console.error('Analytics tracking error:', error);
        }
    }

    trackPageView() {
        this.trackEvent('page_view', {
            page: window.location.pathname,
            timestamp: new Date().toISOString()
        });
    }

    openProductModal(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        // Track product view
        this.trackEvent('product_view', { 
            product_id: productId, 
            product_name: product.name 
        });

        // Update product views
        this.updateProductViews(productId);

        const modal = document.getElementById('product-modal');
        const content = document.getElementById('product-modal-content');
        
        if (!modal || !content) return;

        const isFavorite = this.favorites.includes(productId);
        
        content.innerHTML = `
            <div class="p-8">
                <div class="flex justify-between items-start mb-6">
                    <h2 class="text-3xl font-display font-bold gradient-text">${product.name}</h2>
                    <button class="close-modal text-text-secondary hover:text-primary transition-colors">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                        <img src="${product.imageUrl || 'https://placehold.co/600x400/1a1a1a/C4A484?text=' + encodeURIComponent(product.name)}" 
                             alt="${product.name}" 
                             class="w-full rounded-2xl shadow-lg">
                    </div>
                    
                    <div class="space-y-6">
                        <div>
                            <p class="text-lg text-text-secondary leading-relaxed">${product.description}</p>
                        </div>
                        
                        <div class="flex items-center justify-between">
                            <span class="text-4xl font-bold gradient-text">R$ ${product.price.toFixed(2)}</span>
                            <span class="text-text-secondary">${product.views} visualizações</span>
                        </div>
                        
                        <div class="flex flex-wrap gap-2">
                            ${product.tags.map(tag => `
                                <span class="px-3 py-1 bg-primary/20 text-primary rounded-full">${tag}</span>
                            `).join('')}
                        </div>
                        
                        <div class="flex space-x-4">
                            <button class="flex-1 btn-primary py-4 rounded-xl font-bold text-lg transition-all duration-300 hover-glow" 
                                    onclick="app.addToCart('${productId}'); app.closeAllModals();">
                                Adicionar ao Carrinho
                            </button>
                            <button class="p-4 glass-effect border border-primary/30 text-primary hover:text-red-500 rounded-xl transition-all duration-300 ${isFavorite ? 'text-red-500' : ''}" 
                                    onclick="app.toggleFavorite('${productId}'); this.classList.toggle('text-red-500');">
                                <svg class="w-6 h-6" fill="${isFavorite ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                                </svg>
                            </button>
                        </div>
                        
                        <div class="border-t border-primary/20 pt-6">
                            <button class="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-xl transition-all duration-300 flex items-center justify-center space-x-3" 
                                    onclick="app.orderViaWhatsApp('${productId}')">
                                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                                </svg>
                                <span>Pedir via WhatsApp</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        modal.classList.remove('hidden');
    }

    async orderViaWhatsApp(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        const orderData = {
            customer_name: 'Cliente',
            customer_phone: '',
            items: [{
                id: product.id,
                name: product.name,
                price: product.price,
                quantity: 1
            }],
            total: product.price,
            notes: `Interesse no produto: ${product.name}`
        };

        try {
            const apiUrl = this.getApiUrl();
            const response = await fetch(`${apiUrl}/api/whatsapp/send-order`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderData)
            });

            if (response.ok) {
                const result = await response.json();
                window.open(result.whatsapp_url, '_blank');
                this.closeAllModals();
                this.trackEvent('whatsapp_product_order', { product_id: productId });
            }
        } catch (error) {
            console.error('WhatsApp order error:', error);
            this.showToast('Erro ao abrir WhatsApp', 'error');
        }
    }

    async updateProductViews(productId) {
        try {
            const apiUrl = this.getApiUrl();
            await fetch(`${apiUrl}/api/products/${productId}/view`, {
                method: 'POST'
            });
        } catch (error) {
            console.error('Error updating product views:', error);
        }
    }
}

// Initialize the application
const app = new FloralCatalogApp();

// Make app globally available for onclick handlers
window.app = app;

