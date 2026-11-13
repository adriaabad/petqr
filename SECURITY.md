# Security policy

The current 1.x release line receives security fixes in maintained copies. Each independent repository is responsible for its updates; PetQR has no centralized update service.

Do not open a public issue containing personal data or exploit details. Use **Security → Report a vulnerability** in the affected repository if its maintainer has enabled private vulnerability reporting. If unavailable, ask the maintainer in a public issue for a private reporting channel **without disclosing sensitive details**. No maintainer email or identity is hardcoded in this template.

Include the affected version, reproduction steps using fictional data, impact and a suggested fix if known. Never send real contact/medical data, tokens or unpublished drafts. Maintainers should assess injection, unsafe URL handling, ZIP resource exhaustion, draft exposure and export-filter bypasses. Contact links are user initiated; location stays in a finder-created message.

Public JSON, repository history and generated pages are not confidential. Accidentally published data requires removal from source and deployment, history/cache review, and potentially changing identifiers/contact methods. A code fix alone cannot recall already copied public data.

Optional browser publishing requires a fine-grained key selected for one repository and Contents write only. Keys remain in tab memory, expire from the editor connection after 30 minutes, and are never stored in config, browser storage, URLs or logs. This does not make stolen keys harmless: Contents permission is repository-wide. Revoke a suspected key in GitHub. The client pins authenticated requests to api.github.com, refuses redirects/broad classic keys, filters and validates public files, rejects other paths, checks deployed source hashes and never force-updates a branch. Review changes to these boundaries carefully. There is no public write endpoint or server-held credential.
