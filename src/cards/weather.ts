import { html, nothing } from 'lit';
import type { CardDefinition } from '../core/types';
import { numberAttribute, temperatureUnit, stateLabel } from '../core/entity';

export const weatherIcons: Record<string, string> = { sunny: 'mdi:weather-sunny', 'clear-night': 'mdi:weather-night', cloudy: 'mdi:weather-cloudy', partlycloudy: 'mdi:weather-partly-cloudy', rainy: 'mdi:weather-rainy', pouring: 'mdi:weather-pouring', snowy: 'mdi:weather-snowy', 'snowy-rainy': 'mdi:weather-snowy-rainy', lightning: 'mdi:weather-lightning', 'lightning-rainy': 'mdi:weather-lightning-rainy', fog: 'mdi:weather-fog', windy: 'mdi:weather-windy', 'windy-variant': 'mdi:weather-windy-variant', hail: 'mdi:weather-hail', exceptional: 'mdi:alert-circle-outline' };
export const weatherDefinition: CardDefinition = {
  kind: 'weather', name: 'Weather', description: 'A clear view of the weather outside.', icon: 'mdi:weather-partly-cloudy', domains: ['weather'], rows: 4,
  render(context) {
    const { entity, hass } = context;
    const humidity = numberAttribute(entity, 'humidity');
    const wind = numberAttribute(entity, 'wind_speed');
    const apparent = numberAttribute(entity, 'apparent_temperature');
    const pressure = numberAttribute(entity, 'pressure');
    return html`<div class="weather"><div><div class="value">${numberAttribute(entity, 'temperature') ?? '—'}<small>${temperatureUnit(entity, hass)}</small></div><span class="caption">${stateLabel(entity, undefined, hass)}</span></div><span class="weather-symbol">${context.icon(weatherIcons[entity?.state ?? ''] ?? 'mdi:weather-partly-cloudy')}</span></div><div class="weather-details">
      ${humidity !== undefined ? html`<span>${context.icon('mdi:water-percent')}<span>Humidity<strong>${humidity}%</strong></span></span>` : nothing}
      ${wind !== undefined ? html`<span>${context.icon('mdi:weather-windy')}<span>Wind<strong>${wind} ${entity?.attributes.wind_speed_unit ?? ''}</strong></span></span>` : nothing}
      ${context.view === 'details' && apparent !== undefined ? html`<span><span>Feels like<strong>${apparent} ${temperatureUnit(entity, hass)}</strong></span></span>` : nothing}
      ${context.view === 'details' && pressure !== undefined ? html`<span><span>Pressure<strong>${pressure} ${entity?.attributes.pressure_unit ?? ''}</strong></span></span>` : nothing}
    </div>`;
  },
};
