// Generic planning quantities, not verified SKUs or current retailer inventory.
// Prices are explicit planning estimates for the package described below.
export const STORES = ['ALDI', 'Walmart', 'Trader Joe’s', 'Stater Bros.', 'Vons', 'Ralphs', 'Sprouts', 'Food 4 Less', 'Costco'];
const item = (id, name, pack, quantity, unit, cents, aisle, groups, allergens = [], storage = 'shelf', aliases = []) => ({id, name, pack, quantity, unit, cents, aisle, groups, allergens, storage, aliases});
export const INGREDIENTS = [
  item('oats','Rolled oats','18 oz bag',510,'g',249,'Pantry',['whole grains'],[], 'shelf',['oatmeal']),
  item('yogurt','Plain Greek yogurt','32 oz tub',907,'g',399,'Refrigerated',['protein','dairy'],['milk'],'fridge'),
  item('banana','Bananas','1 banana',1,'each',30,'Produce',['fruit']),
  item('apple','Apples','1 apple',1,'each',80,'Produce',['fruit']),
  item('berries','Frozen berries','12 oz bag',340,'g',349,'Frozen',['fruit'],[],'freezer'),
  item('bread','Whole-wheat bread','20 slices',20,'slices',249,'Bakery',['whole grains'],['wheat'],'shelf',['toast']),
  item('pb','Peanut butter','16 oz jar',454,'g',229,'Pantry',['protein'],['peanuts'],'shelf',['peanut']),
  item('tuna','Tuna in water','2.6 oz pouch',74,'g',119,'Pantry',['protein'],['fish']),
  item('chickpeas','Canned chickpeas','15 oz can · about 250 g drained',250,'g',89,'Pantry',['protein','plants'],[],'shelf',['garbanzo','beans']),
  item('beans','Canned black beans','15 oz can · about 250 g drained',250,'g',89,'Pantry',['protein','plants'],[],'shelf',['black bean']),
  item('rice','Ready-to-eat brown rice','8.8 oz pouch',250,'g',179,'Pantry',['whole grains']),
  item('wrap','Whole-wheat tortillas','8 tortillas',8,'each',249,'Bakery',['whole grains'],['wheat'],'shelf',['wrap']),
  item('spinach','Baby spinach','5 oz bag',142,'g',199,'Produce',['plants'],[],'fridge',['greens']),
  item('carrot','Baby carrots','1 lb bag',454,'g',149,'Produce',['plants'],[],'fridge'),
  item('tomato','Cherry tomatoes','10 oz pack',283,'g',229,'Produce',['plants'],[],'fridge'),
  item('hummus','Hummus','10 oz tub',283,'g',249,'Refrigerated',['protein','plants'],['sesame'],'fridge'),
  item('chicken','Fully cooked chicken strips','12 oz pack',340,'g',599,'Refrigerated',['protein'],[],'fridge',['poultry']),
  item('egg','Eggs','12 eggs',12,'each',299,'Refrigerated',['protein'],['eggs'],'fridge'),
  item('veg','Frozen mixed vegetables','12 oz bag',340,'g',149,'Frozen',['plants'],[],'freezer',['vegetables']),
  item('salsa','Mild salsa','16 oz jar',454,'g',199,'Pantry',['plants'],[],'fridge'),
  item('cheese','Shredded cheddar','8 oz bag',227,'g',229,'Refrigerated',['dairy','protein'],['milk'],'fridge'),
  item('pasta','Whole-wheat pasta','16 oz box',454,'g',149,'Pantry',['whole grains'],['wheat']),
  item('sauce','Tomato pasta sauce','24 oz jar',680,'g',179,'Pantry',['plants'],[],'fridge'),
  item('nuts','Unsalted almonds','8 oz bag',227,'g',349,'Pantry',['protein'],['tree nuts']),
];
export const BY_ID = Object.fromEntries(INGREDIENTS.map(x => [x.id, x]));
const meal = (id, name, minutes, tools, ingredients, steps, options = {}) => ({id,name,minutes,tools,ingredients,steps,temperature:'cold',portable:true,needsCold:true,vegetarian:true,art:'bowl',...options});
export const MEALS = [
  meal('yogurt-bowl','Berry yogurt crunch',3,[],[['yogurt',170],['oats',40],['berries',70]],['Thaw just the berries you need in the fridge.','Spoon yogurt into a bowl. Add oats and berries.'],{art:'berry'}),
  meal('banana-oats','Banana overnight oats',4,[],[['oats',50],['yogurt',120],['banana',1]],['Mix oats, yogurt and a splash of water in a covered container.','Refrigerate overnight. Slice the banana on top when you eat.'],{wait:'Chill overnight',art:'oats'}),
  meal('pb-banana','Peanut butter banana sandwich',3,[],[['bread',2],['pb',32],['banana',1]],['Spread peanut butter on the bread.','Keep the banana whole until mealtime, then slice and add it.'],{needsCold:false,art:'sandwich'}),
  meal('tuna-wrap','Tuna & crunchy carrot wrap',5,[],[['tuna',74],['wrap',1],['carrot',80],['spinach',25]],['Open and drain the tuna. Thinly slice the carrots.','Fill the tortilla with tuna, spinach and carrots; roll tightly.'],{vegetarian:false,art:'wrap'}),
  meal('chickpea-wrap','Creamy chickpea wrap',5,[],[['chickpeas',125],['wrap',1],['hummus',40],['spinach',25]],['Drain and rinse the chickpeas. Lightly mash with hummus.','Spread on a tortilla, add spinach and roll. Refrigerate unused chickpeas.'],{art:'wrap'}),
  meal('hummus-plate','Crunchy hummus lunch plate',4,[],[['hummus',80],['carrot',100],['bread',2],['apple',1]],['Spoon hummus into a container. Add carrots and bread.','Wash the apple and pack it whole on the side.'],{art:'plate'}),
  meal('chicken-wrap','Chicken & greens wrap',5,[],[['chicken',100],['wrap',1],['spinach',30],['hummus',30]],['Use ready-to-eat, fully cooked chicken; check the package.','Spread hummus on the tortilla, add chicken and spinach, then roll.'],{vegetarian:false,art:'wrap'}),
  meal('chickpea-bowl','Chickpea & tomato crunch',5,[],[['chickpeas',150],['tomato',100],['spinach',30],['hummus',35]],['Drain and rinse chickpeas; halve the tomatoes.','Combine with spinach. Loosen hummus with water and use as dressing.'],{art:'salad'}),
  meal('pb-apple','Apple & peanut butter lunch',3,[],[['bread',2],['pb',40],['apple',1],['nuts',25]],['Make a peanut butter sandwich.','Pack the whole apple and almonds alongside it.'],{needsCold:false,art:'sandwich'}),
  meal('bean-rice','Five-minute bean & rice bowl',5,['microwave'],[['beans',125],['rice',125],['salsa',50],['spinach',30]],['Drain and rinse the beans. Heat beans and rice following their package directions.','Stir in spinach and finish with salsa. Refrigerate unused beans and rice.'],{temperature:'hot',art:'bowl'}),
  meal('chicken-rice','Chicken & veggie rice bowl',8,['microwave'],[['chicken',100],['rice',125],['veg',120]],['Heat the rice and vegetables following package directions.','Add fully cooked chicken and heat as directed on its package.'],{temperature:'hot',vegetarian:false,art:'bowl'}),
  meal('eggs-toast','Spinach eggs on toast',10,['stove'],[['egg',2],['bread',2],['spinach',40]],['Warm a nonstick pan. Add spinach and a splash of water.','Add beaten eggs and cook until firm. Serve with bread toasted in the dry pan.'],{temperature:'hot',portable:false,art:'toast'}),
  meal('bean-quesadilla','Black bean quesadilla',10,['stove'],[['wrap',2],['beans',125],['cheese',40],['salsa',40]],['Drain beans. Fill one tortilla with beans and cheese; top with the other.','Warm in a dry nonstick pan on both sides until heated through. Serve with salsa.'],{temperature:'hot',art:'quesadilla'}),
  meal('pasta-beans','One-pot tomato & chickpea pasta',15,['stove'],[['pasta',85],['chickpeas',100],['sauce',150],['spinach',30]],['Cook pasta in water according to the package, then drain.','Return to the pot with rinsed chickpeas, sauce and spinach. Heat through.'],{temperature:'hot',art:'pasta'}),
  meal('warm-oats','Warm peanut butter oats',5,['microwave'],[['oats',50],['pb',25],['banana',1]],['Combine oats and water according to package directions; microwave in a large bowl.','Stir in peanut butter and top with sliced banana.'],{temperature:'hot',needsCold:false,portable:false,art:'oats'}),
];
export const MEAL_BY_ID = Object.fromEntries(MEALS.map(x => [x.id,x]));
export const ALLERGENS = ['milk','eggs','fish','shellfish','peanuts','tree nuts','wheat','soy','sesame'];
