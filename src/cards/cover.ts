import { html, nothing } from 'lit';
import type { CardDefinition } from '../core/types';
import { clamp, numberAttribute, supports } from '../core/entity';
import { command, control, range } from './ui';

export const coverDefinition: CardDefinition = {
  kind: 'cover', name: 'Cover', description: 'Open, stop, close, and position.', icon: 'mdi:blinds-horizontal', domains: ['cover'], rows: 4,
  render(context) {
    if (context.config.show_controls === false) return html``;
    const position = numberAttribute(context.entity, 'current_position');
    return html`<div class="controls">
      ${supports(context.entity, 1) ? control(context, 'Open cover', 'mdi:chevron-up', command(context, 'cover', 'open_cover')) : nothing}
      ${supports(context.entity, 8) ? control(context, 'Stop cover', 'mdi:stop', command(context, 'cover', 'stop_cover')) : nothing}
      ${supports(context.entity, 2) ? control(context, 'Close cover', 'mdi:chevron-down', command(context, 'cover', 'close_cover')) : nothing}
    </div>${supports(context.entity, 4) ? range(context, 'Open position', position ?? 0, 0, 100, 1, '%', (value) => command(context, 'cover', 'set_cover_position', { position: clamp(value, 0, 100) })) : nothing}`;
  },
};
