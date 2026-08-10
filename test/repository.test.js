import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

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
  const forbidden = [
    new RegExp(["top", "sports"].join(""), "i"),
    new RegExp(["mc", "en/"].join(""), "i"),
    new RegExp(["滔", "搏"].join(""), "i"),
    new RegExp(["AIGC", "大陆架"].join(""), "i"),
    new RegExp(["火山", "引擎|火山\\s*CDP"].join(""), "i"),
    new RegExp(["member", "-dify"].join(""), "i"),
    new RegExp(["wx", "id_"].join(""), "i"),
    new RegExp(["D:\\\\", "滔", "搏项目"].join(""), "i"),
    new RegExp(["C:\\\\Users\\\\", "Administrator"].join(""), "i"),
  ];
  for (const file of files.filter((name) => [".md", ".json", ".js", ".yml", ".yaml", ".csv"].includes(extname(name)))) {
    const source = await readFile(file, "utf8");
    for (const pattern of forbidden) {
      assert.doesNotMatch(source, pattern, `${pattern} leaked in ${file}`);
    }
  }
});

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
