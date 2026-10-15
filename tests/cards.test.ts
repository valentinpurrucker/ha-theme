import { afterEach, describe, expect, it, vi } from 'vitest';
import '../src/index';
import { StillCard } from '../src/still-card';
import { StillCardEditor } from '../src/editor';
import { getCardDefinitions, registerCardDefinition } from '../src/core/registry';
import { html } from 'lit';
import type { HassEntity, HomeAssistant, StillConfig } from '../src/core/types';

const entity = (id: string, state = 'on', attributes: Record<string, unknown> = {}): HassEntity => ({ entity_id: id, state, attributes: { friendly_name: 'Test device', ...attributes } });
const hass = (entities: HassEntity[]): HomeAssistant => ({ states: Object.fromEntries(entities.map((value) => [value.entity_id, value])), callService: vi.fn().mockResolvedValue(undefined), config: { unit_system: { temperature: '°C' } } });
async function card(config: StillConfig, value?: HomeAssistant) {
  const element = document.createElement('still-card') as StillCard;
  element.setConfig(config);
  element.hass = value;
  document.body.append(element);
  await element.updateComplete;
  return element;
}
afterEach(() => { document.body.replaceChildren(); vi.restoreAllMocks(); });

describe('card lifecycle and integration', () => {
  it('registers the collection and exposes Sections and masonry sizing', async () => {
    expect(getCardDefinitions()).toHaveLength(12);
    expect(window.customCards).toHaveLength(13);
    for (const entry of getCardDefinitions()) expect(customElements.get(`still-${entry.kind}-card`)).toBeDefined();
    const element = await card({ type: 'custom:still-climate-card', entity: 'climate.test' });
    expect(element.getGridOptions()).toMatchObject({ columns: 12, min_columns: 9, rows: 6 });
    expect(element.getCardSize()).toBe(6);
    expect(StillCard.getConfigElement()).toBeInstanceOf(StillCardEditor);
  });

  it('uses latest state and localized labels without mutating inputs', async () => {
    const config: StillConfig = { type: 'custom:still-card', entity: 'sensor.test' };
    const value = hass([entity('sensor.test', '23', { unit_of_measurement: '°C' })]);
    value.formatEntityState = () => '23,0 °C';
    value.formatEntityName = () => 'Room temperature';
    const element = await card(config, value);
    config.name = 'Mutated';
    expect(element.shadowRoot!.textContent).toContain('Room temperature');
    expect(element.shadowRoot!.textContent).toContain('23,0 °C');
    expect(element.shadowRoot!.textContent).not.toContain('Mutated');
    element.hass = { ...value, formatEntityState: () => '24,0 °C', states: { 'sensor.test': entity('sensor.test', '24') } };
    await element.updateComplete;
    expect(element.shadowRoot!.textContent).toContain('24,0 °C');
  });

  it('requests contexts, acts without legacy hass, and unsubscribes on disconnect', async () => {
    const unsubscribe = vi.fn();
    const callService = vi.fn().mockResolvedValue(undefined);
    const parent = document.createElement('div');
    parent.addEventListener('context-request', (event) => {
      const request = event as Event & { context: string; callback: (value: unknown, stop: () => void) => void };
      if (request.context === 'states') request.callback({ 'light.test': entity('light.test', 'on', { supported_color_modes: ['onoff'] }) }, unsubscribe);
      if (request.context === 'hassApi') request.callback({ callService }, unsubscribe);
    });
    document.body.append(parent);
    const element = document.createElement('still-card') as StillCard;
    element.setConfig({ type: 'custom:still-light-card', entity: 'light.test' });
    parent.append(element);
    await element.updateComplete;
    element.shadowRoot!.querySelector<HTMLButtonElement>('[role=switch]')!.click();
    await vi.waitFor(() => expect(callService).toHaveBeenCalledWith('light', 'toggle', { entity_id: 'light.test' }, undefined));
    element.remove();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it('does not rerender for unrelated entity updates', async () => {
    const value = hass([entity('sensor.test', '3'), entity('sensor.other', '7')]);
    const element = await card({ type: 'custom:still-card', entity: 'sensor.test' }, value);
    const spy = vi.spyOn(element, 'requestUpdate');
    element.hass = { ...value, states: { ...value.states, 'sensor.other': entity('sensor.other', '8') } };
    expect(spy).not.toHaveBeenCalled();
  });

  it.each(['unknown', 'unavailable'])('handles %s and missing entities without device commands', async (state) => {
    const value = hass([entity('light.test', state)]);
    const element = await card({ type: 'custom:still-card', entity: 'light.test' }, value);
    expect(element.shadowRoot!.querySelector('input')).toBeNull();
    expect(element.shadowRoot!.textContent?.toLowerCase()).toContain(state);
    expect(value.callService).not.toHaveBeenCalled();
    element.hass = { ...value, states: {} };
    await element.updateComplete;
    expect(element.shadowRoot!.textContent).toContain('Entity not found');
  });

  it('applies card tokens and removes previous overrides', async () => {
    const element = await card({ type: 'custom:still-title-card', name: 'Hello', style: { accent: '#123456', radius: '8px' } });
    expect(element.style.getPropertyValue('--still-accent')).toBe('#123456');
    element.setConfig({ type: 'custom:still-title-card', name: 'Hello' });
    expect(element.style.getPropertyValue('--still-accent')).toBe('');
  });

  it('exposes service errors and prevents concurrent commands', async () => {
    let reject!: (reason: Error) => void;
    const value = hass([entity('light.test', 'on', { supported_color_modes: ['onoff'] })]);
    value.callService = vi.fn().mockImplementation(() => new Promise((_, fail) => { reject = fail; }));
    const element = await card({ type: 'custom:still-card', entity: 'light.test' }, value);
    const toggle = element.shadowRoot!.querySelector<HTMLButtonElement>('[role=switch]')!;
    toggle.click(); toggle.click();
    expect(value.callService).toHaveBeenCalledTimes(1);
    await element.updateComplete;
    expect(toggle.disabled).toBe(true);
    reject(new Error('Device rejected the action'));
    await vi.waitFor(() => expect(element.shadowRoot!.querySelector('[role=alert]')?.textContent).toContain('Device rejected the action'));
    expect(toggle.disabled).toBe(false);
  });

  it('supports an explicit native more-info header action without toggling', async () => {
    const value = hass([entity('light.test')]);
    const element = await card({ type: 'custom:still-card', entity: 'light.test', tap_action: { action: 'more-info' } }, value);
    const listener = vi.fn(); document.body.addEventListener('hass-more-info', listener, { once: true });
    element.shadowRoot!.querySelector<HTMLButtonElement>('.head-button')!.click();
    expect(listener.mock.calls[0][0].detail).toEqual({ entityId: 'light.test' });
    expect(value.callService).not.toHaveBeenCalled();
  });
});

describe('domain controls', () => {
  it('opens a tile’s full controls in a detail sheet and preserves it across updates', async () => {
    const config: StillConfig = { type: 'custom:still-light-card', entity: 'light.test', layout: 'tile' };
    const value = hass([entity('light.test', 'on', { supported_color_modes: ['brightness'], brightness: 128 })]);
    const element = await card(config, value);
    expect(element.shadowRoot!.querySelector('input')).toBeNull();
    expect(element.getCardSize()).toBe(3);
    element.shadowRoot!.querySelector<HTMLButtonElement>('.head-button')!.click();
    await element.updateComplete;
    expect(element.shadowRoot!.querySelector('dialog')?.open).toBe(true);
    expect(element.shadowRoot!.querySelector('dialog input[aria-label=Brightness]')).not.toBeNull();
    expect(value.callService).not.toHaveBeenCalled();
    element.setConfig({ ...config });
    element.hass = { ...value, states: { 'light.test': entity('light.test', 'off', { supported_color_modes: ['brightness'] }) } };
    await element.updateComplete;
    expect(element.shadowRoot!.querySelector('dialog')?.open).toBe(true);
    expect(element.shadowRoot!.querySelector<HTMLButtonElement>('dialog [role=switch]')!.getAttribute('aria-checked')).toBe('false');
    element.setConfig({ ...config, entity: 'light.other' });
    await element.updateComplete;
    expect(element.shadowRoot!.querySelector('dialog')).toBeNull();
  });

  it('uses the entity preset names and feature flag without inventing modes', async () => {
    const value = hass([entity('climate.test', 'heat', { temperature: 22, supported_features: 17, preset_modes: ['home', 'eco', 'my_custom_mode'], preset_mode: 'eco' })]);
    const element = await card({ type: 'custom:still-climate-card', entity: 'climate.test' }, value);
    const presets = element.shadowRoot!.querySelectorAll<HTMLButtonElement>('.preset');
    expect([...presets].map((button) => button.textContent)).toEqual(['Home', 'Eco', 'My custom mode']);
    expect(presets[1].getAttribute('aria-pressed')).toBe('true');
    presets[2].click();
    await vi.waitFor(() => expect(value.callService).toHaveBeenCalledWith('climate', 'set_preset_mode', { entity_id: 'climate.test', preset_mode: 'my_custom_mode' }, undefined));
    element.hass = { ...value, states: { 'climate.test': entity('climate.test', 'heat', { supported_features: 1, preset_modes: ['eco'] }) } };
    await element.updateComplete;
    expect(element.shadowRoot!.querySelector('.preset')).toBeNull();
    element.setConfig({ type: 'custom:still-climate-card', entity: 'climate.test', show_presets: false });
    element.hass = value;
    await element.updateComplete;
    expect(element.shadowRoot!.querySelector('.preset')).toBeNull();
  });

  it('automatically chooses a toggle and calls its device domain', async () => {
    const value = hass([entity('input_boolean.test', 'off')]);
    const element = await card({ type: 'custom:still-card', entity: 'input_boolean.test' }, value);
    expect(element.shadowRoot!.querySelector('ha-card')?.getAttribute('data-kind')).toBe('toggle');
    element.shadowRoot!.querySelector<HTMLButtonElement>('[role=switch]')!.click();
    expect(value.callService).toHaveBeenCalledWith('input_boolean', 'toggle', { entity_id: 'input_boolean.test' }, undefined);
  });

  it('updates solar from related sensors, handles zero charge, and reverses grid signs explicitly', async () => {
    const config: StillConfig = { type: 'custom:still-solar-card', entity: 'sensor.solar', solar: { home_power: 'sensor.home', grid_power: 'sensor.grid', battery_level: 'sensor.battery', energy_today: 'sensor.today' } };
    const value = hass([entity('sensor.solar', '4200', { unit_of_measurement: 'W' }), entity('sensor.home', '1.6', { unit_of_measurement: 'kW' }), entity('sensor.grid', '-1400', { unit_of_measurement: 'W' }), entity('sensor.battery', '0', { unit_of_measurement: '%' }), entity('sensor.today', '18600', { unit_of_measurement: 'Wh' })]);
    const element = await card(config, value);
    expect(element.shadowRoot!.textContent).toContain('4.2 kW');
    expect(element.shadowRoot!.textContent).toContain('1.6 kW');
    expect(element.shadowRoot!.textContent).toContain('Exporting');
    expect(element.shadowRoot!.textContent).toContain('0%');
    expect(element.shadowRoot!.textContent).toContain('18.6 kWh');
    element.hass = { ...value, states: { ...value.states, 'sensor.home': entity('sensor.home', '800', { unit_of_measurement: 'W' }) } };
    await element.updateComplete;
    expect(element.shadowRoot!.textContent).toContain('800 W');
    element.setConfig({ ...config, solar: { ...config.solar, grid_export_positive: true } });
    await element.updateComplete;
    expect(element.shadowRoot!.textContent).toContain('Importing');
    element.hass = { ...value, states: { ...value.states, 'sensor.grid': entity('sensor.grid', 'unavailable') } };
    await element.updateComplete;
    expect(element.shadowRoot!.textContent).not.toContain('Importing');
    expect(value.callService).not.toHaveBeenCalled();
  });

  it('hides a dimmer on an on/off light and sends brightness only on change', async () => {
    const value = hass([entity('light.test', 'on', { supported_color_modes: ['onoff'] })]);
    const element = await card({ type: 'custom:still-card', entity: 'light.test' }, value);
    expect(element.shadowRoot!.querySelector('input')).toBeNull();
    element.hass = { ...value, states: { 'light.test': entity('light.test', 'on', { supported_color_modes: ['brightness'], brightness: 128 }) } };
    await element.updateComplete;
    const slider = element.shadowRoot!.querySelector<HTMLInputElement>('input')!;
    slider.value = '35'; slider.dispatchEvent(new Event('input', { bubbles: true }));
    expect(value.callService).not.toHaveBeenCalled();
    slider.dispatchEvent(new Event('change', { bubbles: true }));
    expect(value.callService).toHaveBeenCalledWith('light', 'turn_on', { entity_id: 'light.test', brightness_pct: 35 }, undefined);
  });

  it('restores a rejected slider edit to the Home Assistant state', async () => {
    const value = hass([entity('light.test', 'on', { supported_color_modes: ['brightness'], brightness: 128 })]);
    value.callService = vi.fn().mockRejectedValue(new Error('Permission denied'));
    const element = await card({ type: 'custom:still-light-card', entity: 'light.test' }, value);
    const slider = element.shadowRoot!.querySelector<HTMLInputElement>('input')!;
    slider.value = '35';
    slider.dispatchEvent(new Event('input', { bubbles: true }));
    slider.dispatchEvent(new Event('change', { bubbles: true }));
    await vi.waitFor(() => expect(element.shadowRoot!.querySelector('[role=alert]')?.textContent).toContain('Permission denied'));
    expect(slider.value).toBe('50');
    expect(element.shadowRoot!.querySelector('output')!.value).toBe('50%');
  });

  it('honors thermostat step, bounds, and Fahrenheit', async () => {
    const value = hass([entity('climate.test', 'heat', { temperature: 73, current_temperature: 72, target_temp_step: 1, min_temp: 60, max_temp: 74, supported_features: 1 })]);
    value.config = { unit_system: { temperature: '°F' } };
    const element = await card({ type: 'custom:still-card', entity: 'climate.test' }, value);
    expect(element.shadowRoot!.textContent).toContain('°F');
    element.shadowRoot!.querySelector<HTMLButtonElement>('[aria-label="Increase target temperature"]')!.click();
    expect(value.callService).toHaveBeenCalledWith('climate', 'set_temperature', { entity_id: 'climate.test', temperature: 74 }, undefined);
  });

  it('offers more-info for a dual-setpoint thermostat', async () => {
    const element = await card({ type: 'custom:still-card', entity: 'climate.test' }, hass([entity('climate.test', 'heat_cool', { target_temp_low: 19, target_temp_high: 24, supported_features: 3 })]));
    expect(element.shadowRoot!.textContent).toContain('19–24');
    expect(element.shadowRoot!.querySelector('[aria-label="Increase target temperature"]')).toBeNull();
    expect(element.shadowRoot!.textContent).toContain('Edit temperature range');
  });

  it('selects the actual HVAC mode on its first render', async () => {
    const element = await card({ type: 'custom:still-climate-card', entity: 'climate.test' }, hass([entity('climate.test', 'heat', { temperature: 22, hvac_modes: ['off', 'heat', 'cool'], supported_features: 1 })]));
    expect(element.shadowRoot!.querySelector<HTMLSelectElement>('select')!.value).toBe('heat');
  });

  it('gates media commands by both feature flags and state', async () => {
    const value = hass([entity('media_player.test', 'playing', { supported_features: 1 })]);
    const element = await card({ type: 'custom:still-card', entity: 'media_player.test' }, value);
    expect(element.shadowRoot!.querySelector('[aria-label=Pause]')).not.toBeNull();
    expect(element.shadowRoot!.querySelector('[aria-label="Next track"]')).toBeNull();
    element.hass = { ...value, states: { 'media_player.test': entity('media_player.test', 'paused', { supported_features: 1 }) } };
    await element.updateComplete;
    expect(element.shadowRoot!.querySelector('[aria-label=Play]')).toBeNull();
  });

  it('uses cover-specific commands and hides unsupported controls', async () => {
    const value = hass([entity('cover.test', 'closed', { supported_features: 1 })]);
    const element = await card({ type: 'custom:still-card', entity: 'cover.test' }, value);
    expect(element.shadowRoot!.querySelectorAll('.control')).toHaveLength(1);
    expect(element.shadowRoot!.querySelector('input')).toBeNull();
    element.shadowRoot!.querySelector<HTMLButtonElement>('[aria-label="Open cover"]')!.click();
    expect(value.callService).toHaveBeenCalledWith('cover', 'open_cover', { entity_id: 'cover.test' }, undefined);
  });

  it.each(['scene', 'script', 'button', 'input_button'])('activates a %s without a toggle', async (domain) => {
    const value = hass([entity(`${domain}.test`, 'ready')]);
    const element = await card({ type: 'custom:still-card', entity: `${domain}.test` }, value);
    expect(element.shadowRoot!.querySelector('[role=switch]')).toBeNull();
    element.shadowRoot!.querySelector<HTMLButtonElement>('.control')!.click();
    expect(value.callService).toHaveBeenCalledWith(domain, domain.includes('button') ? 'press' : 'turn_on', { entity_id: `${domain}.test` }, undefined);
  });

  it('keeps unavailable chip more-info accessible', async () => {
    const element = await card({ type: 'custom:still-chips-card', chips: [{ entity: 'sensor.test' }] }, hass([entity('sensor.test', 'unavailable')]));
    expect(element.shadowRoot!.querySelector<HTMLButtonElement>('.chip')!.disabled).toBe(false);
    expect(element.getGridOptions().rows).toBeUndefined();
  });

  it('supports extension definitions through the shared renderer', async () => {
    registerCardDefinition({ kind: 'test-extension', name: 'Extension', description: 'Test', icon: 'mdi:leaf', rows: 2, requiresEntity: false, render: () => html`<p>Extension content</p>` });
    const element = await card({ type: 'custom:still-card', kind: 'test-extension' });
    expect(element.shadowRoot!.textContent).toContain('Extension content');
    expect(() => registerCardDefinition(getCardDefinitions().at(-1)!)).toThrow('already registered');
  });
});

describe('visual editor', () => {
  it('selects its configured kind, finish, and density on first render', async () => {
    const editor = document.createElement('still-card-editor') as StillCardEditor;
    editor.setConfig({ type: 'custom:still-light-card', entity: 'light.test', variant: 'minimal', density: 'compact' });
    document.body.append(editor);
    await editor.updateComplete;
    const selections = Array.from(editor.shadowRoot!.querySelectorAll('select'));
    expect(selections.map((select) => select.value)).toEqual(['light', 'minimal', 'compact', 'panel']);
  });

  it('emits a composed config event while preserving advanced options', async () => {
    const editor = document.createElement('still-card-editor') as StillCardEditor;
    editor.setConfig({ type: 'custom:still-entity-card', entity: 'sensor.test', style: { radius: '12px' }, tap_action: { action: 'none' } });
    document.body.append(editor);
    await editor.updateComplete;
    const listener = vi.fn(); editor.addEventListener('config-changed', listener);
    const input = editor.shadowRoot!.querySelector<HTMLInputElement>('input[list=entities]')!;
    input.value = 'sensor.changed'; input.dispatchEvent(new Event('change'));
    const event = listener.mock.calls[0][0];
    expect(event.bubbles).toBe(true); expect(event.composed).toBe(true);
    expect(event.detail.config).toMatchObject({ entity: 'sensor.changed', style: { radius: '12px' }, tap_action: { action: 'none' } });
  });
});
