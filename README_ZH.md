<p align="center">
  <a href="https://studyield.com">
    <img src="frontend/public/STUDYIELD2.png" alt="Studyield - 通过AI驱动的考试准备、多代理问题解决、知识图谱等功能更智能地学习">
  </a>
</p>

<p align="center">
  <a href="https://github.com/studyield/studyield/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-Apache--2.0-blue.svg" alt="License"></a>
  <a href="https://github.com/studyield/studyield/stargazers"><img src="https://img.shields.io/github/stars/studyield/studyield?style=social" alt="GitHub Stars"></a>
  <a href="https://github.com/studyield/studyield/issues"><img src="https://img.shields.io/github/issues/studyield/studyield" alt="Issues"></a>
  <a href="https://github.com/studyield/studyield/pulls"><img src="https://img.shields.io/github/issues-pr/studyield/studyield" alt="Pull Requests"></a>
</p>

<p align="center">
  <a href="https://docs.studyield.com">文档</a> |
  <a href="#快速开始">快速开始</a> |
  <a href="https://github.com/studyield/studyield/discussions">讨论区</a> |
  <a href="CONTRIBUTING.md">贡献指南</a>
</p>

<p align="center">
  <a href="./README.md">English</a> |
  <a href="./README_JA.md">日本語</a> |
  中文 |
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

## 什么是Studyield？

Studyield是一个**开源AI驱动的学习平台**，通过个性化内容、智能辅导和自适应评估帮助学生更有效地学习。为学生、教育工作者和终身学习者而构建，Studyield结合了尖端AI技术和经过验证的学习科学。

与仅专注于内容交付的传统学习平台或缺乏全面学习功能的AI辅导工具不同，Studyield为您提供了一个完整的学习生态系统，拥有6个强大的AI功能、完整的学习工具包和多平台访问。

<!-- TODO: Add product screenshot/GIF here -->
<!-- <p align="center">
  <img src="docs/screenshots/hero.png" alt="Studyield Dashboard">
  <br>
  <em>Studyield的AI驱动学习仪表板</em>
</p> -->

### 工作原理

1. **上传您的材料** -- 将学习材料（PDF、文档、往年试题）添加到您的知识库
2. **AI分析和组织** -- 我们的AI提取关键概念，构建知识图谱，并创建可搜索的嵌入
3. **练习和学习** -- 生成模拟考试，使用多代理AI解决问题，使用闪卡进行自测
4. **获得反馈** -- 使用回教评估来测试您的理解并识别知识差距
5. **跟踪进度** -- 使用分析监控您的学习速度、掌握程度和学习模式

### 核心功能

- **🎯 考试克隆** -- 上传往年试题并生成相同风格、难度和格式的新练习题
- **🤖 多代理问题解决器** -- 分析、解决和验证代理协同工作，实时流式解决复杂问题
- **🕸️ 知识图谱** -- 从学习材料中自动提取实体和关系，形成交互式可视化
- **🎙️ 回教评估** -- 学生解释概念（文本/语音），AI使用费曼技巧评估理解程度
- **🔬 深度研究模式** -- 从上传材料进行RAG + 网络搜索，生成带引用的结构化报告
- **💻 代码沙箱** -- 支持NumPy、Pandas和科学库的安全Python执行
- **📚 知识库** -- 上传文档（PDF、DOCX）进行语义搜索和RAG
- **🃏 间隔重复系统闪卡** -- 用于最佳记忆的间隔重复系统
- **📝 AI生成的测验** -- 从学习材料自动生成测验
- **💬 RAG聊天** -- 带有文档引用的对话式AI
- **🗺️ 学习路径** -- AI生成的最佳学习路线
- **📊 进度分析** -- 跟踪学习时间、掌握程度和学习速度
- **🌍 12种语言** -- 完整的i18n支持（EN、JA、ZH、KO、ES、FR、DE、PT、AR、BN、HI、RU）
- **📱 Web + 移动** -- React前端和Flutter移动应用

## 我们解决的问题

### 现代学习困境

今天的学生在信息中溺水，但缺乏有效的学习工具。传统的学习方法耗时且低效，而现有的AI辅导解决方案要么太昂贵、太有限，要么需要将数据上传到专有平台。

**我们解决的常见痛点：**

- ❌ **通用练习材料** -- 预制题库与您的实际考试风格或难度不匹配
- ❌ **孤立的学习工具** -- 闪卡、测验和笔记分散在多个应用中
- ❌ **没有深度理解验证** -- 无法判断您是真正理解还是只是记忆
- ❌ **手动知识组织** -- 浪费数小时组织笔记和连接概念
- ❌ **有限的AI辅导** -- 大多数AI导师只给出答案而不显示问题解决步骤或验证
- ❌ **隐私问题** -- 将学习材料上传到闭源平台
- ❌ **高成本** -- 高级AI学习工具每个学生每月花费20-50美元

### Studyield的解决方案

✅ **考试风格练习** -- 克隆您的实际考试以生成完美匹配的练习题

✅ **一体化平台** -- 知识库、闪卡、测验、聊天、研究和分析集于一处

✅ **深度理解** -- 回教评估和多代理问题解决确保真正的理解

✅ **自动知识图谱** -- AI自动从您的材料中提取并连接概念

✅ **高级AI功能** -- 多代理解决、深度研究、代码执行和实时流式传输

✅ **自托管和开源** -- 在您自己的基础设施上运行，完全控制您的数据

✅ **免费开始** -- 带有Docker部署的开源，可选的托管版本具有公平定价

## 为什么选择Studyield？（对比）

| 功能 | Studyield | Quizlet | Anki | ChatGPT | Khan Academy |
|---------|-----------|---------|------|---------|--------------|
| **考试克隆** | ✅ AI生成 | ❌ | ❌ | ❌ | ❌ |
| **多代理问题解决器** | ✅ 3个代理 + 流式 | ❌ | ❌ | ✅ 单代理 | ❌ |
| **知识图谱** | ✅ 自动生成 | ❌ | ❌ | ❌ | ❌ |
| **回教评估** | ✅ 文本 + 语音 | ❌ | ❌ | ⚠️ 手动 | ❌ |
| **深度研究模式** | ✅ RAG + Web | ❌ | ❌ | ✅ | ❌ |
| **代码沙箱** | ✅ 安全执行 | ❌ | ❌ | ✅ | ✅ |
| **闪卡（SRS）** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **RAG聊天** | ✅ 带引用 | ❌ | ❌ | ✅ 无文档 | N/A |
| **学习路径** | ✅ AI生成 | ❌ | ❌ | ❌ | ✅ 预建 |
| **进度分析** | ✅ | ✅ | ⚠️ 基础 | ❌ | ✅ |
| **自托管** | ✅ | ❌ | ✅ | ❌ | ❌ |
| **开源** | ✅ Apache 2.0 | ❌ | ✅ AGPL | ❌ | ❌ |
| **多平台** | ✅ Web + 移动 | ✅ | ✅ | ✅ | ✅ |
| **学习曲线** | 🟢 低 | 🟢 低 | 🟡 中等 | 🟢 低 | 🟢 低 |

### Studyield的独特之处是什么？

1. **完整的AI学习生态系统** -- 6个高级AI功能（考试克隆、多代理解决、知识图谱、回教、研究、代码沙箱）与传统学习工具（闪卡、测验、笔记）集成
2. **多代理架构** -- 第一个具有协作AI代理的开源学习平台，用于问题解决和验证
3. **自托管 + 开源** -- 与专有平台不同，通过Docker部署完全控制您的数据
4. **以考试为中心的设计** -- 生成与您实际测试格式匹配的练习考试，而不是通用题库
5. **专注深度理解** -- 回教评估和多步验证确保真正的理解，而不仅仅是记忆

## 📊 项目活动和统计

Studyield是一个**积极维护**的项目，拥有不断增长的社区。以下是正在发生的事情：

### GitHub活动

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

### 社区指标

| 指标 | 状态 | 详情 |
|--------|--------|---------|
| **总贡献者数** | ![Contributors](https://img.shields.io/github/contributors/studyield/studyield?style=flat-square) | 不断增长的开发者社区 |
| **总提交数** | ![Commits](https://img.shields.io/github/commit-activity/t/studyield/studyield?style=flat-square) | 自2024年以来的积极开发 |
| **月度提交数** | ![Commit Activity](https://img.shields.io/github/commit-activity/m/studyield/studyield?style=flat-square) | 定期更新和改进 |
| **平均PR审查时间** | 24-48小时 | 维护者的快速反馈 |
| **代码质量** | ![Code Quality](https://img.shields.io/badge/code%20quality-A-brightgreen?style=flat-square) | TypeScript + ESLint + Prettier |
| **测试覆盖率** | ![Coverage](https://img.shields.io/badge/coverage-70%25-green?style=flat-square) | 后端单元 + 集成测试 |
| **文档** | ![Docs](https://img.shields.io/badge/docs-comprehensive-blue?style=flat-square) | 完整的API文档 + 开发者指南 |

### 语言和代码统计

<p align="left">
  <img src="https://img.shields.io/github/languages/top/studyield/studyield?style=for-the-badge&logo=typescript&color=blue" alt="Top Language">
  <img src="https://img.shields.io/github/languages/count/studyield/studyield?style=for-the-badge&color=purple" alt="Language Count">
  <img src="https://img.shields.io/github/repo-size/studyield/studyield?style=for-the-badge&color=orange" alt="Repo Size">
  <img src="https://img.shields.io/github/license/studyield/studyield?style=for-the-badge&color=green" alt="License">
</p>

### 最近活动亮点

- ✅ **2026年4月** -- 首次开源发布
- ✅ **27个后端模块** -- auth、ai、content、exam-clone、problem-solver、teach-back、research、code-sandbox等
- ✅ **120多个API端点** -- 全面的REST + WebSocket API
- ✅ **12种语言** -- 完整的国际化支持
- ✅ **3个平台支持** -- Web（React）、移动（Flutter）、API
- ✅ **Docker部署** -- 一键自托管

### 这些数字为什么重要

**积极开发** -- 定期提交和更新意味着错误可以快速修复，并根据社区反馈添加功能

**快速PR审查** -- 24-48小时的审查时间意味着您的贡献不会闲置等待维护者关注

**高代码质量** -- TypeScript、ESLint、Prettier和全面的测试确保稳定、可维护的代码库

**全面的文档** -- 完整的API文档、开发者指南和代码注释使入职顺畅

**不断增长的社区** -- 更多贡献者意味着更多功能、更好的测试和对产品方向的多样化观点

### 加入活动！

想在这里看到您的贡献吗？查看下面的[快速贡献指南](#-快速贡献指南)！

## 快速开始

### Docker（推荐）

从项目根目录运行这些命令：

```bash
git clone https://github.com/studyield/studyield.git
cd studyield
cp backend/.env.example backend/.env
# 使用您的数据库凭据和OpenRouter API密钥编辑backend/.env
docker compose --env-file .env.docker up -d
```

就是这样！在`http://localhost:5189`访问应用，在`http://localhost:3010`访问API。

### 手动设置

**先决条件:** Node.js 20+、PostgreSQL 15+、Redis 7+

```bash
# 克隆
git clone https://github.com/studyield/studyield.git
cd studyield

# 后端
cd backend
cp .env.example .env    # 使用您的配置编辑.env
npm install
npm run migrate
npm run start:dev

# 前端（在新终端中）
cd frontend
cp .env.example .env
npm install
npm run dev
```

访问`http://localhost:5189`以访问应用。

### 一键启动（开发）

```bash
./start.sh
```

这将通过Docker启动PostgreSQL、Redis、Qdrant和ClickHouse，然后启动后端和前端开发服务器。

## 架构

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

**前端** (`/frontend`) -- React 19、Vite、TypeScript、Tailwind CSS、Radix UI (shadcn)、Zustand、React Query、i18next

**移动** (`/mobile`) -- Flutter 3.10+、Provider + BLoC、Dio、Go Router、Firebase、Easy Localization

**后端** (`/backend`) -- NestJS 10、TypeScript、PostgreSQL（原始SQL）、Redis、Qdrant、ClickHouse、BullMQ、Socket.io

## 技术栈

| 层 | 技术 |
|-------|------------|
| **后端** | NestJS 10、TypeScript、PostgreSQL（原始SQL）、Redis、Qdrant、ClickHouse、BullMQ、Socket.io |
| **前端** | React 19、Vite、TypeScript、Tailwind CSS、Radix UI (shadcn)、Zustand、React Query、i18next |
| **移动** | Flutter 3.10+、Provider + BLoC、Dio、Go Router、Firebase、Easy Localization |
| **AI** | OpenRouter（Claude、GPT等）、OpenAI Embeddings、LangChain |
| **基础设施** | Docker Compose、Nginx、PM2、GitHub Actions CI/CD |
| **存储** | Cloudflare R2、AWS SES、Firebase Cloud Messaging |
| **支付** | Stripe（订阅 + Webhook） |

## i18n

Studyield通过i18next（前端）和Easy Localization（移动）支持12种语言：

- English、日本語、中文、한국어、Español、Français、Deutsch、Português、العربية、বাংলা、हिन्दी、Русский

想要添加新语言？请参阅[翻译指南](docs/contributing/translations.md)。

## 🚀 为什么要为Studyield做贡献？

Studyield不仅仅是另一个开源项目 -- 这是一个构建AI驱动教育未来并让全球数百万学生获得优质学习的机会。

### 您将获得什么

**📚 学习现代技术栈**
- **NestJS + TypeScript** -- 具有依赖注入和模块化设计的企业级后端架构
- **React 19 + Vite** -- 具有超快构建的最新React功能
- **Flutter** -- iOS和Android的跨平台移动开发
- **AI/ML集成** -- 使用LLM、嵌入、向量数据库和多代理系统
- **实时系统** -- WebSocket、流式传输和事件驱动架构
- **DevOps** -- Docker、CI/CD、自托管和基础设施即代码

**💼 构建您的作品集**
- 为全球学生使用的**生产就绪**平台做出贡献
- 在GitHub个人资料上展示的功能
- 在我们的贡献者名人堂中获得认可
- 在**AI驱动教育**和**EdTech**方面建立专业知识 -- 2026年高度重视的技能

**🤝 加入不断增长的社区**
- 与来自世界各地的开发者联系
- 从经验丰富的维护者那里获得代码审查
- 学习软件架构的最佳实践
- 参与技术讨论和设计决策

**🎯 产生真正的影响**
- 您的代码将帮助学生更有效地学习并实现他们的学业目标
- 在生产环境中看到您的功能被使用
- 影响开源EdTech的方向

**⚡ 快速入职**
- Docker Compose让您在**5分钟内**运行
- 文档齐全的代码库，架构清晰
- 友好的维护者在**24-48小时内**响应PR
- 为新手提供"good first issue"标签

## 🗺️ 项目路线图

有关已完成内容、正在进行的内容和我们接下来计划的内容的详细信息，请参阅我们的**[未来目标和开发者简报](FUTURE_GOAL.md)**。

该文档包括：
- ✅ 已完成的开源准备工作
- 🚧 当前优先事项（代码清理、Docker设置、文档）
- 🔮 未来的增强和功能

### 如何影响路线图

💡 **有想法吗？** 打开[GitHub讨论](https://github.com/studyield/studyield/discussions)或为现有主题做出贡献

🗳️ **为功能投票** -- 为您关心的问题加星以帮助我们确定优先级

🛠️ **想构建未列出的内容吗？** -- 提议它！我们喜欢社区驱动的功能

## 🎯 快速贡献指南

在**5分钟内**开始贡献：

### 步骤1：设置您的环境

```bash
# 在GitHub上fork仓库，然后克隆您的fork
git clone https://github.com/YOUR_USERNAME/studyield.git
cd studyield

# 使用Docker开始（最简单的方法）
cp backend/.env.example backend/.env
docker compose --env-file .env.docker up -d

# 访问应用
# 前端：http://localhost:5189
# 后端API：http://localhost:3010
```

**就是这样！** 您现在正在本地运行Studyield。

### 步骤2：找到要做的事情

根据您的经验水平选择：

**🟢 适合初学者**
- 📝 [修复拼写错误或改进文档](https://github.com/studyield/studyield/issues?q=is%3Aissue+is%3Aopen+label%3Adocumentation)
- 🌍 [添加翻译](https://github.com/studyield/studyield/issues?q=is%3Aissue+is%3Aopen+label%3Ai18n) -- 我们支持12种语言
- 🐛 [修复简单的错误](https://github.com/studyield/studyield/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)
- ✨ [改进UI/UX](https://github.com/studyield/studyield/issues?q=is%3Aissue+is%3Aopen+label%3Aui%2Fux)

**🟡 中级**
- 🔌 添加新的AI代理工具或功能
- 📊 改进分析仪表板和可视化
- 🧪 [编写测试](https://github.com/studyield/studyield/issues?q=is%3Aissue+is%3Aopen+label%3Atesting)
- 🚀 [性能改进](https://github.com/studyield/studyield/issues?q=is%3Aissue+is%3Aopen+label%3Aperformance)

**🔴 高级**
- 🤖 构建新的AI功能（多模态输入、高级推理）
- ⚙️ [核心引擎增强](https://github.com/studyield/studyield/issues?q=is%3Aissue+is%3Aopen+label%3Acore)
- 🏗️ [架构改进](https://github.com/studyield/studyield/issues?q=is%3Aissue+is%3Aopen+label%3Aarchitecture)
- 🔐 [安全功能](https://github.com/studyield/studyield/issues?q=is%3Aissue+is%3Aopen+label%3Asecurity)

### 步骤3：进行更改

```bash
# 创建新分支
git checkout -b feature/your-feature-name

# 进行更改
# - 后端代码：/backend/src/modules
# - 前端代码：/frontend/src
# - 移动代码：/mobile/lib

# 测试您的更改
# 后端：cd backend && npm run test
# 前端：cd frontend && npm run build

# 使用清晰的消息提交
git commit -m "feat: add voice input support for teach-back"
```

### 步骤4：提交您的拉取请求

```bash
# 推送到您的fork
git push origin feature/your-feature-name

# 在GitHub上打开PR
# - 描述您更改了什么以及为什么
# - 链接到任何相关问题
# - 如果是UI更改，请添加屏幕截图
```

**接下来会发生什么？**
- ✅ 自动测试在您的PR上运行
- 👀 维护者审查您的代码（通常在**24-48小时内**）
- 💬 我们可能会建议更改或改进
- 🎉 一旦获得批准，您的代码就会被合并！

### 贡献提示

✨ **从小开始** -- 您的第一个PR不需要是一个巨大的功能

📖 **阅读代码** -- 浏览现有模块和组件以供参考

❓ **提问** -- 如果遇到困难，请加入我们的[讨论](https://github.com/studyield/studyield/discussions)

🧪 **编写测试** -- 带有测试的PR合并更快

📝 **记录您的代码** -- 为复杂逻辑添加注释

### 需要帮助？

- 💬 [GitHub讨论](https://github.com/studyield/studyield/discussions) -- 提问、分享想法
- 📖 [贡献指南](CONTRIBUTING.md) -- 详细的贡献指南
- 🐛 [GitHub Issues](https://github.com/studyield/studyield/issues) -- 报告错误或请求功能
- 📧 [电子邮件](mailto:hello@studyield.com) -- 直接联系维护者

## 贡献

我们欢迎贡献！请参阅我们的[贡献指南](CONTRIBUTING.md)以开始。

**贡献方式：**
- 通过[GitHub Issues](https://github.com/studyield/studyield/issues)报告错误或请求功能
- 提交错误修复或新功能的拉取请求
- 改进文档
- 添加翻译（我们支持12种语言）

## 贡献者

感谢所有为Studyield做出贡献的了不起的人！🎉

<a href="https://github.com/studyield/studyield/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=studyield/studyield&anon=1&max=100&columns=10" />
</a>

想在这里看到您的面孔吗？查看我们的[贡献指南](CONTRIBUTING.md)并立即开始贡献！

## 💬 加入我们的社区

与开发者联系，获得帮助，并了解Studyield的最新发展！

<p align="center">
  <a href="https://github.com/studyield/studyield/discussions">
    <img src="https://img.shields.io/badge/GitHub-Discussions-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub Discussions">
  </a>
  <a href="https://twitter.com/studyield">
    <img src="https://img.shields.io/badge/Twitter-Follow%20Us-1DA1F2?style=for-the-badge&logo=twitter&logoColor=white" alt="Twitter">
  </a>
</p>

### 在哪里找到我们

| 平台 | 目的 | 链接 |
|----------|---------|------|
| 💡 **GitHub讨论** | 提问、分享想法、功能请求 | [开始讨论](https://github.com/studyield/studyield/discussions) |
| 🐦 **Twitter/X** | 产品更新、公告、提示 | [@studyield](https://twitter.com/studyield) |
| 📧 **电子邮件** | 直接联系维护者 | hello@studyield.com |
| 🌐 **网站** | 文档、指南、博客 | [studyield.com](https://studyield.com) |

### 社区准则

- 🤝 **相互尊重** -- 以尊重和善意对待每个人
- 💡 **分享知识** -- 帮助他人学习和成长
- 🐛 **报告问题** -- 发现错误了吗？在GitHub Issues上告诉我们
- 🎉 **庆祝胜利** -- 分享您的学习成就和成功故事
- 🌍 **全球思考** -- 我们是一个拥有12种以上语言的全球社区

## 安全

请负责任地报告安全漏洞。有关我们的披露政策，请参阅[SECURITY.md](SECURITY.md)。

## 许可证

该项目根据[Apache License 2.0](LICENSE)获得许可。

Copyright 2025 Studyield Contributors.

## 致谢

使用NestJS、React、Flutter、PostgreSQL、Redis、Qdrant、ClickHouse、OpenRouter和许多其他出色的开源技术构建。

---

<p align="center">
  <a href="https://studyield.com">网站</a> |
  <a href="https://docs.studyield.com">文档</a> |
  <a href="https://github.com/studyield/studyield/discussions">讨论</a> |
  <a href="https://twitter.com/studyield">Twitter</a>
</p>

---

<p align="center">
  <strong>由<a href="https://github.com/studyield">Studyield</a>社区倾情打造❤️</strong>
</p>

<p align="center">
  如果您觉得这个项目有用，请考虑给它一个星！⭐
  <br><br>
  <a href="https://github.com/studyield/studyield/stargazers">
    <img src="https://img.shields.io/github/stars/studyield/studyield?style=social" alt="Star on GitHub">
  </a>
</p>
