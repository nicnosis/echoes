# Stats System Architecture

## 🎯 Core Principle: SIMPLE ADDITION
```
base + levelUp + gear = total
```
That's it! No complex validation, no over-engineering, just simple number addition.

## 📁 Files & Components

### **Stats.ts** - Simple stats calculation class (~200 lines)
- Replaces the old 400+ line StatsManager
- Three simple objects: `base`, `levelUp`, `gear`
- Computed `total` getter that adds the three layers
- CSV loading and bounds checking

### **stats.csv** - Stat definitions with emojis
- Defines all game stats with display info
- Includes emoji column for visual stats panel
- Proper CSV formatting with explicit empty values

### **StatsPanel.ts** - Single UI component
- Singleton pattern with ONE container
- No more cloning or synchronization
- Direct integration with UnifiedUI

### **UnifiedUI.ts** - Single container approach
- One stats panel on the right side
- Dynamic content on the left side
- Eliminates multiple panel synchronization

## 🏗️ The Three Layers

### **1. base** - Starting values from CSV
```typescript
base: Record<string, number> = {}  // From stats.csv baseValue column
```
- Loaded once from `stats.csv`
- Never changes during gameplay
- Examples: level (0), maxHP (10), damage (0)

### **2. levelUp** - Bonuses from level up selections
```typescript
levelUp: Record<string, number> = {}  // From player choices
```
- Incremented when player selects level up bonuses
- Automatic bonuses: +1 level and +1 maxHP per level up
- Manual bonuses: +5 to chosen stat (damage, armor, moveSpeed, etc.)

### **3. gear** - Stats from body parts and items
```typescript
gear: Record<string, number> = {}  // From equipment
```
- Recalculated from body parts when they change
- Future: Will include weapon and armor stats
- Examples: Frog Head (+8 dodge, +5 moveSpeed), Torso (+10 critChance)

## 🔧 Key API Methods

### **Core Stats Access**
```typescript
player.getStat('maxHP')          // Get any stat (uses total)
player.stats.level               // Convenience getter
player.stats.getCurrentHP()      // HP management helper
```

### **Stat Modification**
```typescript
player.stats.updateGear(this.body)           // Recalculate gear from body parts
player.stats.addLevelUpStat('damage', 5)     // Add level up bonus
player.stats.setBaseStat('hp', newValue)     // Set core stats (HP, XP)
```

### **UI Integration**
```typescript
player.stats.getDisplayStats()               // Get formatted stats for UI
player.stats.updateStatsPanel(container)     // Update HTML directly
```

## 🏃 Automatic Level Progression

Every level up automatically grants:
- **+1 Level** (tracked in levelUp stats)
- **+1 Max HP** (tracked in levelUp stats)
- **+1 Manual choice** (player selects: damage, armor, moveSpeed, maxHP)

Example at level 2:
- Level: 0 (base) + 2 (levelUp) = 2
- Max HP: 10 (base) + 2 (auto) + maybe 5 (manual choice) = 17

## 🎮 Integration Points

### **Player.ts**
```typescript
// XP and leveling (handled in Player, not Stats)
gainXP(amount: number): boolean {
    // XP logic here, calls stats.addLevelUpStat() on level up
}

// Body parts integration
private async initializeBodyParts(): Promise<void> {
    // Load body parts, then:
    this.stats.updateGear(this.body)
}
```

### **Game.ts**
```typescript
// Simple stat access throughout the game
const armor = player.getStat('armor')
const critChance = player.getStat('critChance')
```

### **UnifiedUI.ts**
```typescript
// Single stats panel update
this.statsPanel.update(player)  // Updates the one container
```

# 📊 stats.csv Schema

The `stats.csv` file defines all player statistics with their display properties and behavior.

## CSV Structure
```
category,order,key,displayName,hideInStatsPanel,description,isPercent,baseValue,minValue,maxValue,emoji
```

## Column Definitions

| Column | Type | Purpose | Example |
|--------|------|---------|---------|
| **category** | `primary`/`core` | Groups stats logically | `primary` |
| **order** | integer | Display order (0-based) | `0` |
| **key** | string | Code identifier | `maxHP` |
| **displayName** | string | UI label | `Max HP` |
| **hideInStatsPanel** | boolean | Visibility control | `FALSE` |
| **description** | string | Tooltip text | `Maximum HP` |
| **isPercent** | boolean | Format as percentage | `TRUE` |
| **baseValue** | number | Starting value | `10` |
| **minValue** | number | Lower bound | `1` |
| **maxValue** | number | Upper bound | `""` |
| **emoji** | string | Visual icon | `❤️` |

## Key Categories

### **primary** - Visible combat/character stats
- Displayed in stats panel
- Can have levelUp and gear bonuses
- Examples: damage, armor, moveSpeed

### **core** - Internal game mechanics
- Hidden from stats panel (`hideInStatsPanel: TRUE`)
- Only use base values (no levelUp/gear bonuses)
- Examples: level, xp, hp, soma

## Current Stats (20 total)

### **Core Stats** (hidden from panel)
1. ⭐ **Level** - Current player level
2. ✨ **XP** - Experience points
3. 🔮 **Soma** - Currency
4. 💗 **HP** - Current health

### **Primary Stats** (visible in panel)
5. ❤️ **Max HP** - Maximum health points
6. 💚 **HP Regen** - Health recovery rate
7. 🩸 **Lifesteal** - Heal on enemy hit
8. ⚔️ **Damage** - Percent damage increase
9. 🔴 **Red** - Red element value
10. 🟢 **Green** - Green element value
11. 🔵 **Blue** - Blue element value
12. 🟡 **Yellow** - Yellow element value
13. ⚡ **Attack Speed** - Attack rate increase
14. 💥 **Crit** - Critical hit chance
15. 🔭 **Range** - Attack radius
16. 🛡️ **Armor** - Damage reduction
17. 💨 **Dodge** - Dodge chance
18. 🏃 **Speed** - Movement speed
19. 💰 **Interest** - Soma interest rate
20. 🍀 **Luck** - Bonus quality

## Percentage Stats
Stats with `isPercent: TRUE` are formatted with % and calculated as percentages:
- **Damage**: `15` → displays as `15%` → multiplier is `1.15`
- **Dodge**: `10` → displays as `10%` → chance is `10%`