# Validation record

Verified locally for v0.2.0 on 2026-10-15, using Bun 1.4.2, TypeScript 7, Vitest 5, and Chromium 154. The research references were checked against the current Home Assistant documentation and source. There was no real Home Assistant instance or hardware available in this workspace.

## Completed checks

- TypeScript strict checking, including unused code checks.
- 55 unit/integration tests covering configuration and example YAML, action targets and confirmation, context consumption/cleanup, relevant-state rendering, localized formatting, safe header taps, unavailable entities, request serialization, service errors, capability gating, temperature limits/units, exact climate preset service payloads, modal lifecycle, compact light controls, solar W/kW and Wh/kWh separation, grid sign configuration, zero battery, related sensor updates, invalid/missing readings, scene/script/button services, editor events and initial selection, style cleanup, extension registration, and HACS release metadata/tag/asset requirements.
- Production library and static demo builds. The production card module is approximately 82 kB uncompressed / 24 kB gzip, including Lit and complete license notices for the single-file HACS download. No runtime CDN or custom-card dependencies.
- Chromium checks for power/brightness, thermostat adjustment and presets, detail-sheet state persistence, focus trapping and return, Escape/backdrop dismissal, mobile sheet sizing, compact-light expanded controls, media playback, cover position, scenes, unavailable/reconnected entities, card editing, room filters, gallery/setup navigation, and light/dark styling.
- All twelve card kinds fit their conservative minimum Sections widths and fixed heights in a browser layout simulation. The report includes horizontal/vertical overflow measurements.
- No page or card horizontal overflow at 1920, 1024, 768, 390, or 320 CSS pixels.
- No automated axe WCAG 2 A/AA / 2.1 AA violations in the tested overview in light and dark modes and the climate detail sheet. This is an automated check of the demonstrated configurations, not a blanket accessibility certification of arbitrary custom themes.
- No uncaught browser errors during the smoke checks.
- The built module was also loaded as the only card resource in a fresh browser document: all twelve kinds and thirteen picker entries registered, and a light toggle used the expected `light.toggle` service payload.
- The self-contained six-card preview passed light/dark automated contrast checks, interactive power/finish controls, and 728px/360px layout checks.

Machine-readable browser evidence is in [browser-results.json](browser-results.json). Screenshots are in [screenshots](screenshots/): desktop light, desktop dark, collection, and mobile. The browser checks are reproducible with `bun run test:browser` against a running demo server. The optional CI template in `automation/workflows/` checks the built static demo and stores artifacts when activated; it is currently inactive because the connected GitHub credential lacks permission to upload Actions workflows. Remote CI and the official GitHub-backed HACS validator have not been run here.

The T3 shared browser could not start because the host lacked required libraries and its setup command required a sudo password. Verification used Playwright with the installed Chrome headless binary and dependencies/fonts extracted into temporary directories, without changing the system installation. Normal hosts can install Chromium and its dependencies through the documented Playwright command.

## Before using in a real home

1. Load the module and theme on your Home Assistant instance and confirm the picker/editor appear. Check both Sections and masonry with your device names, settings, and companion theme.
2. Confirm `hass-more-info` and navigation actions are handled by the actual frontend. Verify legacy `hass` assignment and current context subscriptions on your installed version.
3. Try each device domain you own. Integration feature flags, color mode support, Kelvin bounds, thermostat steps, fan power flags, and optional media metadata vary by integration.
4. Test rejected commands and reconnection with actual permissions/devices. The cards show pending/error states, but a successful service call does not guarantee a physical device has completed the action; displayed state follows Home Assistant updates.
5. Test touch, keyboard, screen reader, and the contrast of your own theme. Avoid making tokens such as padding, icon size, or font size so large that they outgrow the allocated grid cells.

Local HACS checks verify the exact raw release asset, checksums, notices, and version-tag agreement. Validation through a live HACS installation and HACS's GitHub-backed official validator still requires an actual HACS/Home Assistant instance and GitHub-backed validation runner. No real device actions or Home Assistant configuration changes were performed.
