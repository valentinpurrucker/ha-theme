export interface ReleaseMetadata {
  version: string;
  filename: string;
}

export function releaseMetadata(
  pkg: { version: string },
  manifest: { name: string; filename: string; content_in_root?: boolean; hide_default_branch?: boolean; zip_release?: boolean },
): ReleaseMetadata {
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(pkg.version)) throw new Error('package.json needs a release version such as 0.1.0.');
  if (!manifest.name?.trim()) throw new Error('hacs.json needs a display name.');
  if (!/^[a-z0-9][a-z0-9._-]*\.js$/.test(manifest.filename)) throw new Error('HACS needs a JavaScript asset filename, without a directory.');
  if (manifest.zip_release) throw new Error('HACS Dashboard releases use the JavaScript asset directly, not zip_release.');
  if (manifest.content_in_root !== false || manifest.hide_default_branch !== true) throw new Error('This release-only distribution must use content_in_root: false and hide_default_branch: true.');
  return { version: pkg.version, filename: manifest.filename };
}

export function assertReleaseTag(tag: string, version: string): void {
  if (tag !== `v${version}`) throw new Error(`Release tag ${JSON.stringify(tag)} does not match package.json. Expected v${version}.`);
}
