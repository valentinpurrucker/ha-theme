import { html, nothing } from 'lit';
import type { CardDefinition } from '../core/types';
import { clamp, numberAttribute, supports } from '../core/entity';
import { command, control, range } from './ui';

export function safeImage(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  if (value.startsWith('/') && !value.startsWith('//')) return value;
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? value : undefined; } catch { return undefined; }
}

export const mediaDefinition: CardDefinition = {
  kind: 'media', name: 'Media', description: 'Now playing, playback, and volume.', icon: 'mdi:speaker', domains: ['media_player'], rows: 5,
  render(context) {
    const { entity, config } = context;
    const playing = entity?.state === 'playing';
    const art = safeImage(entity?.attributes.entity_picture);
    return html`<div class="track">${art ? html`<img class="art" src=${art} alt="" loading="lazy" />` : nothing}<div class="labels"><div class="track-title">${entity?.attributes.media_title ?? 'Nothing playing'}</div><div class="caption">${entity?.attributes.media_artist ?? entity?.attributes.source ?? 'Ready when you are'}</div></div></div>
    ${config.show_controls !== false ? html`<div class="controls">
      ${supports(entity, 16) ? control(context, 'Previous track', 'mdi:skip-previous', command(context, 'media_player', 'media_previous_track')) : nothing}
      ${supports(entity, playing ? 1 : 16384) ? control(context, playing ? 'Pause' : 'Play', playing ? 'mdi:pause' : 'mdi:play', command(context, 'media_player', playing ? 'media_pause' : 'media_play'), true) : nothing}
      ${supports(entity, 32) ? control(context, 'Next track', 'mdi:skip-next', command(context, 'media_player', 'media_next_track')) : nothing}
    </div>${supports(entity, 4) ? range(context, 'Volume', Math.round((numberAttribute(entity, 'volume_level') ?? 0) * 100), 0, 100, 1, '%', (value) => command(context, 'media_player', 'volume_set', { volume_level: clamp(value / 100, 0, 1) })) : nothing}` : nothing}`;
  },
};
