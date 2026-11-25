// Sizzle & Serve — the kitchen world: orders, grill, plate, scoring.
// The chef walks the counter, picks ingredients, grills patties, builds the
// burger on the plate and rings the bell at the serve window. One fixed step
// (1/60 s) advances everything, so replays are deterministic.
import {
  CHEF_SPEED, CHEF_Y, GRILL_BURN_SECONDS, GRILL_COOK_SECONDS, MAX_ORDERS,
  ORDER_PATIENCE, ORDER_SPAWN_RUSH, ORDER_SPAWN_START, RECIPES, RUSH_AT_SECONDS,
  SHIFT_SECONDS, START_LIVES, STATIONS,
} from './config.js';
import { createRandom, pick } from './random.js';
import { burgerMatches, missingItems, orderComplete, wrongItem } from './recipes.js';

export const EVENT_SERVED = 1;
export const EVENT_WRONG = 2;
export const EVENT_LOST_ORDER = 4;
export const EVENT_OVER = 8;
export const EVENT_BURNT = 16;

let nextOrderId = 1;

export function stationById(id) {
  return STATIONS.find((station) => station.id === id);
}

export function nearestStation(x) {
  let best = STATIONS[0];
  for (const station of STATIONS) {
    if (Math.abs(station.x - x) < Math.abs(best.x - x)) best = station;
  }
  return best;
}

function makeOrder(random, patienceScale) {
  const recipe = pick(random, RECIPES);
  const patience = ORDER_PATIENCE * patienceScale;
  return { id: nextOrderId, recipe, patience, maxPatience: patience, born: 0 };
}

export function createWorld(random) {
  const state = {
    random,
    chef: { x: 640, holding: null, facing: 1, walk: 0, busy: 0 },
    grill: [null, null],
    plate: [],
    traySide: null,
    orders: [],
    spawnIn: 2,
    timeLeft: SHIFT_SECONDS,
    elapsed: 0,
    score: 0,
    served: 0,
    combo: 0,
    bestCombo: 0,
    lives: START_LIVES,
    rush: false,
    over: false,
    won: false,
    toast: '',
    toastIn: 0,
    shake: 0,
    particles: [],
    floats: [],
    servedFlash: 0,
  };

  function say(text, seconds) {
    state.toast = text;
    state.toastIn = seconds;
  }

  function burst(x, y, color, count) {
    for (let i = 0; i < count; i += 1) {
      state.particles.push({
        x, y,
        vx: (state.random() - 0.5) * 220,
        vy: -40 - state.random() * 140,
        life: 0.5 + state.random() * 0.5,
        age: 0,
        color,
        size: 3 + state.random() * 5,
      });
    }
  }

  function floatText(x, y, text, color) {
    state.floats.push({ x, y, text, color, age: 0, life: 1.2 });
  }

  function spawnOrder() {
    if (state.orders.length >= MAX_ORDERS) return;
    const scale = state.rush ? 0.8 : 1;
    const order = makeOrder(state.random, scale);
    nextOrderId += 1;
    state.orders.push(order);
    say(`New order: ${order.recipe.name}!`, 2);
  }

  /** The context action at the station the chef stands by. Returns events. */
  function interact() {
    const station = nearestStation(state.chef.x);
    if (Math.abs(station.x - state.chef.x) > 70) return 0;
    const chef = state.chef;
    let events = 0;

    if (station.id === 'grill') {
      // Take a cooked patty, flip a cooking one, or trash a burnt one.
      for (let slot = 0; slot < state.grill.length; slot += 1) {
        const patty = state.grill[slot];
        if (patty && patty.burnt) {
          state.grill[slot] = null;
          say('Burnt patty trashed!', 1.5);
          return 0;
        }
        if (patty && patty.progress >= GRILL_COOK_SECONDS) {
          if (!chef.holding) {
            chef.holding = { id: 'patty', cooked: true };
            state.grill[slot] = null;
            burst(station.x, 470, '#f7c948', 10);
            say('Cooked patty!', 1);
          }
          return 0;
        }
      }
      for (let slot = 0; slot < state.grill.length; slot += 1) {
        const patty = state.grill[slot];
        if (patty && !patty.flipped && patty.progress > 1) {
          patty.flipped = true;
          say('Flipped!', 0.8);
          return 0;
        }
      }
      if (chef.holding && chef.holding.id === 'patty' && !chef.holding.cooked) {
        // Holding a raw patty: place it on a free slot.
        for (let slot = 0; slot < state.grill.length; slot += 1) {
          if (!state.grill[slot]) {
            state.grill[slot] = { progress: 0, flipped: false, burnt: false };
            chef.holding = null;
            burst(station.x, 470, '#ff9d5c', 8);
            say('Sizzling…', 1);
            return 0;
          }
        }
        say('Grill is full!', 1);
      }
      return 0;
    }

    if (station.id === 'plate') {
      if (chef.holding) {
        const item = chef.holding;
        if (item.id === 'patty' && !item.cooked) {
          say('Cook it on the grill first!', 1.5);
          return 0;
        }
        if (item.id === 'fries' || item.id === 'cola') {
          state.traySide = item.id;
          chef.holding = null;
          say(`${item.id === 'fries' ? 'Fries' : 'Cola'} on the tray!`, 1);
        } else {
          state.plate.push(item.id);
          chef.holding = null;
          burst(station.x, 480, '#ffffff', 6);
        }
      }
      return 0;
    }

    if (station.id === 'bin') {
      if (chef.holding) {
        chef.holding = null;
        say('Trashed.', 0.8);
      } else if (state.plate.length > 0 || state.traySide) {
        state.plate = [];
        state.traySide = null;
        say('Plate cleared.', 1);
      }
      return 0;
    }

    if (station.id === 'serve') {
      if (state.plate.length === 0) {
        say('Nothing on the plate!', 1.2);
        return 0;
      }
      const order = state.orders.find((o) => orderComplete(state.plate, state.traySide, o));
      if (order) {
        const tip = Math.round(40 * (order.patience / order.maxPatience));
        const comboBonus = state.combo * 25;
        const gained = order.recipe.base + tip + comboBonus;
        state.score += gained;
        state.served += 1;
        state.combo += 1;
        state.bestCombo = Math.max(state.bestCombo, state.combo);
        state.orders = state.orders.filter((o) => o.id !== order.id);
        state.plate = [];
        state.traySide = null;
        state.servedFlash = 1;
        burst(station.x, 420, '#ffd94a', 26);
        burst(station.x, 420, '#ff7a9e', 14);
        floatText(station.x - 40, 380, `+${gained}`, '#ffd94a');
        say(`${order.recipe.name} served! Combo x${state.combo}`, 2);
        events |= EVENT_SERVED;
      } else {
        state.combo = 0;
        state.shake = 0.4;
        const target = state.orders[0];
        const wrong = target ? wrongItem(state.plate, target.recipe) : null;
        say(wrong ? `Wrong dish — no ${wrong} in ${target.recipe.name}!` : 'No order matches this dish!', 2);
        events |= EVENT_WRONG;
      }
      return events;
    }

    // Ingredient stations: pick up one item when hands are empty.
    if (!chef.holding) {
      chef.holding = { id: station.id, cooked: false };
      burst(station.x, 470, '#ffffff', 5);
    }
    return 0;
  }

  function reset() {
    nextOrderId = 1;
    state.chef = { x: 640, holding: null, facing: 1, walk: 0, busy: 0 };
    state.grill = [null, null];
    state.plate = [];
    state.traySide = null;
    state.orders = [];
    state.spawnIn = 2;
    state.timeLeft = SHIFT_SECONDS;
    state.elapsed = 0;
    state.score = 0;
    state.served = 0;
    state.combo = 0;
    state.bestCombo = 0;
    state.lives = START_LIVES;
    state.rush = false;
    state.over = false;
    state.won = false;
    state.toast = '';
    state.toastIn = 0;
    state.shake = 0;
    state.particles = [];
    state.floats = [];
    state.servedFlash = 0;
    spawnOrder();
  }

  /**
   * Advance one fixed step. input: { move: -1|0|1, targetX: number|null,
   * interact: bool }. Returns an event bitmask. When `attract` is true the
   * kitchen idles behind the title screen (no orders, no timer).
   */
  function step(dt, input, attract) {
    let events = 0;
    if (state.over) return events;
    const chef = state.chef;

    if (input.targetX !== null && input.targetX !== undefined) {
      const dx = input.targetX - chef.x;
      if (Math.abs(dx) > 6) input.move = dx > 0 ? 1 : -1;
      else input.move = 0;
    }
    if (input.move !== 0) {
      chef.facing = input.move;
      chef.x = Math.max(50, Math.min(1230, chef.x + input.move * CHEF_SPEED * dt));
      chef.walk += dt * 10;
    }
    if (input.interact) events |= interact();

    if (attract) {
      // Idle sizzle behind the title: one patty cooks forever.
      if (!state.grill[0]) state.grill[0] = { progress: 2, flipped: true, burnt: false };
      state.grill[0].progress = 2 + Math.sin(state.elapsed * 2) * 0.5;
      state.elapsed += dt;
      for (const p of state.particles) { p.age += dt; }
      state.particles = state.particles.filter((p) => p.age < p.life);
      return events;
    }

    state.elapsed += dt;
    state.timeLeft -= dt;
    if (!state.rush && state.elapsed >= RUSH_AT_SECONDS) {
      state.rush = true;
      say('RUSH HOUR! Orders are coming fast!', 3);
    }
    if (state.timeLeft <= 0) {
      state.timeLeft = 0;
      state.over = true;
      state.won = state.lives > 0;
      return events | EVENT_OVER;
    }

    state.spawnIn -= dt;
    if (state.spawnIn <= 0) {
      spawnOrder();
      state.spawnIn = state.rush ? ORDER_SPAWN_RUSH : ORDER_SPAWN_START;
    }

    for (const slot of state.grill) {
      if (!slot) continue;
      slot.progress += dt;
      if (!slot.burnt && slot.progress >= GRILL_BURN_SECONDS) {
        slot.burnt = true;
        say('A patty burnt! Trash it!', 2);
        events |= EVENT_BURNT;
      }
    }

    for (let i = state.orders.length - 1; i >= 0; i -= 1) {
      const order = state.orders[i];
      order.patience -= dt;
      if (order.patience <= 0) {
        state.orders.splice(i, 1);
        state.lives -= 1;
        state.combo = 0;
        state.shake = 0.5;
        say(`Customer left angry — ${order.recipe.name} lost!`, 2.5);
        events |= EVENT_LOST_ORDER;
        if (state.lives <= 0) {
          state.over = true;
          state.won = false;
          return events | EVENT_OVER;
        }
      }
    }

    if (state.toastIn > 0) state.toastIn -= dt;
    if (state.shake > 0) state.shake -= dt;
    if (state.servedFlash > 0) state.servedFlash -= dt * 2;
    for (const p of state.particles) {
      p.age += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 260 * dt;
    }
    state.particles = state.particles.filter((p) => p.age < p.life);
    for (const f of state.floats) { f.age += dt; f.y -= 40 * dt; }
    state.floats = state.floats.filter((f) => f.age < f.life);
    return events;
  }

  reset();

  return {
    state,
    reset,
    step,
    interact,
    nearestStation,
    /** Oldest order still waiting, or null. */
    oldestOrder() {
      return state.orders.length > 0 ? state.orders[0] : null;
    },
    /** Is the plate ready to serve some waiting order? */
    plateReady() {
      return state.orders.some((o) => orderComplete(state.plate, state.traySide, o));
    },
    /** What the chef still needs to fetch for the oldest order. */
    missingForOldest() {
      const order = state.orders[0];
      if (!order) return [];
      return missingItems(state.plate, order.recipe);
    },
    burgerMatchesFor(order) {
      return burgerMatches(state.plate, order.recipe);
    },
  };
}

export function createWorldWithSeed(seed) {
  return createWorld(createRandom(seed));
}
