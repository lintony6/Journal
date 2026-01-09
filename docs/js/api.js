// API Client for Reflekt Journal

class API {
    constructor() {
        this.baseUrl = CONFIG.API_BASE_URL;
    }

    getToken() {
        return localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN);
    }

    setToken(token) {
        localStorage.setItem(CONFIG.STORAGE_KEYS.TOKEN, token);
    }

    clearToken() {
        localStorage.removeItem(CONFIG.STORAGE_KEYS.TOKEN);
        localStorage.removeItem(CONFIG.STORAGE_KEYS.USER);
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Auth endpoints
    async register(username, email, password) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, email, password })
        });
    }

    async verifyEmail(email, code) {
        return this.request('/auth/verify', {
            method: 'POST',
            body: JSON.stringify({ email, code })
        });
    }

    async resendVerification(email) {
        return this.request('/auth/resend-verification', {
            method: 'POST',
            body: JSON.stringify({ email })
        });
    }

    async login(username, password) {
        const response = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });

        if (response.token) {
            this.setToken(response.token);
            localStorage.setItem(CONFIG.STORAGE_KEYS.USER, JSON.stringify(response.user));
        }

        return response;
    }

    async logout() {
        this.clearToken();
    }

    async forgotPassword(email) {
        return this.request('/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email })
        });
    }

    async resetPassword(email, code, password) {
        return this.request('/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify({ email, code, password })
        });
    }

    // Entries endpoints
    async getEntries(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/entries${query ? '?' + query : ''}`);
    }

    async getEntry(id) {
        return this.request(`/entries/${id}`);
    }

    async createEntry(data) {
        return this.request('/entries', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateEntry(id, data) {
        return this.request(`/entries/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async deleteEntry(id) {
        return this.request(`/entries/${id}`, {
            method: 'DELETE'
        });
    }

    async searchEntries(query) {
        return this.request(`/entries/search?q=${encodeURIComponent(query)}`);
    }

    // Tags endpoints
    async getTags() {
        return this.request('/tags');
    }

    async createTag(data) {
        return this.request('/tags', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateTag(id, data) {
        return this.request(`/tags/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async deleteTag(id) {
        return this.request(`/tags/${id}`, {
            method: 'DELETE'
        });
    }
}

// Create global API instance
window.api = new API();
