import { StillCard } from './still-card';
import { StillCardEditor } from './editor';
import { registerCardDefinition, getCardDefinitions } from './core/registry';
import { entityDefinition } from './cards/entity';
import { lightDefinition } from './cards/light';
import { climateDefinition } from './cards/climate';
import { mediaDefinition } from './cards/media';
import { coverDefinition } from './cards/cover';
import { fanDefinition } from './cards/fan';
import { sceneDefinition } from './cards/scene';
import { weatherDefinition } from './cards/weather';
import { chipsDefinition, titleDefinition } from './cards/layout';
import type { HomeAssistant } from './core/types';

const definitions = [entityDefinition, lightDefinition, climateDefinition, mediaDefinition, coverDefinition, fanDefinition, sceneDefinition, weatherDefinition, chipsDefinition, titleDefinition];
definitions.forEach(registerCardDefinition);
if (!customElements.get('still-card-editor')) customElements.define('still-card-editor', StillCardEditor);
if (!customElements.get('still-card')) customElements.define('still-card', StillCard);

declare global { interface Window { customCards?: Array<Record<string, unknown>>; } }
window.customCards ??= [];
if (!window.customCards.some((card) => card.type === 'still-card')) window.customCards.push({ type: 'still-card', name: 'Still · Auto', description: 'A quiet card that chooses the right controls for your entity.', preview: true });

for (const definition of getCardDefinitions()) {
  const tag = `still-${definition.kind}-card`;
  if (!customElements.get(tag)) {
    customElements.define(tag, class extends StillCard {
      static getStubConfig(hass?: HomeAssistant) {
        if (definition.kind === 'title') return { name: 'At home', subtitle: 'A little space to breathe.' };
        if (definition.kind === 'chips') return { chips: [{ content: 'Home', icon: 'mdi:home-outline' }] };
        const entity = Object.keys(hass?.states ?? {}).find((id) => !definition.domains || definition.domains.includes(id.split('.')[0]));
        return { entity: entity ?? `${definition.domains?.[0] ?? 'sensor'}.example` };
      }
    });
  }
  if (!window.customCards.some((card) => card.type === tag)) window.customCards.push({ type: tag, name: `Still · ${definition.name}`, description: definition.description, preview: true,
    getEntitySuggestion: (_hass: HomeAssistant, entityId: string) => definition.requiresEntity === false || (definition.domains && !definition.domains.includes(entityId.split('.')[0])) ? null : { config: { type: `custom:${tag}`, entity: entityId } },
  });
}

export { StillCard, StillCardEditor, registerCardDefinition, getCardDefinitions };
export { cardStyles } from './core/styles';
export * from './core/types';
