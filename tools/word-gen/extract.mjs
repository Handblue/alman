// One-time extractor: parse the hand-authored data/*.ts into the pipeline's
// structured form — per-unit JSON files (source of truth) + curriculum.json (master plan).
//
//   node tools/word-gen/extract.mjs
//
// Existing 40 units are seeded with their real titles + words (ids preserved).
// The remaining 120 units (to reach 20/category) are created as STUBS with assigned
// unitId / number / level profile, for Phase 2 (curriculum design) to fill, and
// Phase 3 (generation) to populate with words.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { UNITS_PER_CATEGORY, WORDS_PER_UNIT } from './lib/schema.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const UNITS_DIR = path.join(__dirname, 'units');

// Evaluate an exported array literal (`export const NAME ... = [ ... ];`) from a .ts source.
// Safe here: our own repo files, build-time only. Line comments inside the array are fine.
function readArrayLiteral(file, name) {
  const src = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const at = src.indexOf(name);
  const start = src.indexOf('[', at);
  const end = src.lastIndexOf(']');
  const text = src.slice(start, end + 1);
  // eslint-disable-next-line no-new-func
  return new Function(`return ${text}`)();
}

// Per-category level distribution for newly generated units (sums to 15).
// Guides the generator; categories carry a level theme.
const LEVEL_PROFILES = {
  1: { A1: 11, A2: 4 },                          // A1 Kelimeler — beginner core
  2: { A1: 3, A2: 3, B1: 3, B2: 3, C1: 3 },      // A1–C1 Gramer — full spread
  3: { B1: 5, B2: 6, C1: 4 },                    // Goethe Sınav
  4: { B1: 5, B2: 6, C1: 4 },                    // telc Sınav
  5: { A1: 5, A2: 6, B1: 4 },                    // Günlük Hayat
  6: { B2: 8, C1: 7 },                           // Akademik
  7: { B2: 6, C1: 9 },                           // Felsefe
  8: { B1: 5, B2: 6, C1: 4 },                    // Deyimler (idioms)
};

function main() {
  const WORDS = readArrayLiteral('data/words.ts', 'WORDS');
  const UNITS = readArrayLiteral('data/units.ts', 'UNITS');
  const CATEGORIES = readArrayLiteral('data/categories.ts', 'CATEGORIES');

  fs.rmSync(UNITS_DIR, { recursive: true, force: true });
  fs.mkdirSync(UNITS_DIR, { recursive: true });

  // Group existing words by unitId.
  const byUnit = new Map();
  for (const w of WORDS) {
    if (!byUnit.has(w.unitId)) byUnit.set(w.unitId, []);
    byUnit.get(w.unitId).push(w);
  }

  const curriculumUnits = [];

  // 1) Seed existing 40 units (preserve ids + content verbatim).
  for (const u of UNITS) {
    const words = (byUnit.get(u.id) || []).slice().sort((a, b) => a.id - b.id);
    const file = `seed-c${u.categoryId}-u${String(u.id).padStart(3, '0')}.json`;
    fs.writeFileSync(
      path.join(UNITS_DIR, file),
      JSON.stringify({ kind: 'seed', unitId: u.id, categoryId: u.categoryId, number: u.number, title: u.title, words }, null, 2) + '\n'
    );
    curriculumUnits.push({
      id: u.id, categoryId: u.categoryId, number: u.number, title: u.title,
      status: 'existing', file,
    });
  }

  // 2) Create stubs for the missing units (reach UNITS_PER_CATEGORY per category).
  let nextUnitId = Math.max(...UNITS.map((u) => u.id)) + 1;     // 41
  let nextWordId = Math.max(...WORDS.map((w) => w.id)) + 1;     // 601
  const newUnits = [];
  for (const cat of CATEGORIES) {
    const existing = UNITS.filter((u) => u.categoryId === cat.id);
    const usedNumbers = new Set(existing.map((u) => u.number));
    const existingTitles = existing.map((u) => u.title);
    for (let number = 1; number <= UNITS_PER_CATEGORY; number++) {
      if (usedNumbers.has(number)) continue;
      newUnits.push({
        id: nextUnitId++, categoryId: cat.id, number,
        title: null, theme: null, subtopics: [],
        levelProfile: LEVEL_PROFILES[cat.id],
        status: 'stub',
        // context for the planner: sibling titles to avoid overlap
        _siblingTitles: existingTitles,
        firstWordId: nextWordId,
      });
      nextWordId += WORDS_PER_UNIT;
    }
  }
  for (const u of newUnits) curriculumUnits.push(u);

  // 3) Write curriculum.json (master plan).
  const curriculum = {
    generatedBy: 'tools/word-gen/extract.mjs',
    wordsPerUnit: WORDS_PER_UNIT,
    unitsPerCategory: UNITS_PER_CATEGORY,
    categories: CATEGORIES.map((c) => ({
      id: c.id, name: c.name, description: c.description,
      levelProfile: LEVEL_PROFILES[c.id],
    })),
    units: curriculumUnits.sort((a, b) => a.categoryId - b.categoryId || a.number - b.number),
  };
  fs.writeFileSync(path.join(__dirname, 'curriculum.json'), JSON.stringify(curriculum, null, 2) + '\n');

  // Summary.
  const seedCount = UNITS.length;
  const stubCount = newUnits.length;
  console.log(`Extracted ${WORDS.length} words into ${seedCount} seed unit files.`);
  console.log(`Created ${stubCount} stub units (ids ${newUnits[0]?.id}..${nextUnitId - 1}), word ids 601..${nextWordId - 1}.`);
  console.log(`Total target: ${seedCount + stubCount} units, ${(seedCount + stubCount) * WORDS_PER_UNIT} words.`);
}

main();
