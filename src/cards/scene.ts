import { html } from 'lit';
import type { CardDefinition } from '../core/types';
import { domainOf } from '../core/entity';
import { command } from './ui';

export const sceneDefinition: CardDefinition = {
  kind: 'scene', name: 'Scene & action', description: 'Activate a scene, script, or button.', icon: 'mdi:creation-outline', domains: ['scene', 'script', 'button', 'input_button'], rows: 3,
  render(context) {
    if (context.config.show_controls === false) return html``;
    const domain = domainOf(context.entity?.entity_id);
    const label = ['button', 'input_button'].includes(domain) ? 'Run action' : domain === 'script' ? 'Run script' : 'Activate scene';
    return html`<button class="control grow" ?disabled=${context.disabled} @click=${() => context.config.tap_action ? context.act(context.config.tap_action) : context.call(command(context, domain, ['button', 'input_button'].includes(domain) ? 'press' : 'turn_on'))}>${context.icon('mdi:play-outline')}${label}</button>`;
  },
};
