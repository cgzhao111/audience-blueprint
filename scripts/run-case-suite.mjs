#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import YAML from "yaml";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const workflowPath = join(root, "workflow", "audience-blueprint-chatflow.yml");
const suitePath = join(root, "examples", "retail-demo", "cases.json");

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

function selectedCaseId() {
  const argument = process.argv.find((item) => item.startsWith("--case="));
  return argument ? argument.slice("--case=".length) : "";
}

function collectCfIds(result) {
  const ids = new Set();
  for (const audience of result.audiences || []) {
    for (const condition of audience.conditions || []) ids.add(condition.cf_id);
  }
  return [...ids].sort();
}

async function executeCase(testCase, strategyParser, validator) {
  const strategyHits = await Promise.all([
    "00-common.md",
    testCase.strategy_file,
  ].map(async (name) => ({
    content: await readFile(join(root, "knowledge", "strategy", name), "utf8"),
  })));

  const activityContext = JSON.stringify({ scenario: testCase.scenario });
  const selected = runPython(
    strategyParser,
    `print(json.dumps(main(${JSON.stringify(strategyHits)}, ${JSON.stringify(activityContext)}), ensure_ascii=False))`,
  );
  if (selected.strategy_status !== "READY") {
    throw new Error(`${testCase.id}: strategy selection failed: ${selected.strategy_notice || selected.strategy_status}`);
  }

  const allowedIds = selected.allowed_cf_ids.split(",").filter(Boolean);
  const catalogDocuments = await Promise.all(allowedIds.map(async (id) => ({
    content: await readFile(join(root, "knowledge", "tags", `${id}.md`), "utf8"),
  })));
  const result = runPython(
    validator,
    `print(json.dumps(main(${JSON.stringify(JSON.stringify(testCase.candidate))}, ${JSON.stringify(catalogDocuments)}, ${JSON.stringify(selected.allowed_cf_ids)}, "{}", "NEW_PLAN", ${JSON.stringify(selected.strategy_review_status)}, ${JSON.stringify(selected.strategy_version)}), ensure_ascii=False))`,
  );
  const normalized = JSON.parse(result.normalized_plan_json);
  const actualIds = collectCfIds(normalized);

  if (result.status !== testCase.expected_status) {
    throw new Error(`${testCase.id}: expected ${testCase.expected_status}, received ${result.status}`);
  }
  const expectedIds = [...testCase.expected_cf_ids].sort();
  if (JSON.stringify(actualIds) !== JSON.stringify(expectedIds)) {
    throw new Error(`${testCase.id}: expected CF IDs ${expectedIds.join(",") || "none"}, received ${actualIds.join(",") || "none"}`);
  }
  return {
    id: testCase.id,
    title: testCase.title,
    scenario: testCase.scenario,
    expected_status: testCase.expected_status,
    actual_status: result.status,
    confirmed_count: result.confirmed_count,
    pending_count: result.pending_count,
    cf_ids: actualIds,
    capability_gaps: normalized.capability_gaps,
    display_markdown: result.display_markdown,
  };
}

function markdownReport(suite, results) {
  const lines = [
    "# Deterministic workflow-core case suite",
    "",
    `- Suite version: \`${suite.version}\``,
    `- Data classification: \`${suite.source_data_type}\``,
    `- Cases: ${results.length}`,
    "- Boundary: local deterministic workflow-core execution; no LLM, Dify runtime, CDP, audience count, segment creation or outreach.",
    "",
    "| Case | Scenario | Expected | Actual | Confirmed | Pending | Evidence IDs |",
    "|---|---|---|---|---:|---:|---|",
  ];
  for (const result of results) {
    lines.push(`| \`${result.id}\` | \`${result.scenario}\` | \`${result.expected_status}\` | \`${result.actual_status}\` | ${result.confirmed_count} | ${result.pending_count} | ${result.cf_ids.map((id) => `\`${id}\``).join(", ") || "none"} |`);
  }
  lines.push("", "All expected states and evidence-ID assertions passed.", "");
  return lines.join("\n");
}

async function main() {
  const [workflowSource, suiteSource] = await Promise.all([
    readFile(workflowPath, "utf8"),
    readFile(suitePath, "utf8"),
  ]);
  const workflow = YAML.parse(workflowSource);
  const suite = JSON.parse(suiteSource);
  const strategyParser = codeByTitle(workflow, "策略约束与标签查询词");
  const validator = codeByTitle(workflow, "校验CF白名单并生成Markdown");
  const requestedId = selectedCaseId();
  const cases = requestedId ? suite.cases.filter((item) => item.id === requestedId) : suite.cases;
  if (!cases.length) throw new Error(`Case not found: ${requestedId}`);

  const results = [];
  for (const testCase of cases) results.push(await executeCase(testCase, strategyParser, validator));

  if (process.argv.includes("--json")) {
    console.log(JSON.stringify({ version: suite.version, source_data_type: suite.source_data_type, results }, null, 2));
    return;
  }
  if (process.argv.includes("--check")) {
    const states = results.reduce((counts, item) => {
      counts[item.actual_status] = (counts[item.actual_status] || 0) + 1;
      return counts;
    }, {});
    console.log(`CASE_SUITE_OK cases=${results.length} confirmed=${states.CONFIRMED_CONFIGURABLE || 0} pending=${states.NEEDS_CONFIRMATION || 0} unsupported=${states.UNSUPPORTED || 0}`);
    return;
  }
  console.log(markdownReport(suite, results));
}

main().catch((error) => {
  console.error(`CASE_SUITE_ERROR ${error.message}`);
  process.exitCode = 1;
});
