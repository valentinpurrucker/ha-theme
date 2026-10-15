import { html, nothing } from 'lit';
import type { CardDefinition, HassEntity } from '../core/types';
import { available } from '../core/entity';

export function sensorNumber(entity?: HassEntity): number | undefined {
  if (!available(entity) || !entity?.state.trim()) return undefined;
  const value = Number(entity.state);
  return Number.isFinite(value) ? value : undefined;
}

export function powerInWatts(entity?: HassEntity): number | undefined {
  const value = sensorNumber(entity);
  const unit = entity?.attributes.unit_of_measurement;
  return value === undefined ? undefined : unit === 'W' ? value : unit === 'kW' ? value * 1000 : undefined;
}

export function formatPower(watts: number | undefined, language?: string): string {
  if (watts === undefined) return '—';
  const magnitude = Math.abs(watts);
  return magnitude >= 1000 ? `${new Intl.NumberFormat(language, { maximumFractionDigits: 2 }).format(magnitude / 1000)} kW` : `${new Intl.NumberFormat(language, { maximumFractionDigits: 0 }).format(magnitude)} W`;
}

export const solarDefinition: CardDefinition = {
  kind: 'solar', name: 'Solar', description: 'Live generation, home, grid, and battery in one place.', icon: 'mdi:solar-power-variant-outline', domains: ['sensor'], rows: 6,
  render(context) {
    const { entity, config, hass } = context;
    const sensors = config.solar ?? {};
    const read = (id?: string) => id ? hass?.states[id] : undefined;
    const positivePower = (sensor?: HassEntity) => { const value = powerInWatts(sensor); return value !== undefined && value >= 0 ? value : undefined; };
    const production = positivePower(entity);
    const gridRaw = powerInWatts(read(sensors.grid_power));
    const grid = gridRaw === undefined ? undefined : gridRaw * (sensors.grid_export_positive ? -1 : 1);
    const batteryEntity = read(sensors.battery_level);
    const batteryRaw = batteryEntity?.attributes.unit_of_measurement === '%' ? sensorNumber(batteryEntity) : undefined;
    const battery = batteryRaw !== undefined && batteryRaw >= 0 && batteryRaw <= 100 ? batteryRaw : undefined;
    const batteryPower = powerInWatts(read(sensors.battery_power));
    const energy = read(sensors.energy_today);
    const energyNumber = sensorNumber(energy);
    const energyUnit = energy?.attributes.unit_of_measurement;
    const daily = energyNumber !== undefined && energyNumber >= 0 && ['Wh', 'kWh'].includes(String(energyUnit)) ? energyNumber / (energyUnit === 'Wh' ? 1000 : 1) : undefined;
    const node = (label: string, value: string, icon: string, detail?: string) => html`<div class="energy-node"><span class="energy-icon">${context.icon(icon)}</span><strong>${value}</strong><span>${label}</span>${detail ? html`<small>${detail}</small>` : nothing}</div>`;
    return html`<div class="solar-generation"><div><span class="caption">Solar production</span><div class="value">${formatPower(production, hass?.language)}</div></div><span class="energy-status" ?data-generating=${production !== undefined && production > 0}><i></i>${production === undefined ? 'No reading' : production > 0 ? 'Generating' : 'Idle'}</span></div>
      ${sensors.home_power || sensors.grid_power || sensors.battery_level || sensors.battery_power ? html`<div class="energy-flow" aria-label="Current energy flow">
        ${sensors.home_power ? node('Home', formatPower(positivePower(read(sensors.home_power)), hass?.language), 'mdi:home-outline') : nothing}
        ${sensors.grid_power ? node(grid === undefined ? 'Grid' : grid > 0 ? 'Importing' : grid < 0 ? 'Exporting' : 'Grid idle', formatPower(grid, hass?.language), 'mdi:transmission-tower') : nothing}
        ${sensors.battery_level || sensors.battery_power ? node('Battery', sensors.battery_level ? battery === undefined ? '—' : `${battery}%` : formatPower(batteryPower, hass?.language), 'mdi:battery-outline', sensors.battery_level && sensors.battery_power ? formatPower(batteryPower, hass?.language) : undefined) : nothing}
      </div>` : nothing}
      ${sensors.energy_today ? html`<div class="energy-today"><span>${context.icon('mdi:chart-bar')}Generated today</span><strong>${daily === undefined ? '—' : `${new Intl.NumberFormat(hass?.language, { maximumFractionDigits: 2 }).format(daily)} kWh`}</strong></div>` : nothing}
      ${production === undefined ? html`<p class="status">Use a solar production sensor measured in W or kW.</p>` : nothing}`;
  },
};
