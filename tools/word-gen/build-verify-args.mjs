// Build the input for a quality-verify pass over the generated units.
//   node tools/word-gen/build-verify-args.mjs [--all] > /tmp/verify_args.json
// By default targets only gen-* units (the machine-generated ones). With --all, every unit.
// Output: { units: [ {unitId, categoryId, title, theme, levelProfile, words:[...] } ] }

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { UNITS_DIR } from './lib/load.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cur = JSON.parse(fs.readFileSync(path.join(__dirname, 'curriculum.json'), 'utf8'));
const meta = new Map(cur.units.map((u) => [u.id, u]));
const all = process.argv.includes('--all');

const files = fs.readdirSync(UNITS_DIR).filter((f) => f.endsWith('.json')).sort();
const units = [];
for (const file of files) {
  if (!all && !file.startsWith('gen-')) continue;
  const data = JSON.parse(fs.readFileSync(path.join(UNITS_DIR, file), 'utf8'));
  const m = meta.get(data.unitId) || {};
  units.push({
    unitId: data.unitId,
    categoryId: data.categoryId,
    title: data.title,
    theme: data.theme || m.theme || null,
    levelProfile: m.levelProfile || null,
    words: (data.words || []).map((w) => ({
      german: w.german, turkish: w.turkish, example: w.example,
      exampleTranslation: w.exampleTranslation, synonyms: w.synonyms || [], level: w.level,
    })),
  });
}

process.stdout.write(JSON.stringify({ units }));
process.stderr.write(`verify units=${units.length} (${all ? 'all' : 'gen-only'})\n`);
