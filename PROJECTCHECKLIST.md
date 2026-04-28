# The Feynman — Project Checklist

> Use this to verify every part of the product works as expected before calling it done. Check each item manually. Nothing ships until the whole list is green.

---

## 1. Authentication

- [ ] User can sign up with email and password
- [ ] User can log in with email and password
- [ ] User can log in with Google OAuth
- [ ] Logged-in user sees their own sessions only
- [ ] Logged-out user cannot access the app or any API route
- [ ] Auth token is passed correctly on every API call
- [ ] User row is created in `users` table on first sign-up
- [ ] User `plan` defaults to `free` on sign-up

---

## 2. Step 1 — Concept input

- [ ] Input field accepts any concept (text, min 3 characters)
- [ ] "Start session" button is disabled until concept is at least 3 characters
- [ ] Pressing Enter triggers start session
- [ ] Concept is saved to frontend state correctly
- [ ] A new row is created in `sessions` table when session starts
- [ ] `session_id` is stored in frontend state for the duration of the session

---

## 3. Step 2 — Study reminder

- [ ] Concept name displays correctly on this screen
- [ ] "I'm ready to explain" button advances to Step 3
- [ ] "Change concept" button returns to Step 1 and resets state
- [ ] No API call is made on this screen

---

## 4. Step 3 — Coaching loop (`/api/coach`)

### First message

- [ ] App automatically sends opening message on entering Step 3 (user does not type it)
- [ ] AI responds with the "explain it like a 12-year-old" prompt
- [ ] First AI message displays in the chat area correctly
- [ ] `messages` state initializes with the opening user message + AI response

### Conversation flow

- [ ] User input textarea is enabled and focused after AI replies
- [ ] Submitting user answer appends `{ role: "user", content }` to messages state
- [ ] Full `messages[]` history is sent to `/api/coach` on every turn — not just the latest message
- [ ] `concept` is included in every `/api/coach` request
- [ ] AI question displays in chat after each response
- [ ] AI question is appended to `messages` state as `{ role: "assistant", content }`
- [ ] `passed[]` array updates after every turn and never loses previously passed criteria
- [ ] Criteria checklist in UI reflects current `passed[]` state in real time
- [ ] Textarea clears after user submits each answer
- [ ] Loading indicator shows while waiting for AI response
- [ ] User cannot submit another message while AI is responding

### Grading behavior

- [ ] Criteria are cumulative — a passed criterion never drops to failed in a later turn
- [ ] AI asks only ONE question per turn
- [ ] AI question targets the most critical unmet criterion
- [ ] AI references previous answers in its questions (feels like a conversation, not a fresh start)
- [ ] Each turn's messages are saved to `messages` table in Supabase

### Early exit

- [ ] If all 5 criteria are met before question 20, `done: true` is returned immediately
- [ ] App moves to Step 4 summary automatically when `done: true`
- [ ] AI praise message displays before transitioning

### Cap at question 20

- [ ] At question 20, API always returns `done: true` regardless of criteria met
- [ ] `gaps[]` array is populated with unmet criterion names when cap is hit
- [ ] App moves to Step 4 summary automatically at cap

### Error handling

- [ ] If API returns an error, a friendly message displays (not a crash)
- [ ] If JSON parse fails, session does not break
- [ ] Groq overflow fallback triggers if primary model returns 429

---

## 5. Step 4 — Summary screen

### All criteria passed state

- [ ] Heading reads "You're ready. Write your best."
- [ ] Stats show `5/5` in green, question count, "Ready" status
- [ ] All 5 criteria rows display green with specific per-criterion praise
- [ ] "Best moment" card shows the user's strongest analogy or sentence from coaching
- [ ] Final explanation textarea is focused and ready to type
- [ ] Word count updates live as user types
- [ ] "Rate my understanding" button is disabled until minimum 30 words entered
- [ ] "Review coaching" button scrolls back to Step 3 chat history

### Cap hit state (not all criteria met)

- [ ] Heading reads "Good progress. Address these gaps."
- [ ] Stats show `X/5` in amber, `20` questions, "Unlocked" status
- [ ] Passed criteria rows show green, unmet rows show amber with specific hint
- [ ] Numbered gap box appears listing exactly what to address in the final explanation
- [ ] Textarea placeholder references the gaps

### Both states

- [ ] Concept chip displays the correct concept name
- [ ] Step progress dots show dot 4 as active

---

## 6. Rating (`/api/rate`)

- [ ] Final explanation text is sent to `/api/rate` with `concept`
- [ ] Full `messages[]` history is NOT sent to `/api/rate` (only `concept` + `finalExplanation`)
- [ ] API returns `score`, `label`, `description`, `strengths[]`
- [ ] Score is saved to `sessions` table (`final_score`, `score_label`, `score_description`)
- [ ] Loading state shows while rating is being calculated
- [ ] Score card displays after rating returns

---

## 7. Step 5 — Score screen

- [ ] Score ring displays correct number (1–100)
- [ ] Score ring fill percentage matches the score visually
- [ ] Label displays correctly based on score range:
  - [ ] 90–100 → "Expert-level clarity"
  - [ ] 75–89 → "Strong understanding"
  - [ ] 60–74 → "Good grasp"
  - [ ] 45–59 → "Developing understanding"
  - [ ] below 45 → "Keep exploring"
- [ ] 2–3 sentence description displays
- [ ] Strength tags display (minimum 1, maximum 3)
- [ ] Concept chip shows correct concept
- [ ] "New concept" button resets all state and returns to Step 1
- [ ] "View history" button opens past sessions screen (Pro only)

---

## 8. Freemium gate

- [ ] Free users are limited to 3 sessions per day
- [ ] `daily_usage` table increments correctly on each session start
- [ ] On session 3 start (free plan), usage is recorded
- [ ] When a free user tries to start session 4, gate triggers immediately
- [ ] Upgrade modal appears when gate triggers
- [ ] Upgrade modal shows Free vs Pro plan comparison
- [ ] Free users cannot bypass the gate by refreshing or navigating directly
- [ ] Pro users have no session limit — gate never triggers
- [ ] Session count in sidebar badge reflects current usage accurately (e.g. "2 of 3 sessions used today")
- [ ] Count resets at midnight (date-based, not 24-hour rolling)

---

## 9. Past sessions (Pro only)

- [ ] Past sessions screen is inaccessible to free users (redirects or shows upgrade prompt)
- [ ] Sessions list loads from `sessions` table filtered by `user_id`
- [ ] Each session card shows: concept, date, score, label
- [ ] Clicking a session loads the full coaching conversation from `messages` table
- [ ] Sessions are ordered by `created_at` descending (most recent first)
- [ ] Empty state displays if user has no past sessions

---

## 10. Database integrity

- [ ] Every session has a corresponding `user_id` (no orphaned sessions)
- [ ] Every message has a corresponding `session_id`
- [ ] Every criteria result has a corresponding `session_id`
- [ ] RLS is enabled on all tables — users cannot query other users' data
- [ ] `daily_usage` has unique constraint on `(user_id, date)` — no duplicate rows
- [ ] `final_score` is null until `/api/rate` is called and returns successfully
- [ ] `question_count` in `sessions` matches the actual number of turns in `messages`

---

## 11. API reliability

- [ ] `/api/coach` returns valid JSON on every call (no markdown fences leaking through)
- [ ] `/api/rate` returns valid JSON on every call
- [ ] Both routes handle JSON parse failure gracefully (try/catch)
- [ ] Both routes return meaningful error messages (not raw stack traces)
- [ ] GROQ_API_KEY is never exposed to the client (server-side only)
- [ ] Groq fallback model triggers on 429 from primary model
- [ ] `max_tokens: 300` is sufficient for all response types (praise, gaps, questions)

---

## 12. UI and design

- [ ] Sidebar shows correct plan badge (Free / Pro)
- [ ] Step progress dots update correctly across all 5 steps
- [ ] Topbar label updates to show the current concept name after Step 1
- [ ] All 5 step views are reachable in the correct order only
- [ ] User cannot skip steps (Step 4 is locked until coaching completes)
- [ ] Responsive layout works on mobile (sidebar collapses)
- [ ] Loading states exist for every async action
- [ ] No layout breaks on long concept names
- [ ] No layout breaks on very long AI questions or user answers
- [ ] All buttons have disabled states where appropriate
- [ ] Fonts load correctly (Instrument Serif + DM Sans)

---

## 13. End-to-end session test

Run this full flow manually before shipping:

- [ ] Sign up as a new user
- [ ] Enter concept: "Compound interest"
- [ ] Complete Step 2 (click ready)
- [ ] Give a weak first explanation (1 sentence)
- [ ] Verify AI asks a targeted question referencing the explanation
- [ ] Answer 3–4 follow-up questions, each building on the last
- [ ] Verify `passed[]` grows across turns and never shrinks
- [ ] Verify AI feels like a continuous conversation (not a fresh start each time)
- [ ] Reach `done: true` — verify Step 4 loads automatically
- [ ] Check criteria checklist matches what was actually passed
- [ ] Write a final explanation (minimum 30 words)
- [ ] Submit for rating — verify score, label, description, strengths display
- [ ] Check `sessions` table — session row has `final_score` populated
- [ ] Check `messages` table — all turns are saved
- [ ] Click "New concept" — verify all state resets cleanly
- [ ] Start a second session — verify it works independently
- [ ] Start a third session — verify usage badge shows "3 of 3"
- [ ] Try to start a fourth session — verify gate triggers and upgrade modal appears

---

## 14. Stretch — before charging users

- [ ] Stripe integration tested in test mode (free → pro upgrade flow works)
- [ ] Pro plan updates `users.plan` to `pro` via Stripe webhook
- [ ] Cancellation downgrades `users.plan` back to `free`
- [ ] Progress analytics screen shows which criteria the user struggles with most
- [ ] Export session as notes (plain text or markdown download)
- [ ] Email confirmation on sign-up works
- [ ] Password reset flow works

---

## Definition of done

The product is ready when:

1. A user can complete a full session — concept → coaching → summary → rating — without any errors
2. The AI feels like a continuous tutor, not a chatbot that resets every message
3. The freemium gate correctly blocks free users at 3 sessions per day
4. All session data is saved to Supabase and loads correctly in past sessions (Pro)
5. No API keys are exposed client-side
6. The full end-to-end test in section 13 passes without a single failure

---

_Ship the loop first. Validate completion rate. Then monetize._
