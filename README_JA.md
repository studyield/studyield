<p align="center">
  <a href="https://studyield.com">
    <img src="frontend/public/STUDYIELD2.png" alt="Studyield - AIを活用した試験対策、マルチエージェント問題解決、知識グラフなどでよりスマートに学習">
  </a>
</p>

<p align="center">
  <a href="https://github.com/studyield/studyield/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-Apache--2.0-blue.svg" alt="License"></a>
  <a href="https://github.com/studyield/studyield/stargazers"><img src="https://img.shields.io/github/stars/studyield/studyield?style=social" alt="GitHub Stars"></a>
  <a href="https://github.com/studyield/studyield/issues"><img src="https://img.shields.io/github/issues/studyield/studyield" alt="Issues"></a>
  <a href="https://github.com/studyield/studyield/pulls"><img src="https://img.shields.io/github/issues-pr/studyield/studyield" alt="Pull Requests"></a>
</p>

<p align="center">
  <a href="https://docs.studyield.com">ドキュメント</a> |
  <a href="#クイックスタート">クイックスタート</a> |
  <a href="https://github.com/studyield/studyield/discussions">ディスカッション</a> |
  <a href="CONTRIBUTING.md">コントリビューション</a>
</p>

<p align="center">
  <a href="./README.md">English</a> |
  日本語 |
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

## Studyieldとは？

Studyieldは、パーソナライズされたコンテンツ、インテリジェントな個別指導、適応型評価を通じて、学生がより効果的に学習できるよう支援する**オープンソースのAI搭載学習プラットフォーム**です。学生、教育者、生涯学習者向けに構築されたStudyieldは、最先端のAI技術と実証済みの学習科学を組み合わせています。

コンテンツ配信のみに焦点を当てた従来の学習プラットフォームや、包括的な学習機能を欠くAI個別指導ツールとは異なり、Studyieldは6つの強力なAI機能、完全な学習ツールキット、マルチプラットフォームアクセスを備えた完全な学習エコシステムを提供します。

<!-- TODO: Add product screenshot/GIF here -->
<!-- <p align="center">
  <img src="docs/screenshots/hero.png" alt="Studyield Dashboard">
  <br>
  <em>StudyieldのAI搭載学習ダッシュボード</em>
</p> -->

### 仕組み

1. **教材をアップロード** -- 学習教材（PDF、ドキュメント、過去問）を知識ベースに追加
2. **AIが分析・整理** -- AIが主要概念を抽出し、知識グラフを構築し、検索可能な埋め込みを作成
3. **練習と学習** -- 模擬試験を生成し、マルチエージェントAIで問題を解決し、フラッシュカードでクイズ
4. **フィードバックを取得** -- ティーチバック評価を使用して理解度をテストし、知識のギャップを特定
5. **進捗を追跡** -- 分析を使用して学習速度、習熟度レベル、学習パターンを監視

### 主要機能

- **🎯 試験クローン** -- 過去問をアップロードし、同じスタイル、難易度、形式で新しい練習問題を生成
- **🤖 マルチエージェント問題解決** -- 分析、解決、検証エージェントが連携して複雑な問題をリアルタイムストリーミングで解決
- **🕸️ 知識グラフ** -- 学習教材からエンティティと関係を自動抽出してインタラクティブな可視化を実現
- **🎙️ ティーチバック評価** -- 学生が概念を説明（テキスト/音声）し、AIがファインマンテクニックを使用して理解度を評価
- **🔬 ディープリサーチモード** -- アップロードされた資料からのRAG + Web検索で、引用付きの構造化レポートを作成
- **💻 コードサンドボックス** -- NumPy、Pandas、科学ライブラリをサポートする安全なPython実行
- **📚 知識ベース** -- セマンティック検索とRAGのためのドキュメント（PDF、DOCX）のアップロード
- **🃏 間隔反復システム付きフラッシュカード** -- 最適な記憶のための間隔反復システム
- **📝 AI生成クイズ** -- 学習教材からの自動クイズ生成
- **💬 RAGチャット** -- ドキュメントからの引用を含む会話型AI
- **🗺️ 学習パス** -- AI生成の最適な学習ルート
- **📊 進捗分析** -- 学習時間、習熟度レベル、学習速度を追跡
- **🌍 12言語対応** -- 完全なi18nサポート（EN、JA、ZH、KO、ES、FR、DE、PT、AR、BN、HI、RU）
- **📱 Web + モバイル** -- Reactフロントエンドとモバイルアプリ

## 解決する問題

### 現代の学習のジレンマ

今日の学生は情報に溺れている一方で、効果的な学習ツールには飢えています。従来の学習方法は時間がかかり非効率的であり、既存のAI個別指導ソリューションは高価すぎるか、制限が多すぎるか、データを独自プラットフォームにアップロードする必要があります。

**私たちが対処する一般的な問題点：**

- ❌ **汎用的な練習教材** -- 既製の問題バンクは実際の試験スタイルや難易度と一致しない
- ❌ **孤立した学習ツール** -- フラッシュカード、クイズ、ノートが複数のアプリに散在
- ❌ **深い理解の検証なし** -- 真に理解しているのか、単に暗記しているのかを判断できない
- ❌ **手動の知識整理** -- ノートの整理や概念の関連付けに何時間も無駄にする
- ❌ **制限されたAI個別指導** -- ほとんどのAI個別指導は問題解決ステップや検証を示さずに答えを提供
- ❌ **プライバシーの懸念** -- クローズドソースプラットフォームへの学習教材のアップロード
- ❌ **高コスト** -- プレミアムAI学習ツールは学生1人あたり月額20〜50ドル

### Studyieldのソリューション

✅ **試験スタイルの練習** -- 実際の試験をクローンして完全に一致する練習問題を生成

✅ **オールインワンプラットフォーム** -- 知識ベース、フラッシュカード、クイズ、チャット、リサーチ、分析を一箇所に

✅ **深い理解** -- ティーチバック評価とマルチエージェント問題解決により真の理解を保証

✅ **自動知識グラフ** -- AIが教材から概念を自動的に抽出して接続

✅ **高度なAI機能** -- マルチエージェント解決、ディープリサーチ、コード実行、リアルタイムストリーミング

✅ **セルフホスト＆オープンソース** -- 独自のインフラストラクチャで実行、データを完全に制御

✅ **無料で開始** -- Docker展開のオープンソース、公正な価格設定のオプションのホスト版

## なぜStudyieldか？（比較）

| 機能 | Studyield | Quizlet | Anki | ChatGPT | Khan Academy |
|---------|-----------|---------|------|---------|--------------|
| **試験クローン** | ✅ AI生成 | ❌ | ❌ | ❌ | ❌ |
| **マルチエージェント問題解決** | ✅ 3エージェント + ストリーミング | ❌ | ❌ | ✅ シングルエージェント | ❌ |
| **知識グラフ** | ✅ 自動生成 | ❌ | ❌ | ❌ | ❌ |
| **ティーチバック評価** | ✅ テキスト + 音声 | ❌ | ❌ | ⚠️ 手動 | ❌ |
| **ディープリサーチモード** | ✅ RAG + Web | ❌ | ❌ | ✅ | ❌ |
| **コードサンドボックス** | ✅ 安全な実行 | ❌ | ❌ | ✅ | ✅ |
| **フラッシュカード（SRS）** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **RAGチャット** | ✅ 引用付き | ❌ | ❌ | ✅ ドキュメントなし | N/A |
| **学習パス** | ✅ AI生成 | ❌ | ❌ | ❌ | ✅ 事前構築 |
| **進捗分析** | ✅ | ✅ | ⚠️ 基本 | ❌ | ✅ |
| **セルフホスト** | ✅ | ❌ | ✅ | ❌ | ❌ |
| **オープンソース** | ✅ Apache 2.0 | ❌ | ✅ AGPL | ❌ | ❌ |
| **マルチプラットフォーム** | ✅ Web + モバイル | ✅ | ✅ | ✅ | ✅ |
| **学習曲線** | 🟢 低い | 🟢 低い | 🟡 中程度 | 🟢 低い | 🟢 低い |

### Studyieldのユニークな点は？

1. **完全なAI学習エコシステム** -- 6つの高度なAI機能（試験クローン、マルチエージェント解決、知識グラフ、ティーチバック、リサーチ、コードサンドボックス）を従来の学習ツール（フラッシュカード、クイズ、ノート）と統合
2. **マルチエージェントアーキテクチャ** -- 問題解決と検証のための協調AIエージェントを備えた初のオープンソース学習プラットフォーム
3. **セルフホスト + オープンソース** -- 独自プラットフォームとは異なり、Docker展開によるデータの完全な制御
4. **試験中心の設計** -- 汎用的な問題バンクではなく、実際のテスト形式に一致する練習試験を生成
5. **深い理解に焦点** -- ティーチバック評価と複数ステップの検証により、単なる暗記ではなく真の理解を保証

## 📊 プロジェクトの活動と統計

Studyieldは**積極的にメンテナンスされている**プロジェクトで、成長しているコミュニティがあります。現在の状況は以下の通りです：

### GitHub活動

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

### コミュニティメトリクス

| メトリック | ステータス | 詳細 |
|--------|--------|---------|
| **総コントリビューター数** | ![Contributors](https://img.shields.io/github/contributors/studyield/studyield?style=flat-square) | 成長中の開発者コミュニティ |
| **総コミット数** | ![Commits](https://img.shields.io/github/commit-activity/t/studyield/studyield?style=flat-square) | 2024年以降のアクティブな開発 |
| **月間コミット数** | ![Commit Activity](https://img.shields.io/github/commit-activity/m/studyield/studyield?style=flat-square) | 定期的な更新と改善 |
| **平均PRレビュー時間** | 24〜48時間 | メンテナーからの迅速なフィードバック |
| **コード品質** | ![Code Quality](https://img.shields.io/badge/code%20quality-A-brightgreen?style=flat-square) | TypeScript + ESLint + Prettier |
| **テストカバレッジ** | ![Coverage](https://img.shields.io/badge/coverage-70%25-green?style=flat-square) | バックエンドユニット + 統合テスト |
| **ドキュメント** | ![Docs](https://img.shields.io/badge/docs-comprehensive-blue?style=flat-square) | 完全なAPIドキュメント + 開発者ガイド |

### 言語とコード統計

<p align="left">
  <img src="https://img.shields.io/github/languages/top/studyield/studyield?style=for-the-badge&logo=typescript&color=blue" alt="Top Language">
  <img src="https://img.shields.io/github/languages/count/studyield/studyield?style=for-the-badge&color=purple" alt="Language Count">
  <img src="https://img.shields.io/github/repo-size/studyield/studyield?style=for-the-badge&color=orange" alt="Repo Size">
  <img src="https://img.shields.io/github/license/studyield/studyield?style=for-the-badge&color=green" alt="License">
</p>

### 最近の活動ハイライト

- ✅ **2026年4月** -- 初のオープンソースリリース
- ✅ **27のバックエンドモジュール** -- auth、ai、content、exam-clone、problem-solver、teach-back、research、code-sandboxなど
- ✅ **120以上のAPIエンドポイント** -- 包括的なREST + WebSocket API
- ✅ **12言語対応** -- 完全な国際化サポート
- ✅ **3プラットフォーム対応** -- Web（React）、モバイル（Flutter）、API
- ✅ **Docker展開** -- ワンコマンドでセルフホスティング

### これらの数字が重要な理由

**アクティブな開発** -- 定期的なコミットと更新により、バグが迅速に修正され、コミュニティのフィードバックに基づいて機能が追加されます

**迅速なPRレビュー** -- 24〜48時間のレビュー時間により、あなたの貢献がメンテナーの注目を待ってアイドル状態になることはありません

**高いコード品質** -- TypeScript、ESLint、Prettier、包括的なテストにより、安定した保守可能なコードベースが保証されます

**包括的なドキュメント** -- 完全なAPIドキュメント、開発者ガイド、コードコメントにより、スムーズなオンボーディングが可能です

**成長するコミュニティ** -- より多くのコントリビューターは、より多くの機能、より良いテスト、製品方向性に関する多様な視点を意味します

### アクティビティに参加しましょう！

ここであなたの貢献を見たいですか？以下の[クイックコントリビューションガイド](#-クイックコントリビューションガイド)をチェックしてください！

## クイックスタート

### Docker（推奨）

プロジェクトルートから以下のコマンドを実行：

```bash
git clone https://github.com/studyield/studyield.git
cd studyield
cp backend/.env.example backend/.env
# backend/.envをデータベース認証情報とOpenRouter APIキーで編集
docker compose --env-file .env.docker up -d
```

これで完了です！`http://localhost:5189`でアプリにアクセスし、`http://localhost:3010`でAPIにアクセスします。

### 手動セットアップ

**前提条件:** Node.js 20+、PostgreSQL 15+、Redis 7+

```bash
# クローン
git clone https://github.com/studyield/studyield.git
cd studyield

# バックエンド
cd backend
cp .env.example .env    # .envを設定で編集
npm install
npm run migrate
npm run start:dev

# フロントエンド（新しいターミナルで）
cd frontend
cp .env.example .env
npm install
npm run dev
```

`http://localhost:5189`にアクセスしてアプリにアクセスします。

### ワンコマンドスタート（開発）

```bash
./start.sh
```

これにより、PostgreSQL、Redis、Qdrant、ClickHouseがDocker経由で起動し、その後バックエンドとフロントエンドの開発サーバーが起動します。

## アーキテクチャ

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

**フロントエンド** (`/frontend`) -- React 19、Vite、TypeScript、Tailwind CSS、Radix UI (shadcn)、Zustand、React Query、i18next

**モバイル** (`/mobile`) -- Flutter 3.10+、Provider + BLoC、Dio、Go Router、Firebase、Easy Localization

**バックエンド** (`/backend`) -- NestJS 10、TypeScript、PostgreSQL（raw SQL）、Redis、Qdrant、ClickHouse、BullMQ、Socket.io

## 技術スタック

| レイヤー | 技術 |
|-------|------------|
| **バックエンド** | NestJS 10、TypeScript、PostgreSQL（raw SQL）、Redis、Qdrant、ClickHouse、BullMQ、Socket.io |
| **フロントエンド** | React 19、Vite、TypeScript、Tailwind CSS、Radix UI (shadcn)、Zustand、React Query、i18next |
| **モバイル** | Flutter 3.10+、Provider + BLoC、Dio、Go Router、Firebase、Easy Localization |
| **AI** | OpenRouter（Claude、GPTなど）、OpenAI Embeddings、LangChain |
| **インフラストラクチャ** | Docker Compose、Nginx、PM2、GitHub Actions CI/CD |
| **ストレージ** | Cloudflare R2、AWS SES、Firebase Cloud Messaging |
| **支払い** | Stripe（サブスクリプション + Webhook） |

## i18n

Studyieldはi18next（フロントエンド）とEasy Localization（モバイル）を介して12言語をサポートしています：

- English、日本語、中文、한국어、Español、Français、Deutsch、Português、العربية、বাংলা、हिन्दी、Русский

新しい言語を追加したいですか？[翻訳ガイド](docs/contributing/translations.md)を参照してください。

## 🚀 なぜStudyieldに貢献するのか？

Studyieldは単なる別のオープンソースプロジェクトではありません -- AI搭載教育の未来を構築し、世界中の数百万人の学生に質の高い学習を提供する機会です。

### 得られるもの

**📚 最新の技術スタックを学ぶ**
- **NestJS + TypeScript** -- 依存性注入とモジュール設計を備えたエンタープライズグレードのバックエンドアーキテクチャ
- **React 19 + Vite** -- 超高速ビルドを備えた最新のReact機能
- **Flutter** -- iOSとAndroid向けのクロスプラットフォームモバイル開発
- **AI/ML統合** -- LLM、埋め込み、ベクトルデータベース、マルチエージェントシステムを使用
- **リアルタイムシステム** -- WebSocket、ストリーミング、イベント駆動アーキテクチャ
- **DevOps** -- Docker、CI/CD、セルフホスティング、Infrastructure as Code

**💼 ポートフォリオを構築**
- 世界中の学生が使用する**本番環境対応**プラットフォームに貢献
- GitHubプロフィールに表示される機能に取り組む
- コントリビューター殿堂で認められる
- **AI搭載教育**と**EdTech**の専門知識を構築 -- 2026年に高く評価されるスキル

**🤝 成長するコミュニティに参加**
- 世界中の開発者とつながる
- 経験豊富なメンテナーからコードレビューを受ける
- ソフトウェアアーキテクチャのベストプラクティスを学ぶ
- 技術的な議論や設計決定に参加

**🎯 真の影響を与える**
- あなたのコードは学生がより効果的に学習し、学業目標を達成するのに役立ちます
- 本番環境で使用されている機能を見る
- オープンソースEdTechの方向性に影響を与える

**⚡ クイックオンボーディング**
- Docker Composeにより**5分以内**に実行可能
- 明確なアーキテクチャを備えたよくドキュメント化されたコードベース
- **24〜48時間以内**にPRに応答するフレンドリーなメンテナー
- 初心者向けの「good first issue」ラベル

## 🗺️ プロジェクトロードマップ

完了したこと、進行中のこと、次に計画していることの詳細については、**[将来の目標と開発者ブリーフィング](FUTURE_GOAL.md)**を参照してください。

このドキュメントには以下が含まれます：
- ✅ 完了したオープンソース準備作業
- 🚧 現在の優先事項（コードクリーンアップ、Dockerセットアップ、ドキュメント）
- 🔮 将来の機能強化と機能

### ロードマップに影響を与える方法

💡 **アイデアはありますか？** [GitHubディスカッション](https://github.com/studyield/studyield/discussions)を開くか、既存のスレッドに貢献してください

🗳️ **機能に投票** -- 気になる問題にスターを付けて優先順位付けを支援

🛠️ **リストにないものを構築したいですか？** -- 提案してください！コミュニティ主導の機能を歓迎します

## 🎯 クイックコントリビューションガイド

**5分以内**に貢献を開始：

### ステップ1：環境をセットアップ

```bash
# GitHubでリポジトリをフォークし、フォークをクローン
git clone https://github.com/YOUR_USERNAME/studyield.git
cd studyield

# Dockerで開始（最も簡単な方法）
cp backend/.env.example backend/.env
docker compose --env-file .env.docker up -d

# アプリにアクセス
# フロントエンド: http://localhost:5189
# バックエンドAPI: http://localhost:3010
```

**これで完了です！** Studyieldがローカルで実行されています。

### ステップ2：作業するものを見つける

経験レベルに基づいて選択：

**🟢 初心者向け**
- 📝 [タイプミスを修正したり、ドキュメントを改善](https://github.com/studyield/studyield/issues?q=is%3Aissue+is%3Aopen+label%3Adocumentation)
- 🌍 [翻訳を追加](https://github.com/studyield/studyield/issues?q=is%3Aissue+is%3Aopen+label%3Ai18n) -- 12言語をサポート
- 🐛 [シンプルなバグを修正](https://github.com/studyield/studyield/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)
- ✨ [UI/UXを改善](https://github.com/studyield/studyield/issues?q=is%3Aissue+is%3Aopen+label%3Aui%2Fux)

**🟡 中級者向け**
- 🔌 新しいAIエージェントツールや機能を追加
- 📊 分析ダッシュボードと可視化を改善
- 🧪 [テストを書く](https://github.com/studyield/studyield/issues?q=is%3Aissue+is%3Aopen+label%3Atesting)
- 🚀 [パフォーマンスの改善](https://github.com/studyield/studyield/issues?q=is%3Aissue+is%3Aopen+label%3Aperformance)

**🔴 上級者向け**
- 🤖 新しいAI機能を構築（マルチモーダル入力、高度な推論）
- ⚙️ [コアエンジンの機能強化](https://github.com/studyield/studyield/issues?q=is%3Aissue+is%3Aopen+label%3Acore)
- 🏗️ [アーキテクチャの改善](https://github.com/studyield/studyield/issues?q=is%3Aissue+is%3Aopen+label%3Aarchitecture)
- 🔐 [セキュリティ機能](https://github.com/studyield/studyield/issues?q=is%3Aissue+is%3Aopen+label%3Asecurity)

### ステップ3：変更を加える

```bash
# 新しいブランチを作成
git checkout -b feature/your-feature-name

# 変更を加える
# - バックエンドコード: /backend/src/modules
# - フロントエンドコード: /frontend/src
# - モバイルコード: /mobile/lib

# 変更をテスト
# バックエンド: cd backend && npm run test
# フロントエンド: cd frontend && npm run build

# 明確なメッセージでコミット
git commit -m "feat: add voice input support for teach-back"
```

### ステップ4：プルリクエストを送信

```bash
# フォークにプッシュ
git push origin feature/your-feature-name

# GitHubでPRを開く
# - 何を変更したか、なぜ変更したかを説明
# - 関連する問題にリンク
# - UI変更の場合はスクリーンショットを追加
```

**次に何が起こりますか？**
- ✅ PRで自動テストが実行されます
- 👀 メンテナーがコードをレビューします（通常**24〜48時間以内**）
- 💬 変更や改善を提案する場合があります
- 🎉 承認されると、コードがマージされます！

### コントリビューションのヒント

✨ **小さく始める** -- 最初のPRは巨大な機能である必要はありません

📖 **コードを読む** -- 参考のために既存のモジュールとコンポーネントを閲覧

❓ **質問する** -- 行き詰まったら[ディスカッション](https://github.com/studyield/studyield/discussions)に参加

🧪 **テストを書く** -- テスト付きのPRはより速くマージされます

📝 **コードをドキュメント化** -- 複雑なロジックにはコメントを追加

### ヘルプが必要ですか？

- 💬 [GitHubディスカッション](https://github.com/studyield/studyield/discussions) -- 質問、アイデアの共有
- 📖 [コントリビューションガイド](CONTRIBUTING.md) -- 詳細なコントリビューションガイドライン
- 🐛 [GitHub Issues](https://github.com/studyield/studyield/issues) -- バグ報告や機能リクエスト
- 📧 [メール](mailto:hello@studyield.com) -- メンテナーへの直接連絡

## コントリビューション

貢献を歓迎します！開始するには[コントリビューションガイド](CONTRIBUTING.md)を参照してください。

**貢献方法：**
- [GitHub Issues](https://github.com/studyield/studyield/issues)でバグを報告したり、機能をリクエスト
- バグ修正や新機能のプルリクエストを送信
- ドキュメントを改善
- 翻訳を追加（12言語をサポート）

## コントリビューター

Studyieldに貢献してくれたすべての素晴らしい人々に感謝します！🎉

<a href="https://github.com/studyield/studyield/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=studyield/studyield&anon=1&max=100&columns=10" />
</a>

ここにあなたの顔を表示したいですか？[コントリビューションガイド](CONTRIBUTING.md)をチェックして、今日から貢献を始めましょう！

## 💬 コミュニティに参加

開発者とつながり、ヘルプを得て、Studyieldの最新の開発について最新情報を入手してください！

<p align="center">
  <a href="https://github.com/studyield/studyield/discussions">
    <img src="https://img.shields.io/badge/GitHub-Discussions-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub Discussions">
  </a>
  <a href="https://twitter.com/studyield">
    <img src="https://img.shields.io/badge/Twitter-Follow%20Us-1DA1F2?style=for-the-badge&logo=twitter&logoColor=white" alt="Twitter">
  </a>
</p>

### どこで見つけられますか

| プラットフォーム | 目的 | リンク |
|----------|---------|------|
| 💡 **GitHubディスカッション** | 質問、アイデアの共有、機能リクエスト | [ディスカッションを開始](https://github.com/studyield/studyield/discussions) |
| 🐦 **Twitter/X** | 製品アップデート、お知らせ、ヒント | [@studyield](https://twitter.com/studyield) |
| 📧 **メール** | メンテナーへの直接連絡 | hello@studyield.com |
| 🌐 **ウェブサイト** | ドキュメント、ガイド、ブログ | [studyield.com](https://studyield.com) |

### コミュニティガイドライン

- 🤝 **敬意を持つ** -- すべての人を尊重と親切さで扱う
- 💡 **知識を共有** -- 他の人が学び成長するのを助ける
- 🐛 **問題を報告** -- バグを見つけましたか？GitHub Issuesでお知らせください
- 🎉 **勝利を祝う** -- 学習の成果と成功事例を共有
- 🌍 **グローバルに考える** -- 私たちは12以上の言語を持つ世界的なコミュニティです

## セキュリティ

セキュリティの脆弱性は責任を持って報告してください。開示ポリシーについては[SECURITY.md](SECURITY.md)を参照してください。

## ライセンス

このプロジェクトは[Apache License 2.0](LICENSE)の下でライセンスされています。

Copyright 2025 Studyield Contributors.

## 謝辞

NestJS、React、Flutter、PostgreSQL、Redis、Qdrant、ClickHouse、OpenRouter、その他多くの素晴らしいオープンソース技術で構築されています。

---

<p align="center">
  <a href="https://studyield.com">ウェブサイト</a> |
  <a href="https://docs.studyield.com">ドキュメント</a> |
  <a href="https://github.com/studyield/studyield/discussions">ディスカッション</a> |
  <a href="https://twitter.com/studyield">Twitter</a>
</p>

---

<p align="center">
  <strong><a href="https://github.com/studyield">Studyield</a>コミュニティによって❤️で構築</strong>
</p>

<p align="center">
  このプロジェクトが役に立つと思ったら、スターを付けることを検討してください！⭐
  <br><br>
  <a href="https://github.com/studyield/studyield/stargazers">
    <img src="https://img.shields.io/github/stars/studyield/studyield?style=social" alt="Star on GitHub">
  </a>
</p>
