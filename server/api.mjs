import { blankState, demoState, dateKey } from './seed.mjs';
import { catalog, muscles, equipmentNames } from './catalog.mjs';

const encoder = new TextEncoder();
const hex = bytes => [...new Uint8Array(bytes)].map(n=>n.toString(16).padStart(2,'0')).join('');
const unhex = str => new Uint8Array(str.match(/.{2}/g).map(n=>parseInt(n,16)));
const random = () => hex(crypto.getRandomValues(new Uint8Array(32)));
const digest = async value => hex(await crypto.subtle.digest('SHA-256',encoder.encode(value)));
export async function hashPassword(password,salt=random()) {
 const key=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveBits']);
 const result=await crypto.subtle.deriveBits({name:'PBKDF2',salt:encoder.encode(salt),iterations:100000,hash:'SHA-256'},key,256);
 return `pbkdf2-sha256$100000$${salt}$${hex(result)}`;
}
async function verifyPassword(password,hash){
 if(!hash?.startsWith('pbkdf2-sha256$'))return false;
 const actual=await hashPassword(password,hash.split('$')[2]);
 let difference=actual.length^hash.length;
 for(let i=0;i<actual.length;i++)difference|=actual.charCodeAt(i)^hash.charCodeAt(i);
 return difference===0;
}
class ApiError extends Error {constructor(status,message){super(message);this.status=status;}}
const requireThat = (ok,message,status=400)=>{if(!ok)throw new ApiError(status,message);};
const str = (value,max=100)=>typeof value==='string'&&value.trim().length>0&&value.trim().length<=max;
const numeric=(value,min,max)=>typeof value==='number'&&Number.isFinite(value)&&value>=min&&value<=max;
const validDate=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&!isNaN(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value&&value<=dateKey();
const publicUser=({id,email,name,role,active,created_at})=>({id,email,name,role,active:!!active,createdAt:created_at});
const json=(data,status=200,headers={})=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}});
const cookie=(token,secure)=>`sportify_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800${secure?'; Secure':''}`;
async function body(request){const raw=await request.text();requireThat(encoder.encode(raw).length<=100000,'La solicitud es demasiado grande.',413);try{return JSON.parse(raw||'{}');}catch{throw new ApiError(400,'Los datos enviados no son válidos.');}}
const resultChanges=result=>result.meta?.changes??result.changes??0;
export async function insertUser(db,{email,name,password,role='member',state=blankState()}){
 const id=crypto.randomUUID(); const hash=await hashPassword(password);
 const u=db.prepare('INSERT INTO users (id,email,name,password_hash,role,created_at) VALUES (?,?,?,?,?,?)').bind(id,email.toLowerCase(),name,hash,role,new Date().toISOString());
 const s=db.prepare('INSERT INTO user_state (user_id,data) VALUES (?,?)').bind(id,JSON.stringify(state));
 await db.batch([u,s]);return db.prepare('SELECT * FROM users WHERE id=?').bind(id).first();
}
async function readState(db,id){const row=await db.prepare('SELECT data,version FROM user_state WHERE user_id=?').bind(id).first();requireThat(row,'La cuenta ya no está disponible.',401);return {...JSON.parse(row.data),version:row.version};}
async function mutate(db,id,callback){const state=await readState(db,id);const version=state.version;delete state.version;await callback(state);const result=await db.prepare('UPDATE user_state SET data=?,version=version+1 WHERE user_id=? AND version=?').bind(JSON.stringify(state),id,version).run();requireThat(resultChanges(result)===1,'Los datos cambiaron en otra ventana. Recargá y volvé a intentar.',409);return {...state,version:version+1};}
function validateExercise(e){requireThat(str(e.id,150)&&str(e.name,150),'Elegí un ejercicio válido.');requireThat(Number.isInteger(e.day)&&e.day>=0&&e.day<=6,'El día no es válido.');requireThat(Number.isInteger(e.sets)&&numeric(e.sets,1,20)&&Number.isInteger(e.reps)&&numeric(e.reps,1,300)&&numeric(e.load,0,1000),'Usá entre 1 y 20 series, 1 y 300 repeticiones y una carga entre 0 y 1000 kg.');}
function cleanExercise(e){validateExercise(e);return {id:e.id,name:e.name,muscle:String(e.muscle||'General').slice(0,40),equipment:String(e.equipment||'Otro').slice(0,40),sets:e.sets,reps:e.reps,load:e.load,day:e.day,entryId:str(e.entryId,100)?e.entryId:crypto.randomUUID()};}
function validateRoutine(data){requireThat(str(data.name,60),'El nombre de la rutina debe tener entre 1 y 60 caracteres.');requireThat(!data.description||typeof data.description==='string'&&data.description.length<=200,'La descripción admite hasta 200 caracteres.');requireThat(Array.isArray(data.exercises)&&data.exercises.length<=100,'Una rutina admite hasta 100 ejercicios.');data.exercises.forEach(validateExercise);}
let exerciseCache=null;
let exerciseRefresh=null;
async function exercises(){
 if(exerciseCache&&Date.now()-exerciseCache.at<3600000)return exerciseCache;
 if(exerciseRefresh)return exerciseRefresh;
 exerciseRefresh=(async()=>{try{
  const response=await fetch('https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json',{signal:AbortSignal.timeout(2200)});
  if(!response.ok)throw Error('upstream');
  const data=await response.json();if(!Array.isArray(data)||data.length<50)throw Error('format');
  const curated=new Map(catalog.map(e=>[e.id,e]));
  const remote=data.map(e=>{const local=curated.get(e.id);return {id:e.id,name:local?.name||e.name,muscle:muscles[e.primaryMuscles?.[0]]||'General',equipment:equipmentNames[e.equipment]||'Otro',level:({beginner:'Inicial',intermediate:'Intermedio',expert:'Avanzado'})[e.level]||'Intermedio',instructions:local?.instructions||e.instructions||[],images:(e.images||[]).map(i=>`https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${i}`),source:'Free Exercise DB',originalName:e.name};});
  const all=[...catalog.map(e=>({...e,source:'Free Exercise DB',...remote.find(x=>x.id===e.id)})),...remote.filter(e=>!curated.has(e.id))];
  exerciseCache={at:Date.now(),source:'live',items:all};return exerciseCache;
 }catch{return exerciseCache?{...exerciseCache,source:'cached'}:{at:Date.now(),source:'fallback',items:catalog};}finally{exerciseRefresh=null;}})();
 return exerciseRefresh;
}

export async function handleApi(request,db){
 try{
 const url=new URL(request.url),path=url.pathname,method=request.method;
 if(!['GET','HEAD'].includes(method)){
  const origin=request.headers.get('origin');requireThat(!origin||origin===url.origin,'Origen de solicitud no permitido.',403);
 }
 if(path==='/api/health')return json({status:'ok',service:'Sportify',time:new Date().toISOString()});
 const secure=url.protocol==='https:';
 const makeSession=async user=>{
  await db.prepare('DELETE FROM sessions WHERE expires_at < ?').bind(Date.now()).run();
  const token=random();await db.prepare('INSERT INTO sessions (token_hash,user_id,expires_at) VALUES (?,?,?)').bind(await digest(token),user.id,Date.now()+604800000).run();
  return json({user:publicUser(user),state:await readState(db,user.id)},200,{'Set-Cookie':cookie(token,secure)});
 };
 if(path==='/api/auth/register'&&method==='POST'){
  const data=await body(request);
  requireThat(str(data.name,80),'Ingresá tu nombre (hasta 80 caracteres).');
  requireThat(str(data.email,150)&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim()),'Ingresá un correo válido.');
  requireThat(typeof data.password==='string'&&data.password.length>=10&&data.password.length<=128,'La contraseña debe tener entre 10 y 128 caracteres.');
  const exists=await db.prepare('SELECT id FROM users WHERE email=?').bind(data.email.trim().toLowerCase()).first();requireThat(!exists,'Ya existe una cuenta con ese correo.',409);
  const user=await insertUser(db,{name:data.name.trim(),email:data.email.trim(),password:data.password});return makeSession(user);
 }
 if(path==='/api/auth/login'&&method==='POST'){
  const data=await body(request);requireThat(str(data.email,150)&&typeof data.password==='string'&&data.password.length<=128,'Completá tu correo y contraseña.');
  const key=data.email.trim().toLowerCase(),now=Date.now();
  const attempt=await db.prepare('SELECT * FROM login_attempts WHERE key=?').bind(key).first();
  requireThat(!attempt||attempt.expires_at<now||attempt.count<10,'Demasiados intentos. Volvé a intentar en 15 minutos.',429);
  const user=await db.prepare('SELECT * FROM users WHERE email=?').bind(key).first();
  const valid=user?await verifyPassword(data.password,user.password_hash):await verifyPassword(data.password,await hashPassword(random()));
  if(!user||!valid||!user.active){await db.prepare('INSERT INTO login_attempts (key,count,expires_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN expires_at<? THEN 1 ELSE count+1 END,expires_at=CASE WHEN expires_at<? THEN ? ELSE expires_at END').bind(key,now+900000,now,now,now+900000).run();throw new ApiError(401,'El correo o la contraseña son incorrectos, o la cuenta está desactivada.');}
  await db.prepare('DELETE FROM login_attempts WHERE key=?').bind(key).run();return makeSession(user);
 }
 if(path==='/api/auth/demo'&&method==='POST'){
  const user=await insertUser(db,{name:'Mateo',email:`demo-${crypto.randomUUID()}@sportify.local`,password:random(),state:demoState()});return makeSession(user);
 }
 const token=request.headers.get('cookie')?.match(/(?:^|;\s*)sportify_session=([a-f0-9]{64})(?:;|$)/)?.[1];
 const tokenHash=token?await digest(token):'';
 const user=token?await db.prepare('SELECT u.* FROM users u JOIN sessions s ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>? AND u.active=1').bind(tokenHash,Date.now()).first():null;
 requireThat(user,'Iniciá sesión para continuar.',401);
 if(path==='/api/auth/me'&&method==='GET')return json({user:publicUser(user),state:await readState(db,user.id)});
 if(path==='/api/auth/logout'&&method==='POST'){await db.prepare('DELETE FROM sessions WHERE token_hash=?').bind(tokenHash).run();return json({ok:true},200,{'Set-Cookie':`sportify_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure?'; Secure':''}`});}
 if(path==='/api/state'&&method==='GET')return json(await readState(db,user.id));
 if(path==='/api/exercises'&&method==='GET'){
  const data=await exercises();let items=data.items;
  const q=(url.searchParams.get('q')||'').toLowerCase(),muscle=url.searchParams.get('muscle'),equipment=url.searchParams.get('equipment');
  if(q)items=items.filter(e=>`${e.name} ${e.originalName||''} ${e.muscle}`.toLowerCase().includes(q));
  if(muscle&&muscle!=='Todos')items=items.filter(e=>e.muscle===muscle);
  if(equipment&&equipment!=='Todos')items=items.filter(e=>e.equipment===equipment);
  return json({items,total:items.length,source:data.source});
 }
 if(path==='/api/routines'&&method==='POST'){
  const data=await body(request);validateRoutine(data);
  return json(await mutate(db,user.id,s=>{requireThat(s.routines.length<10,'Llegaste al máximo de 10 rutinas. Eliminá una antes de crear otra.',409);s.routines.push({id:crypto.randomUUID(),name:data.name.trim(),description:data.description||'',color:['green','peach','violet','blue'].includes(data.color)?data.color:'green',primary:s.routines.length===0,createdAt:dateKey(),exercises:data.exercises.map(cleanExercise)});}),201);
 }
 const routineMatch=path.match(/^\/api\/routines\/([^/]+)(?:\/(duplicate|primary))?$/);
 if(routineMatch){
  const [,id,action]=routineMatch;const data=method==='PUT'?await body(request):null;if(data)validateRoutine(data);
  requireThat(['PUT','DELETE','POST'].includes(method),'Método no permitido.',405);
  return json(await mutate(db,user.id,s=>{
   const index=s.routines.findIndex(r=>r.id===id);requireThat(index>=0,'No se encontró esa rutina.',404);const r=s.routines[index];
   if(action==='duplicate'&&method==='POST'){requireThat(s.routines.length<10,'Llegaste al máximo de 10 rutinas.',409);s.routines.push({...r,id:crypto.randomUUID(),name:`${r.name.slice(0,50)} · copia`,primary:false,createdAt:dateKey(),exercises:r.exercises.map(e=>({...e,entryId:crypto.randomUUID()}))});}
   else if(action==='primary'&&method==='POST')s.routines.forEach(r=>r.primary=r.id===id);
   else if(!action&&method==='PUT')s.routines[index]={...r,name:data.name.trim(),description:data.description||'',color:['green','peach','violet','blue'].includes(data.color)?data.color:r.color,exercises:data.exercises.map(cleanExercise)};
   else if(!action&&method==='DELETE'){s.routines.splice(index,1);if(r.primary&&s.routines[0])s.routines[0].primary=true;}
   else throw new ApiError(405,'Método no permitido.');
  }));
 }
 if(path==='/api/logs'&&method==='POST'){
  const data=await body(request);validateLog(data);
  return json(await mutate(db,user.id,s=>{
   if(data.routineId)requireThat(s.routines.some(r=>r.id===data.routineId),'La rutina ya no existe.',404);
   s.logs.push({...cleanLog(data),id:crypto.randomUUID()});
   for(const entry of data.entries)for(const r of s.routines)for(const e of r.exercises)if(e.id===entry.exerciseId&&r.id===data.routineId)e.load=entry.load;
  }),201);
 }
 const logMatch=path.match(/^\/api\/logs\/([^/]+)$/);
 if(logMatch&&['PUT','DELETE'].includes(method)){
  const data=method==='PUT'?await body(request):null;if(data)validateLog(data);
  return json(await mutate(db,user.id,s=>{const i=s.logs.findIndex(l=>l.id===logMatch[1]);requireThat(i>=0,'No se encontró el entrenamiento.',404);if(method==='DELETE')s.logs.splice(i,1);else s.logs[i]={...cleanLog(data),id:s.logs[i].id};}));
 }
 if(path==='/api/weights'&&method==='POST'){
  const data=await body(request);requireThat(numeric(data.value,20,400)&&validDate(data.date),'Ingresá un peso entre 20 y 400 kg y una fecha válida, no futura.');
  return json(await mutate(db,user.id,s=>{const existing=s.weights.find(w=>w.date===data.date);if(existing)existing.value=data.value;else s.weights.push({id:crypto.randomUUID(),date:data.date,value:data.value});s.weights.sort((a,b)=>a.date.localeCompare(b.date));s.profile.weight=s.weights.at(-1)?.value??null;}),201);
 }
 const weightMatch=path.match(/^\/api\/weights\/([^/]+)$/);
 if(weightMatch&&method==='DELETE')return json(await mutate(db,user.id,s=>{const i=s.weights.findIndex(w=>w.id===weightMatch[1]);requireThat(i>=0,'No se encontró el registro.',404);s.weights.splice(i,1);s.profile.weight=[...s.weights].sort((a,b)=>a.date.localeCompare(b.date)).at(-1)?.value??null;}));
 if(path==='/api/account'&&method==='PUT'){
  const data=await body(request);requireThat(str(data.name,80),'Ingresá tu nombre.');requireThat(numeric(data.height,80,250),'La altura debe estar entre 80 y 250 cm.');requireThat(data.target===null||numeric(data.target,20,400),'El peso objetivo debe estar entre 20 y 400 kg.');requireThat(['Ganar fuerza','Ganar músculo','Mejorar resistencia','Mantenerme activo'].includes(data.goal),'Elegí un objetivo válido.');requireThat(Number.isInteger(data.weeklyGoal)&&numeric(data.weeklyGoal,1,7),'Elegí entre 1 y 7 entrenamientos semanales.');
  const state=await mutate(db,user.id,s=>{s.profile={...s.profile,height:data.height,target:data.target,goal:data.goal,weeklyGoal:data.weeklyGoal};});
  await db.prepare('UPDATE users SET name=? WHERE id=?').bind(data.name.trim(),user.id).run();return json({state,user:publicUser({...user,name:data.name.trim()})});
 }
 if(path==='/api/account/password'&&method==='PUT'){
  const data=await body(request);requireThat(typeof data.current==='string'&&data.current.length<=128&&await verifyPassword(data.current,user.password_hash),'La contraseña actual es incorrecta.');requireThat(typeof data.password==='string'&&data.password.length>=10&&data.password.length<=128,'La nueva contraseña debe tener entre 10 y 128 caracteres.');
  await db.batch([db.prepare('UPDATE users SET password_hash=? WHERE id=?').bind(await hashPassword(data.password),user.id),db.prepare('DELETE FROM sessions WHERE user_id=? AND token_hash<>?').bind(user.id,tokenHash)]);return json({ok:true});
 }
 if(path==='/api/account'&&method==='DELETE'){
  requireThat(user.role!=='admin','Un administrador no puede eliminar su propia cuenta.');const data=await body(request);requireThat(typeof data.password==='string'&&data.password.length<=128&&await verifyPassword(data.password,user.password_hash),'La contraseña es incorrecta.');await deleteUser(db,user.id);return json({ok:true},200,{'Set-Cookie':'sportify_session=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax'});
 }
 if(path.startsWith('/api/admin/')){
  requireThat(user.role==='admin','Solo los administradores pueden realizar esta acción.',403);
  if(path==='/api/admin/users'&&method==='GET'){const {results}=await db.prepare('SELECT id,email,name,role,active,created_at FROM users ORDER BY created_at DESC').all();return json({users:results.map(publicUser)});}
  const match=path.match(/^\/api\/admin\/users\/([^/]+)$/);
  if(match&&['PATCH','DELETE'].includes(method)){
   requireThat(match[1]!==user.id,'No podés modificar tu propia cuenta desde la administración.');const target=await db.prepare('SELECT id,role FROM users WHERE id=?').bind(match[1]).first();requireThat(target,'No se encontró la cuenta.',404);requireThat(target.role!=='admin','No se pueden alterar otras cuentas administrativas.');
   if(method==='DELETE')await deleteUser(db,target.id);
   else {const data=await body(request);requireThat(typeof data.active==='boolean','Estado no válido.');await db.batch([db.prepare('UPDATE users SET active=? WHERE id=?').bind(data.active?1:0,target.id),db.prepare('DELETE FROM sessions WHERE user_id=?').bind(target.id)]);}
   return json({ok:true});
  }
 }
 throw new ApiError(404,'No se encontró el recurso solicitado.');
 }catch(error){if(!(error instanceof ApiError))console.error('Sportify API:',error.message);return json({error:error instanceof ApiError?error.message:'No pudimos completar la operación. Volvé a intentar.'},error.status||500);}
}
function validateLog(data){
 requireThat(validDate(data.date),'Elegí una fecha válida, no futura.');requireThat(str(data.routineName,100)&&numeric(data.duration,1,600),'Indicá un nombre y una duración entre 1 y 600 minutos.');requireThat(Array.isArray(data.entries)&&data.entries.length>=1&&data.entries.length<=100,'Registrá al menos un ejercicio.');requireThat(!data.note||typeof data.note==='string'&&data.note.length<=500,'Las notas admiten hasta 500 caracteres.');
 data.entries.forEach(e=>requireThat(str(e.exerciseId,150)&&str(e.name,150)&&Number.isInteger(e.sets)&&numeric(e.sets,1,20)&&Number.isInteger(e.reps)&&numeric(e.reps,1,300)&&numeric(e.load,0,1000),'Revisá las series, repeticiones y cargas de los ejercicios.'));
}
function cleanLog(data){return {date:data.date,routineId:typeof data.routineId==='string'?data.routineId:null,routineName:data.routineName.trim(),duration:data.duration,note:data.note||'',entries:data.entries.map(e=>({exerciseId:e.exerciseId,name:e.name,sets:e.sets,reps:e.reps,load:e.load}))};}
async function deleteUser(db,id){await db.batch([db.prepare('DELETE FROM sessions WHERE user_id=?').bind(id),db.prepare('DELETE FROM user_state WHERE user_id=?').bind(id),db.prepare('DELETE FROM users WHERE id=?').bind(id)]);}
