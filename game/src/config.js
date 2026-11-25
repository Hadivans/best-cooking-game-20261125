// Sizzle & Serve — configuration: canvas, timing, stations and recipes.
// One place for every number the world and the renderer share.
export const VIEW_WIDTH = 1280;
export const VIEW_HEIGHT = 720;
export const STEP = 1 / 60;
export const SHIFT_SECONDS = 120;
export const START_LIVES = 3;
export const MAX_ORDERS = 3;
export const CHEF_SPEED = 460;
export const CHEF_Y = 648;
export const COUNTER_Y = 500;
export const GRILL_COOK_SECONDS = 4;
export const GRILL_BURN_SECONDS = 8;
export const BEST_KEY = 'sizzle-and-serve-best';

/** Stations along the counter, left to right. x is the chef position that uses it. */
export const STATIONS = [
  { id: 'patty', label: 'PATTY', sub: 'raw patties', x: 90, color: '#e2607a', key: '1' },
  { id: 'bun', label: 'BUNS', sub: 'fresh buns', x: 195, color: '#f2b544', key: '2' },
  { id: 'grill', label: 'GRILL', sub: 'cook it!', x: 310, color: '#5b4a68', key: '3' },
  { id: 'lettuce', label: 'LETTUCE', sub: 'crisp', x: 425, color: '#58b368', key: '4' },
  { id: 'tomato', label: 'TOMATO', sub: 'sliced', x: 530, color: '#e2483d', key: '5' },
  { id: 'cheese', label: 'CHEESE', sub: 'melty', x: 635, color: '#f7c948', key: '6' },
  { id: 'sauce', label: 'SAUCE', sub: 'secret', x: 740, color: '#b678e0', key: '7' },
  { id: 'fries', label: 'FRIES', sub: 'golden', x: 845, color: '#f2a541', key: '8' },
  { id: 'cola', label: 'COLA', sub: 'ice cold', x: 950, color: '#7a4a2b', key: '9' },
  { id: 'plate', label: 'PLATE', sub: 'assemble', x: 1055, color: '#4aa8dd', key: '0' },
  { id: 'bin', label: 'BIN', sub: 'trash it', x: 1140, color: '#8a8f98', key: '-' },
  { id: 'serve', label: 'SERVE', sub: 'ring the bell', x: 1225, color: '#e2483d', key: '=' },
];

/** Ingredients: id, label, colour and the layer height it draws as on the plate. */
export const INGREDIENTS = {
  bun: { label: 'Bun', color: '#f2b544', dark: '#c98f2b', layer: 16 },
  patty: { label: 'Patty', color: '#7a4a2b', dark: '#5d3620', layer: 14 },
  lettuce: { label: 'Lettuce', color: '#58b368', dark: '#3d8f4c', layer: 8 },
  tomato: { label: 'Tomato', color: '#e2483d', dark: '#b83228', layer: 10 },
  cheese: { label: 'Cheese', color: '#f7c948', dark: '#d9a41f', layer: 7 },
  sauce: { label: 'Sauce', color: '#e08ab8', dark: '#b45f8c', layer: 6 },
  fries: { label: 'Fries', color: '#f2a541', dark: '#c97f22', layer: 0 },
  cola: { label: 'Cola', color: '#7a4a2b', dark: '#4a2c17', layer: 0 },
};

/** Recipes: name, burger items (bun counts once) and the optional side on the tray. */
export const RECIPES = [
  { name: 'Classic', items: ['bun', 'patty', 'lettuce', 'tomato'], side: null, base: 100 },
  { name: 'Cheese Melt', items: ['bun', 'patty', 'cheese', 'sauce'], side: 'fries', base: 130 },
  { name: 'Double Stack', items: ['bun', 'patty', 'patty', 'cheese'], side: 'cola', base: 150 },
  { name: 'Garden Fresh', items: ['bun', 'lettuce', 'tomato', 'cheese', 'sauce'], side: null, base: 120 },
  { name: 'BBQ Boss', items: ['bun', 'patty', 'sauce', 'cheese', 'tomato'], side: 'fries', base: 160 },
];

export const ORDER_PATIENCE = 48;
export const ORDER_SPAWN_START = 13;
export const ORDER_SPAWN_RUSH = 8;
export const RUSH_AT_SECONDS = 60;
