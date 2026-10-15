import { html } from 'lit';
import type { CardDefinition } from '../core/types';
import { available, entityName, stateLabel } from '../core/entity';

export const titleDefinition: CardDefinition = {
  kind: 'title', name: 'Title', description: 'Give a section a little breathing room.', icon: 'mdi:format-title', requiresEntity: false, rows: 2,
  render: ({ config }) => html`<h2 class="title">${config.name ?? 'At home'}</h2>${config.subtitle ? html`<p class="title-subtitle">${config.subtitle}</p>` : ''}`,
};

export const chipsDefinition: CardDefinition = {
  kind: 'chips', name: 'Chips', description: 'Small statuses and quick shortcuts.', icon: 'mdi:dots-horizontal-circle-outline', requiresEntity: false, rows: 1,
  render(context) {
    return html`<div class="chip-row">${context.config.chips?.map((chip) => {
      const entity = chip.entity ? context.hass?.states[chip.entity] : undefined;
      const label = chip.content ?? (chip.name ? `${chip.name}${entity ? ` · ${stateLabel(entity, undefined, context.hass)}` : chip.entity ? ' · Entity not found' : ''}` : entityName(entity, { type: '', entity: chip.entity }, context.hass) + (entity ? ` · ${stateLabel(entity, undefined, context.hass)}` : chip.entity ? ' · Entity not found' : ''));
      return html`<button class="chip" ?disabled=${context.pending || (!!chip.entity && !available(entity) && !!chip.tap_action && !['more-info', 'none', 'navigate', 'url'].includes(chip.tap_action.action))} @click=${() => context.act(chip.tap_action ?? { action: chip.entity ? 'more-info' : 'none' }, chip.entity)}>${context.icon(chip.icon ?? String(entity?.attributes.icon ?? 'mdi:circle-small'))}${label}</button>`;
    })}</div>`;
  },
};
