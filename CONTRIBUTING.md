# Contributing to Studyield

Thank you for your interest in contributing to Studyield! This guide will help you get started.

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## How to Contribute

### Reporting Bugs

Open a [Bug Report](https://github.com/studyield/studyield/issues/new?template=bug_report.yml) with:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Node.js version, browser, device)
- Screenshots or logs if applicable

### Suggesting Features

Open a [Feature Request](https://github.com/studyield/studyield/issues/new?template=feature_request.yml) with:
- Description of the feature
- Use case and motivation
- Suggested implementation approach (optional)

### Submitting Pull Requests

1. Fork the repository
2. Create a feature branch from `develop`: `git checkout -b feature/your-feature`
3. Make your changes
4. Run linting: `cd backend && npm run lint` and `cd frontend && npm run lint`
5. Commit with a descriptive message using [Conventional Commits](https://www.conventionalcommits.org/) (e.g., `feat:`, `fix:`, `docs:`)
6. Push and open a Pull Request against `develop`

## Development Setup

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- Qdrant (optional, for vector search)
- ClickHouse (optional, for analytics)
- Flutter SDK 3.10+ (for mobile development)
- Docker & Docker Compose (recommended for infrastructure)

### Quick Start (Docker)

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/studyield.git
cd studyield

# Start infrastructure services
docker compose --env-file .env.docker up -d postgres redis qdrant clickhouse

# Setup backend
cd backend
cp .env.example .env
# Edit .env with your local database credentials
npm install
npm run migrate
npm run start:dev

# Setup frontend (new terminal)
cd frontend
cp .env.example .env
npm install
npm run dev

# Setup mobile (optional, new terminal)
cd mobile
cp .env.example .env
flutter pub get
flutter run
```

### One-Command Start

```bash
./start.sh
```

### Project Structure

```
studyield/
  backend/                    # NestJS backend API
    src/
      modules/
        auth/                 # JWT + OAuth authentication
        database/             # PostgreSQL service (raw SQL)
        redis/                # Cache service
        qdrant/               # Vector database for semantic search
        clickhouse/           # Analytics
        ai/                   # OpenRouter LLM + Embeddings
        content/              # Study sets, flashcards
        knowledge-base/       # Document processing & RAG
        chat/                 # RAG conversations with citations
        quiz/                 # Quiz generation
        exam-clone/           # Past exam upload & question generation
        problem-solver/       # Multi-agent problem solving
        teach-back/           # Feynman technique evaluation
        research/             # Deep research with web search
        code-sandbox/         # Python execution
        learning-paths/       # AI study routes
        subscription/         # Stripe billing
        analytics/            # Usage tracking
      common/
        guards/               # Auth guards
        interceptors/         # Response transformation
        decorators/           # Custom decorators
    migrations/               # Database migrations
  frontend/                   # React web app
    src/
      components/ui/          # Radix UI components (shadcn pattern)
      pages/                  # Route pages
      services/               # API clients
      stores/                 # Zustand state management
      locales/                # i18n translations (12 languages)
      hooks/                  # Custom React hooks
      contexts/               # Auth context
  mobile/                     # Flutter mobile app
    lib/
      api/                    # Dio HTTP client
      models/                 # Data models
      providers/              # State management (Provider + BLoC)
      screens/                # App screens
      services/               # Business logic
      widgets/                # Reusable widgets
```

## Adding Translations

Studyield supports 12 languages and we welcome translation contributions!

### Web (Frontend)
1. Copy `frontend/src/locales/en.json` to a new file (e.g., `fr.json`)
2. Translate all values (keep the keys the same)
3. Register the new locale in the i18n configuration
4. Add the language option to the language switcher

### Mobile
1. Copy `mobile/assets/translations/en-US.json` to a new file
2. Translate all values
3. Register in the app's localization configuration

## Code Style

- **TypeScript** for backend and frontend
- **Dart** for mobile (Flutter)
- **Prettier** for formatting (`npm run format` in backend)
- **ESLint** for linting (`npm run lint`)
- Follow existing patterns in the codebase
- Use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages

## Testing

```bash
# Backend
cd backend
npm test                    # Run all tests
npm test -- --watch         # Watch mode
npm test -- --coverage      # Coverage report

# Frontend
cd frontend
npm run lint                # Lint check
npm run typecheck           # Type check

# Mobile
cd mobile
flutter test                # Run all tests
flutter analyze             # Static analysis
```

## Pull Request Guidelines

- Keep PRs focused on a single change
- Include a clear description of what and why
- Reference related issues (e.g., "Fixes #123")
- Ensure all CI checks pass
- Add tests for new functionality
- Update documentation if needed

## Questions?

- Open a [Discussion](https://github.com/studyield/studyield/discussions)
- Check the [Documentation](https://docs.studyield.com)

Thank you for contributing!
