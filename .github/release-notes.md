Still Cards v0.2.0 refines the collection with an iOS-inspired light/dark design: system typography, grouped surfaces, native-style switches, and focused detail sheets.

- Climate presets use the thermostat’s advertised modes and `climate.set_preset_mode`.
- Tap headers for full controls in a modal sheet, with keyboard focus handling, Escape/backdrop dismissal, and a native Home Assistant details link.
- Compact light tiles keep power on the dashboard and brightness/warmth in details.
- New toggle and solar card types bring the collection to twelve kinds. Solar supports production, home, grid import/export, battery, and daily generation with explicit sensor mappings.
- Updated responsive dashboard, mobile navigation, theme tokens, examples, and documentation.

**Upgrade note:** header taps now open Still’s detail sheet. Set `tap_action: {action: more-info}` to retain the native Home Assistant dialog. Existing explicit actions are preserved. Download the updated optional theme YAML for the new palette.

Validation: 55 unit/integration tests, strict TypeScript, production builds, release checksums, and Chromium checks of controls, modal focus, accessibility, Sections sizing, and five viewport widths. Actual Home Assistant hardware validation remains outstanding.

Install **Still Cards** through HACS → Custom repositories. Add `https://github.com/valentinpurrucker/ha-theme` and select **Dashboard**, then download Still Cards and refresh Home Assistant.

`still-cards.js` is the HACS installation asset. HACS manages the dashboard resource in storage mode. For YAML resource mode, add `/hacsfiles/ha-theme/still-cards.js` as a JavaScript module. Remove an old `/local/still-cards.js` resource if switching from a manual install.

The cards inherit your Home Assistant theme. The optional **Still** light/dark theme is attached as `still.yaml`; copy it into your `themes/` directory and reload themes. A Dashboard repository does not install theme YAML automatically.

The `.tar.gz` archive is for manual installation and includes the theme, example dashboard, documentation, licenses, and checksums.
