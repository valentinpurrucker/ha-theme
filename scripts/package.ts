import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { releaseMetadata } from './release-metadata';

const metadata = releaseMetadata(JSON.parse(await readFile('package.json', 'utf8')), JSON.parse(await readFile('hacs.json', 'utf8')));

await mkdir('release', { recursive: true });
await cp('dist/still-cards.js', 'site/still-cards.js');
for (const [from, to] of [[`dist/${metadata.filename}`, metadata.filename], ['hacs.json', 'hacs.json'], ['themes/still.yaml', 'still.yaml'], ['examples/dashboard.yaml', 'dashboard.yaml'], ['docs/installation.md', 'README.md'], ['docs/configuration.md', 'configuration.md'], ['docs/architecture.md', 'architecture.md'], ['docs/releasing.md', 'releasing.md'], ['docs/validation.md', 'validation.md'], ['LICENSE', 'LICENSE']]) {
  await cp(from, `release/${to}`);
}
const packages = ['lit', 'lit-html', 'lit-element', '@lit/reactive-element'];
const notices = await Promise.all(packages.map(async (name) => `${name}\n${await readFile(`node_modules/${name}/LICENSE`, 'utf8')}`));
await writeFile('release/THIRD_PARTY_LICENSES.txt', notices.join('\n\n'));
await cp('docs/browser-results.json', 'release/browser-results.json');
await mkdir('release/screenshots', { recursive: true });
for (const file of ['desktop-light.png', 'desktop-dark.png', 'collection.png', 'mobile.png']) await cp(`docs/screenshots/${file}`, `release/screenshots/${file}`);
const hashes = await Promise.all([metadata.filename, 'hacs.json', 'still.yaml', 'dashboard.yaml'].map(async (file) => `${createHash('sha256').update(await readFile(`release/${file}`)).digest('hex')}  ${file}`));
await writeFile('release/SHA256SUMS', hashes.join('\n') + '\n');
const archive = Bun.spawn(['tar', '-czf', `release/still-cards-${metadata.version}.tar.gz`, '-C', 'release', metadata.filename, 'hacs.json', 'still.yaml', 'dashboard.yaml', 'README.md', 'configuration.md', 'architecture.md', 'releasing.md', 'validation.md', 'browser-results.json', 'screenshots', 'LICENSE', 'THIRD_PARTY_LICENSES.txt', 'SHA256SUMS']);
if (await archive.exited !== 0) throw new Error('Could not create release archive.');
console.log('Installable files are ready in release/.');
