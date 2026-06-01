# KU / AP / TH Tagging Guide

This document defines the three cognitive demand tags used to classify MagmaMath questions for the Ontario (EQAO) market. It is the authoritative reference for the tagger's system prompt and for anyone writing or reviewing questions.

Source: MagmaMath TAG Level Guidance document + EQAO Creator's Reference Guide.

---

## The three tags at a glance

| Tag | Full name | What the student does |
|-----|-----------|----------------------|
| TAG 1 — KU | Knowledge & Understanding | Recalls a fact, names a property, or executes a procedure directly with no real-world context |
| TAG 2 — AP | Application | Decides which skill is needed, applies it to an unfamiliar real-world scenario, and interprets the result |
| TAG 3 — TH | Thinking | Reasons about a result rather than producing one: spots an error, evaluates a claim, generalises, works backwards, or compares methods |

**Critical:** These tags describe the *type* of thinking, not the difficulty. A KU question is not necessarily easy. A TH question is not necessarily hard. All three types should be answerable by roughly 70–80% of on-standard students.

---

## The three-question decision test

When classifying a question, apply these three tests in order:

1. Does the student produce a value or execute a procedure with **no context**? → **KU**
2. Does the student **interpret a scenario**, decide what to do, and then execute? → **AP**
3. Does the student **evaluate a claim, explain a result, or reason about a method**? → **TH**

If the question passes two tests, assign the higher tag. If it passes none clearly, the question is probably weak and needs revision.

---

## TAG 1 — KU (Knowledge & Understanding)

### What KU is
Tests whether the student has foundational knowledge or can execute the core procedure of an expectation **without the added cognitive load of a real-world scenario or an evaluative task**.

The stem typically: states the procedure or concept directly.  
Examples: *"What is 7 × 5?"* or *"Which symbol correctly completes 473 __ 437?"*

### What KU is NOT
- Not a trick question
- Not an AP question with a thin context ("Aisha has 7 groups of 5 tiles" is AP, not KU)
- Not necessarily easy — recall of a complex fact (e.g. definition of irrational number) or multi-step algorithm (e.g. long division to express remainder as fraction) is still KU

### Common KU mistakes

| Mistake | Fix |
|---------|-----|
| Adding a thin scenario that technically makes it AP but tagging as KU | Remove the scenario entirely |
| Correct answer is visually obvious (longest option, only option with a number) | Ensure all four options are the same format and length |
| Writing KU for an inherently contextual expectation by decontextualising it | For contextual expectations (data analysis, financial decisions), KU tests the underlying definition or formula |

### KU signal phrases
- "What is..."
- "Which symbol..."
- "Which property..."
- "Calculate..." (with no scenario)
- "Name the..."
- Rule is explicitly given in the stem

---

## TAG 2 — AP (Application)

### What AP is
Tests whether the student can **transfer their knowledge to an unfamiliar situation**: read a scenario, decide which skill or procedure applies, execute it, and interpret the result in context.

The stem typically: describes a real-world scenario.  
Examples: *"Amara earns $150 babysitting..."* or *"A plank is 3.45 m long..."*

### What AP is NOT
- Not a scenario question where the procedure is explicitly named in the stem
- Not a TH question — AP produces a value; TH evaluates one
- Not just a harder KU with bigger numbers

### Common AP mistakes

| Mistake | Fix |
|---------|-----|
| Telling the student what procedure to use ("Use the formula to find...") | Remove the procedure hint — let the student decide |
| Real-world wrapper so thin it's really KU | Ensure the context genuinely requires interpretation, not just reading |
| Scenario so complex it becomes TH | If the student is evaluating a claim rather than producing a result, it's TH |

### AP signal phrases
- "Amara / Kofi / [name] has..."
- "A [real-world object] is..."
- "How many / how much..."
- "What is the total..."
- Named person in a real-world situation

---

## TAG 3 — TH (Thinking)

### What TH is
Tests whether the student can **reason about mathematics rather than produce mathematics**. The student is not executing a procedure — they are evaluating a claim, explaining a relationship, spotting an error, generalising a result, or working backwards from a conclusion.

The stem typically: gives a claim or result and asks the student to evaluate it.  
Examples: *"Dawit says... Is he correct?"* or *"Which response correctly explains..."*

### What TH is NOT
- Not just a harder AP — if it's a more complex word problem requiring more steps, it's still AP
- Not an open-ended question — must have one unambiguous correct answer
- Not beyond the expectation — the reasoning must still be about the specific expectation's content

### The four TH frames

| Frame | How it works | Best used for |
|-------|-------------|---------------|
| **Error spotting** | A named student produces a wrong result. The student must identify whether it is correct and give the right answer with reasoning. | Any procedural expectation. Default TH frame. |
| **Claim evaluation** | A named student makes a general claim. The student must confirm or disprove. | Geometric properties, number properties, pattern rules, probability. |
| **Working backwards** | The result is given; the student must find the starting value or reconstruct the process. | Equations, reverse operations, inverse relationships. |
| **Comparison / which is better** | Two methods, representations, or answers are shown. The student must identify which is correct or explain what each reveals. | Data representation, financial decisions, equivalent expressions. |

### TH signal phrases
- "[Name] says... Is she correct?"
- "Which response correctly explains..."
- "Which of the following could NOT be..."
- "Is this reasonable?"
- A claim is made and the student must verify or disprove

---

## Relationship to Mild / Medium / Spicy

MagmaMath's existing tagging system:

| Level | Label | Description |
|-------|-------|-------------|
| 1 | Mild | Approaching standard — scaffolded, friendly numbers, clear instructions |
| 2 | Medium | Meets standard — no scaffolding, standard numbers and word problems |
| 3 | Spicy | Exceeds standard — work backwards, find errors, synthesise information |

**Hypothesised correlation:**
- Spicy (3) likely maps to TH most often, sometimes AP
- Medium (2) likely maps to AP most often, sometimes KU
- Mild (1) likely maps to KU most often

However, this is a research hypothesis — the purpose of the correlation analysis phase is to validate this with real data from the MagmaMath question bank.

**Key difference:** Mild/Medium/Spicy is about difficulty. KU/AP/TH is about cognitive type. They are related but not the same dimension.

---

## Hard cases

### AP vs TH (the most common confusion)

Ask: is the student **producing** a value, or **evaluating** one?

- "What is the 20th term of the pattern 5, 8, 11, 14...?" → **AP** (student applies the rule to produce a value)
- "A student says the 20th term is 62. Is she correct?" → **TH** (student must verify the claim)
- "The rule is 'add 3.' What is the 4th term if the first is 5?" → **KU** (rule is given, student just executes)

### KU vs AP (thin context problem)

Ask: does the scenario require the student to make a decision, or is it just flavour text?

- "What is 7 × 5?" → **KU**
- "Aisha has 7 groups of 5 tiles. How many tiles?" → **AP** (the scenario, however brief, requires interpretation)
- "In the expression n + 7, what does n represent?" → **KU** (no real-world scenario, tests knowledge of notation)

### Financial literacy

- Interest rates, currency, budgeting questions are almost always AP or TH
- KU for financial literacy tests the underlying formula or definition, not its application
- Never use pennies; use clean numbers (round percentages, whole dollar amounts where possible)
