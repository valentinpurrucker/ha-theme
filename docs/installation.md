# Install Still cards

This archive contains a built Home Assistant frontend resource, the Still light/dark theme, an example dashboard, documentation, checksums, and licenses. You do not need Bun or Node on your Home Assistant host.

## HACS installation

Once the repository is public and the first release is published, open HACS → ⋮ → Custom repositories, add `https://github.com/valentinpurrucker/ha-theme`, and select **Dashboard**. Download **Still Cards** and refresh Home Assistant. HACS manages the module in storage resource mode; YAML mode uses `/hacsfiles/ha-theme/still-cards.js` with `type: module`. Remove any old `/local/still-cards.js` resource when switching to HACS.

HACS installs the card module. The optional `still.yaml` theme is installed separately using the steps below. See [releasing.md](releasing.md) for release requirements and troubleshooting.

## Manual card and theme installation

1. Copy `still-cards.js` into your Home Assistant configuration directory as `www/still-cards.js`. Restart Home Assistant if you created `www` for the first time.
2. Enable Advanced mode in your user profile and open Settings → Dashboards → Resources. Add `/local/still-cards.js?v=0.1.0` as a JavaScript module.
3. Copy `still.yaml` to `themes/still.yaml` in the same configuration directory.
4. Merge this into your existing `frontend:` configuration:

```yaml
frontend:
  themes: !include_dir_merge_named themes
```

Restart after first enabling themes. On later edits, run `frontend.reload_themes` in Developer tools → Actions. Select **Still** in your profile and choose light or dark appearance.

Add a card through the dashboard's card picker or YAML editor:

```yaml
type: custom:still-light-card
entity: light.living_room
name: Reading light
```

Replace the example entity with an entity from your installation. All sample entities in `dashboard.yaml` need to be mapped to your own entities before importing it.

If you use YAML resource mode, merge this into your existing Lovelace configuration instead of adding the resource through the UI:

```yaml
lovelace:
  resource_mode: yaml
  resources:
    - url: /local/still-cards.js?v=0.1.0
      type: module
```

On updates, replace the bundle and increment its URL query string to clear the browser module cache. The bundle includes Lit and uses Home Assistant's own icon/card components. No card-mod or other custom-card dependency is needed.

See [configuration.md](configuration.md) for the complete card/token/action reference, [architecture.md](architecture.md) for extension points, and [validation.md](validation.md) for verification evidence and remaining real-device checks. This archive was built locally; it has not been deployed to your installation.
