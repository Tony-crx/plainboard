# CortisolBoard Setup Guide

## Prerequisites

- **Node.js** 18+ (20+ recommended)
- **npm** or compatible package manager
- **OpenRouter API Key(s)** - Get from [openrouter.ai](https://openrouter.ai/keys)

## Quick Start

### 1. Clone & Install

```bash
cd climax
npm install
```

### 2. Configure Environment

Copy the example environment file and configure your settings:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Session Secret (generate with: openssl rand -base64 32)
SESSION_SECRET=your-super-secret-session-key-here

# OpenRouter API Keys (comma-separated for key rotation)
OPENROUTER_KEYS=sk-or-your-key-1,sk-or-your-key-2

# Application URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Login Password (default: demo)
LOGIN_PASSWORD=demo
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and login with your configured password (default: `demo`).

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run test` | Run tests (watch mode) |
| `npm run test:run` | Run tests once |
| `npm run test:coverage` | Run tests with coverage |

## Project Structure

```
climax/
├── src/
│   ├── app/              # Next.js pages & API routes
│   ├── components/       # React UI components
│   ├── lib/              # Core business logic
│   └── test/             # Test configuration
├── data/                 # Persistent data (memories, audit logs)
├── public/               # Static assets
├── .env.example          # Environment template
├── ARCHITECTURE.md       # System architecture docs
└── SETUP.md             # This file
```

## Configuration Details

### Session Secret
Generate a secure random key:
```bash
openssl rand -base64 32
```

### OpenRouter API Keys
1. Visit [openrouter.ai](https://openrouter.ai/)
2. Create an account and generate API keys
3. Add multiple keys (comma-separated) for automatic rotation

### Login Password
The default password is `demo`. Change this in production:
```env
LOGIN_PASSWORD=your-secure-password
```

## Running Tests

```bash
# Run all tests
npm run test:run

# Run tests in watch mode (for development)
npm run test

# Run specific test file
npx vitest src/lib/security/__tests__/input-validator.test.ts
```

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com/)
3. Add environment variables in Vercel dashboard
4. Deploy

### Docker

Create a `Dockerfile`:
```dockerfile
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t cortisolboard .
docker run -p 3000:3000 --env-file .env.local cortisolboard
```

## Troubleshooting

### "No API keys found" Error
- Ensure `OPENROUTER_KEYS` is set in `.env.local`
- Check keys are valid and comma-separated

### Session Issues
- Verify `SESSION_SECRET` is set
- Clear browser cookies and re-login

### Rate Limiting (429 Errors)
- Add more OpenRouter API keys for rotation
- Keys automatically rotate when rate-limited
- Wait 60 seconds for cooldown to expire

### Build Failures
```bash
# Clean and reinstall
rm -rf node_modules .next
npm install
npm run build
```

## Contributing

1. Create a feature branch
2. Write tests for new functionality
3. Ensure `npm run lint` and `npm run test:run` pass
4. Submit a pull request

## CI/CD

The project includes GitHub Actions for:
- Linting
- Testing (Node 18 & 20)
- Build verification
- Security scanning (npm audit)

Actions run on every push and pull request to main/master branches.
