// Sizzle & Serve — the renderer: one bright kitchen, drawn fresh every frame
// on a 1280x720 canvas. Order board on top, ingredient bins along the
// counter, grill, assembly plate, serve window, and the chef on the floor.
import {
  CHEF_Y, COUNTER_Y, GRILL_BURN_SECONDS, GRILL_COOK_SECONDS, INGREDIENTS,
  SHIFT_SECONDS, STATIONS, VIEW_HEIGHT, VIEW_WIDTH,
} from './config.js';
import { ingredientLabel } from './recipes.js';

export const SCREEN_TITLE = 0;
export const SCREEN_PLAY = 1;
export const SCREEN_PAUSED = 2;
export const SCREEN_OVER = 3;

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, align = 'center', weight = 'bold') {
  ctx.font = `${weight} ${size}px Trebuchet MS, Verdana, sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

/** One ingredient drawn as a little food icon. */
function drawIngredient(ctx, id, x, y, s) {
  const ing = INGREDIENTS[id];
  ctx.save();
  ctx.translate(x, y);
  if (id === 'bun') {
    ctx.fillStyle = ing.color;
    ctx.beginPath();
    ctx.arc(0, -s * 0.1, s * 0.55, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = ing.dark;
    ctx.fillRect(-s * 0.55, -s * 0.12, s * 1.1, s * 0.22);
    ctx.fillStyle = '#fff';
    ctx.fillRect(-s * 0.25, -s * 0.45, s * 0.08, s * 0.08);
    ctx.fillRect(s * 0.1, -s * 0.55, s * 0.08, s * 0.08);
  } else if (id === 'patty') {
    ctx.fillStyle = ing.color;
    roundRect(ctx, -s * 0.6, -s * 0.28, s * 1.2, s * 0.56, s * 0.2);
    ctx.fill();
    ctx.fillStyle = ing.dark;
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.arc(i * s * 0.3, 0, s * 0.07, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === 'lettuce') {
    ctx.fillStyle = ing.color;
    ctx.beginPath();
    for (let i = 0; i < 5; i += 1) {
      const px = -s * 0.6 + (i * s * 1.2) / 4;
      ctx.arc(px, 0, s * 0.22, Math.PI, 0);
    }
    ctx.fill();
    ctx.fillRect(-s * 0.6, -s * 0.05, s * 1.2, s * 0.18);
  } else if (id === 'tomato') {
    ctx.fillStyle = ing.color;
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffb3ab';
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.32, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = ing.dark;
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.1, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'cheese') {
    ctx.fillStyle = ing.color;
    ctx.beginPath();
    ctx.moveTo(-s * 0.6, -s * 0.3);
    ctx.lineTo(s * 0.6, -s * 0.3);
    ctx.lineTo(s * 0.6, s * 0.15);
    ctx.lineTo(s * 0.3, s * 0.35);
    ctx.lineTo(0, s * 0.1);
    ctx.lineTo(-s * 0.3, s * 0.35);
    ctx.lineTo(-s * 0.6, s * 0.15);
    ctx.closePath();
    ctx.fill();
  } else if (id === 'sauce') {
    ctx.fillStyle = '#f6c9de';
    roundRect(ctx, -s * 0.45, -s * 0.5, s * 0.9, s * 1, s * 0.2);
    ctx.fill();
    ctx.fillStyle = ing.color;
    ctx.beginPath();
    ctx.arc(0, -s * 0.55, s * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(-s * 0.3, -s * 0.1, s * 0.6, s * 0.12);
    ctx.fillRect(-s * 0.3, s * 0.15, s * 0.6, s * 0.12);
  } else if (id === 'fries') {
    ctx.fillStyle = '#e2483d';
    ctx.beginPath();
    ctx.moveTo(-s * 0.5, -s * 0.2);
    ctx.lineTo(s * 0.5, -s * 0.2);
    ctx.lineTo(s * 0.35, s * 0.55);
    ctx.lineTo(-s * 0.35, s * 0.55);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = ing.color;
    for (let i = -1; i <= 1; i += 1) {
      ctx.fillRect(i * s * 0.28 - s * 0.09, -s * 0.75, s * 0.18, s * 0.6);
    }
  } else if (id === 'cola') {
    ctx.fillStyle = '#e2483d';
    roundRect(ctx, -s * 0.35, -s * 0.5, s * 0.7, s * 1, s * 0.12);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillRect(-s * 0.35, -s * 0.15, s * 0.7, s * 0.25);
    ctx.strokeStyle = '#f7c948';
    ctx.lineWidth = s * 0.1;
    ctx.beginPath();
    ctx.moveTo(s * 0.1, -s * 0.5);
    ctx.lineTo(s * 0.3, -s * 0.85);
    ctx.stroke();
  }
  ctx.restore();
}

/** A burger stack on a plate, drawn bottom-up at (x, y) = plate centre. */
function drawBurger(ctx, items, x, y, w) {
  const bottom = y;
  let cy = bottom;
  // Bottom bun.
  ctx.fillStyle = INGREDIENTS.bun.color;
  roundRect(ctx, x - w / 2, cy - 10, w, 10, 4);
  ctx.fill();
  cy -= 10;
  const fillings = items.filter((item) => item !== 'bun');
  for (const item of fillings) {
    const ing = INGREDIENTS[item];
    const h = ing.layer;
    ctx.fillStyle = ing.color;
    if (item === 'lettuce') {
      ctx.beginPath();
      for (let i = 0; i < 5; i += 1) {
        const px = x - w / 2 + (i * w) / 4;
        ctx.arc(px, cy - 2, w / 8, Math.PI, 0);
      }
      ctx.fill();
      ctx.fillRect(x - w / 2, cy - h, w, h);
    } else if (item === 'cheese') {
      ctx.beginPath();
      ctx.moveTo(x - w / 2, cy - h);
      ctx.lineTo(x + w / 2, cy - h);
      ctx.lineTo(x + w / 2, cy - 2);
      ctx.lineTo(x + w / 4, cy + 3);
      ctx.lineTo(x, cy - 2);
      ctx.lineTo(x - w / 4, cy + 3);
      ctx.lineTo(x - w / 2, cy - 2);
      ctx.closePath();
      ctx.fill();
    } else {
      roundRect(ctx, x - w / 2 + 2, cy - h, w - 4, h, 3);
      ctx.fill();
    }
    cy -= h;
  }
  // Top bun dome.
  ctx.fillStyle = INGREDIENTS.bun.color;
  ctx.beginPath();
  ctx.arc(x, cy, w / 2, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.fillRect(x - w * 0.2, cy - w * 0.28, 5, 4);
  ctx.fillRect(x + w * 0.1, cy - w * 0.38, 5, 4);
  ctx.fillRect(x + w * 0.25, cy - w * 0.2, 4, 4);
  return cy - w / 2;
}

function drawTicket(ctx, order, x, y, w, h, now) {
  const urgent = order.patience < order.maxPatience * 0.35;
  const frac = Math.max(0, order.patience / order.maxPatience);
  ctx.save();
  if (urgent && Math.floor(now * 4) % 2 === 0) ctx.translate(2, 0);
  ctx.fillStyle = '#fffdf5';
  ctx.strokeStyle = urgent ? '#e2483d' : '#d9c9a8';
  ctx.lineWidth = urgent ? 3 : 2;
  roundRect(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#3a2e2a';
  text(ctx, order.recipe.name.toUpperCase(), x + 14, y + 20, 17, '#3a2e2a', 'left');
  // Patience bar.
  ctx.fillStyle = '#eee3cd';
  roundRect(ctx, x + 14, y + 34, w - 28, 10, 5);
  ctx.fill();
  ctx.fillStyle = frac > 0.5 ? '#58b368' : frac > 0.25 ? '#f2a541' : '#e2483d';
  roundRect(ctx, x + 14, y + 34, (w - 28) * frac, 10, 5);
  ctx.fill();
  // Burger items.
  let ix = x + 22;
  for (const item of order.recipe.items) {
    drawIngredient(ctx, item, ix, y + 66, 13);
    ix += 30;
  }
  if (order.recipe.side) {
    text(ctx, '+', ix - 6, y + 66, 18, '#8a7a63');
    drawIngredient(ctx, order.recipe.side, ix + 12, y + 66, 13);
  }
  ctx.restore();
}

function drawChef(ctx, chef, now) {
  const bob = chef.walk % 2 < 1 ? 0 : -2;
  const x = chef.x;
  const y = CHEF_Y + bob;
  ctx.save();
  ctx.translate(x, y);
  // Legs.
  ctx.fillStyle = '#3a3a4a';
  const step = Math.sin(chef.walk * 2) * 6;
  ctx.fillRect(-14 + step, -26, 10, 26);
  ctx.fillRect(4 - step, -26, 10, 26);
  // Body / apron.
  ctx.fillStyle = '#fff';
  roundRect(ctx, -20, -62, 40, 40, 10);
  ctx.fill();
  ctx.fillStyle = '#e2483d';
  roundRect(ctx, -16, -48, 32, 26, 6);
  ctx.fill();
  ctx.fillStyle = '#fff';
  text(ctx, '★', 0, -35, 14, '#fff');
  // Arms.
  ctx.fillStyle = '#fff';
  ctx.fillRect(-28, -58, 10, 26);
  ctx.fillRect(18, -58, 10, 26);
  // Head.
  ctx.fillStyle = '#ffcf9e';
  ctx.beginPath();
  ctx.arc(0, -74, 16, 0, Math.PI * 2);
  ctx.fill();
  // Toque.
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(-8, -90, 10, 0, Math.PI * 2);
  ctx.arc(0, -94, 11, 0, Math.PI * 2);
  ctx.arc(8, -90, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-14, -92, 28, 8);
  // Eyes + smile.
  ctx.fillStyle = '#3a2e2a';
  ctx.beginPath();
  ctx.arc(-6, -76, 2, 0, Math.PI * 2);
  ctx.arc(6, -76, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#3a2e2a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, -70, 5, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
  // Held ingredient above the head.
  if (chef.holding) {
    const id = chef.holding.id;
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.arc(0, -116, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d9c9a8';
    ctx.lineWidth = 2;
    ctx.stroke();
    drawIngredient(ctx, id, 0, -116, 15);
    if (id === 'patty' && !chef.holding.cooked) {
      text(ctx, 'RAW', 0, -92, 10, '#e2483d');
    }
  }
  ctx.restore();
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const scaleX = canvas.width / VIEW_WIDTH;
  const scaleY = canvas.height / VIEW_HEIGHT;

  function draw(state, screen, best, now) {
    ctx.save();
    ctx.scale(scaleX, scaleY);
    if (state.shake > 0) {
      ctx.translate((Math.random() - 0.5) * state.shake * 24, (Math.random() - 0.5) * state.shake * 24);
    }
    drawKitchen(state, now);
    drawStations(state, now);
    drawPlateArea(state, now);
    drawChef(ctx, state.chef, now);
    drawParticles(state);
    drawFloats(state);
    drawHud(state, screen);
    if (state.toastIn > 0) drawToast(state);
    if (screen === SCREEN_TITLE) drawTitle(state, best, now);
    else if (screen === SCREEN_PAUSED) drawPaused();
    else if (screen === SCREEN_OVER) drawOver(state, best);
    ctx.restore();
  }

  function drawKitchen(state, now) {
    // Wall.
    const wall = ctx.createLinearGradient(0, 0, 0, 500);
    wall.addColorStop(0, '#ffe8c2');
    wall.addColorStop(1, '#ffd9a0');
    ctx.fillStyle = wall;
    ctx.fillRect(0, 0, VIEW_WIDTH, 500);
    // Sun window.
    ctx.fillStyle = '#bfe8ff';
    roundRect(ctx, 60, 90, 220, 130, 12);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.fillStyle = '#ffd94a';
    ctx.beginPath();
    ctx.arc(120, 130, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7ec850';
    ctx.beginPath();
    ctx.moveTo(60, 220);
    ctx.lineTo(140, 165);
    ctx.lineTo(220, 220);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(170, 90);
    ctx.lineTo(170, 220);
    ctx.moveTo(60, 155);
    ctx.lineTo(280, 155);
    ctx.stroke();
    // Hanging lamps (below the top bar).
    for (const lx of [420, 640, 860]) {
      ctx.strokeStyle = '#8a6a45';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(lx, 56);
      ctx.lineTo(lx, 100);
      ctx.stroke();
      ctx.fillStyle = '#e2483d';
      ctx.beginPath();
      ctx.moveTo(lx - 22, 100);
      ctx.lineTo(lx + 22, 100);
      ctx.lineTo(lx + 12, 120);
      ctx.lineTo(lx - 12, 120);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 217, 74, 0.25)';
      ctx.beginPath();
      ctx.arc(lx, 128, 26 + Math.sin(now * 2 + lx) * 2, 0, Math.PI * 2);
      ctx.fill();
    }
    // Shelf with jars.
    ctx.fillStyle = '#a9805a';
    ctx.fillRect(980, 120, 240, 10);
    const jarColors = ['#58b368', '#e2483d', '#f7c948', '#b678e0'];
    jarColors.forEach((color, i) => {
      ctx.fillStyle = color;
      roundRect(ctx, 990 + i * 58, 84, 40, 36, 6);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.fillRect(990 + i * 58, 96, 40, 8);
    });
    // Serve window (the pass).
    ctx.fillStyle = '#7a4a2b';
    roundRect(ctx, 968, 240, 296, 150, 12);
    ctx.fill();
    ctx.fillStyle = '#2b1d16';
    roundRect(ctx, 980, 252, 272, 104, 8);
    ctx.fill();
    ctx.fillStyle = '#ffd94a';
    ctx.beginPath();
    ctx.arc(1116, 300, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#c98f2b';
    ctx.fillRect(1100, 300, 32, 8);
    text(ctx, 'SERVE HERE  •  RING THE BELL', 1116, 266, 13, '#ffe8c2');
    if (state.servedFlash > 0) {
      ctx.fillStyle = `rgba(255, 217, 74, ${state.servedFlash * 0.5})`;
      roundRect(ctx, 968, 240, 296, 150, 12);
      ctx.fill();
    }
    // Floor: checker tiles.
    for (let row = 0; row < 2; row += 1) {
      for (let col = 0; col < 16; col += 1) {
        ctx.fillStyle = (row + col) % 2 === 0 ? '#f6ead6' : '#e2483d';
        ctx.globalAlpha = (row + col) % 2 === 0 ? 1 : 0.85;
        ctx.fillRect(col * 80, 600 + row * 60, 80, 60);
      }
    }
    ctx.globalAlpha = 1;
    // Counter.
    ctx.fillStyle = '#a9805a';
    ctx.fillRect(0, COUNTER_Y, VIEW_WIDTH, 100);
    ctx.fillStyle = '#c99a68';
    ctx.fillRect(0, COUNTER_Y, VIEW_WIDTH, 14);
    ctx.fillStyle = '#8a6a45';
    ctx.fillRect(0, 588, VIEW_WIDTH, 12);
  }

  function drawStations(state, now) {
    for (const station of STATIONS) {
      const x = station.x;
      const near = Math.abs(state.chef.x - x) < 70;
      // Bin / box on the counter.
      ctx.fillStyle = near ? '#fff' : '#fffdf5';
      ctx.strokeStyle = near ? '#e2483d' : '#d9c9a8';
      ctx.lineWidth = near ? 3 : 2;
      roundRect(ctx, x - 42, 428, 84, 62, 10);
      ctx.fill();
      ctx.stroke();
      if (station.id === 'grill') {
        // Grill grate with two slots.
        ctx.fillStyle = '#3a3a4a';
        roundRect(ctx, x - 42, 428, 84, 62, 10);
        ctx.fill();
        ctx.strokeStyle = '#6a6a7a';
        ctx.lineWidth = 2;
        for (let i = 0; i < 4; i += 1) {
          ctx.beginPath();
          ctx.moveTo(x - 38, 442 + i * 12);
          ctx.lineTo(x + 38, 442 + i * 12);
          ctx.stroke();
        }
        state.grill.forEach((patty, slot) => {
          if (!patty) return;
          const px = x - 20 + slot * 40;
          const py = 456;
          const frac = Math.min(1, patty.progress / GRILL_COOK_SECONDS);
          ctx.fillStyle = patty.burnt ? '#1c1c1c' : frac < 0.5 ? '#e2607a' : '#7a4a2b';
          roundRect(ctx, px - 14, py - 8, 28, 12, 5);
          ctx.fill();
          if (!patty.burnt) {
            ctx.fillStyle = '#ff9d5c';
            const flame = 4 + Math.sin(now * 9 + slot) * 2;
            ctx.beginPath();
            ctx.moveTo(px - 8, py + 8);
            ctx.lineTo(px, py + 8 - flame - 6);
            ctx.lineTo(px + 8, py + 8);
            ctx.closePath();
            ctx.fill();
            // Cook progress ring.
            ctx.strokeStyle = patty.progress >= GRILL_COOK_SECONDS ? '#58b368' : '#ffd94a';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(px, py - 2, 18, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
            ctx.stroke();
            if (patty.progress >= GRILL_COOK_SECONDS) text(ctx, '✓', px, py - 24, 14, '#58b368');
          } else {
            text(ctx, 'BURNT!', px, py - 24, 11, '#e2483d');
          }
        });
      } else if (station.id === 'serve') {
        ctx.fillStyle = '#ffd94a';
        ctx.beginPath();
        ctx.arc(x, 452, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#c98f2b';
        ctx.fillRect(x - 16, 452, 32, 6);
        text(ctx, 'DING!', x, 478, 11, '#7a4a2b');
      } else if (station.id === 'plate') {
        // Plate is drawn in drawPlateArea; bin shows a stack icon.
        drawIngredient(ctx, 'bun', x, 452, 16);
        text(ctx, 'BUILD', x, 478, 10, '#8a7a63');
      } else if (station.id === 'bin') {
        ctx.fillStyle = '#8a8f98';
        roundRect(ctx, x - 16, 436, 32, 30, 4);
        ctx.fill();
        ctx.fillStyle = '#5d6169';
        ctx.fillRect(x - 18, 432, 36, 6);
      } else {
        drawIngredient(ctx, station.id, x, 452, 18);
      }
      text(ctx, station.label, x, 512, 13, '#fff');
      text(ctx, station.sub, x, 528, 10, '#ffe8c2');
      text(ctx, `[${station.key}]`, x, 544, 10, '#ffd94a');
      if (near) {
        ctx.fillStyle = '#e2483d';
        ctx.beginPath();
        ctx.moveTo(x - 8, 560);
        ctx.lineTo(x + 8, 560);
        ctx.lineTo(x, 572);
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  function drawPlateArea(state, now) {
    const plateStation = STATIONS.find((s) => s.id === 'plate');
    const x = plateStation.x;
    const y = 470;
    // White plate on the counter edge.
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(x, y, 52, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d9c9a8';
    ctx.lineWidth = 2;
    ctx.stroke();
    if (state.plate.length > 0) {
      drawBurger(ctx, state.plate, x, y - 6, 62);
    }
    if (state.traySide) {
      drawIngredient(ctx, state.traySide, x + 62, y - 22, 16);
    }
    // Ready-to-serve badge.
    const ready = state.plate.length > 0
      && state.orders.some((o) => {
        const want = {};
        for (const item of o.recipe.items) want[item] = (want[item] ?? 0) + 1;
        const have = {};
        for (const item of state.plate) have[item] = (have[item] ?? 0) + 1;
        const burgerOk = Object.keys(want).every((k) => (have[k] ?? 0) === want[k])
          && Object.keys(have).every((k) => (have[k] ?? 0) === (want[k] ?? 0));
        const sideOk = o.recipe.side === null ? state.traySide === null : state.traySide === o.recipe.side;
        return burgerOk && sideOk;
      });
    if (ready) {
      const pulse = 1 + Math.sin(now * 5) * 0.08;
      ctx.save();
      ctx.translate(x, y - 108);
      ctx.scale(pulse, pulse);
      ctx.fillStyle = '#58b368';
      roundRect(ctx, -78, -16, 156, 32, 16);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
      text(ctx, '✓ READY TO SERVE!', 0, 1, 14, '#fff');
      ctx.restore();
    }
  }

  function drawParticles(state) {
    for (const p of state.particles) {
      ctx.globalAlpha = 1 - p.age / p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawFloats(state) {
    for (const f of state.floats) {
      ctx.globalAlpha = 1 - f.age / f.life;
      text(ctx, f.text, f.x, f.y, 26, f.color);
    }
    ctx.globalAlpha = 1;
  }

  function drawHud(state, screen) {
    // Top bar.
    ctx.fillStyle = '#3a2e2a';
    ctx.fillRect(0, 0, VIEW_WIDTH, 56);
    text(ctx, 'SIZZLE & SERVE', 16, 28, 22, '#ffd94a', 'left');
    text(ctx, `SCORE  ${state.score}`, 330, 28, 20, '#fff', 'left');
    // Timer.
    const frac = Math.max(0, state.timeLeft / SHIFT_SECONDS);
    ctx.fillStyle = '#5d4a42';
    roundRect(ctx, 560, 18, 220, 20, 10);
    ctx.fill();
    ctx.fillStyle = frac > 0.3 ? '#58b368' : '#e2483d';
    roundRect(ctx, 560, 18, 220 * frac, 20, 10);
    ctx.fill();
    const mins = Math.floor(state.timeLeft / 60);
    const secs = Math.floor(state.timeLeft % 60);
    text(ctx, `${mins}:${String(secs).padStart(2, '0')}`, 670, 28, 16, '#fff');
    // Combo.
    if (state.combo >= 2) {
      text(ctx, `COMBO x${state.combo}`, 820, 28, 20, '#ff9d5c', 'left');
    } else {
      text(ctx, 'COMBO x1', 820, 28, 16, '#b8a894', 'left');
    }
    // Lives + served.
    let hearts = '';
    for (let i = 0; i < 3; i += 1) hearts += i < state.lives ? '♥' : '♡';
    text(ctx, hearts, 1010, 28, 20, '#ff7a9e', 'left');
    text(ctx, `SERVED ${state.served}`, 1120, 28, 16, '#fff', 'left');
    // Order tickets.
    state.orders.forEach((order, i) => {
      drawTicket(ctx, order, 16 + i * 318, 66, 300, 104, performance.now() / 1000);
    });
    if (state.rush && screen === SCREEN_PLAY) {
      text(ctx, 'RUSH HOUR - ORDERS FLYING IN!', 640, 196, 18, '#e2483d');
    }
  }

  function drawToast(state) {
    const w = Math.min(560, 40 + state.toast.length * 9);
    ctx.fillStyle = 'rgba(58, 46, 42, 0.92)';
    roundRect(ctx, 640 - w / 2, 200, w, 36, 18);
    ctx.fill();
    text(ctx, state.toast, 640, 219, 16, '#fff');
  }

  function drawTitle(state, best, now) {
    ctx.fillStyle = 'rgba(43, 29, 22, 0.55)';
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
    ctx.fillStyle = '#fffdf5';
    roundRect(ctx, 290, 130, 700, 440, 24);
    ctx.fill();
    ctx.strokeStyle = '#e2483d';
    ctx.lineWidth = 4;
    ctx.stroke();
    text(ctx, 'SIZZLE & SERVE', 640, 190, 44, '#e2483d');
    text(ctx, 'The lunch rush is on — cook fast, serve faster!', 640, 240, 19, '#3a2e2a');
    text(ctx, 'Walk the counter, grab ingredients, grill the patty,', 640, 300, 17, '#5d4a42');
    text(ctx, 'stack the burger on the plate and ring the bell!', 640, 326, 17, '#5d4a42');
    text(ctx, '← → / A D  move      SPACE  grab / cook / serve', 640, 372, 16, '#3a2e2a');
    text(ctx, '1 – 0  jump to a station      CLICK a station to walk there', 640, 398, 16, '#3a2e2a');
    text(ctx, 'Match the ticket exactly — combos pay extra. 3 angry', 640, 424, 16, '#3a2e2a');
    text(ctx, 'customers and the kitchen closes!', 640, 448, 16, '#3a2e2a');
    const blink = Math.floor(now * 2) % 2 === 0;
    if (blink) text(ctx, '▶  PRESS SPACE OR CLICK TO START  ◀', 640, 500, 20, '#e2483d');
    if (best > 0) text(ctx, `Best score: ${best}`, 640, 536, 16, '#8a7a63');
  }

  function drawPaused() {
    ctx.fillStyle = 'rgba(43, 29, 22, 0.6)';
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
    text(ctx, 'PAUSED', 640, 330, 44, '#fff');
    text(ctx, 'Press P or Space to keep cooking', 640, 380, 18, '#ffe8c2');
  }

  function drawOver(state, best) {
    ctx.fillStyle = 'rgba(43, 29, 22, 0.6)';
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
    ctx.fillStyle = '#fffdf5';
    roundRect(ctx, 340, 150, 600, 400, 24);
    ctx.fill();
    ctx.strokeStyle = state.won ? '#58b368' : '#e2483d';
    ctx.lineWidth = 4;
    ctx.stroke();
    text(ctx, state.won ? 'SHIFT COMPLETE!' : 'KITCHEN CLOSED!', 640, 210, 38, state.won ? '#58b368' : '#e2483d');
    text(ctx, `Score: ${state.score}`, 640, 280, 30, '#3a2e2a');
    text(ctx, `Dishes served: ${state.served}     Best combo: x${state.bestCombo}`, 640, 330, 19, '#5d4a42');
    text(ctx, state.score > best ? '★ NEW BEST SCORE! ★' : `Best score: ${Math.max(best, state.score)}`, 640, 372, 19, '#e2483d');
    text(ctx, state.won
      ? 'The lunch crowd loved it — come back for the dinner rush!'
      : 'Too many customers walked out angry…', 640, 414, 17, '#5d4a42');
    const blink = Math.floor(performance.now() / 500) % 2 === 0;
    if (blink) text(ctx, '▶  PRESS SPACE TO COOK AGAIN  ◀', 640, 480, 20, '#e2483d');
  }

  return { draw };
}
