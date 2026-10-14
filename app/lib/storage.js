import {DEFAULTS,normalizePreferences,validatePlan} from './planner.js';
export const emptyState=()=>({version:1,preferences:{...DEFAULTS},pantry:{},prices:{},plan:null,bought:{},cooked:[],updatedAt:new Date().toISOString()});
export const storageKey = id => `freshfresh:v1:${id||'guest'}`;
export function restoreState(raw) {
  if(!raw || raw.version!==1)return emptyState();
  const preferences=normalizePreferences(raw.preferences);
  const object=x=>x && typeof x==='object' && !Array.isArray(x)?x:{};
  return {...emptyState(),...raw,preferences,pantry:object(raw.pantry),prices:object(raw.prices),bought:object(raw.bought),cooked:Array.isArray(raw.cooked)?raw.cooked.filter(Number.isInteger):[],plan:validatePlan(raw.plan,preferences)?raw.plan:null};
}
export function loadLocal(id) {
  try {return {state:restoreState(JSON.parse(localStorage.getItem(storageKey(id))||'null')),error:null};}
  catch {return {state:emptyState(),error:'We could not read the saved plan on this device. You can start a new one.'};}
}
export function saveLocal(id,state) {
  try {localStorage.setItem(storageKey(id),JSON.stringify(state));return null;}
  catch {return 'Device storage is unavailable. Keep this page open and save to your account before leaving.';}
}
