# Contributing

Thank you for helping improve Audience Blueprint.

## Before opening a pull request

1. Open an issue for behavior changes or new catalog fields.
2. Use only synthetic, public-domain or explicitly licensed sample data.
3. Do not include credentials, internal URLs, customer names or user-level records.
4. Run `npm run check`.
5. Update documentation and tests when changing the CLI or workflow contract.

## Development

```bash
npm install
npm run check
```

The project intentionally has no runtime dependencies. Keep new dependencies minimal and explain why they are needed.

## Catalog changes

- preserve stable `CF-000` IDs within an example version;
- document the evidence state;
- add operator, value, event-window and aggregation metadata only when the example contract supports them;
- regenerate `knowledge/tags/` with the CLI;
- never present private production metadata as a public example.

## Workflow changes

- keep knowledge IDs and credentials empty;
- keep PII checks before the first LLM call;
- treat LLM output as untrusted;
- preserve all three result states;
- add a regression test for every safety-boundary change.

By contributing, you agree that your contribution is licensed under the Apache License 2.0.
