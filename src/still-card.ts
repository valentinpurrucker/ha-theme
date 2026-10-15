import { LitElement, html, nothing } from 'lit';
import type { CardAction, HassEntity, HomeAssistant, RenderContext, ServiceCommand, StillConfig } from './core/types';
import { available, domainOf, entityName, isActive, stateLabel } from './core/entity';
import { validateConfig } from './core/config';
import { performAction } from './core/actions';
import { getCardDefinition, resolveKind } from './core/registry';
import { cardStyles } from './core/styles';
import { weatherIcons } from './cards/weather';

const styleTokens = { accent: '--still-accent', background: '--still-surface', radius: '--still-radius', padding: '--still-padding', border: '--still-border', shadow: '--still-shadow', icon_size: '--still-icon-size' } as const;
type ContextEvent = Event & { context: string; subscribe: boolean; callback: (value: unknown, unsubscribe?: () => void) => void };

export class StillCard extends LitElement {
  static properties = { config: { state: true }, pending: { state: true }, error: { state: true }, detailsOpen: { state: true } };
  static styles = cardStyles;
  protected config?: StillConfig;
  protected pending = false;
  protected error = '';
  private legacyHass?: HomeAssistant;
  private contextData: Partial<HomeAssistant> = {};
  private unsubscribers = new Set<() => void>();
  private contextGeneration = 0;
  private detailsOpen = false;
  private detailTrigger?: HTMLElement;

  get hass(): HomeAssistant | undefined {
    if (!this.legacyHass && !this.contextData.states) return undefined;
    return { ...this.legacyHass, ...this.contextData } as HomeAssistant;
  }

  set hass(value: HomeAssistant | undefined) {
    const previous = this.hass;
    this.legacyHass = value;
    if (this.dataChanged(previous, this.hass)) this.requestUpdate();
  }

  private dataChanged(previous?: HomeAssistant, next?: HomeAssistant): boolean {
    if (!previous || !next || previous.language !== next.language || previous.config !== next.config || previous.callService !== next.callService || previous.formatEntityState !== next.formatEntityState || previous.formatEntityAttributeValue !== next.formatEntityAttributeValue || previous.formatEntityName !== next.formatEntityName) return true;
    const entities = [this.config?.entity, ...(this.config?.chips?.map((chip) => chip.entity) ?? []), ...Object.values(this.config?.solar ?? {}).filter((value): value is string => typeof value === 'string')].filter(Boolean) as string[];
    return entities.some((entity) => previous.states?.[entity] !== next.states?.[entity]);
  }

  connectedCallback(): void {
    super.connectedCallback();
    const generation = ++this.contextGeneration;
    const keys = ['states', 'hassApi', 'hassConfig', 'hassFormatters', 'hassInternationalization'];
    for (const key of keys) {
      const event = new Event('context-request', { bubbles: true, composed: true }) as ContextEvent;
      event.context = key;
      event.subscribe = true;
      event.callback = (value, unsubscribe) => {
        if (generation !== this.contextGeneration || !this.isConnected) { unsubscribe?.(); return; }
        if (unsubscribe) this.unsubscribers.add(unsubscribe);
        const previous = this.hass;
        if (key === 'states') this.contextData = { ...this.contextData, states: value as Record<string, HassEntity> };
        else this.contextData = { ...this.contextData, ...(value as Partial<HomeAssistant>) };
        if (this.dataChanged(previous, this.hass) || key === 'hassFormatters') this.requestUpdate();
      };
      this.dispatchEvent(event);
    }
  }

  disconnectedCallback(): void {
    this.closeDetails();
    super.disconnectedCallback();
    this.contextGeneration++;
    this.unsubscribers.forEach((unsubscribe) => unsubscribe());
    this.unsubscribers.clear();
    this.contextData = {};
  }

  setConfig(config: StillConfig): void {
    const next = validateConfig(config);
    if (this.config?.entity !== next.entity || (this.config && resolveKind(this.config) !== resolveKind(next))) { this.closeDetails(); this.error = ''; }
    this.config = next;
    for (const [key, token] of Object.entries(styleTokens)) {
      const value = this.config.style?.[key as keyof typeof styleTokens];
      if (value) this.style.setProperty(token, value);
      else this.style.removeProperty(token);
    }
  }

  getCardSize(): number {
    if (this.config?.layout === 'tile' && ['light', 'toggle', 'entity'].includes(resolveKind(this.config))) return 3;
    const rows = getCardDefinition(this.config ? resolveKind(this.config) : 'entity')?.rows ?? 2;
    const entity = this.config?.entity ? this.hass?.states[this.config.entity] : undefined;
    return rows + (this.config && resolveKind(this.config) === 'climate' && (entity?.state === 'heat_cool' || (entity?.attributes.temperature === undefined && (Number(entity?.attributes.supported_features) & 2))) ? 1 : 0);
  }

  getGridOptions() {
    const kind = this.config ? resolveKind(this.config) : 'entity';
    const rows = this.getCardSize();
    // Chips may wrap; allow Sections to measure their content instead of fixing height.
    return { columns: ['title', 'chips', 'climate', 'solar'].includes(kind) ? 12 : 6, rows: kind === 'chips' ? undefined : rows, min_rows: kind === 'chips' ? 1 : rows, min_columns: ['climate', 'solar'].includes(kind) ? 9 : 6 };
  }

  static getConfigElement(): HTMLElement { return document.createElement('still-card-editor'); }

  static getStubConfig(hass?: HomeAssistant): Partial<StillConfig> {
    const entities = Object.keys(hass?.states ?? {});
    return { entity: entities.find((entity) => entity.startsWith('light.')) ?? entities[0] ?? 'light.living_room' };
  }

  private async execute(task: () => Promise<unknown>): Promise<void> {
    if (this.pending) return;
    this.pending = true;
    this.error = '';
    try { await task(); } catch (error) {
      this.error = error instanceof Error ? error.message : typeof error === 'object' && error !== null && 'message' in error ? String(error.message) : String(error);
    } finally { this.pending = false; }
  }

  private call = async (command: ServiceCommand): Promise<void> => {
    const hass = this.hass;
    if (!hass?.callService) { this.error = 'Home Assistant is not connected.'; return; }
    if (this.config?.entity && !available(hass.states[this.config.entity])) { this.error = 'This entity is unavailable.'; return; }
    await this.execute(() => hass.callService(command.domain, command.service, command.data, command.target));
  };

  private act = async (action?: CardAction, entityId = this.config?.entity): Promise<void> => {
    if (action?.action === 'details' && entityId === this.config?.entity) {
      if (action.confirmation && !window.confirm(typeof action.confirmation === 'object' ? action.confirmation.text ?? 'Open details?' : 'Open details?')) return;
      this.detailTrigger = (this.renderRoot as ShadowRoot).activeElement as HTMLElement | undefined;
      this.detailsOpen = true;
      return;
    }
    if (action?.action === 'details') action = { action: 'more-info' };
    await this.execute(() => performAction(this, this.hass, action, entityId));
  };

  private closeDetails = (): void => {
    this.detailsOpen = false;
    const dialog = this.renderRoot?.querySelector<HTMLDialogElement>('dialog');
    if (dialog?.open) { if (typeof dialog.close === 'function') dialog.close(); else dialog.removeAttribute('open'); }
    this.detailTrigger?.focus();
    this.detailTrigger = undefined;
  };

  protected updated(): void {
    const dialog = this.renderRoot?.querySelector<HTMLDialogElement>('dialog');
    if (this.detailsOpen && dialog && !dialog.open) {
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
    }
  }

  private trapFocus = (event: KeyboardEvent): void => {
    if (event.key !== 'Tab') return;
    const dialog = event.currentTarget as HTMLDialogElement;
    const controls = [...dialog.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), a[href]')].filter((node) => node.getClientRects().length > 0);
    const first = controls[0], last = controls.at(-1);
    const active = (this.renderRoot as ShadowRoot).activeElement;
    if (event.shiftKey && active === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && active === last) { event.preventDefault(); first?.focus(); }
  };

  protected render() {
    if (!this.config) return nothing;
    const config = this.config;
    const kind = resolveKind(config);
    const definition = getCardDefinition(kind)!;
    const hass = this.hass;
    const entity = config.entity ? hass?.states?.[config.entity] : undefined;
    const hasEntity = definition.requiresEntity !== false;
    const offline = hasEntity && !available(entity);
    const context: RenderContext = { config, entity, hass, view: 'card', pending: this.pending, disabled: this.pending || offline || !hass?.callService, call: this.call, act: this.act, icon: (icon) => html`<ha-icon .icon=${icon} aria-hidden="true"></ha-icon>` };
    const domain = domainOf(config.entity);
    const deviceIcons: Record<string, string> = { temperature: 'mdi:thermometer', humidity: 'mdi:water-percent', power: 'mdi:flash-outline', energy: 'mdi:lightning-bolt-outline', battery: 'mdi:battery-outline', door: 'mdi:door-closed', motion: 'mdi:motion-sensor' };
    const icon = config.icon ?? String(entity?.attributes.icon ?? (kind === 'weather' ? weatherIcons[entity?.state ?? ''] : undefined) ?? (kind === 'solar' ? definition.icon : deviceIcons[String(entity?.attributes.device_class)]) ?? (domain === 'switch' ? 'mdi:power-plug-outline' : definition.icon));
    const secondary = config.subtitle ?? (kind === 'scene' && config.show_state !== true ? 'Set the mood with one tap' : domain === 'sensor' && !config.attribute && Number.isFinite(Number(entity?.state)) ? 'Current reading' : stateLabel(entity, config, hass));
    return html`<ha-card data-kind=${kind} data-layout=${config.layout ?? 'panel'} data-variant=${config.variant ?? 'soft'} data-density=${config.density ?? 'comfortable'} ?data-active=${isActive(entity)} ?data-unavailable=${offline} aria-busy=${this.pending}>
      ${hasEntity ? html`<div class="header"><button class="head-button" aria-label=${`More about ${entityName(entity, config, hass)}`} ?disabled=${this.pending || config.tap_action?.action === 'none'} @click=${() => this.act(config.tap_action ?? { action: 'details' })}><span class="icon-wrap">${context.icon(icon)}</span><span class="labels"><span class="name">${entityName(entity, config, hass)}</span>${config.show_state !== false ? html`<span class="secondary">${secondary}</span>` : nothing}</span><span class="detail-indicator">${context.icon('mdi:chevron-right')}</span></button></div>` : nothing}
      <div class="body">${offline ? html`<p class="status" role="status">${hass ? stateLabel(entity) : 'Connecting to Home Assistant…'}</p>` : definition.render(context)}</div>
      ${this.pending ? html`<p class="status" role="status">Sending…</p>` : nothing}
      ${this.error ? html`<p class="error" role="alert">${this.error}</p>` : nothing}
    </ha-card>${hasEntity && this.detailsOpen ? html`<dialog class="detail-sheet" aria-labelledby="detail-name" @keydown=${this.trapFocus} @cancel=${(event: Event) => { event.preventDefault(); this.closeDetails(); }} @close=${() => { this.detailsOpen = false; }} @click=${(event: MouseEvent) => {
      if (event.target !== event.currentTarget) return;
      const bounds = (event.currentTarget as HTMLElement).getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) this.closeDetails();
    }}><div class="sheet-handle" aria-hidden="true"></div><div class="sheet-top"><span class="icon-wrap">${context.icon(icon)}</span><button class="control icon-control round" aria-label="Close details" @click=${this.closeDetails}>${context.icon('mdi:close')}</button></div><h2 id="detail-name">${entityName(entity, config, hass)}</h2><p class="sheet-subtitle">${offline ? stateLabel(entity) : secondary}</p>
      <div class="body sheet-body">${this.detailsOpen ? offline ? html`<p class="status">This device is currently unavailable.</p>` : definition.render({ ...context, view: 'details' }) : nothing}</div>
      ${this.pending ? html`<p class="status" role="status">Sending…</p>` : nothing}${this.error ? html`<p class="error" role="alert">${this.error}</p>` : nothing}
      <button class="native-details" @click=${() => { this.closeDetails(); void this.act({ action: 'more-info' }); }}>Open in Home Assistant ${context.icon('mdi:arrow-top-right')}</button>
    </dialog>` : nothing}`;
  }
}
