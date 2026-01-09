/**
 * Main Lambda handler - Routes requests to appropriate handlers
 * Entry point for AWS Lambda
 */
const config = require('./config');
const { getUserFromToken } = require('./auth');
const { successResponse, errorResponse } = require('./helpers');
const { register, verifyEmail, resendVerification, login } = require('./handlers/authHandlers');
const { getEntries, getEntry, createEntry, updateEntry, deleteEntry, searchEntries } = require('./handlers/entryHandlers');
const { getTags, createTag, updateTag, deleteTag } = require('./handlers/tagHandlers');

// Validate required environment variables
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
const missingVars = requiredEnvVars.filter(v => !process.env[v]);
if (missingVars.length > 0) {
    console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
}

// Authentication middleware
function requireAuth(handler) {
    return async (event, context) => {
        const headers = event.headers || {};
        const authHeader = headers.Authorization || headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return errorResponse('Authentication required', 401);
        }

        const token = authHeader.split(' ')[1];
        const user = getUserFromToken(token);

        if (!user) {
            return errorResponse('Invalid or expired token', 401);
        }

        // Add user to event
        event.user = user;
        return handler(event, context);
    };
}

// Route definitions
const routes = {
    // Auth routes (no auth required)
    'POST /auth/register': register,
    'POST /auth/verify': verifyEmail,
    'POST /auth/resend-verification': resendVerification,
    'POST /auth/login': login,

    // Entry routes (auth required)
    'GET /entries': requireAuth(getEntries),
    'POST /entries': requireAuth(createEntry),
    'GET /entries/search': requireAuth(searchEntries),

    // Tag routes (auth required)
    'GET /tags': requireAuth(getTags),
    'POST /tags': requireAuth(createTag),
};

// Main handler
exports.handler = async (event, context) => {
    // Keep connection alive between invocations
    context.callbackWaitsForEmptyEventLoop = false;

    // Support both API Gateway REST API (v1) and HTTP API (v2) event formats
    const httpMethod = event.httpMethod || event.requestContext?.http?.method || '';
    const path = event.path || event.rawPath || '';

    console.log(`Handling: ${httpMethod} ${path}`);

    // Handle CORS preflight
    if (httpMethod === 'OPTIONS') {
        return successResponse({});
    }

    const routeKey = `${httpMethod} ${path}`;

    // Check static routes first
    let handler = routes[routeKey];

    if (handler) {
        return handler(event, context);
    }

    // Check dynamic routes (with path parameters)
    if (path.startsWith('/entries/') && path !== '/entries/search') {
        const entryId = path.split('/').pop();
        event.pathParameters = { id: entryId };

        switch (httpMethod) {
            case 'GET':
                return requireAuth(getEntry)(event, context);
            case 'PUT':
                return requireAuth(updateEntry)(event, context);
            case 'DELETE':
                return requireAuth(deleteEntry)(event, context);
        }
    }

    if (path.startsWith('/tags/')) {
        const tagId = path.split('/').pop();
        event.pathParameters = { id: tagId };

        switch (httpMethod) {
            case 'PUT':
                return requireAuth(updateTag)(event, context);
            case 'DELETE':
                return requireAuth(deleteTag)(event, context);
        }
    }

    return errorResponse('Not found', 404);
};
