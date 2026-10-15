import { html, nothing } from 'lit';
import type { CardDefinition } from '../core/types';
import { domainOf, stateLabel } from '../core/entity';
import { toggle } from './ui';

export const entityDefinition: CardDefinition = {
  kind: 'entity', name: 'Entity', description: 'A simple status, sensor, or switch.', icon: 'mdi:circle-outline', rows: 3,
  render(context) {
    const { config, entity, hass } = context;
    if (entity && !config.attribute && Number.isFinite(Number(entity.state)) && entity.state.trim() !== '') {
      return html`<div class="value">${hass?.formatEntityState && !config.unit ? stateLabel(entity, config, hass) : html`${entity.state}<small> ${config.unit ?? entity.attributes.unit_of_measurement ?? ''}</small>`}</div>`;
    }
    const domain = domainOf(entity?.entity_id);
    return html`${config.show_controls !== false && ['switch', 'input_boolean', 'automation'].includes(domain) ? toggle(context, domain) : nothing}`;
  },
};
