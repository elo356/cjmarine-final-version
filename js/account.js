// Account.js - perfil e historial de ordenes

let accountOrders = [];

document.addEventListener('DOMContentLoaded', () => {
    setupProfileForm();
    setupLogoutButton();
    updateCartCount();
    document.addEventListener('authChanged', handleAccountAuthChange);
});

async function handleAccountAuthChange(event) {
    const user = event.detail.user;
    const loading = document.getElementById('accountLoading');
    const content = document.getElementById('accountContent');
    const signedOut = document.getElementById('accountSignedOut');

    loading.style.display = 'none';

    if (!user) {
        content.style.display = 'none';
        signedOut.style.display = 'block';
        return;
    }

    signedOut.style.display = 'none';
    content.style.display = 'block';
    await loadProfile(user);
    await loadOrders(user.uid);
}

async function loadProfile(user) {
    const snapshot = await db.collection('users').doc(user.uid).get();
    const profile = snapshot.exists ? snapshot.data() : {};
    const name = profile.displayName || user.displayName || '';
    const phone = profile.phone || '';

    document.getElementById('profileName').value = name;
    document.getElementById('profilePhone').value = phone;
    document.getElementById('profileNameTitle').textContent = name || 'Cliente';
    document.getElementById('profileEmailTitle').textContent = user.email || '';
}

async function loadOrders(userId) {
    const snapshot = await db.collection('onlineOrders').where('userId', '==', userId).get();
    accountOrders = [];

    snapshot.forEach((doc) => {
        accountOrders.push({ id: doc.id, ...doc.data() });
    });

    accountOrders.sort((a, b) => getOrderTime(b) - getOrderTime(a));
    renderOrderStats();
    renderOrderLists();
}

function renderOrderStats() {
    const activeStatuses = ['pending', 'processing', 'in_progress'];
    const completedStatuses = ['completed', 'delivered'];
    const activeCount = accountOrders.filter((order) => activeStatuses.includes(order.status)).length;
    const totalSpent = accountOrders
        .filter((order) => completedStatuses.includes(order.status))
        .reduce((sum, order) => sum + (order.total || 0), 0);

    document.getElementById('totalOrders').textContent = accountOrders.length;
    document.getElementById('activeOrders').textContent = activeCount;
    document.getElementById('totalSpent').textContent = `$${totalSpent.toFixed(2)}`;
}

function renderOrderLists() {
    const activeStatuses = ['pending', 'processing', 'in_progress'];
    const progressOrders = accountOrders.filter((order) => activeStatuses.includes(order.status));
    const historyOrders = accountOrders.filter((order) => !activeStatuses.includes(order.status));

    document.getElementById('progressOrdersList').innerHTML = renderOrders(progressOrders, 'No tienes compras en progreso.');
    document.getElementById('historyOrdersList').innerHTML = renderOrders(historyOrders, 'Todavia no tienes compras completadas.');
}

function renderOrders(orders, emptyMessage) {
    if (orders.length === 0) {
        return `
            <div class="account-empty">
                <i class="fas fa-receipt"></i>
                <p>${emptyMessage}</p>
                <a href="store.html" class="btn btn-primary">Ir a la tienda</a>
            </div>
        `;
    }

    return orders.map((order) => `
        <article class="order-card">
            <div class="d-flex flex-wrap justify-content-between gap-2 mb-3">
                <div>
                    <h3 class="h6 mb-1">Orden #${order.id}</h3>
                    <p class="text-muted small mb-0">${formatOrderDate(order.createdAt)}</p>
                </div>
                <span class="order-status ${getStatusClass(order.status)}">${getStatusText(order.status)}</span>
            </div>
            <div class="order-items">
                ${(order.items || []).map((item) => `
                    <div class="order-item-row">
                        <span>${item.quantity || 1} x ${item.name || 'Producto'}</span>
                        <strong>$${((item.price || 0) * (item.quantity || 1)).toFixed(2)}</strong>
                    </div>
                `).join('')}
            </div>
            <div class="order-total">
                <span>Total</span>
                <strong>$${(order.total || 0).toFixed(2)}</strong>
            </div>
        </article>
    `).join('');
}

function setupProfileForm() {
    const form = document.getElementById('profileForm');
    if (!form) return;

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const user = getCurrentUser();
        if (!user) return;

        const displayName = document.getElementById('profileName').value.trim();
        const phone = document.getElementById('profilePhone').value.trim();

        await user.updateProfile({ displayName });
        await db.collection('users').doc(user.uid).set({
            displayName,
            phone,
            email: user.email,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        document.getElementById('profileNameTitle').textContent = displayName || 'Cliente';
        showAccountToast('Perfil actualizado.');
    });
}

function setupLogoutButton() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (!logoutBtn) return;

    logoutBtn.addEventListener('click', async () => {
        await logoutUser();
        window.location.href = 'store.html';
    });
}

function getOrderTime(order) {
    if (order.createdAt?.toDate) return order.createdAt.toDate().getTime();
    if (typeof order.createdAt === 'string') return new Date(order.createdAt).getTime();
    return 0;
}

function formatOrderDate(value) {
    const date = value?.toDate ? value.toDate() : new Date(value);
    if (Number.isNaN(date.getTime())) return 'Fecha no disponible';
    return date.toLocaleDateString('es-PR', { year: 'numeric', month: 'short', day: 'numeric' });
}

function getStatusText(status) {
    const labels = {
        pending: 'Pendiente',
        processing: 'Procesando',
        in_progress: 'En progreso',
        completed: 'Completada',
        delivered: 'Entregada',
        cancelled: 'Cancelada'
    };
    return labels[status] || 'Pendiente';
}

function getStatusClass(status) {
    if (status === 'completed' || status === 'delivered') return 'status-completed';
    if (status === 'cancelled') return 'status-cancelled';
    return 'status-progress';
}

function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    const cartCountBadge = document.getElementById('cartCount');
    if (cartCountBadge) {
        cartCountBadge.textContent = count;
        cartCountBadge.style.display = count > 0 ? 'block' : 'none';
    }
}

function showAccountToast(message) {
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
    setTimeout(() => toast.remove(), 3000);
}
