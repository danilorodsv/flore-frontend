// Florê - Premium Digital Catalog JavaScript (Versão Corrigida e Estruturada)
class FloralCatalogApp {
    
    constructor() {
        this.products = [];
        this.categories = [];
        this.cart = JSON.parse(localStorage.getItem('flore_cart')) || [];
        this.favorites = JSON.parse(localStorage.getItem('flore_favorites')) || [];
        this.currentFilter = 'all';
        this.searchQuery = '';
        this.currentPage = 1;
        this.productsPerPage = 12;
        this.isLoading = false;
        this.settings = {};
    }

    async init() {
        try {
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("O servidor demorou para responder.")), 20000)
            );
            
            await Promise.race([
                Promise.all([this.loadSettings(), this.loadCategories(), this.loadProducts()]),
                timeoutPromise
            ]);
            
            this.renderCategoryFilters(); // Movido para depois do carregamento de dados
            this.setupEventListeners();
            this.updateCartCount();
            this.updateFavoritesCount();
            
        } catch (error) {
            console.error('Initialization error:', error);
            this.showToast('Erro ao carregar dados. Mostrando exemplos.', 'error');
            this.loadSampleDataAsFallback();
            this.renderCategoryFilters(); // Renderiza filtros de exemplo também
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
            // Substitua pelo URL do seu backend na Render
            return 'https://flore-backend.onrender.com';
        }
    }

    getSampleProducts() {
        return [
            { id: '1', name: 'Buquê de Rosas (Exemplo)', description: 'Elegante buquê com 12 rosas vermelhas frescas.', price: 89.90, category: 'buques', imageUrl: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=400&h=300&fit=crop', tags: ['romântico'] }
        ];
    }

    getSampleCategories() {
        return [{ id: 'buques', name: 'Buquês' }];
    }
    
    getDefaultSettings() {
        return {
            siteName: 'Florê', siteTagline: 'PREMIUM COLLECTION', heroTitle: 'Flores que encantam',
            heroSubtitle: 'Arranjos feitos à mão com as flores mais frescas.',
            whatsapp: '5500000000000', address: 'Seu Endereço Aqui', hours: 'Seg - Sex: 08:00 às 18:00',
        };
    }

    applySettings() {
        const settings = this.settings;
        const setText = (id, text) => {
            const el = document.getElementById(id);
            if (el && text) el.innerHTML = text;
        };
        
        document.title = `${settings.siteName || 'Florê'} - Catálogo Digital`;
        setText('site-name', settings.siteName);
        setText('footer-site-name', settings.siteName);
        setText('site-tagline', settings.siteTagline);
        setText('hero-title', settings.heroTitle);
        setText('hero-subtitle', settings.heroSubtitle);
        setText('contact-address', settings.address);
        setText('contact-hours', settings.hours);
    }

    renderCategoryFilters() {
        const container = document.getElementById('category-filters');
        if (!container) return;

        let filtersHTML = `<button class="filter-btn px-4 py-2 rounded-full text-sm font-semibold transition-colors bg-primary text-background" data-filter="all">Todos</button>`;
        
        this.categories.forEach(cat => {
            filtersHTML += `<button class="filter-btn px-4 py-2 rounded-full text-sm font-semibold transition-colors bg-surface text-text-secondary hover:bg-primary/20 hover:text-primary" data-filter="${cat.id}">${cat.name}</button>`;
        });

        container.innerHTML = filtersHTML;
        // Re-aplica os event listeners após renderizar os botões
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.setFilter(e.target.dataset.filter));
        });
    }

    setupEventListeners() {
        document.getElementById('search-input')?.addEventListener('input', this.debounce(this.handleSearch.bind(this), 300));
        document.getElementById('cart-button')?.addEventListener('click', () => this.openCartModal());
        document.getElementById('favorites-button')?.addEventListener('click', () => this.openFavoritesModal());
        document.getElementById('whatsapp-direct')?.addEventListener('click', () => this.openWhatsAppDirect());
        document.getElementById('load-more')?.addEventListener('click', () => this.loadMoreProducts());
        
        document.addEventListener('click', (e) => {
            if (e.target.closest('.close-modal')) {
                this.closeAllModals();
            }
        });

        const checkoutForm = document.getElementById('checkout-form');
        if (checkoutForm) {
            checkoutForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.processCheckout();
            });
        }
        
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
        
        card.className = 'product-card card-border-gradient rounded-2xl overflow-hidden transition-all duration-300 animate-slide-up';
        card.innerHTML = `
            <div class="relative">
                <img src="${product.imageUrl || 'https://placehold.co/400x300/2A2A2A/C4A484'}" alt="${product.name}" class="w-full h-56 object-cover">
                <button class="favorite-btn absolute top-4 right-4 p-2 rounded-full bg-surface/70 backdrop-blur-sm text-text-secondary hover:text-red-500 transition-colors" data-product-id="${product.id}">
                    <svg class="w-5 h-5" fill="${isFavorite ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24" style="${isFavorite ? 'color: #ef4444;' : ''}"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
                </button>
            </div>
            <div class="p-5">
                <h3 class="text-lg font-semibold text-text-primary mb-2 truncate">${product.name}</h3>
                <p class="text-text-secondary text-sm line-clamp-2 h-10 mb-4">${product.description}</p>
                <div class="flex items-center justify-between">
                    <span class="text-2xl font-bold gradient-text">R$ ${product.price.toFixed(2)}</span>
                    <button class="add-to-cart-btn btn-primary py-2 px-4 font-bold rounded-full" data-product-id="${product.id}">
                        Adicionar
                    </button>
                </div>
            </div>`;

        card.addEventListener('click', () => this.openProductModal(product.id));
        card.querySelector('.favorite-btn').addEventListener('click', (e) => { e.stopPropagation(); this.toggleFavorite(product.id); });
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
        const modal = document.getElementById('cart-modal');
        if (!modal.innerHTML.trim()) {
            modal.innerHTML = `
                <div class="bg-surface rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
                    <div class="p-8">
                        <div class="flex justify-between items-center mb-6">
                            <h3 class="text-2xl font-display font-bold gradient-text">Seu Carrinho</h3>
                            <button class="close-modal text-text-secondary hover:text-primary text-3xl">&times;</button>
                        </div>
                        <div id="cart-items" class="space-y-4 mb-6"></div>
                        <div class="border-t border-primary/20 pt-6">
                            <div class="flex justify-between items-center mb-6">
                                <span class="text-xl font-semibold text-primary">Total:</span>
                                <span id="cart-total" class="text-2xl font-bold gradient-text">R$ 0,00</span>
                            </div>
                            <button id="checkout-btn" class="btn-primary w-full py-4 font-bold rounded-2xl text-lg">Finalizar Pedido</button>
                        </div>
                    </div>
                </div>`;
        }
        this.renderCartItems();
        modal.classList.remove('hidden');
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
            <div class="flex items-center justify-between p-2 bg-background/50 rounded-lg">
                <img src="${item.imageUrl || 'https://placehold.co/80x80'}" class="w-16 h-16 rounded-lg object-cover">
                <div class="flex-1 ml-4">
                    <p class="font-semibold text-primary">${item.name}</p>
                    <p class="text-sm text-text-secondary">R$ ${item.price.toFixed(2)}</p>
                </div>
                <div class="flex items-center space-x-2">
                    <button class="p-1 rounded-full bg-surface" onclick="app.updateCartQuantity('${item.id}', ${item.quantity - 1})">-</button>
                    <span class="w-8 text-center font-bold">${item.quantity}</span>
                    <button class="p-1 rounded-full bg-surface" onclick="app.updateCartQuantity('${item.id}', ${item.quantity + 1})">+</button>
                </div>
                <button onclick="app.removeFromCart('${item.id}')" class="ml-4 text-red-500 hover:text-red-400 text-2xl">&times;</button>
            </div>`).join('');
        totalElement.textContent = `R$ ${this.getCartTotal().toFixed(2)}`;
    }
    
    // --- INÍCIO DA CORREÇÃO ---

    openFavoritesModal() {
        const modal = document.getElementById('favorites-modal');
        if (!modal) return;

        // Adiciona o HTML do modal apenas se ele não existir
        if (!modal.innerHTML.trim()) {
            modal.innerHTML = `
                <div class="bg-surface rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
                    <div class="p-8">
                        <div class="flex justify-between items-center mb-6">
                            <h3 class="text-2xl font-display font-bold gradient-text">Seus Favoritos</h3>
                            <button class="close-modal text-text-secondary hover:text-primary text-3xl">&times;</button>
                        </div>
                        <div id="favorites-items" class="space-y-4">
                            <!-- Itens favoritos serão renderizados aqui -->
                        </div>
                    </div>
                </div>`;
        }

        this.renderFavoritesItems(); // Renderiza os itens
        modal.classList.remove('hidden'); // Mostra o modal
    }

    renderFavoritesItems() {
        const container = document.getElementById('favorites-items');
        if (!container) return;

        if (this.favorites.length === 0) {
            container.innerHTML = '<p class="text-text-secondary text-center py-8">Você ainda não favoritou nenhum produto.</p>';
            return;
        }

        const favoriteProducts = this.products.filter(p => this.favorites.includes(p.id));

        container.innerHTML = favoriteProducts.map(item => `
            <div class="flex items-center justify-between p-2 bg-background/50 rounded-lg">
                <img src="${item.imageUrl || 'https://placehold.co/80x80'}" alt="${item.name}" class="w-16 h-16 rounded-lg object-cover">
                <div class="flex-1 ml-4">
                    <p class="font-semibold text-primary">${item.name}</p>
                    <p class="text-sm text-text-secondary">R$ ${item.price.toFixed(2)}</p>
                </div>
                <div class="flex items-center space-x-2">
                    <button class="p-2 rounded-full bg-surface hover:bg-primary/20" 
                            title="Adicionar ao Carrinho"
                            onclick="app.addToCart('${item.id}'); app.closeAllModals(); app.openCartModal();">
                        <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                    </button>
                    <button class="p-2 rounded-full text-red-500 hover:bg-red-500/10" 
                            title="Remover dos Favoritos"
                            onclick="app.toggleFavorite('${item.id}');">
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd" /></svg>
                    </button>
                </div>
            </div>
        `).join('');
    }

    // --- FIM DA CORREÇÃO ---

    openCheckoutModal() {
        if (this.cart.length === 0) {
            this.showToast('Seu carrinho está vazio.', 'error');
            return;
        }
        const modal = document.getElementById('checkout-modal');
        if (!modal.innerHTML.trim()) {
            modal.innerHTML = `
            <div class="bg-surface rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
                <div class="p-8">
                    <div class="flex justify-between items-center">
                        <h3 class="text-2xl font-display font-bold gradient-text mb-6">Finalizar Pedido</h3>
                        <button class="close-modal text-text-secondary hover:text-primary text-3xl">&times;</button>
                    </div>
                    <form id="checkout-form" class="space-y-6">
                        <div><label class="block text-text-secondary mb-2">Nome *</label><input type="text" name="customer_name" required class="w-full bg-background text-text-primary px-4 py-3 rounded-lg border border-primary/30 focus:border-primary focus:outline-none"></div>
                        <div><label class="block text-text-secondary mb-2">WhatsApp *</label><input type="tel" name="customer_phone" required class="w-full bg-background text-text-primary px-4 py-3 rounded-lg border border-primary/30 focus:border-primary focus:outline-none"></div>
                        <div class="border-t border-primary/20 pt-6">
                            <div class="flex justify-between items-center mb-6"><span class="text-xl font-semibold text-primary">Total:</span><span id="checkout-total" class="text-2xl font-bold gradient-text">R$ 0,00</span></div>
                            <button type="submit" class="btn-primary w-full py-4 font-bold rounded-2xl text-lg">Enviar Pedido via WhatsApp</button>
                        </div>
                    </form>
                </div>
            </div>`;
        }
        document.getElementById('checkout-total').textContent = `R$ ${this.getCartTotal().toFixed(2)}`;
        this.closeAllModals();
        modal.classList.remove('hidden');
    }

    processCheckout() {
        const form = document.getElementById('checkout-form');
        const formData = new FormData(form);
        const customerName = formData.get('customer_name');
        const customerPhone = formData.get('customer_phone');

        if (!customerName || !customerPhone) {
            this.showToast('Por favor, preencha Nome e WhatsApp.', 'error');
            return;
        }

        let message = `Olá, ${this.settings.siteName}! Gostaria de fazer um pedido:\n\n`;
        this.cart.forEach(item => {
            message += `*${item.quantity}x* ${item.name} - R$ ${(item.price * item.quantity).toFixed(2)}\n`;
        });
        message += `\n*Total: R$ ${this.getCartTotal().toFixed(2)}*\n\n`;
        message += `*Meus Dados:*\nNome: ${customerName}\nWhatsApp: ${customerPhone}\n`;
        
        const whatsappUrl = `https://wa.me/${this.settings.whatsapp}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');

        this.cart = [];
        this.saveCart();
        this.updateCartCount();
        this.closeAllModals();
        this.showToast('Pedido enviado para o WhatsApp!', 'success');
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
            const isSelected = btn.dataset.filter === filter;
            btn.classList.toggle('bg-primary', isSelected);
            btn.classList.toggle('text-background', isSelected);
            btn.classList.toggle('bg-surface', !isSelected);
            btn.classList.toggle('text-text-secondary', !isSelected);
        });
    }

    handleSearch(e) { this.searchQuery = e.target.value; this.currentPage = 1; this.renderProducts(); }
    
    loadMoreProducts() {
        if (this.isLoading) return;
        this.isLoading = true;
        this.currentPage++;
        this.renderProducts();
        this.isLoading = false;
    }
    
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
        toast.className = `fixed bottom-24 right-4 bg-surface text-text-primary px-6 py-4 rounded-lg shadow-lg z-50 animate-slide-up border-t-4`;
        
        const typeColors = { success: 'border-green-500/50', error: 'border-red-500/50', info: 'border-blue-500/50' };
        toast.classList.add(typeColors[type] || typeColors.info);

        toast.classList.remove('hidden');
        setTimeout(() => { toast.classList.add('hidden'); }, 3000);
    }

    async openProductModal(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        const modal = document.getElementById('product-modal');
        const isFavorite = this.favorites.includes(product.id);

        modal.innerHTML = `
            <div class="bg-surface rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-scale-in relative">
                <button class="close-modal absolute top-4 right-4 p-2 rounded-full bg-background/50 text-text-secondary hover:text-primary z-10">&times;</button>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
                    <div><img src="${product.imageUrl || 'https://placehold.co/600x600'}" alt="${product.name}" class="w-full h-auto object-cover rounded-2xl shadow-lg"></div>
                    <div class="flex flex-col">
                        <h2 class="text-3xl font-display font-bold gradient-text mb-4">${product.name}</h2>
                        <p class="text-text-secondary leading-relaxed mb-6 flex-grow">${product.description}</p>
                        <div class="flex items-center space-x-2 mb-6">
                            ${(product.tags || []).map(tag => `<span class="px-3 py-1 text-xs rounded-full bg-background border border-primary/30 text-primary">${tag}</span>`).join('')}
                        </div>
                        <div class="flex items-center justify-between mb-8">
                            <span class="text-4xl font-bold gradient-text font-display">R$ ${product.price.toFixed(2)}</span>
                        </div>
                        <div class="flex space-x-4">
                            <button class="btn-primary flex-1 py-4 font-bold rounded-2xl text-lg" onclick="app.addToCart('${product.id}'); app.closeAllModals(); app.openCartModal();">Adicionar ao Carrinho</button>
                            <button class="p-4 rounded-2xl bg-background border border-primary/30 ${isFavorite ? 'text-red-500' : 'text-text-secondary'}" onclick="app.toggleFavorite('${product.id}'); app.openProductModal('${product.id}');">
                                <svg class="w-6 h-6" fill="${isFavorite ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>`;
        modal.classList.remove('hidden');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new FloralCatalogApp();
    window.app.init();
});