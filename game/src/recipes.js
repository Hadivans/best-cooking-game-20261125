// Sizzle & Serve — the menu: what an order asks for, and whether a plate
// plus tray matches it. Matching is by multiset, so the build order is free
// but the contents must be exact.
import { INGREDIENTS, RECIPES } from './config.js';

export function recipeByName(name) {
  return RECIPES.find((recipe) => recipe.name === name) ?? RECIPES[0];
}

/** Count how many of each item a list holds. */
export function countItems(list) {
  const counts = {};
  for (const item of list) counts[item] = (counts[item] ?? 0) + 1;
  return counts;
}

/** True when the plate holds exactly the recipe's burger items. */
export function burgerMatches(plate, recipe) {
  const have = countItems(plate);
  const want = countItems(recipe.items);
  const keys = new Set([...Object.keys(have), ...Object.keys(want)]);
  for (const key of keys) {
    if ((have[key] ?? 0) !== (want[key] ?? 0)) return false;
  }
  return true;
}

/** Items still missing from the plate for this recipe, in recipe order. */
export function missingItems(plate, recipe) {
  const have = countItems(plate);
  const missing = [];
  for (const item of recipe.items) {
    if ((have[item] ?? 0) > 0) have[item] -= 1;
    else missing.push(item);
  }
  return missing;
}

/** True when the plate and tray together satisfy the whole order. */
export function orderComplete(plate, traySide, order) {
  if (!burgerMatches(plate, order.recipe)) return false;
  if (order.recipe.side === null) return traySide === null;
  return traySide === order.recipe.side;
}

/** First item on the plate that the recipe does not want (a wrong build). */
export function wrongItem(plate, recipe) {
  const want = countItems(recipe.items);
  const have = countItems(plate);
  for (const item of Object.keys(have)) {
    if ((have[item] ?? 0) > (want[item] ?? 0)) return item;
  }
  return null;
}

export function ingredientLabel(id) {
  return INGREDIENTS[id]?.label ?? id;
}
