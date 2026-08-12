# Adoption and compatibility evidence

Audience Blueprint welcomes public reports from people who import the Dify workflow, run a synthetic scenario, or evaluate the catalog contract. Successful, partial, and failed results all improve the project.

This page defines how to share useful evidence without exposing identities, production metadata, or inflated metrics.

## Choose the right report

Use one of the repository issue forms:

- **Dify compatibility report** — import the workflow into a named Dify version and record import, knowledge binding, retrieval, and golden-case results separately.
- **Use-case feedback** — describe a marketing scenario you actually tested and what was useful, incomplete, or unsafe.
- **Feature request** — propose a reusable improvement with a synthetic acceptance case.
- **Bug report** — provide a minimal synthetic reproduction of incorrect behavior.

Reports do not need to be success stories. A reproducible import failure or retrieval miss is valid evidence and should remain visible.

## Identity and privacy options

Organization, employer, role, geography, and contact details are optional. Omit them when they are not necessary to reproduce the result.

GitHub does **not** provide anonymous issues: the GitHub username that opens an issue is public. If you cannot associate your account with a public report, do not open an issue. You can instead:

1. keep the local record template below for your own evaluation;
2. share it through an existing private channel that you already trust; or
3. ask a maintainer to publish a de-identified summary only after agreeing on the exact wording and evidence that may be disclosed.

A maintainer must label privately received information as `PRIVATE_SELF_REPORT` and must not identify the person or organization without explicit consent. A private self-report is not public adoption evidence and must not be cited as an independently verifiable user.

## Data that must not be shared

Do not submit:

- API keys, model credentials, cookies, authorization headers, or secret-manager values;
- Dify workspace IDs, knowledge IDs, private endpoints, internal URLs, or unredacted deployment logs;
- real customer briefs, CDP exports, field paths, enumeration values, dataset IDs, or screenshots owned by an organization;
- member records, names, phone numbers, email addresses, order details, device identifiers, or other user-level data;
- confidential model prompts, vendor contracts, or security findings that would enable misuse.

Use the bundled synthetic catalog and strategies wherever possible. Replace sensitive names and values with fictional placeholders before sharing evidence.

Security vulnerabilities should follow `SECURITY.md`, not a public compatibility or use-case issue.

## Local or privately shared record template

Copy this template into a local Markdown file. Every field except `Test date`, `Project version`, `Test type`, and `Outcome` is optional.

```markdown
# Audience Blueprint test record

- Test date (UTC):
- Project version or commit:
- Test type: Dify import / golden case / custom synthetic use case
- Outcome: success / partial / failed / not completed
- Dify version and deployment type (if tested):
- Model provider and model (optional; no endpoint or credentials):
- Published cases actually executed:
- Required changes:
- Observed limitations or failures:
- Sanitized evidence location:
- Organization/team: omitted
- Permission to publish a de-identified summary: yes / no / ask first
```

Saving this template does not create a public usage claim. It becomes public evidence only when the reporter publishes it or consents to a de-identified record with enough reproducible detail.

## Evidence levels

Use these labels when summarizing reports:

| Evidence level | Meaning | Safe public statement |
|---|---|---|
| `LOCAL_MAINTAINER_TEST` | A project maintainer ran a local deterministic check | The named commit passed the listed local commands |
| `PUBLIC_SELF_REPORT` | A public issue describes a test by a GitHub user | A public reporter tested the named version; result remains self-reported |
| `PUBLIC_REPRODUCIBLE` | The report includes a sanitized fixture or enough steps for another person to repeat it | The published setup and result were independently reproducible |
| `PRIVATE_SELF_REPORT` | A person privately shared a test but did not authorize identity/public evidence | Private feedback was received; do not count or identify an adopter |

One report may contain several evidence levels. For example, import success can be reproducible while model-dependent answer quality remains self-reported.

## Compatibility is not one Boolean

Record each layer separately:

1. the DSL imports into an exact Dify version;
2. both synthetic knowledge bases can be bound;
3. retrieval returns the required synthetic records;
4. deterministic checks preserve `CONFIRMED_CONFIGURABLE`, `NEEDS_CONFIRMATION`, and `UNSUPPORTED`;
5. the selected model produces useful conversation wording;
6. the fixed boundary remains clear: no audience count, segment creation, or outreach occurred.

Passing one layer does not prove the others. Model providers, embeddings, Dify releases, and deployment types may produce different results.

## Counting and reporting adoption honestly

Maintainers and contributors must not manufacture activity or convert attention into users.

- Do not buy stars, solicit fake reports, create duplicate issues, or submit maintainer-authored feedback as an independent adopter.
- Stars, page views, repository clones, release downloads, and social impressions are separate signals; none proves that the workflow was imported or tested.
- Count multiple reports from the same person or deployment as one adopter unless there is a documented reason to report sessions separately.
- Do not publish an organization name without explicit permission.
- Do not turn `PRIVATE_SELF_REPORT` records into a public adopter count.
- Publish failed and partial compatibility results alongside successful ones.
- Attach a date, project version, Dify version, evidence level, and public link to any compatibility matrix or adoption summary.

When evidence is incomplete, say so directly. `Not yet verified` is more useful than an unsupported compatibility or adoption claim.
