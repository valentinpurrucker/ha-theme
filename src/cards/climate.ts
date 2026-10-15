import { html, nothing } from 'lit';
import type { CardDefinition } from '../core/types';
import { humanize, nextTemperature, numberAttribute, supports, temperatureUnit } from '../core/entity';
import { command } from './ui';

export const climateDefinition: CardDefinition = {
  kind: 'climate', name: 'Climate', description: 'A calm thermostat with capability-aware controls.', icon: 'mdi:thermostat', domains: ['climate'], rows: 5,
  render(context) {
    const { entity, config, hass } = context;
    const unit = temperatureUnit(entity, hass);
    const current = numberAttribute(entity, 'current_temperature');
    const target = numberAttribute(entity, 'temperature');
    const dual = entity?.state === 'heat_cool' || (target === undefined && supports(entity, 2));
    const editable = supports(entity, 1) && !dual && target !== undefined && config.show_controls !== false;
    const low = numberAttribute(entity, 'target_temp_low');
    const high = numberAttribute(entity, 'target_temp_high');
    const adjust = (direction: number) => {
      if (!entity) return;
      const temperature = nextTemperature(entity, direction, unit);
      if (temperature !== undefined) void context.call(command(context, 'climate', 'set_temperature', { temperature }));
    };
    const modes = entity?.attributes.hvac_modes;
    return html`<div class="thermostat">
      ${editable ? html`<button class="control icon-control" aria-label="Decrease target temperature" ?disabled=${context.disabled || (entity && nextTemperature(entity, -1, unit) === target)} @click=${() => adjust(-1)}>${context.icon('mdi:minus')}</button>` : nothing}
      <div><div class="value">${dual ? `${low ?? '—'}–${high ?? '—'}` : target ?? '—'}<small> ${unit}</small></div><div class="caption">${dual ? 'Target range' : 'Target temperature'}</div></div>
      ${editable ? html`<button class="control icon-control" aria-label="Increase target temperature" ?disabled=${context.disabled || (entity && nextTemperature(entity, 1, unit) === target)} @click=${() => adjust(1)}>${context.icon('mdi:plus')}</button>` : nothing}
    </div><div class="caption">${current === undefined ? 'Current temperature unavailable' : `Currently ${current} ${unit}`}${entity?.attributes.hvac_action ? ` · ${humanize(String(entity.attributes.hvac_action))}` : ''}</div>
    ${config.show_controls !== false && Array.isArray(modes) && modes.length ? html`<select aria-label="HVAC mode" .value=${entity?.state ?? ''} ?disabled=${context.disabled} @change=${(event: Event) => context.call(command(context, 'climate', 'set_hvac_mode', { hvac_mode: (event.target as HTMLSelectElement).value }))}>${modes.map((mode) => html`<option value=${String(mode)} ?selected=${String(mode) === entity?.state}>${humanize(String(mode))}</option>`)}</select>` : nothing}
    ${dual && config.show_controls !== false ? html`<button class="control" ?disabled=${context.pending} @click=${() => context.act({ action: 'more-info' })}>Edit temperature range ${context.icon('mdi:arrow-top-right')}</button>` : nothing}`;
  },
};
