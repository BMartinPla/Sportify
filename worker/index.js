import {handleApi,insertUser} from '../server/api.mjs';
import assets from 'sportify-assets';
let bootstrapped=false;
export default {
 async fetch(request,env){
  const url=new URL(request.url);
  if(url.pathname.startsWith('/api/')){
   if(!env.DB)return new Response(JSON.stringify({error:'La base de datos todavía no está conectada.'}),{status:503,headers:{'Content-Type':'application/json'}});
   if(!bootstrapped&&env.ADMIN_EMAIL&&env.ADMIN_PASSWORD){
    try{if(!await env.DB.prepare('SELECT id FROM users WHERE email=?').bind(env.ADMIN_EMAIL).first())await insertUser(env.DB,{email:env.ADMIN_EMAIL,name:'Administrador',password:env.ADMIN_PASSWORD,role:'admin'});bootstrapped=true;}catch(error){console.error('Sportify bootstrap:',error.message);}
   }
   return handleApi(request,env.DB);
  }
  if(!['GET','HEAD'].includes(request.method))return new Response('Método no permitido',{status:405});
  const asset=assets[url.pathname]||(!url.pathname.split('/').at(-1).includes('.')?assets['/index.html']:null);
  if(!asset)return new Response('No encontrado',{status:404});
  const bytes=Uint8Array.from(atob(asset.body),c=>c.charCodeAt(0));
  return new Response(request.method==='HEAD'?null:bytes,{headers:{'Content-Type':asset.type,'X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','Cache-Control':url.pathname.startsWith('/assets/')?'public, max-age=31536000, immutable':'no-cache'}});
 }
};
