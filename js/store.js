// Store.js - Lógica principal de la tienda con paginación

let allProducts = [];
let filteredProducts = [];
let currentPage = 0;
const ITEMS_PER_PAGE = 20;
let storeAvailability = getOnlineStoreConfig();

// Inicializar la tienda
document.addEventListener('DOMContentLoaded', async () => {
    await loadOnlineStoreConfig();
    storeAvailability = getOnlineStoreConfig();
    await loadProducts();
    setupEventListeners();
    updateCartCount();
    updateStoreAvailabilityUI();

    document.addEventListener('onlineStoreConfigChanged', (event) => {
        storeAvailability = event.detail.config;
        updateStoreAvailabilityUI();
        displayPage();
    });
});

// Cargar productos desde Firebase
async function loadProducts() {
    try {
        const snapshot = await db.collection('products').get();
        allProducts = [];
        
        snapshot.forEach(doc => {
            const product = {
                id: doc.id,
                ...doc.data()
            };
            product.image = getProductImage(product);
            allProducts.push(product);
        });

        filteredProducts = [...allProducts];
        currentPage = 0;
        
        // Llenar categorías
        populateCategories();
        
        // Mostrar primera página
        displayPage();
        updateStoreAvailabilityUI();
        
        
        // Ocultar spinner
        document.getElementById('loadingSpinner').style.display = 'none';
        
    } catch (error) {
        console.error('Error cargando productos:', error);
        document.getElementById('loadingSpinner').innerHTML = 
            '<div class="alert alert-danger">Error cargando productos</div>';
    }
}

// Poblar dropdown de categorías
function populateCategories() {
    const categories = new Set();
    allProducts.forEach(product => {
        if (product.category) {
            categories.add(product.category);
        }
    });

    const categoryFilter = document.getElementById('categoryFilter');
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
    });
}

// Mostrar página actual con paginación
function displayPage() {
    const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
    if (currentPage < 0) currentPage = 0;
    if (currentPage > totalPages - 1) currentPage = totalPages - 1;

    const start = currentPage * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const pageProducts = filteredProducts.slice(start, end);
    
    displayProducts(pageProducts);
    
    // Mostrar/ocultar botones de paginación
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');

    if (prevBtn) {
        prevBtn.style.display = filteredProducts.length > 0 && currentPage > 0 ? 'inline-block' : 'none';
    }

    if (nextBtn) {
        nextBtn.style.display = end < filteredProducts.length ? 'inline-block' : 'none';
    }
    
    // Mostrar info de paginación
    const pageInfo = document.getElementById('pageInfo');
    if (pageInfo) {
        if (filteredProducts.length > 0) {
            pageInfo.textContent = `Mostrando ${start + 1}-${Math.min(end, filteredProducts.length)} de ${filteredProducts.length} productos | Página ${currentPage + 1} de ${totalPages}`;
        } else {
            pageInfo.textContent = 'No hay productos para mostrar';
        }
    }
}

// Mostrar productos en la grilla
function displayProducts(products) {
    const container = document.getElementById('productsContainer');
    
    if (filteredProducts.length === 0) {
        container.innerHTML = '';
        document.getElementById('noProducts').style.display = 'block';
        return;
    }

    document.getElementById('noProducts').style.display = 'none';
    container.innerHTML = products.map(product => `
        <div class="col-6 col-md-4 col-lg-3">
            <div class="product-card" onclick="viewProductDetail('${product.id}')">
                <div class="product-image ${!product.image ? 'no-image' : ''}">
                    ${product.image 
                        ? `<img src="${product.image}" alt="${product.name}">` 
                        : '<i class="fas fa-box"></i>'
                    }
                </div>
                <div class="product-info">
                    <h5 class="product-name">${product.name || 'Producto sin nombre'}</h5>
                    <p class="product-sku">SKU: ${product.sku || 'N/A'}</p>
                    <div class="product-price">$${(product.price || 0).toFixed(2)}</div>
                    <p class="product-stock ${getStockClass(product.stock)}">
                        ${getStockText(product.stock)}
                    </p>
                    <div class="product-actions">
                        <button class="btn-add-cart" 
                                onclick="addToCart(event, '${product.id}')"
                                ${product.stock <= 0 || !isStoreEnabled() ? 'disabled' : ''}>
                            <i class="fas fa-shopping-cart"></i> Agregar
                        </button>
                        <button class="btn-view-detail" 
                                onclick="viewProductDetail('${product.id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Obtener clase de stock
function getStockClass(stock) {
    if (stock <= 0) return 'out-of-stock';
    if (stock <= 5) return 'low-stock';
    return 'in-stock';
}

// Obtener texto de stock
function getStockText(stock) {
    if (stock <= 0) return '❌ Agotado';
    if (stock <= 5) return `⚠️ Solo ${stock} disponibles`;
    return `✅ ${stock} en stock`;
}

// Ver detalle del producto
function viewProductDetail(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;

    const modal = document.getElementById('productModal');
    document.getElementById('modalTitle').textContent = product.name;
    
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <div class="detail-image ${!product.image ? 'bg-light d-flex align-items-center justify-content-center' : ''}">
                    ${product.image 
                        ? `<img src="${product.image}" alt="${product.name}" style="max-width: 100%; height: auto;">` 
                        : '<i class="fas fa-box fa-5x text-muted"></i>'
                    }
                </div>
            </div>
            <div class="col-md-6 detail-info">
                <h2>${product.name}</h2>
                <div class="detail-price">$${(product.price || 0).toFixed(2)}</div>
                
                <div class="detail-stock">
                    <p class="${getStockClass(product.stock)}">
                        ${getStockText(product.stock)}
                    </p>
                    <p><strong>SKU:</strong> ${product.sku || 'N/A'}</p>
                    ${product.category ? `<p><strong>Categoría:</strong> ${product.category}</p>` : ''}
                    ${product.description ? `<p><strong>Descripción:</strong> ${product.description}</p>` : ''}
                </div>

                <div class="detail-actions">
                    <button class="btn-primary" 
                            onclick="addToCart(null, '${product.id}')"
                            ${product.stock <= 0 || !isStoreEnabled() ? 'disabled' : ''}>
                        <i class="fas fa-shopping-cart"></i> Agregar al Carrito
                    </button>
                    <button class="btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                </div>
            </div>
        </div>
    `;

    new bootstrap.Modal(modal).show();
}

function getProductImage(product) {
    const image = product?.image || product?.imageUrl || product?.photo || '';
    return typeof image === 'string' ? image.trim() : '';
}

// Agregar al carrito
function addToCart(event, productId) {
    if (event) {
        event.stopPropagation();
    }

    if (!isStoreEnabled()) {
        showNotification('La tienda está temporalmente cerrada. No se pueden agregar productos.');
        return;
    }

    const product = allProducts.find(p => p.id === productId);
    if (!product || product.stock <= 0) return;

    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // Buscar si el producto ya está en el carrito
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: productId,
            name: product.name,
            price: product.price,
            image: product.image,
            sku: product.sku,
            stock: product.stock,
            quantity: 1
        });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    
    // Mostrar notificación
    showNotification(`${product.name} agregado al carrito`);
}

// Mostrar notificación
function showNotification(message) {
    const toast = document.createElement('div');
    toast.className = 'position-fixed bottom-0 end-0 p-3';
    toast.style.zIndex = '1050';
    toast.innerHTML = `
        <div class="alert alert-success alert-dismissible fade show mb-0" role="alert">
            <i class="fas fa-check-circle me-2"></i>${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Actualizar contador de carrito
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    const cartCountBadge = document.getElementById('cartCount');
    if (cartCountBadge) {
        cartCountBadge.textContent = count;
        cartCountBadge.style.display = count > 0 ? 'block' : 'none';
    }
}

function updateStoreAvailabilityUI() {
    const closedBanner = document.getElementById('storeClosedBanner');
    const storePageContent = document.getElementById('storePageContent');
    if (!closedBanner || !storePageContent) return;

    if (isStoreEnabled()) {
        closedBanner.classList.add('d-none');
        storePageContent.classList.remove('d-none');
        return;
    }

    closedBanner.textContent = 'La tienda online está temporalmente bloqueada.';
    closedBanner.classList.remove('d-none');
    storePageContent.classList.add('d-none');
}

// Cargar siguiente página
function loadNextPage() {
    const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
    if (currentPage < totalPages - 1) {
        currentPage++;
    }
    displayPage();
    // Scroll hacia arriba
    document.querySelector('.store-container').scrollIntoView({ behavior: 'smooth' });
}

// Cargar página anterior
function loadPrevPage() {
    if (currentPage > 0) {
        currentPage--;
    }
    displayPage();
    // Scroll hacia arriba
    document.querySelector('.store-container').scrollIntoView({ behavior: 'smooth' });
}

// Configurar event listeners
function setupEventListeners() {
    // Búsqueda
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', filterProducts);
    }

    // Categoría
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterProducts);
    }

    // Ordenamiento
    const sortFilter = document.getElementById('sortFilter');
    if (sortFilter) {
        sortFilter.addEventListener('change', filterProducts);
    }

    // Botón siguiente página
    const nextBtn = document.getElementById('nextPageBtn');
    if (nextBtn) {
        nextBtn.addEventListener('click', loadNextPage);
    }

    // Botón página anterior
    const prevBtn = document.getElementById('prevPageBtn');
    if (prevBtn) {
        prevBtn.addEventListener('click', loadPrevPage);
    }
}

// Filtrar productos
function filterProducts() {
    const search = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const category = document.getElementById('categoryFilter')?.value || '';
    const sort = document.getElementById('sortFilter')?.value || 'name-asc';

    // Filtrar
    filteredProducts = allProducts.filter(product => {
        const matchSearch = 
            product.name?.toLowerCase().includes(search) ||
            product.sku?.toLowerCase().includes(search) ||
            product.category?.toLowerCase().includes(search);
        
        const matchCategory = !category || product.category === category;
        
        return matchSearch && matchCategory;
    });

    // Ordenar
    if (sort === 'name-asc') {
        filteredProducts.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (sort === 'name-desc') {
        filteredProducts.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
    } else if (sort === 'price-asc') {
        filteredProducts.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sort === 'price-desc') {
        filteredProducts.sort((a, b) => (b.price || 0) - (a.price || 0));
    }

    // Volver a página 1
    currentPage = 0;
    displayPage();
}
