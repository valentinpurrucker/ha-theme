import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { assertReleaseTag, releaseMetadata } from './release-metadata';

const metadata = releaseMetadata(JSON.parse(await readFile('package.json', 'utf8')), JSON.parse(await readFile('hacs.json', 'utf8')));
if (process.env.RELEASE_TAG) assertReleaseTag(process.env.RELEASE_TAG, metadata.version);
const built = await readFile(`dist/${metadata.filename}`);
const published = await readFile(`release/${metadata.filename}`);
if (!built.length || !built.equals(published)) throw new Error('The HACS release asset must match the current production bundle. Run bun run build.');
const hash = createHash('sha256').update(published).digest('hex');
const checksums = await readFile('release/SHA256SUMS', 'utf8');
if (!checksums.split('\n').includes(`${hash}  ${metadata.filename}`)) throw new Error('The HACS asset checksum does not match SHA256SUMS.');
const notices = await readFile('release/THIRD_PARTY_LICENSES.txt', 'utf8');
const normalizeWhitespace = (value: string) => value.replace(/\s+/g, ' ').trim();
if (!normalizeWhitespace(built.toString('utf8')).includes(normalizeWhitespace(notices))) throw new Error('The single-file HACS asset must include its third-party license notices.');
const archivedManifest = JSON.parse(await readFile('release/hacs.json', 'utf8'));
if (archivedManifest.filename !== metadata.filename) throw new Error('The packaged HACS manifest points at the wrong asset.');
console.log(`HACS release verified: v${metadata.version}, ${metadata.filename}, SHA-256 ${hash}.`);
