// Configuration - All values should be set via Lambda environment variables
module.exports = {
    // MongoDB Configuration
    MONGODB_URI: process.env.MONGODB_URI,
    DATABASE_NAME: process.env.DATABASE_NAME || 'journal',

    // JWT Configuration
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRY: '24h',

    // Resend Email Configuration
    RESEND_API_KEY: process.env.RESEND_API_KEY,

    // CORS Configuration
    CORS_ORIGINS: process.env.CORS_ORIGINS || '*'
};
