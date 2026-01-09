// Response helpers
const config = require('./config');

function corsHeaders() {
    return {
        'Access-Control-Allow-Origin': config.CORS_ORIGINS,
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
    };
}

function jsonResponse(statusCode, body) {
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json',
            ...corsHeaders()
        },
        body: JSON.stringify(body)
    };
}

function successResponse(data, statusCode = 200) {
    return jsonResponse(statusCode, data);
}

function errorResponse(message, statusCode = 400) {
    return jsonResponse(statusCode, { error: true, message });
}

function parseBody(event) {
    const body = event.body || '{}';
    try {
        return typeof body === 'string' ? JSON.parse(body) : body;
    } catch {
        return {};
    }
}

function getPathParam(event, paramName) {
    const params = event.pathParameters || {};
    return params[paramName];
}

function getQueryParam(event, paramName, defaultValue = null) {
    const params = event.queryStringParameters || {};
    return params[paramName] || defaultValue;
}

module.exports = {
    corsHeaders,
    jsonResponse,
    successResponse,
    errorResponse,
    parseBody,
    getPathParam,
    getQueryParam
};
