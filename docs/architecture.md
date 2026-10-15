# Architecture and extension points

`src/index.ts` registers ten definitions, a shared `still-card` element, ten focused aliases, the editor, and card-picker metadata. The production bundle is a single ES module with Lit included. It exports the registry, shared card/editor classes, shared styles, and TypeScript source types.

`hacs.json` selects the built JavaScript asset from GitHub releases. The source branch does not contain build output. Optional tag-triggered automation is supplied in `automation/workflows/`; it must be activated before it can check and publish releases. Direct release publication supports the same HACS installation path. See [releasing.md](releasing.md) for distribution details.

`StillCard` owns the contract with Home Assistant: `setConfig`, `hass`, `getCardSize`, `getGridOptions`, error/pending state, accessible header, and token overrides. It requests the current `states`, `hassApi`, `hassConfig`, `hassFormatters`, and `hassInternationalization` contexts through `context-request` events, while retaining the legacy `hass` property. Subscriptions are cleaned up on disconnect. Entity identity comparisons avoid rerendering for unrelated state changes. The shared shell validates configuration before accepting it.

`src/core` provides configuration, entity helpers, action routing, public types, styling, and the definition registry. `src/cards` contains focused domain renderers and reusable buttons/sliders. Renderers are plain functions returning Lit templates; they do not subscribe to Home Assistant or mutate entity data. `src/editor.ts` emits composed `config-changed` events and preserves options it is not editing.

The card never reaches into Home Assistant's shadow roots or needs card-mod. In production, Home Assistant supplies `ha-card` and `ha-icon`. In `demo/`, a small `ha-icon` stand-in and simulated `hass` replace those host dependencies. The demo's dashboard, gallery, and editor use the same production card implementations.

## Add a source card

1. Add a renderer under `src/cards` using `CardDefinition` and `RenderContext`.
2. Add it to the definitions array in `src/index.ts`. The focused alias, picker entry, suggestion filter, and editor option will be generated from its metadata.
3. Choose `domains`, `requiresEntity`, and conservative Sections `rows` so every supported control fits. Add meaningful capability and service tests, then verify the card in the demo and real Home Assistant.

```ts
import { html } from 'lit';
import type { CardDefinition } from '../core/types';

export const plantDefinition: CardDefinition = {
  kind: 'plant',
  name: 'Plant',
  description: 'A small check-in for your plants.',
  icon: 'mdi:sprout',
  domains: ['plant'],
  rows: 3,
  render: ({ entity }) => html`
    <div class="caption">${entity?.attributes.moisture ?? '—'}% moisture</div>
  `,
};
```

The common shell renders the header. `RenderContext` exposes the validated config, entity, effective hass, pending/disabled flags, `icon()`, `call(ServiceCommand)`, and `act(CardAction)`. Use the common control styles (`control`, `caption`, `value`, `controls`, `range-label`) and `src/cards/ui.ts` helpers to keep extensions consistent. Gate commands against the actual entity's capabilities.

## Add a separate extension module

The bundled registry is also exported. Import the same resource URL that Home Assistant loads, then register a definition. Use `custom:still-card` with a `kind` for external extensions; aliases and picker entries are generated only at the library's initial registration.

```js
import { registerCardDefinition } from '/local/still-cards.js?v=0.1.0';

registerCardDefinition({
  kind: 'water-check',
  name: 'Water check',
  description: 'A custom local status card.',
  icon: 'mdi:water-outline',
  domains: ['sensor'],
  rows: 2,
  render: ({ icon }) => icon('mdi:water-outline'),
});
```

```yaml
type: custom:still-card
kind: water-check
entity: sensor.water_status
```

Duplicate kinds are rejected. The external file must finish registering before a config referencing its kind is applied. For predictable resource ordering, load the extension module as your single resource and let its import load Still, or build the extension into the main bundle. Match resource query strings exactly so the browser shares one module instance. A more elaborate extension can bundle its own Lit dependency; templates interoperate through Lit's template result contract.

## Styling and layout

Namespaced tokens form the stable styling API. They cascade from HA theme → card host overrides → shadow DOM primitives. Surface/text fallbacks allow a card to work under another HA theme. No global production stylesheet is injected. Changes to the visual system belong in `src/core/styles.ts` and `themes/still.yaml`, not repeated in renderers.

Sections uses conservative sizes to avoid clipping controls. Climate defaults to 12 columns, minimum 9; other device cards default to 6, minimum 6. Title/chips default to 12. Chips omit fixed rows to support wrapping. Custom card styles with unusually large padding/fonts may need additional grid space. Masonry uses the definition's row estimate as `getCardSize`.

## Checks

Unit/integration tests cover configuration failures, service targets and confirmations, context lifecycle, relevant-state rerendering, localized formatting, unavailable entities, capability gating, temperature bounds, direct controls, editor event preservation, and extension registration. Browser checks exercise the rendered dashboard, controls/editor/theme changes, WCAG A/AA checks, and responsive widths. A real HA installation remains necessary for host dialogs, resource loading, Sections integration, and device-specific behavior.
