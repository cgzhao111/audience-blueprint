# Security policy

## Supported versions

Security fixes are currently applied to the latest released minor version.

## Report a vulnerability

Do not open a public issue for a vulnerability that could expose credentials, personal data or private catalog metadata. Use GitHub's private vulnerability reporting or Security Advisory feature on the repository.

Include:

- affected version or commit;
- reproduction steps using synthetic data;
- expected and actual behavior;
- impact and suggested mitigation, if known.

## Data handling boundary

Audience Blueprint is a template and local CLI. It should not receive customer-level records. Production operators are responsible for Dify model-provider, logging, retention and CDP access controls.

Never commit:

- API keys or bearer tokens;
- internal model-provider identifiers;
- production Dify dataset IDs;
- customer lists, contact information or order records;
- organization-owned metadata without permission.
