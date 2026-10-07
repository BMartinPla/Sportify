import { catalog } from './catalog.mjs';
export const dateKey = (date=new Date()) => new Intl.DateTimeFormat('en-CA',{timeZone:'America/Argentina/Buenos_Aires',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
const ago = days => {const d=new Date(); d.setDate(d.getDate()-days); return dateKey(d);};
export const blankState = () => ({profile:{height:175,weight:null,target: null,goal:'Ganar fuerza',weeklyGoal:4},routines:[],logs:[],weights:[]});
export function demoState(){
 const ex=(index,sets,reps,load,day)=>({...catalog[index],sets,reps,load,day,entryId:crypto.randomUUID()});
 const routine={id:crypto.randomUUID(),name:'Fuerza & equilibrio',description:'Un poco más fuerte, cada semana.',color:'green',primary:true,createdAt:ago(35),exercises:[ex(0,4,10,60,0),ex(1,3,12,18,0),ex(20,3,12,20,0),ex(4,4,10,45,2),ex(5,3,12,40,2),ex(18,3,12,20,2),ex(8,4,8,70,4),ex(10,3,10,50,4),ex(16,3,12,8,4),ex(21,3,45,0,4)]};
 const second={id:crypto.randomUUID(),name:'Full body · Express',description:'Para los días en los que cada minuto cuenta.',color:'peach',primary:false,createdAt:ago(20),exercises:[ex(8,3,10,50,1),ex(0,3,10,45,1),ex(5,3,12,30,1),ex(21,3,30,0,1)]};
 const logs=Array.from({length:16},(_,i)=>({id:crypto.randomUUID(),date:ago(28-Math.floor(i*28/15)),routineId:routine.id,routineName:routine.name,duration:42+i%4*5,note:'',entries:[{exerciseId:catalog[0].id,name:catalog[0].name,sets:4,reps:10,load:40+Math.floor(i/3)*5},{exerciseId:catalog[8].id,name:catalog[8].name,sets:4,reps:8,load:50+Math.floor(i/3)*5},{exerciseId:catalog[5].id,name:catalog[5].name,sets:3,reps:12,load:25+Math.floor(i/4)*5}]}));
 return {profile:{height:178,weight:76.4,target:74,goal:'Ganar fuerza',weeklyGoal:4},routines:[routine,second],logs,weights:Array.from({length:10},(_,i)=>({id:crypto.randomUUID(),date:ago(27-i*3),value:Math.round((78.8-i*.267)*10)/10}))};
}
