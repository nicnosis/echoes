# Echoes - Roguelike Game Project Architecture Plan

## 1. Overview  
Build a 2D roguelike game inspired by Brotato. The game will run as a desktop app using Tauri + Claudia. Development will primarily use JavaScript/TypeScript for game logic and UI, with rendering on HTML5 Canvas or WebGL. Claude Code will assist in generating and debugging code.


### Story and Theme
Echoes is a game about transformation.
You play as a chimera who acquires body parts, weapons, items, and abilities.
Some themes include spirits (especially animals), growth, making difficult decisions, and overcoming spiritual battles.

Our hero is selected by Gaia to overcome darkness and restore hope and balance to Earth. You are an icon of survival for living things on earth.

The game also features many mythical or significant creatures such as baphomet, cockatrice, manticore, and homonculus.

---

## 2. Core Components
### Core Game Loop
Player will choose their character - a core spirit, e.g. primate, bird, lizard, etc. Right now we will only have primate to keep it simple.

HOME SCREEN

WAVE SCREEN
There will be 21 waves in this game. Each wave features randomly spawning enemies that the character defeats, then collects the crystals they drop. The waves are packaged into three "Episodes" each with 7 waves. Each episode will have a pivotal mechanic shift based on a random story event.

LEVEL UP SCREEN
If player has increased by at least 1 level after the wave is complete, player will go to a level up screen where they can choose one new random stat/ability per level up.

SHOP SCREEN
After each wave (excluding last wave) character will have a shop with four random items. Player can reroll for an increasing cost to get four new selections. Player can 'lock' an item: this makes the item stay so that the other, non-locked items will reroll. Locked items also persist between waves.

After player is done shopping they can click "Go to wave X"

RESULT SCREEN
When the player clears Wave 21, the game is complete. Stats and items are shown on this result view. Then the player can return to the HOME SCREEN.

### 2.1 Game Logic  
- Player mechanics: movement, attacks (start with one weapon — e.g., sword), health, level, XP, inventory (max 6 weapons eventually)  
- Enemy: start with one enemy type, basic AI and stats  
- Combat system: damage numbers floating over targets when hit  
- Wave system: player fights waves of enemies (21 waves total). These are packaged into three "Episodes" of 7 waves each.
- Bosses: The last wave of each episode (7, 14, and 21) will have a boss battle.
- Shop system: after each wave except the last, player visits shop with 4 item/weapon options  
  - Player can buy or lock items/weapons for next shops  
  - Player can pay Soma to reroll shop options; reroll cost increases over time  
- Level-up system: on leveling up, player picks one of four random stat upgrades or can reroll for different choices  
- Pickups: Soma drop giving both money and XP  
- Player stats: HP, level, XP, attack (how much damage you deal), defense (how much you reduce damage by), crit chance (percent change to deal double damage), movement speed (percent that movement speed is increased by)

### 2.2 User Interface (UI)  
- Main menu: start game, options, quit  
- HUD: display player HP and XP (no ammo or score)  
- Pause screen: show weapons, items, stats and so on.  
- Notifications: floating damage numbers above enemies on hit, pickup messages

### 2.3 Rendering  
- Use HTML5 Canvas or WebGL  
- Animate sprites and effects  
- Overlay UI elements (HUD, menus) on game canvas

### 2.4 Input Handling  
- Keyboard (and optionally mouse/gamepad) controls mapped to player actions

### 2.5 Data Storage  
- Save/load game state: player stats, inventory, current wave/shop  
- Use local storage or file system via Tauri APIs

---

## 3. Technology Stack  
- Manus as creative director and lead game engineer
- JavaScript or TypeScript  
- HTML5 Canvas or WebGL  
- Tauri + Claudia for desktop packaging  
- Claude Code for AI-assisted coding and debugging
- Cursor as code editor and AI-assistant

---

## 4. Code Organization

- `/src/game` — player, enemy, combat, waves, shop, pickups  
- `/src/ui` — HUD, menus, notifications, inventory screens  
- `/src/render` — rendering engine and animation  
- `/src/input` — input management  
- `/src/utils` — helpers, constants

---

## 5. Development Workflow

1. Prototype core loop: player movement, one weapon attack, one enemy type, wave spawning  
2. Add HUD (HP, XP) and damage number notifications  
3. Implement shop system with item selection, buying, locking, and rerolling  
4. Add level-up stat selection screen with reroll feature  
5. Implement pickups (xp crystals for XP and money)  
6. Polish rendering and animations  
7. Continuous testing and debugging with Claude Code  
8. Build and package with Tauri/Claudia
