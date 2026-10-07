import { DatabaseSync } from 'node:sqlite';
import { readFileSync,mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
export function createDatabase(filename='data/sportify.sqlite'){
 if(filename!==':memory:')mkdirSync(dirname(filename),{recursive:true});
 const sqlite=new DatabaseSync(filename);
 sqlite.exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;');
 sqlite.exec(readFileSync(new URL('./schema.sql',import.meta.url),'utf8'));
 const wrap=(sql,params=[])=>({
  bind(...values){return wrap(sql,values);},
  async first(){return sqlite.prepare(sql).get(...params)||null;},
  async all(){return {results:sqlite.prepare(sql).all(...params)};},
  async run(){const result=sqlite.prepare(sql).run(...params);return {meta:{changes:Number(result.changes),last_row_id:Number(result.lastInsertRowid)}};},
  execute(){return sqlite.prepare(sql).run(...params);}
 });
 return {prepare:wrap,async batch(statements){sqlite.exec('BEGIN IMMEDIATE');try{const results=statements.map(s=>s.execute());sqlite.exec('COMMIT');return results;}catch(error){sqlite.exec('ROLLBACK');throw error;}},close(){sqlite.close();},sqlite};
}
