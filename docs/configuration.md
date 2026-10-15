# Card configuration

Use `custom:still-card` for automatic entity-domain selection or any of the focused types below. The same common configuration and editor apply to every type.

| Type | Entities | Controls |
| --- | --- | --- |
| `custom:still-entity-card` | Any entity, including sensor and binary_sensor | Readable state; switch/input_boolean/automation toggle; numeric sensor value |
| `custom:still-light-card` | light | Power, supported brightness, supported Kelvin color temperature |
| `custom:still-toggle-card` | switch, input_boolean, automation, light | Native-style power switch |
| `custom:still-climate-card` | climate | Target ± step, actual temperature, supported presets and HVAC modes; native more-info for dual setpoints |
| `custom:still-solar-card` | sensor | Live W/kW generation with optional home, grid, battery, and daily energy |
| `custom:still-media-card` | media_player | Metadata/artwork; supported play/pause, previous/next, volume |
| `custom:still-cover-card` | cover | Supported open/stop/close and position |
| `custom:still-fan-card` | fan | Supported power, percentage, and oscillation |
| `custom:still-scene-card` | scene, script, button, input_button | Explicit activate/run button |
| `custom:still-weather-card` | weather | Current condition, temperature, humidity, and wind |
| `custom:still-chips-card` | List of chips | Status pills and configurable shortcuts |
| `custom:still-title-card` | No entity required | Heading and subtitle |

An optional `kind` overrides auto selection, including registered extensions. Focused cards validate entity domains; a wrong domain throws a clear configuration error. Entities that disappear or become unknown/unavailable show status and hide device controls. HA state updates remain the source of truth after a command. Commands are serialized per card; failures appear inline.

## Shared options

| Field | Default | Meaning |
| --- | --- | --- |
| `entity` | Required except title/chips | Entity ID |
| `name` | HA formatted/friendly name | Text override; title text for title cards |
| `icon` | Entity icon/device class/kind default | `mdi:` icon |
| `subtitle` | State or card-specific hint | Secondary text |
| `show_state` | true | Show the secondary line; scene timestamps are hidden unless explicitly true |
| `show_controls` | true | Hide direct device controls when false |
| `variant` | soft | `soft`, `outlined`, or `minimal` |
| `density` | comfortable | `comfortable` or `compact` |
| `attribute` | unset | Render this attribute instead of state on entity cards |
| `unit` | HA unit | Override the state/attribute unit text |
| `tap_action` | details | Header action; title has no tap action |
| `layout` | panel | Light: `panel` for inline controls, `tile` for a compact switch and full controls in details |
| `show_presets` | true | Climate: show presets when the entity supports them |
| `solar` | unset | Optional related sensor mappings for solar cards |
| `style` | theme values | Scoped style overrides described below |
| `chips` | Required for chips | List of chip objects |

Native Home Assistant formatters are used for entity names, states, and attribute values when supplied. Control labels currently use English. Names accept text overrides. Complex structured HA entity-name configurations are deferred. Numeric entity cards use a large value; non-numeric cards preserve the state text. Attribute values stay in the secondary line. Weather shows current conditions only and performs no forecast subscription.

## Actions

Header taps open a Still detail sheet by default (`action: details`). It uses the same renderer and service actions as the card, with expanded light and weather controls. Escape, the close button, and the backdrop close it and return keyboard focus. The sheet also provides an “Open in Home Assistant” button. Set `action: more-info` to use native `hass-more-info` directly. Device control buttons call domain services directly. No hold or double-tap action is bound. The supported explicit `tap_action` values are `none`, `details`, `more-info`, `toggle`, `perform-action`, `call-service` (legacy alias), `navigate`, and `url`. `assist` and HA-specific confirmation exemptions are not implemented in v0.2.

```yaml
type: custom:still-scene-card
entity: scene.slow_evening
name: Slow evening
tap_action:
  action: perform-action
  perform_action: scene.turn_on
  target:
    entity_id: scene.slow_evening
  data:
    transition: 3
```

For scenes/actions, configuring `tap_action` also applies it to the explicit action button. Without it, that button calls `scene.turn_on`, `script.turn_on`, or `button.press`/`input_button.press` as appropriate. Scenes do not use toggle styling.

`toggle` supports light, switch, fan, input_boolean, and automation. Other entity domains are rejected; covers and locks are never implicitly toggled. `perform-action` accepts `perform_action: domain.service`, optional `target` (`entity_id`, `area_id`, `device_id`), and `data`. If neither a target nor a data entity is supplied, the card entity is added. Explicit targets take precedence. Legacy `call-service` accepts `service` and `service_data`.

Use `confirmation: true` or `confirmation: {text: "Run this scene?"}` for a native browser confirmation on a configured tap action. Direct power/slider/transport buttons are not affected by header confirmation. `navigate` requires a local `navigation_path` beginning with `/`, emits `location-changed`, and uses browser history. `url` requires an absolute HTTP/HTTPS `url_path` and opens a tab with `noopener,noreferrer`.

## Climate presets, light tiles, and solar

```yaml
type: custom:still-climate-card
entity: climate.living_room
show_presets: true
```

Presets come from `preset_modes` when the entity advertises `ClimateEntityFeature.PRESET_MODE` (16). The active `preset_mode` is selected, and buttons send its exact string to `climate.set_preset_mode`. Nothing is invented for thermostats without presets. Mode lists scroll horizontally when needed. The temperature dial represents the configured target within the entity’s bounds; it is a display, with ± buttons for adjustment.

```yaml
type: custom:still-light-card
entity: light.bedroom
layout: tile
```

The tile keeps its power switch on the dashboard. Tap its header for supported brightness and Kelvin controls. `show_controls: false` hides controls in both views.

```yaml
type: custom:still-solar-card
entity: sensor.solar_power   # Production: W or kW
name: Solar & energy
solar:
  home_power: sensor.home_power        # W or kW
  grid_power: sensor.grid_power        # W or kW; positive import, negative export
  battery_level: sensor.battery_level  # % from 0 to 100
  battery_power: sensor.battery_power  # W or kW; magnitude displayed
  energy_today: sensor.solar_today     # Today's generated Wh or kWh
  grid_export_positive: false
```

Only production is required. Unconfigured nodes are omitted; unavailable, invalid, or unsupported readings show a dash. Power is normalized from W/kW; daily energy is normalized from Wh/kWh. Map an actual daily-generation sensor to `energy_today`, since the card does not reset a lifetime counter or query history. Set `grid_export_positive: true` if your grid sensor uses positive numbers for export. Home and production values should be nonnegative. Battery power displays magnitude, without assuming its charging sign convention. The connecting line groups live readings; it does not calculate unmeasured flows or imply a historical chart.

Source contracts: [HA climate entities](https://developers.home-assistant.io/docs/core/entity/climate/), [climate actions](https://www.home-assistant.io/integrations/climate/), and [energy management](https://www.home-assistant.io/docs/energy/).

## Chips and headings

```yaml
type: custom:still-chips-card
chips:
  - entity: person.alex
    name: Alex
    icon: mdi:home-outline
  - entity: sensor.indoor_temperature
    icon: mdi:thermometer
  - content: Lights
    icon: mdi:lightbulb-outline
    tap_action:
      action: navigate
      navigation_path: /lovelace/lights
```

Each chip accepts `entity`, `name`, `icon`, `content`, and `tap_action`. `content` overrides the visible label. Otherwise the chip joins its name and formatted state. Entity chips default to more-info, including unavailable entities; content-only chips default to no action. Chips wrap naturally and let Sections measure their height.

```yaml
type: custom:still-title-card
name: The little things
subtitle: A little space to breathe.
```

## Style tokens

These are public CSS custom properties. Omit the leading `--` in HA theme YAML.

| Token | Purpose | Default/fallback |
| --- | --- | --- |
| `--still-accent` | Accent and active controls | HA primary color, then blue |
| `--still-on-accent` | Text on solid accent controls | white |
| `--still-surface` | Card surface | HA card surface, then white |
| `--still-text` | Primary text | HA primary text |
| `--still-muted` | Secondary text | HA secondary text |
| `--still-subtle` | Control/icon background | Text/surface mix |
| `--still-border-color` | Border color | Text at 10% opacity |
| `--still-border` | Full border declaration | 1px solid border color |
| `--still-radius` | Card corners | 24px |
| `--still-padding` | Comfortable card padding | 20px |
| `--still-compact-padding` | Compact card padding | 70% of comfortable padding |
| `--still-shadow` | Card shadow | Subtle shadow |
| `--still-font` | Font stack | HA font, then system UI |
| `--still-icon-size` | Icon container size | 44px |
| `--still-icon-radius` | Icon container corners | 14px |
| `--still-control-radius` | Button/input corners | 13px |
| `--still-chip-radius` | Chip corners | 30px |
| `--still-name-size` | Name text size | 14px |
| `--still-value-size` | Main numeric value | 36px; domain values adapt |
| `--still-dialog-radius` | Detail sheet corners | 30px |
| `--still-toggle-color` | Enabled switch track | #248b45 |
| `--still-light-color` | Active light icon | #a76500 |
| `--still-solar-color` | Solar indicators | #147a53 |
| `--still-weather-color` | Weather illustration | Accent |
| `--still-climate-dial-size` | Card thermostat dial | 122px; expands in details |
| `--still-title-size` | Heading size | 24px |

```yaml
type: custom:still-light-card
entity: light.bedroom
variant: outlined
style:
  accent: "#996956"
  radius: "14px"
  padding: "16px"
  background: "var(--card-background-color)"
  border: "1px solid var(--divider-color)"
  shadow: "none"
  icon_size: "40px"
```

The `style` object maps these seven fields to CSS tokens on the card host. It never inserts stylesheet text or arbitrary HTML. Existing overrides are removed when the config changes, so the theme can take over again. The three finishes keep the same controls and layout. Title/chips use transparent wrappers regardless of finish.

The compact density uses 70% of `still-padding` by default (14px when the comfortable value is 20px). Set `still-compact-padding` in the theme to control that independently. Per-card `style.padding` sets the comfortable padding; selecting compact makes it proportionately tighter.

Theme exports from the demo include accent, corners, padding, and light/dark semantic colors. Card finish remains the card's `variant` setting. Custom styles and editor changes in the demo affect simulated cards; copy their YAML to use them in Home Assistant.
