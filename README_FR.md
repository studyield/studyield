<p align="center">
  <a href="https://studyield.com">
    <img src="frontend/public/STUDYIELD2.png" alt="Studyield - Apprenez plus intelligemment avec la préparation aux examens par IA, la résolution de problèmes multi-agents, les graphes de connaissances et plus">
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
  <a href="#démarrage-rapide">Démarrage rapide</a> |
  <a href="https://github.com/studyield/studyield/discussions">Discussions</a> |
  <a href="CONTRIBUTING.md">Contribuer</a>
</p>

<p align="center">
  <a href="./README.md">English</a> |
  <a href="./README_JA.md">日本語</a> |
  <a href="./README_ZH.md">中文</a> |
  <a href="./README_KO.md">한국어</a> |
  <a href="./README_ES.md">Español</a> |
  Français |
  <a href="./README_DE.md">Deutsch</a> |
  <a href="./README_PT-BR.md">Português</a> |
  <a href="./README_AR.md">العربية</a> |
  <a href="./README_BN.md">বাংলা</a> |
  <a href="./README_HI.md">हिन्दी</a> |
  <a href="./README_RU.md">Русский</a>
</p>

---

## Qu'est-ce que Studyield ?

Studyield est une **plateforme d'apprentissage open source alimentée par l'IA** qui aide les étudiants à étudier plus efficacement grâce à du contenu personnalisé, du tutorat intelligent et des évaluations adaptatives. Conçu pour les étudiants, les éducateurs et les apprenants tout au long de la vie, Studyield combine une technologie IA de pointe avec une science de l'apprentissage éprouvée.

Contrairement aux plateformes d'apprentissage traditionnelles qui se concentrent uniquement sur la diffusion de contenu ou aux outils de tutorat IA qui manquent de fonctionnalités d'étude complètes, Studyield vous offre un écosystème d'apprentissage complet avec 6 fonctionnalités IA puissantes, une boîte à outils d'étude complète et un accès multiplateforme.

<p align="center">
  <img src=".github/screenshots/dashboard-home.png" alt="Studyield Dashboard" width="800">
  <br>
  <em>Tableau de bord d'apprentissage alimenté par IA de Studyield</em>
</p>

### Comment ça marche

1. **Téléchargez vos supports** -- Ajoutez des supports d'étude (PDF, documents, examens passés) à votre base de connaissances
2. **L'IA analyse et organise** -- Notre IA extrait les concepts clés, construit des graphes de connaissances et crée des incorporations consultables
3. **Pratiquez et apprenez** -- Générez des examens d'entraînement, résolvez des problèmes avec l'IA multi-agents, testez-vous avec des cartes mémoire
4. **Obtenez des retours** -- Utilisez l'évaluation par rétro-enseignement pour tester votre compréhension et identifier les lacunes de connaissances
5. **Suivez la progression** -- Surveillez votre vitesse d'apprentissage, vos niveaux de maîtrise et vos modèles d'étude avec des analyses

### Capacités clés

- **🎯 Clonage d'examen** -- Téléchargez des examens passés et générez de nouvelles questions d'entraînement dans le même style, difficulté et format
- **🤖 Résolveur de problèmes multi-agents** -- Les agents d'analyse, de solution et de vérification travaillent ensemble pour résoudre des problèmes complexes avec streaming en temps réel
- **🕸️ Graphe de connaissances** -- Extrait automatiquement les entités et relations des supports d'étude en visualisations interactives
- **🎙️ Évaluation par rétro-enseignement** -- Les étudiants expliquent des concepts (texte/voix), l'IA évalue la compréhension en utilisant la Technique Feynman
- **🔬 Mode recherche approfondie** -- RAG à partir de supports téléchargés + recherche web, produit des rapports structurés avec citations
- **💻 Sandbox de code** -- Exécution Python sécurisée avec support NumPy, Pandas et bibliothèques scientifiques
- **📚 Base de connaissances** -- Téléchargez des documents (PDF, DOCX) pour la recherche sémantique et RAG
- **🃏 Cartes mémoire avec SRS** -- Système de répétition espacée pour une mémorisation optimale
- **📝 Quiz générés par IA** -- Génération automatique de quiz à partir des supports d'étude
- **💬 Chat RAG** -- IA conversationnelle avec citations de vos documents
- **🗺️ Parcours d'apprentissage** -- Routes d'étude optimales générées par IA
- **📊 Analyses de progression** -- Suivez le temps d'étude, les niveaux de maîtrise et la vitesse d'apprentissage
- **🌍 12 langues** -- Support i18n complet (EN, JA, ZH, KO, ES, FR, DE, PT, AR, BN, HI, RU)
- **📱 Web + Mobile** -- Frontend React et application mobile Flutter

## Quel problème nous résolvons

### Le dilemme de l'apprentissage moderne

Les étudiants d'aujourd'hui se noient dans l'information mais meurent de faim d'outils d'apprentissage efficaces. Les méthodes d'étude traditionnelles sont chronophages et inefficaces, tandis que les solutions de tutorat IA existantes sont soit trop chères, trop limitées, soit nécessitent de télécharger des données sur des plateformes propriétaires.

**Points de douleur courants que nous abordons :**

- ❌ **Matériel d'entraînement générique** -- Les banques de questions préfabriquées ne correspondent pas à votre style ou difficulté d'examen réel
- ❌ **Outils d'apprentissage isolés** -- Cartes mémoire, quiz et notes dispersés sur plusieurs applications
- ❌ **Pas de vérification de compréhension profonde** -- Impossible de savoir si vous comprenez vraiment ou si vous avez simplement mémorisé
- ❌ **Organisation manuelle des connaissances** -- Des heures perdues à organiser les notes et à connecter les concepts
- ❌ **Tutorat IA limité** -- La plupart des tuteurs IA donnent des réponses sans montrer les étapes de résolution de problèmes ou la vérification
- ❌ **Préoccupations de confidentialité** -- Téléchargement de supports d'étude sur des plateformes à source fermée
- ❌ **Coûts élevés** -- Les outils d'apprentissage IA premium coûtent 20-50$/mois par étudiant

### La solution de Studyield

✅ **Pratique style examen** -- Clonez vos examens réels pour générer des questions d'entraînement parfaitement adaptées

✅ **Plateforme tout-en-un** -- Base de connaissances, cartes mémoire, quiz, chat, recherche et analyses en un seul endroit

✅ **Compréhension profonde** -- L'évaluation par rétro-enseignement et la résolution de problèmes multi-agents assurent une vraie compréhension

✅ **Graphes de connaissances automatiques** -- L'IA extrait et connecte automatiquement les concepts de vos supports

✅ **Fonctionnalités IA avancées** -- Résolution multi-agents, recherche approfondie, exécution de code et streaming en temps réel

✅ **Auto-hébergé et open source** -- Exécutez sur votre propre infrastructure, contrôle total sur vos données

✅ **Gratuit pour commencer** -- Open source avec déploiement Docker, version hébergée optionnelle avec tarification équitable

## Pourquoi Studyield ? (Comparaison)

| Fonctionnalité | Studyield | Quizlet | Anki | ChatGPT | Khan Academy |
|---------|-----------|---------|------|---------|--------------|
| **Clonage d'examen** | ✅ Généré par IA | ❌ | ❌ | ❌ | ❌ |
| **Résolveur de problèmes multi-agents** | ✅ 3 agents + streaming | ❌ | ❌ | ✅ Agent unique | ❌ |
| **Graphes de connaissances** | ✅ Généré automatiquement | ❌ | ❌ | ❌ | ❌ |
| **Évaluation par rétro-enseignement** | ✅ Texte + voix | ❌ | ❌ | ⚠️ Manuel | ❌ |
| **Mode recherche approfondie** | ✅ RAG + web | ❌ | ❌ | ✅ | ❌ |
| **Sandbox de code** | ✅ Exécution sécurisée | ❌ | ❌ | ✅ | ✅ |
| **Cartes mémoire (SRS)** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Chat RAG** | ✅ Avec citations | ❌ | ❌ | ✅ Sans docs | N/A |
| **Parcours d'apprentissage** | ✅ Généré par IA | ❌ | ❌ | ❌ | ✅ Pré-construit |
| **Analyses de progression** | ✅ | ✅ | ⚠️ Basique | ❌ | ✅ |
| **Auto-hébergé** | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Open source** | ✅ Apache 2.0 | ❌ | ✅ AGPL | ❌ | ❌ |
| **Multiplateforme** | ✅ Web + Mobile | ✅ | ✅ | ✅ | ✅ |
| **Courbe d'apprentissage** | 🟢 Faible | 🟢 Faible | 🟡 Moyenne | 🟢 Faible | 🟢 Faible |

### Qu'est-ce qui rend Studyield unique ?

1. **Écosystème d'apprentissage IA complet** -- 6 fonctionnalités IA avancées (clonage d'examen, résolution multi-agents, graphes de connaissances, rétro-enseignement, recherche, sandbox de code) intégrées avec des outils d'étude traditionnels (cartes mémoire, quiz, notes)
2. **Architecture multi-agents** -- Première plateforme d'apprentissage open source avec des agents IA collaboratifs pour la résolution et la vérification de problèmes
3. **Auto-hébergé + Open source** -- Contrôle total sur vos données avec déploiement Docker, contrairement aux plateformes propriétaires
4. **Conception centrée sur l'examen** -- Générez des examens d'entraînement qui correspondent à votre format de test réel, pas des banques de questions génériques
5. **Focus sur la compréhension profonde** -- L'évaluation par rétro-enseignement et la vérification multi-étapes assurent une vraie compréhension, pas seulement la mémorisation

## 📊 Activité du projet et statistiques

Studyield est un projet **activement maintenu** avec une communauté en croissance. Voici ce qui se passe :

### Activité GitHub

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

### Métriques de la communauté

| Métrique | Statut | Détails |
|--------|--------|---------|
| **Total des contributeurs** | ![Contributors](https://img.shields.io/github/contributors/studyield/studyield?style=flat-square) | Communauté de développeurs en croissance |
| **Total des commits** | ![Commits](https://img.shields.io/github/commit-activity/t/studyield/studyield?style=flat-square) | Développement actif depuis 2024 |
| **Commits mensuels** | ![Commit Activity](https://img.shields.io/github/commit-activity/m/studyield/studyield?style=flat-square) | Mises à jour et améliorations régulières |
| **Temps moyen de révision PR** | 24-48 heures | Retour rapide des mainteneurs |
| **Qualité du code** | ![Code Quality](https://img.shields.io/badge/code%20quality-A-brightgreen?style=flat-square) | TypeScript + ESLint + Prettier |
| **Couverture des tests** | ![Coverage](https://img.shields.io/badge/coverage-70%25-green?style=flat-square) | Tests unitaires + intégration backend |
| **Documentation** | ![Docs](https://img.shields.io/badge/docs-comprehensive-blue?style=flat-square) | Documentation API complète + guides développeurs |

### Statistiques de langue et de code

<p align="left">
  <img src="https://img.shields.io/github/languages/top/studyield/studyield?style=for-the-badge&logo=typescript&color=blue" alt="Top Language">
  <img src="https://img.shields.io/github/languages/count/studyield/studyield?style=for-the-badge&color=purple" alt="Language Count">
  <img src="https://img.shields.io/github/repo-size/studyield/studyield?style=for-the-badge&color=orange" alt="Repo Size">
  <img src="https://img.shields.io/github/license/studyield/studyield?style=for-the-badge&color=green" alt="License">
</p>

### Points forts de l'activité récente

- ✅ **Avril 2026** -- Première version open source
- ✅ **27 modules backend** -- auth, ai, content, exam-clone, problem-solver, teach-back, research, code-sandbox et plus
- ✅ **Plus de 120 endpoints API** -- API REST + WebSocket complète
- ✅ **12 langues** -- Support d'internationalisation complet
- ✅ **Support de 3 plateformes** -- Web (React), Mobile (Flutter), API
- ✅ **Déploiement Docker** -- Auto-hébergement en une commande

### Pourquoi ces chiffres comptent

**Développement actif** -- Des commits et mises à jour réguliers signifient que les bugs sont corrigés rapidement et que les fonctionnalités sont ajoutées en fonction des retours de la communauté

**Révisions PR rapides** -- Un temps de révision de 24-48 heures signifie que vos contributions ne resteront pas inactives en attendant l'attention du mainteneur

**Haute qualité du code** -- TypeScript, ESLint, Prettier et tests complets garantissent une base de code stable et maintenable

**Documentation complète** -- Documentation API complète, guides développeurs et commentaires de code rendent l'intégration fluide

**Communauté en croissance** -- Plus de contributeurs signifie plus de fonctionnalités, de meilleurs tests et des perspectives diverses sur l'orientation du produit

### Rejoignez l'activité !

Vous voulez voir vos contributions ici ? Consultez notre [Guide de contribution rapide](#-guide-de-contribution-rapide) ci-dessous !

## Démarrage rapide

### Docker (Recommandé)

Exécutez ces commandes depuis la racine du projet :

```bash
git clone https://github.com/studyield/studyield.git
cd studyield
cp backend/.env.example backend/.env
# Modifiez backend/.env avec vos identifiants de base de données et clé API OpenRouter
docker compose --env-file .env.docker up -d
```

C'est tout ! Accédez à l'application sur `http://localhost:5189` et à l'API sur `http://localhost:3010`.

### Configuration manuelle

**Prérequis :** Node.js 20+, PostgreSQL 15+, Redis 7+

```bash
# Cloner
git clone https://github.com/studyield/studyield.git
cd studyield

# Backend
cd backend
cp .env.example .env    # Modifiez .env avec votre configuration
npm install
npm run migrate
npm run start:dev

# Frontend (dans un nouveau terminal)
cd frontend
cp .env.example .env
npm install
npm run dev
```

Visitez `http://localhost:5189` pour accéder à l'application.

### Démarrage en une commande (Développement)

```bash
./start.sh
```

Cela démarre PostgreSQL, Redis, Qdrant et ClickHouse via Docker, puis lance les serveurs de développement backend et frontend.

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

**Backend** (`/backend`) -- NestJS 10, TypeScript, PostgreSQL (SQL brut), Redis, Qdrant, ClickHouse, BullMQ, Socket.io

## Stack technologique

| Couche | Technologie |
|-------|------------|
| **Backend** | NestJS 10, TypeScript, PostgreSQL (SQL brut), Redis, Qdrant, ClickHouse, BullMQ, Socket.io |
| **Frontend** | React 19, Vite, TypeScript, Tailwind CSS, Radix UI (shadcn), Zustand, React Query, i18next |
| **Mobile** | Flutter 3.10+, Provider + BLoC, Dio, Go Router, Firebase, Easy Localization |
| **IA** | OpenRouter (Claude, GPT, etc.), OpenAI Embeddings, LangChain |
| **Infrastructure** | Docker Compose, Nginx, PM2, GitHub Actions CI/CD |
| **Stockage** | Cloudflare R2, AWS SES, Firebase Cloud Messaging |
| **Paiements** | Stripe (abonnements + webhooks) |

## i18n

Studyield prend en charge 12 langues via i18next (frontend) et Easy Localization (mobile) :

- English, 日本語, 中文, 한국어, Español, Français, Deutsch, Português, العربية, বাংলা, हिन्दी, Русский

Vous souhaitez ajouter une nouvelle langue ? Consultez le [guide de traduction](docs/contributing/translations.md).

## 🚀 Pourquoi contribuer à Studyield ?

Studyield est plus qu'un simple autre projet open source -- c'est une opportunité de construire l'avenir de l'éducation alimentée par l'IA et de rendre l'apprentissage de qualité accessible à des millions d'étudiants dans le monde.

### Ce que vous obtiendrez

**📚 Apprenez un stack technologique moderne**
- **NestJS + TypeScript** -- Architecture backend de niveau entreprise avec injection de dépendances et conception modulaire
- **React 19 + Vite** -- Dernières fonctionnalités React avec builds ultra-rapides
- **Flutter** -- Développement mobile multiplateforme pour iOS et Android
- **Intégration AI/ML** -- Travaillez avec LLM, incorporations, bases de données vectorielles et systèmes multi-agents
- **Systèmes temps réel** -- WebSockets, streaming et architecture événementielle
- **DevOps** -- Docker, CI/CD, auto-hébergement et infrastructure as code

**💼 Construisez votre portfolio**
- Contribuez à une plateforme **prête pour la production** utilisée par des étudiants du monde entier
- Travaillez sur des fonctionnalités qui apparaissent sur votre profil GitHub
- Obtenez une reconnaissance dans notre temple de la renommée des contributeurs
- Développez une expertise en **éducation alimentée par IA** et **EdTech** -- compétences hautement valorisées en 2026

**🤝 Rejoignez une communauté en croissance**
- Connectez-vous avec des développeurs du monde entier
- Obtenez des revues de code de mainteneurs expérimentés
- Apprenez les meilleures pratiques en architecture logicielle
- Participez aux discussions techniques et aux décisions de conception

**🎯 Ayez un impact réel**
- Votre code aidera les étudiants à apprendre plus efficacement et à atteindre leurs objectifs académiques
- Voyez vos fonctionnalités utilisées en environnements de production
- Influencez la direction de l'EdTech open source

**⚡ Intégration rapide**
- Docker Compose vous met en marche en **moins de 5 minutes**
- Base de code bien documentée avec architecture claire
- Mainteneurs sympathiques qui répondent aux PR dans les **24-48 heures**
- Étiquettes "good first issue" pour les débutants

## 🗺️ Feuille de route du projet

Pour des informations détaillées sur ce qui a été terminé, ce qui est en cours et ce que nous prévoyons ensuite, consultez notre **[Objectifs futurs et briefing développeur](FUTURE_GOAL.md)**.

Ce document inclut :
- ✅ Travail de préparation open source terminé
- 🚧 Priorités actuelles (nettoyage du code, configuration Docker, documentation)
- 🔮 Améliorations et fonctionnalités futures

### Comment influencer la feuille de route

💡 **Vous avez des idées ?** Ouvrez une [Discussion GitHub](https://github.com/studyield/studyield/discussions) ou contribuez aux fils existants

🗳️ **Votez pour les fonctionnalités** -- Mettez une étoile sur les problèmes qui vous tiennent à cœur pour nous aider à prioriser

🛠️ **Vous voulez construire quelque chose qui n'est pas listé ?** -- Proposez-le ! Nous adorons les fonctionnalités pilotées par la communauté

## 🎯 Guide de contribution rapide

Commencez à contribuer en **moins de 5 minutes** :

### Étape 1 : Configurez votre environnement

```bash
# Forkez le dépôt sur GitHub, puis clonez votre fork
git clone https://github.com/YOUR_USERNAME/studyield.git
cd studyield

# Commencez avec Docker (moyen le plus facile)
cp backend/.env.example backend/.env
docker compose --env-file .env.docker up -d

# Accédez à l'application
# Frontend : http://localhost:5189
# API Backend : http://localhost:3010
```

**C'est tout !** Vous exécutez Studyield localement.

### Étape 2 : Trouvez quelque chose sur quoi travailler

Choisissez en fonction de votre niveau d'expérience :

**🟢 Adapté aux débutants**
- 📝 [Corrigez les fautes de frappe ou améliorez la documentation](https://github.com/studyield/studyield/issues?q=is%3Aissue+is%3Aopen+label%3Adocumentation)
- 🌍 [Ajoutez des traductions](https://github.com/studyield/studyield/issues?q=is%3Aissue+is%3Aopen+label%3Ai18n) -- Nous prenons en charge 12 langues
- 🐛 [Corrigez les bugs simples](https://github.com/studyield/studyield/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)
- ✨ [Améliorez UI/UX](https://github.com/studyield/studyield/issues?q=is%3Aissue+is%3Aopen+label%3Aui%2Fux)

**🟡 Intermédiaire**
- 🔌 Ajoutez de nouveaux outils ou capacités d'agents IA
- 📊 Améliorez le tableau de bord d'analyse et les visualisations
- 🧪 [Écrivez des tests](https://github.com/studyield/studyield/issues?q=is%3Aissue+is%3Aopen+label%3Atesting)
- 🚀 [Améliorations des performances](https://github.com/studyield/studyield/issues?q=is%3Aissue+is%3Aopen+label%3Aperformance)

**🔴 Avancé**
- 🤖 Construisez de nouvelles fonctionnalités IA (entrée multimodale, raisonnement avancé)
- ⚙️ [Améliorations du moteur central](https://github.com/studyield/studyield/issues?q=is%3Aissue+is%3Aopen+label%3Acore)
- 🏗️ [Améliorations d'architecture](https://github.com/studyield/studyield/issues?q=is%3Aissue+is%3Aopen+label%3Aarchitecture)
- 🔐 [Fonctionnalités de sécurité](https://github.com/studyield/studyield/issues?q=is%3Aissue+is%3Aopen+label%3Asecurity)

### Étape 3 : Effectuez vos modifications

```bash
# Créez une nouvelle branche
git checkout -b feature/your-feature-name

# Effectuez vos modifications
# - Code backend : /backend/src/modules
# - Code frontend : /frontend/src
# - Code mobile : /mobile/lib

# Testez vos modifications
# Backend : cd backend && npm run test
# Frontend : cd frontend && npm run build

# Validez avec un message clair
git commit -m "feat: add voice input support for teach-back"
```

### Étape 4 : Soumettez votre Pull Request

```bash
# Poussez vers votre fork
git push origin feature/your-feature-name

# Ouvrez un PR sur GitHub
# - Décrivez ce que vous avez changé et pourquoi
# - Liez aux problèmes connexes
# - Ajoutez des captures d'écran si c'est un changement UI
```

**Que se passe-t-il ensuite ?**
- ✅ Les tests automatisés s'exécutent sur votre PR
- 👀 Un mainteneur révise votre code (généralement dans les **24-48 heures**)
- 💬 Nous pouvons suggérer des changements ou des améliorations
- 🎉 Une fois approuvé, votre code est fusionné !

### Conseils de contribution

✨ **Commencez petit** -- Votre premier PR n'a pas besoin d'être une fonctionnalité énorme

📖 **Lisez le code** -- Parcourez les modules et composants existants pour référence

❓ **Posez des questions** -- Rejoignez nos [Discussions](https://github.com/studyield/studyield/discussions) si vous êtes bloqué
- 💬 [Discord Community](https://discord.gg/9JEk6WSM) -- Join our Discord server

🧪 **Écrivez des tests** -- Les PR avec tests sont fusionnées plus rapidement

📝 **Documentez votre code** -- Ajoutez des commentaires pour la logique complexe

### Besoin d'aide ?

- 💬 [Discussions GitHub](https://github.com/studyield/studyield/discussions) -- Posez des questions, partagez des idées
- 💬 [Discord Community](https://discord.gg/9JEk6WSM) -- Join our Discord server
- 📖 [Guide de contribution](CONTRIBUTING.md) -- Directives de contribution détaillées
- 🐛 [GitHub Issues](https://github.com/studyield/studyield/issues) -- Signalez des bugs ou demandez des fonctionnalités
- 📧 [Email](mailto:support@studyield.com) -- Contact direct avec les mainteneurs

## Contribuer

Nous accueillons les contributions ! Consultez notre [Guide de contribution](CONTRIBUTING.md) pour commencer.

**Façons de contribuer :**
- Signalez des bugs ou demandez des fonctionnalités via [GitHub Issues](https://github.com/studyield/studyield/issues)
- Soumettez des pull requests pour des corrections de bugs ou de nouvelles fonctionnalités
- Améliorez la documentation
- Ajoutez des traductions (nous prenons en charge 12 langues)

## Contributeurs

Merci à toutes les personnes formidables qui ont contribué à Studyield ! 🎉

<a href="https://github.com/studyield/studyield/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=studyield/studyield&anon=1&max=100&columns=10" />
</a>

Vous voulez voir votre visage ici ? Consultez notre [Guide de contribution](CONTRIBUTING.md) et commencez à contribuer aujourd'hui !

## 💬 Rejoignez notre communauté

Connectez-vous avec des développeurs, obtenez de l'aide et restez informé des derniers développements de Studyield !

<p align="center">
  <a href="https://github.com/studyield/studyield/discussions">
    <img src="https://img.shields.io/badge/GitHub-Discussions-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub Discussions">
  </a>
  <a href="https://twitter.com/studyield">
    <img src="https://img.shields.io/badge/Twitter-Follow%20Us-1DA1F2?style=for-the-badge&logo=twitter&logoColor=white" alt="Twitter">
  </a>
</p>

### Où nous trouver

| Plateforme | Objectif | Lien |
|----------|---------|------|
| 💡 **Discussions GitHub** | Poser des questions, partager des idées, demandes de fonctionnalités | [Démarrer une discussion](https://github.com/studyield/studyield/discussions) |
| 💬 **Discord** | Rejoindre notre communauté, chat en temps réel | [Rejoindre Discord](https://discord.gg/9JEk6WSM) |
| 🐦 **Twitter/X** | Mises à jour produit, annonces, conseils | [@studyield](https://twitter.com/studyield) |
| 📧 **Email** | Contact direct avec les mainteneurs | support@studyield.com |
| 🌐 **Site web** | Documentation, guides, blog | [studyield.com](https://studyield.com) |

### Directives de la communauté

- 🤝 **Soyez respectueux** -- Traitez tout le monde avec respect et gentillesse
- 💡 **Partagez les connaissances** -- Aidez les autres à apprendre et à grandir
- 🐛 **Signalez les problèmes** -- Trouvé un bug ? Faites-le nous savoir sur GitHub Issues
- 🎉 **Célébrez les victoires** -- Partagez vos réussites d'apprentissage et histoires de succès
- 🌍 **Pensez globalement** -- Nous sommes une communauté mondiale avec plus de 12 langues

## Sécurité

Veuillez signaler les vulnérabilités de sécurité de manière responsable. Consultez [SECURITY.md](SECURITY.md) pour notre politique de divulgation.

## Licence

Ce projet est sous licence [Apache License 2.0](LICENSE).

Copyright 2025 Studyield Contributors.

## Remerciements

Construit avec NestJS, React, Flutter, PostgreSQL, Redis, Qdrant, ClickHouse, OpenRouter et de nombreuses autres technologies open source incroyables.

---

<p align="center">
  <a href="https://studyield.com">Site web</a> |
  <a href="https://docs.studyield.com">Documentation</a> |
  <a href="https://github.com/studyield/studyield/discussions">Discussions</a> |
  <a href="https://twitter.com/studyield">Twitter</a>
</p>

---

<p align="center">
  <strong>Construit avec ❤️ par la communauté <a href="https://github.com/studyield">Studyield</a></strong>
</p>

<p align="center">
  Si vous trouvez ce projet utile, pensez à lui donner une étoile ! ⭐
  <br><br>
  <a href="https://github.com/studyield/studyield/stargazers">
    <img src="https://img.shields.io/github/stars/studyield/studyield?style=social" alt="Star on GitHub">
  </a>
</p>
