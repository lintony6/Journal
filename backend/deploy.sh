#!/bin/bash
# Deploy Node.js backend to AWS Lambda

set -e

echo "📦 Preparing Lambda deployment package..."

# Install production dependencies
npm install --production --quiet

# Create deployment zip (excluding dev files)
rm -f lambda_function.zip
zip -r lambda_function.zip \
    index.js \
    config.js \
    database.js \
    auth.js \
    helpers.js \
    handlers/ \
    node_modules/ \
    -x "*.git*" \
    -x "*.md" \
    -x "*.test.js" \
    > /dev/null

echo "✅ Created lambda_function.zip"

echo ""
echo "🚀 To deploy, run:"
echo "aws lambda update-function-code --function-name Journal --zip-file fileb://lambda_function.zip"
