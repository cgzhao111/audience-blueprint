## Summary

Describe the user problem, the solution, and the smallest useful change.

## Related issue

Link the issue this change addresses. Behavior changes and new catalog fields should normally have an issue first.

## Change type

- [ ] Bug fix
- [ ] Dify compatibility adjustment
- [ ] Catalog or schema change
- [ ] Strategy or synthetic use-case addition
- [ ] Documentation or test improvement

## Trust-boundary impact

Explain whether this changes PII handling, strategy whitelists, catalog intersection, evidence states, rule rendering, or the human-review boundary. Write `None` when no trust boundary changes.

## Safety and data checklist

- [ ] I used only synthetic, public-domain or explicitly licensed data.
- [ ] I did not add credentials, internal URLs, production dataset IDs or customer records.
- [ ] I preserved the three-state evidence behavior.
- [ ] I did not introduce or imply automatic audience counting, segment creation or campaign delivery.
- [ ] I added or updated relevant tests and documentation.
- [ ] `npm run check` passes locally.

## Verification

List exact commands, fixtures, and Dify preview cases used to verify the change. Distinguish these evidence levels:

- Local deterministic checks:
- Dify import/retrieval checks, including exact Dify version and deployment type:
- Model-dependent conversation checks:
- Not tested:

Do not claim Dify compatibility from local tests alone. Redact credentials, workspace IDs, knowledge IDs, private URLs, and organization metadata from logs or screenshots.

## Public claims

- [ ] Any compatibility, adoption, download, contributor, or performance claim in this PR has a public source or reproducible artifact.
- [ ] I have not counted stars, views, duplicate reports, or maintainer-authored tests as independent adoption.

List supporting links, or write `No public claims`.

## Reviewer focus

Call out the files, risks, generated artifacts, or manual checks that need the closest review.
