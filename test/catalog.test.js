import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  CATALOG_FIELDS,
  buildKnowledgeDocuments,
  loadCatalog,
  parseCsv,
  validateCatalog,
} from "../src/catalog.js";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const demoCatalog = join(root, "examples", "retail-demo", "catalog.json");

test("JSON Schema and CLI expose the same record fields", async () => {
  const schema = JSON.parse(await readFile(join(root, "schemas", "catalog.schema.json"), "utf8"));
  const schemaFields = Object.keys(schema.properties.records.items.properties).sort();
  assert.deepEqual(schemaFields, [...CATALOG_FIELDS].sort());
});

test("synthetic demo catalog is valid and contains twelve unique records", async () => {
  const records = await loadCatalog(demoCatalog);
  const result = validateCatalog(records);
  assert.equal(result.valid, true, JSON.stringify(result.errors));
  assert.equal(records.length, 12);
  assert.equal(new Set(records.map((record) => record.record_id)).size, 12);
  assert(records.every((record) => record.source.startsWith("synthetic-")));
  assert(records.every((record) => record.source_data_type === "synthetic_demo"));
});

test("confirmed records require evidence metadata and event aggregations", () => {
  const result = validateCatalog([{
    record_id: "CF-001",
    display_name: "Example event",
    semantic_key: "example_event",
    definition: "Example",
    resource_type: "event",
    status: "CONFIRMED_CONFIGURABLE",
    operators: ["occurred"],
  }]);
  assert.equal(result.valid, false);
  const fields = new Set(result.errors.map((error) => error.field));
  for (const field of ["path", "source", "version", "aggregations"]) {
    assert(fields.has(field), `missing validation error for ${field}`);
  }
});

test("duplicate and malformed internal IDs are rejected", () => {
  const base = {
    display_name: "Pending demo tag",
    semantic_key: "pending_demo",
    definition: "Pending",
    resource_type: "tag",
    status: "NEEDS_CONFIRMATION",
  };
  const result = validateCatalog([
    { ...base, record_id: "CF-01" },
    { ...base, record_id: "CF-01" },
  ]);
  assert.equal(result.valid, false);
  assert(result.errors.some((error) => error.message === "must be unique"));
  assert(result.errors.some((error) => error.message === "must match CF-000"));
});

test("unknown catalog fields are rejected instead of being silently ignored", () => {
  const record = {
    record_id: "CF-101",
    display_name: "Pending demo tag",
    semantic_key: "pending_demo",
    definition: "Pending",
    resource_type: "tag",
    status: "NEEDS_CONFIRMATION",
    private_note: "must not pass through",
  };
  const result = validateCatalog([record]);
  assert.equal(result.valid, false);
  assert(result.errors.some((item) => item.field === "private_note"));
});

test("CSV parser supports quoted commas and pipe-separated lists", () => {
  const rows = parseCsv([
    "record_id,display_name,operators,values",
    'CF-101,"Region, demo",equals|in,North|South',
  ].join("\n"));
  assert.equal(rows[0].display_name, "Region, demo");
  assert.equal(rows[0].operators, "equals|in");
});

test("builder emits one complete TAG_RECORD document per record", async () => {
  const records = await loadCatalog(demoCatalog);
  const out = await mkdtemp(join(tmpdir(), "audience-blueprint-"));
  const files = await buildKnowledgeDocuments(records.slice(0, 2), out, {
    source: "examples/retail-demo/catalog.json",
  });
  assert.equal(files.length, 2);
  const document = await readFile(files[0], "utf8");
  assert.match(document, /TAG_RECORD_BEGIN/);
  assert.match(document, /TAG_RECORD_END/);
  assert.match(document, /verified_source: synthetic-retail-demo\/catalog-v1/);
  assert.match(document, /source_data_type: synthetic_demo/);
  assert.doesNotMatch(document, /[A-Z]:\\/);
});

test("CLI input contract accepts a JSON object with records", async () => {
  const dir = await mkdtemp(join(tmpdir(), "audience-blueprint-input-"));
  const file = join(dir, "catalog.json");
  await writeFile(file, JSON.stringify({ records: [{
    record_id: "CF-101",
    display_name: "Pending record",
    semantic_key: "pending_record",
    definition: "Pending synthetic record",
    resource_type: "tag",
    status: "NEEDS_CONFIRMATION",
  }] }), "utf8");
  const records = await loadCatalog(file);
  assert.equal(validateCatalog(records).valid, true);
});

test("CLI generated documents do not expose an absolute input path", async () => {
  const dir = await mkdtemp(join(tmpdir(), "audience-blueprint-path-"));
  const file = join(dir, "catalog.json");
  const out = join(dir, "knowledge");
  await writeFile(file, JSON.stringify({ records: [{
    record_id: "CF-101",
    display_name: "Pending record",
    semantic_key: "pending_record",
    definition: "Pending catalog metadata",
    resource_type: "tag",
    status: "NEEDS_CONFIRMATION",
  }] }), "utf8");
  const executed = spawnSync(
    process.execPath,
    [join(root, "bin", "audience-blueprint.js"), "build", file, "--out", out],
    { encoding: "utf8" },
  );
  assert.equal(executed.status, 0, executed.stderr || executed.stdout);
  const document = await readFile(join(out, "CF-101.md"), "utf8");
  assert.match(document, /source_seed: catalog\.json#CF-101/);
  assert.doesNotMatch(document, new RegExp(dir.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
  assert.match(document, /Catalog metadata\. Confirm publication rights/);
});
