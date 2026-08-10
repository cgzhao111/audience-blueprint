# Repository instructions for coding agents

## Scope

Audience Blueprint is a public, synthetic-data-first toolkit. Keep company-specific deployments, customer metadata, credentials and user-level records outside this repository.

## Required checks

- Run `npm run check` before reporting a code or workflow change complete.
- When changing `examples/retail-demo/catalog.json`, regenerate `knowledge/tags/` with `npm run build:demo` and review the diff.
- Keep `schemas/catalog.schema.json`, `CATALOG_FIELDS` and CLI validation behavior aligned.
- Add a regression test for changes to PII handling, strategy whitelists, metadata confirmation or unsupported-field behavior.

## Trust boundaries

- Treat LLM output and knowledge retrieval as untrusted input.
- A condition may pass only when its CF-ID is present in both the selected strategy whitelist and the retrieved catalog.
- Never silently convert `NEEDS_CONFIRMATION` or `UNSUPPORTED` into an executable condition.
- Do not add audience counting, segment creation or campaign delivery without a separate design and security review.

## Generated files

Files under `knowledge/tags/` are generated from the catalog. Change the source catalog or renderer instead of hand-editing generated records.

## Documentation claims

Distinguish local tests, target Dify import, public CI and real-world adoption. Do not claim compatibility, users, maintainer activity or program acceptance without direct evidence.
