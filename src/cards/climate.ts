import { html, nothing } from 'lit';
import type { CardDefinition } from '../core/types';
import { clamp, humanize, nextTemperature, numberAttribute, supports, temperatureUnit } from '../core/entity';
import { command } from './ui';

export const climateDefinition: CardDefinition = {
  kind: 'climate', name: 'Climate', description: 'Temperature, modes, and your thermostat’s presets.', icon: 'mdi:thermostat', domains: ['climate'], rows: 6,
  render(context) {
    const { entity, config, hass } = context;
    const unit = temperatureUnit(entity, hass);
    const current = numberAttribute(entity, 'current_temperature');
    const target = numberAttribute(entity, 'temperature');
    const dual = entity?.state === 'heat_cool' || (target === undefined && supports(entity, 2));
    const editable = supports(entity, 1) && !dual && target !== undefined && config.show_controls !== false;
    const low = numberAttribute(entity, 'target_temp_low');
    const high = numberAttribute(entity, 'target_temp_high');
    const min = numberAttribute(entity, 'min_temp') ?? (unit === '°F' ? 45 : 7);
    const max = numberAttribute(entity, 'max_temp') ?? (unit === '°F' ? 95 : 35);
    const progress = target === undefined || max <= min ? 0 : clamp((target - min) / (max - min) * 75, 0, 75);
    const adjust = (direction: number) => {
      if (!entity) return;
      const temperature = nextTemperature(entity, direction, unit);
      if (temperature !== undefined) void context.call(command(context, 'climate', 'set_temperature', { temperature }));
    };
    const modes = entity?.attributes.hvac_modes;
    const presets = supports(entity, 16) && Array.isArray(entity?.attributes.preset_modes) ? entity.attributes.preset_modes.filter((mode): mode is string => typeof mode === 'string' && mode.length > 0) : [];
    return html`<div class="thermostat">
      ${editable ? html`<button class="control icon-control round" aria-label="Decrease target temperature" ?disabled=${context.disabled || (entity && nextTemperature(entity, -1, unit) === target)} @click=${() => adjust(-1)}>${context.icon('mdi:minus')}</button>` : nothing}
      <div class="temperature-dial" ?data-range=${dual} style=${`--dial-progress:${progress}%`}><div class="dial-center"><span class="caption">${dual ? 'Target range' : 'Set to'}</span><div class="value">${dual ? `${low ?? '—'}–${high ?? '—'}` : target ?? '—'}<small>${unit}</small></div><span class="dial-status">${humanize(String(entity?.attributes.hvac_action ?? entity?.state ?? ''))}</span></div></div>
      ${editable ? html`<button class="control icon-control round" aria-label="Increase target temperature" ?disabled=${context.disabled || (entity && nextTemperature(entity, 1, unit) === target)} @click=${() => adjust(1)}>${context.icon('mdi:plus')}</button>` : nothing}
    </div><div class="caption temperature-current">${current === undefined ? 'Current temperature unavailable' : `Currently ${current} ${unit}`}</div>
    ${config.show_controls !== false && config.show_presets !== false && presets.length ? html`<div class="preset-row" role="group" aria-label="Climate presets">${presets.map((preset) => html`<button class="preset" aria-pressed=${entity?.attributes.preset_mode === preset} ?disabled=${context.disabled} @click=${() => context.call(command(context, 'climate', 'set_preset_mode', { preset_mode: preset }))}>${humanize(preset)}</button>`)}</div>` : nothing}
    ${config.show_controls !== false && Array.isArray(modes) && modes.length ? html`<label class="mode-field"><span>Mode</span><select aria-label="HVAC mode" .value=${entity?.state ?? ''} ?disabled=${context.disabled} @change=${(event: Event) => context.call(command(context, 'climate', 'set_hvac_mode', { hvac_mode: (event.target as HTMLSelectElement).value }))}>${modes.map((mode) => html`<option value=${String(mode)} ?selected=${String(mode) === entity?.state}>${humanize(String(mode))}</option>`)}</select></label>` : nothing}
    ${dual && config.show_controls !== false ? html`<button class="control" ?disabled=${context.pending} @click=${() => context.act({ action: 'more-info' })}>Edit temperature range ${context.icon('mdi:arrow-top-right')}</button>` : nothing}`;
  },
};
