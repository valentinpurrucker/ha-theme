import { html, nothing } from 'lit';
import type { CardDefinition } from '../core/types';
import { numberAttribute, temperatureUnit } from '../core/entity';

export const weatherDefinition: CardDefinition = {
  kind: 'weather', name: 'Weather', description: 'Current conditions, temperature, and humidity.', icon: 'mdi:weather-partly-cloudy', domains: ['weather'], rows: 4,
  render(context) {
    const { entity, hass } = context;
    const humidity = numberAttribute(entity, 'humidity');
    const wind = numberAttribute(entity, 'wind_speed');
    return html`<div class="weather"><div class="value">${numberAttribute(entity, 'temperature') ?? '—'}<small> ${temperatureUnit(entity, hass)}</small></div></div><div class="weather-details">
      ${humidity !== undefined ? html`<span>Humidity ${humidity}%</span>` : nothing}
      ${wind !== undefined ? html`<span>Wind ${wind} ${entity?.attributes.wind_speed_unit ?? ''}</span>` : nothing}
    </div>`;
  },
};
