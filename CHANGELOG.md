# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Open-source release under Apache License 2.0
- Comprehensive CONTRIBUTING.md guide
- SECURITY.md with responsible disclosure policy
- CODE_OF_CONDUCT.md (Contributor Covenant v2.1)
- GitHub issue templates (bug reports, feature requests)
- GitHub pull request template
- Root-level `docker-compose.yml` for one-command self-hosting
- Development startup script (`start.sh`)
- CI workflow for pull request validation (lint, type-check, build)
- Dependabot configuration for automated dependency updates
- `.prettierrc` and `.editorconfig` for consistent code formatting
- NOTICE file with third-party attribution
- CHANGELOG.md following Keep a Changelog format
- DOMPurify sanitization for user-generated HTML content
- React ErrorBoundary component for graceful error handling

### Changed
- Replaced all hardcoded credentials with environment variable placeholders
- Replaced proprietary license with Apache License 2.0
- Updated `.gitignore` with comprehensive patterns
- Improved `.env.example` files with clear documentation and grouped sections
- Made all URLs configurable via environment variables
- Fixed CORS gateway fallback from wildcard `*` to localhost defaults
- Replaced console.error with NestJS Logger service
- Removed token debug logging from WebSocket auth guard
- Disabled production sourcemaps in Vite build
- Enabled `avoid_print` lint rule for Flutter mobile
- Pinned `intl` dependency version in mobile

### Removed
- Proprietary INFO INLET license
- Hardcoded API keys and secrets from example files
- Hardcoded server IPs from documentation
- Internal development markdown files (12 mobile docs, root ONBOARDING plan)
- Token substring logging from authentication flows
- Production URL fallbacks from frontend and mobile config
- `.DS_Store` files from version control

### Security
- Removed all real credentials from `.env.example` files
- Removed production `.env` files from git tracking
- Added DOMPurify to sanitize dangerouslySetInnerHTML content (XSS prevention)
- Fixed CORS wildcard fallback to restrict origins
- Removed sensitive token logging from WebSocket guard
- Added Firebase config files to `.gitignore`

## [0.1.0] - 2025-02-05

### Added
- Initial AI-powered learning platform
- NestJS backend with 27 modules and 120+ REST endpoints
- React 19 frontend with Vite, Tailwind CSS, and Radix UI
- Flutter mobile app with Provider + BLoC state management
- 6 killer AI features:
  - Exam Clone: upload past exams, generate practice questions
  - Multi-Agent Problem Solver: analysis, solution, verification agents
  - Knowledge Graph Visualization: entity and relationship extraction
  - Teach-Back Evaluation: Feynman technique with AI feedback
  - Deep Research Mode: RAG + web search with structured reports
  - Code Sandbox: secure Python execution with scientific libraries
- Knowledge base with document processing and semantic search (RAG)
- AI-generated quizzes and SRS flashcards
- Real-time chat with citations from uploaded documents
- Learning paths with AI-generated study routes
- Stripe subscription billing
- JWT + OAuth authentication (Google, Apple)
- PostgreSQL database with 27 tables (raw SQL, no ORM)
- Redis caching and BullMQ job queue
- Qdrant vector database for semantic search
- ClickHouse analytics
- Cloudflare R2 file storage
- Socket.io real-time WebSocket updates (6 namespaces)
- i18n support for 12 languages (web + mobile)
- Firebase push notifications (mobile)
- GitHub Actions CI/CD pipeline
- Production deployment with PM2 and Nginx
