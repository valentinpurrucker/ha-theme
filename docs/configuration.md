# Card configuration

Use `custom:still-card` for automatic entity-domain selection or any of the focused types below. The same common configuration and editor apply to every type.

| Type | Entities | Controls |
| --- | --- | --- |
| `custom:still-entity-card` | Any entity, including sensor and binary_sensor | Readable state; switch/input_boolean/automation toggle; numeric sensor value |
| `custom:still-light-card` | light | Power, supported brightness, supported Kelvin color temperature |
| `custom:still-climate-card` | climate | Target ± step, actual temperature, advertised HVAC modes; native more-info for dual setpoints |
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
| `tap_action` | more-info | Header action; title has no tap action |
| `style` | theme values | Scoped style overrides described below |
| `chips` | Required for chips | List of chip objects |

Native Home Assistant formatters are used for entity names, states, and attribute values when supplied. Control labels currently use English. Names accept text overrides. Complex structured HA entity-name configurations are deferred. Numeric entity cards use a large value; non-numeric cards preserve the state text. Attribute values stay in the secondary line. Weather shows current conditions only and performs no forecast subscription.

## Actions

Header taps open native `hass-more-info` by default. Device control buttons call domain services directly. No hold or double-tap action is bound. The supported explicit `tap_action` values are `none`, `more-info`, `toggle`, `perform-action`, `call-service` (legacy alias), `navigate`, and `url`. `assist` and HA-specific confirmation exemptions are not implemented in v0.1.

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
| `--still-accent` | Accent and active controls | HA primary color, then sage |
| `--still-on-accent` | Text on solid accent controls | white |
| `--still-surface` | Card surface | HA card surface, then white |
| `--still-text` | Primary text | HA primary text |
| `--still-muted` | Secondary text | HA secondary text |
| `--still-subtle` | Control/icon background | Accent/surface mix |
| `--still-border-color` | Border color | Text at 10% opacity |
| `--still-border` | Full border declaration | 1px solid border color |
| `--still-radius` | Card corners | 22px |
| `--still-padding` | Comfortable card padding | 20px |
| `--still-compact-padding` | Compact card padding | 70% of comfortable padding |
| `--still-shadow` | Card shadow | none |
| `--still-font` | Font stack | HA font, then system UI |
| `--still-icon-size` | Icon container size | 44px |
| `--still-icon-radius` | Icon container corners | 15px |
| `--still-control-radius` | Button/input corners | 13px |
| `--still-chip-radius` | Chip corners | 30px |
| `--still-name-size` | Name text size | 14px |
| `--still-value-size` | Main numeric value | 36px; thermostat uses 32px |
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
