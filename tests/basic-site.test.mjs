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

test("apps use the existing admin_profiles, mosque_entries and donation_records schema", () => {
  assert.match(admin, /from\("admin_profiles"\)/);
  assert.match(admin, /from\("mosque_entries"\)/);
  assert.match(admin, /from\("donation_records"\)/);
  assert.match(app, /from\("mosque_entries"\)/);
  assert.doesNotMatch(admin + app, /from\("(profiles|module_records)"\)/);
});

test("admin validates 500 words, separates reviewer actions, and supports gallery uploads", () => {
  assert.match(admin, /countWords\(body\.value\)>500/);
  assert.match(admin, /canReview/);
  assert.match(admin, /donationForm.*addEventListener/s);
  assert.match(admin, /galleryForm.*addEventListener/s);
  assert.match(admin, /storage\.from\("mosque-media"\)\.upload/);
});

test("migration targets the existing schema and does not invoke obsolete authorization functions", () => {
  assert.match(migration, /mosque_entries/);
  assert.match(migration, /donation_records/);
  assert.match(migration, /word_count_500/);
  assert.match(migration, /admin_profiles/);
  assert.match(migration, /mosque-media/);
  const executableSql = migration.replace(/^--.*$/gm, "");
  assert.doesNotMatch(executableSql, /module_record_access|public\.profiles|module_records/);
});

test("public website uses the stylesheet and browser app entry points", () => {
  assert.match(index, /href="style\.css"/);
  assert.match(index, /src="app\.js"/);
  assert.match(index, /src="supabase-config\.js"/);
});
