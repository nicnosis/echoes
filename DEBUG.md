# Debug System

This game includes a simple debugging system that creates global variables accessible directly from the browser console.

## Quick Start

1. Open your browser's developer tools (F12)
2. Go to the Console tab
3. Type the global variable names directly

## Available Global Variables

### Player Access
```javascript
// Access player instance directly
myPlayer

// Get player stats
myPlayer.currentHP
myPlayer.maxHP
myPlayer.level
myPlayer.gold
myPlayer.attack
myPlayer.armor
myPlayer.moveSpeed
myPlayer.critChance

// Get player position
myPlayer.x
myPlayer.y

// Get player weapons
myPlayer.weapons
myPlayer.weapons.length

// Get player equipment
myPlayer.equippedItems
```

### Game State Access
```javascript
// Access enemies array
myEnemies
myEnemies.length

// Access game instance
myGame
```

## Available Player Properties

You can access these properties directly on `myPlayer`:
- `currentHP` - Current health points
- `maxHP` - Maximum health points  
- `level` - Player level
- `attack` - Attack damage
- `armor` - Armor value
- `moveSpeed` - Movement speed
- `critChance` - Critical hit chance
- `luck` - Luck stat
- `gold` - Gold amount
- `currentXP` - Current experience points
- `xpToNextLevel` - XP needed for next level
- `x`, `y` - Player position
- `weapons` - Array of weapons
- `equippedItems` - Array of equipped items

## Disabling Debug System

To disable the debug system:

1. **Comment out the debug section** in `src/game/Game.ts` (lines with `// ===== DEBUG SYSTEM =====`)

## Example Usage

```javascript
// Check your current health
myPlayer.currentHP

// See how much gold you have
myPlayer.gold

// Check your level
myPlayer.level

// See your position
myPlayer.x
myPlayer.y

// Check how many weapons you have
myPlayer.weapons.length

// See all enemies
myEnemies.length

// Get all player stats at once
myPlayer.getDisplayStats()
```

## Tips

- Just type the variable name directly in console (no quotes needed)
- The variables automatically update when you restart the game
- Use `myPlayer.getDisplayStats()` to get all stats as an object
- All debug code is clearly marked with comments for easy removal 