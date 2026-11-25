[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/Hadivans/best-cooking-game-20261125/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/Hadivans/best-cooking-game-20261125/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

# Sizzle & Serve — a fast-paced cooking game

The lunch rush is on. Run a bright little burger kitchen: walk the counter,
grab ingredients, grill the patty (flip it, don't burn it!), stack the burger
on the plate exactly as the ticket says, add the fries or cola, and ring the
bell at the serve window — before the customer's patience runs out.

## How to play

- **← → / A D** — move the chef along the counter
- **Space** — grab / cook / place / serve at the station you're standing by
- **1 – 0, - , =** — jump straight to a station
- **Click** a station to walk there (click again to use it)
- **P** — pause

Three angry walk-outs and the kitchen closes. The shift lasts 2 minutes;
after 60 seconds it's **RUSH HOUR** and orders fly in faster. Serve fast for
tips, chain serves for combos (each combo level adds +25), and watch the
grill — a burnt patty has to be trashed.

## The menu

| Dish | Burger | Side |
| --- | --- | --- |
| Classic | bun, patty, lettuce, tomato | — |
| Cheese Melt | bun, patty, cheese, sauce | fries |
| Double Stack | bun, patty, patty, cheese | cola |
| Garden Fresh | bun, lettuce, tomato, cheese, sauce | — |
| BBQ Boss | bun, patty, sauce, cheese, tomato | fries |

## Play it

No build step, no network: serve `game/` with any static server
(`node serve.ts`, then open http://localhost:8080) and play in a desktop
browser.

Screenshots are real renders of the game (`shots.json` lists the staged
scenes: title, mid-game, plate ready to serve, shift complete).

## Entry

Built for the make.fun competition
[best-cooking-game-20261125-0137](https://make.fun/bounty/best-cooking-game-20261125-0137).
`main.ts` (Node 22, standard library only) copies `game/` and `screenshots/`
to the output and writes `dossier.json` with the vendored make.fun library.
