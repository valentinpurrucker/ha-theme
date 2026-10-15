import { css } from 'lit';

export const cardStyles = css`
  :host { display: block; height: 100%; min-width: 0; color: var(--still-text, var(--primary-text-color, #28332e)); font-family: var(--still-font, var(--ha-font-family-body, system-ui, sans-serif)); --_accent: var(--still-accent, var(--primary-color, #4c745d)); --_surface: var(--still-surface, var(--ha-card-background, var(--card-background-color, #fff))); --_muted: var(--still-muted, var(--secondary-text-color, #626d65)); --_subtle: var(--still-subtle, color-mix(in srgb, var(--_accent) 6%, var(--_surface))); --_line: var(--still-border-color, color-mix(in srgb, currentColor 10%, transparent)); }
  * { box-sizing: border-box; }
  ha-card { display: flex; flex-direction: column; height: 100%; gap: 16px; overflow: hidden; padding: var(--still-padding, 20px); background: var(--_surface); border: var(--still-border, 1px solid var(--_line)); border-radius: var(--still-radius, 22px); box-shadow: var(--still-shadow, none); transition: background 180ms ease, border-color 180ms ease; }
  ha-card[data-density='compact'] { padding: var(--still-compact-padding, calc(var(--still-padding, 20px) * .7)); gap: 12px; }
  ha-card[data-variant='soft'][data-active] { background: color-mix(in srgb, var(--_accent) 7%, var(--_surface)); border-color: color-mix(in srgb, var(--_accent) 16%, var(--_surface)); }
  ha-card[data-variant='minimal'] { border-color: transparent; box-shadow: none; background: transparent; }
  ha-card[data-unavailable] .body { opacity: .65; }
  button, input, select { font: inherit; color: inherit; }
  button { cursor: pointer; border: 0; -webkit-tap-highlight-color: transparent; }
  button:disabled, input:disabled, select:disabled { cursor: default; opacity: .45; }
  button:focus-visible, input:focus-visible, select:focus-visible { outline: 2px solid var(--_accent); outline-offset: 4px; }
  .header { display: flex; align-items: center; gap: 12px; min-width: 0; }
  .head-button { display: flex; align-items: center; gap: 12px; background: transparent; padding: 0; text-align: left; width: 100%; min-width: 0; border-radius: 12px; }
  .icon-wrap { display: grid; flex-shrink: 0; place-items: center; height: var(--still-icon-size, 44px); width: var(--still-icon-size, 44px); border-radius: var(--still-icon-radius, 15px); color: var(--_muted); background: var(--_subtle); }
  [data-active] .icon-wrap { color: var(--_accent); background: color-mix(in srgb, var(--_accent) 13%, var(--_surface)); }
  ha-icon { --mdc-icon-size: 22px; width: 22px; height: 22px; display: inline-flex; flex-shrink: 0; }
  .labels { min-width: 0; flex: 1; }
  .name { display: block; font-weight: 600; font-size: var(--still-name-size, 14px); line-height: 1.45; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .secondary { display: block; margin-top: 3px; font-size: 12px; color: var(--_muted); line-height: 1.5; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .body { display: flex; flex-direction: column; gap: 14px; }
  .body:empty { display: none; }
  .controls { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
  .control { display: inline-flex; align-items: center; justify-content: center; gap: 7px; min-height: 44px; min-width: 44px; padding: 10px 14px; background: var(--_subtle); border: 1px solid transparent; border-radius: var(--still-control-radius, 13px); font-size: 12px; font-weight: 550; transition: background 150ms; }
  .control:hover:enabled { background: color-mix(in srgb, var(--_accent) 14%, var(--_surface)); }
  .control.primary { background: var(--_accent); color: var(--still-on-accent, #fff); }
  .control.grow { flex: 1; }
  .control.icon-control { width: 44px; padding: 10px; flex-shrink: 0; }
  .toggle { width: 46px; min-width: 46px; height: 28px; min-height: 44px; position: relative; background: transparent; padding: 8px 0; }
  .toggle::before { content: ''; display: block; height: 28px; border-radius: 20px; background: color-mix(in srgb, currentColor 15%, var(--_surface)); }
  .toggle::after { content: ''; position: absolute; width: 20px; height: 20px; top: 12px; left: 4px; background: var(--_surface); border-radius: 50%; transition: transform 180ms ease; box-shadow: 0 1px 3px #0002; }
  .toggle[aria-checked='true']::before { background: var(--_accent); }
  .toggle[aria-checked='true']::after { transform: translateX(18px); }
  .range-label { display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: var(--_muted); }
  input[type='range'] { width: 100%; height: 32px; accent-color: var(--_accent); cursor: pointer; margin: 2px 0 -5px; background: transparent; }
  select { width: 100%; min-height: 44px; padding: 8px 12px; border: 1px solid var(--_line); border-radius: var(--still-control-radius, 13px); background: var(--_surface); font-size: 12px; }
  .value { font-size: var(--still-value-size, 36px); font-weight: 450; letter-spacing: -1.5px; line-height: 1.2; font-variant-numeric: tabular-nums; }
  .value small { font-size: 16px; color: var(--_muted); letter-spacing: 0; }
  .caption { font-size: 11px; color: var(--_muted); line-height: 1.5; }
  .thermostat { display: flex; align-items: center; justify-content: space-between; gap: 8px; text-align: center; }
  .thermostat > div { flex: 1; min-width: 0; }
  .thermostat .value { font-size: 32px; }
  .track { display: flex; gap: 14px; align-items: center; }
  .art { width: 58px; height: 58px; border-radius: 12px; object-fit: cover; background: var(--_subtle); }
  .track-title { font-size: 15px; font-weight: 600; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .weather { display: flex; align-items: flex-end; justify-content: space-between; }
  .weather-details { display: flex; flex-wrap: wrap; gap: 8px 16px; font-size: 11px; color: var(--_muted); }
  .chip-row { display: flex; gap: 8px; flex-wrap: wrap; }
  .chip { display: inline-flex; align-items: center; gap: 7px; background: var(--_surface); min-height: 44px; border: 1px solid var(--_line); border-radius: var(--still-chip-radius, 30px); padding: 8px 14px; font-size: 12px; }
  .chip ha-icon { --mdc-icon-size: 17px; width: 17px; height: 17px; color: var(--_accent); }
  .title { margin: 0; font-size: var(--still-title-size, 24px); font-weight: 500; letter-spacing: -.6px; line-height: 1.4; }
  .title-subtitle { margin: 5px 0 0; color: var(--_muted); font-size: 13px; line-height: 1.5; }
  ha-card[data-kind='title'], ha-card[data-kind='chips'] { padding: 0; border: 0; box-shadow: none; background: transparent; justify-content: center; }
  .error { color: var(--error-color, #b54545); font-size: 12px; line-height: 1.5; margin: 0; }
  .status { margin: 0; font-size: 11px; color: var(--_muted); }
  @media (prefers-reduced-motion: reduce) { *, *::before, *::after { transition: none !important; } }
`;
