import {createClient,SupabaseAuthAdapter} from '@neondatabase/neon-js';
const AUTH_URL=process.env.NEXT_PUBLIC_NEON_AUTH_URL || 'https://ep-dry-cell-avlzxkzn.neonauth.c-11.us-east-1.aws.neon.tech/neondb/auth';
const DATA_API_URL=process.env.NEXT_PUBLIC_NEON_DATA_API_URL || 'https://ep-dry-cell-avlzxkzn.apirest.c-11.us-east-1.aws.neon.tech/freshfresh/rest/v1';
export const neon=createClient({auth:{adapter:SupabaseAuthAdapter(),url:AUTH_URL},dataApi:{url:DATA_API_URL}});
export function withTimeout(promise,ms=10000){let timer;return Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('Connection timed out. Your device copy is still available.')),ms)})]).finally(()=>clearTimeout(timer));}
export async function currentSession(){
  const {data,error}=await withTimeout(neon.auth.getSession(),6000);
  if(error)throw error;
  const session=data?.session??data;
  return session?.user?.id?session:null;
}
export async function loadCloud(id){
  const {data,error}=await withTimeout(neon.from('planner_states').select('state,revision').eq('auth_user_id',id).maybeSingle());
  if(error)throw error;
  return data;
}
export async function saveCloud(id,state,revision){
  const query=revision===0?neon.from('planner_states').insert({auth_user_id:id,state,revision:1}):neon.from('planner_states').update({state,revision:revision+1,updated_at:new Date().toISOString()}).eq('auth_user_id',id).eq('revision',revision);
  const {data,error}=await withTimeout(query.select('revision').single());
  if(error || !data)throw new Error('Could not sync. Another device may have a newer plan. Reload the account copy or try again. Your changes are saved on this device.');
  return data.revision;
}
export async function legacyPreferences(id){
  const {data,error}=await withTimeout(neon.from('user_preferences').select('*').eq('auth_user_id',id).maybeSingle());
  if(error||!data)return null;
  const r=data;
  return {budget:Number(r.weekly_budget??70),people:r.household_size??1,minutes:Number(r.max_active_cooking_minutes??10),equipment:[r.has_stove&&'stove',r.has_microwave&&'microwave',r.has_fridge&&'fridge',r.has_freezer&&'freezer',r.has_oven&&'oven',r.has_air_fryer&&'airfryer'].filter(Boolean),stores:r.preferred_retailers,maxStores:r.max_stores,dislikes:(r.dislikes||[]).join(', '),portable:!!r.needs_portable_meals,reheat:!!r.can_reheat_away_from_home,cold:r.preferred_meal_temperature!=='hot'};
}
