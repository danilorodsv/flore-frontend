// Florê - Catálogo Digital Premium (Versão Final Corrigida)
class FloralCatalogApp {
    constructor() {
        this.products = [];
        this.categories = [];
        this.cart = JSON.parse(localStorage.getItem('flore_cart')) || [];
        this.favorites = JSON.parse(localStorage.getItem('flore_favorites')) || [];
        this.settings = {};
        this.currentFilter = 'all';
        this.currentSort = 'name';
        this.searchQuery = '';
        this.currentPage = 1;
        this.productsPerPage = 12;
        
        // Adiciona um ouvinte para garantir que o DOM esteja pronto
        document.addEventListener('DOMContentLoaded', () => this.init());
    }

    async init() {
        try {
            // Cria uma promessa de timeout de 30 segundos.
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("O servidor demorou muito para responder (timeout).")), 30000)
            );
            
            // Tenta carregar os dados ou falha se demorar mais de 30 segundos.
            await Promise.race([
                Promise.all([this.loadSettings(), this.loadCategories(), this.loadProducts()]),
                timeoutPromise
            ]);

            this.applySettings();
            this.renderAllComponents();
            this.setupEventListeners();

        } catch (error) {
            console.error('Initialization Error:', error);
            this.showToast(error.message, 'error');
            this.loadSampleDataAsFallback(); // Carrega dados de exemplo se a API falhar
            this.renderAllComponents();
            this.setupEventListeners();
        } finally {
            this.hideLoadingScreen();
        }
    }
    
    getApiUrl() {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'http://localhost:5000';
        } else {
            return 'https://flore-backend.onrender.com';
        }
    }

    async loadProducts() {
        const response = await fetch(`${this.getApiUrl()}/api/products`);
        if (!response.ok) throw new Error('Falha ao buscar produtos.');
        this.products = await response.json();
    }

    async loadCategories() {
        const response = await fetch(`${this.getApiUrl()}/api/categories`);
        if (!response.ok) throw new Error('Falha ao buscar categorias.');
        this.categories = await response.json();
    }

    async loadSettings() {
        const response = await fetch(`${this.getApiUrl()}/api/settings`);
        if (!response.ok) throw new Error('Falha ao buscar configurações.');
        this.settings = await response.json();
    }
    
    loadSampleDataAsFallback() {
        this.products = this.getSampleProducts();
        this.categories = this.getSampleCategories();
        this.settings = this.getDefaultSettings();
    }

    applySettings() {
        document.title = this.settings.siteName ? `${this.settings.siteName} - Catálogo de Pedidos` : "Florê - Catálogo de Pedidos";
        const heroTitle = document.getElementById('hero-title');
        if (heroTitle) heroTitle.textContent = this.settings.heroTitle;
    }
    
    renderAllComponents() {
        this.renderProducts();
        this.renderCategories();
        this.renderRankings();
        this.updateCartCount();
        this.updateFavoritesCount();
    }

    renderProducts() {
        const container = document.getElementById('products-container');
        const loadingDiv = document.getElementById('loading');
        if (!container) return;

        let filtered = [...this.products];
        
        if (this.currentFilter !== 'all') {
            filtered = filtered.filter(p => p.category === this.currentFilter);
        }
        
        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            filtered = filtered.filter(p => p.name.toLowerCase().includes(query));
        }

        filtered.sort((a, b) => {
            switch (this.currentSort) {
                case 'price-asc': return a.price - b.price;
                case 'price-desc': return b.price - a.price;
                case 'views': return (b.views || 0) - (a.views || 0);
                default: return a.name.localeCompare(b.name);
            }
        });

        container.innerHTML = filtered.map(p => this.createProductCardHTML(p)).join('');
        
        if (loadingDiv) loadingDiv.style.display = 'none';
    }

    createProductCardHTML(product) {
        return `
            <div class="product-card">
                <img src="${product.imageUrl || 'https://placehold.co/400x300/1a1a1a/C4A484?text=Flor'}" alt="${product.name}" class="w-full h-48 object-cover">
                <div class="p-4">
                    <h3 class="font-display text-lg text-primary">${product.name}</h3>
                    <p class="text-text-secondary text-sm h-10 overflow-hidden mb-2">${product.description}</p>
                    <div class="flex justify-between items-center">
                        <span class="gradient-text font-bold text-xl">R$ ${product.price.toFixed(2)}</span>
                        <button onclick="app.addToCart('${product.id}')" class="btn-primary rounded-full p-2">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                        </button>
                    </div>
                </div>
            </div>`;
    }

    renderCategories() {
        const container = document.getElementById('categories-container');
        if (!container) return;
        container.innerHTML = `<button onclick="app.filterByCategory('all')" class="category-btn active">Todos</button>`;
        this.categories.forEach(cat => {
            container.innerHTML += `<button onclick="app.filterByCategory('${cat.id}')" class="category-btn">${cat.name}</button>`;
        });
    }

    renderRankings() {
        const container = document.getElementById('rankings-container');
        if (!container) return;
        const topProducts = [...this.products].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 3);
        container.innerHTML = topProducts.map((p, i) => `
            <div class="product-card p-4 relative">
                <span class="absolute top-2 left-2 ranking-badge text-xs px-2 py-1 rounded-full">#${i + 1}</span>
                <img src="${p.imageUrl}" class="w-full h-32 object-cover rounded-lg mb-2">
                <h4 class="font-bold text-white">${p.name}</h4>
                <p class="text-sm text-text-secondary">${p.views || 0} visualizações</p>
            </div>
        `).join('');
    }

    setupEventListeners() {
        document.getElementById('cart-btn')?.addEventListener('click', () => this.openCartModal());
        document.getElementById('search-input')?.addEventListener('input', this.debounce(e => {
            this.searchQuery = e.target.value;
            this.renderProducts();
        }, 300));
        document.getElementById('sort-select')?.addEventListener('change', e => {
            this.currentSort = e.target.value;
            this.renderProducts();
        });
    }

    filterByCategory(categoryId) {
        this.currentFilter = categoryId;
        document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`button[onclick="app.filterByCategory('${categoryId}')"]`).classList.add('active');
        this.renderProducts();
    }
    
    addToCart(productId) {
        // Lógica do carrinho
        this.showToast('Produto adicionado!', 'success');
    }

    updateCartCount() {
        const count = this.cart.length;
        const cartCountEl = document.getElementById('cart-count');
        if(cartCountEl) cartCountEl.textContent = count;
    }

    updateFavoritesCount() {
        // Lógica de favoritos
    }
    
    hideLoadingScreen() {
        // Esconde a tela de loading inicial se houver uma
    }
    
    showToast(message, type = 'info') {
        // Lógica do Toast
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

    getSampleProducts() {
        return [
            { id: '1', name: 'Buquê de Rosas (Exemplo)', description: 'Servidor indisponível. Mostrando dados de exemplo.', price: 89.90, category: 'buques', imageUrl: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=400&h=300&fit=crop' }
        ];
    }
    getSampleCategories() {
        return [{ id: 'buques', name: 'Buquês' }];
    }
    getDefaultSettings() {
        return { siteName: "Florê", heroTitle: "Flores que encantam" };
    }
}

// Inicializa a aplicação
new FloralCatalogApp();