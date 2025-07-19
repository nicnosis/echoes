# Roguelike Game Project Architecture Plan

## 1. Overview  
Build a 2D roguelike game inspired by Brotato. The game will run as a desktop app using Tauri + Claudia. Development will primarily use JavaScript/TypeScript for game logic and UI, with rendering on HTML5 Canvas or WebGL. Claude Code will assist in generating and debugging code.

---

## 2. Core Components

### 2.1 Game Logic  
- Player mechanics: movement, attacks (start with one weapon — e.g., sword), health, level, XP, inventory (max 6 weapons eventually)  
- Enemy: start with one enemy type, basic AI and stats  
- Combat system: damage numbers floating over targets when hit  
- Wave system: player fights waves of enemies (20 waves total)  
- Shop system: after each wave except the last, player visits shop with 4 item/weapon options  
  - Player can buy or lock items/weapons for next shops  
  - Player can pay gold to reroll shop options; reroll cost increases over time  
- Level-up system: on leveling up, player picks one of four random stat upgrades or can reroll for different choices  
- Pickups: Gold pieces drop giving both money and XP  
- Player stats: HP, level, XP, attack, defense, crit chance, movement speed

### 2.2 User Interface (UI)  
- Main menu: start game, options, quit  
- HUD: display player HP and XP (no ammo or score)  
- Inventory: show weapons and items  
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
- JavaScript or TypeScript  
- HTML5 Canvas or WebGL  
- Tauri + Claudia for desktop packaging  
- Claude Code for AI-assisted coding and debugging

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
5. Implement pickups (gold for XP and money)  
6. Polish rendering and animations  
7. Continuous testing and debugging with Claude Code  
8. Build and package with Tauri/Claudia
