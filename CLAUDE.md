# CLAUDE.md — Instructions for Claude Code

This file is read automatically by Claude Code at the start of every session. It tells you everything you need to know about this project so Niall doesn't have to re-explain context.

---

## Who you're working with

**Niall Simmons** — Curriculum Manager at MagmaMath. He is learning to use Claude Code and is not a professional developer. Explain what you're doing in plain language. Keep terminal commands simple and one at a time. When you create or edit files, say clearly what changed and why.

---

## What this project is

A tool to classify MagmaMath math questions as **KU (Knowledge & Understanding)**, **AP (Application)**, or **TH (Thinking)** — the taxonomy used in Ontario's EQAO assessment framework.

The full classification criteria are in `TAGGING_GUIDE.md`. Read that file before writing any classification logic.

The full development plan is in `ROADMAP.md`. Read that to understand what phase we're in and what comes next.

---

## Project structure

```
magma-tagger/
├── index.html              # Browser UI (hosted on GitHub Pages — do not break this)
├── README.md               # Setup and API reference
├── TAGGING_GUIDE.md        # KU/AP/TH classification criteria
├── ROADMAP.md              # Three-phase development plan
├── CLAUDE.md               # This file
├── .env                    # API keys (never commit this)
├── package.json            # Node dependencies
├── scripts/
│   └── analyse_book.js     # Book-level analysis (Phase 2)
├── eval/
│   ├── run_evals.js        # Eval runner (Phase 1)
│   ├── dataset.json        # Labelled EQAO questions for testing
│   └── results/            # Eval output files
└── output/                 # CSV exports from book analysis
```

---

## Environment variables

These must be in a `.env` file. Never log or commit them.

```
ANTHROPIC_API_KEY=sk-ant-...      # For the AI tagger
MAGMA_JWT=eyJhbGci...             # For the MagmaMath API (expires! refresh from DevTools)
```

The JWT expires frequently. If you get 401 errors from the MagmaMath API, tell Niall to refresh his JWT from browser DevTools.

---

## MagmaMath API reference

Base URL: `https://api.magmamath.com`  
Auth header: `Authorization: Bearer ${process.env.MAGMA_JWT}`

### Endpoints you'll use

**Get a section's questions:**
```
GET /v2/sections/{sectionId}?fetchAll=1
```
Returns questions. Each question has: `_id`, `problem` (text), `level` (1=Mild, 2=Medium, 3=Spicy), optionally `imageId`.

**Get a book's structure:**
```
GET /v2/books/{bookId}
```
Returns book with nested chapters and section IDs.

**Get image alt text:**
```
GET /v2/images/{imageId}
```
Returns `{ altText: "..." }` — pass this to the tagger for questions with diagrams.

### Content hierarchy
Book → Chapter → Section → Question

---

## How the tagger works

Use the Anthropic SDK (`@anthropic-ai/sdk`). Model: `claude-sonnet-4-20250514`.

The system prompt must include the full classification criteria from `TAGGING_GUIDE.md`.

Expected output per question:
```json
{
  "tag": "KU" | "AP" | "TH",
  "reasoning": "Short explanation",
  "key_signal": "The specific part of the question that determined the tag"
}
```

Always ask for JSON output. Parse it carefully — wrap in try/catch.

---

## Current phase

**Phase 1 — Eval runner.** See `ROADMAP.md` for full details.

If Niall says "let's work on evals" — he means Phase 1: building `eval/run_evals.js` and testing the tagger against the labelled dataset in `eval/dataset.json`.

If Niall says "let's work on the book analyser" — he means Phase 2: building `scripts/analyse_book.js`.

---

## Important rules

1. **Never commit `.env`** — it contains API keys
2. **Never break `index.html`** — this is the live public tool on GitHub Pages
3. **Always rate-limit API calls** — add a small delay (300–500ms) between questions to avoid hitting rate limits
4. **Always handle JWT expiry** — if a 401 comes back from the MagmaMath API, surface a clear message telling Niall to refresh his JWT
5. **CSV outputs go in `/output/`** — create the folder if it doesn't exist
6. **Eval results go in `/eval/results/`** — timestamped filenames so runs don't overwrite each other
