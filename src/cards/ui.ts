import { html, nothing } from 'lit';
import { live } from 'lit/directives/live.js';
import type { RenderContext, ServiceCommand } from '../core/types';
import { isActive } from '../core/entity';

export const command = (context: RenderContext, domain: string, service: string, data: Record<string, unknown> = {}): ServiceCommand => ({ domain, service, data: { entity_id: context.entity?.entity_id, ...data } });

export function control(context: RenderContext, label: string, icon: string, service: ServiceCommand, primary = false) {
  return html`<button class="control icon-control ${primary ? 'primary' : ''}" aria-label=${label} title=${label} ?disabled=${context.disabled} @click=${() => context.call(service)}>${context.icon(icon)}</button>`;
}

export function toggle(context: RenderContext, domain: string) {
  const on = isActive(context.entity);
  return html`<div class="controls"><span class="caption">${on ? 'Powered on' : 'Powered off'}</span><button class="toggle" role="switch" aria-label=${`Toggle ${context.config.name ?? context.entity?.attributes.friendly_name ?? domain}`} aria-checked=${on} ?disabled=${context.disabled} @click=${() => context.call(command(context, domain, 'toggle'))}></button></div>`;
}

export function range(context: RenderContext, label: string, value: number, min: number, max: number, step: number, unit: string, create: (value: number) => ServiceCommand) {
  if (max <= min || step <= 0) return nothing;
    return html`<label class="range-field"><span class="range-label"><span>${label}</span><output .value=${live(`${Math.round(value)}${unit}`)}></output></span><input type="range" aria-label=${label} min=${min} max=${max} step=${step} .value=${live(String(value))} ?disabled=${context.disabled}
    @input=${(event: Event) => { const input = event.target as HTMLInputElement; const output = input.parentElement?.querySelector('output'); if (output) output.value = `${input.value}${unit}`; }}
    @change=${(event: Event) => context.call(create(Number((event.target as HTMLInputElement).value)))} /></label>`;
}
