<img src="assets/icon.svg" width="64" height="64" alt="Still leaf">

# Still cards

A quiet Home Assistant card collection and matching light/dark theme. Soft surfaces, restrained colors, clear controls, and one shared design language. Inspired by the simplicity of Mushroom and Bubble Card; implemented as an independent library.

**Ten card kinds:** entity/sensor, light, climate, media, cover, fan, scene/action, weather, chips, and title. One auto card chooses the appropriate kind from the entity domain. Cards support the dashboard picker, a visual editor, Sections sizing, and masonry sizing.

## Install with HACS

HACS requires this repository to be **public** and to have a published release containing `still-cards.js`. A private repository or draft release cannot be installed through HACS.

1. Open **HACS → ⋮ → Custom repositories**.
2. Add `https://github.com/valentinpurrucker/ha-theme` and choose **Dashboard** (called `plugin` internally).
3. Open **Still Cards**, select **Download**, and install the latest release.
4. Refresh Home Assistant. In storage resource mode, HACS adds and updates the JavaScript module automatically. In YAML resource mode, add it yourself:

```yaml
lovelace:
  resource_mode: yaml
  resources:
    - url: /hacsfiles/ha-theme/still-cards.js
      type: module
```

If upgrading from a manual installation, remove the old `/local/still-cards.js` resource so only the HACS resource is loaded. HACS may append its own `hacstag` query string; keep the managed URL when using the UI.

Add a Still card through the dashboard editor, or use:

```yaml
type: custom:still-light-card
entity: light.living_room
name: Reading light
```

The cards work with your existing Home Assistant theme. To use the optional companion **Still** theme, download [still.yaml from the latest release](https://github.com/valentinpurrucker/ha-theme/releases/latest/download/still.yaml), copy it to `<config>/themes/still.yaml`, enable themes under `frontend:`, and reload themes. HACS Dashboard downloads do not install theme YAML. Theme repositories are a separate HACS category.

See [the HACS installation and publishing guide](docs/releasing.md) for release prerequisites, updates, and troubleshooting. This repository is added as a custom repository; inclusion in the default HACS catalog is a separate submission.

## Try it

Requires [Bun](https://bun.sh/) 1.3+ and a modern browser.

```sh
bun install --frozen-lockfile
bun run dev
```

Open http://localhost:5173. The demo uses the actual custom cards with simulated Home Assistant state and service calls. Try the controls, room filters, card editor, unavailable-device switch, and style studio. The studio remembers appearance settings locally and exports a custom theme YAML file. It does not connect to your real home.

After building, `bun run preview:inline` creates a portable `docs/preview.html` with four interactive production cards and style controls, without external assets.

## Manual installation

```sh
bun run build
```

1. Copy `release/still-cards.js` into `<config>/www/still-cards.js`. Create `www` if necessary; Home Assistant may need a restart when this folder is first added.
2. Enable Advanced mode in your profile, then add `/local/still-cards.js?v=0.1.0` as a **JavaScript module** under Settings → Dashboards → Resources. YAML resource mode is covered in [examples/configuration.yaml](examples/configuration.yaml).
3. Copy `release/still.yaml` into `<config>/themes/still.yaml`. Merge `themes: !include_dir_merge_named themes` into your existing `frontend:` block in `configuration.yaml`. Restart after first enabling themes; for later changes, run `frontend.reload_themes` under Developer tools → Actions.
4. Select **Still** in your user profile. Both light and dark modes are available. Add a Still card through the dashboard editor or paste the example below.

```yaml
type: custom:still-light-card
entity: light.living_room
name: Reading light
variant: soft
```

Replace the sample entities in [examples/dashboard.yaml](examples/dashboard.yaml) with your own. The card bundle works independently of the companion theme and inherits Home Assistant colors by default. Lit is bundled: no CDN, card-mod, Mushroom, or Bubble Card dependency is required at runtime. The demo alone loads optional Google Fonts and demo icons.

## Change the style

Theme values become CSS variables. Change a few tokens in `themes/still.yaml` to restyle every Still card:

```yaml
still-accent: "#4a6f91"
still-radius: "14px"
still-padding: "16px"
still-icon-radius: "10px"
still-control-radius: "10px"
```

Each card also supports `variant: soft | outlined | minimal`, `density: comfortable | compact`, and a small `style` object for per-card overrides. The visual editor exposes these options. Full token and action reference: [docs/configuration.md](docs/configuration.md).

## Extend it

Each card kind is a small renderer registered with shared metadata. The common shell handles Home Assistant data, validation, actions, errors, sizing, and theme tokens. Add a renderer without duplicating the whole card implementation. See [docs/architecture.md](docs/architecture.md) for source and external-module extension examples.

## Verify and build

```sh
bun run check         # TypeScript, unit/integration tests, both builds, release files
bun run dev          # Keep this running for the browser checks
bun x playwright-core install chromium
bun run test:browser # Controls, editor, themes, accessibility, responsive layouts
```

Linux may need browser libraries: `bun x playwright-core install --with-deps chromium`. Browser checks accept `STILL_DEMO_URL`, `STILL_CHROME_PATH`, and `STILL_BROWSER_NO_SANDBOX=1` for an isolated CI/container environment. They write screenshots and a machine-readable report to `docs/`.

Build outputs are `dist/still-cards.js` (self-contained ES module), `site/` (static demo), and `release/` (installable files, archive, licenses, and checksums). No deployment or Home Assistant configuration changes are performed automatically.

Optional GitHub Actions templates live in `automation/workflows/`. Once activated, a `v<package.json version>` tag verifies the build and asset checksums, publishes the raw JavaScript asset for HACS, and runs HACS's official validator. They are currently inactive because the connected GitHub credential does not have the `workflow` scope. HACS installation works with releases published directly; see [docs/releasing.md](docs/releasing.md).

Research by GPT‑6 Luna, with primary-source links, is in [docs/research.md](docs/research.md). The current validation evidence and remaining hardware checks are in [docs/validation.md](docs/validation.md).

## Scope

This is a frontend project, not a backend integration. v0.1 focuses on common controls: brightness and Kelvin warmth, single-target thermostat adjustment, transport and volume, cover position, and fan percentage/oscillation. Dual-target climate editing opens native more-info. RGB pickers, history graphs, forecasts, media queues, cover tilt, fan presets, templates, security cards, and hold/double-tap gestures are deferred. See [docs/configuration.md](docs/configuration.md) for exact behavior.

MIT licensed. Bundled third-party license notices are included in `release/THIRD_PARTY_LICENSES.txt`.
