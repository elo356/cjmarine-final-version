// Cart.js - Lógica del carrito

document.addEventListener('DOMContentLoaded', () => {
    displayCart();
    setupCheckoutListener();
});

// Mostrar carrito
function displayCart() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const container = document.getElementById('cartItemsContainer');

    if (cart.length === 0) {
        container.style.display = 'none';
        document.getElementById('emptyCart').style.display = 'block';
        document.getElementById('checkoutBtn').disabled = true;
        return;
    }

    document.getElementById('emptyCart').style.display = 'none';
    container.style.display = 'block';

    container.innerHTML = cart.map((item, index) => `
        <div class="cart-item">
            <div class="cart-item-image ${!item.image ? 'bg-light d-flex align-items-center justify-content-center' : ''}">
                ${item.image 
                    ? `<img src="${item.image}" alt="${item.name}" style="width: 100%; height: 100%; object-fit: cover;">` 
                    : '<i class="fas fa-box fa-2x text-muted"></i>'
                }
            </div>
            <div class="cart-item-details">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">$${(item.price || 0).toFixed(2)}</div>
                
                <div class="cart-item-quantity">
                    <button class="btn-quantity" onclick="updateQuantity(${index}, -1)">−</button>
                    <input type="number" class="quantity-input" value="${item.quantity}" 
                           onchange="setQuantity(${index}, this.value)">
                    <button class="btn-quantity" onclick="updateQuantity(${index}, 1)">+</button>
                </div>

                <button class="btn-remove" onclick="removeFromCart(${index})">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </div>
            <div style="text-align: right; white-space: nowrap;">
                <div style="font-size: 1.2rem; font-weight: 600; color: var(--primary-color);">
                    $${((item.price || 0) * item.quantity).toFixed(2)}
                </div>
            </div>
        </div>
    `).join('');

    updateCartSummary();
}

// Actualizar cantidad
function updateQuantity(index, change) {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const newQuantity = Math.max(1, cart[index].quantity + change);
    
    if (newQuantity <= cart[index].stock) {
        cart[index].quantity = newQuantity;
        localStorage.setItem('cart', JSON.stringify(cart));
        displayCart();
    }
}

// Establecer cantidad
function setQuantity(index, quantity) {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const num = Math.max(1, parseInt(quantity) || 1);
    
    if (num <= cart[index].stock) {
        cart[index].quantity = num;
        localStorage.setItem('cart', JSON.stringify(cart));
        displayCart();
    }
}

// Eliminar del carrito
function removeFromCart(index) {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    displayCart();
    updateCartCount();
}

// Actualizar resumen del carrito
function updateCartSummary() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    const subtotal = cart.reduce((sum, item) => sum + ((item.price || 0) * item.quantity), 0);
    const taxes = subtotal * 0.115; // 11.5% impuestos
    const total = subtotal + taxes;

    document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('taxes').textContent = `$${taxes.toFixed(2)}`;
    document.getElementById('total').textContent = `$${total.toFixed(2)}`;
}

// Configurar checkout
function setupCheckoutListener() {
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            const cart = JSON.parse(localStorage.getItem('cart')) || [];
            if (cart.length > 0) {
                proceedToCheckout(cart);
            }
        });
    }
}

// Proceder a checkout
async function proceedToCheckout(cart) {
    try {
        // Mostrar modal de información de contacto
        const contactInfo = prompt('Por favor, ingresa tu correo electrónico:');
        if (!contactInfo) return;

        const phone = prompt('Ingresa tu número de teléfono:');
        if (!phone) return;

        // Calcular totales
        const subtotal = cart.reduce((sum, item) => sum + ((item.price || 0) * item.quantity), 0);
        const taxes = subtotal * 0.115;
        const total = subtotal + taxes;

        // Crear orden
        const order = {
            items: cart,
            email: contactInfo,
            phone: phone,
            subtotal: subtotal,
            taxes: taxes,
            total: total,
            createdAt: new Date().toISOString(),
            status: 'pending'
        };

        // Guardar en Firebase
        const docRef = await db.collection('orders').add(order);
        
        // Limpiar carrito
        localStorage.removeItem('cart');
        
        // Mostrar confirmación
        alert(`¡Orden creada exitosamente!\n\nNúmero de orden: ${docRef.id}\n\nTotal: $${total.toFixed(2)}\n\nNos pondremos en contacto pronto.`);
        
        // Redirigir a tienda
        window.location.href = 'store.html';
        
    } catch (error) {
        console.error('Error en checkout:', error);
        alert('Error al crear la orden. Por favor, intenta de nuevo.');
    }
}

// Actualizar contador de carrito
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    const cartCountBadge = document.querySelector('[href="cart.html"] .badge');
    if (cartCountBadge) {
        cartCountBadge.textContent = count;
        cartCountBadge.style.display = count > 0 ? 'block' : 'none';
    }
}
