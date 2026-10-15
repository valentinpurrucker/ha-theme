import type { CardAction, HomeAssistant, ServiceCommand } from './types';
import { domainOf } from './entity';
import { validateAction } from './config';

export function toggleCommand(entityId: string): ServiceCommand | undefined {
  const domain = domainOf(entityId);
  if (['light', 'switch', 'fan', 'input_boolean', 'automation'].includes(domain)) return { domain, service: 'toggle', data: { entity_id: entityId } };
  return undefined;
}

export async function performAction(host: HTMLElement, hass: HomeAssistant | undefined, action: CardAction = { action: 'more-info' }, entityId?: string): Promise<void> {
  validateAction(action);
  if (action.action === 'none') return;
  if (action.confirmation && !window.confirm(typeof action.confirmation === 'object' ? action.confirmation.text ?? 'Run this action?' : 'Run this action?')) return;
  if (action.action === 'more-info') {
    if (entityId) host.dispatchEvent(new CustomEvent('hass-more-info', { detail: { entityId }, bubbles: true, composed: true }));
    return;
  }
  if (action.action === 'navigate') {
    history.pushState(null, '', action.navigation_path);
    window.dispatchEvent(new CustomEvent('location-changed', { detail: { replace: false } }));
    return;
  }
  if (action.action === 'url') {
    window.open(action.url_path, '_blank', 'noopener,noreferrer');
    return;
  }
  if (!hass) throw new Error('Home Assistant is not connected.');
  if (action.action === 'toggle') {
    const command = entityId && toggleCommand(entityId);
    if (!command) throw new Error('This entity does not support a toggle action.');
    await hass.callService(command.domain, command.service, command.data);
    return;
  }
  const [domain, service] = (action.perform_action ?? action.service!).split('.');
  const data = { ...(action.data ?? action.service_data ?? {}) };
  // Explicit targets/data win; default to the card entity only when no target was supplied.
  if (!action.target && !('entity_id' in data) && entityId) data.entity_id = entityId;
  await hass.callService(domain, service, data, action.target);
}
