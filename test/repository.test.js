import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, extname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import YAML from "yaml";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));

test("generated knowledge contains the exact synthetic catalog ID set", async () => {
  const catalog = JSON.parse(await readFile(join(root, "examples", "retail-demo", "catalog.json"), "utf8"));
  const expected = catalog.records.map((record) => `${record.record_id}.md`).sort();
  const actual = (await readdir(join(root, "knowledge", "tags")))
    .filter((name) => /^CF-\d{3}\.md$/.test(name))
    .sort();
  assert.deepEqual(actual, expected);
});

test("public repository text contains no known private-project identifiers or local absolute paths", async () => {
  const files = await walk(root);
  const forbiddenPatterns = [
    /[A-Za-z]:\\(?:Users|Documents and Settings|ProgramData)\\/i,
    /https?:\/\/(?:localhost|127\.0\.0\.1|[^/\s]+\.(?:local|internal))(?:[/:]|$)/i,
    /\b(?:app|dataset|workflow)-[A-Za-z0-9_-]{20,}\b/,
    /\b(?:sk|pat|ghp|gho|github_pat)_[A-Za-z0-9_-]{16,}\b/i,
  ];
  // Irreversible hashes let the test block known private names without
  // publishing those names in the public repository itself.
  const forbiddenSubstringHashes = new Map([
    [9, new Set(["6c6bbff887a371b87d6959aac39a789d4b88ed84a4d51d4c9c5d1967ca6b0b66"])],
    [2, new Set(["27f7f05e318df62bd980652d0f927697c84a113a9ce6f8e5d3000664840b4337"])],
    [7, new Set(["742d28d567a60ef56465c9f460a195c01e739b4021c26ed6d214df1eb1b11c22"])],
    [4, new Set([
      "23b9479458b4c4f67907d6978d66243334702bc6fe2af68d9605a37ef29f2bdd",
      "ef44626c632a44dc2d4f4302d86428f7c9dbf845cb340dd6e7630742eef92f53",
    ])],
    [5, new Set([
      "10d264f0e50af486c7c39464447a800131eb02e7bddd5ffd9e7ce5339538ec67",
      "9d7a434255e13334a1f4a0519a3937912ef91b813185e94b37a0e05115ba7657",
    ])],
    [11, new Set(["1f193764b06565cea012fae56157043d6ac29a465f5d87b2d5516ef0c5093871"])],
  ]);
  for (const file of files.filter((name) => [".md", ".json", ".js", ".yml", ".yaml", ".csv"].includes(extname(name)))) {
    const source = await readFile(file, "utf8");
    for (const pattern of forbiddenPatterns) {
      assert.doesNotMatch(source, pattern, `${pattern} leaked in ${file}`);
    }
    assertNoForbiddenHashedSubstring(source, forbiddenSubstringHashes, file);
  }
});

test("public issue forms are valid structured templates", async () => {
  const issueDirectory = join(root, ".github", "ISSUE_TEMPLATE");
  const files = (await readdir(issueDirectory)).filter((name) => name.endsWith(".yml"));
  assert.deepEqual(files.sort(), [
    "bug_report.yml",
    "config.yml",
    "dify_compatibility_report.yml",
    "feature_request.yml",
    "use_case_feedback.yml",
  ]);
  for (const name of files.filter((item) => item !== "config.yml")) {
    const document = YAML.parse(await readFile(join(issueDirectory, name), "utf8"));
    assert.equal(typeof document.name, "string", `${name} needs a name`);
    assert.equal(typeof document.description, "string", `${name} needs a description`);
    assert.ok(Array.isArray(document.body) && document.body.length > 0, `${name} needs a body`);
    const ids = document.body.map((item) => item.id).filter(Boolean);
    assert.equal(new Set(ids).size, ids.length, `${name} contains duplicate field IDs`);
  }
});

test("case-study links resolve and every referenced CF ID exists", async () => {
  const catalog = JSON.parse(await readFile(join(root, "examples", "retail-demo", "catalog.json"), "utf8"));
  const knownIds = new Set(catalog.records.map((record) => record.record_id));
  const caseDirectory = join(root, "docs", "case-studies");
  const files = (await readdir(caseDirectory)).filter((name) => name.endsWith(".md"));
  assert.equal(files.length, 5);
  for (const name of files) {
    const path = join(caseDirectory, name);
    const source = await readFile(path, "utf8");
    for (const id of source.match(/\bCF-\d{3}\b/g) || []) {
      assert.equal(knownIds.has(id), true, `${name} references unknown ${id}`);
    }
    for (const target of [...source.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)].map((match) => match[1])) {
      if (/^(?:https?:|mailto:|#)/i.test(target)) continue;
      const cleanTarget = decodeURIComponent(target.split("#")[0]);
      await stat(resolve(dirname(path), cleanTarget));
    }
  }
});

function assertNoForbiddenHashedSubstring(source, hashSets, file) {
  const characters = Array.from(source.toLowerCase());
  for (const [length, hashes] of hashSets) {
    for (let index = 0; index <= characters.length - length; index += 1) {
      const value = characters.slice(index, index + length).join("");
      const digest = createHash("sha256").update(value).digest("hex");
      assert.equal(hashes.has(digest), false, `known private identifier leaked in ${file}`);
    }
  }
}

async function walk(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if ([".git", "node_modules"].includes(entry.name)) continue;
    const value = join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await walk(value));
    else result.push(value);
  }
  return result;
}
