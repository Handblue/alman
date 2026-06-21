// Merges Phase-2 planner output into curriculum.json: fills each stub unit's
// title / theme / subtopics. Input = JSON file produced from the curriculum-design workflow.
//
//   node tools/word-gen/merge-curriculum.mjs <plans.json>
//
// plans.json shape: [ { categoryId, units: [ { number, title, theme, subtopics } ] } ]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const plansPath = process.argv[2];
if (!plansPath) { console.error('usage: merge-curriculum.mjs <plans.json>'); process.exit(1); }

const plans = JSON.parse(fs.readFileSync(plansPath, 'utf8'));
const curPath = path.join(__dirname, 'curriculum.json');
const cur = JSON.parse(fs.readFileSync(curPath, 'utf8'));

// Index plan units by categoryId+number.
const planByKey = new Map();
for (const p of plans) for (const u of p.units) planByKey.set(`${p.categoryId}:${u.number}`, u);

let filled = 0;
const stillStub = [];
for (const u of cur.units) {
  if (u.status !== 'stub') continue;
  const plan = planByKey.get(`${u.categoryId}:${u.number}`);
  if (plan) {
    u.title = plan.title;
    u.theme = plan.theme;
    u.subtopics = plan.subtopics;
    u.status = 'planned';
    filled++;
  } else {
    stillStub.push(`${u.categoryId}:${u.number}`);
  }
}

fs.writeFileSync(curPath, JSON.stringify(cur, null, 2) + '\n');
console.log(`Filled ${filled} stub units.`);
if (stillStub.length) console.warn(`⚠️  Still unplanned (${stillStub.length}): ${stillStub.join(', ')}`);

// Duplicate-title sanity check across the whole category list.
const titles = new Map();
const dupTitles = [];
for (const u of cur.units) {
  const k = `${u.categoryId}:${(u.title || '').toLowerCase().trim()}`;
  if (titles.has(k)) dupTitles.push(`cat ${u.categoryId} "${u.title}" (units ${titles.get(k)} & ${u.number})`);
  else titles.set(k, u.number);
}
if (dupTitles.length) console.warn(`⚠️  Duplicate titles within a category:\n  ` + dupTitles.join('\n  '));
else console.log('No duplicate titles within categories.');
