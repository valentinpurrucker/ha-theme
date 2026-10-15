import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';

const notices = ['lit', 'lit-html', 'lit-element', '@lit/reactive-element']
  .map((name) => `${name}\n${readFileSync(`node_modules/${name}/LICENSE`, 'utf8')}`).join('\n\n');

export default defineConfig({
  build: {
    outDir: 'dist',
    lib: { entry: 'src/index.ts', formats: ['es'], fileName: () => 'still-cards.js' },
    sourcemap: 'hidden',
    target: 'es2022',
    rolldownOptions: {
      output: { banner: `/*!\nStill Cards\n\n${readFileSync('LICENSE', 'utf8')}\nBundled third-party notices\n\n${notices}\n*/` },
    },
  },
});
