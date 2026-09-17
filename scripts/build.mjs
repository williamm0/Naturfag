/** Build the typed source and embed all runtime assets in the release HTML. */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// Build-time embedding keeps the new course editable while file:// needs no fetch.
const periodic = JSON.parse(readFileSync(join(root, 'course/periodic.json'), 'utf8'));
writeFileSync(join(root, 'src/periodic-data.ts'), 'namespace KL {\n export const periodicData = '+JSON.stringify(periodic)+' as unknown as {version:number;scope:string;authorship:string;questions:PeriodicQuestion[];oral:PeriodicOral[]};\n export const periodicQuestions=periodicData.questions, periodicOral=periodicData.oral;\n export const periodicById=Object.fromEntries(periodicQuestions.map(q=>[q.id,q])) as Record<string,PeriodicQuestion>;\n}\n');
const localCompiler = join(root, 'node_modules', 'typescript', 'bin', 'tsc');
const compiler = existsSync(localCompiler) ? process.execPath : 'tsc';
const args = [...(existsSync(localCompiler) ? [localCompiler] : []), '-p', join(root, 'tsconfig.json')];
const result = spawnSync(compiler, args, { cwd: root, stdio: 'inherit' });
if (result.error) {
  console.error('TypeScript is needed only to rebuild the source. Run npm install, then npm run build. The supplied index.html is already built.');
  process.exit(1);
}
if (result.status !== 0) process.exit(result.status || 1);
const css = readFileSync(join(root, 'app.css'), 'utf8').replace(/<\/style/gi, '<\\/style');
const js = readFileSync(join(root, 'app.js'), 'utf8').replace(/<\/script/gi, '<\\/script');
const html = readFileSync(join(root, 'src/index.template.html'), 'utf8')
  .replace('<link rel="stylesheet" href="app.css">', () => `<style>\n${css}\n</style>`)
  .replace('<script src="app.js" defer></script>', () => `<script>\n${js}\n</script>`);
writeFileSync(join(root, 'index.html'), html, 'utf8');
console.log(`Built self-contained index.html (${Buffer.byteLength(html).toLocaleString('en-US')} bytes).`);
