# Direct GitHub saving without a backend

This optional feature keeps PetQR on GitHub Pages. There is no OAuth broker, central service or application client secret. GitHub's REST API accepts an explicitly supplied fine-grained personal access token. Public profiles and manual ZIP exports do not require a key or API calls.

## First connection

Click **Connect GitHub → Create a limited access key in GitHub**. The link pre-fills the owner, name, seven-day expiration and **Contents: Read and write**. You must still choose **Only select repositories** and the single PetQR repository shown in the editor. GitHub may ask you to authenticate or confirm your account. Generate the key on GitHub, paste it into the editor's masked field and confirm the restriction. Never send it through chat or commit it to source.

The app cannot inspect the key's complete GitHub selection/permission policy. The confirmation is your acknowledgement; GitHub is the actual permission authority. Do not grant all-repository, Administration or Workflows access. Account-level write access alone does not guarantee that the key allows writes. GitHub can reject a key because of its scope, expiry, organization approval or repository rules. The editor does not bypass these restrictions.

## Save

Edit, click **Save and publish**, review the public summary and press **Publish changes**. The same privacy filter as ZIP export removes unpublished fields and unconfirmed sensitive information. Only the four public configuration JSON files and referenced photos are allowed. The source repository URL is detected from GitHub Actions metadata rather than hardcoded in template source.

The client reads the latest branch/tree and compares the four source JSON hashes and referenced photo hashes with the deployed snapshot. If they differ, it stops before upload. An imported photo also cannot replace a different, previously untracked source image at the same path. Code-only changes can be preserved. New/changed files are uploaded as Git blobs, joined to the latest base tree, and committed together. The final branch update is a non-forced fast-forward, so a racing change cannot be silently overwritten. A conflict never triggers an automatic overwrite/retry. Save/export your local draft, wait for the latest Pages deployment and reload before reconciling the edits.

The app distinguishes **Saved in GitHub** from **Published**. It polls its own public deployment metadata, without requesting Actions permission. A failed or slow build leaves the saved commit in GitHub and shows a pending/attention message with a link. No changes to the public files means no commit is created. Removing pets removes their routes on the next build; old photos/history are not automatically erased.

## Credential lifetime and limitations

- The password field is cleared immediately on connection. The key lives only in a private in-memory client instance and is not included in config, IndexedDB, localStorage, sessionStorage, exports, URLs, logs or publication content.
- The connection expires after 30 minutes. Reload, navigation and Disconnect forget it. A browser's internal memory handling is outside PetQR's control; this is not a hardware secret vault.
- The GitHub key itself remains valid until its GitHub expiry or explicit revocation. Disconnect does not revoke it. Use **Manage or revoke keys** in the connection dialog.
- Requests carrying the key are sent only to `https://api.github.com`, with no cookies, no redirects and no referrer. Connecting is restricted to HTTPS or localhost. The editor's CSP restricts scripts to local bundles and credential-bearing connections to GitHub's API.
- Contents write access is repository-wide. GitHub does not enforce PetQR's folder allowlist for a stolen key. A compromised GitHub account, untrusted editor code, malicious browser extension or stolen key can still compromise the repository. Use a trusted copy, a short expiry and a single-repository key.
- GitHub can have availability/rate limits. Large/truncated repository trees are rejected safely. Branch protections may require PRs, in which case use your repository's review process or the manual export workflow.

## Portability and development

`scripts/build.ts` emits `data/deployment.json` from `GITHUB_REPOSITORY`, `GITHUB_REPOSITORY_ID`, `GITHUB_REF_NAME`, `GITHUB_SHA` and raw public source-file hashes. The generated file is never committed as source configuration. Template copies get their own metadata automatically. An automatically detected Pages URL remains automatic in source when saving, so copies do not inherit a hardcoded maintainer domain.

Outside Actions, the editor can accept an explicit `owner/name` when repository identity is unavailable, while still requiring the source hashes to match. It always targets the repository's current default branch and never edits application code or workflows.

Implementation: `src/github.ts` (API and concurrency), `src/deployment.ts` (public identity/hashes), `src/public-files.ts` (shared privacy-filtered file collection), `src/publishing-ui.ts` (connection/review/status), `src/publishing-i18n.ts` (local translations). Unit and browser tests mock GitHub's REST behavior and cover successful atomic saves, permission failures, stale data, races, credential exclusion and forgetting the connection. Browser mocks do not create a real user's key or prove their eventual key policy.

Official references: [fine-grained keys](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens), [Git trees](https://docs.github.com/en/rest/git/trees), [Git references](https://docs.github.com/en/rest/git/refs).
