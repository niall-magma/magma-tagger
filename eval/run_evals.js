import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import 'dotenv/config';

const __dirname = dirname(fileURLToPath(import.meta.url));

const TAGGING_GUIDE = `
## The three tags

| Tag | What the student does |
|-----|-----------------------|
| KU  | Recalls a fact, names a property, or executes a procedure directly with NO real-world context |
| AP  | Reads a real-world scenario, decides which skill applies, executes it, interprets the result |
| TH  | Evaluates a claim, spots an error, works backwards from a result, or compares two methods |

## Decision test (apply in order)
1. Does the student produce a value or execute a procedure with NO context? → KU
2. Does the student interpret a scenario, decide what to do, then execute? → AP
3. Does the student evaluate a claim, explain a result, or reason about a method? → TH

## Key distinctions
- KU vs AP: if there is ANY real-world scenario or named person, it is at least AP
- AP vs TH: AP produces a value; TH evaluates one
- Working backwards (result given, find the start) → TH
- Comparing two methods or answers → TH
- Rule is given in the stem and student just executes → KU (not AP)

## Signal phrases
- KU: "What is...", "Which symbol...", "Calculate..." (no scenario), rule given in stem
- AP: named person in scenario, "How many / how much...", real-world object described
- TH: "[Name] says... Is she correct?", "Which correctly explains...", result given and student works back
`;

const SYSTEM_PROMPT = `You are an expert in Ontario's EQAO assessment framework. Classify math questions as KU, AP, or TH using the guide below.

${TAGGING_GUIDE}

Respond with valid JSON only — no markdown, no extra text:
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

  const text = response.content[0].text.trim();
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
