# Public release checklist

This checklist distinguishes a locally complete repository from a publicly maintained open-source project. Check an item only when direct evidence exists.

## Ownership and sanitization

- [ ] The maintainer has authority to publish the source code and documentation.
- [ ] All examples are synthetic, public-domain or explicitly licensed for redistribution.
- [ ] No customer, employer or vendor identifiers remain in Git history.
- [ ] No API keys, Dify knowledge IDs, internal URLs or user-level records are present.
- [ ] `npm run check` passes on the exact release commit.

## Runtime evidence

- [ ] The DSL imports successfully into a named Dify version.
- [ ] Both knowledge bases are bound and each golden case is executed.
- [ ] Screenshots or a short demo use only the bundled synthetic catalog.
- [ ] Model and optional plugin requirements are documented from the tested workspace.
- [ ] Unsupported changes preserve the previous valid plan.

## GitHub project setup

- [ ] Create a public repository under an account that will actively maintain it.
- [ ] Enable branch protection and require the CI workflow.
- [ ] Add repository topics such as `dify`, `cdp`, `audience-segmentation` and `agent`.
- [ ] Publish `v0.1.0` with a checksum for the npm package tarball or source archive.
- [ ] Open roadmap issues instead of presenting planned features as implemented.
- [ ] Add one `good first issue` backed by a clear acceptance test.

## Adoption evidence

- [ ] Collect feedback through public issues or discussions.
- [ ] Record successful setup results with Dify version and provider, without credentials.
- [ ] Document independent users or contributors only with verifiable public links.
- [ ] Track limitations and failed setups as openly as successful ones.

## Open-source program application

OpenAI states that core maintainers and maintainers of widely used public projects should apply, and that projects with other ecosystem importance may also explain their case. A repository scaffold alone does not prove those criteria.

Before applying through [Codex for Open Source](https://developers.openai.com/community/codex-for-oss), prepare:

- the public repository URL and proof of maintainer write access;
- a concise explanation of the ecosystem problem and why this project is reusable;
- public evidence of maintenance activity, users or planned community stewardship;
- examples of Codex in pull-request review, maintainer automation, release work or another core OSS workflow;
- an accurate statement of what support would enable next.

Do not state or imply that this project has been accepted until OpenAI confirms it.

## Current repository state

As shipped locally in `v0.1.0`:

- the CLI and synthetic catalog tests run locally;
- all embedded Python Code nodes compile and their core synthetic path executes locally;
- repository sanitization tests run locally;
- target Dify import, public GitHub CI, public adoption and program eligibility are not yet verified.
