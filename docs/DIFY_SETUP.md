# Dify setup

## Prerequisites

- A Dify workspace that supports Chatflow DSL `0.6.0`.
- A configured chat model. The template references `langgenius/openai/openai` with `gpt-4.1-mini`; after import, select any organization-approved chat model if that provider is unavailable.
- Two knowledge bases.

## 1. Build catalog documents

The repository already includes generated synthetic documents. Rebuild them to verify the CLI:

```bash
npm run build:demo
```

For your own metadata:

```bash
node ./bin/audience-blueprint.js validate ./path/to/catalog.json
node ./bin/audience-blueprint.js build ./path/to/catalog.json --out ./knowledge/tags --force
```

Never use `--force` against an output directory that contains hand-edited production documents. It overwrites generated files with matching IDs.

## 2. Create knowledge bases

Create two independent knowledge bases:

1. `Audience Blueprint - Strategies`
   - upload the five files in `knowledge/strategy/`;
   - use title or parent-child chunking;
   - keep the scenario code and its “允许引用的标签” section in the same parent chunk.
2. `Audience Blueprint - Catalog`
   - upload all files in `knowledge/tags/`;
   - keep each `TAG_RECORD_BEGIN` to `TAG_RECORD_END` block in one retrievable parent chunk;
   - do not combine multiple record IDs into one generated document.

## 3. Import and bind the Chatflow

1. Import `workflow/audience-blueprint-chatflow.yml` in Dify Studio.
2. Open `业务策略知识检索（导入后绑定）` and bind the strategy knowledge base.
3. Open `CDP标签配置知识检索（导入后绑定）` and bind the catalog knowledge base.
4. Open both LLM nodes and select a model available in your workspace.
5. Reranking is disabled and its model fields are intentionally empty. Select an organization-approved reranker only if you explicitly enable that feature.
6. Save and run Preview before publishing.

The two `dataset_ids` arrays are intentionally empty. Public workflows must not embed another workspace's knowledge IDs.

## 4. Test

Use all cases in `evals/golden-cases.md`. A successful demo should:

- ask for missing fields before generating a plan;
- use only CF IDs allowed by the selected strategy;
- distinguish confirmed, pending and unsupported records;
- reject common personal identifiers before the first LLM node;
- display the fixed boundary statement;
- preserve the previous valid plan when an unsupported modification is attempted.

## 5. Production checklist

- Replace every synthetic record with authorized metadata.
- Keep evidence source and catalog version for each confirmed record.
- Verify retrieval recall for every scenario whitelist.
- Confirm Dify logging, data retention and model-provider policies.
- Add human CDP replication tests before calling a rule executable.
- Do not connect automatic segment creation or messaging without a separate security and governance review.
