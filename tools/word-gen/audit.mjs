// Audits the current corpus and writes repairs.json — the list of word slots that need
// regeneration (currently: duplicate headwords, keeping the first occurrence).
// Phase 3 consumes repairs.json to replace these with unique, theme-appropriate words.
//
//   node tools/word-gen/audit.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCorpus } from './lib/load.mjs';
import { findDuplicates } from './lib/schema.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const { words, units } = loadCorpus();
const unitById = new Map(units.map((u) => [u.id, u]));
const dups = findDuplicates(words);

const repairs = dups.map((w) => ({
  id: w.id,
  categoryId: w.categoryId,
  unitId: w.unitId,
  unitTitle: unitById.get(w.unitId)?.title ?? null,
  level: w.level,
  replaces: w.german,
  reason: `duplicate of id ${w.duplicateOf}`,
}));

fs.writeFileSync(path.join(__dirname, 'repairs.json'), JSON.stringify(repairs, null, 2) + '\n');
console.log(`Found ${repairs.length} duplicate slot(s) to repair → repairs.json`);
for (const r of repairs) console.log(`  id ${r.id} "${r.replaces}" in unit ${r.unitId} (${r.unitTitle}) [${r.level}] — ${r.reason}`);
