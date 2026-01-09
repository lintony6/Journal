// Authentication handlers
const { ObjectId } = require('mongodb');
const { getCollection } = require('../database');
const { hashPassword, verifyPassword, createAccessToken, generateVerificationCode } = require('../auth');
const { sendVerificationEmail } = require('../email');
const { parseBody, successResponse, errorResponse } = require('../helpers');

// Register a new user
async function register(event) {
    try {
        const body = parseBody(event);
        const username = (body.username || '').trim();
        const email = (body.email || '').trim().toLowerCase();
        const password = body.password || '';

        // Validation
        if (!username || username.length < 3) {
            return errorResponse('Username must be at least 3 characters');
        }
        if (!email || !email.includes('@')) {
            return errorResponse('Valid email is required');
        }
        if (!password || password.length < 8) {
            return errorResponse('Password must be at least 8 characters');
        }

        const users = await getCollection('users');

        // Check if username or email exists
        const existingUsername = await users.findOne({ username });
        if (existingUsername) {
            return errorResponse('Username already taken');
        }

        const existingEmail = await users.findOne({ email });
        if (existingEmail) {
            return errorResponse('Email already registered');
        }

        // Generate verification code
        const verificationCode = generateVerificationCode();
        const codeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        // Create user
        const user = {
            username,
            email,
            password_hash: await hashPassword(password),
            is_verified: false,
            verification_code: verificationCode,
            verification_expires: codeExpires,
            created_at: new Date(),
            updated_at: new Date()
        };

        const result = await users.insertOne(user);

        // Send verification email via Resend
        await sendVerificationEmail(email, verificationCode);

        return successResponse({
            message: 'Account created. Please check your email for verification code.',
            user_id: result.insertedId.toString()
        }, 201);

    } catch (error) {
        console.error('Register error:', error);
        return errorResponse('Registration failed', 500);
    }
}

// Verify email with code
async function verifyEmail(event) {
    try {
        const body = parseBody(event);
        const email = (body.email || '').trim().toLowerCase();
        const code = (body.code || '').trim();

        if (!email || !code) {
            return errorResponse('Email and verification code required');
        }

        const users = await getCollection('users');
        const user = await users.findOne({ email });

        if (!user) {
            return errorResponse('User not found');
        }
        if (user.is_verified) {
            return errorResponse('Email already verified');
        }
        if (user.verification_code !== code) {
            return errorResponse('Invalid verification code');
        }
        if (new Date() > user.verification_expires) {
            return errorResponse('Verification code expired');
        }

        // Update user as verified
        await users.updateOne(
            { _id: user._id },
            {
                $set: { is_verified: true, updated_at: new Date() },
                $unset: { verification_code: '', verification_expires: '' }
            }
        );

        return successResponse({ message: 'Email verified successfully' });

    } catch (error) {
        console.error('Verify error:', error);
        return errorResponse('Verification failed', 500);
    }
}

// Resend verification code
async function resendVerification(event) {
    try {
        const body = parseBody(event);
        const email = (body.email || '').trim().toLowerCase();

        if (!email) {
            return errorResponse('Email required');
        }

        const users = await getCollection('users');
        const user = await users.findOne({ email });

        if (!user) {
            return errorResponse('User not found');
        }
        if (user.is_verified) {
            return errorResponse('Email already verified');
        }

        // Generate new code
        const verificationCode = generateVerificationCode();
        const codeExpires = new Date(Date.now() + 15 * 60 * 1000);

        await users.updateOne(
            { _id: user._id },
            { $set: { verification_code: verificationCode, verification_expires: codeExpires } }
        );

        await sendVerificationEmail(email, verificationCode);

        return successResponse({ message: 'Verification code sent' });

    } catch (error) {
        console.error('Resend error:', error);
        return errorResponse('Failed to resend code', 500);
    }
}

// Login
async function login(event) {
    try {
        const body = parseBody(event);
        const username = (body.username || '').trim();
        const password = body.password || '';

        if (!username || !password) {
            return errorResponse('Username and password required');
        }

        const users = await getCollection('users');
        const user = await users.findOne({ username });

        if (!user) {
            return errorResponse('Invalid credentials');
        }
        if (!await verifyPassword(password, user.password_hash)) {
            return errorResponse('Invalid credentials');
        }
        if (!user.is_verified) {
            return errorResponse('Please verify your email first');
        }

        // Create JWT token
        const token = createAccessToken(user._id.toString(), user.username);

        return successResponse({
            message: 'Login successful',
            token,
            user: {
                id: user._id.toString(),
                username: user.username,
                email: user.email
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        return errorResponse('Login failed', 500);
    }
}

module.exports = { register, verifyEmail, resendVerification, login };
