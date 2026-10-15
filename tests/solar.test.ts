import { describe, expect, it } from 'vitest';
import '../src/index';
import { powerInWatts, sensorNumber, formatPower } from '../src/cards/solar';
import { validateConfig } from '../src/core/config';
import type { HassEntity, StillConfig } from '../src/core/types';

const sensor = (state: string, unit: string): HassEntity => ({ entity_id: 'sensor.test', state, attributes: { unit_of_measurement: unit } });
describe('solar readings and configuration', () => {
  it('keeps instantaneous power separate from energy and rejects missing/non-finite readings', () => {
    expect(powerInWatts(sensor('1.2', 'kW'))).toBe(1200);
    expect(powerInWatts(sensor('0', 'W'))).toBe(0);
    expect(powerInWatts(sensor('12', 'kWh'))).toBeUndefined();
    for (const state of ['unavailable', 'unknown', '', 'Infinity', 'NaN', 'no reading']) expect(sensorNumber(sensor(state, 'W'))).toBeUndefined();
    expect(powerInWatts()).toBeUndefined();
    expect(formatPower(undefined)).toBe('—');
    expect(formatPower(-2500, 'en')).toBe('2.5 kW');
  });
  it.each([
    { solar: [] }, { solar: { grid_power: 'switch.test' } }, { solar: { battery_level: 7 } },
    { solar: { grid_export_positive: 'true' } }, { layout: 'big' }, { show_presets: 'yes' },
  ])('rejects invalid sensor mapping or presentation option %j', (fields) => {
    expect(() => validateConfig({ type: 'custom:still-solar-card', entity: 'sensor.test', ...fields } as StillConfig)).toThrow();
  });
});
