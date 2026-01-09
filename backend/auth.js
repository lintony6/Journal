// Authentication utilities
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('./config');

// Password hashing
async function hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
}

async function verifyPassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
}

// JWT token handling
function createAccessToken(userId, username) {
    const payload = {
        sub: userId,
        username: username,
        iat: Math.floor(Date.now() / 1000)
    };
    return jwt.sign(payload, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRY });
}

function verifyToken(token) {
    try {
        return jwt.verify(token, config.JWT_SECRET);
    } catch (error) {
        return null;
    }
}

function getUserFromToken(token) {
    const payload = verifyToken(token);
    if (payload) {
        return {
            user_id: payload.sub,
            username: payload.username
        };
    }
    return null;
}

// Generate 6-digit verification code
function generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

module.exports = {
    hashPassword,
    verifyPassword,
    createAccessToken,
    verifyToken,
    getUserFromToken,
    generateVerificationCode
};
