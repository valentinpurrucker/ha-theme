import { html, nothing } from 'lit';
import type { CardDefinition } from '../core/types';
import { brightnessSupported, numberAttribute, clamp } from '../core/entity';
import { command, range, toggle } from './ui';

export const lightDefinition: CardDefinition = {
  kind: 'light', name: 'Light', description: 'Power, brightness, and color temperature.', icon: 'mdi:lightbulb-outline', domains: ['light'], rows: 5,
  render(context) {
    const { entity, config } = context;
    if (config.show_controls === false) return html``;
    const brightness = entity?.state === 'off' ? 0 : Math.round((numberAttribute(entity, 'brightness') ?? 255) / 255 * 100);
    const modes = entity?.attributes.supported_color_modes;
    const min = numberAttribute(entity, 'min_color_temp_kelvin');
    const max = numberAttribute(entity, 'max_color_temp_kelvin');
    const color = numberAttribute(entity, 'color_temp_kelvin');
    return html`${toggle(context, 'light')}
      ${brightnessSupported(entity) ? range(context, 'Brightness', brightness, 0, 100, 1, '%', (value) => command(context, 'light', value === 0 ? 'turn_off' : 'turn_on', value === 0 ? {} : { brightness_pct: clamp(value, 1, 100) })) : nothing}
      ${Array.isArray(modes) && modes.includes('color_temp') && min !== undefined && max !== undefined ? range(context, 'Warmth', color ?? min, min, max, 1, ' K', (value) => command(context, 'light', 'turn_on', { color_temp_kelvin: clamp(value, min, max) })) : nothing}`;
  },
};
