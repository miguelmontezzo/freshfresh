import {BY_ID, INGREDIENTS, MEALS, MEAL_BY_ID, STORES, ALLERGENS} from './catalog.js';

export const DEFAULTS = {budget:70, people:1, meals:7, minutes:10, equipment:['stove','microwave','fridge','freezer'], portable:false, coldStorage:true, reheat:false, cold:true, dislikes:'', avoid:[], vegetarian:false, stores:['ALDI'], maxStores:1, mode:'balance'};
export const money = cents => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(cents/100);
export const priceKey = (store,id) => `${store}:${id}`;
const bounded = (v,min,max,fallback) => Number.isFinite(Number(v)) ? Math.min(max,Math.max(min,Number(v))) : fallback;
export function normalizePreferences(p = {}) {
  const arr = (v, allowed, fallback) => Array.isArray(v) ? [...new Set(v.filter(x=>allowed.includes(x)))] : fallback;
  return {...DEFAULTS,...p,budget:bounded(p.budget,0,2000,70),people:Math.round(bounded(p.people,1,8,1)),meals:Math.round(bounded(p.meals,1,14,7)),minutes:[0,5,10,15,30].includes(Number(p.minutes))?Number(p.minutes):10,
    equipment:arr(p.equipment,['stove','microwave','oven','airfryer','fridge','freezer'],DEFAULTS.equipment),stores:arr(p.stores,STORES,DEFAULTS.stores),avoid:arr(p.avoid,ALLERGENS,[]),maxStores:Math.round(bounded(p.maxStores,1,3,1)),mode:['cheap','balance','one'].includes(p.mode)?p.mode:'balance',dislikes:typeof p.dislikes==='string'?p.dislikes.slice(0,500):'',portable:!!p.portable,coldStorage:p.coldStorage!==false,reheat:!!p.reheat,cold:p.cold!==false,vegetarian:!!p.vegetarian};
}
export function preferenceErrors(p) {
  const errors=[];
  if(!Number.isFinite(Number(p.budget)) || Number(p.budget)<0 || p.budget==='') errors.push('Enter a budget of $0 or more.');
  if(!p.stores?.length) errors.push('Choose at least one store.');
  if(p.portable && !p.cold && !p.reheat) errors.push('For meals away from home, allow cold meals or tell us you can reheat.');
  return errors;
}
export function dislikeTokens(p) {return p.dislikes.toLowerCase().split(/[,;\n]+/).map(x=>x.trim()).filter(Boolean);}
export function isCompatible(meal, preferences) {
  const p=normalizePreferences(preferences);
  if(p.minutes===0 ? meal.tools.length>0 || meal.minutes>5 : meal.minutes>p.minutes) return false;
  if(!meal.tools.every(t=>p.equipment.includes(t))) return false;
  if(!p.cold && meal.temperature==='cold') return false;
  if(p.vegetarian && !meal.vegetarian) return false;
  if(p.portable && (!meal.portable || (meal.needsCold && !p.coldStorage) || (meal.temperature==='hot' && !p.reheat))) return false;
  const tokens=dislikeTokens(p);
  return meal.ingredients.every(([id])=>{
    const x=BY_ID[id];
    if(x.storage==='fridge' && !p.equipment.includes('fridge'))return false;
    if(x.storage==='freezer' && (!p.equipment.includes('freezer') || !p.equipment.includes('fridge')))return false;
    // Opened canned foods and assembled perishable meals also need refrigeration.
    if(meal.needsCold && !p.equipment.includes('fridge'))return false;
    if(x.allergens.some(a=>p.avoid.includes(a)))return false;
    const text=[x.name,...x.aliases].join(' ').toLowerCase();
    return !tokens.some(t=>text.includes(t));
  });
}
export const compatibleMeals = p => MEALS.filter(x=>isCompatible(x,p));
export function unmatchedDislikes(p) {return dislikeTokens(p).filter(t=>!INGREDIENTS.some(x=>[x.name,...x.aliases].join(' ').toLowerCase().includes(t)));}
export function packagePrice(id,store,prices={}) {
  const report=prices[priceKey(store,id)];
  return report && Number.isInteger(report.cents) && report.cents>=0 && report.cents<=100000 ? {cents:report.cents,source:'Your price',at:report.at}: {cents:BY_ID[id].cents,source:'Planning estimate',at:null};
}
export function cartFor(mealIds,p,pantry={},prices={},stores=p.stores,purchased={}) {
  const needed={};
  for(const id of mealIds)for(const [key,qty] of MEAL_BY_ID[id]?.ingredients||[]) needed[key]=(needed[key]||0)+qty*p.people;
  for(const [key,count] of Object.entries(purchased)){const id=key.slice(key.indexOf(':')+1);if(count>0 && BY_ID[id])needed[id]??=0;}
  const items=Object.entries(needed).map(([id,quantity])=>{
    const ingredient=BY_ID[id];
    const inPantry=bounded(pantry[id],0,100,0)*ingredient.quantity;
    const boughtEntry=Object.entries(purchased).find(([key,count])=>key.endsWith(':'+id)&&count>0);
    const boughtCount=boughtEntry?Number(boughtEntry[1]):0;
    const packs=Math.max(boughtCount,0,Math.ceil((quantity-inPantry-1e-8)/ingredient.quantity));
    const lockedStore=boughtEntry?.[0].slice(0,boughtEntry[0].indexOf(':'));
    const offers=(lockedStore?[lockedStore]:stores).map(store=>({...packagePrice(id,store,prices),store})).sort((a,b)=>a.cents-b.cents || stores.indexOf(a.store)-stores.indexOf(b.store));
    const offer=offers[0]||{cents:ingredient.cents,store:'',source:'Planning estimate',at:null};
    return {...ingredient,...offer,needed:quantity,pantryUsed:Math.min(quantity,inPantry),packs,leftover:Math.max(0,inPantry+packs*ingredient.quantity-quantity),lineTotal:packs*offer.cents,key:priceKey(offer.store,id)};
  }).sort((a,b)=>a.store.localeCompare(b.store)||a.aisle.localeCompare(b.aisle)||a.name.localeCompare(b.name));
  const total=items.reduce((s,x)=>s+x.lineTotal,0);
  return {items,total,stores:[...new Set(items.filter(x=>x.packs>0).map(x=>x.store))]};
}
function combinations(stores,max) {
  const sets=[];
  function visit(start,current){if(current.length)sets.push(current);if(current.length===max)return;for(let i=start;i<stores.length;i++)visit(i+1,[...current,stores[i]]);}
  visit(0,[]);return sets;
}
function rank(ids,cart,p) {
  const unique=new Set(ids).size;
  const covered=foodGroups(ids).filter(x=>x.count>0).length;
  const minutes=ids.reduce((s,id)=>s+MEAL_BY_ID[id].minutes,0);
  // Product heuristics, not survey-derived weights or nutritional ratings.
  return cart.total+(p.mode==='cheap'?10:250)*cart.stores.length+(p.mode==='cheap'?0:minutes*2-unique*700-covered*600);
}
export function generatePlan(preferences,pantry={},prices={},seed=0,purchased={}) {
  const p=normalizePreferences(preferences),options=compatibleMeals(p),budget=Math.round(p.budget*100);
  if(!p.stores.length || !options.length)return {mealIds:[],stores:[],total:0,missing:p.meals,reason:!p.stores.length?'Choose a store to build your week.':'No meals fit all of these preferences yet. Try adjusting time, ingredients or equipment.',seed};
  const subsets=combinations(p.stores,p.mode==='one'?1:p.maxStores);
  let best=null;
  // Several deterministic starts reduce the risk of a greedy first meal exhausting the budget.
  for(const stores of subsets)for(let start=-1;start<=options.length;start++){
    const economy=p.mode==='cheap'||start===-1;
    const boughtStores=Object.keys(purchased).filter(k=>purchased[k]>0).map(k=>k.slice(0,k.indexOf(':')));
    if(boughtStores.some(s=>!stores.includes(s)))continue;
    const ids=[];let cart={items:[],total:0,stores:[]};
    for(let n=0;n<p.meals;n++){
      let choices=options.map((m,i)=>{
        const next=cartFor([...ids,m.id],p,pantry,prices,stores,purchased),repeat=ids.filter(id=>id===m.id).length;
        return {meal:m,cart:next,score:next.total-cart.total+(economy?0:500)*repeat+(economy?0:m.minutes*2-(repeat===0?350:0)-foodGroups([m.id]).filter(g=>g.count && !foodGroups(ids).find(x=>x.group===g.group)?.count).length*500)+(i+seed)%options.length};
      }).filter(x=>x.cart.total<=budget);
      if(!choices.length)break;
      choices.sort((a,b)=>a.score-b.score);
      let chosen=n===0 && start>=0 && start<options.length ? choices.find(x=>x.meal.id===options[(start+seed)%options.length].id)||choices[0]:choices[0];
      ids.push(chosen.meal.id);cart=chosen.cart;
    }
    const candidate={mealIds:ids,stores,total:cart.total,missing:p.meals-ids.length,score:rank(ids,cart,p),seed};
    if(!best || ids.length>best.mealIds.length || (ids.length===best.mealIds.length && candidate.score<best.score))best=candidate;
  }
  if(!best)return {mealIds:[],stores:[],missing:p.meals,reason:'Your purchased items use stores outside these preferences. Keep those stores or start a new week.',seed};
  if(p.mode!=='cheap' && best.mealIds.length){
    for(let pass=0;pass<2;pass++)for(let index=0;index<best.mealIds.length;index++){
      for(const meal of options){
        const ids=best.mealIds.map((id,i)=>i===index?meal.id:id);
        const cart=cartFor(ids,p,pantry,prices,best.stores,purchased);
        const score=rank(ids,cart,p);
        if(cart.total<=budget && score<best.score){best={...best,mealIds:ids,total:cart.total,score};}
      }
    }
  }
  return {...best,reason:best.missing?'This budget does not cover all requested meals with this collection. Add pantry items, change preferences or raise the budget.':''};
}
export function alternatives(plan,index,p,pantry,prices,{quick=false,purchased={}}={}) {
  const original=MEAL_BY_ID[plan.mealIds[index]];
  return compatibleMeals(p).filter(m=>m.id!==original?.id && (!quick || (m.tools.length===0 && m.minutes<=5)))
    .map(meal=>{const ids=plan.mealIds.map((id,i)=>i===index?meal.id:id);const cart=cartFor(ids,p,pantry,prices,plan.stores,purchased);return {meal,cart,mealIds:ids};})
    .filter(x=>x.cart.total<=Math.round(p.budget*100)).sort((a,b)=>a.cart.total-b.cart.total||a.meal.minutes-b.meal.minutes);
}
export function foodGroups(ids) {
  return ['plants','fruit','whole grains','protein','dairy'].map(group=>({group,count:ids.filter(id=>MEAL_BY_ID[id]?.ingredients.some(([key])=>BY_ID[key].groups.includes(group))).length}));
}
export function validatePlan(plan,p) {
  return !!plan && Array.isArray(plan.mealIds) && plan.mealIds.length<=p.meals && plan.mealIds.every(id=>MEAL_BY_ID[id]&&isCompatible(MEAL_BY_ID[id],p)) && Array.isArray(plan.stores) && plan.stores.length<=(p.mode==='one'?1:p.maxStores) && plan.stores.every(s=>p.stores.includes(s));
}
