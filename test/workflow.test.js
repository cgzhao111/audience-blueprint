import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const workflowPath = join(root, "workflow", "audience-blueprint-chatflow.yml");

test("workflow is a provider-replaceable Dify advanced chat template", async () => {
  const source = await readFile(workflowPath, "utf8");
  const document = parseYaml(source);
  assert.equal(document.kind, "app");
  assert.equal(document.version, "0.6.0");
  assert.equal(document.app.mode, "advanced-chat");
  assert.equal(document.app.name, "Audience Blueprint Demo");
  assert.deepEqual(document.dependencies, []);
  assert.equal([...source.matchAll(/^\s+provider:\s*langgenius\/openai\/openai$/gm)].length, 2);
  assert.equal([...source.matchAll(/^\s+dataset_ids:\s*\[\]$/gm)].length, 2);

  const nodes = document.workflow.graph.nodes;
  const edges = document.workflow.graph.edges;
  assert.equal(nodes.length, 20);
  assert.equal(nodes.filter((node) => node.data.type === "code").length, 4);
  assert.equal(edges.length, 20);

  const strategyNode = nodes.find((node) => node.data.title === "业务策略知识检索（导入后绑定）");
  const catalogNode = nodes.find((node) => node.data.title === "CDP标签配置知识检索（导入后绑定）");
  assert.deepEqual(strategyNode.data.query_variable_selector, ["2000000000003", "knowledge_query"]);
  assert.deepEqual(catalogNode.data.query_variable_selector, ["2000000000018", "tag_query"]);

  for (const marker of [
    "CONFIRMED_CONFIGURABLE",
    "NEEDS_CONFIRMATION",
    "UNSUPPORTED",
    "TAG_RECORD_BEGIN",
    "__NO_SUPPORTED_CF__",
    "未计算人数、未自动建群、未自动触达",
  ]) {
    assert(source.includes(marker), `missing workflow marker ${marker}`);
  }
});

test("workflow contains no company identifiers, credentials or outbound HTTP node", async () => {
  const source = await readFile(workflowPath, "utf8");
  for (const pattern of [
    new RegExp(["top", "sports"].join(""), "i"),
    new RegExp(["mc", "en/"].join(""), "i"),
    new RegExp(["滔", "搏"].join(""), "i"),
    new RegExp(["AIGC", "大陆架"].join(""), "i"),
    new RegExp(["火", "山"].join(""), "i"),
    new RegExp(["member", "-dify"].join(""), "i"),
    new RegExp(["wx", "id_"].join(""), "i"),
    /\bapp-[A-Za-z0-9_-]{12,}\b/,
    /\bsk-[A-Za-z0-9_-]{12,}\b/,
    /type:\s*http-request/i,
    /langgenius\/tongyi/i,
  ]) {
    assert.doesNotMatch(source, pattern);
  }
});

test("all four embedded Python Code nodes compile", async (t) => {
  const available = spawnSync("python", ["--version"], { encoding: "utf8" });
  if (available.status !== 0) return t.skip("Python is not available");
  const source = await readFile(workflowPath, "utf8");
  for (const title of [
    "输入安全预检",
    "解析并合并活动上下文",
    "策略约束与标签查询词",
    "校验CF白名单并生成Markdown",
  ]) {
    const code = extractPythonNode(source, title);
    const compiled = spawnSync(
      "python",
      ["-c", `compile(${JSON.stringify(code)}, ${JSON.stringify(title)}, "exec")`],
      { encoding: "utf8", env: { ...process.env, PYTHONIOENCODING: "utf-8" } },
    );
    assert.equal(compiled.status, 0, compiled.stderr || compiled.stdout);
  }
});

test("embedded workflow logic runs against the synthetic strategy and catalog", async (t) => {
  const available = spawnSync("python", ["--version"], { encoding: "utf8" });
  if (available.status !== 0) return t.skip("Python is not available");

  const source = await readFile(workflowPath, "utf8");
  const precheck = extractPythonNode(source, "输入安全预检");
  const parser = extractPythonNode(source, "解析并合并活动上下文");
  const strategyParser = extractPythonNode(source, "策略约束与标签查询词");
  const validator = extractPythonNode(source, "校验CF白名单并生成Markdown");

  const blocked = runPython(
    precheck,
    'print(json.dumps(main("please use customer email demo@example.com"), ensure_ascii=False))',
  );
  assert.equal(blocked.safe_gate, "PII_BLOCKED");
  assert.doesNotMatch(JSON.stringify(blocked), /demo@example\.com/);

  const incompleteInput = JSON.stringify({
    intent: "NEW_PLAN",
    slots: { scenario: "BRAND_PROMOTION", goal: "repeat purchase" },
  });
  const incomplete = runPython(
    parser,
    `print(json.dumps(main(${JSON.stringify(incompleteInput)}, "{}", "{}", "promotion"), ensure_ascii=False))`,
  );
  assert.equal(incomplete.gate, "MISSING_REQUIRED");
  assert.match(incomplete.missing_fields, /region|activity_start|activity_end|channel|benefit|brand/);

  const [commonStrategy, promotionStrategy] = await Promise.all([
    readFile(join(root, "knowledge", "strategy", "00-common.md"), "utf8"),
    readFile(join(root, "knowledge", "strategy", "01-promotion.md"), "utf8"),
  ]);
  const selected = runPython(
    strategyParser,
    `print(json.dumps(main(${JSON.stringify([
      { content: commonStrategy },
      { content: promotionStrategy },
    ])}, ${JSON.stringify(JSON.stringify({ scenario: "BRAND_PROMOTION" }))}), ensure_ascii=False))`,
  );
  assert.equal(selected.strategy_status, "READY");
  assert.equal(selected.strategy_review_status, "APPROVED");
  assert.equal(selected.strategy_version, "audience-blueprint-demo-v1");
  assert.equal(
    selected.allowed_cf_ids,
    "CF-001,CF-002,CF-006,CF-007,CF-009,CF-011,CF-012",
  );

  const catalogDocuments = await Promise.all(
    ["CF-001.md", "CF-011.md", "CF-012.md"].map(async (name) => ({
      content: await readFile(join(root, "knowledge", "tags", name), "utf8"),
    })),
  );
  const candidate = JSON.stringify({
    summary: "Synthetic promotion demo",
    audiences: [{
      name: "Core audience",
      positioning: "Eligible synthetic customers",
      reason: "Demonstrate verified metadata enforcement",
      conditions: [
        { cf_id: "CF-001", logic: "AND", use: "include", operator: "equals", value: "East" },
        { cf_id: "CF-011", logic: "AND", use: "include", operator: "equals", value: "granted" },
        {
          cf_id: "CF-012",
          logic: "AND",
          use: "exclude",
          operator: "in",
          value: ["fraud", "employee", "opt_out"],
        },
      ],
    }],
    capability_gaps: [],
    notes: ["Synthetic data only"],
  });
  const confirmed = runPython(
    validator,
    `print(json.dumps(main(${JSON.stringify(candidate)}, ${JSON.stringify(catalogDocuments)}, ${JSON.stringify(selected.allowed_cf_ids)}, "{}", "NEW_PLAN", "APPROVED", ${JSON.stringify(selected.strategy_version)}), ensure_ascii=False))`,
  );
  assert.equal(confirmed.status, "CONFIRMED_CONFIGURABLE");
  assert.equal(confirmed.confirmed_count, 3);
  assert.equal(confirmed.pending_count, 0);
  assert.match(confirmed.display_markdown, /Demo CDP \/ Profile \/ Customer region/);
  assert.match(confirmed.display_markdown, /synthetic-retail-demo\/catalog-v1/);
  assert.match(confirmed.display_markdown, /未计算人数、未自动建群、未自动触达/);

  const invented = JSON.stringify({
    summary: "Invented field must not pass",
    audiences: [{
      name: "Invalid audience",
      conditions: [
        { cf_id: "CF-999", logic: "AND", use: "include", operator: "equals", value: "x" },
      ],
    }],
  });
  const rejected = runPython(
    validator,
    `print(json.dumps(main(${JSON.stringify(invented)}, ${JSON.stringify(catalogDocuments)}, ${JSON.stringify(selected.allowed_cf_ids)}, "{}", "NEW_PLAN", "APPROVED", ${JSON.stringify(selected.strategy_version)}), ensure_ascii=False))`,
  );
  assert.equal(rejected.status, "UNSUPPORTED");
  assert.match(rejected.display_markdown, /CF-999/);
  assert.equal(rejected.plan_to_save, "{}");
});

function extractPythonNode(source, title) {
  const titleIndex = source.indexOf(`        title: ${title}`);
  assert(titleIndex >= 0, `missing title ${title}`);
  const codeMarker = "        code: |\n";
  const start = source.lastIndexOf(codeMarker, titleIndex);
  const end = source.indexOf("        code_language: python3", start);
  assert(start >= 0 && end > start, `missing code for ${title}`);
  return source.slice(start + codeMarker.length, end)
    .split("\n")
    .map((line) => line.startsWith("          ") ? line.slice(10) : line)
    .join("\n");
}

function runPython(code, statement) {
  const result = spawnSync("python", ["-c", `${code}\nimport json\n${statement}`], {
    encoding: "utf8",
    env: { ...process.env, PYTHONIOENCODING: "utf-8" },
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return JSON.parse(result.stdout.trim());
}
