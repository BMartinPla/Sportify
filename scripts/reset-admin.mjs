import {createDatabase} from '../server/database.mjs';
import {hashPassword} from '../server/api.mjs';
try{process.loadEnvFile();}catch{}
const db=createDatabase(process.env.DATABASE_PATH||'data/sportify.sqlite');
const email=process.env.ADMIN_EMAIL||'admin@sportify.local';
const user=await db.prepare("SELECT id FROM users WHERE email=? AND role='admin'").bind(email).first();
if(!user){db.close();throw Error('No existe esa cuenta administrativa. Iniciá la aplicación para crearla.');}
const password=`Spt!${crypto.randomUUID()}`;
await db.batch([db.prepare('UPDATE users SET password_hash=? WHERE id=?').bind(await hashPassword(password),user.id),db.prepare('DELETE FROM sessions WHERE user_id=?').bind(user.id)]);
db.close();
console.log(`Administrador: ${email}\nNueva contraseña: ${password}\nGuardala en un lugar seguro; no vuelve a mostrarse.`);
