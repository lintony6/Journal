// API Configuration
const CONFIG = {
    // AWS API Gateway URL
    API_BASE_URL: 'https://aai9560id9.execute-api.us-east-1.amazonaws.com',

    // Local storage keys
    STORAGE_KEYS: {
        TOKEN: 'journal_token',
        USER: 'journal_user',
        THEME: 'journal_theme'
    },

    // Token expiry (24 hours in ms)
    TOKEN_EXPIRY: 24 * 60 * 60 * 1000
};

// Export for use in other modules
window.CONFIG = CONFIG;
