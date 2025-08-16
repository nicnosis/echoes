# Echoes Technical Decisions Log

This document records key architectural and design decisions made during development, with rationale for future reference.

## Architecture & Design Patterns

### Stats System: Three-Layer Architecture
**Decision:** Use `base + levelUp + gear = total` approach  
**Date:** January 2025  
**Rationale:** 
- Simple mental model vs complex stat managers
- Easy to debug and modify
- Performance-friendly with cached totals
- Clear separation of stat sources

**Implementation:**
```typescript
class Stats {
  base: Record<string, number> = {}      // From CSV
  levelUp: Record<string, number> = {}   // From player choices  
  gear: Record<string, number> = {}      // From body parts/items
  get total() { /* base + levelUp + gear */ }
}
```

### HP vs MaxHP Separation
**Decision:** Separate `recalculateStats()` from `player.heal()`  
**Date:** January 16, 2025  
**Rationale:**
- Stats recalculation shouldn't automatically heal player
- During waves, stat changes (level up, new gear) shouldn't provide free healing
- Wave start/end should heal, but mid-wave stat changes should not
- Cleaner separation of concerns

**Implementation:**
- `stats.recalculateStats(bodyParts)` - updates all stat totals
- `player.heal(amount?)` - manages current HP separately
- `player.heal()` - heals to full, `player.heal(5)` - heals 5 HP

### Debug UI: External HTML Panel
**Decision:** Debug UI outside game canvas as HTML elements  
**Date:** January 16, 2025  
**Rationale:**
- Doesn't interfere with game rendering performance
- Easy to style and interact with (checkboxes, dropdowns)
- Can be toggled without affecting game state
- Extensible for complex debug interfaces

**Implementation:**
- Singleton `DebugSystem` class manages state
- Creates HTML elements dynamically positioned absolutely
- Game code checks `debug.showBounds` for conditional rendering

### Sprite Scaling: CSV-Driven with Native Resolution
**Decision:** Use native image dimensions × CSV scale factor  
**Date:** January 16, 2025  
**Rationale:**
- Preserves original asset quality
- Easy to adjust without touching code
- Semantic column access (`row['scale']`) vs brittle indices
- Scale column placed before stats to keep stat columns contiguous

**Rejected Alternative:** Fixed 30px size for all sprites
**Why Rejected:** Too limiting, doesn't account for different asset sizes

### Body Parts CSV Structure
**Decision:** `id,displayName,type,imgFileName,scale,maxHP,hpRegen,...,luck`  
**Date:** January 16, 2025  
**Rationale:**
- Scale column before stats keeps all stat columns together
- Semantic column access prevents breaking changes
- Stats run contiguously from `maxHP` to `luck`
- Easy to add new columns without affecting stats parsing

### Wave Cleanup: Comprehensive Reset
**Decision:** Single `cleanup()` method that resets everything  
**Date:** January 16, 2025  
**Rationale:**
- Prevents state leakage between waves
- Consistent starting conditions for each wave
- Easier to debug when everything starts clean
- Player position reset prevents edge case issues

**Implementation:**
- `Game.cleanup()` - resets player position, clears all arrays
- `SpawnManager.cleanup()` - resets spawn state and timers
- Called at `endWave()` before transitioning

## Animation & Visual Design

### Movement Animation: Sine Wave Breathing
**Decision:** Use sine waves for both player and enemy movement animation  
**Date:** January 16, 2025  
**Rationale:**
- Organic, lifelike feeling vs static sprites
- Inverse width/height relationship creates "breathing" effect
- Different phases per entity prevents synchronized movement
- Performance-friendly (simple math)

**Parameters:**
- Enemies: ±12% scale, 750ms period, always active
- Player: ±15% scale, 350ms period, only during movement

### Animation Intensity System
**Decision:** Player animations ramp up/down based on movement  
**Date:** January 16, 2025  
**Rationale:**
- Provides immediate visual feedback for movement
- Smooth transitions feel more polished than instant on/off
- Returns to normal proportions when stopping
- Intensity scaling allows gradual transitions

### Debug Visualization Strategy
**Decision:** Comprehensive bounds display with single toggle  
**Date:** January 16, 2025  
**Rationale:**
- Single checkbox easier than multiple options
- Shows all relevant collision/interaction areas
- Color-coded for different purposes (cyan=collision, green=pickup, etc.)
- Can be extended with more options later

## Data & Content Management

### CSV Data Organization
**Decision:** Move all CSV files to `data/` folder  
**Date:** January 16, 2025  
**Rationale:**
- Cleaner project structure
- Groups all game data together
- Easier for content creators to find
- Matches common game development patterns

### Body Part Stat System
**Decision:** `maxHP` bonuses instead of `hp` bonuses in body parts  
**Date:** January 16, 2025  
**Rationale:**
- Body parts should affect maximum potential, not current state
- Prevents body parts from providing instant healing
- Cleaner separation between permanent upgrades and temporary state
- Follows RPG conventions

## Spawn & Enemy Systems

### Spawn Prevention Feedback
**Decision:** Show "Spawn Blocked" floating text when player prevents spawns  
**Date:** January 16, 2025  
**Rationale:**
- Provides clear feedback for defensive player behavior
- Uses existing FloatingText system for consistency
- Positioned at blocked spawn location for clarity
- Encourages strategic positioning gameplay

### Pre-spawn Indicator System
**Decision:** Return spawn result objects instead of simple booleans  
**Date:** January 16, 2025  
**Rationale:**
- Enables rich feedback (blocked vs spawned vs waiting)
- Provides position information for UI feedback
- Extensible for future spawn types or effects
- Cleaner data flow through spawn system

## Future Considerations

### Transformation System Architecture
**Planned Decision:** Component-based body part system with synergy calculations  
**Status:** Not yet implemented  
**Considerations:**
- Each body part as component with stats + special abilities
- Synergy system for compatible parts (wolf head + bear torso = predator focus)
- Identity tension for conflicting parts (wolf + deer = internal conflict)
- Visual chimera generation from part combinations

### Save System Strategy  
**Planned Decision:** JSON-based save system with transformation progress  
**Status:** Planning phase  
**Considerations:**
- Save transformation history and unlocked parts
- Progress through wave system and unlocked content
- Player preference settings and control schemes
- Cloud sync considerations for future platforms