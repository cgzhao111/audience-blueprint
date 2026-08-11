import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));

test("runnable workflow-core demo produces a confirmed cart-recovery plan", () => {
  const result = spawnSync("node", [join(root, "scripts", "run-workflow-core-demo.mjs")], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, PYTHONIOENCODING: "utf-8" },
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /Scenario: CART_RECOVERY/);
  assert.match(result.stdout, /Status: CONFIRMED_CONFIGURABLE/);
  assert.match(result.stdout, /Cart recovery core/);
  assert.match(result.stdout, /CF-007/);
  assert.match(result.stdout, /CF-016/);
  assert.match(result.stdout, /未计算人数、未自动建群、未自动触达/);
  assert.doesNotMatch(result.stdout, /CF-999|13800138000|demo@example\.com/);
});
