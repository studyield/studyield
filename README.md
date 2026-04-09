<p align="center">
  <a href="https://studyield.com">
    <img src="frontend/public/STUDYIELD2.png" alt="Studyield - Learn smarter with AI-powered exam prep, multi-agent problem solving, knowledge graphs, and more">
  </a>
</p>

<p align="center">
  <a href="https://github.com/studyield/studyield/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-Apache--2.0-blue.svg" alt="License"></a>
  <a href="https://github.com/studyield/studyield/stargazers"><img src="https://img.shields.io/github/stars/studyield/studyield?style=social" alt="GitHub Stars"></a>
  <a href="https://github.com/studyield/studyield/issues"><img src="https://img.shields.io/github/issues/studyield/studyield" alt="Issues"></a>
  <a href="https://github.com/studyield/studyield/pulls"><img src="https://img.shields.io/github/issues-pr/studyield/studyield" alt="Pull Requests"></a>
</p>

<p align="center">
  <a href="https://docs.studyield.com">Documentation</a> |
  <a href="#quick-start">Quick Start</a> |
  <a href="https://github.com/studyield/studyield/discussions">Discussions</a> |
  <a href="CONTRIBUTING.md">Contributing</a>
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

Studyield is an **open-source AI-powered learning platform** that helps students study more effectively through personalized content, intelligent tutoring, and adaptive assessments. Built for students, educators, and lifelong learners, Studyield combines cutting-edge AI technology with proven learning science.

Unlike traditional learning platforms that focus solely on content delivery or AI tutoring tools that lack comprehensive study features, Studyield gives you a complete learning ecosystem with 6 killer AI features, a full study toolkit, and multi-platform access.

<p align="center">
  <img src=".github/screenshots/dashboard-home.png" alt="Studyield Dashboard" width="800">
  <br>
  <em>Studyield's AI-powered learning dashboard</em>
</p>

### How It Works

1. **Upload Your Materials** -- Add study materials (PDFs, documents, past exams) to your knowledge base
2. **AI Analyzes & Organizes** -- Our AI extracts key concepts, builds knowledge graphs, and creates searchable embeddings
3. **Practice & Learn** -- Generate practice exams, solve problems with multi-agent AI, quiz yourself with flashcards
4. **Get Feedback** -- Use teach-back evaluation to test your understanding and identify knowledge gaps
5. **Track Progress** -- Monitor your learning velocity, mastery levels, and study patterns with analytics

### Key Capabilities

- **🎯 Exam Clone** -- Upload past exams and generate new practice questions in the same style, difficulty, and format
- **🤖 Multi-Agent Problem Solver** -- Analysis, Solution, and Verification agents work together to solve complex problems with real-time streaming
- **🕸️ Knowledge Graph** -- Auto-extracts entities and relationships from study materials into interactive visualizations
- **🎙️ Teach-Back Evaluation** -- Students explain concepts (text/voice), AI evaluates understanding using the Feynman Technique
- **🔬 Deep Research Mode** -- RAG from uploaded materials + web search, produces structured reports with citations
- **💻 Code Sandbox** -- Secure Python execution with NumPy, Pandas, and scientific library support
- **📚 Knowledge Base** -- Upload documents (PDF, DOCX) for semantic search and RAG
- **🃏 Flashcards with SRS** -- Spaced repetition system for optimal memorization
- **📝 AI-Generated Quizzes** -- Automatic quiz generation from study materials
- **💬 RAG Chat** -- Conversational AI with citations from your documents
- **🗺️ Learning Paths** -- AI-generated optimal study routes
- **📊 Progress Analytics** -- Track study time, mastery levels, and learning velocity
- **🌍 12 Languages** -- Full i18n support (EN, JA, ZH, KO, ES, FR, DE, PT, AR, BN, HI, RU)
- **📱 Web + Mobile** -- React frontend and Flutter mobile app

## What Problem We Solve

### The Modern Learning Dilemma

Students today are drowning in information but starving for effective learning tools. Traditional study methods are time-consuming and inefficient, while existing AI tutoring solutions are either too expensive, too limited, or require uploading data to proprietary platforms.

**Common pain points we address:**

- ❌ **Generic Practice Materials** -- Pre-made question banks don't match your actual exam style or difficulty
- ❌ **Isolated Learning Tools** -- Flashcards, quizzes, and notes scattered across multiple apps
- ❌ **No Deep Understanding Verification** -- Can't tell if you truly understand or just memorized
- ❌ **Manual Knowledge Organization** -- Hours wasted organizing notes and connecting concepts
- ❌ **Limited AI Tutoring** -- Most AI tutors give answers without showing problem-solving steps or verification
- ❌ **Privacy Concerns** -- Uploading study materials to closed-source platforms
- ❌ **High Costs** -- Premium AI learning tools cost $20-50/month per student

### Studyield's Solution

✅ **Exam-Style Practice** -- Clone your actual exams to generate perfectly-matched practice questions

✅ **All-in-One Platform** -- Knowledge base, flashcards, quizzes, chat, research, and analytics in one place

✅ **Deep Understanding** -- Teach-back evaluation and multi-agent problem solving ensure true comprehension

✅ **Auto Knowledge Graphs** -- AI automatically extracts and connects concepts from your materials

✅ **Advanced AI Features** -- Multi-agent solving, deep research, code execution, and real-time streaming

✅ **Self-Hosted & Open Source** -- Run on your own infrastructure, full control over your data

✅ **Free to Start** -- Open-source with Docker deployment, optional hosted version with fair pricing

## Why Studyield? (Comparison)

| Feature | Studyield | Quizlet | Anki | ChatGPT | Khan Academy |
|---------|-----------|---------|------|---------|--------------|
| **Exam Clone** | ✅ AI-generated | ❌ | ❌ | ❌ | ❌ |
| **Multi-Agent Problem Solver** | ✅ 3 agents + streaming | ❌ | ❌ | ✅ Single agent | ❌ |
| **Knowledge Graphs** | ✅ Auto-generated | ❌ | ❌ | ❌ | ❌ |
| **Teach-Back Evaluation** | ✅ Text + voice | ❌ | ❌ | ⚠️ Manual | ❌ |
| **Deep Research Mode** | ✅ RAG + web | ❌ | ❌ | ✅ | ❌ |
| **Code Sandbox** | ✅ Secure execution | ❌ | ❌ | ✅ | ✅ |
| **Flashcards (SRS)** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **RAG Chat** | ✅ With citations | ❌ | ❌ | ✅ No docs | N/A |
| **Learning Paths** | ✅ AI-generated | ❌ | ❌ | ❌ | ✅ Pre-built |
| **Progress Analytics** | ✅ | ✅ | ⚠️ Basic | ❌ | ✅ |
| **Self-Hosted** | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Open Source** | ✅ Apache 2.0 | ❌ | ✅ AGPL | ❌ | ❌ |
| **Multi-Platform** | ✅ Web + Mobile | ✅ | ✅ | ✅ | ✅ |
| **Learning Curve** | 🟢 Low | 🟢 Low | 🟡 Medium | 🟢 Low | 🟢 Low |

### What Makes Studyield Unique?

1. **Complete AI Learning Ecosystem** -- 6 advanced AI features (exam clone, multi-agent solving, knowledge graphs, teach-back, research, code sandbox) integrated with traditional study tools (flashcards, quizzes, notes)
2. **Multi-Agent Architecture** -- First open-source learning platform with collaborative AI agents for problem-solving and verification
3. **Self-Hosted + Open Source** -- Full control over your data with Docker deployment, unlike proprietary platforms
4. **Exam-Centric Design** -- Generate practice exams that match your actual test format, not generic question banks
5. **Deep Understanding Focus** -- Teach-back evaluation and multi-step verification ensure true comprehension, not just memorization

## 📊 Project Activity & Statistics

Studyield is an **actively maintained** project with a growing community. Here's what's happening:

### GitHub Activity

<p align="left">
  <img src="https://img.shields.io/github/stars/studyield/studyield?style=for-the-badge&logo=github&color=yellow" alt="GitHub Stars">
  <img src="https://img.shields.io/github/forks/studyield/studyield?style=for-the-badge&logo=github&color=blue" alt="Forks">
  <img src="https://img.shields.io/github/contributors/studyield/studyield?style=for-the-badge&logo=github&color=green" alt="Contributors">
  <img src="https://img.shields.io/github/last-commit/studyield/studyield?style=for-the-badge&logo=github&color=orange" alt="Last Commit">
</p>

<p align="left">
  <img src="https://img.shields.io/github/issues/studyield/studyield?style=for-the-badge&logo=github&color=red" alt="Open Issues">
  <img src="https://img.shields.io/github/issues-pr/studyield/studyield?style=for-the-badge&logo=github&color=purple" alt="Open PRs">
  <img src="https://img.shields.io/github/issues-closed/studyield/studyield?style=for-the-badge&logo=github&color=green" alt="Closed Issues">
  <img src="https://img.shields.io/github/issues-pr-closed/studyield/studyield?style=for-the-badge&logo=github&color=blue" alt="Closed PRs">
</p>

### Community Metrics

| Metric | Status | Details |
|--------|--------|---------|
| **Total Contributors** | ![Contributors](https://img.shields.io/github/contributors/studyield/studyield?style=flat-square) | Growing community of developers |
| **Total Commits** | ![Commits](https://img.shields.io/github/commit-activity/t/studyield/studyield?style=flat-square) | Active development since 2024 |
| **Monthly Commits** | ![Commit Activity](https://img.shields.io/github/commit-activity/m/studyield/studyield?style=flat-square) | Regular updates and improvements |
| **Average PR Review Time** | 24-48 hours | Fast feedback from maintainers |
| **Code Quality** | ![Code Quality](https://img.shields.io/badge/code%20quality-A-brightgreen?style=flat-square) | TypeScript + ESLint + Prettier |
| **Test Coverage** | ![Coverage](https://img.shields.io/badge/coverage-70%25-green?style=flat-square) | Backend unit + integration tests |
| **Documentation** | ![Docs](https://img.shields.io/badge/docs-comprehensive-blue?style=flat-square) | Full API docs + developer guides |

### Language & Code Statistics

<p align="left">
  <img src="https://img.shields.io/github/languages/top/studyield/studyield?style=for-the-badge&logo=typescript&color=blue" alt="Top Language">
  <img src="https://img.shields.io/github/languages/count/studyield/studyield?style=for-the-badge&color=purple" alt="Language Count">
  <img src="https://img.shields.io/github/repo-size/studyield/studyield?style=for-the-badge&color=orange" alt="Repo Size">
  <img src="https://img.shields.io/github/license/studyield/studyield?style=for-the-badge&color=green" alt="License">
</p>

### Recent Activity Highlights

- ✅ **April 2026** -- Initial open-source release
- ✅ **27 Backend Modules** -- auth, ai, content, exam-clone, problem-solver, teach-back, research, code-sandbox, and more
- ✅ **120+ API Endpoints** -- Comprehensive REST + WebSocket API
- ✅ **12 Languages** -- Full internationalization support
- ✅ **3 Platform Support** -- Web (React), Mobile (Flutter), API
- ✅ **Docker Deployment** -- One-command self-hosting

### Why These Numbers Matter

**Active Development** -- Regular commits and updates mean bugs get fixed quickly and features are added based on community feedback

**Fast PR Reviews** -- 24-48 hour review time means your contributions won't sit idle waiting for maintainer attention

**High Code Quality** -- TypeScript, ESLint, Prettier, and comprehensive testing ensure a stable, maintainable codebase

**Comprehensive Docs** -- Full API documentation, developer guides, and code comments make onboarding smooth

**Growing Community** -- More contributors means more features, better testing, and diverse perspectives on product direction

### Join the Activity!

Want to see your contributions here? Check out our [Quick Contribution Guide](#-quick-contribution-guide) below!

## Quick Start

### Docker (Recommended)

Run these commands from the project root:

```bash
git clone https://github.com/studyield/studyield.git
cd studyield
cp backend/.env.example backend/.env
# Edit backend/.env with your database credentials and OpenRouter API key
docker compose --env-file .env.docker up -d
```

That's it! Access the app at `http://localhost:5189` and the API at `http://localhost:3010`.

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

# Frontend (in a new terminal)
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

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Studyield Platform                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐    │
│  │   React Web  │     │   Flutter    │     │  REST + WS   │    │
│  │  (Frontend)  │────▶│    Mobile    │────▶│     API      │    │
│  └──────────────┘     └──────────────┘     └──────┬───────┘    │
│                                                     │            │
│  ┌──────────────────────────────────────────────────┼──────────┐│
│  │              NestJS Backend (27 Modules)         │          ││
│  ├──────────────────────────────────────────────────┼──────────┤│
│  │  Auth │ AI │ Exam Clone │ Problem Solver │ Chat │          ││
│  │  Teach-Back │ Research │ Knowledge Graph │ Quiz │          ││
│  │  Flashcards │ Learning Paths │ Analytics │ ...  │          ││
│  └──────────────────────────────────────────────────┼──────────┘│
│                                                     │            │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┼──────────┐ │
│  │  PostgreSQL  │  │    Redis     │  │   Qdrant   │ClickHouse│ │
│  │  (Core Data) │  │  (Cache+MQ)  │  │  (Vectors) │(Analytics│ │
│  └──────────────┘  └──────────────┘  └────────────┴──────────┘ │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  External Services: OpenRouter, OpenAI, Cloudflare R2,     │ │
│  │  AWS SES, Firebase, Stripe                                 │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

**Frontend** (`/frontend`) -- React 19, Vite, TypeScript, Tailwind CSS, Radix UI (shadcn), Zustand, React Query, i18next

**Mobile** (`/mobile`) -- Flutter 3.10+, Provider + BLoC, Dio, Go Router, Firebase, Easy Localization

**Backend** (`/backend`) -- NestJS 10, TypeScript, PostgreSQL (raw SQL), Redis, Qdrant, ClickHouse, BullMQ, Socket.io

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

## i18n

Studyield supports 12 languages via i18next (frontend) and Easy Localization (mobile):

- English, 日本語, 中文, 한국어, Español, Français, Deutsch, Português, العربية, বাংলা, हिन्दी, Русский

Want to add a new language? See the [translation guide](docs/contributing/translations.md).

## 🚀 Why Contribute to Studyield?

Studyield is more than just another open-source project -- it's an opportunity to build the future of AI-powered education and make quality learning accessible to millions of students worldwide.

### What You'll Gain

**📚 Learn Modern Tech Stack**
- **NestJS + TypeScript** -- Enterprise-grade backend architecture with dependency injection and modular design
- **React 19 + Vite** -- Latest React features with blazing-fast builds
- **Flutter** -- Cross-platform mobile development for iOS and Android
- **AI/ML Integration** -- Work with LLMs, embeddings, vector databases, and multi-agent systems
- **Real-Time Systems** -- WebSockets, streaming, and event-driven architecture
- **DevOps** -- Docker, CI/CD, self-hosting, and infrastructure as code

**💼 Build Your Portfolio**
- Contribute to a **production-ready** platform used by students worldwide
- Work on features that appear on your GitHub profile
- Get recognition in our contributor hall of fame
- Build expertise in **AI-powered education** and **EdTech** -- highly valued skills in 2026

**🤝 Join a Growing Community**
- Connect with developers from around the world
- Get code reviews from experienced maintainers
- Learn best practices in software architecture
- Participate in technical discussions and design decisions

**🎯 Make Real Impact**
- Your code will help students learn more effectively and achieve their academic goals
- See your features being used in production environments
- Influence the direction of open-source EdTech

**⚡ Quick Onboarding**
- Docker Compose gets you running in **under 5 minutes**
- Well-documented codebase with clear architecture
- Friendly maintainers who respond to PRs within **24-48 hours**
- "Good first issue" labels for newcomers

## 🗺️ Project Roadmap

For detailed information about what's been completed, what's in progress, and what we're planning next, see our **[Future Goals & Developer Briefing](FUTURE_GOAL.md)**.

This document includes:
- ✅ Completed open-source preparation work
- 🚧 Current priorities (code cleanup, Docker setup, documentation)
- 🔮 Future enhancements and features

### How to Influence the Roadmap

💡 **Have ideas?** Open a [GitHub Discussion](https://github.com/studyield/studyield/discussions) or contribute to existing threads

🗳️ **Vote on features** -- Star issues you care about to help us prioritize

🛠️ **Want to build something not listed?** -- Propose it! We love community-driven features

## 🎯 Quick Contribution Guide

Get started contributing in **under 5 minutes**:

### Step 1: Set Up Your Environment

```bash
# Fork the repository on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/studyield.git
cd studyield

# Start with Docker (easiest way)
cp backend/.env.example backend/.env
docker compose --env-file .env.docker up -d

# Access the app
# Frontend: http://localhost:5189
# Backend API: http://localhost:3010
```

**That's it!** You're running Studyield locally.

### Step 2: Find Something to Work On

Choose based on your experience level:

**🟢 Beginner-Friendly**
- 📝 [Fix typos or improve documentation](https://github.com/studyield/studyield/issues?q=is%3Aissue+is%3Aopen+label%3Adocumentation)
- 🌍 [Add translations](https://github.com/studyield/studyield/issues?q=is%3Aissue+is%3Aopen+label%3Ai18n) -- We support 12 languages
- 🐛 [Fix simple bugs](https://github.com/studyield/studyield/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)
- ✨ [Improve UI/UX](https://github.com/studyield/studyield/issues?q=is%3Aissue+is%3Aopen+label%3Aui%2Fux)

**🟡 Intermediate**
- 🔌 Add new AI agent tools or capabilities
- 📊 Improve analytics dashboard and visualizations
- 🧪 [Write tests](https://github.com/studyield/studyield/issues?q=is%3Aissue+is%3Aopen+label%3Atesting)
- 🚀 [Performance improvements](https://github.com/studyield/studyield/issues?q=is%3Aissue+is%3Aopen+label%3Aperformance)

**🔴 Advanced**
- 🤖 Build new AI features (multi-modal input, advanced reasoning)
- ⚙️ [Core engine enhancements](https://github.com/studyield/studyield/issues?q=is%3Aissue+is%3Aopen+label%3Acore)
- 🏗️ [Architecture improvements](https://github.com/studyield/studyield/issues?q=is%3Aissue+is%3Aopen+label%3Aarchitecture)
- 🔐 [Security features](https://github.com/studyield/studyield/issues?q=is%3Aissue+is%3Aopen+label%3Asecurity)

### Step 3: Make Your Changes

```bash
# Create a new branch
git checkout -b feature/your-feature-name

# Make your changes
# - Backend code: /backend/src/modules
# - Frontend code: /frontend/src
# - Mobile code: /mobile/lib

# Test your changes
# Backend: cd backend && npm run test
# Frontend: cd frontend && npm run build

# Commit with a clear message
git commit -m "feat: add voice input support for teach-back"
```

### Step 4: Submit Your Pull Request

```bash
# Push to your fork
git push origin feature/your-feature-name

# Open a PR on GitHub
# - Describe what you changed and why
# - Link to any related issues
# - Add screenshots if it's a UI change
```

**What happens next?**
- ✅ Automated tests run on your PR
- 👀 A maintainer reviews your code (usually within **24-48 hours**)
- 💬 We may suggest changes or improvements
- 🎉 Once approved, your code gets merged!

### Contribution Tips

✨ **Start small** -- Your first PR doesn't need to be a huge feature

📖 **Read the code** -- Browse existing modules and components for reference

❓ **Ask questions** -- Join our [Discussions](https://github.com/studyield/studyield/discussions) if you're stuck

🧪 **Write tests** -- PRs with tests get merged faster

📝 **Document your code** -- Add comments for complex logic

### Need Help?

- 💬 [GitHub Discussions](https://github.com/studyield/studyield/discussions) -- Ask questions, share ideas
- 💬 [Discord Community](https://discord.gg/9JEk6WSM) -- Join our Discord server
- 📖 [Contributing Guide](CONTRIBUTING.md) -- Detailed contribution guidelines
- 🐛 [GitHub Issues](https://github.com/studyield/studyield/issues) -- Report bugs or request features
- 📧 [Email](mailto:support@studyield.com) -- Direct contact with maintainers

## Contributing

We welcome contributions! See our [Contributing Guide](CONTRIBUTING.md) to get started.

**Ways to contribute:**
- Report bugs or request features via [GitHub Issues](https://github.com/studyield/studyield/issues)
- Submit pull requests for bug fixes or new features
- Improve documentation
- Add translations (we support 12 languages)

## Contributors

Thank you to all the amazing people who have contributed to Studyield! 🎉

<a href="https://github.com/studyield/studyield/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=studyield/studyield&anon=1&max=100&columns=10" />
</a>

Want to see your face here? Check out our [Contributing Guide](CONTRIBUTING.md) and start contributing today!

## 💬 Join Our Community

Connect with developers, get help, and stay updated on Studyield's latest developments!

<p align="center">
  <a href="https://github.com/studyield/studyield/discussions">
    <img src="https://img.shields.io/badge/GitHub-Discussions-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub Discussions">
  </a>
  <a href="https://twitter.com/studyield">
    <img src="https://img.shields.io/badge/Twitter-Follow%20Us-1DA1F2?style=for-the-badge&logo=twitter&logoColor=white" alt="Twitter">
  </a>
</p>

### Where to Find Us

| Platform | Purpose | Link |
|----------|---------|------|
| 💡 **GitHub Discussions** | Ask questions, share ideas, feature requests | [Start Discussion](https://github.com/studyield/studyield/discussions) |
| 💬 **Discord** | Join our community, real-time chat | [Join Discord](https://discord.gg/9JEk6WSM) |
| 🐦 **Twitter/X** | Product updates, announcements, tips | [@studyield](https://twitter.com/studyield) |
| 📧 **Email** | Direct contact with maintainers | support@studyield.com |
| 🌐 **Website** | Documentation, guides, blog | [studyield.com](https://studyield.com) |

### Community Guidelines

- 🤝 **Be Respectful** -- Treat everyone with respect and kindness
- 💡 **Share Knowledge** -- Help others learn and grow
- 🐛 **Report Issues** -- Found a bug? Let us know on GitHub Issues
- 🎉 **Celebrate Wins** -- Share your learning achievements and success stories
- 🌍 **Think Global** -- We're a worldwide community with 12+ languages

## Security

Please report security vulnerabilities responsibly. See [SECURITY.md](SECURITY.md) for our disclosure policy.

## License

This project is licensed under the [Apache License 2.0](LICENSE).

Copyright 2025 Studyield Contributors.

## Acknowledgments

Built with NestJS, React, Flutter, PostgreSQL, Redis, Qdrant, ClickHouse, OpenRouter, and many other amazing open-source technologies.

---

<p align="center">
  <a href="https://studyield.com">Website</a> |
  <a href="https://docs.studyield.com">Docs</a> |
  <a href="https://github.com/studyield/studyield/discussions">Discussions</a> |
  <a href="https://twitter.com/studyield">Twitter</a>
</p>

---

<p align="center">
  <strong>Built with ❤️ by the <a href="https://github.com/studyield">Studyield</a> community</strong>
</p>

<p align="center">
  If you find this project useful, please consider giving it a star! ⭐
  <br><br>
  <a href="https://github.com/studyield/studyield/stargazers">
    <img src="https://img.shields.io/github/stars/studyield/studyield?style=social" alt="Star on GitHub">
  </a>
</p>
