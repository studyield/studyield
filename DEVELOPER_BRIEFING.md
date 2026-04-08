# Studyield Open Source - Developer Briefing

> **Date**: April 8, 2026
> **Status**: Initial open-source release completed, polish work remaining

---

## Repository Structure

| Repo | URL | Visibility | Purpose |
|------|-----|-----------|---------|
| **studyield** | https://github.com/studyield/studyield | **Public** | Open-source release, single clean commit |
| **studyield-private** | https://github.com/studyield/studyield-private | **Private** | Development repo, full git history, all branches |
| studyield-old | https://github.com/studyield/studyield-old | Private | Archived (original repo before split, can delete) |

**Local directories:**
- `/Users/nymulislam/DEVELOP/studyield` → public repo
- `/Users/nymulislam/DEVELOP/studyield-private` → private dev repo

**Workflow**: Develop on `studyield-private` (feature branches → develop → main), then periodically sync clean code to `studyield` (public).

---

## What Has Been Done (Open Source Preparation)

### 1. Security & Credential Cleanup
- [x] Removed `backend/.env.production` and `frontend/.env.production` from git tracking (contained real AWS, Stripe, OpenRouter, Google OAuth, Firebase keys)
- [x] Sanitized `backend/.env.example` - removed real Apple Team ID, Apple Key ID, Firebase project ID, internal server references
- [x] Sanitized `frontend/.env.example` - changed production URL to localhost
- [x] Updated `.gitignore` comprehensively (env files, Firebase configs, IDE, internal docs, build artifacts, Flutter)
- [x] Removed hardcoded server IPs from README
- [x] Public repo has zero secrets in git history (fresh single-commit repo)

### 2. License & Legal
- [x] Replaced proprietary INFO INLET license with **Apache License 2.0**
- [x] Updated `backend/package.json` license: `"UNLICENSED"` → `"Apache-2.0"`
- [x] Created `NOTICE` file with third-party dependency attribution (backend, frontend, mobile)

### 3. Repository Hygiene
- [x] Removed 13 internal markdown docs from `mobile/` (IMPLEMENTATION_GUIDE, ONBOARDING_*, LOCALIZATION_PROGRESS, etc.)
- [x] Removed `ONBOARDING_IMPLEMENTATION_PLAN.md` from root
- [x] Removed `deploy.yml` from public repo (stays in private only)
- [x] Removed `OPEN_SOURCE_IMPLEMENTATION.md` from public repo (stays in private only)

### 4. Backend Code Quality Fixes
- [x] Fixed CORS gateway fallback from wildcard `'*'` to `['http://localhost:3010', 'http://localhost:5189']` in all 5 gateway files
- [x] Removed token substring debug logging from `ws-auth.guard.ts` (was leaking token previews)
- [x] Replaced `console.error` with NestJS `Logger` in `ai.controller.ts`
- [x] Removed internal "Peddlum" reference from `main.ts` comment

### 5. Frontend Code Quality Fixes
- [x] Added **DOMPurify** sanitization for all `dangerouslySetInnerHTML` usage (5 files - XSS prevention)
- [x] Created `ErrorBoundary` component (`src/components/ErrorBoundary.tsx`)
- [x] Removed production API URL fallback (`https://api.studyield.com` → `http://localhost:3010`) in `src/config/api.ts`
- [x] Disabled sourcemaps in production build (`vite.config.ts`)

### 6. Mobile Code Quality Fixes
- [x] Changed API URL fallback from `https://api.studyield.com` to `http://10.0.2.2:3010` in `api_config.dart`
- [x] Enabled `avoid_print` lint rule in `analysis_options.yaml`
- [x] Removed all token debug `print()` statements from `auth_token_service.dart` and `token_storage.dart`
- [x] Pinned `intl` dependency from `any` to `^0.20.0` in `pubspec.yaml`

### 7. Community Infrastructure (ALL COMPLETE)
- [x] `CONTRIBUTING.md` - dev setup, project structure, translations, code style, testing
- [x] `CODE_OF_CONDUCT.md` - Contributor Covenant v2.1
- [x] `SECURITY.md` - responsible disclosure, 48hr SLA, self-hosting best practices
- [x] `CHANGELOG.md` - Keep a Changelog format
- [x] `.github/ISSUE_TEMPLATE/bug_report.yml` - with platform dropdown (Web/iOS/Android/API)
- [x] `.github/ISSUE_TEMPLATE/feature_request.yml` - with study-focused categories
- [x] `.github/ISSUE_TEMPLATE/config.yml` - disabled blank issues, links to docs/discussions
- [x] `.github/PULL_REQUEST_TEMPLATE.md` - type of change, testing checklist, code quality
- [x] `.github/dependabot.yml` - weekly npm (grouped: nestjs, react, radix), monthly GH Actions
- [x] `.github/workflows/ci.yml` - lint, typecheck, build for backend + frontend

### 8. Docker & Self-Hosting
- [x] `docker-compose.yml` - full stack: PostgreSQL, Redis, Qdrant, ClickHouse, backend, frontend
- [x] `.env.docker` - sensible defaults for Docker Compose
- [x] `start.sh` - one-command dev startup with health checks

### 9. Code Quality Tooling
- [x] `.prettierrc` - consistent formatting config
- [x] `.editorconfig` - cross-editor consistency

### 10. README
- [x] Complete rewrite with badges, hero section, quick start (Docker + manual), feature tables, tech stack, project structure

---

## What Still Needs To Be Done

### PRIORITY 1: Code Cleanup (Assign to developers)

#### Frontend - Remove console.log statements (~58 instances across 17 files)
**Key files to clean up:**

| File | Count | Action |
|------|-------|--------|
| `frontend/src/stores/useLiveQuizStore.ts` | 16 | Remove all debug logs |
| `frontend/src/stores/useNotificationsStore.ts` | 8 | Remove all debug logs |
| `frontend/src/pages/dashboard/CollaborativeExamPage.tsx` | 4 | Remove debug logs |
| `frontend/src/pages/dashboard/ExamClonePage.tsx` | 4 | Remove debug logs |
| `frontend/src/pages/dashboard/ExamDetailPage.tsx` | 4 | Remove debug logs |
| `frontend/src/pages/dashboard/PracticeExamPage.tsx` | 4 | Remove debug logs |
| `frontend/src/components/documents/DocumentsTab.tsx` | 4 | Remove debug logs |
| `frontend/src/pages/dashboard/BookmarksPage.tsx` | 2 | Remove debug logs |
| `frontend/src/pages/dashboard/DashboardHomePage.tsx` | 2 | Remove debug logs |
| `frontend/src/pages/dashboard/ReviewQueuePage.tsx` | 2 | Remove debug logs |
| `frontend/src/components/sources/SourcesTab.tsx` | 2 | Remove debug logs |
| + 6 more files with 1 each | | |

**How**: Search for `console.log`, `console.error`, `console.warn` in all `.ts`/`.tsx` files. Remove or replace with a dev-only logger.

#### Mobile - Remove print() statements (~204 instances across 28 files)
**How**: The `avoid_print` lint rule is now enabled. Run `flutter analyze` to find all violations. Replace `print()` with either:
- Remove completely (if just debug noise)
- Use `debugPrint()` (only shows in debug mode)
- Use a proper logging package like `logger`

#### Mobile - Resolve 19 TODO comments
**Key TODOs that need implementation:**

| File | TODO | Priority |
|------|------|----------|
| `lib/features/auth/presentation/screens/login_screen.dart:222` | Implement Google login | HIGH |
| `lib/features/auth/presentation/screens/login_screen.dart:233` | Implement Apple login | HIGH |
| `lib/features/auth/presentation/screens/register_screen.dart:246` | Implement Google signup | HIGH |
| `lib/features/auth/presentation/screens/register_screen.dart:257` | Implement Apple signup | HIGH |
| `lib/features/ai_chat/data/repositories/chat_repository_impl.dart:78` | Implement SSE streaming | HIGH |
| `lib/features/problem_solver/data/repositories/problem_solver_repository_impl.dart` (6 TODOs) | Backend endpoints not implemented | MEDIUM |
| `lib/features/profile/presentation/screens/account_settings_screen.dart:104` | Account deletion API | MEDIUM |
| `lib/features/notifications/presentation/screens/notifications_screen.dart:146` | Delete notification in provider | LOW |
| `lib/features/quiz/presentation/screens/live_quiz_lobby_screen.dart:60` | Navigate to game screen | LOW |
| `lib/app.dart:24` | Add GoRouter configuration | LOW |

---

### PRIORITY 2: Backend Improvements

#### 2a. Use ConfigService instead of process.env (7 files)
These files access `process.env` directly instead of NestJS ConfigService:

| File | Line | Variable |
|------|------|----------|
| `backend/src/common/gateways/app.gateway.ts` | 14 | CORS_ORIGINS |
| `backend/src/modules/chat/chat.gateway.ts` | 17 | CORS_ORIGINS |
| `backend/src/modules/quiz/live-quiz.gateway.ts` | 17 | CORS_ORIGINS |
| `backend/src/modules/exam-clone/exam-clone.gateway.ts` | 30 | CORS_ORIGINS |
| `backend/src/modules/problem-solver/problem-solver.gateway.ts` | 18 | CORS_ORIGINS |
| `backend/src/health.controller.ts` | 45, 61 | npm_package_version |

**How**: Inject `ConfigService` via constructor and use `this.configService.get('CORS_ORIGINS')`.

#### 2b. Add environment variable validation
**File**: `backend/src/app.module.ts`
**Action**: Add Joi validation schema in `ConfigModule.forRoot()`:
```typescript
import * as Joi from 'joi';

ConfigModule.forRoot({
  validationSchema: Joi.object({
    JWT_ACCESS_SECRET: Joi.string().required().min(32),
    JWT_REFRESH_SECRET: Joi.string().required().min(32),
    DATABASE_HOST: Joi.string().required(),
    DATABASE_PORT: Joi.number().default(5432),
    REDIS_HOST: Joi.string().required(),
    OPENROUTER_API_KEY: Joi.string().required(),
    // ... etc
  }),
});
```

#### 2c. Fix migration file naming
Current naming has conflicts (duplicate numbers):
```
001_initial.sql
001_add_exam_and_type_columns.sql   ← duplicate 001
006_mind_maps.sql
006_problem_chat_messages.sql       ← duplicate 006
010_blog.sql
010_create_user_fcm_tokens_table.sql ← duplicate 010
```
**Action**: Renumber to be sequential without gaps/duplicates.

#### 2d. Clean up commented-out PlanGuard
**File**: `backend/src/app.module.ts` (lines ~38, 113-117)
**Action**: Either remove commented-out PlanGuard code or add a clear comment why it's disabled.

---

### PRIORITY 3: Dockerfiles

Neither `backend/Dockerfile` nor `frontend/Dockerfile` exist yet. They're needed for `docker-compose.yml` to work.

#### backend/Dockerfile
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/migrations ./migrations
EXPOSE 3010
CMD ["node", "dist/main.js"]
```

#### frontend/Dockerfile
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Also needs `frontend/nginx.conf` for SPA routing:
```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

### PRIORITY 4: Code Quality Tooling

#### 4a. Set up Husky + lint-staged
```bash
cd studyield  # public repo root
npm init -y   # if no root package.json
npx husky init
npm install -D husky lint-staged
```

Add to root `package.json`:
```json
{
  "lint-staged": {
    "backend/src/**/*.ts": ["eslint --fix", "prettier --write"],
    "frontend/src/**/*.{ts,tsx}": ["eslint --fix", "prettier --write"]
  }
}
```

#### 4b. Set up commitlint
```bash
npm install -D @commitlint/cli @commitlint/config-conventional
```
Create `commitlint.config.js`:
```js
module.exports = { extends: ['@commitlint/config-conventional'] };
```

---

### PRIORITY 5: Documentation

#### 5a. Create docs content (currently empty directories exist)

| File to Create | Content |
|----------------|---------|
| `docs/getting-started/quick-start.md` | Step-by-step setup guide (Docker + manual) |
| `docs/getting-started/configuration.md` | All env variables explained with descriptions |
| `docs/architecture/overview.md` | System architecture, module diagram, data flow |
| `docs/guides/connector-guide.md` | How to extend/modify backend modules |

#### 5b. Add module-level README files
None of the 25 backend modules have README files. Each should have a brief doc explaining:
- What the module does
- Key endpoints
- Configuration needed
- Dependencies on other modules

**Modules needing README** (25 total):
`ai`, `analytics`, `auth`, `blog`, `chat`, `clickhouse`, `code-sandbox`, `content`, `database`, `email`, `exam-clone`, `firebase`, `knowledge-base`, `learning-paths`, `notifications`, `problem-solver`, `qdrant`, `queue`, `quiz`, `redis`, `research`, `storage`, `subscription`, `teach-back`, `users`

---

### PRIORITY 6: Mobile Package Name Change

Current package name `com.infoinlet.studyield` references internal company name. Needs changing to `com.studyield.app` or similar.

**Files to update:**
- `mobile/android/app/build.gradle.kts` (lines 9, 24) - namespace and applicationId
- `mobile/android/app/src/main/kotlin/com/infoinlet/studyield/MainActivity.kt` - package declaration + rename directory
- iOS bundle ID references in Xcode project

**Note**: This also requires updating Firebase project config, Google OAuth redirect URIs, and Apple sign-in service IDs.

---

### PRIORITY 7: Translated READMEs

The main README links to 12 translated versions that don't exist yet:
`README_JA.md`, `README_ZH.md`, `README_KO.md`, `README_ES.md`, `README_FR.md`, `README_DE.md`, `README_PT-BR.md`, `README_AR.md`, `README_BN.md`, `README_HI.md`, `README_RU.md`

Can be generated from the English README.

---

### PRIORITY 8: Product Screenshots

The README has a placeholder comment for screenshots:
```html
<!-- TODO: Add product screenshot/GIF here -->
```

Need actual screenshots/GIFs of:
- Dashboard overview
- Exam Clone feature in action
- Problem Solver multi-agent streaming
- Knowledge Graph visualization
- Chat with RAG citations
- Mobile app screens

---

### PRIORITY 9: Frontend Accessibility (a11y)

Only 7 out of 160+ component files have `aria-*` attributes. Needs:
- Install `eslint-plugin-jsx-a11y`
- Add aria-labels to all interactive elements
- Ensure keyboard navigation works
- Add proper heading hierarchy

---

### PRIORITY 10: CI Enhancements

- Add Flutter analysis job to `ci.yml`
- Add code coverage reporting (Codecov)
- Add Docker build verification

---

## Key Files Reference

| File | Purpose | Notes |
|------|---------|-------|
| `OPEN_SOURCE_IMPLEMENTATION.md` | Full tracking plan with all 75 objectives | **Private repo only** |
| `DEVELOPER_BRIEFING.md` | This file - developer instructions | **Private repo only** |
| `README.md` | Public-facing project README | In public repo |
| `CONTRIBUTING.md` | How to contribute | In public repo |
| `CHANGELOG.md` | Version history | In public repo |
| `SECURITY.md` | Security policy | In public repo |
| `docker-compose.yml` | Full stack Docker setup | In public repo |
| `start.sh` | Dev startup script | In public repo |
| `.env.docker` | Docker defaults | In public repo |
| `backend/.env.example` | Backend config template | In public repo |
| `frontend/.env.example` | Frontend config template | In public repo |
| `mobile/.env.example` | Mobile config template | In public repo |
| `.github/workflows/ci.yml` | CI pipeline | In public repo |
| `.github/workflows/deploy.yml` | Production deploy | **Private repo only** |

---

## How to Sync Changes to Public Repo

When open-source improvements are ready:

```bash
# 1. Work in studyield-private, commit to develop
cd /Users/nymulislam/DEVELOP/studyield-private
git checkout develop
# ... make changes, commit ...

# 2. Copy changed files to public repo
rsync -av --exclude='.git' --exclude='node_modules' --exclude='dist' \
  --exclude='.env.production' --exclude='.env.local' --exclude='mobile/.env' \
  --exclude='OPEN_SOURCE_IMPLEMENTATION.md' --exclude='DEVELOPER_BRIEFING.md' \
  --exclude='.github/workflows/deploy.yml' --exclude='mobile/android/app/google-services.json' \
  --exclude='mobile/ios/Runner/GoogleService-Info.plist' \
  /Users/nymulislam/DEVELOP/studyield-private/ /Users/nymulislam/DEVELOP/studyield/

# 3. Commit and push in public repo
cd /Users/nymulislam/DEVELOP/studyield
git add -A
git commit -m "feat: description of changes"
git push origin main
```

---

## Architecture Quick Reference

```
Backend (NestJS): 25 modules, 120+ endpoints, 6 WebSocket namespaces
Frontend (React 19): 24+ pages, 15+ services, 12 languages
Mobile (Flutter): 22 feature modules, 12 languages

Database: PostgreSQL (27 tables, raw SQL - no ORM)
Cache: Redis 7+
Vector: Qdrant (semantic search)
Analytics: ClickHouse
Queue: BullMQ (async jobs)
Storage: Cloudflare R2
AI: OpenRouter (Claude, GPT via unified gateway)
Payments: Stripe
Real-time: Socket.io (6 namespaces: chat, exam-clone, problem-solver, teach-back, research, code-sandbox)
Auth: JWT (access + refresh) + Google OAuth + Apple OAuth
```
