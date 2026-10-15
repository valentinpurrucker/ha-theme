import type { CardDefinition, StillConfig } from './types';
import { domainOf } from './entity';

const definitions = new Map<string, CardDefinition>();

export function registerCardDefinition(definition: CardDefinition): void {
  if (!/^[a-z][a-z0-9-]*$/.test(definition.kind)) throw new Error('Card kinds must use lowercase letters, numbers, and hyphens.');
  if (definitions.has(definition.kind)) throw new Error(`Still card kind "${definition.kind}" is already registered.`);
  definitions.set(definition.kind, Object.freeze({ ...definition }));
}

export const getCardDefinitions = (): CardDefinition[] => [...definitions.values()];
export const getCardDefinition = (kind: string): CardDefinition | undefined => definitions.get(kind);

export function resolveKind(config: StillConfig): string {
  if (config.kind) return config.kind;
  const alias = config.type.match(/^custom:still-(.+)-card$/)?.[1];
  if (alias) return alias;
  const domain = domainOf(config.entity);
  const map: Record<string, string> = { light: 'light', climate: 'climate', media_player: 'media', cover: 'cover', fan: 'fan', scene: 'scene', script: 'scene', button: 'scene', input_button: 'scene', weather: 'weather' };
  return map[domain] ?? 'entity';
}
