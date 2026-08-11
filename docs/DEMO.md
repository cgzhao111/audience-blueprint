# Reproducible workflow-core demo

The repository includes a deterministic demo that runs the strategy-selection and catalog-validation Python embedded in the public Dify Chatflow.

```bash
npm install
npm run demo
```

The command does not call an LLM, a CDP, or an external service. It loads the synthetic common and cart-recovery strategies, resolves their CF-ID whitelist, loads only the matching generated catalog documents, and validates a candidate audience plan.

## Expected evidence

The current `v0.1.1` candidate produces:

```text
# Audience Blueprint deterministic workflow-core demo

- Scenario: CART_RECOVERY
- Status: CONFIRMED_CONFIGURABLE
- Confirmed conditions: 6
```

The displayed plan contains:

- `CF-007` as a recent add-to-cart inclusion event;
- `CF-016` as a completed-purchase exclusion in the same seven-day window;
- `CF-011` as the required synthetic consent state;
- `CF-012` as a suppression exclusion;
- `CF-017` as a configurable contact-pressure exclusion;
- the fixed statement that no audience count, segment creation or outreach occurred.

Automated regression cases also verify that:

- `CF-014` remains `NEEDS_CONFIRMATION` because its evidence metadata is incomplete;
- `CF-015` becomes an `UNSUPPORTED` capability gap instead of being replaced by nearest-store or purchase-region data;
- an invented `CF-999` is rejected;
- common personal identifiers are blocked before the first model node.

## What this proves

- The public YAML parses locally.
- Its four embedded Python Code nodes compile.
- The deterministic workflow core can select a scenario whitelist and enforce the three catalog states.
- The generated catalog documents and executable rules remain linked to evidence source and version.

## What this does not prove

- A specific Dify release has imported the DSL successfully.
- Knowledge retrieval will recall every required record in every embedding setup.
- Any model provider will generate the same candidate JSON.
- A production CDP exposes these synthetic fields or supports the displayed semantics.
- Any audience was counted, created or contacted.

Record Dify-specific evidence separately using [`PUBLIC_RELEASE_CHECKLIST.md`](PUBLIC_RELEASE_CHECKLIST.md).
