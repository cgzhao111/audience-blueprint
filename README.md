# Audience Blueprint

Audience Blueprint is an evidence-grounded audience segmentation copilot toolkit for Dify and CDP teams. It turns a marketing brief into a reviewable audience configuration plan while refusing to invent fields that are absent from the supplied catalog.

The repository combines:

- a reusable Dify Chatflow;
- a catalog contract for tags, attributes and events;
- a zero-dependency Node.js CLI that validates JSON/CSV catalogs and generates Dify knowledge documents;
- synthetic retail strategies and data;
- regression tests for workflow structure, embedded Python code and private-data leakage.

> Status: `v0.1.1` public release. The included catalog is entirely synthetic. The workflow does not calculate audience size, create segments or send campaigns.

## Why this project exists

Marketing teams often know the campaign goal but not the exact CDP field names, operators, values or exclusion semantics. Letting an LLM fill those gaps produces confident but unusable rules.

Audience Blueprint separates three responsibilities:

1. strategy knowledge explains how to segment an audience;
2. catalog knowledge defines which fields actually exist;
3. deterministic workflow code intersects both sources and reports one of three states:
   - `CONFIRMED_CONFIGURABLE`;
   - `NEEDS_CONFIRMATION`;
   - `UNSUPPORTED`.

## Quick start

Requirements: Node.js 20+ and Python 3 for the embedded workflow-core demo. A Dify workspace is required only for the Chatflow UI.

```bash
npm install
npm run check
npm run demo
node ./bin/audience-blueprint.js validate ./examples/retail-demo/catalog.json
node ./bin/audience-blueprint.js build ./examples/retail-demo/catalog.json --out ./knowledge/tags --force
```

The CLI also accepts CSV files. Use `|` between list values such as operators or enumerations. See [`examples/retail-demo/catalog.csv`](examples/retail-demo/catalog.csv).

JSON catalogs may declare a top-level `source_data_type` (the demo uses `synthetic_demo`); CSV records may declare it per row. If omitted, generated documents use the neutral `catalog_metadata` classification. The CLI records only the input filename in generated documents, not an absolute local path.

## Run the Dify demo

1. Create a strategy knowledge base and upload the six files in [`knowledge/strategy`](knowledge/strategy).
2. Create a catalog knowledge base and upload the generated files in [`knowledge/tags`](knowledge/tags).
3. Import [`workflow/audience-blueprint-chatflow.yml`](workflow/audience-blueprint-chatflow.yml).
4. Bind the two empty knowledge retrieval nodes.
5. Select an LLM available in your workspace. The template references Dify's OpenAI provider, but the model can be replaced after import.
6. Run the cases in [`evals/golden-cases.md`](evals/golden-cases.md).

Detailed instructions: [`docs/DIFY_SETUP.md`](docs/DIFY_SETUP.md).

## Reproducible local demo

`npm run demo` executes the same embedded strategy-selection and catalog-validation Python used by the Chatflow, without calling an LLM or a CDP. The bundled cart-recovery case must reach `CONFIRMED_CONFIGURABLE` with six evidence-backed conditions.

The demo catalog now contains 17 synthetic records and five marketing scenarios. It deliberately includes:

- a pending trend-affinity lead that must remain `NEEDS_CONFIRMATION`;
- an unsupported residence-radius concept that must become a capability gap;
- a cart-recovery strategy that includes recent cart activity and excludes completed purchases in the same window.

See the captured output and verification boundary in [`docs/DEMO.md`](docs/DEMO.md). This proves the deterministic workflow core locally; it does not claim a particular Dify version, model provider or production CDP is compatible.

## Catalog states

| State | Meaning | Workflow behavior |
|---|---|---|
| `CONFIRMED_CONFIGURABLE` | Path, type, operators, evidence source and version are present | May appear as a concrete configuration step |
| `NEEDS_CONFIRMATION` | A useful lead exists but metadata is incomplete or unapproved | Displayed with an explicit review checklist |
| `UNSUPPORTED` | The capability does not exist in the supplied catalog | Reported as a gap; no substitute field is invented |

Event resources additionally require a time-window declaration and supported aggregation list before they can be confirmed.

## Repository map

```text
bin/                       CLI entry point
src/                       catalog parser, validator and knowledge renderer
schemas/                   machine-readable catalog contract
examples/retail-demo/      synthetic input data
knowledge/strategy/        synthetic campaign strategies
knowledge/tags/            generated Dify catalog documents
workflow/                  provider-replaceable Dify Chatflow template
evals/                     golden cases and anti-patterns
docs/                      architecture and deployment guidance
test/                      CLI, workflow and sanitization tests
```

## Privacy and safety

- Do not commit customer records, phone numbers, email addresses, order details or production exports.
- Keep credentials in your Dify workspace or secret manager, never in the DSL or catalog.
- Treat catalog metadata as organization-owned configuration and confirm you are authorized to publish it.
- Use synthetic or explicitly licensed examples in public repositories.
- The workflow produces suggestions for human review; it is not a campaign execution system.

## Limitations

- The included Dify workflow uses flat conditions and does not guarantee lossless conversion of arbitrary nested boolean trees.
- Knowledge retrieval can miss records; a whitelist prevents invention but cannot guarantee recall.
- The template does not evaluate account-specific CDP permissions or current field availability.
- Target Dify versions and installed model providers vary. Re-select models after import when needed.

## Contributing

Read [`CONTRIBUTING.md`](CONTRIBUTING.md) and [`SECURITY.md`](SECURITY.md). New catalog adapters, deterministic rule checks, Dify compatibility tests and non-retail synthetic examples are especially welcome. First-time contributors can start with the scoped tasks in [`docs/CONTRIBUTOR_STARTER_ISSUES.md`](docs/CONTRIBUTOR_STARTER_ISSUES.md).

Maintainers should also read [`docs/MAINTAINER_WORKFLOW.md`](docs/MAINTAINER_WORKFLOW.md) and [`docs/PUBLIC_RELEASE_CHECKLIST.md`](docs/PUBLIC_RELEASE_CHECKLIST.md). They separate locally verified behavior from public-release, Dify-runtime and adoption evidence.

## License

Apache License 2.0. See [`LICENSE`](LICENSE).
