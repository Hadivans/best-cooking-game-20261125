// Sizzle & Serve — screenshot scenes behind ?shot=start|play|serve|end.
// Each scene plays the real rules forward from a fresh world with a fixed
// seed, steered by a cook bot that works the oldest order: fetch the missing
// ingredients, grill the patty, build the burger, ring the bell. The same
// seed always gives the same frame.
import { STEP } from './config.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { burgerMatches, missingItems } from './recipes.js';
import { stationById } from './world.js';

const START_SECONDS = 4;
const PLAY_SECONDS = 34;
const SERVE_WAIT_SECONDS = 90;
const END_LIMIT_SECONDS = 130;

/**
 * The cook bot: decide this step's move and interaction for the oldest order.
 * Returns { move, targetX, interact }.
 */
function cookBot(world) {
  const state = world.state;
  const chef = state.chef;
  const order = world.oldestOrder();
  const idle = { move: 0, targetX: null, interact: false };
  if (!order || state.over) return idle;

  const holding = chef.holding;
  const go = (stationId) => ({ move: 0, targetX: stationById(stationId).x, interact: false });
  const use = (stationId) => {
    const station = stationById(stationId);
    if (Math.abs(chef.x - station.x) < 12) return { move: 0, targetX: null, interact: true };
    return go(stationId);
  };

  // Plate complete: go ring the bell.
  if (world.plateReady()) return use('serve');

  // Holding something: deliver it.
  if (holding) {
    if (holding.id === 'patty' && !holding.cooked) {
      // Raw patty goes on a free grill slot.
      if (state.grill.some((slot) => slot === null)) return use('grill');
      return go('grill');
    }
    if (holding.id === 'fries' || holding.id === 'cola') {
      // Side goes on the tray at the plate — but only if this order wants it.
      if (order.recipe.side === holding.id) return use('plate');
      return use('bin');
    }
    // Burger item: to the plate, unless the plate already has it.
    const missing = missingItems(state.plate, order.recipe);
    if (missing.includes(holding.id)) return use('plate');
    return use('bin');
  }

  // Hands empty: what does the oldest order still need?
  const missing = missingItems(state.plate, order.recipe);
  // A cooked patty waiting on the grill comes first.
  const cookedSlot = state.grill.findIndex((slot) => slot && slot.progress >= 4 && !slot.burnt);
  if (cookedSlot !== -1 && missing.includes('patty')) return use('grill');
  // A burnt patty must be trashed before the grill can be used again.
  const burntSlot = state.grill.findIndex((slot) => slot && slot.burnt);
  if (burntSlot !== -1) return use('grill');
  // A patty still cooking: wait by the grill if nothing else is missing.
  const cooking = state.grill.some((slot) => slot && !slot.burnt && slot.progress < 4);
  if (missing.length === 1 && missing[0] === 'patty' && cooking) return go('grill');
  if (missing.includes('patty') && !cooking && !state.grill.some((slot) => slot)) {
    return use('patty');
  }
  // Next missing burger item.
  const next = missing.find((item) => item !== 'patty');
  if (next) return use(next);
  // Burger done; fetch the side.
  if (order.recipe.side && state.traySide !== order.recipe.side) {
    return use(order.recipe.side);
  }
  return idle;
}

/** Step the world with the bot for `seconds`, or until `stop(state)` is true. */
function runBot(world, seconds, stop) {
  const steps = Math.floor(seconds / STEP);
  for (let i = 0; i < steps; i += 1) {
    if (world.state.over) break;
    if (stop && stop(world.state)) break;
    const action = cookBot(world);
    world.step(STEP, action, false);
  }
}

/**
 * Set `world` to the named scene and return the screen to draw over it and
 * the best score to show.
 */
export function stageShot(name, world) {
  world.reset();
  if (name !== 'play' && name !== 'serve' && name !== 'end') {
    for (let i = 0; i < START_SECONDS / STEP; i += 1) {
      world.step(STEP, { move: 0, targetX: null, interact: false }, true);
    }
    return { screen: SCREEN_TITLE, best: 0 };
  }
  if (name === 'play') {
    runBot(world, PLAY_SECONDS);
    return { screen: SCREEN_PLAY, best: world.state.score };
  }
  if (name === 'serve') {
    // Cook until a plate is complete and ready to serve, then freeze there.
    runBot(world, SERVE_WAIT_SECONDS, (state) => {
      const order = world.oldestOrder();
      if (!order) return false;
      return world.plateReady();
    });
    return { screen: SCREEN_PLAY, best: world.state.score };
  }
  // end: play the whole shift out.
  runBot(world, END_LIMIT_SECONDS);
  return { screen: world.state.over ? SCREEN_OVER : SCREEN_PLAY, best: world.state.score };
}
