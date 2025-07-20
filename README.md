# 📧 BulkMail - Multi-Provider Email Service

[![TypeScript](https://img.shields.io/badge/TypeScript-4.5%2B-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-16%2B-green.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

BulkMail is an enterprise-grade, multi-provider bulk email system that supports multiple email service providers including Mailcow, SMTP.com, and ElasticEmail. It features a TypeScript-based admin backend and a modern React-based frontend dashboard.

## 🌟 Key Features

### Implemented

- **Multi-Provider Support**: Seamlessly switch between Mailcow, SMTP.com, and ElasticEmail
- **High Performance**: Built with Node.js and TypeScript for reliability and speed
- **RESTful API**: Easy integration with any frontend or application
- **Batch Processing**: Send multiple emails efficiently with configurable concurrency
- **Detailed Logging**: Comprehensive logging for debugging and monitoring
- **Extensible Architecture**: Easy to add new email providers
- **Admin Dashboard**: Intuitive UI for managing emails, templates, and settings
- **User Management**: Secure user registration and login with JWT authentication.
- **Subscription Plans**: Manage subscription plans with a default plan.
- **IP Monitoring**: Check if an IP address is blacklisted.
- **Analytics and Bounce Handling**: Track email events and handle bounces.
- **Testing**: Unit and integration tests for the backend.

### To Be Completed

- **IP Rotation**: Automatic IP rotation to prevent blacklisting
- **Template Management**: Create and manage email templates
- **Real-time Analytics**: Monitor email delivery, opens, clicks, and bounces
- **Webhook Support**: Real-time delivery status updates
- **Rate Limiting**: Protect your email sending reputation
- **Bounce Handling**: Automatic bounce detection and handling

## 🚀 Getting Started

### 📋 Prerequisites

- Node.js 16+ and npm/yarn
- TypeScript 4.5+
- PostgreSQL

### 🛠 Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/drpcoa/bulkmail.git
    cd bulkmail
    ```

2.  **Set up the backend**:
    ```bash
    cd backend
    cp .env.example .env
    npm install
    ```

3.  **Set up the frontend**:
    ```bash
    cd ../frontend
    npm install
    ```

4.  **Set up the database**:
    - Install PostgreSQL locally.
    - Create a database named `bulkmail`.
    - Create a test database named `bulkmail_test`.
    - Create a superuser named `postgres`.

5.  **Run the database seeder**:
    ```bash
    cd backend
    npm run seed:run
    ```

### ⚙️ Configuration

1.  **Backend Configuration** (`backend/.env`):

    ```env
    # Server Configuration
    NODE_ENV=development
    PORT=3000

    # Database
    DB_HOST=localhost
    DB_PORT=5432
    DB_NAME=bulkmail
    DB_USER=postgres
    DB_PASSWORD=postgres

    # JWT Authentication
    JWT_SECRET=your_secure_jwt_secret_key
    JWT_EXPIRES_IN=24h
    ```

2.  **Frontend Configuration** (`frontend/.env`):

    ```env
    REACT_APP_API_URL=http://localhost:3000/api
    ```

### 🚀 Running the Application

#### Development Mode

1.  **Start the backend**:
    ```bash
    cd backend
    npm run dev
    ```
    The API will be available at `http://localhost:3000`

2.  **Start the frontend**:
    ```bash
    cd frontend
    npm start
    ```
    The admin dashboard will open at `http://localhost:3001`

## 📚 API Documentation

### Authentication

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login and get access token |

### Email Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/api/email/send` | Send a single email |
| POST | `/api/email/send-batch` | Send multiple emails in a batch |

### Admin Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/admin/users` | Get all users |
| POST | `/api/admin/users` | Create a new user |
| GET | `/api/admin/plans` | Get all subscription plans |
| POST | `/api/admin/plans` | Create a new subscription plan |
| PUT | `/api/admin/plans/:id` | Update a subscription plan |

### IP Monitoring Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/ip/check/:ip` | Check if an IP is blacklisted |

### Analytics Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/api/analytics/webhook` | Receive email event webhooks |

## 🚀 Deployment

### Prerequisites

- Docker and Docker Compose installed
- Node.js 16+ and npm/yarn
- PostgreSQL (for local development)
- Redis (for rate limiting and caching)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/bulkmail.git
   cd bulkmail
   ```

2. **Set up environment variables**
   ```bash
   cp .env.prod.example .env
   # Edit .env with your configuration
   ```

3. **Start the development environment**
   ```bash
   # Start backend and database
   docker-compose up -d
   
   # Install frontend dependencies
   cd frontend
   npm install
   
   # Start frontend development server
   npm run dev
   ```

### Production Deployment

1. **Set up the production environment**
   ```bash
   # Copy and edit production environment file
   cp .env.prod.example .env
   # Edit .env with your production configuration
   
   # Generate secure secrets
   node scripts/generate-secrets.js
   ```

2. **Build and start services**
   ```bash
   # Build and start all services
   docker-compose -f docker-compose.prod.yml up -d --build
   
   # Run database migrations
   docker-compose -f docker-compose.prod.yml exec backend npx typeorm-ts-node-commonjs migration:run
   
   # Run database seeds (if needed)
   docker-compose -f docker-compose.prod.yml exec backend npm run seed:run
   ```

3. **Verify the deployment**
   ```bash
   # Check service status
   docker-compose -f docker-compose.prod.yml ps
   
   # View logs
   docker-compose -f docker-compose.prod.yml logs -f
   ```

### Testing the Deployment

We've included a test script to verify your deployment:

```bash
# Make the script executable
chmod +x scripts/test-deployment.sh

# Run the test script
./scripts/test-deployment.sh

# To skip starting services (only setup environment)
./scripts/test-deployment.sh --no-start
```

## 🔒 Security

### Rate Limiting

Rate limiting is enabled by default with the following configurations:

- **API**: 100 requests per 15 minutes per IP
- **Authentication**: 5 login attempts per 15 minutes
- **Email**: 100 emails per hour per user
- **Password Reset**: 3 attempts per hour

### Security Headers

Security headers are automatically added to all responses:
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Content-Security-Policy
- Strict-Transport-Security (in production)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Workflow

1. **Set up the development environment**
   ```bash
   # Install backend dependencies
   cd backend
   npm install
   
   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

2. **Start development servers**
   ```bash
   # In one terminal - start backend
   cd backend
   npm run dev
   
   # In another terminal - start frontend
   cd frontend
   npm run dev
   ```

3. **Run tests**
   ```bash
   # Backend tests
   cd backend
   npm test
   
   # Frontend tests
   cd ../frontend
   npm test
   ```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### Deploy to Netlify

This project is configured for easy deployment to Netlify. The frontend will be deployed as a static site, and the backend will be deployed as a serverless function.

1.  **Fork this repository** to your own GitHub account.
2.  **Create a new site on Netlify** and connect it to your forked repository.
3.  **Configure the build settings**:
    *   **Base directory**: Not set (leave blank)
    *   **Build command**: `cd frontend && npm install && npm run build && cd ../backend && npm install`
    *   **Publish directory**: `frontend/dist`
4.  **Add your environment variables** in the Netlify UI under "Site settings" > "Build & deploy" > "Environment". You will need to add all the variables from your `.env` file.
5.  **Deploy your site**. Netlify will automatically build and deploy your application.

### Manual Deployment

1. **Backend Setup**:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   docker-compose -f docker-compose.prod.yml exec backend npm install
   docker-compose -f docker-compose.prod.yml exec backend npm run typeorm migration:run
   docker-compose -f docker-compose.prod.yml exec backend npm run build
   docker-compose -f docker-compose.prod.yml exec backend npm run start:prod
   ```

2. **Frontend Setup**:
   ```bash
   npm install
   npm run build
   ```

3. **Run database migrations**:
   ```bash
   docker-compose -f docker-compose.prod.yml exec backend npm run typeorm migration:run
   ```