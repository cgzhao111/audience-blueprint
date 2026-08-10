import { mkdir, readFile, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";

export const STATUSES = new Set([
  "CONFIRMED_CONFIGURABLE",
  "NEEDS_CONFIRMATION",
  "UNSUPPORTED",
]);

export const RESOURCE_TYPES = new Set([
  "tag",
  "attribute",
  "event",
  "event_property",
  "audience",
]);

const EXECUTABLE_STATUSES = new Set(["CONFIRMED_CONFIGURABLE"]);
const LIST_FIELDS = new Set(["operators", "values", "aggregations"]);
export const CATALOG_FIELDS = new Set([
  "record_id",
  "display_name",
  "semantic_key",
  "definition",
  "resource_type",
  "status",
  "source_data_type",
  "path",
  "source",
  "version",
  "operators",
  "values",
  "time_window_required",
  "aggregations",
  "mapping_note",
  "configuration_guidance",
  "usage_guidance",
]);

function asString(value) {
  return value === undefined || value === null ? "" : String(value).trim();
}

function asList(value) {
  if (Array.isArray(value)) return value.map(asString).filter(Boolean);
  const text = asString(value);
  if (!text) return [];
  return text.split(/[|,，]/).map((item) => item.trim()).filter(Boolean);
}

function asBoolean(value) {
  if (typeof value === "boolean") return value;
  const normalized = asString(value).toLowerCase();
  if (["true", "1", "yes", "y"].includes(normalized)) return true;
  if (["false", "0", "no", "n", ""].includes(normalized)) return false;
  return value;
}

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  if (cell.length || row.length) {
    row.push(cell);
    if (row.some((value) => value.trim())) rows.push(row);
  }
  if (quoted) throw new Error("CSV contains an unclosed quoted field");
  if (rows.length === 0) return [];

  const headers = rows[0].map((value) => value.trim());
  return rows.slice(1).map((values) => Object.fromEntries(
    headers.map((header, index) => [header, values[index] ?? ""]),
  ));
}

export function normalizeRecord(raw) {
  const normalized = {};
  for (const [key, value] of Object.entries(raw || {})) {
    const field = key.trim();
    normalized[field] = LIST_FIELDS.has(field) ? asList(value) : asString(value);
  }
  normalized.record_id = asString(normalized.record_id).toUpperCase();
  normalized.status = asString(normalized.status || "NEEDS_CONFIRMATION").toUpperCase();
  normalized.resource_type = asString(normalized.resource_type).toLowerCase();
  normalized.time_window_required = asBoolean(normalized.time_window_required);
  normalized.operators = asList(normalized.operators);
  normalized.values = asList(normalized.values);
  normalized.aggregations = asList(normalized.aggregations);
  return normalized;
}

export async function loadCatalog(filePath) {
  const text = await readFile(filePath, "utf8");
  const extension = extname(filePath).toLowerCase();
  let value;
  let defaultSourceDataType = "";
  if (extension === ".json") {
    value = JSON.parse(text);
    if (!Array.isArray(value)) {
      defaultSourceDataType = asString(value.source_data_type);
      value = value.records;
    }
  } else if (extension === ".csv") {
    value = parseCsv(text.replace(/^\uFEFF/, ""));
  } else {
    throw new Error("Catalog must be a .json or .csv file");
  }
  if (!Array.isArray(value)) throw new Error("Catalog must contain a records array");
  return value.map((record) => normalizeRecord({
    ...record,
    source_data_type: record?.source_data_type || defaultSourceDataType,
  }));
}

function issue(list, record, field, message) {
  list.push({ record_id: record?.record_id || "", field, message });
}

export function validateCatalog(input) {
  const records = input.map(normalizeRecord);
  const errors = [];
  const warnings = [];
  const ids = new Set();

  for (const record of records) {
    for (const field of Object.keys(record)) {
      if (!CATALOG_FIELDS.has(field)) issue(errors, record, field, "is not part of the catalog contract");
    }
    const required = [
      "record_id",
      "display_name",
      "semantic_key",
      "definition",
      "resource_type",
      "status",
    ];
    for (const field of required) {
      if (!record[field]) issue(errors, record, field, "is required");
    }
    if (record.record_id && !/^CF-\d{3}$/.test(record.record_id)) {
      issue(errors, record, "record_id", "must match CF-000");
    }
    if (ids.has(record.record_id)) issue(errors, record, "record_id", "must be unique");
    ids.add(record.record_id);
    if (record.status && !STATUSES.has(record.status)) {
      issue(errors, record, "status", `must be one of ${[...STATUSES].join(", ")}`);
    }
    if (record.resource_type && !RESOURCE_TYPES.has(record.resource_type)) {
      issue(errors, record, "resource_type", `must be one of ${[...RESOURCE_TYPES].join(", ")}`);
    }

    if (EXECUTABLE_STATUSES.has(record.status)) {
      for (const field of ["path", "source", "version"]) {
        if (!record[field]) issue(errors, record, field, "is required for CONFIRMED_CONFIGURABLE");
      }
      if (record.operators.length === 0) {
        issue(errors, record, "operators", "must not be empty for CONFIRMED_CONFIGURABLE");
      }
      if (["event", "event_property"].includes(record.resource_type)) {
        if (typeof record.time_window_required !== "boolean") {
          issue(errors, record, "time_window_required", "must be true or false for event resources");
        }
        if (record.aggregations.length === 0) {
          issue(errors, record, "aggregations", "must not be empty for event resources");
        }
      }
    }
    if (record.status === "NEEDS_CONFIRMATION" && record.path && record.operators.length) {
      issue(warnings, record, "status", "metadata exists but the record remains pending review");
    }
  }
  if (records.length === 0) issue(errors, null, "records", "must not be empty");
  return { valid: errors.length === 0, records, errors, warnings };
}

function yamlValue(value) {
  if (Array.isArray(value)) return value.join(",");
  if (typeof value === "boolean") return value ? "true" : "false";
  return asString(value).replace(/\r?\n/g, " ");
}

export function renderKnowledgeDocument(input, source = "catalog") {
  const record = normalizeRecord(input);
  const sourceDataType = record.source_data_type || "catalog_metadata";
  const pathParts = asString(record.path).split("/").map((item) => item.trim()).filter(Boolean);
  const levelOne = pathParts[0] || "Demo catalog";
  const levelTwo = pathParts.at(-1) || record.display_name;
  const lines = [
    `# ${record.record_id} ${record.display_name}`,
    "",
    "TAG_RECORD_BEGIN",
    `record_id: ${record.record_id}`,
    `display_name: ${record.display_name}`,
    `source_data_type: ${sourceDataType}`,
    `source_level_1: ${levelOne}`,
    `source_level_2: ${levelTwo}`,
    `resource_type_hint: ${record.resource_type}`,
    `semantic_key: ${record.semantic_key}`,
    `definition: ${record.definition}`,
    `mapping_note: ${record.mapping_note || "Synthetic demo record; replace with your CDP metadata."}`,
    `path_clue: ${record.path || "Pending catalog path"}`,
    `configuration_guidance: ${record.configuration_guidance || "Use only after validating this record against your CDP."}`,
    `usage_guidance: ${record.usage_guidance || "Use only in strategies that explicitly allow this record ID."}`,
    `source_seed: ${source}#${record.record_id}`,
    "source_knowledge: generated by Audience Blueprint CLI",
    `confirmation_status: ${record.status}`,
  ];
  if (record.path) lines.push(`verified_path: ${record.path}`);
  if (record.resource_type) lines.push(`verified_resource_type: ${record.resource_type}`);
  if (record.source) lines.push(`verified_source: ${record.source}`);
  if (record.operators.length) lines.push(`operators: ${yamlValue(record.operators)}`);
  if (record.values.length) lines.push(`values: ${yamlValue(record.values)}`);
  if (record.version) lines.push(`version: ${record.version}`);
  if (["event", "event_property"].includes(record.resource_type)) {
    lines.push(`time_window_required: ${yamlValue(record.time_window_required)}`);
    lines.push(`aggregations: ${yamlValue(record.aggregations)}`);
  }
  const notice = sourceDataType === "synthetic_demo"
    ? "Synthetic demonstration metadata. Do not treat it as a production CDP field."
    : "Catalog metadata. Confirm publication rights, current availability and account permissions before production use.";
  lines.push("TAG_RECORD_END", "", `> ${notice}`, "");
  return lines.join("\n");
}

export async function buildKnowledgeDocuments(input, outputDirectory, options = {}) {
  const result = validateCatalog(input);
  if (!result.valid) throw new Error(`Catalog validation failed with ${result.errors.length} error(s)`);
  await mkdir(outputDirectory, { recursive: true });
  const files = [];
  for (const record of result.records) {
    const file = join(outputDirectory, `${record.record_id}.md`);
    if (!options.force) {
      try {
        await readFile(file, "utf8");
        throw new Error(`Refusing to overwrite ${file}; pass --force to replace generated files`);
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
      }
    }
    await writeFile(file, renderKnowledgeDocument(record, options.source || "catalog"), "utf8");
    files.push(file);
  }
  return files;
}
