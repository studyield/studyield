<p align="center">
  <h1 align="center">Studyield</h1>
  <p align="center">
    <strong>Open-source AI-powered learning platform</strong>
  </p>
  <p align="center">
    Learn smarter with AI-powered exam prep, multi-agent problem solving, knowledge graphs, and more.
  </p>
</p>

<p align="center">
  <a href="https://github.com/studyield/studyield/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-Apache--2.0-blue.svg" alt="License"></a>
  <a href="https://github.com/studyield/studyield/actions/workflows/ci.yml"><img src="https://github.com/studyield/studyield/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://github.com/studyield/studyield/stargazers"><img src="https://img.shields.io/github/stars/studyield/studyield?style=social" alt="GitHub Stars"></a>
  <a href="https://github.com/studyield/studyield/issues"><img src="https://img.shields.io/github/issues/studyield/studyield" alt="Issues"></a>
  <a href="https://github.com/studyield/studyield/pulls"><img src="https://img.shields.io/github/issues-pr/studyield/studyield" alt="Pull Requests"></a>
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> |
  <a href="#features">Features</a> |
  <a href="CONTRIBUTING.md">Contributing</a> |
  <a href="https://docs.studyield.com">Documentation</a>
</p>

<p align="center">
  <a href="./README.md">English</a> |
  <a href="./README_JA.md">日本語</a> |
  <a href="./README_ZH.md">中文</a> |
  <a href="./README_KO.md">한국어</a> |
  <a href="./README_ES.md">Español</a> |
  <a href="./README_FR.md">Français</a> |
  <a href="./README_DE.md">Deutsch</a> |
  <a href="./README_PT-BR.md">Português</a> |
  <a href="./README_AR.md">العربية</a> |
  <a href="./README_BN.md">বাংলা</a> |
  <a href="./README_HI.md">हिन्दी</a> |
  <a href="./README_RU.md">Русский</a>
</p>

---

## What is Studyield?

Studyield is an open-source AI-powered learning platform that helps students study more effectively through personalized content, intelligent tutoring, and adaptive assessments. It combines **6 killer AI features** with a comprehensive study toolkit, available on both web and mobile.

<!-- TODO: Add product screenshot/GIF here -->
<!-- ![Studyield Screenshot](docs/screenshots/hero.png) -->

## Quick Start

### Docker (Recommended)

```bash
git clone https://github.com/studyield/studyield.git
cd studyield
cp backend/.env.example backend/.env
# Edit backend/.env with your database credentials and OpenRouter API key
docker compose --env-file .env.docker up -d
```

Access the app at `http://localhost:5189` and the API at `http://localhost:3010`.

### Manual Setup

**Prerequisites:** Node.js 20+, PostgreSQL 15+, Redis 7+

```bash
# Clone
git clone https://github.com/studyield/studyield.git
cd studyield

# Backend
cd backend
cp .env.example .env    # Edit .env with your configuration
npm install
npm run migrate
npm run start:dev

# Frontend (new terminal)
cd frontend
cp .env.example .env
npm install
npm run dev
```

Visit `http://localhost:5189` to access the app.

### One-Command Start (Development)

```bash
./start.sh
```

This starts PostgreSQL, Redis, Qdrant, and ClickHouse via Docker, then launches the backend and frontend dev servers.

## Features

### 6 Killer AI Features

| Feature | Description |
|---------|-------------|
| **Exam Clone** | Upload past exams and generate new practice questions in the same style, difficulty, and format |
| **Multi-Agent Problem Solver** | Analysis, Solution, and Verification agents work together to solve complex problems with real-time streaming |
| **Knowledge Graph** | Auto-extracts entities and relationships from study materials into interactive visualizations |
| **Teach-Back Evaluation** | Students explain concepts (text/voice), AI evaluates understanding and identifies gaps using the Feynman Technique |
| **Deep Research Mode** | RAG from uploaded materials + web search, produces structured reports with citations |
| **Code Sandbox** | Secure Python execution with NumPy, Pandas, and scientific library support |

### Study Toolkit

- **Knowledge Base** -- Upload documents (PDF, DOCX) for semantic search and RAG
- **Flashcards with SRS** -- Spaced repetition system for optimal memorization
- **AI-Generated Quizzes** -- Automatic quiz generation from study materials
- **RAG Chat** -- Conversational AI with citations from your documents
- **Learning Paths** -- AI-generated optimal study routes
- **Progress Analytics** -- Track study time, mastery levels, and learning velocity

### Platform

- **12 Languages** -- Full i18n support (EN, JA, ZH, KO, ES, FR, DE, PT, AR, BN, HI, RU)
- **Web + Mobile** -- React frontend and Flutter mobile app
- **Real-Time** -- WebSocket updates for AI streaming, chat, and processing progress
- **Self-Hosted** -- Run on your own infrastructure with Docker Compose
- **Stripe Billing** -- Subscription management built-in
- **OAuth** -- Google and Apple sign-in

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | NestJS 10, TypeScript, PostgreSQL (raw SQL), Redis, Qdrant, ClickHouse, BullMQ, Socket.io |
| **Frontend** | React 19, Vite, TypeScript, Tailwind CSS, Radix UI (shadcn), Zustand, React Query, i18next |
| **Mobile** | Flutter 3.10+, Provider + BLoC, Dio, Go Router, Firebase, Easy Localization |
| **AI** | OpenRouter (Claude, GPT, etc.), OpenAI Embeddings, LangChain |
| **Infrastructure** | Docker Compose, Nginx, PM2, GitHub Actions CI/CD |
| **Storage** | Cloudflare R2, AWS SES, Firebase Cloud Messaging |
| **Payments** | Stripe (subscriptions + webhooks) |

## Project Structure

```
studyield/
├── backend/                 # NestJS API Server (27 modules, 120+ endpoints)
│   ├── src/modules/         # auth, ai, content, knowledge-base, chat, quiz,
│   │                        # exam-clone, problem-solver, teach-back, research,
│   │                        # code-sandbox, learning-paths, subscription, ...
│   └── migrations/          # Database migrations (27 tables)
├── frontend/                # React 19 Web App
│   ├── src/pages/           # 24+ route pages
│   ├── src/components/      # Radix UI components
│   ├── src/locales/         # 12 language translations
│   └── src/services/        # 15+ API service clients
├── mobile/                  # Flutter Mobile App (iOS + Android)
│   ├── lib/screens/         # App screens
│   ├── lib/providers/       # State management
│   └── assets/translations/ # 12 language translations
├── docker-compose.yml       # One-command self-hosting
├── start.sh                 # Development startup script
└── .github/workflows/       # CI/CD pipelines
```

## Development

### Prerequisites
- Node.js 20+ | PostgreSQL 15+ | Redis 7+
- Qdrant (optional) | ClickHouse (optional) | Flutter 3.10+ (for mobile)
- Docker & Docker Compose (recommended)

### Running Checks

```bash
# Backend
cd backend && npm run lint && npm run build

# Frontend
cd frontend && npm run lint && npm run typecheck && npm run build

# Mobile
cd mobile && flutter analyze && flutter test
```

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

- [Bug Reports](https://github.com/studyield/studyield/issues/new?template=bug_report.yml)
- [Feature Requests](https://github.com/studyield/studyield/issues/new?template=feature_request.yml)
- [Discussions](https://github.com/studyield/studyield/discussions)

## Security

Please report security vulnerabilities responsibly. See [SECURITY.md](SECURITY.md) for our disclosure policy.

## License

This project is licensed under the [Apache License 2.0](LICENSE).

Copyright 2025 Studyield Contributors.
