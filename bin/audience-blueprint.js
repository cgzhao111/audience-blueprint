#!/usr/bin/env node

import { basename, resolve } from "node:path";
import {
  buildKnowledgeDocuments,
  loadCatalog,
  validateCatalog,
} from "../src/catalog.js";

function usage() {
  return `Audience Blueprint CLI

Usage:
  audience-blueprint validate <catalog.json|catalog.csv>
  audience-blueprint build <catalog.json|catalog.csv> --out <directory> [--force]

Commands:
  validate  Validate IDs, metadata, statuses and executable-field requirements.
  build     Generate one Dify knowledge document per catalog record.
`;
}

function option(args, name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

function printIssues(result) {
  for (const warning of result.warnings) {
    console.warn(`WARN ${warning.record_id || "catalog"}.${warning.field}: ${warning.message}`);
  }
  for (const error of result.errors) {
    console.error(`ERROR ${error.record_id || "catalog"}.${error.field}: ${error.message}`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const input = args[1];

  if (!command || ["help", "--help", "-h"].includes(command)) {
    console.log(usage());
    return;
  }
  if (!input || !["validate", "build"].includes(command)) {
    console.error(usage());
    process.exitCode = 2;
    return;
  }

  const catalogPath = resolve(input);
  const records = await loadCatalog(catalogPath);
  const result = validateCatalog(records);
  printIssues(result);

  if (!result.valid) {
    console.error(`INVALID records=${records.length} errors=${result.errors.length}`);
    process.exitCode = 1;
    return;
  }

  if (command === "validate") {
    console.log(`VALID records=${records.length} warnings=${result.warnings.length}`);
    return;
  }

  const out = option(args, "--out");
  if (!out) {
    console.error("ERROR build requires --out <directory>");
    process.exitCode = 2;
    return;
  }
  const files = await buildKnowledgeDocuments(records, resolve(out), {
    force: args.includes("--force"),
    source: basename(input),
  });
  console.log(`BUILT records=${records.length} files=${files.length} out=${resolve(out)}`);
}

main().catch((error) => {
  console.error(`FATAL ${error.message}`);
  process.exitCode = 1;
});
