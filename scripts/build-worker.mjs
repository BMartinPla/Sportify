import {build} from 'esbuild';
import {mkdir,readFile,writeFile,readdir,copyFile,unlink} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
const assets={};
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.jpg':'image/jpeg','.png':'image/png','.webp':'image/webp','.woff2':'font/woff2'};
async function walk(dir,prefix=''){for(const entry of await readdir(dir,{withFileTypes:true})){const path=resolve(dir,entry.name),url=prefix+'/'+entry.name;if(entry.isDirectory())await walk(path,url);else assets[url]={body:(await readFile(path)).toString('base64'),type:mime[extname(path)]||'application/octet-stream'};}}
await walk(resolve('dist/client'));
await mkdir('dist/server',{recursive:true});await mkdir('dist/.openai',{recursive:true});
await writeFile('dist/server/assets.mjs',`export default ${JSON.stringify(assets)};`);
await build({entryPoints:['worker/index.js'],outfile:'dist/server/index.js',bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true,alias:{'sportify-assets':resolve('dist/server/assets.mjs')}});
await unlink('dist/server/assets.mjs');
await copyFile('.openai/hosting.json','dist/.openai/hosting.json');
console.log(`Worker compilado: ${Object.keys(assets).length} recursos integrados.`);
