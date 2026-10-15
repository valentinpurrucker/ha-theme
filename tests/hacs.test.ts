import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { assertReleaseTag, releaseMetadata } from '../scripts/release-metadata';
import libraryConfig from '../vite.library.config';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const manifest = JSON.parse(readFileSync('hacs.json', 'utf8'));

describe('HACS distribution', () => {
  it('points HACS at the actual library output and hides the unbuilt branch', () => {
    const metadata = releaseMetadata(pkg, manifest);
    const library = libraryConfig.build?.lib;
    if (!library || typeof library.fileName !== 'function') throw new Error('Expected a named library bundle.');
    expect(metadata.filename).toBe(library.fileName('es', 'index'));
    expect(manifest.render_readme).toBe(true);
  });

  it('accepts the package version and rejects a stale or unrelated release tag', () => {
    expect(() => assertReleaseTag(`v${pkg.version}`, pkg.version)).not.toThrow();
    expect(() => assertReleaseTag('v9.9.9', pkg.version)).toThrow('does not match');
    expect(() => assertReleaseTag(pkg.version, pkg.version)).toThrow('Expected v');
    expect(() => assertReleaseTag('v1.2.3-beta.1', '1.2.3-beta.1')).not.toThrow();
  });

  it('rejects archives and paths in the HACS single-file asset', () => {
    expect(() => releaseMetadata(pkg, { ...manifest, zip_release: true })).toThrow('JavaScript asset directly');
    expect(() => releaseMetadata(pkg, { ...manifest, filename: 'dist/still-cards.js' })).toThrow('without a directory');
    expect(() => releaseMetadata(pkg, { ...manifest, filename: 'still-cards.zip' })).toThrow('JavaScript asset');
  });

  it('publishes the raw JavaScript asset after checks and uses the HACS plugin category', () => {
    const workflow = parse(readFileSync('automation/workflows/release.yml', 'utf8'));
    const steps = workflow.jobs.release.steps;
    const build = steps.findIndex((step: { run?: string }) => step.run === 'bun run check');
    const publish = steps.findIndex((step: { run?: string }) => step.run?.includes('gh release create'));
    expect(workflow.on.push.tags).toEqual(['v*']);
    expect(build).toBeGreaterThan(-1);
    expect(publish).toBeGreaterThan(build);
    expect(steps[publish].run).toContain(`release/${manifest.filename}`);
    expect(steps[publish].run).toContain('--verify-tag');
    expect(steps.at(-1).with).toMatchObject({ category: 'plugin', comment: false });
  });
});
