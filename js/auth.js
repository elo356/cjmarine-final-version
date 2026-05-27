// Auth.js - sistema de cuentas compartido para la tienda

let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
    createAuthModal();
    setupAuthForm();
    setupAuthStateListener();
});

async function setupAuthStateListener() {
    if (typeof auth === 'undefined') return;

    await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

    auth.onAuthStateChanged(async (user) => {
        currentUser = user;
        await syncUserProfile(user);
        updateAccountNav(user);
        document.dispatchEvent(new CustomEvent('authChanged', { detail: { user } }));
    });
}

async function syncUserProfile(user) {
    if (!user) return;

    const userRef = db.collection('users').doc(user.uid);
    const snapshot = await userRef.get();
    const profile = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || '',
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    if (snapshot.exists) {
        await userRef.set(profile, { merge: true });
    } else {
        await userRef.set({
            ...profile,
            phone: '',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    }
}

function updateAccountNav(user) {
    const links = document.querySelectorAll('[data-auth-link]');
    links.forEach((link) => {
        if (user) {
            link.href = 'account.html';
            link.classList.add('account-nav-button', 'is-signed-in');
            link.setAttribute('aria-label', 'Mi Cuenta');
            link.innerHTML = `
                <span class="account-nav-icon"><i class="fas fa-user-circle"></i></span>
                <span class="account-nav-label">Mi Cuenta</span>
            `;
            link.onclick = null;
        } else {
            link.href = '#';
            link.classList.add('account-nav-button');
            link.classList.remove('is-signed-in');
            link.setAttribute('aria-label', 'Entrar o crear cuenta');
            link.innerHTML = `
                <span class="account-nav-icon"><i class="fas fa-user"></i></span>
                <span class="account-nav-label">Cuenta</span>
            `;
            link.onclick = (event) => {
                event.preventDefault();
                openAuthModal();
            };
        }
    });
}

function createAuthModal() {
    if (document.getElementById('authModal')) return;

    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'authModal';
    modal.tabIndex = -1;
    modal.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="authModalTitle">Entrar a tu cuenta</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="alert alert-danger d-none" id="authError"></div>
                    <form id="authForm">
                        <div class="mb-3" id="authNameGroup" style="display: none;">
                            <label class="form-label" for="authName">Nombre</label>
                            <input type="text" class="form-control" id="authName" autocomplete="name">
                        </div>
                        <div class="mb-3" id="authPhoneGroup" style="display: none;">
                            <label class="form-label" for="authPhone">Telefono</label>
                            <input type="tel" class="form-control" id="authPhone" autocomplete="tel">
                        </div>
                        <div class="mb-3">
                            <label class="form-label" for="authEmail">Correo electronico</label>
                            <input type="email" class="form-control" id="authEmail" autocomplete="email" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label" for="authPassword">Contrasena</label>
                            <input type="password" class="form-control" id="authPassword" autocomplete="current-password" minlength="6" required>
                        </div>
                        <div class="mb-3" id="authConfirmPasswordGroup" style="display: none;">
                            <label class="form-label" for="authConfirmPassword">Confirmar contrasena</label>
                            <input type="password" class="form-control" id="authConfirmPassword" autocomplete="new-password" minlength="6">
                        </div>
                        <button type="submit" class="btn btn-primary w-100" id="authSubmitBtn">Entrar</button>
                    </form>
                    <div class="d-flex justify-content-between align-items-center mt-3">
                        <button type="button" class="btn btn-link p-0" id="toggleAuthMode">Crear cuenta</button>
                        <button type="button" class="btn btn-link p-0" id="resetPasswordBtn">Olvide mi contrasena</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function setupAuthForm() {
    const form = document.getElementById('authForm');
    const toggleBtn = document.getElementById('toggleAuthMode');
    const resetBtn = document.getElementById('resetPasswordBtn');
    if (!form || !toggleBtn || !resetBtn) return;

    let isRegisterMode = false;

    toggleBtn.addEventListener('click', () => {
        isRegisterMode = !isRegisterMode;
        setAuthMode(isRegisterMode);
        clearAuthError();
    });

    resetBtn.addEventListener('click', async () => {
        const email = document.getElementById('authEmail').value.trim();
        if (!email) {
            showAuthError('Escribe tu correo para enviarte el enlace de recuperacion.');
            return;
        }

        try {
            await auth.sendPasswordResetEmail(email);
            showAuthError('Te enviamos un correo para recuperar tu contrasena.', 'success');
        } catch (error) {
            showAuthError(getAuthErrorMessage(error));
        }
    });

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        clearAuthError();

        const email = document.getElementById('authEmail').value.trim();
        const password = document.getElementById('authPassword').value;
        const confirmPassword = document.getElementById('authConfirmPassword').value;
        const name = document.getElementById('authName').value.trim();
        const phone = document.getElementById('authPhone').value.trim();
        const submitBtn = document.getElementById('authSubmitBtn');

        if (isRegisterMode && !phone) {
            showAuthError('El telefono es requerido para crear una cuenta.');
            return;
        }

        if (isRegisterMode && password !== confirmPassword) {
            showAuthError('Las contrasenas no coinciden.');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = isRegisterMode ? 'Creando...' : 'Entrando...';

        try {
            if (isRegisterMode) {
                const credential = await auth.createUserWithEmailAndPassword(email, password);
                if (name) {
                    await credential.user.updateProfile({ displayName: name });
                }
                await syncUserProfile(credential.user);
                await db.collection('users').doc(credential.user.uid).set({ phone }, { merge: true });
            } else {
                await auth.signInWithEmailAndPassword(email, password);
            }

            bootstrap.Modal.getInstance(document.getElementById('authModal')).hide();
            form.reset();
            setAuthMode(false);
            isRegisterMode = false;
        } catch (error) {
            showAuthError(getAuthErrorMessage(error));
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = isRegisterMode ? 'Crear cuenta' : 'Entrar';
        }
    });

    function setAuthMode(registerMode) {
        document.getElementById('authModalTitle').textContent = registerMode ? 'Crear cuenta' : 'Entrar a tu cuenta';
        document.getElementById('authNameGroup').style.display = registerMode ? 'block' : 'none';
        document.getElementById('authPhoneGroup').style.display = registerMode ? 'block' : 'none';
        document.getElementById('authConfirmPasswordGroup').style.display = registerMode ? 'block' : 'none';
        document.getElementById('authPhone').required = registerMode;
        document.getElementById('authConfirmPassword').required = registerMode;
        document.getElementById('authSubmitBtn').textContent = registerMode ? 'Crear cuenta' : 'Entrar';
        document.getElementById('toggleAuthMode').textContent = registerMode ? 'Ya tengo cuenta' : 'Crear cuenta';
        document.getElementById('authPassword').autocomplete = registerMode ? 'new-password' : 'current-password';
    }
}

function openAuthModal() {
    createAuthModal();
    new bootstrap.Modal(document.getElementById('authModal')).show();
}

function getCurrentUser() {
    return currentUser || auth.currentUser;
}

async function requireLogin() {
    const user = getCurrentUser();
    if (user) return user;

    openAuthModal();
    throw new Error('auth-required');
}

function logoutUser() {
    return auth.signOut();
}

function showAuthError(message, type = 'danger') {
    const errorBox = document.getElementById('authError');
    if (!errorBox) return;
    errorBox.className = `alert alert-${type}`;
    errorBox.textContent = message;
}

function clearAuthError() {
    const errorBox = document.getElementById('authError');
    if (!errorBox) return;
    errorBox.className = 'alert alert-danger d-none';
    errorBox.textContent = '';
}

function getAuthErrorMessage(error) {
    const code = error?.code || '';
    if (code.includes('email-already-in-use')) return 'Ese correo ya tiene una cuenta.';
    if (code.includes('invalid-email')) return 'El correo no es valido.';
    if (code.includes('wrong-password') || code.includes('user-not-found') || code.includes('invalid-credential')) {
        return 'Correo o contrasena incorrectos.';
    }
    if (code.includes('weak-password')) return 'La contrasena debe tener al menos 6 caracteres.';
    return 'No pudimos completar la accion. Intenta de nuevo.';
}
