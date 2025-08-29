// Florê - Premium Digital Catalog JavaScript (Versão 100% Completa e Corrigida)
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
    }

    async init() {
        try {
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("O servidor demorou muito para responder (timeout).")), 30000)
            );
            
            await Promise.race([
                Promise.all([this.loadSettings(), this.loadCategories(), this.loadProducts()]),
                timeoutPromise
            ]);
            
            this.setupEventListeners();
            this.updateCartCount();
            this.updateFavoritesCount();
            this.trackPageView();
        } catch (error) {
            console.error('Initialization error:', error);
            this.showToast('Erro ao carregar dados do servidor. Mostrando exemplos.', 'error');
            this.loadSampleDataAsFallback();
            this.setupEventListeners();
        } finally {
            this.hideLoadingScreen();
        }
    }

    async loadProducts() {
        const apiUrl = this.getApiUrl();
        try {
            const response = await fetch(`${apiUrl}/api/products`);
            if (!response.ok) throw new Error('Failed to fetch products');
            this.products = await response.json();
        } catch (error) {
            console.error(error);
            this.products = this.getSampleProducts();
        } finally {
            this.renderProducts();
        }
    }

    async loadCategories() {
        const apiUrl = this.getApiUrl();
        try {
            const response = await fetch(`${apiUrl}/api/categories`);
            if (!response.ok) throw new Error('Failed to fetch categories');
            this.categories = await response.json();
        } catch (error) {
            console.error(error);
            this.categories = this.getSampleCategories();
        }
    }

    async loadSettings() {
        const apiUrl = this.getApiUrl();
        try {
            const response = await fetch(`${apiUrl}/api/settings`);
            if (!response.ok) throw new Error('Failed to fetch settings');
            this.settings = await response.json();
        } catch (error) {
            console.error(error);
            this.settings = this.getDefaultSettings();
        } finally {
            this.applySettings();
        }
    }

    getApiUrl() {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'http://localhost:5000';
        } else {
            return 'https://flore-backend.onrender.com';
        }
    }

    getSampleProducts() {
        return [
            { id: '1', name: 'Buquê de Rosas Vermelhas (Exemplo)', description: 'Elegante buquê com 12 rosas vermelhas frescas.', price: 89.90, category: 'buques', imageUrl: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=400&h=300&fit=crop', featured: true, views: 156, tags: ['romântico', 'clássico'] }
        ];
    }

    getSampleCategories() {
        return [{ id: 'buques', name: 'Buquês', description: 'Buquês elegantes' }];
    }
    
    getDefaultSettings() {
        return {
            siteName: 'Florê', siteTagline: 'PREMIUM COLLECTION', heroTitle: 'Flores que encantam, momentos que marcam.',
            heroSubtitle: 'Arranjos feitos à mão com as flores mais frescas para celebrar a vida.',
            whatsapp: '556436714040', address: 'Av. Hermógenes Coelho, 812 - Centro<br>São Luís de Montes Belos - GO',
            hours: 'Seg - Sex: 08:00 às 18:00<br>Sáb: 08:00 às 12:00',
            aboutTitle: 'Nossa História',
            aboutText: '<p>A Florê Floricultura nasceu de um sonho de mãe e filha...</p>',
            aboutImage: 'https://placehold.co/600x400/1a1a1a/C4A484?text=Nossa+Loja',
            logoUrl: 'https://storage.googleapis.com/gemini-prod-us-west1-d50e9603655a/uploaded/logo%20quadrada.png'
        };
    }

    applySettings() {
        document.title = `${this.settings.siteName || 'Florê'} - Catálogo Digital Premium`;
        const setText = (id, text) => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = text;
        };
        const setSrc = (id, src) => {
            const el = document.getElementById(id);
            if (el) el.src = src;
        };

        setText('hero-title', this.settings.heroTitle);
        setText('hero-subtitle', this.settings.heroSubtitle);
        setText('about-title', this.settings.aboutTitle);
        setText('about-text', this.settings.aboutText);
        setSrc('about-image', this.settings.aboutImage);
        setText('contact-address', this.settings.address);
        setText('contact-whatsapp', this.settings.whatsapp.replace(/(\d{2})(\d{2})(\d{4,5})(\d{4})/, '+$1 ($2) $3-$4'));
        setText('contact-hours', this.settings.hours);
        document.querySelectorAll('#header-logo, footer img').forEach(img => {
            if (this.settings.logoUrl) img.src = this.settings.logoUrl;
        });
    }

    setupEventListeners() {
        window.addEventListener('scroll', this.handleScroll.bind(this));
        document.getElementById('mobile-menu-button')?.addEventListener('click', () => document.getElementById('mobile-menu')?.classList.toggle('hidden'));
        document.getElementById('search-button')?.addEventListener('click', () => {
            const searchBar = document.getElementById('search-bar');
            searchBar?.classList.toggle('hidden');
            if (!searchBar?.classList.contains('hidden')) {
                document.getElementById('search-input')?.focus();
            }
        });
        document.getElementById('search-input')?.addEventListener('input', this.debounce(this.handleSearch.bind(this), 300));
        document.getElementById('clear-search')?.addEventListener('click', () => {
            const searchInput = document.getElementById('search-input');
            if(searchInput) searchInput.value = '';
            this.searchQuery = '';
            this.renderProducts();
        });
        document.getElementById('cart-button')?.addEventListener('click', () => this.openCartModal());
        document.getElementById('favorites-button')?.addEventListener('click', () => this.openFavoritesModal());
        document.getElementById('whatsapp-direct')?.addEventListener('click', () => this.openWhatsAppDirect());
        document.getElementById('grid-view')?.addEventListener('click', () => this.setView('grid'));
        document.getElementById('list-view')?.addEventListener('click', () => this.setView('list'));
        document.getElementById('sort-select')?.addEventListener('change', (e) => {
            this.currentSort = e.target.value;
            this.renderProducts();
        });
        document.querySelectorAll('.filter-btn').forEach(btn => btn.addEventListener('click', (e) => this.setFilter(e.target.dataset.filter)));
        document.getElementById('load-more')?.addEventListener('click', () => this.loadMoreProducts());
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('close-modal') || e.target.closest('.close-modal')) {
                this.closeAllModals();
            }
        });
        document.getElementById('checkout-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.processCheckout();
        });
        document.getElementById('checkout-btn')?.addEventListener('click', () => this.openCheckoutModal());
    }

    renderProducts() {
        const grid = document.getElementById('products-grid');
        if (!grid) return;

        let filtered = [...this.products];
        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            filtered = filtered.filter(p => p.name.toLowerCase().includes(query) || (p.description && p.description.toLowerCase().includes(query)) || (p.tags && p.tags.some(t => t.toLowerCase().includes(query))));
        }
        if (this.currentFilter !== 'all') {
            filtered = filtered.filter(p => p.category === this.currentFilter);
        }
        filtered.sort((a, b) => {
            switch (this.currentSort) {
                case 'price-low': return a.price - b.price;
                case 'price-high': return b.price - a.price;
                case 'views': return (b.views || 0) - (a.views || 0);
                default: return a.name.localeCompare(b.name);
            }
        });

        const productsToShow = filtered.slice(0, this.currentPage * this.productsPerPage);
        grid.innerHTML = '';
        productsToShow.forEach(product => {
            const productCard = this.createProductCard(product);
            grid.appendChild(productCard);
        });

        const loadMoreBtn = document.getElementById('load-more');
        if (loadMoreBtn) {
            loadMoreBtn.style.display = productsToShow.length < filtered.length ? 'inline-block' : 'none';
        }
    }

    createProductCard(product) {
        const card = document.createElement('div');
        const isFavorite = this.favorites.includes(product.id);
        
        if (this.currentView === 'grid') {
            card.className = 'product-card glass-effect rounded-2xl overflow-hidden border border-primary/20 hover-glow transition-all duration-300 animate-scale-in';
            card.innerHTML = `
                <div class="relative">
                    <img src="${product.imageUrl || 'https://placehold.co/400x300'}" alt="${product.name}" class="w-full h-48 object-cover">
                    <button class="favorite-btn absolute top-4 right-4 p-2 rounded-full glass-effect border border-primary/20 ${isFavorite ? 'text-red-500' : 'text-text-secondary'}" data-product-id="${product.id}">
                        <svg class="w-5 h-5" fill="${isFavorite ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
                    </button>
                </div>
                <div class="p-6">
                    <h3 class="text-lg font-semibold text-primary mb-2 truncate">${product.name}</h3>
                    <p class="text-text-secondary text-sm line-clamp-2 h-10">${product.description}</p>
                    <div class="flex items-center justify-between my-4"><span class="text-2xl font-bold gradient-text">R$ ${product.price.toFixed(2)}</span></div>
                    <div class="flex space-x-3">
                        <button class="view-product-btn flex-1 btn-primary py-3 rounded-xl font-medium" data-product-id="${product.id}">Ver Detalhes</button>
                        <button class="add-to-cart-btn p-3 glass-effect border border-primary/30 text-primary hover:bg-primary hover:text-black rounded-xl" data-product-id="${product.id}">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                        </button>
                    </div>
                </div>`;
        } else {
            card.className = 'product-card-list glass-effect rounded-2xl overflow-hidden border border-primary/20 hover-glow transition-all duration-300 flex animate-slide-up';
            card.innerHTML = `
                <img src="${product.imageUrl || 'https://placehold.co/400x300'}" alt="${product.name}" class="w-1/3 h-full object-cover">
                <div class="p-6 flex-1 flex flex-col">
                    <h3 class="text-xl font-semibold text-primary mb-2">${product.name}</h3>
                    <p class="text-text-secondary text-sm flex-grow mb-4">${product.description}</p>
                    <div class="flex items-center justify-between">
                        <span class="text-2xl font-bold gradient-text">R$ ${product.price.toFixed(2)}</span>
                        <div class="flex space-x-3">
                            <button class="favorite-btn p-3 rounded-full glass-effect border border-primary/20 ${isFavorite ? 'text-red-500' : 'text-text-secondary'}" data-product-id="${product.id}">
                                <svg class="w-5 h-5" fill="${isFavorite ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
                            </button>
                            <button class="add-to-cart-btn p-3 glass-effect border border-primary/30 text-primary hover:bg-primary hover:text-black rounded-xl" data-product-id="${product.id}">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                            </button>
                            <button class="view-product-btn flex-1 btn-primary py-3 px-4 rounded-xl font-medium" data-product-id="${product.id}">Ver Mais</button>
                        </div>
                    </div>
                </div>`;
        }

        card.querySelector('.favorite-btn').addEventListener('click', (e) => { e.stopPropagation(); this.toggleFavorite(product.id); });
        card.querySelector('.view-product-btn').addEventListener('click', () => this.openProductModal(product.id));
        card.querySelector('.add-to-cart-btn').addEventListener('click', (e) => { e.stopPropagation(); this.addToCart(product.id); });

        return card;
    }

    addToCart(productId, quantity = 1) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;
        const existingItem = this.cart.find(item => item.id === productId);
        if (existingItem) existingItem.quantity += quantity;
        else this.cart.push({ ...product, quantity });
        this.saveCart();
        this.updateCartCount();
        this.showToast(`${product.name} adicionado ao carrinho!`, 'success');
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
            if (quantity <= 0) this.removeFromCart(productId);
            else {
                item.quantity = quantity;
                this.saveCart();
                this.renderCartItems();
            }
        }
    }

    saveCart() { localStorage.setItem('flore_cart', JSON.stringify(this.cart)); }
    updateCartCount() {
        const count = this.cart.reduce((total, item) => total + item.quantity, 0);
        const cartCount = document.getElementById('cart-count');
        if (cartCount) {
            cartCount.textContent = count;
            cartCount.classList.toggle('hidden', count === 0);
        }
    }

    getCartTotal() { return this.cart.reduce((total, item) => total + (item.price * item.quantity), 0); }
    toggleFavorite(productId) {
        const index = this.favorites.indexOf(productId);
        const product = this.products.find(p => p.id === productId);
        if (index > -1) {
            this.favorites.splice(index, 1);
            this.showToast(`${product.name} removido dos favoritos`, 'info');
        } else {
            this.favorites.push(productId);
            this.showToast(`${product.name} adicionado aos favoritos!`, 'success');
        }
        this.saveFavorites();
        this.updateFavoritesCount();
        this.renderProducts();
        if (!document.getElementById('favorites-modal').classList.contains('hidden')) {
            this.renderFavoritesItems();
        }
    }
    saveFavorites() { localStorage.setItem('flore_favorites', JSON.stringify(this.favorites)); }
    updateFavoritesCount() {
        const count = this.favorites.length;
        const favoritesCount = document.getElementById('favorites-count');
        if (favoritesCount) {
            favoritesCount.textContent = count;
            favoritesCount.classList.toggle('hidden', count === 0);
        }
    }

    openCartModal() {
        this.renderCartItems();
        document.getElementById('cart-modal').classList.remove('hidden');
    }

    renderCartItems() {
        const container = document.getElementById('cart-items');
        const totalElement = document.getElementById('cart-total');
        if (!container || !totalElement) return;
        if (this.cart.length === 0) {
            container.innerHTML = '<p class="text-text-secondary text-center py-8">Seu carrinho está vazio</p>';
            totalElement.textContent = 'R$ 0,00';
            return;
        }
        container.innerHTML = this.cart.map(item => `
            <div class="flex items-center justify-between p-2 glass-effect rounded-lg">
                <img src="${item.imageUrl || 'https://placehold.co/80x80'}" class="w-16 h-16 rounded-lg object-cover">
                <div class="flex-1 ml-4">
                    <p class="font-semibold text-primary">${item.name}</p>
                    <p class="text-sm text-text-secondary">R$ ${item.price.toFixed(2)}</p>
                </div>
                <div class="flex items-center space-x-2">
                    <button class="p-1 rounded-full glass-effect" onclick="app.updateCartQuantity('${item.id}', ${item.quantity - 1})">-</button>
                    <span class="w-8 text-center font-bold">${item.quantity}</span>
                    <button class="p-1 rounded-full glass-effect" onclick="app.updateCartQuantity('${item.id}', ${item.quantity + 1})">+</button>
                </div>
                <button onclick="app.removeFromCart('${item.id}')" class="ml-4 text-red-500 hover:text-red-400 text-2xl">&times;</button>
            </div>`).join('');
        totalElement.textContent = `R$ ${this.getCartTotal().toFixed(2)}`;
    }
    
    openFavoritesModal() {
        this.renderFavoritesItems();
        document.getElementById('favorites-modal').classList.remove('hidden');
    }

    renderFavoritesItems() {
        const container = document.getElementById('favorites-items');
        if (!container) return;

        if (this.favorites.length === 0) {
            container.innerHTML = '<p class="text-text-secondary text-center py-8">Você ainda não favoritou nenhum produto.</p>';
            return;
        }

        container.innerHTML = '';
        const favoriteProducts = this.products.filter(p => this.favorites.includes(p.id));

        favoriteProducts.forEach(item => {
            const favItem = document.createElement('div');
            favItem.className = 'flex items-center space-x-4 p-4 glass-effect rounded-lg';
            favItem.innerHTML = `
                <img src="${item.imageUrl || 'https://placehold.co/80x80'}" alt="${item.name}" class="w-16 h-16 object-cover rounded-lg">
                <div class="flex-1">
                    <h4 class="font-semibold text-primary">${item.name}</h4>
                    <p class="text-text-secondary">R$ ${item.price.toFixed(2)}</p>
                </div>
                <div class="flex items-center space-x-2">
                    <button class="p-2 glass-effect border border-primary/30 text-primary hover:bg-primary hover:text-black rounded" 
                            onclick="app.addToCart('${item.id}'); app.closeAllModals(); app.openCartModal();">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                    </button>
                    <button class="text-red-500 hover:text-red-400 transition-colors" 
                            onclick="app.toggleFavorite('${item.id}');">
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
                    </button>
                </div>
            `;
            container.appendChild(favItem);
        });
    }

    openCheckoutModal() {
        if (this.cart.length === 0) {
            this.showToast('Seu carrinho está vazio. Adicione itens antes de finalizar.', 'error');
            return;
        }
        const checkoutTotal = document.getElementById('checkout-total');
        if (checkoutTotal) checkoutTotal.textContent = `R$ ${this.getCartTotal().toFixed(2)}`;
        this.closeAllModals();
        document.getElementById('checkout-modal').classList.remove('hidden');
    }

    processCheckout() {
        const form = document.getElementById('checkout-form');
        const formData = new FormData(form);
        const customerName = formData.get('customer_name');
        const customerPhone = formData.get('customer_phone');

        if (!customerName || !customerPhone) {
            this.showToast('Por favor, preencha seu Nome e WhatsApp.', 'error');
            return;
        }

        let message = `Olá, ${this.settings.siteName}! Gostaria de fazer um pedido:\n\n`;
        this.cart.forEach(item => {
            message += `*${item.quantity}x* ${item.name} - R$ ${(item.price * item.quantity).toFixed(2)}\n`;
        });
        message += `\n*Total: R$ ${this.getCartTotal().toFixed(2)}*\n\n`;
        message += `*Meus Dados:*\n`;
        message += `Nome: ${customerName}\n`;
        message += `WhatsApp: ${customerPhone}\n`;
        if (formData.get('delivery_address')) message += `Endereço: ${formData.get('delivery_address')}\n`;
        if (formData.get('payment_method')) message += `Pagamento: ${formData.get('payment_method')}\n`;
        if (formData.get('notes')) message += `Observações: ${formData.get('notes')}\n`;

        const whatsappUrl = `https://wa.me/${this.settings.whatsapp}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');

        this.cart = [];
        this.saveCart();
        this.updateCartCount();
        this.closeAllModals();
        this.showToast('Seu pedido foi preparado para envio no WhatsApp!', 'success');
    }
    
    openWhatsAppDirect() {
        const message = encodeURIComponent(`Olá, ${this.settings.siteName}! Gostaria de mais informações.`);
        const whatsappUrl = `https://wa.me/${this.settings.whatsapp}?text=${message}`;
        window.open(whatsappUrl, '_blank');
    }

    closeAllModals() { document.querySelectorAll('.fixed[id*="-modal"]').forEach(m => m.classList.add('hidden')); }
    
    setFilter(filter) {
        this.currentFilter = filter;
        this.currentPage = 1;
        this.renderProducts();
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
            btn.classList.toggle('border-primary', btn.dataset.filter === filter);
            btn.classList.toggle('text-primary', btn.dataset.filter === filter);
            btn.classList.toggle('border-primary/30', btn.dataset.filter !== filter);
            btn.classList.toggle('text-text-secondary', btn.dataset.filter !== filter);
        });
    }

    handleSearch(e) { this.searchQuery = e.target.value; this.currentPage = 1; this.renderProducts(); }
    
    setView(view) {
        this.currentView = view;
        const grid = document.getElementById('products-grid');
        const gridBtn = document.getElementById('grid-view');
        const listBtn = document.getElementById('list-view');

        if (view === 'grid') {
            grid.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8';
            gridBtn.classList.add('active', 'bg-primary', 'text-black');
            listBtn.classList.remove('active', 'bg-primary', 'text-black');
        } else {
            grid.className = 'grid grid-cols-1 gap-8';
            listBtn.classList.add('active', 'bg-primary', 'text-black');
            gridBtn.classList.remove('active', 'bg-primary', 'text-black');
        }
        this.renderProducts();
    }

    loadMoreProducts() {
        if (this.isLoading) return;
        this.isLoading = true;
        this.currentPage++;
        this.renderProducts();
        this.isLoading = false;
    }

    handleScroll() { document.getElementById('main-header')?.classList.toggle('navbar-blur', window.scrollY > 50); }
    
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => loadingScreen.style.display = 'none', 500);
        }
    }

    debounce(func, wait) { let timeout; return (...args) => { clearTimeout(timeout); timeout = setTimeout(() => func.apply(this, args), wait); }; }
    
    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        if (!toast) return;
        toast.textContent = message;
        toast.className = `fixed bottom-4 right-4 glass-effect text-text-primary px-6 py-4 rounded-lg shadow-lg z-50 animate-slide-up`;
        
        const typeColors = {
            success: 'border-green-500/50',
            error: 'border-red-500/50',
            info: 'border-blue-500/50'
        };
        toast.classList.add(typeColors[type] || typeColors.info, 'border-t-4');

        toast.classList.remove('hidden');
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);
    }

    async trackPageView() {
        try {
            await fetch(`${this.getApiUrl()}/api/track/view`, { method: 'POST' });
        } catch (error) {
            console.error('Page view tracking failed:', error);
        }
    }

    async openProductModal(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        const modal = document.getElementById('product-modal');
        const content = document.getElementById('product-modal-content');
        if (!modal || !content) return;

        const isFavorite = this.favorites.includes(product.id);

        content.innerHTML = `
            <div class="relative">
                <button class="close-modal absolute top-4 right-4 p-2 rounded-full glass-effect text-text-secondary hover:text-primary z-10">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
                    <div>
                        <img src="${product.imageUrl || 'https://placehold.co/600x600'}" alt="${product.name}" class="w-full h-auto object-cover rounded-2xl shadow-lg">
                    </div>
                    <div class="flex flex-col">
                        <h2 class="text-3xl font-display font-bold gradient-text mb-4">${product.name}</h2>
                        <p class="text-text-secondary leading-relaxed mb-6 flex-grow">${product.description}</p>
                        <div class="flex items-center space-x-4 mb-6">
                            ${(product.tags || []).map(tag => `<span class="px-3 py-1 text-sm rounded-full glass-effect border border-primary/30 text-primary">${tag}</span>`).join('')}
                        </div>
                        <div class="flex items-center justify-between mb-8">
                            <span class="text-4xl font-bold gradient-text font-display">R$ ${product.price.toFixed(2)}</span>
                        </div>
                        <div class="flex space-x-4">
                            <button class="btn-primary flex-1 py-4 font-bold rounded-2xl text-lg" onclick="app.addToCart('${product.id}'); app.closeAllModals(); app.openCartModal();">Adicionar ao Carrinho</button>
                            <button class="p-4 rounded-2xl glass-effect border border-primary/30 ${isFavorite ? 'text-red-500' : 'text-text-secondary'}" onclick="app.toggleFavorite('${product.id}'); app.openProductModal('${product.id}');">
                                <svg class="w-6 h-6" fill="${isFavorite ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
                            </button>
                        </div>
                        <button class="mt-4 w-full py-3 font-semibold rounded-2xl text-green-400 border-2 border-green-400/50 hover:bg-green-400 hover:text-black transition-all" onclick="app.orderViaWhatsApp('${product.id}')">Pedir via WhatsApp</button>
                    </div>
                </div>
            </div>
        `;
        modal.classList.remove('hidden');
        this.updateProductViews(productId);
    }

    orderViaWhatsApp(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;
        const message = `Olá, ${this.settings.siteName}! Tenho interesse no produto: *${product.name}* (R$ ${product.price.toFixed(2)}). Poderia me dar mais informações?`;
        const whatsappUrl = `https://wa.me/${this.settings.whatsapp}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    }

    async updateProductViews(productId) {
        try {
            await fetch(`${this.getApiUrl()}/api/products/${productId}/view`, { method: 'POST' });
            const product = this.products.find(p => p.id === productId);
            if (product) product.views = (product.views || 0) + 1;
        } catch (error) {
            console.error('Failed to update product views:', error);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new FloralCatalogApp();
    window.app.init();
});