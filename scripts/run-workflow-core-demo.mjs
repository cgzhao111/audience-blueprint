#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import YAML from "yaml";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const workflowPath = join(root, "workflow", "audience-blueprint-chatflow.yml");

function codeByTitle(document, title) {
  const node = document.workflow.graph.nodes.find((item) => item.data?.title === title);
  if (!node?.data?.code) throw new Error(`Workflow code node not found: ${title}`);
  return node.data.code;
}

function runPython(code, statement) {
  const result = spawnSync("python", ["-c", `${code}\nimport json\n${statement}`], {
    encoding: "utf8",
    env: { ...process.env, PYTHONIOENCODING: "utf-8" },
  });
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || "Python workflow-core execution failed");
  }
  return JSON.parse(result.stdout.trim());
}

async function main() {
  const source = await readFile(workflowPath, "utf8");
  const document = YAML.parse(source);
  const strategyParser = codeByTitle(document, "策略约束与标签查询词");
  const validator = codeByTitle(document, "校验CF白名单并生成Markdown");

  const strategyHits = await Promise.all([
    "00-common.md",
    "05-cart-recovery.md",
  ].map(async (name) => ({
    content: await readFile(join(root, "knowledge", "strategy", name), "utf8"),
  })));

  const activityContext = JSON.stringify({ scenario: "CART_RECOVERY" });
  const selected = runPython(
    strategyParser,
    `print(json.dumps(main(${JSON.stringify(strategyHits)}, ${JSON.stringify(activityContext)}), ensure_ascii=False))`,
  );
  if (selected.strategy_status !== "READY") {
    throw new Error(`Strategy selection failed: ${selected.strategy_notice || selected.strategy_status}`);
  }

  const allowedIds = selected.allowed_cf_ids.split(",").filter(Boolean);
  const catalogDocuments = await Promise.all(allowedIds.map(async (id) => ({
    content: await readFile(join(root, "knowledge", "tags", `${id}.md`), "utf8"),
  })));

  const candidate = JSON.stringify({
    summary: "Synthetic cart-recovery demonstration with governance exclusions.",
    audiences: [{
      name: "Cart recovery core",
      positioning: "Demo customers with a recent cart event and no completed purchase in the same window.",
      reason: "Show that the embedded workflow core intersects strategy and catalog evidence before displaying rules.",
      conditions: [
        { cf_id: "CF-001", logic: "AND", use: "include", operator: "equals", value: "East" },
        { cf_id: "CF-007", logic: "AND", use: "include", operator: "occurred", value: 1, time_window: "last 7 days", aggregation: "total_count" },
        { cf_id: "CF-016", logic: "AND", use: "exclude", operator: "occurred", value: 1, time_window: "last 7 days", aggregation: "total_count" },
        { cf_id: "CF-011", logic: "AND", use: "include", operator: "equals", value: "granted" },
        { cf_id: "CF-012", logic: "AND", use: "exclude", operator: "in", value: ["fraud", "employee", "opt_out"] },
        { cf_id: "CF-017", logic: "AND", use: "exclude", operator: "occurred", value: 3, time_window: "last 7 days", aggregation: "total_count" },
      ],
    }],
    capability_gaps: [],
    notes: ["Synthetic metadata only; replace the catalog before any deployment."],
  });

  const result = runPython(
    validator,
    `print(json.dumps(main(${JSON.stringify(candidate)}, ${JSON.stringify(catalogDocuments)}, ${JSON.stringify(selected.allowed_cf_ids)}, "{}", "NEW_PLAN", ${JSON.stringify(selected.strategy_review_status)}, ${JSON.stringify(selected.strategy_version)}), ensure_ascii=False))`,
  );

  if (result.status !== "CONFIRMED_CONFIGURABLE") {
    throw new Error(`Demo did not reach CONFIRMED_CONFIGURABLE: ${result.status}`);
  }
  if (process.argv.includes("--check")) {
    console.log(`DEMO_OK scenario=CART_RECOVERY status=${result.status} confirmed=${result.confirmed_count}`);
    return;
  }

  console.log("# Audience Blueprint deterministic workflow-core demo");
  console.log("");
  console.log(`- Scenario: ${selected.scenario_code}`);
  console.log(`- Status: ${result.status}`);
  console.log(`- Confirmed conditions: ${result.confirmed_count}`);
  console.log("");
  console.log(result.display_markdown);
}

main().catch((error) => {
  console.error(`DEMO_ERROR ${error.message}`);
  process.exitCode = 1;
});
