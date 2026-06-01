# Magma Tagger

A local CLI and web tool for classifying MagmaMath questions as **KU (Knowledge & Understanding)**, **TH (Thinking)**, or **AP (Application)** — the three cognitive demand tags used in the Ontario EQAO framework.

Built by Niall Simmons, Curriculum Manager at MagmaMath, to support the Canadian curriculum initiative.

---

## What this tool does

MagmaMath currently tags all questions as **Mild / Medium / Spicy** (levels 1–3). For the Canadian (Ontario) market, educators and the EQAO assessment framework use a different taxonomy: **KU / AP / TH**. These describe the *type* of thinking required, not just difficulty.

This tool:
- Classifies individual questions as KU, AP, or TH using an AI model
- Fetches entire sections from the MagmaMath API and classifies every question in bulk
- Exports results as CSV for analysis
- (In progress) Analyses entire books (book → chapter → section hierarchy)
- (In progress) Runs evals against officially-labelled EQAO questions to validate accuracy
- (In progress) Correlates KU/AP/TH tags with the existing Mild/Medium/Spicy (1/2/3) levels

---

## Project structure

```
magma-tagger/
├── index.html          # Browser-based UI (hosted on GitHub Pages)
├── README.md           # This file
├── TAGGING_GUIDE.md    # Full KU/AP/TH classification criteria
├── ROADMAP.md          # Phased development plan
└── CLAUDE.md           # Instructions for Claude Code sessions
```

---

## Setup

### Prerequisites
- Node.js (v18+)
- An Anthropic API key (`sk-ant-...`) — get one at console.anthropic.com
- A MagmaMath JWT token (from browser DevTools after logging into WebAdmin)

### Environment variables

Create a `.env` file in the project root:

```
ANTHROPIC_API_KEY=sk-ant-your-key-here
MAGMA_JWT=eyJhbGci...your-jwt-here
```

The JWT expires regularly. To refresh it:
1. Log in to `admin.magmamath.com`
2. Open Chrome DevTools → Network tab
3. Make any request and copy the `Authorization: Bearer ...` header value

### Run locally

```bash
# Install dependencies
npm install

# Start the local server
npm start

# Then open http://localhost:3000
```

---

## The MagmaMath API

Base URL: `https://api.magmamath.com`

All requests require: `Authorization: Bearer <JWT>`

### Key endpoints

#### Get a section's questions
```
GET /v2/sections/{sectionId}?fetchAll=1
```
Returns all questions in a section. Each question object includes:
- `_id` — question ID
- `problem` — the question text (may contain LaTeX)
- `level` — difficulty: `1` (Mild), `2` (Medium), `3` (Spicy)
- `imageId` or `cdn-id` — image reference if the question has a diagram

#### Get a book's structure
```
GET /v2/books/{bookId}
```
Returns the book with nested chapters and section IDs.

### Content hierarchy

```
Book
└── Chapter
    └── Section
        └── Question (has: text, level 1/2/3, imageId)
```

A **book** is the top-level curriculum unit (e.g. "Grade 6 Ontario"). Books contain **chapters** (e.g. "Number Sense"), which contain **sections** (e.g. "B1.2 Compare and order whole numbers"). Sections contain the individual **questions**.

### Image handling

Some questions include diagrams. Images are referenced by a `cdn-id`. To get the alt text (accessible text description) for classification purposes:
```
GET /v2/images/{imageId}
```
Returns an object with an `altText` field — pass this to the classifier alongside the question text.

---

## How the tagger works

The tagger sends each question to the Anthropic API (`claude-sonnet-4-20250514`) with a system prompt containing the full KU/AP/TH classification criteria (see `TAGGING_GUIDE.md`).

The model returns:
- The tag: `KU`, `AP`, or `TH`
- A short reasoning explanation
- The key signal that determined the tag

The prompt is designed to mirror the decision framework in the EQAO TAG Level Guidance document.

---

## The live web version

The tool is also hosted publicly at:
**`https://niall-magma.github.io/magma-tagger/`**

This requires a Gemini API key (free tier available) rather than Anthropic. The hosted version is for lightweight use — for bulk analysis and CLI workflows, use this local version.

---

## Who can use this

Any MagmaMath team member can clone this repo and run it locally. They need:
1. Their own Anthropic API key
2. A valid MagmaMath JWT (refreshed from DevTools)

Share access by pointing them to this repo on GitHub — they clone it, add their `.env`, and run `npm start`.
