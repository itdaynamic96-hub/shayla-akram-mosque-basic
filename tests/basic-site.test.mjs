import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [app, admin, migration, index] = await Promise.all([
  readFile(new URL("../app.js", import.meta.url), "utf8"),
  readFile(new URL("../admin.js", import.meta.url), "utf8"),
  readFile(new URL("../supabase/migrate-basic-modules.sql", import.meta.url), "utf8"),
  readFile(new URL("../index.html", import.meta.url), "utf8")
]);
const expected = Array.from({ length: 15 }, (_, i) => "m" + String(i + 1).padStart(2, "0"));

test("public and admin apps expose exactly the fixed 15 lowercase module keys", () => {
  for (const source of [app, admin]) {
    const keys = [...source.matchAll(/\["(m\d{2})","[a-z-]+","/g)].map(match => match[1]);
    assert.deepEqual(keys, expected);
  }
});

test("admin validates the 500-word limit and implements donation and gallery workflows", () => {
  assert.match(admin, /countWords\(body\.value\)>500/);
  assert.match(admin, /donationForm.*addEventListener/s);
  assert.match(admin, /galleryForm.*addEventListener/s);
  assert.match(admin, /storage\.from\("mosque-media"\)\.upload/);
});

test("migration enforces mosque module keys, body length, and restricted gallery storage", () => {
  for (const key of expected) assert.ok(migration.includes("'" + key + "'"));
  assert.match(migration, /basic_mosque_body_within_500/);
  assert.match(migration, /module_record_access\('m14', 'mosque', true\)/);
  assert.match(migration, /mosque-media/);
});

test("public website uses the stylesheet and browser app entry points", () => {
  assert.match(index, /href="style\.css"/);
  assert.match(index, /src="app\.js"/);
  assert.match(index, /src="supabase-config\.js"/);
});
