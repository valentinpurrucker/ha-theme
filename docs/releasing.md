# HACS installation and releases

The upstream repository is [valentinpurrucker/ha-theme](https://github.com/valentinpurrucker/ha-theme). Add that URL to **HACS → Custom repositories** with type **Dashboard**. It is called `plugin` in HACS's backend and validation action.

HACS can install this project only after the GitHub repository is public and a release with the `still-cards.js` asset has been published. Private repositories and draft releases are not supported installation sources. Source files on the default branch are intentionally not offered as an installable version because the compiled `dist/` directory is ignored.

## Distribution contract

- The root `hacs.json` names the exact release asset: `still-cards.js`. This override works even though the repository is named `ha-theme`.
- `content_in_root: false` allows HACS to select the GitHub release asset. `hide_default_branch: true` hides the unbuilt default branch in the version picker.
- HACS downloads the JavaScript file directly. `zip_release` is not used for Dashboard cards. The manual `.tar.gz` archive is a separate asset.
- Lit and its license notices are embedded in the single JavaScript file. The optional theme, license files, checksums, and manual archive are attached to the release separately.
- HACS installs the module under `<config>/www/community/ha-theme/still-cards.js` and serves it at `/hacsfiles/ha-theme/still-cards.js`. It manages the resource in storage mode; YAML resource mode needs an explicit module entry. Avoid loading both `/local/` and `/hacsfiles/` copies.

The companion theme remains an optional `still.yaml` download from the same release. HACS separates Dashboard and Theme repositories; a Dashboard install does not write theme YAML into Home Assistant's `themes/` directory. To manage the theme through HACS too, publish a separate theme repository with its own manifest and `themes/still.yaml`.

## Publish a version directly

1. Set the intended version in `package.json`, update release notes as needed, and commit the changes.
2. Run `bun install --frozen-lockfile` and `bun run check`.
3. Verify the exact tag against the current artifacts, for example `RELEASE_TAG=v0.1.0 bun run check:release`.
4. Push the source commit, create the matching version tag, and push that tag:

```sh
git push origin main
git tag v0.1.0
git push origin v0.1.0
```

5. Publish a GitHub release for that tag and attach `release/still-cards.js` as a raw asset. Attach `still.yaml`, `hacs.json`, license files, `SHA256SUMS`, and the manual archive as companion assets. For example:

```sh
gh release create v0.1.0 release/still-cards.js release/still.yaml release/hacs.json release/LICENSE release/THIRD_PARTY_LICENSES.txt release/SHA256SUMS release/still-cards-0.1.0.tar.gz --repo valentinpurrucker/ha-theme --verify-tag --title "Still Cards v0.1.0" --notes-file .github/release-notes.md
```

The tag must match `v` plus the package version exactly. An existing published version should not be reused; bump the version for later changes. A tag alone is not enough: the release and JavaScript asset must be published.

`bun run check:release` verifies the manifest, version tag when supplied, byte-for-byte agreement between the built and packaged JavaScript, its SHA-256 checksum, included license notices, and the packaged manifest. Archive filenames are derived from `package.json` instead of a hard-coded version.

## Optional automated releases

The workflow templates are in `automation/workflows/` and are inactive. GitHub rejected the initial workflow upload because the connected OAuth credential lacks the `workflow` scope. This does not prevent direct code pushes or HACS release uploads.

To activate automation later, use a GitHub credential allowed to manage Actions workflows, copy the templates into `.github/workflows/`, and commit/push them. `check.yml` runs the project checks, while `release.yml` builds and checks matching version tags, publishes the HACS assets, and runs the official HACS validator with `category: plugin`. Matching package versions containing a hyphen are marked as prereleases. The running workflow needs the normal repository `GITHUB_TOKEN` with `contents: write`.

The official validator checks GitHub repository contents and metadata after assets are published. The release template runs it directly because a release created by `GITHUB_TOKEN` does not normally trigger another workflow. `hacs.yml` also supports manually published releases and an on-demand validation run. Private draft preparation is separate from public HACS validation.

## First release from a private repository

The code and artifacts can be prepared in a private repository and a draft release. Changing visibility to public requires the repository owner's approval. Once approved, make the repository public and publish the draft with all required assets. Run **Validate HACS** if the automation templates have been activated. An unpublished draft is insufficient for installation.

## Troubleshooting

- **Repository not found:** verify the full GitHub URL is public. HACS cannot use a private repository even when your browser is signed in.
- **Repository structure is not compliant:** check that a published release contains the raw `still-cards.js` asset and that its name matches `hacs.json`. Do not upload only the manual archive.
- **Custom element does not exist:** refresh the browser and check that exactly one JavaScript module resource points at `/hacsfiles/ha-theme/still-cards.js` (with HACS's managed query string where applicable).
- **Theme is missing:** install the optional YAML separately, enable the frontend theme directory, reload themes, and select Still in your profile.

Primary references: [HACS Dashboard publishing](https://www.hacs.dev/docs/publish/plugin/), [manifest fields](https://www.hacs.dev/docs/publish/start/), [custom repositories](https://www.hacs.dev/docs/faq/custom_repositories/), [private repositories](https://www.hacs.dev/docs/faq/private_repositories/), [theme publishing](https://www.hacs.dev/docs/publish/theme/), and [official validation action](https://www.hacs.dev/docs/publish/action/).
