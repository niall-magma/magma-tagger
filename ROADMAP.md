# Magma Tagger — Project Roadmap

This document tracks the phased development plan agreed between Niall Simmons (Curriculum Manager) and his manager. The goal is to produce a data report informing a decision about whether and how to add KU/AP/TH tags to MagmaMath's question bank.

---

## Context

MagmaMath currently tags all questions as Mild / Medium / Spicy (levels 1/2/3). The Ontario (Canadian) market prefers the EQAO framework's KU / AP / TH taxonomy. Before deciding whether to re-tag questions, we need to:

1. Validate that our AI tagger is accurate enough to trust
2. Analyse the current EQAO question bank using the tagger
3. Understand whether Mild/Medium/Spicy already maps onto KU/AP/TH (if so, re-tagging could be a simple product team mapping rather than a manual effort)

The scope for now is the **EQAO question books** — a separate section of the MagmaMath library distinct from the general curriculum. These are the questions to analyse first.

---

## Phase 1 — Eval runner ✅ IN PROGRESS

**Goal:** Validate tagger accuracy before using it for real decisions.

**How it works:**
- Take a published EQAO document where questions are already officially labelled KU/AP/TH
- Feed each question to the tagger **without** telling it the answer
- Compare tagger output to the known label
- Calculate accuracy score + confusion matrix (e.g. "confused KU for TH 3 times")

**Output:** Accuracy percentage + breakdown of errors by tag type.

**Success criteria:** >85% accuracy before proceeding to Phase 2.

**Files involved:**
- `eval/run_evals.js` — reads eval dataset, runs tagger, compares results
- `eval/dataset.json` — labelled questions from published EQAO document
- `eval/results/` — output files from eval runs

---

## Phase 2 — Book analyser

**Goal:** Given a Book ID, classify every question in the book and produce a structured report.

**How it works:**
1. Fetch book structure: `GET /v2/books/{bookId}` → get chapter list + section IDs
2. For each section: `GET /v2/sections/{sectionId}?fetchAll=1` → get all questions
3. For each question: run the tagger → get KU/AP/TH tag
4. Also capture the `level` field (1/2/3 = Mild/Medium/Spicy) from each question

**Output:** CSV with one row per question:
```
bookId, bookTitle, chapterId, chapterTitle, sectionId, sectionTitle, questionId, questionText, level (1/2/3), ku_ap_th_tag, tagger_reasoning
```

Plus summary rows:
- Per section: count of KU/AP/TH
- Per chapter: count of KU/AP/TH
- Whole book: count of KU/AP/TH

**Files involved:**
- `scripts/analyse_book.js` — main book analysis script
- `output/` — CSV exports go here

---

## Phase 3 — Correlation analysis

**Goal:** Understand whether Mild/Medium/Spicy maps onto KU/AP/TH.

**How it works:**
- The Phase 2 CSV already contains both `level` (1/2/3) and `ku_ap_th_tag`
- Build a cross-tabulation: for each Mild/Medium/Spicy level, what % are KU / AP / TH?
- Look for strong correlations (e.g. "90% of Spicy questions tag as TH")

**Output:** Summary sheet added to the Phase 2 CSV, or a separate analysis CSV:
```
level, mild_count, medium_count, spicy_count, ku_count, ap_count, th_count, ku_pct, ap_pct, th_pct
```

**Decision this informs:** If strong correlation exists (e.g. Mild≈KU, Medium≈AP, Spicy≈TH), re-tagging could be a one-time product team mapping. If correlation is weak, manual re-tagging or AI-assisted re-tagging would be needed.

---

## Phase 4 — (Future, not in scope yet)

If correlation analysis shows re-tagging is feasible:
- Build a bulk re-tagger tool that writes KU/AP/TH tags back to question records via the API
- This is a product team decision and will require backend work

---

## Current status

| Phase | Status | Owner |
|-------|--------|-------|
| Phase 1 — Eval runner | 🟡 In progress | Niall |
| Phase 2 — Book analyser | 🔴 Not started | Niall |
| Phase 3 — Correlation analysis | 🔴 Not started | Niall |
| Phase 4 — Bulk re-tagger | ⚪ Out of scope | TBD |
