# Contributor starter issues

These scoped tasks are suitable for first-time contributors. Please open an issue before implementation so maintainers can confirm the contract and avoid duplicate work.

## 1. Configurable CSV column mapping

Add an optional mapping file that translates external CSV column names into the public catalog schema.

Acceptance criteria:

- existing CSV behavior remains backward compatible;
- unknown or duplicate target fields fail explicitly;
- no absolute input path is emitted;
- unit tests cover a successful mapping and at least two invalid mappings;
- documentation uses synthetic data only.

## 2. Dify compatibility report

Import the public workflow into a maintained Dify release and document the result without changing the safety contract.

Acceptance criteria:

- record the exact Dify version and deployment type;
- bind only synthetic strategy and catalog knowledge;
- run the published golden cases;
- distinguish import success, retrieval behavior and model-dependent output;
- redact workspace IDs, credentials and private URLs from evidence.

## 3. Second synthetic industry pack

Create a non-retail example that demonstrates all three evidence states without copying real organizational metadata.

Acceptance criteria:

- use fictional field names, paths, values and sources;
- include at least one confirmed, pending and unsupported record;
- include one scenario strategy and golden case;
- regenerate knowledge documents with the CLI;
- add regression coverage and pass `npm run check`.

## 4. Catalog version and diff report

Add a read-only CLI command that compares two catalog files and reports added, changed, removed and status-transitioned records.

Acceptance criteria:

- comparison is deterministic and machine-readable;
- status upgrades and downgrades are explicit;
- malformed inputs reuse the existing validator;
- no user-level data is accepted or displayed;
- tests cover version changes and removed records.
