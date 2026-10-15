import { LitElement, html, nothing } from 'lit';
import type { CardAction, HassEntity, HomeAssistant, RenderContext, ServiceCommand, StillConfig } from './core/types';
import { available, domainOf, entityName, isActive, stateLabel } from './core/entity';
import { validateConfig } from './core/config';
import { performAction } from './core/actions';
import { getCardDefinition, resolveKind } from './core/registry';
import { cardStyles } from './core/styles';

const styleTokens = { accent: '--still-accent', background: '--still-surface', radius: '--still-radius', padding: '--still-padding', border: '--still-border', shadow: '--still-shadow', icon_size: '--still-icon-size' } as const;
type ContextEvent = Event & { context: string; subscribe: boolean; callback: (value: unknown, unsubscribe?: () => void) => void };

export class StillCard extends LitElement {
  static properties = { config: { state: true }, pending: { state: true }, error: { state: true } };
  static styles = cardStyles;
  protected config?: StillConfig;
  protected pending = false;
  protected error = '';
  private legacyHass?: HomeAssistant;
  private contextData: Partial<HomeAssistant> = {};
  private unsubscribers = new Set<() => void>();
  private contextGeneration = 0;

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
    const entities = [this.config?.entity, ...(this.config?.chips?.map((chip) => chip.entity) ?? [])].filter(Boolean) as string[];
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
    super.disconnectedCallback();
    this.contextGeneration++;
    this.unsubscribers.forEach((unsubscribe) => unsubscribe());
    this.unsubscribers.clear();
    this.contextData = {};
  }

  setConfig(config: StillConfig): void {
    this.config = validateConfig(config);
    this.error = '';
    for (const [key, token] of Object.entries(styleTokens)) {
      const value = this.config.style?.[key as keyof typeof styleTokens];
      if (value) this.style.setProperty(token, value);
      else this.style.removeProperty(token);
    }
  }

  getCardSize(): number { return getCardDefinition(this.config ? resolveKind(this.config) : 'entity')?.rows ?? 2; }

  getGridOptions() {
    const kind = this.config ? resolveKind(this.config) : 'entity';
    const rows = getCardDefinition(kind)?.rows ?? 2;
    // Chips may wrap; allow Sections to measure their content instead of fixing height.
    return { columns: ['title', 'chips', 'climate'].includes(kind) ? 12 : 6, rows: kind === 'chips' ? undefined : rows, min_rows: kind === 'chips' ? 1 : rows, min_columns: kind === 'climate' ? 9 : 6 };
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
    await this.execute(() => performAction(this, this.hass, action, entityId));
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
    const context: RenderContext = { config, entity, hass, pending: this.pending, disabled: this.pending || offline || !hass?.callService, call: this.call, act: this.act, icon: (icon) => html`<ha-icon .icon=${icon} aria-hidden="true"></ha-icon>` };
    const domain = domainOf(config.entity);
    const deviceIcons: Record<string, string> = { temperature: 'mdi:thermometer', humidity: 'mdi:water-percent', power: 'mdi:flash-outline', energy: 'mdi:lightning-bolt-outline', battery: 'mdi:battery-outline', door: 'mdi:door-closed', motion: 'mdi:motion-sensor' };
    const icon = config.icon ?? String(entity?.attributes.icon ?? deviceIcons[String(entity?.attributes.device_class)] ?? (domain === 'switch' ? 'mdi:power-plug-outline' : definition.icon));
    const secondary = config.subtitle ?? (kind === 'scene' && config.show_state !== true ? 'Set the mood with one tap' : domain === 'sensor' && !config.attribute && Number.isFinite(Number(entity?.state)) ? 'Current reading' : stateLabel(entity, config, hass));
    return html`<ha-card data-kind=${kind} data-variant=${config.variant ?? 'soft'} data-density=${config.density ?? 'comfortable'} ?data-active=${isActive(entity)} ?data-unavailable=${offline} aria-busy=${this.pending}>
      ${hasEntity ? html`<div class="header"><button class="head-button" aria-label=${`More about ${entityName(entity, config, hass)}`} ?disabled=${this.pending || config.tap_action?.action === 'none'} @click=${() => this.act(config.tap_action)}><span class="icon-wrap">${context.icon(icon)}</span><span class="labels"><span class="name">${entityName(entity, config, hass)}</span>${config.show_state !== false ? html`<span class="secondary">${secondary}</span>` : nothing}</span></button></div>` : nothing}
      <div class="body">${offline ? html`<p class="status" role="status">${hass ? stateLabel(entity) : 'Connecting to Home Assistant…'}</p>` : definition.render(context)}</div>
      ${this.pending ? html`<p class="status" role="status">Sending…</p>` : nothing}
      ${this.error ? html`<p class="error" role="alert">${this.error}</p>` : nothing}
    </ha-card>`;
  }
}
