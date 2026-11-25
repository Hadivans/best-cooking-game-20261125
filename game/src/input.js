// Sizzle & Serve — input: keyboard (arrows / WASD, Space to interact,
// 1-0-=- keys jump to a station, P pause, Enter serves too) and mouse
// (click a station to walk there, click again to use it).
import { STATIONS } from './config.js';

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_INTERACT = 4;

export function createInput(canvas) {
  let move = 0;
  let targetX = null;
  let interactQueued = false;
  let actions = 0;
  const held = new Set();

  function stationAtPoint(clientX) {
    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 1280;
    let best = null;
    let bestDist = 90;
    for (const station of STATIONS) {
      const dist = Math.abs(station.x - x);
      if (dist < bestDist) {
        bestDist = dist;
        best = station;
      }
    }
    return best;
  }

  function onKeyDown(event) {
    if (event.repeat) return;
    const key = event.key.toLowerCase();
    if (key === 'arrowleft' || key === 'a') { held.add('left'); event.preventDefault(); }
    else if (key === 'arrowright' || key === 'd') { held.add('right'); event.preventDefault(); }
    else if (key === ' ') { interactQueued = true; actions |= ACTION_INTERACT; event.preventDefault(); }
    else if (key === 'enter') { actions |= ACTION_CONFIRM; }
    else if (key === 'p' || key === 'escape') { actions |= ACTION_PAUSE; }
    else {
      const station = STATIONS.find((s) => s.key === event.key);
      if (station) {
        targetX = station.x;
        interactQueued = false;
      }
    }
  }

  function onKeyUp(event) {
    const key = event.key.toLowerCase();
    if (key === 'arrowleft' || key === 'a') held.delete('left');
    else if (key === 'arrowright' || key === 'd') held.delete('right');
  }

  function onPointer(event) {
    const station = stationAtPoint(event.clientX);
    if (!station) {
      targetX = null;
      return;
    }
    if (targetX === station.x) {
      // Second click on the station the chef already walks to: use it.
      interactQueued = true;
      actions |= ACTION_INTERACT;
    } else {
      targetX = station.x;
    }
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('pointerdown', onPointer);

  return {
    /** -1, 0 or 1 this frame, from keys or a mouse target. */
    direction() {
      if (targetX !== null) return 0; // resolved by targetX in main loop
      return (held.has('right') ? 1 : 0) - (held.has('left') ? 1 : 0);
    },
    targetX() {
      return targetX;
    },
    clearTarget() {
      targetX = null;
    },
    takeInteract() {
      const value = interactQueued;
      interactQueued = false;
      return value;
    },
    takeActions() {
      const value = actions;
      actions = 0;
      return value;
    },
  };
}
