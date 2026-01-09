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
    const forgotForm = document.getElementById('forgot-form');
    const resetForm = document.getElementById('reset-form');

    function hideAllForms() {
        loginForm?.classList.remove('active');
        registerForm?.classList.remove('active');
        verifyForm?.classList.remove('active');
        forgotForm?.classList.remove('active');
        resetForm?.classList.remove('active');
    }

    document.getElementById('show-register')?.addEventListener('click', (e) => {
        e.preventDefault();
        hideAllForms();
        registerForm.classList.add('active');
    });

    document.getElementById('show-login')?.addEventListener('click', (e) => {
        e.preventDefault();
        hideAllForms();
        loginForm.classList.add('active');
    });

    // Forgot password link
    document.querySelector('.forgot-link')?.addEventListener('click', (e) => {
        e.preventDefault();
        hideAllForms();
        forgotForm.classList.add('active');
    });

    // Back to login from forgot password
    document.getElementById('back-to-login')?.addEventListener('click', (e) => {
        e.preventDefault();
        hideAllForms();
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
    // Handle both verify and reset code inputs
    setupCodeInputGroup('#verify-form .code-input');
    setupCodeInputGroup('.reset-code');
}

function setupCodeInputGroup(selector) {
    const inputs = document.querySelectorAll(selector);
    if (!inputs.length) return;

    inputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            const value = e.target.value.replace(/\D/g, '');
            e.target.value = value;

            // Move to next input
            const groupInputs = document.querySelectorAll(selector);
            if (value && index < groupInputs.length - 1) {
                groupInputs[index + 1].focus();
            }

            input.classList.toggle('filled', value !== '');
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !input.value && index > 0) {
                const groupInputs = document.querySelectorAll(selector);
                groupInputs[index - 1].focus();
            }
        });

        input.addEventListener('paste', (e) => {
            e.preventDefault();
            const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
            const groupInputs = document.querySelectorAll(selector);
            paste.split('').forEach((char, i) => {
                if (groupInputs[i]) {
                    groupInputs[i].value = char;
                    groupInputs[i].classList.add('filled');
                }
            });
            if (paste.length === 6) groupInputs[5]?.focus();
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

        const inputs = document.querySelectorAll('#verify-form .code-input');
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

    // Forgot Password
    document.getElementById('forgot')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        const loader = btn.querySelector('.btn-loader');
        const text = btn.querySelector('span:not(.btn-loader)');

        try {
            loader.classList.remove('hidden');
            text.classList.add('hidden');

            const email = document.getElementById('forgot-email').value;
            await api.forgotPassword(email);

            pendingEmail = email;
            document.getElementById('reset-email').textContent = email;

            showToast('Reset code sent! Check your email.', 'success');

            // Switch to reset form
            document.getElementById('forgot-form').classList.remove('active');
            document.getElementById('reset-form').classList.add('active');
            document.querySelector('.reset-code').focus();
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            loader.classList.add('hidden');
            text.classList.remove('hidden');
        }
    });

    // Reset Password
    document.getElementById('reset')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        const loader = btn.querySelector('.btn-loader');
        const text = btn.querySelector('span:not(.btn-loader)');

        const inputs = document.querySelectorAll('.reset-code');
        const code = Array.from(inputs).map(i => i.value).join('');
        const password = document.getElementById('reset-password').value;
        const confirm = document.getElementById('reset-confirm').value;

        if (code.length !== 6) {
            showToast('Please enter the 6-digit code', 'error');
            return;
        }

        if (password !== confirm) {
            showToast('Passwords do not match', 'error');
            return;
        }

        if (password.length < 8) {
            showToast('Password must be at least 8 characters', 'error');
            return;
        }

        try {
            loader.classList.remove('hidden');
            text.classList.add('hidden');

            await api.resetPassword(pendingEmail, code, password);
            showToast('Password reset successfully! You can now log in.', 'success');

            // Switch to login
            document.getElementById('reset-form').classList.remove('active');
            document.getElementById('login-form').classList.add('active');
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            loader.classList.add('hidden');
            text.classList.remove('hidden');
        }
    });

    // Resend reset code
    document.getElementById('resend-reset-code')?.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            await api.forgotPassword(pendingEmail);
            showToast('Reset code resent!', 'success');
        } catch (error) {
            showToast(error.message, 'error');
        }
    });
}
