import { css } from 'lit';

export const cardStyles = css`
  :host { display: block; height: 100%; min-width: 0; color: var(--still-text, var(--primary-text-color, #1c1c1e)); font-family: var(--still-font, var(--ha-font-family-body, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif)); --_accent: var(--still-accent, var(--primary-color, #0066d6)); --_surface: var(--still-surface, var(--ha-card-background, var(--card-background-color, #fff))); --_muted: var(--still-muted, var(--secondary-text-color, #63636c)); --_subtle: var(--still-subtle, color-mix(in srgb, currentColor 4%, var(--_surface))); --_line: var(--still-border-color, color-mix(in srgb, currentColor 10%, transparent)); }
  * { box-sizing: border-box; }
  ha-card { display: flex; flex-direction: column; height: 100%; gap: 16px; overflow: hidden; padding: var(--still-padding, 20px); background: var(--_surface); border: var(--still-border, 1px solid var(--_line)); border-radius: var(--still-radius, 24px); box-shadow: var(--still-shadow, 0 2px 10px #00000003); transition: background 180ms ease, border-color 180ms ease; }
  ha-card[data-density='compact'] { padding: var(--still-compact-padding, calc(var(--still-padding, 20px) * .7)); gap: 12px; }
  ha-card[data-variant='soft'] { border-color: transparent; }
  ha-card[data-variant='outlined'] { box-shadow: none; }
  ha-card[data-variant='minimal'] { border-color: transparent; box-shadow: none; background: transparent; }
  ha-card[data-unavailable] .body { opacity: .65; }
  button, input, select { font: inherit; color: inherit; }
  button { cursor: pointer; border: 0; -webkit-tap-highlight-color: transparent; }
  button:disabled, input:disabled, select:disabled { cursor: default; opacity: .45; }
  button:focus-visible, input:focus-visible, select:focus-visible { outline: 2px solid var(--_accent); outline-offset: 4px; }
  .header { display: flex; align-items: center; gap: 12px; min-width: 0; }
  .head-button { display: flex; align-items: center; gap: 12px; background: transparent; padding: 0; text-align: left; width: 100%; min-width: 0; border-radius: 12px; }
  .icon-wrap { display: grid; flex-shrink: 0; place-items: center; height: var(--still-icon-size, 44px); width: var(--still-icon-size, 44px); border-radius: var(--still-icon-radius, 14px); color: var(--_muted); background: var(--_subtle); }
  [data-active] .icon-wrap { color: var(--_accent); background: color-mix(in srgb, var(--_accent) 13%, var(--_surface)); }
  ha-icon { --mdc-icon-size: 22px; width: 22px; height: 22px; display: inline-flex; flex-shrink: 0; }
  .labels { min-width: 0; flex: 1; }
  .name { display: block; font-weight: 600; font-size: var(--still-name-size, 14px); line-height: 1.45; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .secondary { display: block; margin-top: 3px; font-size: 12px; color: var(--_muted); line-height: 1.5; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .body { display: flex; flex-direction: column; gap: 12px; }
  .body:empty { display: none; }
  .controls { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
  .control { display: inline-flex; align-items: center; justify-content: center; gap: 7px; min-height: 44px; min-width: 44px; padding: 10px 14px; background: var(--_subtle); border: 1px solid transparent; border-radius: var(--still-control-radius, 13px); font-size: 12px; font-weight: 550; transition: background 150ms; }
  .control:hover:enabled { background: color-mix(in srgb, var(--_accent) 14%, var(--_surface)); }
  .control.primary { background: var(--_accent); color: var(--still-on-accent, #fff); }
  .control.grow { flex: 1; }
  .control.icon-control { width: 44px; padding: 10px; flex-shrink: 0; }
  .toggle { width: 46px; min-width: 46px; height: 28px; min-height: 44px; position: relative; background: transparent; padding: 8px 0; }
  .toggle::before { content: ''; display: block; height: 28px; border-radius: 20px; background: color-mix(in srgb, currentColor 15%, var(--_surface)); }
  .toggle::after { content: ''; position: absolute; width: 20px; height: 20px; top: 12px; left: 4px; background: #fff; border-radius: 50%; transition: transform 180ms ease; box-shadow: 0 1px 3px #0002; }
  .toggle[aria-checked='true']::before { background: var(--still-toggle-color, #248b45); }
  .toggle[aria-checked='true']::after { transform: translateX(18px); }
  .range-label { display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: var(--_muted); }
  input[type='range'] { width: 100%; height: 32px; accent-color: var(--_accent); cursor: pointer; margin: 2px 0 -5px; background: transparent; }
  select { width: 100%; min-height: 44px; padding: 8px 12px; border: 1px solid var(--_line); border-radius: var(--still-control-radius, 13px); background: var(--_surface); font-size: 12px; }
  .value { font-size: var(--still-value-size, 36px); font-weight: 550; letter-spacing: -1.5px; line-height: 1.2; font-variant-numeric: tabular-nums; }
  .value small { font-size: 16px; color: var(--_muted); letter-spacing: 0; }
  .caption { font-size: 12px; color: var(--_muted); line-height: 1.5; }
  .thermostat { display: flex; align-items: center; justify-content: space-between; gap: 8px; text-align: center; }

  .thermostat .value { font-size: 32px; }
  .track { display: flex; gap: 14px; align-items: center; }
  .art { width: 58px; height: 58px; border-radius: 12px; object-fit: cover; background: var(--_subtle); }
  .track-title { font-size: 15px; font-weight: 600; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .weather { display: flex; align-items: flex-end; justify-content: space-between; }
  .weather-details { display: grid; grid-template-columns: 1fr 1fr; gap: 18px 10px; font-size: 11px; color: var(--_muted); padding-top: 14px; border-top: 1px solid var(--_line); }
  .weather-details > span { display: flex; align-items: center; gap: 7px; }
  .weather-details ha-icon { width: 18px; height: 18px; --mdc-icon-size: 18px; }
  .weather-details strong { display: block; color: inherit; font-size: 12px; font-weight: 600; margin-top: 3px; }
  .weather-symbol { color: var(--still-weather-color, var(--_accent)); }
  .weather-symbol ha-icon { --mdc-icon-size: 58px; width: 58px; height: 58px; }
  .weather .value { font-size: 44px; margin-bottom: 5px; }
  .chip-row { display: flex; gap: 8px; flex-wrap: wrap; }
  .chip { display: inline-flex; align-items: center; gap: 7px; background: var(--_surface); min-height: 44px; border: 1px solid var(--_line); border-radius: var(--still-chip-radius, 30px); padding: 8px 14px; font-size: 12px; }
  .chip ha-icon { --mdc-icon-size: 17px; width: 17px; height: 17px; color: var(--_accent); }
  .title { margin: 0; font-size: var(--still-title-size, 24px); font-weight: 500; letter-spacing: -.6px; line-height: 1.4; }
  .title-subtitle { margin: 5px 0 0; color: var(--_muted); font-size: 13px; line-height: 1.5; }
  ha-card[data-kind='title'], ha-card[data-kind='chips'] { padding: 0; border: 0; box-shadow: none; background: transparent; justify-content: center; }
  .error { color: var(--error-color, #b54545); font-size: 12px; line-height: 1.5; margin: 0; }
  .status { margin: 0; font-size: 12px; color: var(--_muted); }
  .detail-indicator { color: var(--_muted); opacity: .6; display: flex; }
  .detail-indicator ha-icon { width: 14px; height: 14px; --mdc-icon-size: 14px; }
  ha-card[data-kind='light'][data-active] .icon-wrap { color: var(--still-light-color, #a76500); background: color-mix(in srgb, var(--still-light-color, #a76500) 11%, var(--_surface)); }
  .round { border-radius: 50%; }
  .temperature-dial { flex: 0 1 var(--still-climate-dial-size, 122px); aspect-ratio: 1; min-width: 106px; padding: 5px; border-radius: 50%; background: conic-gradient(from 225deg, var(--_accent) 0 var(--dial-progress), var(--_subtle) var(--dial-progress) 75%, transparent 75% 100%); }
  .dial-center { background: var(--_surface); width: 100%; height: 100%; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1px; }
  .dial-center .caption, .dial-status { font-size: 10px; }
  .dial-status { color: var(--_accent); font-weight: 600; }
  .thermostat .value { font-size: 30px; letter-spacing: -1px; white-space: nowrap; }
  .thermostat .value small { font-size: 12px; margin-left: 2px; }
  .temperature-dial[data-range] .value { font-size: 22px; }
  .temperature-current { text-align: center; margin-top: -9px; }
  .preset-row { display: flex; gap: 5px; overflow-x: auto; min-width: 0; padding: 3px; border-radius: 14px; background: var(--_subtle); scrollbar-width: thin; }
  .preset { flex: 1 0 auto; min-height: 38px; padding: 8px 12px; border-radius: 11px; color: var(--_muted); background: transparent; font-size: 12px; font-weight: 600; }
  .preset[aria-pressed='true'] { color: var(--_accent); background: var(--_surface); box-shadow: 0 1px 4px #0000000d; }
  .mode-field { display: flex; align-items: center; justify-content: space-between; gap: 12px; font-size: 12px; color: var(--_muted); }
  .mode-field select { width: auto; min-width: 110px; border: 0; background: var(--_subtle); color: var(--_accent); font-weight: 600; }
  .solar-generation { display: flex; gap: 10px; align-items: center; justify-content: space-between; }
  .solar-generation .value { font-size: 30px; margin-top: 4px; }
  .energy-status { font-size: 10px; display: flex; align-items: center; gap: 5px; color: var(--_muted); }
  .energy-status i { width: 5px; height: 5px; border-radius: 50%; background: currentColor; }
  .energy-status[data-generating] { color: var(--still-solar-color, #147a53); }
  .energy-flow { display: flex; position: relative; justify-content: space-around; gap: 8px; padding-top: 12px; }
  .energy-flow::before { content: ''; position: absolute; left: 16%; right: 16%; top: 32px; height: 1px; background: var(--_line); }
  .energy-node { display: flex; flex: 1; min-width: 0; align-items: center; flex-direction: column; gap: 5px; font-size: 11px; color: var(--_muted); position: relative; text-align: center; }
  .energy-icon { display: grid; place-items: center; width: 40px; height: 40px; border-radius: 14px; background: var(--_subtle); border: 4px solid var(--_surface); box-sizing: content-box; color: var(--still-solar-color, #147a53); }
  .energy-node strong { font-size: 14px; font-weight: 600; color: var(--still-text, var(--primary-text-color, #1c1c1e)); white-space: nowrap; }
  .energy-node small { font-size: 10px; }
  .energy-today { display: flex; justify-content: space-between; align-items: center; gap: 10px; border-top: 1px solid var(--_line); padding-top: 12px; font-size: 11px; color: var(--_muted); }
  .energy-today > span { display: flex; align-items: center; gap: 6px; }
  .energy-today ha-icon { width: 16px; height: 16px; --mdc-icon-size: 16px; }
  .energy-today strong { font-weight: 600; }
  .detail-sheet { color: inherit; font: inherit; background: var(--_surface); border: 1px solid var(--_line); border-radius: var(--still-dialog-radius, 30px); padding: 26px; width: min(430px, calc(100vw - 32px)); max-height: min(820px, calc(100dvh - 40px)); overflow: auto; overscroll-behavior: contain; box-shadow: 0 24px 100px #0003; }
  .detail-sheet::backdrop { background: #15152055; backdrop-filter: blur(8px); }
  .sheet-handle { display: none; }
  .sheet-top { display: flex; justify-content: space-between; align-items: center; }
  .detail-sheet h2 { font-size: 26px; font-weight: 650; letter-spacing: -.7px; margin: 22px 0 6px; line-height: 1.2; overflow-wrap: anywhere; }
  .sheet-subtitle { color: var(--_muted); font-size: 13px; margin: 0 0 25px; }
  .sheet-body { gap: 20px; }
  .detail-sheet .temperature-dial { flex-basis: 190px; }
  .detail-sheet .thermostat .value { font-size: 40px; }
  .detail-sheet .temperature-current { margin-top: -17px; }
  .detail-sheet .dial-center .caption, .detail-sheet .dial-status { font-size: 12px; }
  .detail-sheet .preset { min-height: 44px; }
  .native-details { width: 100%; background: transparent; color: var(--_accent); display: flex; gap: 8px; justify-content: center; align-items: center; border-top: 1px solid var(--_line); margin-top: 26px; padding: 20px 0 0; min-height: 44px; font-size: 12px; }
  .native-details ha-icon { width: 16px; height: 16px; --mdc-icon-size: 16px; }
  .detail-sheet .error, .detail-sheet .status { margin-top: 16px; }
  @media (max-width: 600px) {
    .detail-sheet { margin: auto 8px 8px; width: calc(100vw - 16px); max-width: none; max-height: calc(100dvh - 24px); padding: 12px 24px 24px; border-radius: 28px; padding-bottom: max(24px, env(safe-area-inset-bottom)); }
    .sheet-handle { display: block; width: 34px; height: 5px; border-radius: 5px; background: var(--_line); margin: 0 auto 18px; }
    .detail-sheet .temperature-dial { flex-basis: min(190px, calc(100vw - 180px)); }
  }
  @media (prefers-reduced-motion: reduce) { *, *::before, *::after { transition: none !important; } }
`;
