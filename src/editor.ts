import { LitElement, css, html, nothing } from 'lit';
import type { HomeAssistant, StillConfig } from './core/types';
import { getCardDefinitions, resolveKind } from './core/registry';

export class StillCardEditor extends LitElement {
  static properties = { hass: { attribute: false }, config: { state: true }, jsonError: { state: true } };
  static styles = css`
    :host { display:block; color:var(--primary-text-color,#28332e); font:14px/1.5 system-ui,sans-serif; }
    * { box-sizing:border-box; } .form { display:grid; gap:16px; } .pair { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
    label { display:flex; flex-direction:column; gap:6px; font-size:13px; } input,select,textarea { width:100%; padding:12px; border:1px solid var(--divider-color,#ddd); border-radius:10px; background:var(--card-background-color,#fff); color:inherit; font:inherit; }
    textarea { min-height:100px; font-family:monospace; font-size:12px; } input:focus-visible,select:focus-visible,textarea:focus-visible { outline:2px solid var(--primary-color,#4c745d); outline-offset:2px; }
    .check { flex-direction:row; align-items:center; } .check input { width:18px;height:18px; } small { color:var(--secondary-text-color,#626d65); } p { margin:0; } .error { color:var(--error-color,#b54545); }
  `;
  hass?: HomeAssistant;
  private config?: StillConfig;
  private jsonError = '';
  setConfig(config: StillConfig): void { this.config = structuredClone(config); }

  protected updated(): void {
    if (!this.config) return;
    const values: Record<string, string> = { kind: resolveKind(this.config), variant: this.config.variant ?? 'soft', density: this.config.density ?? 'comfortable' };
    // Select options are stamped by Lit. Set the value after the option nodes exist.
    this.renderRoot.querySelectorAll<HTMLSelectElement>('select[name]').forEach((select) => { select.value = values[select.name]; });
  }

  private change(key: keyof StillConfig, value: unknown): void {
    if (!this.config) return;
    const next = { ...this.config, [key]: value };
    if (value === '' || value === undefined) delete next[key];
    this.config = next;
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: next }, bubbles: true, composed: true }));
  }

  private text(key: 'name' | 'entity' | 'icon' | 'subtitle' | 'attribute' | 'unit', label: string, list?: string) {
    return html`<label>${label}<input .value=${String(this.config?.[key] ?? '')} list=${list ?? nothing} @change=${(event: Event) => this.change(key, (event.target as HTMLInputElement).value)} /></label>`;
  }

  private json(key: 'chips' | 'tap_action' | 'style', label: string) {
    return html`<label>${label}<textarea .value=${this.config?.[key] ? JSON.stringify(this.config[key], null, 2) : ''} @change=${(event: Event) => {
      try { const value = (event.target as HTMLTextAreaElement).value; this.change(key, value.trim() ? JSON.parse(value) : undefined); this.jsonError = ''; }
      catch { this.jsonError = `${label} needs valid JSON. Your last valid configuration is preserved.`; }
    }}></textarea></label>`;
  }

  protected render() {
    if (!this.config) return nothing;
    const kind = resolveKind(this.config);
    const definition = getCardDefinitions().find((item) => item.kind === kind);
    const choose = (event: Event) => this.change('kind', (event.target as HTMLSelectElement).value);
    return html`<div class="form"><label>Card kind<select name="kind" .value=${kind} @change=${choose}>${getCardDefinitions().map((item) => html`<option value=${item.kind}>${item.name}</option>`)}</select></label>
      ${definition?.requiresEntity !== false ? html`${this.text('entity', 'Entity', 'entities')}<datalist id="entities">${Object.keys(this.hass?.states ?? {}).filter((id) => !definition?.domains || definition.domains.includes(id.split('.')[0])).map((id) => html`<option value=${id}></option>`)}</datalist>` : nothing}
      <div class="pair">${this.text('name', 'Name')}${this.text('icon', 'Icon (mdi:…)')}</div>${this.text('subtitle', 'Subtitle')}
      <div class="pair"><label>Style<select name="variant" .value=${this.config.variant ?? 'soft'} @change=${(event: Event) => this.change('variant', (event.target as HTMLSelectElement).value)}>${['soft', 'outlined', 'minimal'].map((style) => html`<option value=${style}>${style}</option>`)}</select></label><label>Density<select name="density" .value=${this.config.density ?? 'comfortable'} @change=${(event: Event) => this.change('density', (event.target as HTMLSelectElement).value)}><option value="comfortable">Comfortable</option><option value="compact">Compact</option></select></label></div>
      <div class="pair"><label class="check"><input type="checkbox" .checked=${this.config.show_state !== false} @change=${(event: Event) => this.change('show_state', (event.target as HTMLInputElement).checked)} />Show state</label><label class="check"><input type="checkbox" .checked=${this.config.show_controls !== false} @change=${(event: Event) => this.change('show_controls', (event.target as HTMLInputElement).checked)} />Show controls</label></div>
      ${kind === 'entity' ? html`<div class="pair">${this.text('attribute', 'Attribute (optional)')}${this.text('unit', 'Unit override')}</div>` : nothing}
      ${kind === 'chips' ? this.json('chips', 'Chips') : nothing}
      <details><summary>Advanced options</summary><div class="form">${this.json('style', 'Style overrides')}${this.json('tap_action', 'Tap action')}<small>Theme tokens style the whole collection. Per-card overrides and actions can also be entered in the YAML editor.</small></div></details>
      ${this.jsonError ? html`<p class="error" role="alert">${this.jsonError}</p>` : nothing}
    </div>`;
  }
}
