import './icons';
import '../src/index';
import './style.css';
import { LitElement, html, nothing } from 'lit';
import { ref } from 'lit/directives/ref.js';
import { repeat } from 'lit/directives/repeat.js';
import { stringify } from 'yaml';
import { createMockHass } from './mock-hass';
import { getCardDefinitions } from '../src/core/registry';
import { validateConfig } from '../src/core/config';
import type { HomeAssistant, StillConfig } from '../src/core/types';
import type { StillCard } from '../src/still-card';
import type { StillCardEditor } from '../src/editor';

type Entry = { id: string; room: string; config: StillConfig };
const entries: Entry[] = [
  { id: 'light', room: 'Living room', config: { type: 'custom:still-light-card', entity: 'light.living_room', name: 'Reading light' } },
  { id: 'climate', room: 'Living room', config: { type: 'custom:still-climate-card', entity: 'climate.living_room', name: 'Just the right temperature' } },
  { id: 'media', room: 'Living room', config: { type: 'custom:still-media-card', entity: 'media_player.living_room', name: 'A little background music' } },
  { id: 'cover', room: 'Living room', config: { type: 'custom:still-cover-card', entity: 'cover.living_room', name: 'Linen curtains' } },
  { id: 'bedside', room: 'Bedroom', config: { type: 'custom:still-light-card', entity: 'light.bedroom', name: 'Bedside lamp' } },
  { id: 'fan', room: 'Bedroom', config: { type: 'custom:still-fan-card', entity: 'fan.bedroom', name: 'A breath of fresh air' } },
  { id: 'switch', room: 'Kitchen', config: { type: 'custom:still-entity-card', entity: 'switch.coffee_machine', name: 'Coffee machine' } },
  { id: 'scene', room: 'Living room', config: { type: 'custom:still-scene-card', entity: 'scene.slow_evening', name: 'Slow evening', subtitle: 'Dim the lights. Take a breath.' } },
  { id: 'night', room: 'Bedroom', config: { type: 'custom:still-scene-card', entity: 'scene.goodnight', name: 'Good night', icon: 'mdi:weather-night', subtitle: 'Let the house wind down.' } },
];
const accents = [{ name: 'Sage', value: '#4c745d', dark: '#a8c5ae' }, { name: 'Clay', value: '#996956', dark: '#d9ad95' }, { name: 'Ocean', value: '#4a6f91', dark: '#a0bbd9' }, { name: 'Graphite', value: '#5f606b', dark: '#c1c1cf' }];

class StillDemo extends LitElement {
  static properties = { page: { state: true }, room: { state: true }, appearance: { state: true }, accent: { state: true }, radius: { state: true }, variant: { state: true }, density: { state: true }, toast: { state: true }, hass: { state: true }, editing: { state: true }, editorError: { state: true }, infoId: { state: true }, studioOpen: { state: true }, overrides: { state: true } };
  private page = 'overview';
  private room = 'All rooms';
  private appearance = 'light';
  private accent = 0;
  private radius = 22;
  private variant: StillConfig['variant'] = 'soft';
  private density: StillConfig['density'] = 'comfortable';
  private toast = '';
  private hass!: HomeAssistant;
  private editing?: Entry;
  private editorPreview?: StillConfig;
  private editorError = '';
  private infoId = '';
  private studioOpen = true;
  private overrides: Record<string, StillConfig> = {};
  private toastTimer?: ReturnType<typeof setTimeout>;
  private returnFocus?: HTMLElement;
  private pendingFocus = false;

  createRenderRoot() { return this; }

  constructor() {
    super();
    try {
      const saved = JSON.parse(localStorage.getItem('still-style') ?? '{}');
      if (['light', 'dark'].includes(saved.appearance)) this.appearance = saved.appearance;
      if (Number.isInteger(saved.accent) && saved.accent >= 0 && saved.accent < accents.length) this.accent = saved.accent;
      if (saved.radius >= 8 && saved.radius <= 32) this.radius = saved.radius;
      if (['soft', 'outlined', 'minimal'].includes(saved.variant)) this.variant = saved.variant;
      if (['comfortable', 'compact'].includes(saved.density)) this.density = saved.density;
    } catch { /* Local storage may be disabled. The defaults still work. */ }
    this.hass = createMockHass((hass) => { this.hass = hass; }, (service) => this.notify(`${service} · demo state updated`), () => this.hass.states);
  }

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('hass-more-info', this.onInfo as EventListener);
    window.addEventListener('keydown', this.onKey);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('keydown', this.onKey);
    this.removeEventListener('hass-more-info', this.onInfo as EventListener);
    clearTimeout(this.toastTimer);
  }

  private onInfo = (event: CustomEvent<{ entityId: string }>) => {
    this.openDialog();
    this.infoId = event.detail.entityId;
  };

  private onKey = (event: KeyboardEvent) => {
    if (!this.editing && !this.infoId) return;
    if (event.key === 'Escape') this.closeDialog();
    if (event.key === 'Tab') {
      const dialog = this.querySelector('.dialog');
      const nodes: HTMLElement[] = [];
      const visit = (root: ParentNode) => root.querySelectorAll<HTMLElement>('*').forEach((node) => {
        if (node.matches('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea, summary, a[href]') && node.getClientRects().length) nodes.push(node);
        if (node.shadowRoot) visit(node.shadowRoot);
      });
      if (dialog) visit(dialog);
      const first = nodes[0], last = nodes.at(-1);
      let active = document.activeElement;
      while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
      if (event.shiftKey && active === first) { event.preventDefault(); last?.focus(); }
      if (!event.shiftKey && active === last) { event.preventDefault(); first?.focus(); }
    }
  };

  private openDialog() { this.returnFocus = document.activeElement as HTMLElement; this.pendingFocus = true; }
  private closeDialog() { this.editing = undefined; this.infoId = ''; this.editorError = ''; this.returnFocus?.focus(); }

  updated() {
    const theme = accents[this.accent];
    document.documentElement.dataset.appearance = this.appearance;
    document.documentElement.style.setProperty('--still-accent', this.appearance === 'dark' ? theme.dark : theme.value);
    document.documentElement.style.setProperty('--still-radius', `${this.radius}px`);
    document.documentElement.style.setProperty('--still-on-accent', this.appearance === 'dark' ? '#1c2b20' : '#fff');
    try { localStorage.setItem('still-style', JSON.stringify({ appearance: this.appearance, accent: this.accent, radius: this.radius, variant: this.variant, density: this.density })); } catch { /* Preview works without storage. */ }
    if (this.pendingFocus) { this.querySelector<HTMLElement>('.dialog button')?.focus(); this.pendingFocus = false; }
  }

  private icon(name: string) { return html`<ha-icon .icon=${name} aria-hidden="true"></ha-icon>`; }

  private notify(text: string) { clearTimeout(this.toastTimer); this.toast = text; this.toastTimer = setTimeout(() => { this.toast = ''; }, 3500); }

  private config(entry: Entry): StillConfig { return { ...entry.config, ...this.overrides[entry.id], variant: this.variant, density: this.density }; }

  private card(config: StillConfig, id = '') {
    return html`<still-card data-demo-id=${id} ${ref((element) => { if (element) (element as StillCard).setConfig(config); })} .hass=${this.hass}></still-card>`;
  }

  private edit(entry: Entry) { this.openDialog(); this.editorPreview = this.config(entry); this.editing = { ...entry, config: this.editorPreview }; }

  private async copy(text: string) {
    try { await navigator.clipboard.writeText(text); this.notify('Copied to clipboard'); }
    catch { this.notify('Clipboard is unavailable here. Select and copy the text.'); }
  }

  private downloadTheme() {
    const chosen = accents[this.accent];
    const yaml = stringify({ 'Still Custom': { 'primary-color': chosen.value, 'accent-color': chosen.value, 'still-accent': 'var(--primary-color)', 'still-radius': `${this.radius}px`, 'still-padding': this.density === 'compact' ? '14px' : '20px', 'still-font': 'system-ui, sans-serif', 'ha-card-border-radius': `${this.radius}px`, modes: { light: { 'primary-background-color': '#f5f6f2', 'primary-text-color': '#28332e', 'secondary-text-color': '#606a62', 'card-background-color': '#ffffff', 'still-surface': '#ffffff', 'still-muted': '#606a62', 'still-border-color': '#e3e8df', 'still-subtle': '#f1f4ee', 'still-on-accent': '#ffffff' }, dark: { 'primary-color': chosen.dark, 'accent-color': chosen.dark, 'primary-background-color': '#191f1c', 'primary-text-color': '#e6ece3', 'secondary-text-color': '#a5afa5', 'card-background-color': '#242c26', 'still-surface': '#242c26', 'still-muted': '#a5afa5', 'still-border-color': '#354036', 'still-subtle': '#2c352e', 'still-on-accent': '#1c2b20' } } } });
    const url = URL.createObjectURL(new Blob([yaml], { type: 'text/yaml' }));
    const link = document.createElement('a'); link.href = url; link.download = 'still-custom.yaml'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    this.notify('Your theme is downloaded. Card variant is set per card.');
  }

  private reset() { this.appearance = 'light'; this.accent = 0; this.radius = 22; this.variant = 'soft'; this.density = 'comfortable'; this.notify('Back to a quiet beginning'); }

  private sidebar() {
    return html`<aside class="sidebar"><a class="brand" href="#" @click=${(event: Event) => { event.preventDefault(); this.page = 'overview'; }}><span class="brand-mark">${this.icon('mdi:leaf')}</span><span>still<span class="brand-dot">.</span></span></a><div class="brand-caption">HOME, IN BALANCE</div>
      <div class="nav-label">YOUR SPACE</div><nav aria-label="Main navigation">
        ${[['overview', 'Overview', 'mdi:view-dashboard-outline'], ['cards', 'Card collection', 'mdi:view-grid-outline'], ['setup', 'Getting started', 'mdi:code-tags']].map(([page, label, icon]) => html`<button class="nav-item ${this.page === page ? 'selected' : ''}" aria-current=${this.page === page ? 'page' : nothing} @click=${() => { this.page = page; window.scrollTo(0, 0); }}>${this.icon(icon)}${label}${page === 'cards' ? html`<span class="nav-count">10</span>` : nothing}</button>`)}
      </nav><div class="sidebar-note">Less noise.<br />More home.<span>A collection for<br />Home Assistant.</span></div><div class="profile"><span class="avatar">A</span><div>Alex's home<small>Local demo</small></div><span class="online-dot"></span></div>
    </aside>`;
  }

  private studio() {
    return html`<aside class="studio ${this.studioOpen ? 'open' : ''}" aria-label="Style studio"><div class="studio-heading"><span class="studio-symbol">${this.icon('mdi:tune-variant')}</span><h2>Make it yours</h2><span class="small-badge">LIVE</span></div><p class="studio-intro">One design language.<br />A style that feels like you.</p>
      <div class="studio-group"><span class="field-label">Appearance</span><div class="segmented">${['light', 'dark'].map((mode) => html`<button class=${this.appearance === mode ? 'active' : ''} aria-pressed=${this.appearance === mode} @click=${() => { this.appearance = mode; }}>${this.icon(mode === 'light' ? 'mdi:weather-partly-cloudy' : 'mdi:weather-night')}${mode === 'light' ? 'Daylight' : 'After dark'}</button>`)}</div></div>
      <div class="studio-group"><span class="field-label">Accent <span>${accents[this.accent].name}</span></span><div class="swatches">${accents.map((accent, index) => html`<button class="swatch ${this.accent === index ? 'active' : ''}" style=${`--swatch:${accent.value}`} aria-label=${`${accent.name} accent`} aria-pressed=${this.accent === index} @click=${() => { this.accent = index; }}>${this.accent === index ? this.icon('mdi:check') : nothing}</button>`)}</div></div>
      <div class="studio-group"><span class="field-label">Card finish</span><div class="finish-options">${(['soft', 'outlined', 'minimal'] as const).map((variant) => html`<button class="finish ${this.variant === variant ? 'active' : ''}" aria-pressed=${this.variant === variant} @click=${() => { this.variant = variant; }}><span class="finish-preview ${variant}"><i></i><b></b></span>${variant === 'soft' ? 'Soft' : variant === 'outlined' ? 'Outline' : 'Minimal'}</button>`)}</div></div>
      <div class="studio-group"><label class="field-label" for="radius">Roundness <span>${this.radius}px</span></label><input id="radius" aria-label="Card roundness" type="range" min="8" max="32" .value=${String(this.radius)} @input=${(event: Event) => { this.radius = Number((event.target as HTMLInputElement).value); }} /><div class="range-endpoints"><span>Subtle</span><span>Friendly</span></div></div>
      <div class="studio-group"><span class="field-label">Spacing</span><div class="segmented">${(['comfortable', 'compact'] as const).map((density) => html`<button class=${this.density === density ? 'active' : ''} aria-pressed=${this.density === density} @click=${() => { this.density = density; }}>${density === 'comfortable' ? 'Relaxed' : 'Compact'}</button>`)}</div></div>
      <div class="studio-tip">${this.icon('mdi:creation-outline')}<p>Shared tokens keep every card in tune. Change once, feel it everywhere.</p></div><button class="download-button" @click=${this.downloadTheme}>${this.icon('mdi:download')}Export your theme</button><button class="reset-button" @click=${this.reset}>${this.icon('mdi:refresh')}Reset to Still</button><span class="studio-footnote">No account. No cloud. Just your style.</span>
    </aside>`;
  }

  private overview() {
    const visible = entries.filter((entry) => this.room === 'All rooms' || entry.room === this.room);
    const live = this.hass.states['light.living_room'].state !== 'unavailable';
    return html`<div class="welcome"><div><div class="eyebrow">A MOMENT FOR HOME</div><h1>Good evening, Alex<span>.</span></h1><p>The day can slow down now.</p></div><span class="welcome-leaf">${this.icon('mdi:leaf')}</span></div>
      <div class="home-summary">${this.card({ type: 'custom:still-weather-card', entity: 'weather.home', name: 'A little fresh air', variant: this.variant, density: this.density }, 'weather')}${this.card({ type: 'custom:still-entity-card', entity: 'sensor.daily_energy', name: 'Energy today', variant: this.variant, density: this.density, subtitle: 'Small footprint. Good feeling.' }, 'energy')}</div>
      <div class="section-heading"><div><h2>Your home, at a glance</h2><p>A few small comforts, all in one place.</p></div>${this.card({ type: 'custom:still-chips-card', chips: [{ content: 'Home', icon: 'mdi:home-outline' }, { entity: 'sensor.indoor_temperature', icon: 'mdi:thermometer', content: '21.5 °C inside' }] }, 'chips')}</div>
      <div class="room-tabs" role="group" aria-label="Filter by room">${['All rooms', 'Living room', 'Bedroom', 'Kitchen'].map((room) => html`<button class=${this.room === room ? 'active' : ''} aria-pressed=${this.room === room} @click=${() => { this.room = room; }}>${room}</button>`)}</div>
      <div class="dashboard-grid">${repeat(visible, (entry) => entry.id, (entry) => html`<div class="card-cell">${this.card(this.config(entry), entry.id)}<button class="edit-card" aria-label=${`Edit ${entry.config.name}`} title="Edit card" @click=${() => this.edit(entry)}>${this.icon('mdi:cog-outline')}</button></div>`)}</div>
      <div class="demo-footer"><span><span class="online-dot"></span> Interactive preview · sample devices</span><button @click=${() => { const entity = this.hass.states['light.living_room']; this.hass = { ...this.hass, states: { ...this.hass.states, 'light.living_room': { ...entity, state: live ? 'unavailable' : 'on' } } }; this.notify(live ? 'Reading light is now unavailable' : 'Reading light reconnected'); }}>${live ? 'Try an unavailable device' : 'Reconnect reading light'}${this.icon('mdi:arrow-top-right')}</button></div>`;
  }

  private collection() {
    return html`<div class="page-heading"><div class="eyebrow">THE COLLECTION</div><h1>A place for every thing<span>.</span></h1><p>Ten cards. One calm, consistent system.</p></div><div class="collection-grid">${getCardDefinitions().map((definition) => {
      const entry = entries.find((entry) => entry.id === definition.kind) ?? (definition.kind === 'entity' ? { id: 'entity', room: '', config: { type: 'custom:still-entity-card', entity: 'sensor.humidity', name: 'Humidity' } } : definition.kind === 'weather' ? { id: 'weather', room: '', config: { type: 'custom:still-weather-card', entity: 'weather.home', name: 'Outside' } } : definition.kind === 'title' ? { id: 'title', room: '', config: { type: 'custom:still-title-card', name: 'The little things', subtitle: 'Give your dashboard a little breathing room.' } } : { id: 'chips', room: '', config: { type: 'custom:still-chips-card', chips: [{ entity: 'person.alex', name: 'Alex', icon: 'mdi:home-outline' }, { entity: 'sensor.indoor_temperature', icon: 'mdi:thermometer' }] } });
      return html`<section class="collection-item"><div class="collection-label"><h2>${definition.name}</h2><button @click=${() => this.edit(entry)} aria-label=${`Configure ${definition.name}`}>${this.icon('mdi:code-tags')}</button></div><p>${definition.description}</p>${this.card(this.config(entry), `collection-${definition.kind}`)}</section>`;
    })}</div>`;
  }

  private setup() {
    const resource = '- url: /hacsfiles/ha-theme/still-cards.js\n  type: module';
    const theme = 'frontend:\n  themes: !include_dir_merge_named themes';
    const sample = stringify({ type: 'custom:still-light-card', entity: 'light.living_room', name: 'Reading light', variant: this.variant, density: this.density });
    return html`<div class="page-heading"><div class="eyebrow">MAKE YOURSELF AT HOME</div><h1>Small steps. A calmer home<span>.</span></h1><p>A single card bundle, a theme, and your own devices.</p></div><div class="setup-list">
      ${[[1, 'Bring the cards home', 'In HACS, open Custom repositories, add https://github.com/valentinpurrucker/ha-theme, and choose Dashboard. Download Still Cards and refresh Home Assistant. HACS adds the module automatically in storage mode; use this resource in YAML mode. A public repository and published release are required.', resource], [2, 'Set the mood', 'Copy themes/still.yaml to config/themes. Merge this into your existing configuration.yaml, restart if you just enabled themes, and select Still in your profile. Use frontend.reload_themes after later edits.', theme], [3, 'Add your first card', 'Choose a Still card in the dashboard editor, or paste this YAML and replace the entity with one of your own. It works with Sections and masonry dashboards.', sample]].map(([number, title, description, code]) => html`<section class="setup-step"><span class="step-number">0${number}</span><div><h2>${title}</h2><p>${description}</p><div class="code-block"><pre><code>${code}</code></pre><button aria-label=${`Copy step ${number} code`} @click=${() => this.copy(String(code))}>${this.icon('mdi:content-copy')}</button></div></div></section>`)}</div><div class="setup-note">${this.icon('mdi:leaf')}<div><h2>Made to grow with your home</h2><p>Shared CSS tokens, a rendering registry, and one common card shell. Add a new card without rebuilding the design language. See the project's docs for configuration and extension examples.</p></div></div>`;
  }

  private dialog() {
    if (this.editing) {
      const editing = this.editing;
      return html`<div class="dialog-backdrop" @click=${(event: Event) => { if (event.target === event.currentTarget) this.closeDialog(); }}><section class="dialog editor-dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><div class="dialog-heading"><div><span class="eyebrow">YOUR CARD</span><h2 id="dialog-title">Make a small adjustment</h2></div><button class="icon-button" aria-label="Close editor" @click=${this.closeDialog}>${this.icon('mdi:close')}</button></div><div class="editor-layout"><div><still-card-editor ${ref((element) => { if (element) (element as StillCardEditor).setConfig(editing.config); })} .hass=${this.hass} @config-changed=${(event: CustomEvent<{ config: StillConfig }>) => { this.editing = { ...editing, config: event.detail.config }; try { validateConfig(event.detail.config); this.editorPreview = event.detail.config; this.editorError = ''; } catch (error) { this.editorError = (error as Error).message; } }}></still-card-editor>${this.editorError ? html`<p class="editor-error" role="alert">${this.editorError}</p>` : nothing}</div><aside class="editor-preview"><span class="field-label">Live preview</span>${this.card(this.editorPreview ?? editing.config, 'editor-preview')}<div class="code-block"><pre><code>${stringify(editing.config)}</code></pre><button aria-label="Copy card YAML" @click=${() => this.copy(stringify(editing.config))}>${this.icon('mdi:content-copy')}</button></div></aside></div><div class="dialog-actions"><span>Changes apply to this demo.</span><button class="primary-button" ?disabled=${!!this.editorError} @click=${() => { this.overrides = { ...this.overrides, [editing.id]: editing.config }; this.closeDialog(); this.notify('Card updated'); }}>Save card</button></div></section></div>`;
    }
    if (this.infoId) {
      const entity = this.hass.states[this.infoId];
      return html`<div class="dialog-backdrop" @click=${(event: Event) => { if (event.target === event.currentTarget) this.closeDialog(); }}><section class="dialog info-dialog" role="dialog" aria-modal="true" aria-labelledby="info-title"><div class="dialog-heading"><h2 id="info-title">${entity?.attributes.friendly_name ?? this.infoId}</h2><button class="icon-button" aria-label="Close details" @click=${this.closeDialog}>${this.icon('mdi:close')}</button></div><p class="info-state">${entity?.state}</p><code class="entity-id">${this.infoId}</code><dl class="attribute-list">${Object.entries(entity?.attributes ?? {}).map(([key, value]) => html`<div><dt>${key.replaceAll('_', ' ')}</dt><dd>${String(value)}</dd></div>`)}</dl><p class="info-note">In Home Assistant, this tap opens the native more-info dialog.</p></section></div>`;
    }
    return nothing;
  }

  render() {
    return html`<div class="app-shell" ?inert=${!!this.editing || !!this.infoId}>${this.sidebar()}<div class="main-shell"><header class="topbar"><div class="breadcrumb">Alex's home <span>/</span><strong>${this.page === 'overview' ? 'Overview' : this.page === 'cards' ? 'Card collection' : 'Getting started'}</strong></div><div class="topbar-right"><span class="preview-label"><span class="online-dot"></span>LOCAL PREVIEW</span><button class="customize-button" aria-pressed=${this.studioOpen} @click=${() => { this.studioOpen = !this.studioOpen; }}>${this.icon('mdi:tune-variant')}<span>Customize</span></button></div></header><div class="workspace ${this.studioOpen ? '' : 'studio-hidden'}"><main>${this.page === 'overview' ? this.overview() : this.page === 'cards' ? this.collection() : this.setup()}<footer class="page-footer"><span>still<span class="brand-dot">.</span></span><span>Thoughtfully simple. Quietly capable.</span><span>v0.1.0</span></footer></main>${this.studio()}</div></div></div>${this.dialog()}${this.toast ? html`<div class="toast" role="status">${this.icon('mdi:check')}${this.toast}</div>` : nothing}`;
  }
}

customElements.define('still-demo', StillDemo);
