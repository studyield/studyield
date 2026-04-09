<p align="center">
  <a href="https://studyield.com">
    <img src="frontend/public/STUDYIELD2.png" alt="Studyield - Aprenda de forma mais inteligente com preparação de exames com IA, resolução de problemas multi-agente, grafos de conhecimento e mais">
  </a>
</p>

<p align="center">
  <a href="https://github.com/studyield/studyield/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-Apache--2.0-blue.svg" alt="License"></a>
  <a href="https://github.com/studyield/studyield/stargazers"><img src="https://img.shields.io/github/stars/studyield/studyield?style=social" alt="GitHub Stars"></a>
  <a href="https://github.com/studyield/studyield/issues"><img src="https://img.shields.io/github/issues/studyield/studyield" alt="Issues"></a>
  <a href="https://github.com/studyield/studyield/pulls"><img src="https://img.shields.io/github/issues-pr/studyield/studyield" alt="Pull Requests"></a>
</p>

<p align="center">
  <a href="https://docs.studyield.com">Documentação</a> |
  <a href="#início-rápido">Início Rápido</a> |
  <a href="https://github.com/studyield/studyield/discussions">Discussões</a> |
  <a href="CONTRIBUTING.md">Contribuir</a>
</p>

<p align="center">
  <a href="./README.md">English</a> |
  <a href="./README_JA.md">日本語</a> |
  <a href="./README_ZH.md">中文</a> |
  <a href="./README_KO.md">한국어</a> |
  <a href="./README_ES.md">Español</a> |
  <a href="./README_FR.md">Français</a> |
  <a href="./README_DE.md">Deutsch</a> |
  Português |
  <a href="./README_AR.md">العربية</a> |
  <a href="./README_BN.md">বাংলা</a> |
  <a href="./README_HI.md">हिन्दी</a> |
  <a href="./README_RU.md">Русский</a>
</p>

---

## O que é Studyield?

Studyield é uma **plataforma de aprendizagem de código aberto impulsionada por IA** que ajuda estudantes a estudar de forma mais eficaz através de conteúdo personalizado, tutoria inteligente e avaliações adaptativas. Construído para estudantes, educadores e aprendizes ao longo da vida, Studyield combina tecnologia de IA de ponta com ciência de aprendizagem comprovada.

Ao contrário das plataformas de aprendizagem tradicionais que se concentram apenas na entrega de conteúdo ou ferramentas de tutoria de IA que carecem de recursos de estudo abrangentes, Studyield oferece um ecossistema de aprendizagem completo com 6 recursos de IA poderosos, um kit completo de ferramentas de estudo e acesso multiplataforma.

<p align="center">
  <img src=".github/screenshots/dashboard-home.png" alt="Studyield Dashboard" width="800">
  <br>
  <em>Painel de aprendizagem impulsionado por IA do Studyield</em>
</p>

### Como funciona

1. **Envie seus materiais** -- Adicione materiais de estudo (PDFs, documentos, provas antigas) à sua base de conhecimento
2. **IA analisa e organiza** -- Nossa IA extrai conceitos-chave, constrói grafos de conhecimento e cria embeddings pesquisáveis
3. **Pratique e aprenda** -- Gere provas práticas, resolva problemas com IA multi-agente, faça quiz com flashcards
4. **Obtenha feedback** -- Use avaliação de retro-ensino para testar sua compreensão e identificar lacunas de conhecimento
5. **Acompanhe o progresso** -- Monitore sua velocidade de aprendizagem, níveis de domínio e padrões de estudo com análises

### Capacidades principais

- **🎯 Clone de Exame** -- Envie provas antigas e gere novas questões práticas no mesmo estilo, dificuldade e formato
- **🤖 Solucionador de Problemas Multi-Agente** -- Agentes de análise, solução e verificação trabalham juntos para resolver problemas complexos com streaming em tempo real
- **🕸️ Grafo de Conhecimento** -- Extrai automaticamente entidades e relacionamentos de materiais de estudo em visualizações interativas
- **🎙️ Avaliação de Retro-Ensino** -- Estudantes explicam conceitos (texto/voz), IA avalia compreensão usando a Técnica Feynman
- **🔬 Modo de Pesquisa Profunda** -- RAG de materiais enviados + busca web, produz relatórios estruturados com citações
- **💻 Sandbox de Código** -- Execução segura de Python com suporte para NumPy, Pandas e bibliotecas científicas
- **📚 Base de Conhecimento** -- Envie documentos (PDF, DOCX) para busca semântica e RAG
- **🃏 Flashcards com SRS** -- Sistema de repetição espaçada para memorização ideal
- **📝 Quizzes Gerados por IA** -- Geração automática de quizzes a partir de materiais de estudo
- **💬 Chat RAG** -- IA conversacional com citações de seus documentos
- **🗺️ Caminhos de Aprendizagem** -- Rotas de estudo ideais geradas por IA
- **📊 Análises de Progresso** -- Acompanhe tempo de estudo, níveis de domínio e velocidade de aprendizagem
- **🌍 12 Idiomas** -- Suporte completo de i18n (EN, JA, ZH, KO, ES, FR, DE, PT, AR, BN, HI, RU)
- **📱 Web + Móvel** -- Frontend React e aplicativo móvel Flutter

## Que problema resolvemos

### O dilema do aprendizado moderno

Os estudantes de hoje estão se afogando em informações, mas morrendo de fome por ferramentas de aprendizagem eficazes. Os métodos de estudo tradicionais consomem muito tempo e são ineficientes, enquanto as soluções de tutoria de IA existentes são muito caras, muito limitadas ou exigem o envio de dados para plataformas proprietárias.

**Pontos problemáticos comuns que abordamos:**

- ❌ **Materiais de prática genéricos** -- Bancos de questões pré-fabricados não correspondem ao seu estilo ou dificuldade de exame real
- ❌ **Ferramentas de aprendizagem isoladas** -- Flashcards, quizzes e notas espalhados por vários aplicativos
- ❌ **Sem verificação de compreensão profunda** -- Não dá para saber se você realmente entende ou apenas memorizou
- ❌ **Organização manual do conhecimento** -- Horas desperdiçadas organizando notas e conectando conceitos
- ❌ **Tutoria de IA limitada** -- A maioria dos tutores de IA dá respostas sem mostrar etapas de resolução de problemas ou verificação
- ❌ **Preocupações com privacidade** -- Enviar materiais de estudo para plataformas de código fechado
- ❌ **Custos elevados** -- Ferramentas de aprendizagem de IA premium custam $20-50/mês por estudante

### A solução do Studyield

✅ **Prática no estilo do exame** -- Clone suas provas reais para gerar questões práticas perfeitamente adaptadas

✅ **Plataforma tudo-em-um** -- Base de conhecimento, flashcards, quizzes, chat, pesquisa e análises em um só lugar

✅ **Compreensão profunda** -- Avaliação de retro-ensino e resolução de problemas multi-agente garantem compreensão verdadeira

✅ **Grafos de conhecimento automáticos** -- A IA extrai e conecta automaticamente conceitos de seus materiais

✅ **Recursos avançados de IA** -- Resolução multi-agente, pesquisa profunda, execução de código e streaming em tempo real

✅ **Auto-hospedado e código aberto** -- Execute em sua própria infraestrutura, controle total sobre seus dados

✅ **Grátis para começar** -- Código aberto com implantação Docker, versão hospedada opcional com preços justos

## Por que Studyield? (Comparação)

| Recurso | Studyield | Quizlet | Anki | ChatGPT | Khan Academy |
|---------|-----------|---------|------|---------|--------------|
| **Clone de Exame** | ✅ Gerado por IA | ❌ | ❌ | ❌ | ❌ |
| **Solucionador de Problemas Multi-Agente** | ✅ 3 agentes + streaming | ❌ | ❌ | ✅ Agente único | ❌ |
| **Grafos de Conhecimento** | ✅ Gerado automaticamente | ❌ | ❌ | ❌ | ❌ |
| **Avaliação de Retro-Ensino** | ✅ Texto + voz | ❌ | ❌ | ⚠️ Manual | ❌ |
| **Modo de Pesquisa Profunda** | ✅ RAG + web | ❌ | ❌ | ✅ | ❌ |
| **Sandbox de Código** | ✅ Execução segura | ❌ | ❌ | ✅ | ✅ |
| **Flashcards (SRS)** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Chat RAG** | ✅ Com citações | ❌ | ❌ | ✅ Sem docs | N/A |
| **Caminhos de Aprendizagem** | ✅ Gerado por IA | ❌ | ❌ | ❌ | ✅ Pré-construído |
| **Análises de Progresso** | ✅ | ✅ | ⚠️ Básico | ❌ | ✅ |
| **Auto-hospedado** | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Código aberto** | ✅ Apache 2.0 | ❌ | ✅ AGPL | ❌ | ❌ |
| **Multiplataforma** | ✅ Web + Móvel | ✅ | ✅ | ✅ | ✅ |
| **Curva de aprendizagem** | 🟢 Baixa | 🟢 Baixa | 🟡 Média | 🟢 Baixa | 🟢 Baixa |

### O que torna o Studyield único?

1. **Ecossistema de aprendizagem de IA completo** -- 6 recursos avançados de IA (clone de exame, resolução multi-agente, grafos de conhecimento, retro-ensino, pesquisa, sandbox de código) integrados com ferramentas de estudo tradicionais (flashcards, quizzes, notas)
2. **Arquitetura multi-agente** -- Primeira plataforma de aprendizagem de código aberto com agentes de IA colaborativos para resolução e verificação de problemas
3. **Auto-hospedado + Código aberto** -- Controle total sobre seus dados com implantação Docker, ao contrário de plataformas proprietárias
4. **Design centrado em exames** -- Gera provas práticas que correspondem ao seu formato de teste real, não bancos de questões genéricos
5. **Foco em compreensão profunda** -- Avaliação de retro-ensino e verificação de múltiplas etapas garantem compreensão verdadeira, não apenas memorização

## 📊 Atividade do projeto e estatísticas

Studyield é um projeto **mantido ativamente** com uma comunidade em crescimento. Aqui está o que está acontecendo:

### Atividade no GitHub

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

### Métricas da comunidade

| Métrica | Status | Detalhes |
|--------|--------|---------|
| **Total de contribuidores** | ![Contributors](https://img.shields.io/github/contributors/studyield/studyield?style=flat-square) | Comunidade de desenvolvedores em crescimento |
| **Total de commits** | ![Commits](https://img.shields.io/github/commit-activity/t/studyield/studyield?style=flat-square) | Desenvolvimento ativo desde 2024 |
| **Commits mensais** | ![Commit Activity](https://img.shields.io/github/commit-activity/m/studyield/studyield?style=flat-square) | Atualizações e melhorias regulares |
| **Tempo médio de revisão de PR** | 24-48 horas | Feedback rápido dos mantenedores |
| **Qualidade do código** | ![Code Quality](https://img.shields.io/badge/code%20quality-A-brightgreen?style=flat-square) | TypeScript + ESLint + Prettier |
| **Cobertura de testes** | ![Coverage](https://img.shields.io/badge/coverage-70%25-green?style=flat-square) | Testes unitários + integração backend |
| **Documentação** | ![Docs](https://img.shields.io/badge/docs-comprehensive-blue?style=flat-square) | Documentação completa da API + guias para desenvolvedores |

### Estatísticas de linguagem e código

<p align="left">
  <img src="https://img.shields.io/github/languages/top/studyield/studyield?style=for-the-badge&logo=typescript&color=blue" alt="Top Language">
  <img src="https://img.shields.io/github/languages/count/studyield/studyield?style=for-the-badge&color=purple" alt="Language Count">
  <img src="https://img.shields.io/github/repo-size/studyield/studyield?style=for-the-badge&color=orange" alt="Repo Size">
  <img src="https://img.shields.io/github/license/studyield/studyield?style=for-the-badge&color=green" alt="License">
</p>

### Destaques de atividade recente

- ✅ **Abril 2026** -- Primeiro lançamento de código aberto
- ✅ **27 módulos backend** -- auth, ai, content, exam-clone, problem-solver, teach-back, research, code-sandbox e mais
- ✅ **Mais de 120 endpoints de API** -- API REST + WebSocket abrangente
- ✅ **12 idiomas** -- Suporte completo de internacionalização
- ✅ **Suporte para 3 plataformas** -- Web (React), Móvel (Flutter), API
- ✅ **Implantação Docker** -- Auto-hospedagem com um comando

### Por que esses números importam

**Desenvolvimento ativo** -- Commits e atualizações regulares significam que bugs são corrigidos rapidamente e recursos são adicionados com base no feedback da comunidade

**Revisões rápidas de PR** -- Tempo de revisão de 24-48 horas significa que suas contribuições não ficarão ociosas esperando a atenção do mantenedor

**Alta qualidade do código** -- TypeScript, ESLint, Prettier e testes abrangentes garantem uma base de código estável e mantida

**Documentação abrangente** -- Documentação completa da API, guias para desenvolvedores e comentários de código tornam a integração suave

**Comunidade em crescimento** -- Mais contribuidores significa mais recursos, melhores testes e perspectivas diversas sobre a direção do produto

### Participe da atividade!

Quer ver suas contribuições aqui? Confira nosso [Guia Rápido de Contribuição](#-guia-rápido-de-contribuição) abaixo!

## Início rápido

### Docker (Recomendado)

Execute estes comandos a partir da raiz do projeto:

```bash
git clone https://github.com/studyield/studyield.git
cd studyield
cp backend/.env.example backend/.env
# Edite backend/.env com suas credenciais de banco de dados e chave API OpenRouter
docker compose --env-file .env.docker up -d
```

É isso! Acesse o aplicativo em `http://localhost:5189` e a API em `http://localhost:3010`.

### Configuração manual

**Pré-requisitos:** Node.js 20+, PostgreSQL 15+, Redis 7+

```bash
# Clonar
git clone https://github.com/studyield/studyield.git
cd studyield

# Backend
cd backend
cp .env.example .env    # Edite .env com sua configuração
npm install
npm run migrate
npm run start:dev

# Frontend (em um novo terminal)
cd frontend
cp .env.example .env
npm install
npm run dev
```

Visite `http://localhost:5189` para acessar o aplicativo.

### Início com um comando (Desenvolvimento)

```bash
./start.sh
```

Isso inicia PostgreSQL, Redis, Qdrant e ClickHouse via Docker, depois lança os servidores de desenvolvimento backend e frontend.

## Arquitetura

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

**Móvel** (`/mobile`) -- Flutter 3.10+, Provider + BLoC, Dio, Go Router, Firebase, Easy Localization

**Backend** (`/backend`) -- NestJS 10, TypeScript, PostgreSQL (SQL puro), Redis, Qdrant, ClickHouse, BullMQ, Socket.io

## Stack tecnológico

| Camada | Tecnologia |
|-------|------------|
| **Backend** | NestJS 10, TypeScript, PostgreSQL (SQL puro), Redis, Qdrant, ClickHouse, BullMQ, Socket.io |
| **Frontend** | React 19, Vite, TypeScript, Tailwind CSS, Radix UI (shadcn), Zustand, React Query, i18next |
| **Móvel** | Flutter 3.10+, Provider + BLoC, Dio, Go Router, Firebase, Easy Localization |
| **IA** | OpenRouter (Claude, GPT, etc.), OpenAI Embeddings, LangChain |
| **Infraestrutura** | Docker Compose, Nginx, PM2, GitHub Actions CI/CD |
| **Armazenamento** | Cloudflare R2, AWS SES, Firebase Cloud Messaging |
| **Pagamentos** | Stripe (assinaturas + webhooks) |

## i18n

Studyield suporta 12 idiomas via i18next (frontend) e Easy Localization (móvel):

- English, 日本語, 中文, 한국어, Español, Français, Deutsch, Português, العربية, বাংলা, हिन्दी, Русский

Quer adicionar um novo idioma? Veja o [guia de tradução](docs/contributing/translations.md).

## 🚀 Por que contribuir para o Studyield?

Studyield é mais do que apenas outro projeto de código aberto -- é uma oportunidade de construir o futuro da educação impulsionada por IA e tornar o aprendizado de qualidade acessível a milhões de estudantes em todo o mundo.

### O que você ganhará

**📚 Aprenda stack tecnológico moderno**
- **NestJS + TypeScript** -- Arquitetura backend de nível empresarial com injeção de dependências e design modular
- **React 19 + Vite** -- Recursos mais recentes do React com builds ultrarrápidos
- **Flutter** -- Desenvolvimento móvel multiplataforma para iOS e Android
- **Integração AI/ML** -- Trabalhe com LLMs, embeddings, bancos de dados vetoriais e sistemas multi-agente
- **Sistemas em tempo real** -- WebSockets, streaming e arquitetura orientada a eventos
- **DevOps** -- Docker, CI/CD, auto-hospedagem e infraestrutura como código

**💼 Construa seu portfólio**
- Contribua para uma plataforma **pronta para produção** usada por estudantes em todo o mundo
- Trabalhe em recursos que aparecem em seu perfil do GitHub
- Obtenha reconhecimento em nosso salão da fama de contribuidores
- Construa experiência em **educação impulsionada por IA** e **EdTech** -- habilidades altamente valorizadas em 2026

**🤝 Junte-se a uma comunidade em crescimento**
- Conecte-se com desenvolvedores de todo o mundo
- Obtenha revisões de código de mantenedores experientes
- Aprenda as melhores práticas em arquitetura de software
- Participe de discussões técnicas e decisões de design

**🎯 Faça um impacto real**
- 💬 [Discord Community](https://discord.gg/9JEk6WSM) -- Join our Discord server
- Seu código ajudará estudantes a aprender de forma mais eficaz e alcançar seus objetivos acadêmicos
- Veja seus recursos sendo usados em ambientes de produção
- Influencie a direção do EdTech de código aberto

**⚡ Integração rápida**
- Docker Compose coloca você em funcionamento em **menos de 5 minutos**
- Base de código bem documentada com arquitetura clara
- Mantenedores amigáveis que respondem a PRs dentro de **24-48 horas**
- Etiquetas "good first issue" para iniciantes

## 🗺️ Roteiro do projeto

Para informações detalhadas sobre o que foi concluído, o que está em andamento e o que planejamos a seguir, veja nosso **[Objetivos Futuros e Briefing para Desenvolvedores](FUTURE_GOAL.md)**.

Este documento inclui:
- ✅ Trabalho de preparação de código aberto concluído
- 🚧 Prioridades atuais (limpeza de código, configuração do Docker, documentação)
- 🔮 Melhorias e recursos futuros

### Como influenciar o roteiro

💡 **Tem ideias?** Abra uma [Discussão no GitHub](https://github.com/studyield/studyield/discussions) ou contribua para threads existentes

🗳️ **Vote em recursos** -- Marque com estrela as issues que você se importa para nos ajudar a priorizar

🛠️ **Quer construir algo que não está listado?** -- Proponha! Adoramos recursos impulsionados pela comunidade

## 🎯 Guia rápido de contribuição

Comece a contribuir em **menos de 5 minutos**:

### Passo 1: Configure seu ambiente

```bash
# Faça fork do repositório no GitHub, depois clone seu fork
- 💬 [Discord Community](https://discord.gg/9JEk6WSM) -- Join our Discord server
git clone https://github.com/YOUR_USERNAME/studyield.git
cd studyield

# Comece com Docker (maneira mais fácil)
cp backend/.env.example backend/.env
docker compose --env-file .env.docker up -d

# Acesse o aplicativo
# Frontend: http://localhost:5189
# API Backend: http://localhost:3010
```

**É isso!** Você está executando o Studyield localmente.

### Passo 2: Encontre algo para trabalhar

Escolha com base em seu nível de experiência:

**🟢 Amigável para iniciantes**
- 📝 [Corrija erros de digitação ou melhore a documentação](https://github.com/studyield/studyield/issues?q=is%3Aissue+is%3Aopen+label%3Adocumentation)
- 🌍 [Adicione traduções](https://github.com/studyield/studyield/issues?q=is%3Aissue+is%3Aopen+label%3Ai18n) -- Suportamos 12 idiomas
- 🐛 [Corrija bugs simples](https://github.com/studyield/studyield/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)
- ✨ [Melhore UI/UX](https://github.com/studyield/studyield/issues?q=is%3Aissue+is%3Aopen+label%3Aui%2Fux)

**🟡 Intermediário**
- 🔌 Adicione novas ferramentas ou capacidades de agentes de IA
- 📊 Melhore o painel de análises e visualizações
- 🧪 [Escreva testes](https://github.com/studyield/studyield/issues?q=is%3Aissue+is%3Aopen+label%3Atesting)
- 🚀 [Melhorias de desempenho](https://github.com/studyield/studyield/issues?q=is%3Aissue+is%3Aopen+label%3Aperformance)

**🔴 Avançado**
- 🤖 Construa novos recursos de IA (entrada multimodal, raciocínio avançado)
- ⚙️ [Melhorias do motor central](https://github.com/studyield/studyield/issues?q=is%3Aissue+is%3Aopen+label%3Acore)
- 🏗️ [Melhorias de arquitetura](https://github.com/studyield/studyield/issues?q=is%3Aissue+is%3Aopen+label%3Aarchitecture)
- 🔐 [Recursos de segurança](https://github.com/studyield/studyield/issues?q=is%3Aissue+is%3Aopen+label%3Asecurity)

### Passo 3: Faça suas alterações
- 💬 [Discord Community](https://discord.gg/9JEk6WSM) -- Join our Discord server

```bash
# Crie um novo branch
git checkout -b feature/your-feature-name

# Faça suas alterações
- 💬 [Discord Community](https://discord.gg/9JEk6WSM) -- Join our Discord server
# - Código backend: /backend/src/modules
# - Código frontend: /frontend/src
# - Código móvel: /mobile/lib

# Teste suas alterações
# Backend: cd backend && npm run test
# Frontend: cd frontend && npm run build

# Commit com uma mensagem clara
git commit -m "feat: add voice input support for teach-back"
```

### Passo 4: Envie seu Pull Request

```bash
# Envie para seu fork
git push origin feature/your-feature-name

# Abra um PR no GitHub
# - Descreva o que você mudou e por quê
# - Link para issues relacionadas
# - Adicione screenshots se for uma mudança de UI
```

**O que acontece a seguir?**
- ✅ Testes automatizados são executados em seu PR
- 👀 Um mantenedor revisa seu código (geralmente dentro de **24-48 horas**)
- 💬 Podemos sugerir mudanças ou melhorias
- 🎉 Uma vez aprovado, seu código é mesclado!

### Dicas de contribuição

✨ **Comece pequeno** -- Seu primeiro PR não precisa ser um recurso enorme

📖 **Leia o código** -- Navegue pelos módulos e componentes existentes para referência

❓ **Faça perguntas** -- Participe de nossas [Discussões](https://github.com/studyield/studyield/discussions) se estiver preso
- 💬 [Discord Community](https://discord.gg/9JEk6WSM) -- Join our Discord server

🧪 **Escreva testes** -- PRs com testes são mesclados mais rapidamente

📝 **Documente seu código** -- Adicione comentários para lógica complexa

### Precisa de ajuda?

- 💬 [Discussões no GitHub](https://github.com/studyield/studyield/discussions) -- Faça perguntas, compartilhe ideias
- 💬 [Discord Community](https://discord.gg/9JEk6WSM) -- Join our Discord server
- 📖 [Guia de Contribuição](CONTRIBUTING.md) -- Diretrizes detalhadas de contribuição
- 🐛 [GitHub Issues](https://github.com/studyield/studyield/issues) -- Relate bugs ou solicite recursos
- 📧 [E-mail](mailto:support@studyield.com) -- Contato direto com mantenedores

## Contribuindo

Damos as boas-vindas a contribuições! Veja nosso [Guia de Contribuição](CONTRIBUTING.md) para começar.

**Formas de contribuir:**
- Relate bugs ou solicite recursos via [GitHub Issues](https://github.com/studyield/studyield/issues)
- Envie pull requests para correções de bugs ou novos recursos
- Melhore a documentação
- Adicione traduções (suportamos 12 idiomas)

## Contribuidores

Obrigado a todas as pessoas incríveis que contribuíram para o Studyield! 🎉

<a href="https://github.com/studyield/studyield/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=studyield/studyield&anon=1&max=100&columns=10" />
</a>

Quer ver seu rosto aqui? Confira nosso [Guia de Contribuição](CONTRIBUTING.md) e comece a contribuir hoje!

## 💬 Junte-se à nossa comunidade

Conecte-se com desenvolvedores, obtenha ajuda e fique atualizado sobre os últimos desenvolvimentos do Studyield!

<p align="center">
  <a href="https://github.com/studyield/studyield/discussions">
    <img src="https://img.shields.io/badge/GitHub-Discussions-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub Discussions">
  </a>
  <a href="https://twitter.com/studyield">
    <img src="https://img.shields.io/badge/Twitter-Follow%20Us-1DA1F2?style=for-the-badge&logo=twitter&logoColor=white" alt="Twitter">
  </a>
</p>

### Onde nos encontrar

| Plataforma | Propósito | Link |
|----------|---------|------|
| 💡 **Discussões no GitHub** | Fazer perguntas, compartilhar ideias, solicitações de recursos | [Iniciar Discussão](https://github.com/studyield/studyield/discussions) |
| 💬 **Discord** | Junte-se à nossa comunidade, chat em tempo real | [Entrar no Discord](https://discord.gg/9JEk6WSM) |
| 🐦 **Twitter/X** | Atualizações de produtos, anúncios, dicas | [@studyield](https://twitter.com/studyield) |
| 📧 **E-mail** | Contato direto com mantenedores | support@studyield.com |
| 🌐 **Website** | Documentação, guias, blog | [studyield.com](https://studyield.com) |

### Diretrizes da comunidade

- 🤝 **Seja respeitoso** -- Trate todos com respeito e gentileza
- 💡 **Compartilhe conhecimento** -- Ajude outros a aprender e crescer
- 🐛 **Relate problemas** -- Encontrou um bug? Nos avise no GitHub Issues
- 🎉 **Celebre vitórias** -- Compartilhe suas conquistas de aprendizado e histórias de sucesso
- 🌍 **Pense globalmente** -- Somos uma comunidade mundial com mais de 12 idiomas

## Segurança

Por favor, relate vulnerabilidades de segurança de forma responsável. Veja [SECURITY.md](SECURITY.md) para nossa política de divulgação.

## Licença

Este projeto está licenciado sob a [Licença Apache 2.0](LICENSE).

Copyright 2025 Studyield Contributors.

## Agradecimentos

Construído com NestJS, React, Flutter, PostgreSQL, Redis, Qdrant, ClickHouse, OpenRouter e muitas outras tecnologias de código aberto incríveis.

---

<p align="center">
  <a href="https://studyield.com">Website</a> |
  <a href="https://docs.studyield.com">Documentação</a> |
  <a href="https://github.com/studyield/studyield/discussions">Discussões</a> |
  <a href="https://twitter.com/studyield">Twitter</a>
</p>

---

<p align="center">
  <strong>Construído com ❤️ pela comunidade <a href="https://github.com/studyield">Studyield</a></strong>
</p>

<p align="center">
  Se você achar este projeto útil, considere dar uma estrela! ⭐
  <br><br>
  <a href="https://github.com/studyield/studyield/stargazers">
    <img src="https://img.shields.io/github/stars/studyield/studyield?style=social" alt="Star on GitHub">
  </a>
</p>
