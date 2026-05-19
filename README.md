# MagmaMath Question Tagger

A tool for classifying MagmaMath questions according to the Ontario mathematics curriculum assessment categories: **KU** (Knowledge & Understanding), **AP** (Application), and **TH** (Thinking). Uses Claude AI to analyse question text and assign tags with a confidence level and reasoning.

## What it does

Given a MagmaMath section ID, the tagger:
1. Fetches all questions in that section via the MagmaMath API (JWT auth)
2. Sends each question's text to Claude (claude-sonnet-4) for classification
3. Returns a tag (`KU`, `AP`, `TH`, or `HUMAN_REVIEW`), a confidence level (`high`/`medium`/`low`), and a one-sentence reasoning

**Tag definitions:**
- **KU** — Student recalls a fact or executes a procedure with no real-world context
- **AP** — Student applies a skill to a real-world scenario and interprets the result
- **TH** — Student evaluates a claim, spots an error, or reasons about a method
- **HUMAN_REVIEW** — Image-only question with no readable text

---

## Files

### `index.html`
A self-contained single-page web app. Open it in a browser (or host it anywhere) and it runs entirely client-side.

**Features:**
- **Batch tagger** — enter a section ID, fetch all questions, tag them all with a live progress bar
- **Single question checker** — paste any question text for an instant tag
- Credentials (JWT token + Anthropic API key) are saved in `localStorage` so you only enter them once
- Live results table with tag badges and confidence indicators
- Export results to CSV

**Requires:**
- A MagmaMath JWT token (from browser DevTools → Network → any `api.magmamath.com` request → `Authorization` header, after `JWT `)
- An Anthropic API key (`sk-ant-…`) from [console.anthropic.com](https://console.anthropic.com)

### `magma_tagger.py`
A terminal-based Python script that does the same thing as the web app but outputs to the terminal with colour-coded results and saves a CSV to your Desktop.

**Requirements:**
```bash
pip3 install requests anthropic
```

**Usage:**
```bash
python3 magma_tagger.py
```

The script prompts for your JWT token, Anthropic API key, and section ID. Credentials are saved to `~/.magma_tagger_config.json` (mode `0600`) so subsequent runs can reuse them.

Output is saved to `~/Desktop/magma_tags_<sectionId>_<timestamp>.csv`.

---

## Known issue: Anthropic API CORS restriction

**The `index.html` browser app only works when served from an HTTP/HTTPS URL — it will not work when opened as a local `file://` path.**

The Anthropic API requires the request header `anthropic-dangerous-direct-browser-access: true` for direct browser calls. When making this request from a `file://` origin, browsers enforce stricter CORS rules and the preflight request fails, causing a timeout or network error before the API is ever reached.

**Workaround:** Host `index.html` anywhere — GitHub Pages, Netlify, a local dev server, or even VS Code Live Server. The Python script (`magma_tagger.py`) is unaffected and works from the terminal without any hosting requirement.

### What needs to be investigated

- **Why exactly does the `file://` origin trigger a timeout rather than a clear CORS error?** The browser may be silently dropping the preflight instead of returning a meaningful error, which makes debugging harder.
- **Is there a way to make it work locally without a server?** Options to explore: a lightweight local proxy (e.g. a tiny Express or Python HTTP server that forwards to the Anthropic API and adds the right headers), or packaging `index.html` as an Electron/Tauri app that bypasses browser CORS entirely.
- **Does the `anthropic-dangerous-direct-browser-access` header behave differently across browsers?** Initial testing was done in Chrome; Safari and Firefox may surface a clearer error or have different preflight behaviour.
