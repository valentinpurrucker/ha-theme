import type { HassEntity, HomeAssistant } from '../src/core/types';

const entity = (entity_id: string, state: string, name: string, attributes: Record<string, unknown> = {}): HassEntity => ({ entity_id, state, attributes: { friendly_name: name, ...attributes } });

export const initialStates: Record<string, HassEntity> = Object.fromEntries([
  entity('person.alex', 'home', 'Alex'),
  entity('sensor.indoor_temperature', '21.5', 'Inside', { unit_of_measurement: '°C', device_class: 'temperature' }),
  entity('sensor.solar_power', '4.2', 'Solar production', { unit_of_measurement: 'kW', device_class: 'power' }),
  entity('sensor.home_power', '1600', 'Home consumption', { unit_of_measurement: 'W', device_class: 'power' }),
  entity('sensor.grid_power', '-1.4', 'Grid power', { unit_of_measurement: 'kW', device_class: 'power' }),
  entity('sensor.battery_power', '1200', 'Battery power', { unit_of_measurement: 'W', device_class: 'power' }),
  entity('sensor.battery_level', '78', 'Battery charge', { unit_of_measurement: '%', device_class: 'battery' }),
  entity('sensor.solar_today', '18.6', 'Solar today', { unit_of_measurement: 'kWh', device_class: 'energy' }),
  entity('sensor.daily_energy', '4.8', 'Energy today', { unit_of_measurement: 'kWh', device_class: 'energy' }),
  entity('sensor.humidity', '46', 'Humidity', { unit_of_measurement: '%', device_class: 'humidity' }),
  entity('binary_sensor.front_door', 'off', 'Front door', { device_class: 'door' }),
  entity('light.living_room', 'on', 'Reading light', { brightness: 166, supported_color_modes: ['brightness'] }),
  entity('light.bedroom', 'off', 'Bedside lamp', { brightness: 115, supported_color_modes: ['color_temp'], min_color_temp_kelvin: 2200, max_color_temp_kelvin: 6500, color_temp_kelvin: 2700 }),
  entity('climate.living_room', 'heat', 'Living room', { temperature: 22, current_temperature: 21.5, target_temp_step: 0.5, min_temp: 7, max_temp: 35, hvac_action: 'heating', hvac_modes: ['off', 'heat', 'cool', 'auto'], preset_modes: ['home', 'eco', 'away'], preset_mode: 'home', supported_features: 17 }),
  entity('media_player.living_room', 'playing', 'Living room speaker', { media_title: 'A quiet kind of morning', media_artist: 'Still Sessions · Ambient', volume_level: 0.35, supported_features: 16437 }),
  entity('cover.living_room', 'open', 'Linen curtains', { current_position: 70, supported_features: 15 }),
  entity('fan.bedroom', 'on', 'Bedroom fan', { percentage: 35, percentage_step: 1, oscillating: false, supported_features: 51 }),
  entity('switch.coffee_machine', 'off', 'Coffee machine'),
  entity('scene.slow_evening', 'scening', 'Slow evening'),
  entity('scene.goodnight', 'scening', 'Good night'),
  entity('weather.home', 'partlycloudy', 'Outside', { temperature: 18, temperature_unit: '°C', humidity: 62, apparent_temperature: 17, pressure: 1018, pressure_unit: 'hPa', wind_speed: 8, wind_speed_unit: 'km/h' }),
].map((item) => [item.entity_id, item]));

export function createMockHass(onUpdate: (hass: HomeAssistant) => void, onService: (name: string) => void, readStates?: () => Record<string, HassEntity>): HomeAssistant {
  let hass: HomeAssistant = {
    states: structuredClone(initialStates), language: 'en', config: { unit_system: { temperature: '°C' } },
    async callService(domain, service, data = {}) {
      if (readStates) hass = { ...hass, states: readStates() };
      const id = String(data.entity_id ?? '');
      const previous = hass.states[id];
      if (!previous) throw new Error(`Demo entity not found: ${id}`);
      const next = { ...previous, attributes: { ...previous.attributes } };
      if (service === 'toggle') next.state = next.state === 'on' ? 'off' : 'on';
      if (service === 'turn_on') next.state = 'on';
      if (service === 'turn_off') next.state = 'off';
      if (data.brightness_pct !== undefined) next.attributes.brightness = Number(data.brightness_pct) / 100 * 255;
      if (data.color_temp_kelvin !== undefined) next.attributes.color_temp_kelvin = data.color_temp_kelvin;
      if (service === 'set_preset_mode') next.attributes.preset_mode = data.preset_mode;
      if (service === 'set_temperature') next.attributes.temperature = data.temperature;
      if (service === 'set_hvac_mode') { next.state = String(data.hvac_mode); next.attributes.hvac_action = next.state === 'off' ? 'off' : next.state === 'cool' ? 'cooling' : 'heating'; }
      if (service === 'media_pause') next.state = 'paused';
      if (service === 'media_play') next.state = 'playing';
      if (service === 'media_next_track') next.attributes.media_title = 'Sunday, slowly';
      if (service === 'media_previous_track') next.attributes.media_title = 'A quiet kind of morning';
      if (service === 'volume_set') next.attributes.volume_level = data.volume_level;
      if (service === 'open_cover') { next.state = 'open'; next.attributes.current_position = 100; }
      if (service === 'close_cover') { next.state = 'closed'; next.attributes.current_position = 0; }
      if (service === 'stop_cover') next.state = Number(next.attributes.current_position) === 0 ? 'closed' : 'open';
      if (service === 'set_cover_position') { next.attributes.current_position = data.position; next.state = Number(data.position) === 0 ? 'closed' : 'open'; }
      if (service === 'set_percentage') { next.attributes.percentage = data.percentage; next.state = Number(data.percentage) === 0 ? 'off' : 'on'; }
      if (service === 'oscillate') next.attributes.oscillating = data.oscillating;
      const states = { ...hass.states, [id]: next };
      if (domain === 'scene') {
        states['light.living_room'] = { ...states['light.living_room'], state: id.endsWith('goodnight') ? 'off' : 'on', attributes: { ...states['light.living_room'].attributes, brightness: 70 } };
        if (id.endsWith('goodnight')) states['media_player.living_room'] = { ...states['media_player.living_room'], state: 'paused' };
      }
      hass = { ...hass, states };
      onUpdate(hass);
      onService(`${domain}.${service}`);
    },
  };
  return hass;
}
