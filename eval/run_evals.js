import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import 'dotenv/config';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SYSTEM_PROMPT = `You are an expert classifier for Ontario's EQAO mathematics assessment framework. Classify each question as KU, AP, or TH using EQAO's official definitions below.

## Official EQAO definitions

**KU — Knowledge and Understanding**
The student must demonstrate subject-specific content (knowledge) and/or comprehension of its meaning (understanding).
- The procedure or formula is directly given, or the student simply recalls a fact/definition and applies it once.
- A single known operation is executed with no ambiguity about which operation to use.
- Even if a named person or scenario appears, if the formula is provided and the student just substitutes, it is still KU.
- Examples: direct arithmetic (95 + 19), solving one equation (7x = 28), simplifying an expression with given rules, identifying which subset numbers belong to, identifying a shape by its properties, reading a table and comparing values directly.

**AP — Application**
The student must EITHER:
(a) Select the appropriate tool (decide which operation, formula, or approach to use — it is NOT given), OR
(b) Get the necessary information and "fit" it to the problem.
- A context (word problem, scenario) is typically present, but the distinguishing feature is that the student decides what to do.
- Produces one result using one selected method.
- A question moves from KU to AP when context is added OR when the tool is not provided.
- Examples: word problems where the student chooses which operation(s) to apply, coding questions where the student selects the right construct, geometric questions where the student decides which property to apply, unit conversion questions, selecting the best strategy for a single-step task.

**TH — Thinking**
The student must EITHER:
(a) Select AND SEQUENCE a variety of tools (multi-step plan required), OR
(b) Demonstrate a critical thinking process such as reasoning, comparing, evaluating, or justifying.
- Multi-step problems where the student must plan two or more different operations in sequence → TH.
- Comparing multiple results (e.g., solve 4 equations and pick the greatest) → TH.
- Finding a pattern rule by reasoning (not just extending a rule already given) → TH.
- Evaluating which code/formula/method is correct by reasoning about the logic → TH.
- Calculating multiple statistics (range, median, mean) from one dataset → TH.
- Note: TH is NOT limited to "error spotting" or "Is she correct?" frames. Any question requiring a plan or sequencing counts.

## Critical distinctions

**KU vs AP:**
- Is the procedure/formula/rule explicitly given? → KU (even with a named person or scenario)
- Must the student select which procedure/rule to apply? → AP
- Recognising a definition or classification (non-linear vs linear, which graph type) → KU
- Applying a geometric/numeric property to a specific situation (pyramid faces → base shape) → AP
- Multi-step unit conversions or exponent simplification where the student selects which laws to use → AP

**AP vs TH:**
- Two-step or multi-step problems are NOT automatically TH. If the steps flow naturally once the method is selected, it is AP.
- AP: net displacement from sequential movements; modify an equation per given instructions; unit conversion; selecting the best strategy from options; choosing financial tools that improve a position.
- TH requires either: (a) genuinely non-obvious multi-step planning where the operations are not immediately clear, OR (b) computing multiple separate results and then comparing them.

**Common TH patterns:**
- "How many MORE / FEWER" when it requires two completely different operations (e.g. multiply for each person, then subtract — three distinct steps)
- Finding the pattern rule itself from data where no rule is given (requires reasoning, not execution)
- "Which equation gives the greatest value?" — solve several equations separately and compare results
- Evaluating which code/formula is mathematically correct by reasoning about the logic
- Calculating range AND median AND mean from one dataset (three different statistical procedures)
- Comparing two multi-step options (e.g. calculate total cost of Option A and Option B, then compare)
- Reasoning about abstract mathematical properties (density of number sets, justifying a relationship)

**NOT TH (these are AP):**
- Multi-step problems where each step follows naturally once the method is chosen (net displacement, unit conversion, modifying an equation per explicit instructions, selecting a strategy)
- "Select TWO options" questions where the student applies knowledge to a real-world scenario
- Finding a missing term in a pattern table (select the rule and apply it)

Respond with valid JSON only — no markdown fences, no extra text:
{
  "tag": "KU" | "AP" | "TH",
  "reasoning": "One sentence explaining the classification",
  "key_signal": "The specific part of the question that determined the tag"
}`;

async function classifyQuestion(client, question) {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 300,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: question }],
  });

  const raw = response.content[0].text.trim();
  const text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  return JSON.parse(text);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runEvals() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('Error: ANTHROPIC_API_KEY not found in .env');
    process.exit(1);
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const dataset = JSON.parse(readFileSync(join(__dirname, 'dataset.json'), 'utf8'));

  console.log(`Running evals on ${dataset.length} questions...\n`);

  const results = [];
  let correct = 0;

  // confusion matrix: confusion[actual][predicted]
  const tags = ['KU', 'AP', 'TH'];
  const confusion = {};
  for (const t of tags) {
    confusion[t] = { KU: 0, AP: 0, TH: 0 };
  }

  for (let i = 0; i < dataset.length; i++) {
    const item = dataset[i];
    process.stdout.write(`[${i + 1}/${dataset.length}] ${item.id} ... `);

    let result;
    try {
      result = await classifyQuestion(client, item.question);
    } catch (err) {
      console.log(`ERROR: ${err.message}`);
      results.push({ ...item, predicted: 'ERROR', error: err.message, pass: false });
      if (i < dataset.length - 1) await sleep(400);
      continue;
    }

    const pass = result.tag === item.label;
    if (pass) correct++;
    confusion[item.label][result.tag]++;

    const icon = pass ? '✓' : `✗ (predicted ${result.tag})`;
    console.log(icon);
    if (!pass) {
      console.log(`   Reasoning: ${result.reasoning}`);
      console.log(`   Key signal: ${result.key_signal}`);
    }

    results.push({
      id: item.id,
      grade: item.grade,
      source: item.source,
      label: item.label,
      predicted: result.tag,
      pass,
      reasoning: result.reasoning,
      key_signal: result.key_signal,
      question: item.question,
    });

    if (i < dataset.length - 1) await sleep(400);
  }

  const accuracy = ((correct / dataset.length) * 100).toFixed(1);

  console.log('\n' + '='.repeat(50));
  console.log(`ACCURACY: ${correct}/${dataset.length} = ${accuracy}%`);
  console.log(`Target: >85%  |  Status: ${parseFloat(accuracy) >= 85 ? 'PASS ✓' : 'FAIL ✗'}`);

  console.log('\nConfusion matrix (rows = actual, columns = predicted):');
  console.log('         KU    AP    TH');
  for (const actual of tags) {
    const row = tags.map(pred => String(confusion[actual][pred]).padStart(4)).join('  ');
    console.log(`  ${actual}  ${row}`);
  }

  // Errors summary
  const errors = results.filter(r => !r.pass && r.predicted !== 'ERROR');
  if (errors.length > 0) {
    console.log('\nMisclassifications:');
    for (const e of errors) {
      console.log(`  ${e.id}: actual=${e.label}, predicted=${e.predicted}`);
      console.log(`    "${e.key_signal}"`);
    }
  }

  // Save results
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const outPath = join(__dirname, 'results', `eval_${timestamp}.json`);
  mkdirSync(join(__dirname, 'results'), { recursive: true });
  writeFileSync(outPath, JSON.stringify({ accuracy, correct, total: dataset.length, confusion, results }, null, 2));
  console.log(`\nFull results saved to eval/results/eval_${timestamp}.json`);
}

runEvals().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
