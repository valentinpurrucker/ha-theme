import type { HassEntity, HomeAssistant, StillConfig } from './types';

export const domainOf = (id?: string): string => id?.split('.')[0] ?? '';
export const available = (entity?: HassEntity): boolean => !!entity && !['unknown', 'unavailable'].includes(entity.state);
export const supports = (entity: HassEntity | undefined, feature: number): boolean => ((Number(entity?.attributes.supported_features) || 0) & feature) !== 0;
export const numberAttribute = (entity: HassEntity | undefined, attribute: string): number | undefined => {
  const value = entity?.attributes[attribute];
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
};
export const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));
export const humanize = (value: string): string => value.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());
export const isActive = (entity?: HassEntity): boolean => !!entity && available(entity) && ['on', 'playing', 'open', 'opening', 'heat', 'cool', 'auto', 'heat_cool', 'dry', 'fan_only'].includes(entity.state);

export function entityName(entity?: HassEntity, config?: StillConfig, hass?: HomeAssistant): string {
  if (config?.name) return config.name;
  if (entity && hass?.formatEntityName) return hass.formatEntityName(entity);
  return String(entity?.attributes.friendly_name ?? config?.entity ?? 'Still');
}

export function stateLabel(entity?: HassEntity, config?: StillConfig, hass?: HomeAssistant): string {
  if (!entity) return 'Entity not found';
  if (!available(entity)) return humanize(entity.state);
  if (config?.attribute) {
    const value = entity.attributes[config.attribute];
    if (value == null) return '—';
    if (!config.unit && hass?.formatEntityAttributeValue) return hass.formatEntityAttributeValue(entity, config.attribute);
    return `${String(value)}${config.unit ? ` ${config.unit}` : ''}`;
  }
  if (config?.unit) return `${entity.state} ${config.unit}`;
  if (hass?.formatEntityState) return hass.formatEntityState(entity);
  if (domainOf(entity.entity_id) === 'weather') {
    const weather: Record<string, string> = { partlycloudy: 'Partly cloudy', 'clear-night': 'Clear night', 'lightning-rainy': 'Thunderstorms', 'snowy-rainy': 'Sleet', 'windy-variant': 'Windy' };
    return weather[entity.state] ?? humanize(entity.state);
  }
  if (domainOf(entity.entity_id) === 'binary_sensor' && ['on', 'off'].includes(entity.state)) {
    const names: Record<string, [string, string]> = { door: ['Open', 'Closed'], window: ['Open', 'Closed'], garage_door: ['Open', 'Closed'], motion: ['Detected', 'Clear'], occupancy: ['Occupied', 'Clear'], moisture: ['Wet', 'Dry'], battery: ['Low', 'Normal'], smoke: ['Detected', 'Clear'] };
    const labels = names[String(entity.attributes.device_class)];
    if (labels) return labels[entity.state === 'on' ? 0 : 1];
  }
  const unit = entity.attributes.unit_of_measurement;
  return unit ? `${entity.state} ${unit}` : humanize(entity.state);
}

export function brightnessSupported(entity?: HassEntity): boolean {
  const modes = entity?.attributes.supported_color_modes;
  return Array.isArray(modes) && modes.some((mode) => !['onoff', 'unknown'].includes(String(mode)));
}

export function temperatureUnit(entity?: HassEntity, hass?: HomeAssistant): string {
  return String(entity?.attributes.temperature_unit ?? hass?.config?.unit_system?.temperature ?? '°C');
}

export function nextTemperature(entity: HassEntity, direction: number, unit: string): number | undefined {
  const current = numberAttribute(entity, 'temperature');
  if (current === undefined) return undefined;
  const step = numberAttribute(entity, 'target_temp_step') ?? (unit === '°F' ? 1 : 0.5);
  if (step <= 0) return undefined;
  const min = numberAttribute(entity, 'min_temp') ?? (unit === '°F' ? 45 : 7);
  const max = numberAttribute(entity, 'max_temp') ?? (unit === '°F' ? 95 : 35);
  return Number(clamp(current + direction * step, min, max).toFixed(3));
}
