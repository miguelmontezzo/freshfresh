# freshfresh

**Eat better. Live easier.**

Mobile-first PWA that builds a grocery week around real life: budget, cooking effort, available equipment, portability, preferred stores, taste and flexible nutrition coverage.

## Functional MVP

- adaptive 7-step onboarding
- zero-cook / low-cook modes
- microwave, stove, oven, air-fryer, fridge/freezer context
- portable / cold / away-from-home reheating preferences
- budget + household + meals-to-solve
- preferred stores + maximum store count + optimization mode
- deterministic Fresh Intelligence product scoring
- real product package imagery for verified seed products
- Shopping Mode feed with Got It / Skip / Update Price
- bought/open list state
- community price reports with timestamp and source label
- flexible nutrition blocks instead of strict calorie tracking
- local persistence so the prototype is immediately testable

## Data architecture

Neon remains the source of truth for production. The next database migration adds real-life cooking fields, community price reports and owner-scoped RLS for plan items/nutrition blocks. Until that migration is approved/applied and auth is wired to the deployment, the branch intentionally uses browser localStorage for user state rather than pretending demo state is server persistence.

## Run

```bash
npm install
npm run dev
```
