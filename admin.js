// Admin Panel JavaScript
class AdminPanel {
    constructor() {
        this.token = localStorage.getItem('flore_token');
        this.products = [];
        this.categories = [];
        this.orders = [];
        this.settings = {};
        this.currentProduct = null;
        this.currentCategory = null;
    }

    getApiUrl() {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'http://localhost:5000';
        }
        return 'https://flore-backend.onrender.com';
    }

    init() {
        this.setupEventListeners();
        this.checkAuth();
    }

    setupEventListeners() {
        document.getElementById('login-form')?.addEventListener('submit', (e) => { e.preventDefault(); this.handleLogin(); });
        document.getElementById('logout-btn')?.addEventListener('click', () => this.logout());
        document.querySelectorAll('.tab-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchTab(e.target.closest('.tab-link').dataset.tab);
            });
        });
        document.getElementById('add-product-btn')?.addEventListener('click', () => this.openProductModal());
        document.getElementById('add-category-btn')?.addEventListener('click', () => this.openCategoryModal());
        document.getElementById('product-form')?.addEventListener('submit', (e) => { e.preventDefault(); this.saveProduct(); });
        document.getElementById('category-form')?.addEventListener('submit', (e) => { e.preventDefault(); this.saveCategory(); });
        document.getElementById('settings-form')?.addEventListener('submit', (e) => { e.preventDefault(); this.saveSettings(); });
        document.querySelectorAll('.close-modal').forEach(btn => btn.addEventListener('click', () => this.closeAllModals()));
    }

    checkAuth() {
        if (this.token) {
            this.showAdminPanel();
        } else {
            document.getElementById('login-section').classList.remove('hidden');
            document.getElementById('admin-panel').classList.add('hidden');
        }
    }

    async handleLogin() {
        const password = document.getElementById('password').value;
        try {
            const response = await fetch(`${this.getApiUrl()}/api/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });
            if (!response.ok) throw new Error('Senha incorreta');
            const data = await response.json();
            this.token = data.token;
            localStorage.setItem('flore_token', this.token);
            this.showAdminPanel();
        } catch (error) {
            this.showToast(error.message, 'error');
        }
    }

    logout() {
        this.token = null;
        localStorage.removeItem('flore_token');
        this.checkAuth();
    }

    showAdminPanel() {
        document.getElementById('login-section').classList.add('hidden');
        document.getElementById('admin-panel').classList.remove('hidden');
        this.switchTab('dashboard');
    }

    switchTab(tabName) {
        document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
        document.getElementById(`${tabName}-tab`).classList.remove('hidden');
        document.querySelectorAll('.tab-link').forEach(link => {
            link.classList.toggle('bg-primary/20', link.dataset.tab === tabName);
            link.classList.toggle('text-primary', link.dataset.tab === tabName);
        });

        switch (tabName) {
            case 'dashboard': this.loadDashboard(); break;
            case 'products': this.loadProducts(); break;
            case 'categories': this.loadCategories(); break;
            case 'orders': this.loadOrders(); break;
            case 'settings': this.loadSettings(); break;
        }
    }

    async loadDashboard() {
        const data = await this.loadData('api/admin/analytics/dashboard');
        if (!data) return;
        document.getElementById('total-revenue').textContent = `R$ ${data.totalRevenue.toFixed(2)}`;
        document.getElementById('total-orders').textContent = data.totalOrders;
        document.getElementById('total-products').textContent = data.totalProducts;
        this.loadOrdersChart(data.ordersByStatus);
        this.loadPopularProducts(data.popularProducts);
        this.loadRecentOrdersTable(data.recentOrders);
    }

    loadOrdersChart(ordersByStatus) {
        const canvas = document.getElementById('orders-chart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        
        if (canvas.chart) {
            canvas.chart.destroy();
        }
        
        const labels = Object.keys(ordersByStatus);
        const data = Object.values(ordersByStatus);
        const colors = ['#C4A484', '#D4B494', '#B49474', '#A08464', '#907454'];

        canvas.chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels.map(label => this.translateStatus(label)),
                datasets: [{
                    data: data,
                    backgroundColor: colors.slice(0, labels.length),
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        labels: {
                            color: '#ffffff'
                        }
                    }
                }
            }
        });
    }

    loadPopularProducts(products) {
        const container = document.getElementById('popular-products');
        if (!container) return;
        container.innerHTML = '';

        products.forEach((product, index) => {
            const productDiv = document.createElement('div');
            productDiv.className = 'flex items-center justify-between p-3 bg-background/50 rounded-lg';
            productDiv.innerHTML = `
                <div class="flex items-center space-x-3">
                    <span class="text-primary font-bold">${index + 1}</span>
                    <div>
                        <p class="text-text-primary font-medium">${product.name}</p>
                        <p class="text-text-secondary text-sm">${product.views || 0} visualizações</p>
                    </div>
                </div>
                <span class="text-primary font-bold">R$ ${product.price.toFixed(2)}</span>
            `;
            container.appendChild(productDiv);
        });
    }

    loadRecentOrdersTable(orders) {
        const tbody = document.getElementById('recent-orders-table');
        if (!tbody) return;
        tbody.innerHTML = '';

        orders.forEach(order => {
            const row = document.createElement('tr');
            row.className = 'border-b border-primary/10 hover:bg-primary/5';
            row.innerHTML = `
                <td class="py-3 px-2 text-text-secondary">#${order.id.substring(0, 6)}</td>
                <td class="py-3 px-2 text-text-primary">${order.customer_name}</td>
                <td class="py-3 px-2 text-primary font-bold">R$ ${order.total.toFixed(2)}</td>
                <td class="py-3 px-2">
                    <span class="px-2 py-1 rounded-full text-xs ${this.getStatusColor(order.status)}">
                        ${this.translateStatus(order.status)}
                    </span>
                </td>
                <td class="py-3 px-2 text-text-secondary">${new Date(order.created_at).toLocaleDateString('pt-BR')}</td>
            `;
            tbody.appendChild(row);
        });
    }

    async loadData(endpoint) {
        try {
            const response = await fetch(`${this.getApiUrl()}/${endpoint}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('admin_token')}` }
            });
            const data = await response.json();
            if (response.ok) {
                return data;
            } else {
                this.handleAuthError(data);
                return null;
            }
        } catch (error) {
            console.error(`Error loading ${endpoint}:`, error);
            return null;
        }
    }

    async loadProducts() {
        this.products = await this.loadData('api/products') || [];
        this.renderProductsTable();
    }
    
    async loadOrders() {
        this.orders = await this.loadData('api/orders') || [];
        this.renderOrdersTable();
    }

    async loadCategories() {
        this.categories = await this.loadData('api/categories') || [];
        this.renderCategoriesGrid();
        this.updateCategorySelects();
    }

    async loadSettings() {
        this.settings = await this.loadData('api/settings') || {};
        this.populateSettingsForm();
        this.applyThemeColors(); // <-- ADICIONADO: Aplica as cores ao carregar
    }

    renderProductsTable() {
        const tbody = document.getElementById('products-table');
        if (!tbody) return;
        tbody.innerHTML = '';

        this.products.forEach(product => {
            const row = document.createElement('tr');
            row.className = 'border-b border-primary/10 hover:bg-primary/5';
            row.innerHTML = `
                <td class="py-4 px-6">
                    <div class="flex items-center space-x-3">
                        <img src="${product.imageUrl || 'https://placehold.co/40x40/1a1a1a/C4A484?text=?'}" 
                             alt="${product.name}" class="w-10 h-10 rounded-lg object-cover">
                        <span class="text-text-primary font-medium">${product.name}</span>
                    </div>
                </td>
                <td class="py-4 px-6 text-text-secondary">${product.category}</td>
                <td class="py-4 px-6 text-primary font-bold">R$ ${product.price.toFixed(2)}</td>
                <td class="py-4 px-6 text-text-secondary">${product.views || 0}</td>
                <td class="py-4 px-6">
                    <span class="px-2 py-1 rounded-full text-xs ${product.active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}">
                        ${product.active ? 'Ativo' : 'Inativo'}
                    </span>
                </td>
                <td class="py-4 px-6">
                    <div class="flex space-x-2">
                        <button onclick="adminPanel.editProduct('${product.id}')" 
                                class="text-primary hover:text-accent transition-colors">
                            Editar
                        </button>
                        <button onclick="adminPanel.deleteProduct('${product.id}')" 
                                class="text-red-400 hover:text-red-300 transition-colors">
                            Excluir
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    renderOrdersTable(filteredOrders = null) {
        const tbody = document.getElementById('orders-table');
        if (!tbody) return;
        tbody.innerHTML = '';

        const ordersToRender = filteredOrders || this.orders;

        ordersToRender.forEach(order => {
            const row = document.createElement('tr');
            row.className = 'border-b border-primary/10 hover:bg-primary/5';
            row.innerHTML = `
                <td class="py-4 px-6 text-text-secondary">#${order.id.substring(0, 6)}</td>
                <td class="py-4 px-6 text-text-primary">${order.customer_name}</td>
                <td class="py-4 px-6 text-text-secondary">${order.customer_phone || 'N/A'}</td>
                <td class="py-4 px-6 text-primary font-bold">R$ ${order.total.toFixed(2)}</td>
                <td class="py-4 px-6">
                    <select onchange="adminPanel.updateOrderStatus('${order.id}', this.value)" 
                            class="bg-surface border border-primary/30 text-text-primary px-2 py-1 rounded text-sm">
                        <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pendente</option>
                        <option value="confirmed" ${order.status === 'confirmed' ? 'selected' : ''}>Confirmado</option>
                        <option value="preparing" ${order.status === 'preparing' ? 'selected' : ''}>Preparando</option>
                        <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Entregue</option>
                        <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelado</option>
                    </select>
                </td>
                <td class="py-4 px-6 text-text-secondary">${new Date(order.created_at).toLocaleDateString('pt-BR')}</td>
                <td class="py-4 px-6">
                    <button onclick="adminPanel.viewOrder('${order.id}')" 
                            class="text-primary hover:text-accent transition-colors">
                        Ver Detalhes
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    renderCategoriesGrid() {
        const grid = document.getElementById('categories-grid');
        if (!grid) return;
        grid.innerHTML = '';

        this.categories.forEach(category => {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'bg-surface p-6 rounded-xl border border-primary/20';
            categoryDiv.innerHTML = `
                <div class="flex justify-between items-start mb-4">
                    <h4 class="text-lg font-semibold text-primary">${category.name}</h4>
                    <div class="flex space-x-2">
                        <button onclick="adminPanel.editCategory('${category.id}')" 
                                class="text-text-secondary hover:text-primary transition-colors">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                            </svg>
                        </button>
                        <button onclick="adminPanel.deleteCategory('${category.id}')" 
                                class="text-red-400 hover:text-red-300 transition-colors">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                            </svg>
                        </button>
                    </div>
                </div>
                <p class="text-text-secondary text-sm">${category.description || 'Sem descrição'}</p>
                <div class="mt-4 text-xs text-text-secondary">
                    ID: ${category.id}
                </div>
            `;
            grid.appendChild(categoryDiv);
        });
    }

    updateCategorySelects() {
        const select = document.getElementById('product-category');
        if (!select) return;
        select.innerHTML = '<option value="">Selecione uma categoria</option>';

        this.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            select.appendChild(option);
        });
    }

    populateSettingsForm() {
        const form = document.getElementById('settings-form');
        if (!form) return;
        const inputs = form.querySelectorAll('input, textarea');

        inputs.forEach(input => {
            // Usa o nome do input para encontrar a chave correspondente nas configurações
            const settingKey = input.name; 
            const value = this.settings[settingKey];
            if (value !== undefined) {
                input.value = value;
            }
        });
    }

    // --- INÍCIO DA NOVA FUNÇÃO ---
    /**
     * Aplica as cores do tema (carregadas das configurações) aos elementos da UI.
     */
    applyThemeColors() {
        const primaryColor = this.settings.primaryColor || '#C4A484'; // Cor padrão de fallback
        const buttons = document.querySelectorAll('.btn-primary');
        
        buttons.forEach(btn => {
            btn.style.backgroundColor = primaryColor;
            // Você pode adicionar lógica de contraste de texto aqui se necessário
        });
    }
    // --- FIM DA NOVA FUNÇÃO ---

    openProductModal(productId = null) {
        const modal = document.getElementById('product-modal');
        const title = document.getElementById('product-modal-title');
        const form = document.getElementById('product-form');

        if (productId) {
            const product = this.products.find(p => p.id === productId);
            if (product) {
                title.textContent = 'Editar Produto';
                this.populateProductForm(product);
            }
        } else {
            title.textContent = 'Adicionar Produto';
            form.reset();
            document.getElementById('product-id').value = '';
        }

        modal.classList.remove('hidden');
    }

    populateProductForm(product) {
        document.getElementById('product-id').value = product.id;
        document.getElementById('product-name').value = product.name;
        document.getElementById('product-price').value = product.price;
        document.getElementById('product-category').value = product.category;
        document.getElementById('product-image').value = product.imageUrl || '';
        document.getElementById('product-description').value = product.description || '';
        document.getElementById('product-tags').value = product.tags ? product.tags.join(', ') : '';
        document.getElementById('product-featured').checked = product.featured;
    }

    openCategoryModal(categoryId = null) {
        const modal = document.getElementById('category-modal');
        const title = document.getElementById('category-modal-title');
        const form = document.getElementById('category-form');

        if (categoryId) {
            const category = this.categories.find(c => c.id === categoryId);
            if (category) {
                title.textContent = 'Editar Categoria';
                this.populateCategoryForm(category);
            }
        } else {
            title.textContent = 'Adicionar Categoria';
            form.reset();
            document.getElementById('category-id').value = '';
        }

        modal.classList.remove('hidden');
    }

    populateCategoryForm(category) {
        document.getElementById('category-id').value = category.id;
        document.getElementById('category-slug').value = category.id;
        document.getElementById('category-name').value = category.name;
        document.getElementById('category-description').value = category.description || '';
    }

    closeModals() {
        document.querySelectorAll('.fixed').forEach(modal => {
            if (modal.id.includes('-modal')) {
                modal.classList.add('hidden');
            }
        });
    }

    async saveData(endpoint, data, method) {
        try {
            const response = await fetch(`${this.getApiUrl()}/${endpoint}`, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                return await response.json();
            } else {
                const error = await response.json();
                this.handleAuthError(error);
                this.showToast(error.error || `Erro ao salvar ${endpoint}`, 'error');
                return null;
            }
        } catch (error) {
            this.showToast(`Erro de rede ao salvar ${endpoint}`, 'error');
            return null;
        }
    }

    async saveProduct() {
        const productData = {
            id: document.getElementById('product-id').value || undefined,
            name: document.getElementById('product-name').value,
            price: parseFloat(document.getElementById('product-price').value),
            category: document.getElementById('product-category').value,
            imageUrl: document.getElementById('product-image').value,
            description: document.getElementById('product-description').value,
            tags: document.getElementById('product-tags').value.split(',').map(tag => tag.trim()).filter(tag => tag),
            featured: document.getElementById('product-featured').checked
        };

        const isEdit = !!productData.id;
        const endpoint = isEdit ? `api/products/${productData.id}` : 'api/products';
        const method = isEdit ? 'PUT' : 'POST';

        const result = await this.saveData(endpoint, productData, method);
        if (result) {
            this.showToast(isEdit ? 'Produto atualizado!' : 'Produto criado!', 'success');
            this.closeModals();
            this.loadProducts();
        }
    }

    async saveCategory() {
        const categoryData = {
            id: document.getElementById('category-slug').value,
            name: document.getElementById('category-name').value,
            description: document.getElementById('category-description').value
        };
        const originalId = document.getElementById('category-id').value;

        const result = await this.saveData('api/categories', { ...categoryData, originalId }, 'POST');
        if (result) {
            this.showToast('Categoria salva!', 'success');
            this.closeModals();
            this.loadCategories();
        }
    }

    async saveSettings() {
        const form = document.getElementById('settings-form');
        const formData = new FormData(form);
        const settings = Object.fromEntries(formData.entries());

        const result = await this.saveData('api/settings', settings, 'POST');
        if (result) {
            this.showToast('Configurações salvas!', 'success');
            this.settings = result.settings; // Atualiza as configurações locais
            this.applyThemeColors(); // <-- ADICIONADO: Aplica as novas cores imediatamente
        }
    }

    async deleteProduct(productId) {
        if (!confirm('Tem certeza que deseja excluir este produto?')) return;

        try {
            const response = await fetch(`${this.getApiUrl()}/api/products/${productId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('admin_token')}` }
            });

            if (response.ok) {
                this.showToast('Produto excluído!', 'success');
                this.loadProducts();
            } else {
                const error = await response.json();
                this.handleAuthError(error);
                this.showToast(error.error || 'Erro ao excluir produto', 'error');
            }
        } catch (error) {
            this.showToast('Erro de rede ao excluir', 'error');
        }
    }
    
    async deleteCategory(categoryId) {
        // Implementar no backend primeiro
        this.showToast('Função de deletar categoria não implementada.', 'info');
    }

    async updateOrderStatus(orderId, newStatus) {
        const result = await this.saveData(`api/orders/${orderId}`, { status: newStatus }, 'PUT');
        if (result) {
            this.showToast('Status do pedido atualizado!', 'success');
        }
    }

    viewOrder(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) return;

        const modal = document.getElementById('order-modal');
        const details = document.getElementById('order-details');

        details.innerHTML = `
            <div class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <h4 class="text-primary font-semibold mb-2">Cliente</h4>
                        <p><strong>Nome:</strong> ${order.customer_name}</p>
                        <p><strong>Telefone:</strong> ${order.customer_phone || 'N/A'}</p>
                    </div>
                    <div>
                        <h4 class="text-primary font-semibold mb-2">Pedido</h4>
                        <p><strong>ID:</strong> ${order.id.substring(0, 8)}</p>
                        <p><strong>Status:</strong> ${this.translateStatus(order.status)}</p>
                        <p><strong>Data:</strong> ${new Date(order.created_at).toLocaleString('pt-BR')}</p>
                        <p class="text-lg"><strong>Total:</strong> R$ ${order.total.toFixed(2)}</p>
                    </div>
                </div>
                
                <div>
                    <h4 class="text-primary font-semibold mb-2">Itens</h4>
                    <div class="space-y-2">
                        ${(order.items || []).map(item => `
                            <div class="flex justify-between p-2 bg-background/50 rounded">
                                <span>${item.quantity}x ${item.name}</span>
                                <span>R$ ${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                ${order.notes ? `
                    <div>
                        <h4 class="text-primary font-semibold mb-2">Observações</h4>
                        <p class="p-2 bg-background/50 rounded">${order.notes}</p>
                    </div>
                ` : ''}
            </div>
        `;

        modal.classList.remove('hidden');
    }

    filterOrders(status) {
        if (!status) {
            this.renderOrdersTable();
            return;
        }
        const filteredOrders = this.orders.filter(order => order.status === status);
        this.renderOrdersTable(filteredOrders);
    }
    
    editProduct(productId) { this.openProductModal(productId); }
    editCategory(categoryId) { this.openCategoryModal(categoryId); }

    translateStatus(status) {
        const translations = {
            'pending': 'Pendente', 'confirmed': 'Confirmado', 'preparing': 'Preparando',
            'delivered': 'Entregue', 'cancelled': 'Cancelado'
        };
        return translations[status] || status;
    }

    getStatusColor(status) {
        const colors = {
            'pending': 'bg-yellow-500/20 text-yellow-400',
            'confirmed': 'bg-blue-500/20 text-blue-400',
            'preparing': 'bg-orange-500/20 text-orange-400',
            'delivered': 'bg-green-500/20 text-green-400',
            'cancelled': 'bg-red-500/20 text-red-400'
        };
        return colors[status] || 'bg-gray-500/20 text-gray-400';
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
        if(toast) {
            toast.classList.remove('hidden');
            setTimeout(() => {
                toast.classList.add('hidden');
            }, 3000);
        }
    }

    handleAuthError(error) {
        // Se o token for inválido ou expirado, desloga o usuário
        if (error && (error.error === 'Token inválido' || error.error === 'Token expirado')) {
            this.showToast('Sessão expirada. Por favor, faça login novamente.', 'error');
            this.logout();
        }
    }
}

// Initialize admin panel
const adminPanel = new AdminPanel();
// Make it globally available for onclick handlers in HTML
window.adminPanel = adminPanel;