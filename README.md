# MathQuest

Mobile-first PWA math practice app for elementary school kids, optimized for iPhone and iPad home screen use.

## MVP Features

- Home dashboard with today's task, streak, and progress
- Multiplication practice (1x1 through 9x9) with multiple-choice answers
- Daily quest mode and 60-second sprint mode
- Instant feedback and response-time tracking
- Adaptive review with weak-fact prioritization (including 6x7, 7x8, 8x9, 9x7)
- Calendar streak tracking for daily check-ins
- Parent stats for accuracy, speed, misses, and weekly progress
- Local-first storage with no login required
- PWA installability with manifest, icons, and service worker

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- localStorage persistence

## Run Locally

1. Install dependencies:

npm install

2. Start dev server:

npm run dev

3. Open:

http://localhost:3000

## Production Build

Build and run locally in production mode:

npm run build
npm run start

## Deploy to Vercel

1. Push this repository to GitHub.
2. Import the repo in Vercel.
3. Use default Next.js build settings.
4. Deploy.

The app is static-friendly and deploys cleanly on Vercel.

## PWA Notes

- Manifest: public/manifest.json
- Service worker: public/sw.js
- Icons:
	- public/icons/icon-192.png
	- public/icons/icon-512.png
	- public/apple-touch-icon.png

On iPhone/iPad Safari:

1. Open the deployed app URL.
2. Tap Share.
3. Tap Add to Home Screen.

## Data Model

Each answer attempt stores:

- questionType
- operands
- correctAnswer
- selectedAnswer
- isCorrect
- responseTimeMs
- timestamp

Each fact stores:

- totalAttempts
- correctAttempts
- incorrectAttempts
- averageResponseTimeMs
- lastPracticedDate
- masteryLevel

## Project Structure

- src/app/page.tsx: Home page
- src/app/practice/page.tsx: Practice flow and sessions
- src/app/review/page.tsx: Missed and slow review lists
- src/app/calendar/page.tsx: Streak calendar
- src/app/parent/page.tsx: Parent stats view
- src/lib/types.ts: Shared types and models
- src/lib/math.ts: Question generation and adaptive weighting
- src/lib/storage.ts: Local storage persistence and summaries

## Future Expansion Hooks

The generator and data model already include typed support for:

- addition
- subtraction
- division
- mixed operations

This keeps the MVP focused on multiplication while making future extension straightforward.
