import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [app, admin, migration, index] = await Promise.all([
  readFile(new URL("../app.js", import.meta.url), "utf8"),
  readFile(new URL("../admin.js", import.meta.url), "utf8"),
  readFile(new URL("../supabase/migrate-basic-modules.sql", import.meta.url), "utf8"),
  readFile(new URL("../index.html", import.meta.url), "utf8")
]);
const expectedKeys = Array.from({ length: 15 }, (_, i) => "m" + String(i + 1).padStart(2, "0"));
const expectedSlugs = ["home","mosjid-porichiti","itihas","motawalli","committee","prayer","special-prayer","notices","news","islamic-learning","imam","services","donations","gallery","contact"];

test("public and admin apps expose exactly the fixed 15 modules", () => {
  for (const source of [app, admin]) {
    const modules = [...source.matchAll(/\["(m\d{2})","([a-z-]+)","/g)];
    assert.deepEqual(modules.map(x => x[1]), expectedKeys);
    assert.deepEqual(modules.map(x => x[2]), expectedSlugs);
  }
});

test("admin uses existing auth and content tables but no donation accounting UI", () => {
  assert.match(admin, /from\("admin_profiles"\)/);
  assert.match(admin, /from\("mosque_entries"\)/);
  assert.doesNotMatch(admin, /from\("donation_records"\)|donationForm|donationSummary|loadDonations/);
  assert.match(app, /from\("mosque_entries"\)/);
});

test("every admin writing field is limited to 800 words and gallery uploads remain", () => {
  assert.match(admin, /const WORD_LIMIT=800/);
  assert.match(admin, /writingFieldsValid/);
  assert.match(admin, /bindWordLimit\(\$\("title"\)/);
  assert.match(admin, /bindWordLimit\(body/);
  assert.match(admin, /bindWordLimit\(\$\("metadata"\)/);
  assert.match(admin, /canReview/);
  assert.match(admin, /galleryForm.*addEventListener/s);
  assert.match(admin, /storage\.from\("mosque-media"\)\.upload/);
});

test("migration targets the existing schema and preserves role controls", () => {
  assert.match(migration, /mosque_entries/);
  assert.match(migration, /donation_records/);
  assert.match(migration, /admin_profiles/);
  assert.match(migration, /mosque-media/);
  const executableSql = migration.replace(/^--.*$/gm, "");
  assert.doesNotMatch(executableSql, /module_record_access|public\.profiles|module_records/);
});

test("public homepage still renders the published donations information module", () => {
  for (const id of ["heroDynamic","historyDynamic","committeeDynamic","newsDynamic","learningDynamic","servicesDynamic","galleryDynamic","contactDynamic","donationsDynamic","specialPrayerDynamic"]) {
    assert.ok(index.includes('id="' + id + '"'), "missing homepage target " + id);
    assert.ok(app.includes('"' + id + '"') || app.includes('id="' + id + '"'), "app does not render " + id);
  }
  assert.match(app, /eq\("status","published"\)/);
  assert.match(app, /safeUrl/);
});

test("admin authentication, review workflow and password recovery remain enabled", () => {
  assert.match(admin, /signInWithPassword/);
  assert.match(admin, /canReview/);
  assert.match(admin, /resetPasswordForEmail/);
  assert.match(admin, /PASSWORD_RECOVERY/);
  assert.match(admin, /updateUser\(\{password\}\)/);
  assert.doesNotMatch(admin, /donationForm|donationSummary|donation_records/);
});

test("public website keeps its stylesheet and browser app entry points", () => {
  assert.match(index, /href="style\.css"/);
  assert.match(index, /src="app\.js"/);
  assert.match(index, /src="supabase-config\.js"/);
});
