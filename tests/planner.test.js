import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULTS,generatePlan,cartFor,compatibleMeals,isCompatible,alternatives,foodGroups,normalizePreferences,preferenceErrors,validatePlan,packagePrice} from '../app/lib/planner.js';
import {MEAL_BY_ID,BY_ID,STORES} from '../app/lib/catalog.js';
import {restoreState,emptyState,storageKey} from '../app/lib/storage.js';

test('default week covers seven meals within package budget, with real variety',()=>{
 const plan=generatePlan(DEFAULTS),cart=cartFor(plan.mealIds,DEFAULTS,{}, {},plan.stores);
 assert.equal(plan.mealIds.length,7);assert.equal(plan.total,cart.total);assert.ok(cart.total<=7000);assert.ok(new Set(plan.mealIds).size>=5);
 assert.equal(foodGroups(plan.mealIds).filter(x=>x.count>0).length,5);
});
test('no-cook means assembly only and equipment is a hard constraint',()=>{
 for(const p of [{...DEFAULTS,minutes:0},{...DEFAULTS,equipment:['fridge']}]){
 const plan=generatePlan(p);assert.ok(plan.mealIds.length);for(const id of plan.mealIds){assert.equal(MEAL_BY_ID[id].tools.length,0);assert.ok(MEAL_BY_ID[id].minutes<=5);}
 }
 assert.equal(isCompatible(MEAL_BY_ID['bean-rice'],{...DEFAULTS,equipment:['stove','fridge']}),false);
});
test('portable lunches honor cold storage, reheating and temperature',()=>{
 const p={...DEFAULTS,portable:true,coldStorage:false,reheat:false};
 const meals=compatibleMeals(p);assert.ok(meals.length);assert.ok(meals.every(m=>!m.needsCold&&m.portable&&m.temperature==='cold'));
 assert.equal(compatibleMeals({...p,cold:false}).length,0);
});
test('no home refrigeration excludes perishable and opened-can plans',()=>{
 const meals=compatibleMeals({...DEFAULTS,equipment:[]});assert.ok(meals.length);assert.ok(meals.every(m=>!m.needsCold));
});
test('dislikes, allergens and vegetarian choices are enforced',()=>{
 const p={...DEFAULTS,vegetarian:true,avoid:['milk','peanuts'],dislikes:'chickpeas, banana'};
 const meals=compatibleMeals(p);for(const m of meals){assert.ok(m.vegetarian);for(const [id] of m.ingredients){assert.ok(!['chickpeas','banana','pb','yogurt','cheese'].includes(id));}}
 assert.equal(isCompatible(MEAL_BY_ID['chickpea-wrap'],{...DEFAULTS,avoid:['sesame']}),false);
});
test('whole packages are rounded after household and partial pantry quantities',()=>{
 const p={...DEFAULTS,people:3};const cart=cartFor(['pb-banana'],p,{bread:.25,pb:.1});
 const bread=cart.items.find(x=>x.id==='bread'),pb=cart.items.find(x=>x.id==='pb');
 assert.equal(bread.needed,6);assert.equal(bread.pantryUsed,5);assert.equal(bread.packs,1);assert.equal(bread.leftover,19);assert.equal(pb.packs,1);
 const enough=cartFor(['pb-banana'],p,{bread:1,pb:1,banana:3});assert.equal(enough.total,0);
});
test('tight and zero budgets show infeasibility without inventing coverage',()=>{
 const p={...DEFAULTS,budget:0};let plan=generatePlan(p);assert.equal(plan.mealIds.length,0);assert.equal(plan.missing,7);assert.ok(plan.reason);
 plan=generatePlan({...p,meals:1},{bread:1,pb:1,banana:1});assert.equal(plan.mealIds.length,1);assert.equal(plan.total,0);
});
test('family plan attempts economy fallback before claiming incomplete coverage',()=>{
 const p={...DEFAULTS,people:4,meals:14};const plan=generatePlan(p);assert.equal(plan.mealIds.length,14);assert.ok(plan.total<=7000);assert.ok(new Set(plan.mealIds).size>1);
});
test('observed prices stay scoped to store and do not alter estimate records',()=>{
 const prices={'Walmart:bread':{cents:999,at:'2026-09-17'}};assert.equal(packagePrice('bread','Walmart',prices).cents,999);assert.equal(packagePrice('bread','ALDI',prices).cents,BY_ID.bread.cents);assert.equal(packagePrice('bread','ALDI').source,'Planning estimate');
});
test('all planned purchases honor stores and one-store mode',()=>{
 const p={...DEFAULTS,stores:['ALDI','Walmart','Vons'],maxStores:2,mode:'one'};
 const prices={'Walmart:bread':{cents:1},'Vons:pb':{cents:1}};
 const plan=generatePlan(p,{},prices);assert.equal(plan.stores.length,1);assert.ok(p.stores.includes(plan.stores[0]));
});
test('swaps meet the budget and every original hard constraint',()=>{
 const p={...DEFAULTS,minutes:0,portable:true,coldStorage:false};const plan=generatePlan(p);
 for(const x of alternatives(plan,0,p,{},{})){assert.ok(x.cart.total<=p.budget*100);assert.ok(isCompatible(x.meal,p));assert.equal(x.mealIds.length,plan.mealIds.length);assert.notEqual(x.mealIds[0],plan.mealIds[0]);}
});
test('picked-up food remains in the checkout total after a swap',()=>{
 const purchased={'ALDI:tuna':2};const cart=cartFor(['pb-banana'],DEFAULTS,{}, {},['ALDI'],purchased);
 const tuna=cart.items.find(x=>x.id==='tuna');assert.equal(tuna.needed,0);assert.equal(tuna.packs,2);assert.equal(tuna.leftover,148);assert.equal(tuna.lineTotal,238);
 const shifted=cartFor(['tuna-wrap'],DEFAULTS,{}, {'Walmart:tuna':{cents:1}},['ALDI','Walmart'],purchased);assert.equal(shifted.items.find(x=>x.id==='tuna').store,'ALDI');
});
test('pantry and malformed preferences are bounded',()=>{
 const p=normalizePreferences({people:100,meals:-1,budget:NaN,equipment:['spaceship'],stores:['Invalid'],avoid:'milk'});assert.equal(p.people,8);assert.equal(p.meals,1);assert.equal(p.budget,70);assert.deepEqual(p.equipment,[]);assert.deepEqual(p.stores,[]);
 assert.ok(preferenceErrors({...DEFAULTS,budget:''}).length);assert.ok(preferenceErrors({...DEFAULTS,stores:[]}).length);
});
test('stored plans are versioned, checked against constraints and account scoped',()=>{
 assert.notEqual(storageKey('a'),storageKey('b'));assert.notEqual(storageKey(null),storageKey('a'));
 const state=emptyState();state.plan=generatePlan(DEFAULTS);assert.ok(restoreState(state).plan);
 assert.equal(restoreState({...state,plan:{...state.plan,mealIds:['not-real']}}).plan,null);
 assert.equal(restoreState({version:77}).plan,null);
 assert.equal(validatePlan({...state.plan,stores:['Not a store']},DEFAULTS),false);
});
test('generated plans obey constraints across representative household scenarios',()=>{
 for(const people of [1,2,4])for(const minutes of [0,5,15])for(const budget of [10,30,70]){
 const p={...DEFAULTS,people,minutes,budget};const plan=generatePlan(p);assert.ok(validatePlan(plan,p));assert.ok(plan.total<=budget*100);assert.equal(plan.mealIds.length+plan.missing,p.meals);
 }
});
