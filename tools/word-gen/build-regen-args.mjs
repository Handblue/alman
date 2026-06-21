// Build per-AFFECTED-UNIT regeneration tasks to eliminate duplicate headwords.
// Deterministic keeper = lowest id in each duplicate group (preserves seeds + earliest units).
// Only the NON-keeper slots are regenerated, with all keepers locked into the blocklist.
//   node tools/word-gen/build-regen-args.mjs > /tmp/regen_args.json
// Output: { units: [ {unitId, categoryId, title, theme, levelProfile, keepWords[], replaceSlots:[{id,level,oldGerman}] } ], blocklist:[...] }

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCorpus } from './lib/load.mjs';
import { normalizeHeadword, findDuplicates } from './lib/schema.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cur = JSON.parse(fs.readFileSync(path.join(__dirname, 'curriculum.json'), 'utf8'));
const unitMeta = new Map(cur.units.map((u) => [u.id, u]));

const { words } = loadCorpus();

// findDuplicates returns the LATER occurrences (losers); keepers are everything else.
const losers = findDuplicates(words);
const loserIds = new Set(losers.map((w) => w.id));

// Blocklist = all keeper headwords (the words that stay).
const blocklist = [...new Set(
  words.filter((w) => !loserIds.has(w.id)).map((w) => normalizeHeadword(w.german))
)].sort();

// Group losers by unit.
const byUnit = new Map();
for (const w of losers) {
  if (!byUnit.has(w.unitId)) byUnit.set(w.unitId, []);
  byUnit.get(w.unitId).push(w);
}

// For each affected unit: the kept words in that unit + the slots to replace.
const wordsByUnit = new Map();
for (const w of words) {
  if (!wordsByUnit.has(w.unitId)) wordsByUnit.set(w.unitId, []);
  wordsByUnit.get(w.unitId).push(w);
}

const units = [];
for (const [unitId, slots] of byUnit) {
  const meta = unitMeta.get(unitId) || {};
  const keepWords = (wordsByUnit.get(unitId) || []).filter((w) => !loserIds.has(w.id)).map((w) => w.german);
  units.push({
    unitId,
    categoryId: meta.categoryId,
    title: meta.title,
    theme: meta.theme || null,
    levelProfile: meta.levelProfile || null,
    keepWords,
    replaceSlots: slots.map((w) => ({ id: w.id, level: w.level, oldGerman: w.german })),
  });
}
units.sort((a, b) => a.unitId - b.unitId);

process.stdout.write(JSON.stringify({ units, blocklist }));
process.stderr.write(`affected units=${units.length} slots=${losers.length} blocklist=${blocklist.length}\n`);
