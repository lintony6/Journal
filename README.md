# Journal App

A personal journal application with:
- 🔒 Username/password authentication with email verification
- 📝 Journal entries with tags
- 🔍 Full-text search
- ☁️ Serverless backend (AWS Lambda + MongoDB Atlas)
- 🌐 Static frontend (GitHub Pages)

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  GitHub Pages   │────▶│   API Gateway    │────▶│   AWS Lambda    │
│   (Frontend)    │     │    (REST API)    │     │   (Node.js)     │
└─────────────────┘     └──────────────────┘     └────────┬────────┘
                                                          │
                                                          ▼
                                                 ┌─────────────────┐
                                                 │  MongoDB Atlas  │
                                                 │   (Database)    │
                                                 └─────────────────┘
```

## Setup Instructions

### 1. MongoDB Atlas Setup

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas) and create a free account
2. Create a new cluster (M0 free tier)
3. Create a database user with read/write permissions
4. Whitelist IP address `0.0.0.0/0` (allows Lambda access)
5. Get your connection string: `mongodb+srv://username:password@cluster.mongodb.net/`

### 2. AWS Lambda Setup

#### Deploy

```bash
cd backend
npm install
chmod +x deploy.sh
./deploy.sh

# Create Lambda function (replace YOUR_ACCOUNT_ID)
aws lambda create-function \
  --function-name journal-api \
  --runtime nodejs18.x \
  --handler index.handler \
  --zip-file fileb://lambda_function.zip \
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/lambda-execution-role \
  --timeout 30 \
  --memory-size 256
```

#### Set Environment Variables in Lambda Console

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | Your MongoDB Atlas connection string |
| `DATABASE_NAME` | `journal` |
| `JWT_SECRET` | A secure random string (32+ characters) |
| `SES_SENDER_EMAIL` | Your verified SES email address |
| `AWS_REGION` | Your AWS region (e.g., `us-east-1`) |

#### Create API Gateway

1. Go to API Gateway console → Create HTTP API
2. Add routes (all integrate with your Lambda):
   - `POST /auth/register`
   - `POST /auth/verify`
   - `POST /auth/resend-verification`
   - `POST /auth/login`
   - `GET /entries`
   - `POST /entries`
   - `GET /entries/{id}`
   - `PUT /entries/{id}`
   - `DELETE /entries/{id}`
   - `GET /entries/search`
   - `GET /tags`
   - `POST /tags`
   - `PUT /tags/{id}`
   - `DELETE /tags/{id}`
3. Enable CORS
4. Deploy and note your API URL

### 3. Frontend Setup

#### Update API Configuration

Edit `frontend/js/config.js`:

```javascript
const CONFIG = {
    API_BASE_URL: 'https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com',
    // ...
};
```

#### Deploy to GitHub Pages

```bash
cd frontend
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/journal.git
git push -u origin main
```

Then in GitHub: Settings → Pages → Deploy from `main` branch.

## Free Tier Costs

| Service | Free Tier |
|---------|-----------|
| GitHub Pages | Unlimited (public repos) |
| AWS Lambda | 1M requests/month |
| API Gateway | 1M requests/month |
| MongoDB Atlas M0 | 512MB storage |
| AWS SES | 62,000 emails/month |

## License

MIT
