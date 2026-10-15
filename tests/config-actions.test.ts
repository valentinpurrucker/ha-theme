import { describe, expect, it, vi, afterEach } from 'vitest';
import '../src/index';
import { validateConfig } from '../src/core/config';
import { performAction, toggleCommand } from '../src/core/actions';
import { nextTemperature, stateLabel } from '../src/core/entity';
import { parse } from 'yaml';
import { readFileSync } from 'node:fs';
import type { HomeAssistant, StillConfig } from '../src/core/types';

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
describe('configuration validation', () => {
  it.each([
    [{ type: 'custom:still-light-card' }, 'Choose an entity'],
    [{ type: 'custom:still-light-card', entity: 'switch.test' }, 'supports'],
    [{ type: 'custom:still-card', kind: 'nonexistent', entity: 'light.test' }, 'Unsupported'],
    [{ type: 'custom:still-chips-card', chips: [] }, 'at least one'],
    [{ type: 'custom:still-title-card', style: 'color:red' }, 'style'],
    [{ type: 'custom:still-card', entity: 'light.test', tap_action: { action: 'url', url_path: 'javascript:alert(1)' } }, 'HTTP'],
    [{ type: 'custom:still-card', entity: 'light.test', tap_action: { action: 'navigate', navigation_path: '//evil.test' } }, 'local'],
    [{ type: 'custom:still-card', entity: 'light.test', tap_action: { action: 'perform-action', perform_action: 'invalid' } }, 'domain.service'],
  ])('rejects invalid configuration %j', (config, message) => {
    expect(() => validateConfig(config as StillConfig)).toThrow(String(message));
  });

  it('validates every card in the Sections example and both theme modes', () => {
    const dashboard = parse(readFileSync('examples/dashboard.yaml', 'utf8'));
    for (const section of dashboard.views[0].sections) for (const config of section.cards) expect(() => validateConfig(config)).not.toThrow();
    const theme = parse(readFileSync('themes/still.yaml', 'utf8')).Still;
    expect(theme.modes.light['still-surface']).toBe('#ffffff');
    expect(theme.modes.dark['still-surface']).toBe('#242c26');
    expect(theme['still-radius']).toBe('22px');
  });
});

describe('actions and bounds', () => {
  const host = document.createElement('div');
  const value = (): HomeAssistant => ({ states: {}, callService: vi.fn().mockResolvedValue(undefined) });
  it('routes explicit targets without adding the card entity', async () => {
    const hass = value();
    await performAction(host, hass, { action: 'perform-action', perform_action: 'light.turn_on', target: { area_id: 'living_room' }, data: { brightness_pct: 30 } }, 'light.test');
    expect(hass.callService).toHaveBeenCalledWith('light', 'turn_on', { brightness_pct: 30 }, { area_id: 'living_room' });
  });
  it('defaults a custom service target to the card entity and retains legacy action syntax', async () => {
    const hass = value();
    await performAction(host, hass, { action: 'call-service', service: 'light.turn_on', service_data: { brightness_pct: 40 } }, 'light.test');
    expect(hass.callService).toHaveBeenCalledWith('light', 'turn_on', { brightness_pct: 40, entity_id: 'light.test' }, undefined);
  });
  it('honors a canceled explicit confirmation', async () => {
    const hass = value(); vi.stubGlobal('confirm', vi.fn().mockReturnValue(false));
    await performAction(host, hass, { action: 'toggle', confirmation: { text: 'Proceed?' } }, 'light.test');
    expect(window.confirm).toHaveBeenCalledWith('Proceed?');
    expect(hass.callService).not.toHaveBeenCalled();
  });
  it('does not treat covers, locks, or scenes as toggles', () => {
    expect(toggleCommand('cover.garage')).toBeUndefined();
    expect(toggleCommand('lock.front')).toBeUndefined();
    expect(toggleCommand('scene.night')).toBeUndefined();
  });
  it('guards runtime navigation and URL actions even outside card validation', async () => {
    await expect(performAction(host, value(), { action: 'url', url_path: 'data:text/html,test' })).rejects.toThrow('HTTP');
    await expect(performAction(host, value(), { action: 'navigate', navigation_path: 'https://evil.test' })).rejects.toThrow('local');
  });
  it('rounds temperature steps and clamps at both bounds', () => {
    const entity = { entity_id: 'climate.test', state: 'heat', attributes: { temperature: 20.2, min_temp: 20, max_temp: 20.3, target_temp_step: 0.1 } };
    expect(nextTemperature(entity, 1, '°C')).toBe(20.3);
    expect(nextTemperature({ ...entity, attributes: { ...entity.attributes, temperature: 20 } }, -1, '°C')).toBe(20);
    expect(nextTemperature({ ...entity, attributes: {} }, 1, '°C')).toBeUndefined();
  });
  it('keeps non-numeric sensors and missing attributes readable', () => {
    expect(stateLabel({ entity_id: 'sensor.test', state: 'good', attributes: {} })).toBe('Good');
    expect(stateLabel({ entity_id: 'sensor.test', state: '3', attributes: {} }, { type: '', attribute: 'missing' })).toBe('—');
  });
});
