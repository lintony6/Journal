# Journal

A full-stack personal journaling web application with secure authentication, email verification, and cloud-based storage.

## Features

- 🔐 **Secure Authentication** - User registration with email verification
- 📝 **Journal Entries** - Create, edit, and delete personal journal entries
- 🏷️ **Tagging System** - Organize entries with custom colored tags
- ⭐ **Favorites** - Mark important entries for quick access
- 🔍 **Search** - Full-text search across all entries
- 📅 **Calendar View** - Visual overview of entries by date
- 🌙 **Dark Mode** - Modern, sleek dark UI

## Live Demo

🔗 **[https://lintony6.github.io/Journal/](https://lintony6.github.io/Journal/)**

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  GitHub Pages   │────▶│   API Gateway    │────▶│   AWS Lambda    │
│   (Frontend)    │     │    (REST API)    │     │   (Node.js)     │
└─────────────────┘     └──────────────────┘     └────────┬────────┘
                                                          │
                                              ┌───────────┴───────────┐
                                              ▼                       ▼
                                     ┌─────────────────┐     ┌─────────────────┐
                                     │  MongoDB Atlas  │     │     Brevo       │
                                     │   (Database)    │     │    (Email)      │
                                     └─────────────────┘     └─────────────────┘
```

## Tech Stack

| Component | Technology |
|-----------|------------|
| **Frontend** | HTML, CSS, JavaScript |
| **Backend** | Node.js (AWS Lambda) |
| **Database** | MongoDB Atlas |
| **Email** | Brevo (Transactional API) |
| **API** | AWS API Gateway (HTTP API) |
| **Hosting** | GitHub Pages |
| **Authentication** | JWT Tokens + bcrypt |

## Setup Instructions

### Prerequisites

- AWS Account (free tier)
- MongoDB Atlas Account (free tier)
- Brevo Account (free tier - 300 emails/day)
- GitHub Account

### 1. MongoDB Atlas Setup

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster (M0 free tier)
3. Create a database user with read/write permissions
4. Whitelist IP `0.0.0.0/0` for Lambda access
5. Get your connection string

### 2. Brevo Email Setup

1. Create a free account at [Brevo](https://www.brevo.com)
2. Go to **SMTP & API** → **API Keys** → Create API key
3. Go to **Settings** → **Senders** → Add and verify your sender email

### 3. AWS Lambda Setup

```bash
cd backend
npm install
chmod +x deploy.sh
./deploy.sh

# Then upload to Lambda
aws lambda update-function-code \
  --function-name Journal \
  --zip-file fileb://lambda_function.zip
```

#### Lambda Environment Variables

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secure random string (32+ chars) |
| `BREVO_API_KEY` | Your Brevo API key |
| `BREVO_SENDER_EMAIL` | Your verified sender email |

### 4. API Gateway Routes

Create an HTTP API with these routes (all pointing to Lambda):

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

Enable CORS for all routes.

### 5. Frontend Deployment

1. Update `docs/js/config.js` with your API Gateway URL
2. Push to GitHub
3. Enable GitHub Pages from `/docs` folder

## Project Structure

```
Journal/
├── docs/                   # Frontend (GitHub Pages)
│   ├── index.html         # Login/Register page
│   ├── dashboard.html     # Main app
│   ├── css/
│   │   ├── styles.css     # Global styles
│   │   ├── auth.css       # Auth page styles
│   │   └── dashboard.css  # Dashboard styles
│   └── js/
│       ├── config.js      # API configuration
│       ├── api.js         # API client
│       ├── auth.js        # Auth page logic
│       └── dashboard.js   # Dashboard logic
├── backend/               # Lambda function
│   ├── index.js          # Main handler & routing
│   ├── config.js         # Environment config
│   ├── database.js       # MongoDB connection
│   ├── auth.js           # Auth utilities
│   ├── email.js          # Brevo email client
│   ├── helpers.js        # Response helpers
│   ├── handlers/
│   │   ├── authHandlers.js
│   │   ├── entryHandlers.js
│   │   └── tagHandlers.js
│   ├── package.json
│   └── deploy.sh         # Deployment script
└── README.md
```

## Free Tier Limits

| Service | Free Tier |
|---------|-----------|
| GitHub Pages | Unlimited (public repos) |
| AWS Lambda | 1M requests/month |
| API Gateway | 1M requests/month |
| MongoDB Atlas M0 | 512MB storage |
| Brevo | 300 emails/day |

## License

MIT
