// Authentication Page Logic

document.addEventListener('DOMContentLoaded', () => {
    // Check if already logged in
    const token = localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN);
    if (token) {
        window.location.href = 'dashboard.html';
        return;
    }

    initFormSwitching();
    initPasswordToggles();
    initPasswordStrength();
    initCodeInputs();
    initForms();
});

// State
let pendingEmail = '';

// Toast notification
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };

    toast.innerHTML = `
        <span class="toast-icon">${icons[type]}</span>
        <span class="toast-message">${message}</span>
        <button class="toast-close">×</button>
    `;

    container.appendChild(toast);

    toast.querySelector('.toast-close').addEventListener('click', () => toast.remove());
    setTimeout(() => toast.remove(), 5000);
}

// Form switching
function initFormSwitching() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const verifyForm = document.getElementById('verify-form');

    document.getElementById('show-register')?.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.classList.remove('active');
        registerForm.classList.add('active');
    });

    document.getElementById('show-login')?.addEventListener('click', (e) => {
        e.preventDefault();
        registerForm.classList.remove('active');
        verifyForm.classList.remove('active');
        loginForm.classList.add('active');
    });
}

function showVerifyForm(email) {
    pendingEmail = email;
    document.getElementById('verify-email').textContent = email;
    document.getElementById('login-form').classList.remove('active');
    document.getElementById('register-form').classList.remove('active');
    document.getElementById('verify-form').classList.add('active');
    document.querySelector('.code-input').focus();
}

// Password toggles
function initPasswordToggles() {
    document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.addEventListener('click', () => {
            const input = btn.parentElement.querySelector('input');
            const isPassword = input.type === 'password';
            input.type = isPassword ? 'text' : 'password';
            btn.querySelector('.eye-icon').textContent = isPassword ? '🙈' : '👁️';
        });
    });
}

// Password strength indicator
function initPasswordStrength() {
    const passwordInput = document.getElementById('register-password');
    const strengthBar = document.querySelector('.strength-bar');
    const strengthText = document.querySelector('.strength-text');

    if (!passwordInput) return;

    passwordInput.addEventListener('input', () => {
        const value = passwordInput.value;
        let strength = 0;

        if (value.length >= 8) strength++;
        if (/[a-z]/.test(value) && /[A-Z]/.test(value)) strength++;
        if (/\d/.test(value)) strength++;
        if (/[^a-zA-Z0-9]/.test(value)) strength++;

        strengthBar.className = 'strength-bar';
        if (strength <= 1) {
            strengthBar.classList.add('weak');
            strengthText.textContent = 'Weak';
        } else if (strength <= 2) {
            strengthBar.classList.add('medium');
            strengthText.textContent = 'Medium';
        } else {
            strengthBar.classList.add('strong');
            strengthText.textContent = 'Strong';
        }
    });
}

// Verification code inputs
function initCodeInputs() {
    const inputs = document.querySelectorAll('.code-input');

    inputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            const value = e.target.value.replace(/\D/g, '');
            e.target.value = value;

            if (value && index < inputs.length - 1) {
                inputs[index + 1].focus();
            }

            input.classList.toggle('filled', value !== '');
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !input.value && index > 0) {
                inputs[index - 1].focus();
            }
        });

        input.addEventListener('paste', (e) => {
            e.preventDefault();
            const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
            paste.split('').forEach((char, i) => {
                if (inputs[i]) {
                    inputs[i].value = char;
                    inputs[i].classList.add('filled');
                }
            });
            if (paste.length === 6) inputs[5].focus();
        });
    });

    // Resend code
    document.getElementById('resend-code')?.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            await api.resendVerification(pendingEmail);
            showToast('Verification code resent!', 'success');
            startResendTimer();
        } catch (error) {
            showToast(error.message, 'error');
        }
    });
}

function startResendTimer() {
    const link = document.getElementById('resend-code');
    const timer = document.querySelector('.resend-timer');
    const timerSpan = document.getElementById('timer');

    link.parentElement.classList.add('hidden');
    timer.classList.remove('hidden');

    let seconds = 60;
    const interval = setInterval(() => {
        seconds--;
        timerSpan.textContent = seconds;

        if (seconds <= 0) {
            clearInterval(interval);
            timer.classList.add('hidden');
            link.parentElement.classList.remove('hidden');
        }
    }, 1000);
}

// Form submissions
function initForms() {
    // Login
    document.getElementById('login')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        const loader = btn.querySelector('.btn-loader');
        const text = btn.querySelector('span:not(.btn-loader)');

        try {
            loader.classList.remove('hidden');
            text.classList.add('hidden');

            const username = document.getElementById('login-username').value;
            const password = document.getElementById('login-password').value;

            await api.login(username, password);
            showToast('Welcome back!', 'success');

            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 500);
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            loader.classList.add('hidden');
            text.classList.remove('hidden');
        }
    });

    // Register
    document.getElementById('register')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        const loader = btn.querySelector('.btn-loader');
        const text = btn.querySelector('span:not(.btn-loader)');

        const password = document.getElementById('register-password').value;
        const confirm = document.getElementById('register-confirm').value;

        if (password !== confirm) {
            showToast('Passwords do not match', 'error');
            return;
        }

        try {
            loader.classList.remove('hidden');
            text.classList.add('hidden');

            const username = document.getElementById('register-username').value;
            const email = document.getElementById('register-email').value;

            await api.register(username, email, password);
            showToast('Account created! Check your email for verification code.', 'success');
            showVerifyForm(email);
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            loader.classList.add('hidden');
            text.classList.remove('hidden');
        }
    });

    // Verify
    document.getElementById('verify')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        const loader = btn.querySelector('.btn-loader');
        const text = btn.querySelector('span:not(.btn-loader)');

        const inputs = document.querySelectorAll('.code-input');
        const code = Array.from(inputs).map(i => i.value).join('');

        if (code.length !== 6) {
            showToast('Please enter the 6-digit code', 'error');
            return;
        }

        try {
            loader.classList.remove('hidden');
            text.classList.add('hidden');

            await api.verifyEmail(pendingEmail, code);
            showToast('Email verified! You can now log in.', 'success');

            // Switch to login
            document.getElementById('verify-form').classList.remove('active');
            document.getElementById('login-form').classList.add('active');
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            loader.classList.add('hidden');
            text.classList.remove('hidden');
        }
    });
}
