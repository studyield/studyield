-- Blog posts table for public blog
CREATE TABLE IF NOT EXISTS blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(255) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    excerpt TEXT NOT NULL,
    content TEXT NOT NULL,
    cover_image TEXT,
    category VARCHAR(50) NOT NULL DEFAULT 'general',
    tags JSONB DEFAULT '[]',
    author_name VARCHAR(100) NOT NULL DEFAULT 'Studyield Team',
    author_avatar TEXT,
    read_time INT NOT NULL DEFAULT 5,
    is_published BOOLEAN DEFAULT TRUE,
    published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category);
CREATE INDEX IF NOT EXISTS idx_blog_posts_is_published ON blog_posts(is_published);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at DESC);

-- Update trigger
CREATE OR REPLACE FUNCTION update_blog_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_blog_posts_updated_at ON blog_posts;
CREATE TRIGGER trigger_blog_posts_updated_at
    BEFORE UPDATE ON blog_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_blog_posts_updated_at();

-- Seed blog posts
INSERT INTO blog_posts (slug, title, excerpt, content, category, tags, author_name, read_time, published_at) VALUES

('spaced-repetition-science',
 'The Science Behind Spaced Repetition: Why It Works',
 'Discover how spaced repetition leverages your brain''s natural memory processes to help you remember more with less effort.',
 '## The Science Behind Spaced Repetition

Have you ever crammed for an exam the night before, only to forget everything a week later? You''re not alone. Research shows that **massed practice** (cramming) is one of the least effective study strategies. Enter **spaced repetition** — a learning technique that spaces out your review sessions over increasing intervals.

### How It Works

Spaced repetition is based on the **forgetting curve**, discovered by Hermann Ebbinghaus in 1885. The forgetting curve shows that we lose newly learned information at an exponential rate — unless we actively review it at strategic intervals.

The SM-2 algorithm, which powers Studyield''s flashcard system, calculates the optimal time to review each card based on:

- **Ease factor**: How difficult you find the material
- **Interval**: Time between reviews
- **Repetitions**: How many times you''ve successfully recalled the information

### Why Studyield Makes It Easy

With Studyield, you don''t need to track any of this manually. Our intelligent flashcard system automatically:

1. **Schedules reviews** at the optimal time
2. **Adjusts difficulty** based on your performance
3. **Tracks your progress** with detailed analytics
4. **Supports multiple card types** — standard, cloze deletion, and image occlusion

### The Research

A 2019 meta-analysis published in *Psychological Bulletin* found that spaced practice improved long-term retention by an average of **10-30%** compared to massed practice. When combined with active recall (testing yourself), the benefits are even greater.

### Getting Started

Create your first study set on Studyield and let our spaced repetition system handle the rest. Your brain will thank you.

---

*Start studying smarter today with Studyield''s built-in spaced repetition system.*',
 'study-tips',
 '["spaced repetition", "memory", "learning science", "flashcards"]',
 'Studyield Team',
 7,
 NOW() - INTERVAL '2 days'),

('ai-powered-studying',
 'How AI Is Revolutionizing the Way Students Study',
 'From generating flashcards to solving complex problems, AI tools are transforming education. Here''s how Studyield puts AI to work for you.',
 '## How AI Is Revolutionizing the Way Students Study

Artificial intelligence is no longer a futuristic concept — it''s here, and it''s changing the way millions of students learn every day. At Studyield, we''ve integrated AI deeply into the study experience to help you work smarter, not harder.

### AI-Powered Features in Studyield

#### 1. Smart Flashcard Generation
Upload any document, paste text, or even take a photo of your textbook — Studyield''s AI will automatically generate high-quality flashcards. No more spending hours manually creating cards.

#### 2. AI Chat Assistant
Have a question about a concept? Our AI chat assistant can explain topics, provide examples, and guide you through complex material. It''s like having a tutor available 24/7.

#### 3. Problem Solver
Snap a photo of a math problem, physics equation, or chemistry formula. Our AI breaks it down step-by-step, showing you not just the answer, but **how** to get there.

#### 4. Handwriting OCR
Write notes by hand? No problem. Our vision-powered OCR can convert your handwritten notes to digital text, making them searchable and easy to organize.

#### 5. Deep Research
Need to write an essay or understand a complex topic? Our Deep Research feature generates comprehensive research reports with citations, saving you hours of manual research.

### The Future of AI in Education

As AI technology advances, the possibilities are endless. We''re continuously improving our AI features to provide even more personalized, effective study experiences.

---

*Experience the future of studying — try Studyield''s AI features today.*',
 'ai-features',
 '["artificial intelligence", "AI study tools", "edtech", "smart learning"]',
 'Studyield Team',
 6,
 NOW() - INTERVAL '5 days'),

('effective-flashcard-techniques',
 '5 Flashcard Techniques That Will 10x Your Learning',
 'Most students use flashcards wrong. Learn five proven techniques to maximize retention and cut study time in half.',
 '## 5 Flashcard Techniques That Will 10x Your Learning

Flashcards are one of the most powerful study tools available, but most students barely scratch the surface of their potential. Here are five techniques that will transform your flashcard game.

### 1. Use Active Recall, Not Recognition

Don''t just flip the card and think "I knew that." Actually try to recall the answer **before** looking. This effort of retrieval strengthens memory pathways.

### 2. Apply the Minimum Information Principle

Each card should test **one atomic piece** of information. Instead of putting an entire paragraph on a card, break it down into multiple simple cards. This makes reviews faster and recall more reliable.

### 3. Try Cloze Deletions

Cloze deletions (fill-in-the-blank) are incredibly effective for learning:
- Definitions: "Photosynthesis is the process by which plants convert {{light energy}} into chemical energy"
- Formulas: "The quadratic formula is x = {{(-b ± √(b²-4ac)) / 2a}}"

Studyield supports cloze cards natively with the `{{...}}` syntax.

### 4. Use Image Occlusion for Visual Content

For anatomy, diagrams, maps, and charts, image occlusion cards are unbeatable. Hide parts of an image and test yourself on identifying them. This technique is especially popular among medical students.

### 5. Review in Both Directions

For vocabulary and paired concepts, create cards that test both directions. Knowing English→Spanish isn''t the same as Spanish→English.

### Putting It All Together

The best part? Studyield supports all of these techniques out of the box. Standard cards, cloze deletions, and image occlusion — all powered by spaced repetition.

---

*Create your first set of optimized flashcards on Studyield today.*',
 'study-tips',
 '["flashcards", "study techniques", "active recall", "cloze deletion"]',
 'Studyield Team',
 5,
 NOW() - INTERVAL '8 days'),

('live-quiz-classroom',
 'How to Use Live Quizzes to Make Studying Fun',
 'Turn boring review sessions into exciting competitions with Studyield''s Live Quiz feature. Perfect for classrooms and study groups.',
 '## How to Use Live Quizzes to Make Studying Fun

Studying doesn''t have to be a solitary, boring activity. With Studyield''s **Live Quiz** feature, you can turn any study set into a real-time competitive quiz — perfect for classrooms, study groups, or even remote learning sessions.

### What Is Live Quiz?

Live Quiz transforms your flashcards and study materials into an interactive, multiplayer quiz experience. Think of it as Kahoot meets your study notes.

### How It Works

1. **Create or select** a study set with flashcards
2. **Start a Live Quiz** session — you''ll get a unique room code
3. **Share the code** with friends or classmates
4. **Compete in real-time** — answer questions, earn points, climb the leaderboard

### Why It Works

Research shows that **gamification** increases engagement and motivation. When learning feels like a game:

- Students are **2x more likely** to participate actively
- Retention improves by up to **40%** compared to passive review
- Healthy competition creates **emotional engagement** with the material

### Tips for Teachers & Study Group Leaders

- **Mix question types**: Multiple choice, true/false, and open-ended keep things interesting
- **Use a timer**: Time pressure adds excitement and simulates exam conditions
- **Review together**: After each round, discuss the answers as a group
- **Award prizes**: Even small rewards boost participation

### Getting Started

Any study set on Studyield can be turned into a Live Quiz with one click. Try it with your next study group session!

---

*Make studying social — host your first Live Quiz on Studyield.*',
 'features',
 '["live quiz", "gamification", "classroom", "group study"]',
 'Studyield Team',
 5,
 NOW() - INTERVAL '12 days'),

('exam-preparation-guide',
 'The Ultimate Exam Preparation Guide for Students',
 'A comprehensive guide to preparing for exams effectively, from planning your study schedule to mastering test-taking strategies.',
 '## The Ultimate Exam Preparation Guide

Exams can be stressful, but with the right preparation strategy, you can walk into any test feeling confident. Here''s our comprehensive guide to exam preparation.

### Phase 1: Planning (4-6 Weeks Before)

**Set up your study materials:**
- Create a study set for each subject on Studyield
- Upload lecture notes, textbooks, and past papers
- Use AI to generate flashcards from your materials
- Set an exam date on your study set to activate the countdown timer

**Create a study schedule:**
- Use Studyield''s study schedule feature to plan your review sessions
- Allocate more time to difficult subjects
- Include regular breaks using the Pomodoro technique

### Phase 2: Active Learning (2-4 Weeks Before)

**Deep understanding:**
- Use the AI Chat to ask questions about concepts you don''t understand
- Create cloze deletion cards for key definitions and formulas
- Try the Teach Back feature — explain concepts to the AI tutor

**Practice testing:**
- Generate quizzes from your study sets
- Use Exam Clone to practice with AI-generated exam simulations
- Review your analytics to identify weak areas

### Phase 3: Intensive Review (1 Week Before)

**Final push:**
- Focus on your weakest areas (check your analytics dashboard)
- Do timed practice tests under exam conditions
- Review your flashcards daily — trust the spaced repetition system
- Use the Problem Solver for any remaining questions

### Phase 4: Exam Day

- Review key formulas and concepts briefly in the morning
- Stay calm — you''ve prepared well
- Read each question carefully before answering
- Manage your time across all sections

### The Studyield Advantage

With features like spaced repetition, AI quiz generation, exam clones, and detailed analytics, Studyield gives you everything you need to prepare effectively.

---

*Start your exam prep today — create a study set and set your exam date on Studyield.*',
 'study-tips',
 '["exam preparation", "study guide", "test taking", "study schedule"]',
 'Studyield Team',
 8,
 NOW() - INTERVAL '15 days'),

('handwriting-ocr-digital-notes',
 'From Handwritten to Digital: How OCR Transforms Your Notes',
 'Love writing by hand but hate losing your notes? Learn how Studyield''s Handwriting OCR bridges the gap between analog and digital study.',
 '## From Handwritten to Digital: How OCR Transforms Your Notes

There''s something special about writing by hand. Research from Princeton University shows that students who take handwritten notes **comprehend and remember more** than those who type. But paper notes are hard to search, organize, and review digitally.

That''s where Studyield''s **Handwriting OCR** comes in.

### What Is Handwriting OCR?

OCR (Optical Character Recognition) is technology that converts images of text into actual, editable digital text. Studyield''s OCR is powered by advanced AI vision models that can read even messy handwriting.

### How to Use It

1. **Take a photo** of your handwritten notes
2. **Upload it** to Studyield
3. **AI processes** the image and extracts the text
4. **Edit and organize** the digital text in your study set
5. **Generate flashcards** automatically from the extracted content

### What It Can Read

- Handwritten lecture notes
- Whiteboard photos
- Textbook annotations
- Math equations and formulas
- Diagrams with labels

### The Best of Both Worlds

With Handwriting OCR, you get the cognitive benefits of handwriting **and** the organizational power of digital tools. Write by hand in class, then digitize your notes in seconds.

### Pro Tips

- Write clearly and use good lighting for best results
- Break long pages into sections for more accurate recognition
- Review the extracted text and make corrections
- Use the AI to generate flashcards from your digitized notes

---

*Try Studyield''s Handwriting OCR — turn your notebook into a study powerhouse.*',
 'features',
 '["handwriting OCR", "digital notes", "note taking", "AI vision"]',
 'Studyield Team',
 5,
 NOW() - INTERVAL '18 days'),

('study-analytics-track-progress',
 'Why Tracking Your Study Progress Changes Everything',
 'Data-driven studying isn''t just for overachievers. Learn how Studyield''s analytics help you identify weaknesses and study more effectively.',
 '## Why Tracking Your Study Progress Changes Everything

What gets measured gets managed. This applies to studying just as much as it applies to business. Yet most students study blindly, without any data on their actual performance.

### The Problem with Blind Studying

Without tracking, students often:
- Spend too much time on topics they already know
- Neglect difficult topics that need more attention
- Can''t see their progress, leading to frustration
- Don''t know their optimal study times

### What Studyield Tracks

#### Study Streaks
Stay motivated with daily study streaks. Just like exercise, consistency is key. Our streak system rewards you with XP for studying every day.

#### XP & Levels
Earn experience points for every study activity — reviewing flashcards, completing quizzes, using AI features. Level up and unlock achievements.

#### Study Heatmap
See your study activity over time with a GitHub-style contribution heatmap. Identify your most productive days and times.

#### Performance Analytics
- **Subject-wise performance**: See which topics need more work
- **Review accuracy**: Track your flashcard success rate over time
- **Quiz scores**: Monitor your improvement across quizzes
- **Time spent**: Understand how you allocate study time

#### Streak Calendar
Visualize your consistency with a beautiful calendar view showing your daily study activity.

### How to Use Analytics Effectively

1. **Check weekly**: Review your analytics dashboard every Sunday
2. **Identify weak spots**: Focus extra time on low-performing subjects
3. **Set goals**: Use streak targets to build consistent study habits
4. **Celebrate progress**: Seeing improvement is incredibly motivating

---

*Start tracking your study progress — check your Studyield analytics dashboard today.*',
 'productivity',
 '["analytics", "study tracking", "productivity", "streaks", "gamification"]',
 'Studyield Team',
 6,
 NOW() - INTERVAL '22 days'),

('teach-back-method',
 'The Teach Back Method: Learn by Teaching an AI',
 'Teaching is the most effective way to learn. Studyield''s Teach Back mode lets you explain concepts to an AI tutor that asks clarifying questions.',
 '## The Teach Back Method: Learn by Teaching an AI

There''s an old saying: **"The best way to learn something is to teach it."** Research backs this up — the **protégé effect** shows that people learn more effectively when they expect to teach the material.

### What Is the Teach Back Method?

The Teach Back method involves explaining a concept in your own words, as if you''re teaching someone else. This forces you to:

- **Organize** your thoughts clearly
- **Identify gaps** in your understanding
- **Strengthen** neural pathways through active processing
- **Build confidence** in your knowledge

### How Studyield''s Teach Back Works

1. **Choose a topic** from your study set
2. **Explain the concept** in your own words (text or voice)
3. **AI evaluates** your explanation for accuracy and completeness
4. **Get feedback** with specific suggestions for improvement
5. **Challenge mode**: The AI asks follow-up questions to deepen understanding

### Why It''s Different from Just Reading

| Activity | Retention Rate |
|----------|---------------|
| Reading | 10% |
| Watching video | 20% |
| Discussion | 50% |
| Practice doing | 75% |
| **Teaching others** | **90%** |

*Source: National Training Laboratories Learning Pyramid*

### Tips for Effective Teach Back

- **Don''t look at your notes** while explaining — test your recall
- **Use simple language** — if you can''t explain it simply, you don''t understand it
- **Welcome the challenge questions** — they reveal what you still need to learn
- **Practice regularly** — try teaching back one concept per study session

---

*Try the Teach Back feature on Studyield — your AI student is waiting.*',
 'study-tips',
 '["teach back", "active learning", "study method", "AI tutor"]',
 'Studyield Team',
 6,
 NOW() - INTERVAL '25 days'),

('deep-research-essays',
 'How to Write Better Essays with AI-Powered Deep Research',
 'Stop spending hours on manual research. Studyield''s Deep Research generates comprehensive reports with sources, outlines, and key insights.',
 '## How to Write Better Essays with AI-Powered Deep Research

Writing a research paper or essay can be overwhelming. Finding reliable sources, organizing information, and synthesizing arguments takes hours — sometimes days. Studyield''s **Deep Research** feature cuts that time dramatically.

### What Is Deep Research?

Deep Research is an AI-powered feature that generates comprehensive research reports on any topic. It analyzes multiple sources, synthesizes information, and presents organized findings that you can use as a foundation for your own work.

### How to Use It

1. **Enter your topic** or research question
2. **Customize parameters**: depth, focus areas, number of sources
3. **Start the research** — the AI works in the background
4. **Review the report**: organized sections, key findings, and citations
5. **Export or save** to your study set for further study

### What You Get

- **Executive summary**: Quick overview of the topic
- **Detailed sections**: In-depth analysis of key aspects
- **Key findings**: Bullet-pointed takeaways
- **Source citations**: References you can verify and cite
- **Related topics**: Suggestions for further exploration

### Academic Integrity

Deep Research is a **research assistant**, not a writing tool. Use it to:
- Understand a topic before writing
- Find and verify sources
- Organize your thoughts and outline
- Identify key arguments and counterarguments

Always write your essays in your own words and properly cite all sources.

### Perfect for

- Essay planning and research
- Literature reviews
- Topic exploration for presentations
- Building background knowledge for exams

---

*Try Deep Research on Studyield — your personal research assistant.*',
 'ai-features',
 '["deep research", "essay writing", "AI research", "academic writing"]',
 'Studyield Team',
 6,
 NOW() - INTERVAL '30 days'),

('getting-started-studyield',
 'Getting Started with Studyield: A Complete Beginner''s Guide',
 'New to Studyield? This complete guide walks you through creating your account, setting up your first study set, and making the most of every feature.',
 '## Getting Started with Studyield: A Complete Beginner''s Guide

Welcome to Studyield! Whether you''re a high school student, university learner, or lifelong educator, this guide will help you get up and running in minutes.

### Step 1: Create Your Account

Sign up at studyield.com with your email or Google account. The free plan gives you access to core features including:
- Study set creation
- Flashcards with spaced repetition
- AI chat assistant
- Basic analytics

### Step 2: Create Your First Study Set

A study set is a collection of flashcards, notes, and quizzes around a specific topic.

1. Click **"Create Study Set"** from your dashboard
2. Give it a name (e.g., "Biology 101 — Cell Division")
3. Add a description and choose a subject
4. Optionally set an **exam date** to activate the countdown timer

### Step 3: Add Content

You can add content to your study set in multiple ways:

- **Manual flashcards**: Type questions and answers
- **AI generation**: Upload a document or paste text, and AI creates flashcards for you
- **Import**: Paste from existing study materials
- **Photo**: Take a photo of handwritten notes and use OCR
- **Notes**: Write or generate detailed notes

### Step 4: Start Studying

- **Review flashcards**: The spaced repetition system schedules optimal review times
- **Take quizzes**: Auto-generated from your flashcards
- **Use AI chat**: Ask questions about your study material
- **Track progress**: Check your analytics dashboard

### Step 5: Level Up

As you progress, explore advanced features:
- **Live Quiz**: Compete with friends in real-time
- **Exam Clone**: Practice with simulated exams
- **Teach Back**: Reinforce learning by teaching the AI
- **Learning Paths**: Follow structured study paths
- **Deep Research**: Generate comprehensive research reports

### Tips for Success

1. **Study a little every day** — consistency beats cramming
2. **Trust the algorithm** — review cards when Studyield tells you to
3. **Use multiple card types** — mix standard, cloze, and image occlusion
4. **Track your streaks** — the XP system keeps you motivated
5. **Join study groups** — use Live Quiz for collaborative review

---

*Welcome aboard! Your journey to smarter studying starts now.*',
 'getting-started',
 '["beginner guide", "tutorial", "onboarding", "study sets"]',
 'Studyield Team',
 8,
 NOW() - INTERVAL '35 days')

ON CONFLICT (slug) DO NOTHING;
