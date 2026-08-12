# Reproducible case studies

These case studies turn the synthetic Audience Blueprint demo into reviewable test runs. They are designed for maintainers, evaluators and Dify users who want to reproduce the workflow behavior rather than rely on screenshots or marketing claims.

## Evidence status

- Every field, value and path in these cases comes from the repository's synthetic catalog under [`knowledge/tags`](../../knowledge/tags/).
- The expected outcomes are acceptance criteria for a Dify Preview run; they are not claims that a particular Dify version or model provider has already produced identical wording.
- Cart recovery also has a deterministic local runner. `npm run demo` verifies the embedded strategy-selection and catalog-validation code without an LLM, a CDP or an external service.
- None of the cases uses customer records, calculates an audience count, creates a segment, sends a campaign or proves production-CDP compatibility.

## Case index

| Case | Scenario code | Primary expected state | Additional safety evidence |
|---|---|---|---|
| [Brand promotion](01-brand-promotion.md) | `BRAND_PROMOTION` | `CONFIRMED_CONFIGURABLE` | A trend-affinity follow-up must become `NEEDS_CONFIRMATION` |
| [Dormant-customer recall](02-dormant-recall.md) | `DORMANT_RECALL` | `CONFIRMED_CONFIGURABLE` | Historical purchase data must not be described as income |
| [Store opening](03-store-opening.md) | `STORE_OPENING` | `CONFIRMED_CONFIGURABLE` | A three-kilometre residence request must surface `CF-015` as unsupported |
| [Cart recovery](04-cart-recovery.md) | `CART_RECOVERY` | `CONFIRMED_CONFIGURABLE` | The same-window completed-purchase exclusion is mandatory |

## Shared Dify setup

Before running any case:

1. Follow [`docs/DIFY_SETUP.md`](../DIFY_SETUP.md).
2. Create and bind the strategy knowledge base from all six files in [`knowledge/strategy`](../../knowledge/strategy/).
3. Create and bind the catalog knowledge base from all 17 files in [`knowledge/tags`](../../knowledge/tags/).
4. Import [`workflow/audience-blueprint-chatflow.yml`](../../workflow/audience-blueprint-chatflow.yml), bind both empty retrieval nodes and select an available chat model in both LLM nodes.
5. Start a new Preview conversation for each case so that an earlier activity context cannot change the result.

Knowledge retrieval is probabilistic. A failed run is evidence to inspect retrieval configuration, not permission to invent a missing field. If a required strategy or `TAG_RECORD` is not recalled, the workflow should stop or report a gap.

## What to capture from a real run

When publishing compatibility evidence, record all of the following:

- Dify version and deployment type;
- model provider and model name;
- knowledge-base chunking and retrieval settings;
- run date and exact input from the case file;
- final state and the list of CF-IDs shown;
- a redacted screenshot or exported run log;
- any deviation from the acceptance checklist.

Do not label a case "verified on Dify" until that evidence has been captured. Do not upload workspace IDs, API keys, internal URLs or private catalog data.

## Global acceptance boundaries

Every successful run must preserve these statements:

- the catalog and campaign data are synthetic;
- no audience count was calculated;
- no segment was created;
- no person was contacted;
- a human must review and reproduce the rule in an authorized CDP account;
- synthetic CF-IDs and paths are not production CDP fields.
