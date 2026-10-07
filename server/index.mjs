import http from 'node:http';
import { readFileSync,existsSync } from 'node:fs';
import { resolve,extname,sep } from 'node:path';
import { createDatabase } from './database.mjs';
import { handleApi,insertUser } from './api.mjs';
try{process.loadEnvFile();}catch{}
const production=process.argv.includes('--production');
const port=Number(process.env.PORT||3000);
const db=createDatabase(process.env.DATABASE_PATH||'data/sportify.sqlite');
const email=process.env.ADMIN_EMAIL||'admin@sportify.local';
if(!await db.prepare('SELECT id FROM users WHERE email=?').bind(email).first()){
 const password=process.env.ADMIN_PASSWORD||`Spt!${crypto.randomUUID()}`;
 await insertUser(db,{email,name:'Administrador',password,role:'admin'});
 console.log(`\nCuenta inicial de administración: ${email}\nContraseña inicial: ${password}\nGuardala en un lugar seguro; no volverá a mostrarse.\n`);
}
const vite=production?null:await (await import('vite')).createServer({server:{middlewareMode:true},appType:'spa'});
const root=resolve('dist/client');
if(production&&!existsSync(resolve(root,'index.html')))throw Error('Ejecutá npm run build antes de npm start.');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2'};
const server=http.createServer(async(req,res)=>{
 if(req.url.startsWith('/api/')){
  let raw='';let size=0;
  try{
   for await(const chunk of req){size+=chunk.length;if(size>100000){res.writeHead(413,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'Solicitud demasiado grande.'}));return;}raw+=chunk;}
   const request=new Request(`http://${req.headers.host||'localhost:'+port}${req.url}`,{method:req.method,headers:req.headers,...(!['GET','HEAD'].includes(req.method)?{body:raw}:{} )});
   const response=await handleApi(request,db);
   res.writeHead(response.status,Object.fromEntries(response.headers));res.end(await response.text());
  }catch{res.writeHead(500,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'Error interno del servidor.'}));}
  return;
 }
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');res.setHeader('X-Frame-Options','SAMEORIGIN');
 if(vite)return vite.middlewares(req,res);
 try{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);let file=resolve(root,'.'+pathname);if(!file.startsWith(root+sep)&&file!==root){res.writeHead(403);res.end();return;}if(!existsSync(file)||!extname(file))file=resolve(root,'index.html');res.setHeader('Content-Type',types[extname(file)]||'application/octet-stream');res.end(readFileSync(file));}catch{res.writeHead(404);res.end('No encontrado');}
});
server.listen(port,'127.0.0.1',()=>console.log(`Sportify listo en http://localhost:${port} (${production?'producción':'desarrollo'})`));
const close=()=>server.close(async()=>{await vite?.close();db.close();process.exit(0);});process.on('SIGINT',close);process.on('SIGTERM',close);
