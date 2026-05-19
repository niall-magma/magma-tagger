#!/usr/bin/env python3
"""
MagmaMath Question Tagger
Tags questions in a section as KU, AP, or TH using Claude AI.
Saves results to a CSV on your Desktop.

Requirements:
  pip3 install requests anthropic

Usage:
  python3 magma_tagger.py
"""

import os
import sys
import json
import csv
import re
from datetime import datetime
from pathlib import Path

# ── Check dependencies ────────────────────────────────────
try:
    import requests
except ImportError:
    print("Missing dependency. Run: pip3 install requests anthropic")
    sys.exit(1)

try:
    import anthropic
except ImportError:
    print("Missing dependency. Run: pip3 install requests anthropic")
    sys.exit(1)

# ── Config file for saved credentials ────────────────────
CONFIG_PATH = Path.home() / ".magma_tagger_config.json"

def load_config():
    if CONFIG_PATH.exists():
        try:
            return json.loads(CONFIG_PATH.read_text())
        except:
            return {}
    return {}

def save_config(config):
    CONFIG_PATH.write_text(json.dumps(config, indent=2))
    CONFIG_PATH.chmod(0o600)  # owner-only read/write

# ── Colours for terminal output ───────────────────────────
RESET  = "\033[0m"
BOLD   = "\033[1m"
DIM    = "\033[2m"
BLUE   = "\033[94m"
GREEN  = "\033[92m"
AMBER  = "\033[93m"
PURPLE = "\033[95m"
RED    = "\033[91m"
CYAN   = "\033[96m"

TAG_COLOURS = {
    "KU": BLUE,
    "AP": GREEN,
    "TH": PURPLE,
    "HUMAN_REVIEW": AMBER,
    "ERROR": RED
}

CONF_COLOURS = {
    "high": GREEN,
    "medium": AMBER,
    "low": RED
}

def print_header():
    print(f"\n{BOLD}{'─'*60}{RESET}")
    print(f"{BOLD}  MagmaMath Question Tagger{RESET}")
    print(f"{DIM}  Tags questions as KU / AP / TH using Claude AI{RESET}")
    print(f"{BOLD}{'─'*60}{RESET}\n")

def tag_colour(tag):
    return TAG_COLOURS.get(tag, AMBER)

def conf_colour(conf):
    return CONF_COLOURS.get(conf, DIM)

# ── Claude system prompt ──────────────────────────────────
SYSTEM_PROMPT = """You are an expert in Ontario mathematics curriculum assessment. Your job is to classify math questions as KU, AP, or TH according to these precise definitions:

TAG 1 — KU (Knowledge & Understanding):
- Student recalls a fact, names a property, or executes a procedure directly and without context
- No real-world scenario or story — just the math
- Stem states the procedure or concept directly: "What is 7 × 5?" or "Which symbol completes 473 __ 437?"
- Simple test: Does the student produce a value or execute a procedure with NO context? → KU

TAG 2 — AP (Application):
- Student must decide which skill is needed, apply it to an unfamiliar situation, and interpret the result
- MUST have a real-world scenario, story, or context (names, objects, situations)
- Stem describes a scenario: "Amara earns $150 babysitting..." or "A plank is 3.45 m long..."
- Simple test: Does the student interpret a scenario, decide what to do, then execute? → AP

TAG 3 — TH (Thinking):
- Student evaluates a claim, spots an error, compares methods, or reasons about a result rather than produce one
- Stem gives a claim or result and asks the student to evaluate: "Dawit says... Is he correct?" or "Which response correctly explains..."
- Non-routine reasoning required — working backwards, generalising, error-spotting
- Simple test: Does the student evaluate a claim, explain a result, or reason about a method? → TH

If the question contains only an image with no readable text, respond with HUMAN_REVIEW.

Respond in this exact JSON format only, no other text:
{"tag":"KU","confidence":"high","reasoning":"One sentence explaining why."}

Confidence levels: "high" (very clear), "medium" (mostly clear), "low" (borderline case)
Tag values: "KU", "AP", "TH", "HUMAN_REVIEW"
"""

# ── Claude tagging ────────────────────────────────────────
def tag_question(client, question_text):
    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=200,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": f"Classify this question:\n\n{question_text}"}]
    )
    raw = message.content[0].text.strip()
    return json.loads(raw)

# ── MagmaMath API ─────────────────────────────────────────
def fetch_problems(section_id, jwt_token):
    url = f"https://api.magmamath.com/v2/problems?sectionId={section_id}&fetchAll=1&useFallbackLocale=0&locale=en-SE"
    headers = {"Authorization": f"JWT {jwt_token}"}
    resp = requests.get(url, headers=headers, timeout=30)

    if resp.status_code == 401:
        raise Exception("JWT token is expired or invalid. Please get a fresh one from DevTools.")
    if resp.status_code == 404:
        raise Exception("Section ID not found. Double-check the ID from WebAdmin.")
    if not resp.ok:
        raise Exception(f"MagmaMath API error: {resp.status_code}")

    data = resp.json()

    # Handle different response shapes
    if isinstance(data, list):
        return data
    for key in ["problems", "data", "items", "results"]:
        if key in data and isinstance(data[key], list):
            return data[key]
    # Last resort — find any list value
    for val in data.values():
        if isinstance(val, list) and len(val) > 0:
            return val
    return []

def extract_text(problem):
    for field in ["richDescription", "laTeXDescription", "description", "text", "question", "stem", "name"]:
        val = problem.get(field, "")
        if isinstance(val, str) and len(val.strip()) > 3:
            return val.strip()
    return None

def clean_latex(text):
    """Strip LaTeX markers for display — Claude handles them fine as-is."""
    return text  # Pass raw to Claude; it reads LaTeX well

# ── Main ──────────────────────────────────────────────────
def main():
    print_header()

    config = load_config()

    # ── Get JWT token ──
    saved_jwt = config.get("jwt", "")
    if saved_jwt:
        print(f"{DIM}JWT token: loaded from saved config{RESET}")
        use_saved = input(f"  Use saved JWT token? (y/n, press Enter for yes): ").strip().lower()
        if use_saved == "n":
            saved_jwt = ""

    if not saved_jwt:
        print(f"\n{BOLD}MagmaMath JWT Token{RESET}")
        print(f"{DIM}Find it in Chrome DevTools → Network → any api.magmamath.com request → Authorization header (after 'JWT '){RESET}")
        jwt = input("  Paste JWT token: ").strip()
        if not jwt:
            print(f"{RED}No JWT token entered. Exiting.{RESET}")
            sys.exit(1)
        config["jwt"] = jwt
        save_config(config)
        print(f"{GREEN}  ✓ Saved{RESET}")
    else:
        jwt = saved_jwt

    # ── Get Anthropic key ──
    saved_ant = config.get("anthropic_key", "")
    if saved_ant:
        print(f"\n{DIM}Anthropic API key: loaded from saved config{RESET}")
        use_saved = input(f"  Use saved Anthropic key? (y/n, press Enter for yes): ").strip().lower()
        if use_saved == "n":
            saved_ant = ""

    if not saved_ant:
        print(f"\n{BOLD}Anthropic API Key{RESET}")
        print(f"{DIM}Get one at console.anthropic.com{RESET}")
        ant_key = input("  Paste Anthropic API key: ").strip()
        if not ant_key:
            print(f"{RED}No API key entered. Exiting.{RESET}")
            sys.exit(1)
        config["anthropic_key"] = ant_key
        save_config(config)
        print(f"{GREEN}  ✓ Saved{RESET}")
    else:
        ant_key = saved_ant

    # ── Get Section ID ──
    print(f"\n{BOLD}Section ID{RESET}")
    print(f"{DIM}Copy from the WebAdmin URL when viewing a section{RESET}")
    section_id = input("  Paste Section ID: ").strip()
    if not section_id:
        print(f"{RED}No Section ID entered. Exiting.{RESET}")
        sys.exit(1)

    # ── Fetch problems ──
    print(f"\n{DIM}Fetching questions from MagmaMath…{RESET}")
    try:
        problems = fetch_problems(section_id, jwt)
    except Exception as e:
        print(f"{RED}✕ {e}{RESET}")
        sys.exit(1)

    if not problems:
        print(f"{AMBER}⚠ No problems found in this section. Check the Section ID.{RESET}")
        sys.exit(1)

    print(f"{GREEN}✓ Found {len(problems)} question(s){RESET}\n")

    # ── Tag each problem ──
    client = anthropic.Anthropic(api_key=ant_key)
    results = []
    counts = {"KU": 0, "AP": 0, "TH": 0, "HUMAN_REVIEW": 0, "ERROR": 0}

    for i, prob in enumerate(problems, 1):
        q_text = extract_text(prob)
        prob_id = prob.get("_id", prob.get("id", f"Q{i}"))

        prefix = f"  [{i}/{len(problems)}]"

        if not q_text:
            result = {"tag": "HUMAN_REVIEW", "confidence": "low", "reasoning": "No readable text — may be image-only."}
            counts["HUMAN_REVIEW"] += 1
            tag_c = tag_colour("HUMAN_REVIEW")
            print(f"{prefix} {tag_c}⚠ HUMAN REVIEW{RESET} {DIM}(no text){RESET}")
        else:
            try:
                result = tag_question(client, q_text)
                tag = result.get("tag", "ERROR")
                conf = result.get("confidence", "")
                reasoning = result.get("reasoning", "")
                counts[tag] = counts.get(tag, 0) + 1

                tag_c = tag_colour(tag)
                conf_c = conf_colour(conf)
                short = q_text[:60].replace("\n", " ") + ("…" if len(q_text) > 60 else "")
                print(f"{prefix} {tag_c}{BOLD}{tag}{RESET} {conf_c}({conf}){RESET}  {DIM}{short}{RESET}")
                print(f"         {DIM}↳ {reasoning}{RESET}")

            except Exception as e:
                result = {"tag": "ERROR", "confidence": "low", "reasoning": str(e)}
                counts["ERROR"] += 1
                print(f"{prefix} {RED}✕ ERROR{RESET} {DIM}{str(e)[:80]}{RESET}")

        results.append({
            "id": prob_id,
            "order": prob.get("order", i),
            "standards": ", ".join(prob.get("standards", [])),
            "text": q_text or "[Image-only]",
            "tag": result.get("tag", "ERROR"),
            "confidence": result.get("confidence", ""),
            "reasoning": result.get("reasoning", "")
        })

    # ── Summary ──
    print(f"\n{BOLD}{'─'*60}{RESET}")
    print(f"{BOLD}  Summary{RESET}")
    if counts["KU"]:    print(f"  {BLUE}KU  {counts['KU']:3d}{RESET}  Knowledge & Understanding")
    if counts["AP"]:    print(f"  {GREEN}AP  {counts['AP']:3d}{RESET}  Application")
    if counts["TH"]:    print(f"  {PURPLE}TH  {counts['TH']:3d}{RESET}  Thinking")
    if counts["HUMAN_REVIEW"]: print(f"  {AMBER}⚠   {counts['HUMAN_REVIEW']:3d}{RESET}  Human review needed")
    if counts["ERROR"]: print(f"  {RED}✕   {counts['ERROR']:3d}{RESET}  Errors")

    # ── Save CSV ──
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    desktop = Path.home() / "Desktop"
    output_path = desktop / f"magma_tags_{section_id[:8]}_{timestamp}.csv"

    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["id", "order", "standards", "text", "tag", "confidence", "reasoning"])
        writer.writeheader()
        writer.writerows(results)

    print(f"\n{GREEN}{BOLD}✓ Saved to Desktop:{RESET} {output_path.name}")
    print(f"{BOLD}{'─'*60}{RESET}\n")

if __name__ == "__main__":
    main()
