# The Feynman

> Learn anything deeply by teaching it simply.

An AI-powered learning platform that implements the **Feynman Technique** — a proven method for deep understanding through simplified explanation. Named after Nobel Prize physicist Richard Feynman, who believed that if you can't explain something simply, you don't understand it well enough.

## What It Is

The Feynman is an interactive coaching application that guides you through a structured learning process:

1. **Choose a concept** — any topic you want to understand
2. **Explain it simply** — as if teaching a 12-year-old
3. **Get coached** — an AI tutor identifies gaps in your understanding through targeted questions
4. **Write your best** — synthesize everything you've learned
5. **Get rated** — receive a score and feedback on your explanation

## Features

### Core Learning Flow

- **AI Coaching Loop** — Cumulative, conversation-based tutoring that asks one question at a time, targeting your weakest understanding criteria
- **5-Criterion Grading** — Evaluates explanations across: plain language, core mechanism, analogy/example, no gaps/filler, and child-friendly tone
- **Progressive Feedback** — Passed criteria never drop; the AI builds on previous answers like a real tutor
- **Smart Session Cap** — Sessions end when all criteria are met or after 20 questions max

### User Experience

- **Multi-step Progress Tracking** — Visual dot indicators show where you are in the learning journey
- **Session History** — Review past coaching conversations and scores (Pro feature)
- **Real-time Criteria Checklist** — See which understanding criteria you've passed as you go
- **Best Moment Highlight** — The app captures your strongest analogy or sentence from the session

### Authentication & Plans

- **Email/Password Sign-up** — Traditional auth with Supabase
- **Google OAuth** — One-click sign-in
- **Freemium Model** — Free users get 3 sessions per day; Pro users have unlimited sessions
- **Daily Usage Tracking** — Resets at midnight, not 24-hour rolling

### Technical Features

- **AI Fallback** — Automatically switches to backup Groq model if primary hits rate limits
- **Row Level Security** — Users can only access their own data
- **Responsive Design** — Collapsible sidebar, mobile-friendly layout
- **Custom Typography** — Instrument Serif + DM Sans fonts

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 5 |
| **UI** | React 19, Tailwind CSS 4 |
| **Authentication** | Supabase Auth (Email + Google OAuth) |
| **Database** | Supabase (PostgreSQL) |
| **AI/LLM** | Groq SDK |
| **Styling** | PostCSS, Custom CSS |
| **Linting** | ESLint 9 |
| **Package Manager** | npm |

## Getting Started

### Prerequisites

- Node.js 20+
- A Supabase project
- A Groq API key

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd the-feynman

# Install dependencies
npm install

# Set up environment variables
# Create a .env file with:
# NEXT_PUBLIC_SUPABASE_URL=
# NEXT_PUBLIC_SUPABASE_ANON_KEY=
# SUPABASE_SERVICE_ROLE_KEY=
# GROQ_API_KEY=

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Project Structure

```
app/
├── page.tsx              # Landing page
├── layout.tsx            # Root layout
├── login/page.tsx        # Login page
├── signup/page.tsx       # Sign up page
├── feynman/page.tsx      # Main coaching app
├── api/
│   ├── auth/             # Auth endpoints (login, signup, logout, callback)
│   ├── coach/route.ts    # AI coaching endpoint
│   ├── rate/route.ts     # Final explanation scoring
│   ├── newsession/route.ts  # Create new session
│   ├── getsession/route.ts  # Fetch sessions
│   ├── session/[id]/route.ts  # Individual session
│   └── profile/route.ts  # User profile/plan
└── lib/
    ├── supabase/         # Supabase client (browser + server)
    ├── db.ts             # Database utilities
    └── redis.ts          # Redis utilities (planned)
```

## The 5 Criteria

The AI evaluates explanations against these five dimensions:

1. **Plain Language** — Can you explain it without jargon?
2. **Core Mechanism** — Do you understand how it actually works?
3. **Analogy or Example** — Can you make it concrete?
4. **No Gaps or Filler** — Is your explanation tight and complete?
5. **Child-Friendly** — Could a 12-year-old follow along?

## License

Private — All rights reserved.

---

_Ship the loop first. Validate completion rate. Then monetize._
