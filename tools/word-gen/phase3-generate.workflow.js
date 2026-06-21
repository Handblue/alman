export const meta = {
  name: 'wortkrieg-vocab-generation',
  description: 'Generate + adversarially verify 1800 German words (120 units) + 26 duplicate repairs',
  phases: [
    { title: 'Generate', detail: 'one native-teacher agent per unit (15 words each)' },
    { title: 'Verify', detail: 'one proofreader agent per unit fixes gender/translation/level' },
    { title: 'Repair', detail: 'replace duplicate headwords with unique theme-fit words' },
  ],
}

const A = typeof args === 'string' ? JSON.parse(args) : args
const UNITS = A.units
const REPAIRS = A.repairs
const BLOCK = A.blocklist
const BLOCK_TXT = BLOCK.join(', ')

const WORD_PROPS = {
  german: { type: 'string', description: 'Headword. Nouns MUST include article der/die/das. Verbs: infinitive. Adjectives: base form.' },
  turkish: { type: 'string', description: 'Turkish meaning(s), " / " separated if multiple senses.' },
  example: { type: 'string', description: 'Short natural German sentence using the headword. Ends with . ! or ?' },
  exampleTranslation: { type: 'string', description: 'Turkish translation of the example.' },
  synonyms: { type: 'array', items: { type: 'string' }, description: '0-3 German synonyms, never the headword itself.' },
  level: { type: 'string', enum: ['A1', 'A2', 'B1', 'B2', 'C1'] },
}
const WORD_ITEM = { type: 'object', required: ['german', 'turkish', 'example', 'exampleTranslation', 'level'], additionalProperties: false, properties: WORD_PROPS }
const UNIT_SCHEMA = { type: 'object', required: ['words'], additionalProperties: false, properties: { words: { type: 'array', minItems: 15, maxItems: 15, items: WORD_ITEM } } }
const REPAIR_SCHEMA = WORD_ITEM

function levelChecklist(profile) {
  return Object.entries(profile).map(([l, n]) => `${l}×${n}`).join(', ')
}

function genPrompt(u) {
  return `Sen anadili Almanca olan, Türk öğrencilere Almanca öğreten deneyimli bir öğretmensin. WortKrieg uygulaması için bir ünitenin kelime listesini hazırlıyorsun.

ÜNİTE: "${u.title}" (Kategori ${u.categoryId})
TEMA: ${u.theme}
ALT-KONULAR: ${(u.subtopics || []).join(' · ')}

GÖREV: Bu temaya uygun, GERÇEK ve YAYGIN kullanılan TAM 15 Almanca kelime üret.
SEVİYE DAĞILIMI (tam olarak uy): ${levelChecklist(u.levelProfile)}

HER KELİME İÇİN:
- german: Almanca başsözcük. İSİMLERDE MUTLAKA artikel (der/die/das) ekle ve cinsiyeti DOĞRU ver. Fiiller mastar hâlinde, sıfatlar yalın hâlde.
- turkish: kısa, doğru Türkçe karşılık (birden çok anlam varsa " / " ile ayır).
- example: başsözcüğü içeren, KISA (≤10 kelime) ve DOĞAL bir Almanca cümle; ., ! veya ? ile bitsin.
- exampleTranslation: örnek cümlenin doğru Türkçe çevirisi.
- synonyms: 0-3 Almanca eşanlamlı (başsözcüğün kendisi ASLA olamaz; isim eşanlamlılarına da artikel ekle).
- level: A1/A2/B1/B2/C1.

KURALLAR:
- 15 kelime BİRBİRİNDEN farklı olsun; aynı kelimeyi/kökü iki kez verme.
- Şu kelimeler BAŞKA ünitelerde VAR — bunları KULLANMA (eşanlamlı olarak verebilirsin ama başsözcük yapma):
${BLOCK_TXT}
- Temaya gerçekten uygun, öğretici ve günlük/akademik olarak işe yarar kelimeler seç.
- Artikel ve yazım (ß, ä/ö/ü) doğruluğuna AZAMİ dikkat. Bu en kritik kalite ölçütü.

Çıktıyı StructuredOutput ile { words: [15 kelime] } olarak ver.`
}

function verifyPrompt(u, words) {
  return `Sen titiz, anadili Almanca bir düzeltmen/Lektor'sun. Aşağıdaki 15 kelimelik liste "${u.title}" ünitesi (tema: ${u.theme}) için üretildi. Her kelimeyi TEK TEK denetle ve DÜZELTİLMİŞ 15 kelimeyi döndür.

DENETLE:
1. Artikel/cinsiyet doğru mu? (der/die/das) — Duden'e göre. En sık hata budur, çok dikkatli ol.
2. Yazım doğru mu? (ß, ä/ö/ü, büyük harf — isimler büyük harfle başlar).
3. Türkçe karşılık doğru ve net mi?
4. Örnek cümle dilbilgisel olarak DOĞRU ve DOĞAL mı? Başsözcüğü içeriyor mu? Çevirisi doğru mu?
5. Seviye (level) makul mü?
6. Eşanlamlılar doğru mu? Başsözcüğün kendisi eşanlamlı olarak verilmiş mi? (verilmişse çıkar)
7. Bu başsözcük şu yasak listede mi? Varsa, temaya uygun BENZERSİZ bir kelimeyle DEĞİŞTİR:
${BLOCK_TXT}
8. 15 kelime kendi içinde benzersiz mi? Tekrar varsa birini değiştir.

Hata bulduğun her şeyi DÜZELT. Liste zaten doğruysa aynen koru. SONUÇ tam 15 kelime olmalı, seviye dağılımı: ${levelChecklist(u.levelProfile)}.

MEVCUT LİSTE (JSON):
${JSON.stringify(words, null, 1)}

Düzeltilmiş 15 kelimeyi StructuredOutput ile { words: [...] } olarak ver.`
}

function repairPrompt(r) {
  return `Sen anadili Almanca bir öğretmensin. "${r.unitTitle}" ünitesinde "${r.replaces}" kelimesi BAŞKA bir ünitede zaten var (tekrar). Onun yerine, aynı üniteye ve seviyeye (${r.level}) uygun, BENZERSİZ tek bir Almanca kelime üret.

Bu ünitede HÂLİHAZIRDA bulunan kelimeler (bunlarla ve "${r.replaces}" ile çakışma):
${(r.siblingWords || []).join(', ')}

Şu kelimeler de başka ünitelerde var, kullanma:
${BLOCK_TXT}

Kelime "${r.unitTitle}" temasına uygun, ${r.level} seviyesinde, gerçek ve yaygın olsun. İsimse artikel (der/die/das) ekle ve cinsiyeti doğru ver. Örnek cümle kısa, doğal, doğru; Türkçe çeviri doğru olsun.

Çıktıyı StructuredOutput ile tek kelime nesnesi olarak ver: { german, turkish, example, exampleTranslation, synonyms, level }.`
}

// ── Units: generate → verify, pipelined (each unit flows independently) ──
phase('Generate')
const unitResults = await pipeline(
  UNITS,
  (u) => agent(genPrompt(u), { label: `gen:u${u.unitId} ${u.title}`, phase: 'Generate', schema: UNIT_SCHEMA }).then((r) => r?.words || null),
  (words, u) => {
    if (!words) return null
    return agent(verifyPrompt(u, words), { label: `verify:u${u.unitId} ${u.title}`, phase: 'Verify', schema: UNIT_SCHEMA })
      .then((v) => ({ unitId: u.unitId, words: (v?.words && v.words.length === 15) ? v.words : words }))
  }
)

// ── Repairs: single-word replacements for duplicate slots ──
phase('Repair')
const repairResults = await parallel(
  REPAIRS.map((r) => () =>
    agent(repairPrompt(r), { label: `repair:${r.replaces}`, phase: 'Repair', schema: REPAIR_SCHEMA })
      .then((w) => (w ? { id: r.id, ...w } : null))
  )
)

const units = unitResults.filter(Boolean)
const repairs = repairResults.filter(Boolean)
log(`Generated ${units.length}/${UNITS.length} units, ${repairs.length}/${REPAIRS.length} repairs`)
return { units, repairs }
