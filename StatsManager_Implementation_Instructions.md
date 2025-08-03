# StatsManager Implementation Instructions for Cursor

## Overview
Implement a CSV-driven StatsManager that provides a unified API for all player statistics. All stats (including level, XP, HP, etc.) are stored in a single `player.stats` object with layered stat system.

## Key Requirements

### 1. Unified Stats API
- **ALL stats go through `player.stats`** - no separate game stats
- Use CSV metadata to determine if stat is primary/secondary/hidden
- Provide layered access: `base`, `fromLevelUp`, `fromGear`, `total`

### 2. CSV-Driven Design
- Load all stat definitions from `/stats.csv`
- Use CSV fields to control display, formatting, bounds checking
- No hardcoded stat structures in TypeScript

### 3. Layered Stat System
```typescript
player.stats.base.damage        // Starting values from CSV (never change)
player.stats.fromLevelUp.damage // Accumulated bonuses from level ups
player.stats.fromGear.damage    // Bonuses from equipped items/body parts
player.stats.total.damage       // Final calculated value (sum of above)
```

## File Structure to Create

```
src/game/stats/
├── StatDefinition.ts    // Interface for CSV data
├── StatsManager.ts      // Main stats management class
└── index.ts            // Exports
```

## 1. StatDefinition.ts

```typescript
export interface StatDefinition {
  category: 'primary' | 'secondary'
  order: number
  key: string
  displayName: string
  hideInStatsPanel: boolean
  description: string
  isPercent: boolean
  baseValue: number
  minValue?: number
  maxValue?: number
}
```

## 2. StatsManager.ts Implementation

```typescript
import { StatDefinition } from './StatDefinition'

export class StatsManager {
  private statDefinitions: Map<string, StatDefinition> = new Map()
  
  // Layered stats storage - ALL stats go here (including level, XP, HP)
  private baseStats: Map<string, number> = new Map()
  private levelUpStats: Map<string, number> = new Map()
  private gearStats: Map<string, number> = new Map()
  private totalStats: Map<string, number> = new Map()

  constructor() {
    this.loadStatsFromCSV()
  }

  // CSV Loading
  private async loadStatsFromCSV(): Promise<void> {
    try {
      const response = await fetch('/stats.csv')
      const csvText = await response.text()
      this.parseCSV(csvText)
      this.initializeStats()
    } catch (error) {
      console.error('Failed to load stats.csv:', error)
      this.initializeDefaultStats()
    }
  }

  private parseCSV(csvText: string): void {
    const lines = csvText.split('\n').slice(1) // Skip header
    
    lines.forEach(line => {
      if (line.trim()) {
        const [category, order, key, displayName, hideInStatsPanel, 
               description, isPercent, baseValue, minValue, maxValue] = 
               line.split(',').map(cell => cell.trim())
        
        const statDef: StatDefinition = {
          category: category as 'primary' | 'secondary',
          order: parseInt(order),
          key,
          displayName,
          hideInStatsPanel: hideInStatsPanel === 'TRUE',
          description,
          isPercent: isPercent === 'TRUE',
          baseValue: parseFloat(baseValue) || 0,
          minValue: minValue ? parseFloat(minValue) : undefined,
          maxValue: maxValue ? parseFloat(maxValue) : undefined
        }
        
        this.statDefinitions.set(key, statDef)
      }
    })
  }

  private initializeStats(): void {
    // Initialize ALL stats with base values from CSV
    this.statDefinitions.forEach((statDef, key) => {
      this.baseStats.set(key, statDef.baseValue)
      this.levelUpStats.set(key, 0)
      this.gearStats.set(key, 0)
    })
    this.recalculateStats()
  }

  // Unified Stats API - ALL stats accessible through these getters
  get base(): Record<string, number> {
    const result: Record<string, number> = {}
    this.statDefinitions.forEach((statDef, key) => {
      result[key] = this.baseStats.get(key) || 0
    })
    return result
  }

  get fromLevelUp(): Record<string, number> {
    const result: Record<string, number> = {}
    this.statDefinitions.forEach((statDef, key) => {
      result[key] = this.levelUpStats.get(key) || 0
    })
    return result
  }

  get fromGear(): Record<string, number> {
    const result: Record<string, number> = {}
    this.statDefinitions.forEach((statDef, key) => {
      result[key] = this.gearStats.get(key) || 0
    })
    return result
  }

  get total(): Record<string, number> {
    const result: Record<string, number> = {}
    this.statDefinitions.forEach((statDef, key) => {
      result[key] = this.totalStats.get(key) || 0
    })
    return result
  }

  // Helper methods for category filtering (when needed)
  getPrimaryStats(): Record<string, number> {
    const result: Record<string, number> = {}
    this.statDefinitions.forEach((statDef, key) => {
      if (statDef.category === 'primary') {
        result[key] = this.totalStats.get(key) || 0
      }
    })
    return result
  }

  getSecondaryStats(): Record<string, number> {
    const result: Record<string, number> = {}
    this.statDefinitions.forEach((statDef, key) => {
      if (statDef.category === 'secondary') {
        result[key] = this.totalStats.get(key) || 0
      }
    })
    return result
  }

  // Stat modification methods
  addLevelUpStats(stats: Record<string, number>): void {
    Object.entries(stats).forEach(([key, value]) => {
      if (this.statDefinitions.has(key)) {
        const current = this.levelUpStats.get(key) || 0
        this.levelUpStats.set(key, current + value)
      }
    })
    this.recalculateStats()
  }

  addGearStats(stats: Record<string, number>): void {
    Object.entries(stats).forEach(([key, value]) => {
      if (this.statDefinitions.has(key)) {
        const current = this.gearStats.get(key) || 0
        this.gearStats.set(key, current + value)
      }
    })
    this.recalculateStats()
  }

  // Equipment management
  equipItem(itemStats: Record<string, number>): void {
    this.addGearStats(itemStats)
  }

  unequipItem(itemStats: Record<string, number>): void {
    const negativeStats: Record<string, number> = {}
    Object.entries(itemStats).forEach(([key, value]) => {
      negativeStats[key] = -value
    })
    this.addGearStats(negativeStats)
  }

  // XP and leveling (now part of unified stats)
  gainXP(amount: number): boolean {
    const currentXP = this.totalStats.get('xp') || 0
    const currentLevel = this.totalStats.get('level') || 1
    const newXP = currentXP + amount
    
    // Update XP directly in base stats (since it's not from level/gear)
    this.baseStats.set('xp', newXP)
    
    // Check for level up (example: 100 * level^1.5)
    const xpRequired = Math.floor(100 * Math.pow(currentLevel, 1.5))
    
    if (newXP >= xpRequired) {
      this.levelUp()
      this.recalculateStats()
      return true // Level up occurred
    }
    
    this.recalculateStats()
    return false
  }

  private levelUp(): void {
    // Increase level in base stats
    const currentLevel = this.baseStats.get('level') || 1
    this.baseStats.set('level', currentLevel + 1)
    
    // Reset XP for next level
    this.baseStats.set('xp', 0)
  }

  // Stat calculation with bounds checking
  private recalculateStats(): void {
    this.statDefinitions.forEach((statDef, key) => {
      const base = this.baseStats.get(key) || 0
      const levelUp = this.levelUpStats.get(key) || 0
      const gear = this.gearStats.get(key) || 0
      
      let total = base + levelUp + gear
      
      // Apply bounds checking from CSV
      if (statDef.minValue !== undefined) {
        total = Math.max(total, statDef.minValue)
      }
      if (statDef.maxValue !== undefined) {
        total = Math.min(total, statDef.maxValue)
      }
      
      this.totalStats.set(key, total)
    })
  }

  // Display helpers for UI
  getDisplayStats(category?: 'primary' | 'secondary'): Array<{
    key: string
    displayName: string
    value: number
    formattedValue: string
    description: string
  }> {
    const stats: Array<any> = []
    
    this.statDefinitions.forEach((statDef, key) => {
      if (statDef.hideInStatsPanel) return
      if (category && statDef.category !== category) return
      
      const value = this.totalStats.get(key) || 0
      const formattedValue = statDef.isPercent ? 
        `${(value * 100).toFixed(1)}%` : 
        value.toString()
      
      stats.push({
        key,
        displayName: statDef.displayName,
        value,
        formattedValue,
        description: statDef.description
      })
    })
    
    return stats.sort((a, b) => {
      const orderA = this.statDefinitions.get(a.key)?.order || 0
      const orderB = this.statDefinitions.get(b.key)?.order || 0
      return orderA - orderB
    })
  }

  // Master panel management for UI
  updateMasterStatsPanel(masterContainer: HTMLElement): void {
    const displayStats = this.getDisplayStats()
    
    // Clear existing content
    masterContainer.innerHTML = ''
    
    // Generate HTML dynamically based on CSV order
    displayStats.forEach(stat => {
      const statElement = document.createElement('div')
      statElement.className = `stat-item ${stat.key}`
      statElement.innerHTML = `
        <span class="stat-name">${stat.displayName}</span>
        <span class="stat-value">${stat.formattedValue}</span>
      `
      masterContainer.appendChild(statElement)
    })
  }

  cloneStatsToContainer(targetContainer: HTMLElement, masterContainer: HTMLElement): void {
    targetContainer.innerHTML = masterContainer.innerHTML
  }
}
```

## 3. Player.ts Integration

**Replace the existing stat system in Player.ts with:**

```typescript
import { StatsManager } from './stats/StatsManager'

export class Player {
  public stats: StatsManager  // Single stats interface
  
  constructor() {
    this.stats = new StatsManager()
    // All stat access through this.stats
  }
  
  // Convenient getters for commonly used stats
  get currentHP() { return this.stats.total.hp }
  get maxHP() { return this.stats.total.maxHP }
  get moveSpeed() { return this.stats.total.moveSpeed }
  get level() { return this.stats.total.level }
  get xp() { return this.stats.total.xp }
  
  // Remove all existing stat-related properties and methods
  // Everything goes through this.stats now
}
```

## 4. Game.ts Updates

**Replace XP/level logic with:**

```typescript
// In checkSomaPickup or wherever XP is gained
const leveledUp = this.player.stats.gainXP(somaValue)
if (leveledUp) {
  this.showLevelUpScreen()
}

// Replace any direct stat access with:
const playerAttack = this.player.stats.total.damage
const playerSpeed = this.player.stats.total.moveSpeed
// etc.
```

## 5. UI Component Updates

**In PauseScreen.ts, ShopScreen.ts, LevelUpScreen.ts:**

```typescript
// Replace all manual stat display code with:
private updateStatsDisplay(): void {
  const masterContainer = this.getMasterStatsContainer() // ShopScreen container
  const thisContainer = this.getStatsContainer() // This screen's container
  
  // Update master panel
  this.player.stats.updateMasterStatsPanel(masterContainer)
  
  // Clone to this screen
  this.player.stats.cloneStatsToContainer(thisContainer, masterContainer)
}

// Remove all manual DOM manipulation like:
// const attackElement = container.querySelector('.stat-item.attack .stat-value')
// attackElement.textContent = stats.attack.toString()
```

## Usage Examples

### Basic Stat Access
```typescript
// Get any stat value
const damage = player.stats.total.damage
const level = player.stats.total.level
const currentHP = player.stats.total.hp

// See stat breakdown
console.log('Base damage:', player.stats.base.damage)
console.log('Level bonus:', player.stats.fromLevelUp.damage)
console.log('Gear bonus:', player.stats.fromGear.damage)
console.log('Total damage:', player.stats.total.damage)
```

### Level Up
```typescript
// Player chooses +5 damage, +2 speed at level up
player.stats.addLevelUpStats({ 
  damage: 5, 
  moveSpeed: 2 
})
```

### Equipment
```typescript
// Equip wolf head body part
const wolfHead = { 
  damage: 10, 
  red: 3, 
  moveSpeed: -2  // tradeoff
}
player.stats.equipItem(wolfHead)

// Later, unequip it
player.stats.unequipItem(wolfHead)
```

### XP Gain
```typescript
// Gain XP from killing enemy
const leveledUp = player.stats.gainXP(25)
if (leveledUp) {
  // Show level up screen
}
```

## Key Implementation Notes

1. **No hardcoded stats** - everything comes from CSV
2. **All stats unified** - level, XP, HP, damage all in same system
3. **CSV controls display** - use hideInStatsPanel, isPercent, order fields
4. **Layered system** - base + fromLevelUp + fromGear = total
5. **Bounds checking** - use minValue/maxValue from CSV
6. **Dynamic UI** - stats panel generated from CSV order

## Testing Checklist

- [ ] CSV loads correctly on game start
- [ ] All stats initialize with base values
- [ ] Level up adds to fromLevelUp layer
- [ ] Equipment adds to fromGear layer
- [ ] Total stats calculate correctly
- [ ] UI displays stats in CSV order
- [ ] Hidden stats don't show in panel
- [ ] Percentage stats format correctly
- [ ] XP gain and level up work
- [ ] Equipment equip/unequip works

This unified approach eliminates all stat duplication and provides a clean, CSV-driven foundation for the transformation system.

