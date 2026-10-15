import type { CardAction, StillConfig } from './types';
import { getCardDefinition, resolveKind } from './registry';
import { domainOf } from './entity';

const actions = ['none', 'details', 'more-info', 'toggle', 'perform-action', 'call-service', 'navigate', 'url'];
const validEntity = (id: unknown) => typeof id === 'string' && /^[a-z][a-z0-9_]*\.[a-z0-9_]+$/.test(id);
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);

export function validateAction(action: CardAction | undefined): void {
  if (action === undefined) return;
  if (!object(action) || !actions.includes(action.action)) throw new Error('Unsupported tap_action.');
  if (['perform-action', 'call-service'].includes(action.action) && !/^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/.test(action.perform_action ?? action.service ?? '')) {
    throw new Error('Actions need perform_action (domain.service).');
  }
  if (action.action === 'navigate' && (typeof action.navigation_path !== 'string' || !action.navigation_path.startsWith('/') || action.navigation_path.startsWith('//'))) {
    throw new Error('navigation_path must be a local path beginning with /.');
  }
  if (action.action === 'url') {
    let url: URL;
    try { url = new URL(action.url_path ?? ''); } catch { throw new Error('url_path must be an absolute HTTP or HTTPS URL.'); }
    if (!['https:', 'http:'].includes(url.protocol)) throw new Error('Only HTTP and HTTPS URLs are supported.');
  }
  for (const key of ['data', 'service_data', 'target'] as const) {
    if (action[key] !== undefined && !object(action[key])) throw new Error(`${key} must be an object.`);
  }
}

export function validateConfig(value: StillConfig): StillConfig {
  if (!object(value) || typeof value.type !== 'string') throw new Error('A Still card needs a type.');
  const definition = getCardDefinition(resolveKind(value));
  if (!definition) throw new Error(`Unsupported card kind "${resolveKind(value)}".`);
  if (definition.requiresEntity !== false && !validEntity(value.entity)) throw new Error('Choose an entity (for example light.living_room).');
  if (value.entity !== undefined && !validEntity(value.entity)) throw new Error('Invalid entity ID.');
  if (value.entity && definition.domains && !definition.domains.includes(domainOf(value.entity))) throw new Error(`${definition.name} supports: ${definition.domains.join(', ')}.`);
  if (value.variant && !['soft', 'outlined', 'minimal'].includes(value.variant)) throw new Error('variant must be soft, outlined, or minimal.');
  if (value.density && !['comfortable', 'compact'].includes(value.density)) throw new Error('density must be comfortable or compact.');
  if (value.layout && !['tile', 'panel'].includes(value.layout)) throw new Error('layout must be tile or panel.');
  for (const key of ['name', 'icon', 'subtitle', 'attribute', 'unit'] as const) {
    if (value[key] !== undefined && typeof value[key] !== 'string') throw new Error(`${key} must be text.`);
  }
  for (const key of ['show_state', 'show_controls', 'show_presets'] as const) {
    if (value[key] !== undefined && typeof value[key] !== 'boolean') throw new Error(`${key} must be true or false.`);
  }
  if (value.style !== undefined && (!object(value.style) || Object.values(value.style).some((token) => typeof token !== 'string'))) throw new Error('style must contain CSS values as strings.');
  if (value.solar !== undefined) {
    if (!object(value.solar)) throw new Error('solar must be an object of sensor mappings.');
    for (const key of ['home_power', 'grid_power', 'battery_level', 'battery_power', 'energy_today'] as const) {
      if (value.solar[key] !== undefined && (!validEntity(value.solar[key]) || domainOf(value.solar[key]) !== 'sensor')) throw new Error(`solar.${key} needs a sensor entity ID.`);
    }
    if (value.solar.grid_export_positive !== undefined && typeof value.solar.grid_export_positive !== 'boolean') throw new Error('solar.grid_export_positive must be true or false.');
  }
  validateAction(value.tap_action);
  if (definition.kind === 'chips' && (!Array.isArray(value.chips) || value.chips.length === 0)) throw new Error('Add at least one chip.');
  if (value.chips !== undefined) {
    if (!Array.isArray(value.chips)) throw new Error('chips must be a list.');
    value.chips.forEach((chip) => {
      if (!object(chip) || (!chip.entity && !chip.content && !chip.name)) throw new Error('Each chip needs an entity, content, or name.');
      if (chip.entity !== undefined && !validEntity(chip.entity)) throw new Error('Invalid chip entity ID.');
      for (const key of ['name', 'icon', 'content'] as const) if (chip[key] !== undefined && typeof chip[key] !== 'string') throw new Error(`Chip ${key} must be text.`);
      validateAction(chip.tap_action as CardAction | undefined);
    });
  }
  return structuredClone(value);
}
