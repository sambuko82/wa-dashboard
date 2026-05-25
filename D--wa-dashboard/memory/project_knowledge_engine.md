---
name: project-knowledge-engine
description: "JVTO Knowledge-to-Reply Engine — Phase 1 build status, architecture, and what was shipped in PR"
metadata: 
  node_type: memory
  type: project
  originSessionId: fe1ee1e7-6933-4fed-93f5-1599951e7295
---

JVTO Knowledge-to-Reply Engine Phase 1 shipped in PR #1 (2026-05-20).

**Why:** Staff manually read Raw/ docs to compose WA replies — slow, error-prone, single-operator. This bridges llm-wiki (knowledge) → wa-dashboard (WA pipe).

**PR:** https://github.com/sambuko82/wa-dashboard/pull/1 (sam-branch → main, 16 files, 2179 insertions)

**Architecture:**
- `npm run build:context` reads `WIKI_PATH=E:\Users\JAVA VOLCANO\llm-wiki` and compiles 6 JSON indexes to `compiled/jvto-context/` (gitignored)
- Runtime: extract → match → render → verify → persist → DraftPanel shows result
- No LLM in Phase 1. Template-based only.

**6 compiled indexes:**
- packages.index.json (15 packages, pax tiers, URLs, inclusions)
- itineraries.index.json (16 day-by-day itineraries)
- operational-facts.index.json (10 fact records)
- canned-responses.index.json (19 bilingual templates)
- reply-guards.index.json (11 rules, 7 blocking)
- brand-voice.index.json (EN default, 14 forbidden phrases)

**Key files:**
- `src/lib/jvto-context-loader.ts` — lazy cache
- `src/lib/jvto-request-extractor.ts` — keyword extraction + lang detection
- `src/lib/jvto-context-matcher.ts` — scored package match
- `src/lib/jvto-template-renderer.ts` — template + var substitution
- `src/lib/jvto-verification-guard.ts` — 21 checks (17 content + 4 brand voice)
- `src/app/api/jvto/draft/route.ts` — POST + PATCH endpoints
- `src/components/draft-panel.tsx` — embedded in /customers/[id] chat sidebar

**DB:** JvtoReplyDraft table created via `prisma/create-jvto-reply-draft.sql` (raw SQL, not migrate — shared DB has Laravel tables).

**prisma.config.ts** patched to load both `.env` and `.env.local` (override).

**Phase 2 candidates:** LLM draft generation (Claude Haiku), hotel/routes/policies indexes, Klook package map, DraftLog audit UI.

**How to apply:** `npm run build:context` must be re-run whenever llm-wiki changes.
