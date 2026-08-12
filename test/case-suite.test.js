import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));

function runCaseSuite(...args) {
  return spawnSync("node", [join(root, "scripts", "run-case-suite.mjs"), ...args], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, PYTHONIOENCODING: "utf-8" },
  });
}

test("case suite covers confirmed, pending and unsupported outcomes", () => {
  const result = runCaseSuite("--json");
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const report = JSON.parse(result.stdout);
  assert.equal(report.source_data_type, "synthetic_demo");
  assert.equal(report.results.length, 6);
  assert.deepEqual(
    [...new Set(report.results.map((item) => item.actual_status))].sort(),
    ["CONFIRMED_CONFIGURABLE", "NEEDS_CONFIRMATION", "UNSUPPORTED"],
  );
  for (const item of report.results) assert.equal(item.actual_status, item.expected_status);
});

test("case suite verifies scenario-specific evidence IDs", () => {
  const promotion = runCaseSuite("--case=promotion-confirmed", "--json");
  assert.equal(promotion.status, 0, promotion.stderr || promotion.stdout);
  assert.deepEqual(JSON.parse(promotion.stdout).results[0].cf_ids, [
    "CF-001", "CF-007", "CF-009", "CF-011", "CF-012", "CF-017",
  ]);

  const radius = runCaseSuite("--case=store-radius-unsupported", "--json");
  assert.equal(radius.status, 0, radius.stderr || radius.stdout);
  const unsupported = JSON.parse(radius.stdout).results[0];
  assert.equal(unsupported.actual_status, "UNSUPPORTED");
  assert.deepEqual(unsupported.cf_ids, []);
  assert.match(unsupported.capability_gaps.join("\n"), /residence-radius|当前资料不支持/i);
});

test("case suite output never includes common personal identifiers or execution claims", () => {
  const result = runCaseSuite("--json");
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.doesNotMatch(result.stdout, /13800138000|demo@example\.com|openid|customer_name/i);
  assert.doesNotMatch(result.stdout, /已创建人群|已自动建群|已自动触达/);
});
