import type { TemplateResult } from 'lit';

export interface HassEntity {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown>;
  last_changed?: string;
  last_updated?: string;
}

export interface HomeAssistant {
  states: Record<string, HassEntity>;
  language?: string;
  config?: { unit_system?: { temperature?: string } };
  callService: (domain: string, service: string, data?: Record<string, unknown>, target?: ActionTarget) => Promise<unknown>;
  formatEntityState?: (entity: HassEntity) => string;
  formatEntityAttributeValue?: (entity: HassEntity, attribute: string, value?: unknown) => string;
  formatEntityName?: (entity: HassEntity, name?: string) => string;
}

export type CardKind = 'entity' | 'light' | 'toggle' | 'climate' | 'solar' | 'media' | 'cover' | 'fan' | 'scene' | 'weather' | 'chips' | 'title';
export type ActionTarget = { entity_id?: string | string[]; area_id?: string | string[]; device_id?: string | string[] };
export interface CardAction {
  action: 'none' | 'details' | 'more-info' | 'toggle' | 'perform-action' | 'call-service' | 'navigate' | 'url';
  perform_action?: string;
  service?: string;
  data?: Record<string, unknown>;
  service_data?: Record<string, unknown>;
  target?: ActionTarget;
  navigation_path?: string;
  url_path?: string;
  confirmation?: boolean | { text?: string };
}

export interface CardStyle {
  accent?: string;
  background?: string;
  radius?: string;
  padding?: string;
  border?: string;
  shadow?: string;
  icon_size?: string;
}

export interface ChipConfig {
  entity?: string;
  name?: string;
  icon?: string;
  content?: string;
  tap_action?: CardAction;
}

export interface StillConfig {
  type: string;
  kind?: CardKind | string;
  entity?: string;
  name?: string;
  icon?: string;
  subtitle?: string;
  attribute?: string;
  unit?: string;
  show_state?: boolean;
  show_controls?: boolean;
  show_presets?: boolean;
  layout?: 'tile' | 'panel';
  solar?: {
    home_power?: string;
    grid_power?: string;
    battery_level?: string;
    battery_power?: string;
    energy_today?: string;
    grid_export_positive?: boolean;
  };
  variant?: 'soft' | 'outlined' | 'minimal';
  density?: 'comfortable' | 'compact';
  style?: CardStyle;
  tap_action?: CardAction;
  chips?: ChipConfig[];
  grid_options?: Record<string, unknown>;
}

export interface ServiceCommand {
  domain: string;
  service: string;
  data?: Record<string, unknown>;
  target?: ActionTarget;
}

export interface RenderContext {
  config: StillConfig;
  entity?: HassEntity;
  hass?: HomeAssistant;
  disabled: boolean;
  pending: boolean;
  view: 'card' | 'details';
  call: (command: ServiceCommand) => Promise<void>;
  act: (action?: CardAction, entityId?: string) => Promise<void>;
  icon: (icon: string) => TemplateResult;
}

export interface CardDefinition {
  kind: string;
  name: string;
  description: string;
  icon: string;
  domains?: string[];
  requiresEntity?: boolean;
  rows: number;
  render: (context: RenderContext) => TemplateResult;
}
