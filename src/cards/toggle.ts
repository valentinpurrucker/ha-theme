import { html } from 'lit';
import type { CardDefinition } from '../core/types';
import { domainOf } from '../core/entity';
import { toggle } from './ui';

export const toggleDefinition: CardDefinition = {
  kind: 'toggle', name: 'Toggle', description: 'A familiar switch for everyday devices.', icon: 'mdi:power-plug-outline', domains: ['switch', 'input_boolean', 'automation', 'light'], rows: 3,
  render(context) { return context.config.show_controls === false ? html`` : toggle(context, domainOf(context.entity?.entity_id)); },
};
