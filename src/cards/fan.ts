import { html, nothing } from 'lit';
import type { CardDefinition } from '../core/types';
import { clamp, numberAttribute, supports } from '../core/entity';
import { command, range, toggle } from './ui';

export const fanDefinition: CardDefinition = {
  kind: 'fan', name: 'Fan', description: 'Power, speed, and oscillation.', icon: 'mdi:fan', domains: ['fan'], rows: 5,
  render(context) {
    if (context.config.show_controls === false) return html``;
    const entity = context.entity;
    const step = numberAttribute(entity, 'percentage_step') ?? 1;
    return html`${supports(entity, 16) && supports(entity, 32) ? toggle(context, 'fan') : nothing}
      ${supports(entity, 1) ? range(context, 'Speed', numberAttribute(entity, 'percentage') ?? 0, 0, 100, step, '%', (value) => command(context, 'fan', 'set_percentage', { percentage: clamp(value, 0, 100) })) : nothing}
      ${supports(entity, 2) ? html`<button class="control" aria-label="Toggle oscillation" aria-pressed=${!!entity?.attributes.oscillating} ?disabled=${context.disabled} @click=${() => context.call(command(context, 'fan', 'oscillate', { oscillating: !entity?.attributes.oscillating }))}>${context.icon('mdi:swap-horizontal')} Oscillation ${entity?.attributes.oscillating ? 'on' : 'off'}</button>` : nothing}`;
  },
};
