// Cart.js - Lógica del carrito

document.addEventListener('DOMContentLoaded', async () => {
    await loadOnlineStoreConfig();
    displayCart();
    setupCheckoutListener();
    updateCartCount();
    document.addEventListener('authChanged', updateCheckoutAccountHint);
    updateCheckoutAccountHint();
    updateStoreAvailabilityUI();

    document.addEventListener('onlineStoreConfigChanged', (event) => {
        updateStoreAvailabilityUI(event.detail.config);
        displayCart();
    });
});

// Mostrar carrito
function displayCart() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const container = document.getElementById('cartItemsContainer');

    if (cart.length === 0) {
        container.style.display = 'none';
        document.getElementById('emptyCart').style.display = 'block';
        updateCheckoutAvailability();
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
    updateCheckoutAvailability();
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
            if (!isStoreEnabled()) {
                updateStoreAvailabilityUI();
                return;
            }

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
        if (!isStoreEnabled()) {
            throw new Error('store-closed');
        }

        const user = await requireLogin();

        const userDoc = await db.collection('users').doc(user.uid).get();
        const savedPhone = userDoc.exists ? userDoc.data().phone : '';
        const phone = savedPhone || prompt('Ingresa tu numero de telefono:');
        if (!phone) return;

        // Calcular totales
        const subtotal = cart.reduce((sum, item) => sum + ((item.price || 0) * item.quantity), 0);
        const taxes = subtotal * 0.115;
        const total = subtotal + taxes;

        const docRef = await createOnlineOrder(cart, user, phone, { subtotal, taxes, total });
        await db.collection('users').doc(user.uid).set({ phone }, { merge: true });
        
        // Limpiar carrito
        localStorage.removeItem('cart');
        
        // Mostrar confirmación
        alert(`Orden creada exitosamente!\n\nNumero de orden: ${docRef.id}\n\nTotal: $${total.toFixed(2)}\n\nPuedes verla en Mi Cuenta.`);
        
        // Redirigir a tienda
        window.location.href = 'store.html';
        
    } catch (error) {
        if (error.message === 'auth-required') return;
        if (error.message === 'store-closed') {
            alert('La tienda está temporalmente cerrada. No se puede procesar el pago.');
            return;
        }
        console.error('Error en checkout:', error);
        alert(error.message || 'Error al crear la orden. Por favor, intenta de nuevo.');
    }
}

async function createOnlineOrder(cart, user, phone, totals) {
    const orderRef = db.collection('onlineOrders').doc();
    const productRefs = cart.map((item) => db.collection('products').doc(item.id));

    await db.runTransaction(async (transaction) => {
        const productSnapshots = [];

        for (const productRef of productRefs) {
            productSnapshots.push(await transaction.get(productRef));
        }

        const orderItems = cart.map((item, index) => {
            const productDoc = productSnapshots[index];
            if (!productDoc.exists) {
                throw new Error(`El producto ${item.name || item.id} ya no existe.`);
            }

            const productData = productDoc.data();
            const requestedQuantity = Number(item.quantity) || 1;
            const currentStock = Number(productData.stock) || 0;

            if (requestedQuantity > currentStock) {
                throw new Error(`No hay suficiente stock para ${productData.name || item.name}. Disponible: ${currentStock}.`);
            }

            return {
                id: item.id,
                name: productData.name || item.name,
                sku: productData.sku || item.sku || '',
                price: Number(productData.price ?? item.price ?? 0),
                image: productData.image || item.image || '',
                quantity: requestedQuantity,
                stockBeforeOrder: currentStock,
                stockAfterOrder: currentStock - requestedQuantity
            };
        });

        orderItems.forEach((item, index) => {
            transaction.update(productRefs[index], {
                stock: item.stockAfterOrder,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        });

        transaction.set(orderRef, {
            orderNumber: orderRef.id,
            source: 'online_store',
            channel: 'storefront',
            items: orderItems,
            userId: user.uid,
            customerName: user.displayName || '',
            email: user.email,
            phone: phone,
            subtotal: totals.subtotal,
            taxes: totals.taxes,
            total: totals.total,
            paymentStatus: 'pending',
            fulfillmentStatus: 'new',
            status: 'pending',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    });

    return orderRef;
}

function updateCheckoutAccountHint() {
    const hint = document.getElementById('checkoutAccountHint');
    if (!hint) return;

    if (!isStoreEnabled()) {
        hint.textContent = 'La tienda está cerrada temporalmente. El checkout no está disponible.';
        return;
    }

    const user = getCurrentUser();
    if (user) {
        hint.textContent = `Comprando como ${user.email}. La orden se guardara en Mi Cuenta.`;
    } else {
        hint.textContent = 'Necesitas entrar a tu cuenta para guardar el historial de compra.';
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

function updateCheckoutAvailability() {
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (!checkoutBtn) return;

    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const storeOpen = isStoreEnabled();
    checkoutBtn.disabled = cart.length === 0 || !storeOpen;
    checkoutBtn.textContent = storeOpen ? 'Proceder a Pagar' : 'Tienda temporalmente cerrada';
}

function updateStoreAvailabilityUI(config = getOnlineStoreConfig()) {
    const closedAlert = document.getElementById('storeClosedAlert');
    const checkoutBtn = document.getElementById('checkoutBtn');
    const isOpen = config.storeEnabled !== false;

    if (closedAlert) {
        if (isOpen) {
            closedAlert.classList.add('d-none');
            closedAlert.textContent = '';
        } else {
            closedAlert.textContent = 'La tienda está temporalmente cerrada. No se aceptan compras por el momento.';
            closedAlert.classList.remove('d-none');
        }
    }

    if (checkoutBtn) {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        checkoutBtn.disabled = cart.length === 0 || !isOpen;
        checkoutBtn.textContent = isOpen ? 'Proceder a Pagar' : 'Tienda temporalmente cerrada';
    }

    updateCheckoutAccountHint();
}
