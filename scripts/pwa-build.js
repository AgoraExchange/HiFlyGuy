import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

export function pwaBuild() {
  return {
    name: 'hiflyguy-pwa',
    apply: 'build',
    enforce: 'post',
    async generateBundle(_, bundle) {
      const assets = Object.keys(bundle).sort();
      const template = await readFile(new URL('./sw-template.js', import.meta.url), 'utf8');
      const hash = createHash('sha256').update(template);
      for (const name of assets) hash.update(name).update(bundle[name].code ?? bundle[name].source);
      for (const name of ['manifest.webmanifest', 'market.html', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png']) {
        hash.update(await readFile(new URL(`../public/${name}`, import.meta.url)));
        assets.push(name);
      }
      const version = hash.digest('hex').slice(0, 16);
      this.emitFile({ type: 'asset', fileName: 'sw.js', source: template.replace('__VERSION__', version).replace('__ASSETS__', JSON.stringify(assets)) });
      this.emitFile({ type: 'asset', fileName: '.nojekyll', source: '' });
    },
  };
}
