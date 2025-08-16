# Echoes - Transformation Roguelike Development Guide

## Project Overview & Architecture

**Echoes** is a 2D top-down transformation roguelike where players fight through 21 waves as chimeras, acquiring body parts from different animals to fundamentally change their identity and gameplay mechanics. Each transformation represents meaningful personal change, not just stat upgrades.

**Technology Stack:**
- **Frontend**: TypeScript, HTML5 Canvas (game world), HTML/CSS (UI overlays)
- **Desktop**: Tauri (Rust backend)
- **Build Tool**: Vite
- **Package Manager**: npm

**Hybrid Rendering Approach:**
- **Canvas**: Game world rendering (entities, animations, effects)
- **HTML/CSS**: UI overlays (menus, HUD, debug panels)
- Performance-optimized with clear separation of concerns

**Project Structure:**
```
echoes/
├── src/
│   ├── game/           # Core game logic and entities
│   ├── input/          # Input handling and management
│   ├── render/         # Canvas rendering and graphics
│   ├── ui/             # HTML/CSS UI components and overlays
│   ├── utils/          # Utility functions and helpers
│   └── data/           # CSV configuration files
├── src-tauri/          # Tauri desktop app configuration
└── examples/           # Reference materials and assets
```

## Core Game Systems

### Game Loop & Phases

**GamePhase Management:**
```typescript
enum GamePhase {
  WAVE = 'wave',     // Combat gameplay
  LEVELUP = 'levelup', // Levelup bonus selection
  SHOP = 'shop'      // Gear/Items Marketplace
}
```

**Main Game Loop Structure:**
- `requestAnimationFrame` for smooth 60fps
- Delta time for frame-rate independent movement
- Separate update/render cycles for clean architecture
- Phase-specific update logic with paused state handling

**Wave System (21 Total Waves):**
- Wave durations defined in `Game.ts` waveData array
- Waves 1-2: 10s (testing), 3-6: 30-50s, 7-21: 60-90s
- Boss waves every 7th wave (7, 14, 21) with special mechanics
- Wave cleanup resets all game objects between waves

**Phase Transitions:**
1. **Wave End** → Calculate level up credits → Level up phase OR Shop phase
2. **Level Up** → Spend credits on stat bonuses → Shop phase (when credits exhausted)
3. **Shop** → Select body parts/transformations → Next wave

**Comprehensive Wave Cleanup:**
```typescript
private cleanup(): void {
  // Reset player position to center
  this.player.x = this.canvas.width / 2
  this.player.y = this.canvas.height / 2
  
  // Clear all game objects
  this.enemies = []
  this.somaList = []
  this.floatingTexts = []
  this.spawnManager.cleanup()
  this.player.projectiles = []
}
```

### Player System

**Movement & Input:**
- WASD movement with configurable speed
- Mouse-based aiming and firing
- Collision detection using rectangular bounds
- Movement affects breathing amplitude and period

**Breathing Animation System:**
```typescript
// Player animation only during movement
const sineValue = Math.sin(this.animationTime + this.animationOffset)
const intensity = this.movementAnimationIntensity // 0-1 based on movement
const scaleVariation = 0.15 * intensity // ±15% max scale
```
- **Animation Parameters**: ±15% scale, 350ms period
- **Intensity Ramping**: Smooth ramp up/down based on movement
- **Performance**: Simple sine wave calculation per frame

**Health & Damage:**
- Invulnerability timer prevents damage spam
- Damage flash visual feedback
- `takeDamage(amount)` returns actual damage dealt (0 if blocked)
- Healing separate from stat recalculation

### Weapon System

**Projectile Mechanics:**
- Mouse-based aiming with projectile spawning at player position
- Projectiles have damage, speed, and size properties
- **Object Pooling**: Reuse projectile objects for performance

**Collision Detection:**
```typescript
// Center-based "fully inside" collision logic
const distance = Math.sqrt(dx * dx + dy * dy)
const enemyRadius = Math.min(enemy.width, enemy.height) / 2
if (distance <= enemyRadius - projectile.size / 2) {
  // Hit detected
}
```

**Critical Hit System:**
- `critChance` stat determines crit probability
- Critical hits deal 2x damage
- Visual feedback through floating text color coding

### Stats System (Three-Layer Architecture)

**Core Philosophy: `base + levelUp + gear = total`**

```typescript
class Stats {
  // Never change during gameplay
  private base: Record<string, number> = {
    moveSpeed: BASE_MOVE_SPEED,
    maxHP: BASE_MAX_HP,
    attack: BASE_ATTACK,
    armor: BASE_ARMOR,
    critChance: BASE_CRIT
  }
  
  // Permanent gains from leveling
  private levelUp: Record<string, number> = {}
  
  // Equipment/body part bonuses (recalculated when gear changes)
  private gear: Record<string, number> = {}
  
  // Cached final values (only recalculate when sources change)
  get total() { return this.calculateTotal() }
}
```

**Critical Separation Principles:**
- **HP vs MaxHP**: Body parts provide `maxHP` bonuses, not instant healing
- **Stat Recalculation vs Healing**: `recalculateStats()` updates totals, `heal()` manages current HP
- **Performance**: Cached calculations, only recalculate when gear/level changes

**Level Up Process:**
1. Player gains XP from soma collection
2. Level up triggers during wave gameplay
3. At wave end, calculate level up credits: `currentLevel - waveLevelStartedAt`
4. Level up phase: choose from 4 random stat bonuses per credit
5. Each selection increments both current HP and maxHP by 1

### Enemy System

**AI & Movement:**
- Simple AI: move toward player with configurable speed
- Basic pathfinding (no obstacles currently)
- Death animation with lifecycle management

**Breathing Animation:**
```typescript
// Enemies always animate
const sineValue = Math.sin(this.animationTime + this.animationOffset)
const scaleVariation = 0.12 // ±12% scale
```
- **Animation Parameters**: ±12% scale, 750ms period, always active
- **Unique Timing**: Each enemy has random `animationOffset` to prevent synchronization

**Spawn Management:**
- **SpawnManager** handles probability-based spawning
- **PreSpawnIndicators** telegraph enemy spawns 2 seconds in advance
- **Spawn Blocking**: Player can prevent spawns by standing on indicators
- **Balancing**: Target enemy count (5) with probability boost when below target

**Spawn Probability System:**
```typescript
// Dynamic probability based on current enemy count
if (totalEnemyCount < targetEnemyCount) {
  // Below target - boost probability
  currentSpawnProbability = baseSpawnProbability + probabilityBoost
} else {
  // At target - use base + accumulated missed spawn bonus
  currentSpawnProbability = Math.min(1.0, baseSpawnProbability + missedSpawnBonus)
}
```

**Spawn Feedback:**
- "Spawn Blocked" floating text when player prevents spawn
- Visual pre-spawn indicators with countdown
- Comprehensive cleanup between waves

## Body Parts & Transformation

### Body Part System

**CSV Data Structure:**
```csv
id,displayName,type,imgFileName,scale,maxHP,hpRegen,moveSpeed,attack,armor,critChance,luck
turtletorso,Turtle Shell,torso,turtle-shell.png,1.5,15,0,0,0,5,0,0
froghead,Frog Head,head,frog-head.png,1.0,0,0,0,0,0,0,0
```

**Key Design Principles:**
- **Scale Column Before Stats**: Keeps all stat columns contiguous for parsing
- **Semantic Access**: Use `row['columnName']` instead of array indices
- **maxHP vs hp**: Body parts affect maximum potential, not current state
- **Native Resolution Scaling**: `sprite.naturalWidth * scale` preserves asset quality

**Stat Integration:**
```typescript
// Body parts contribute to gear stats layer
private updateGear(bodyParts: BodyPart[]): void {
  this.gear = {} // Reset
  bodyParts.forEach(part => {
    Object.entries(part.stats).forEach(([stat, value]) => {
      this.gear[stat] = (this.gear[stat] || 0) + value
    })
  })
}
```

### Equipment Integration

**Current Implementation:**
- Player has `body: BodyPart[]` array representing equipped parts
- `stats.recalculateStats(bodyParts)` updates gear bonuses
- Visual representation through sprite scaling and positioning

**Default Configuration:**
- **Default Torso**: Turtle shell (150% scale, +15 maxHP, +5 armor)
- **Default Head**: Frog head (100% scale, no stat bonuses)
- More body parts defined in `/data/bodyparts.csv`

## UI Systems

### Unified UI Architecture

**UIScreen Management:**
```typescript
enum UIScreen {
  PAUSE = 'pause',
  LEVELUP = 'levelup',
  SHOP = 'shop'
}
```

**HTML Overlay Strategy:**
- Game canvas renders independently of UI
- HTML overlays positioned absolutely over canvas
- Phase-specific UI displays with callback patterns
- `UnifiedUI` class manages all screen transitions

**Callback Pattern:**
```typescript
// Game.ts registers callbacks with UI
this.ui.onLevelUpSelection = (statBonus) => this.onLevelUpSelection(statBonus)
this.ui.onGoWave = () => this.onGoWaveClicked()
this.ui.onResume = () => this.onPauseToggle()
```

### HUD System

**Real-time Display Elements:**
- **Health Bar**: Current HP / Max HP with visual bar
- **Wave Timer**: Countdown timer with wave number
- **Stats Display**: Key stats during gameplay
- **XP/Level Info**: Current level and experience

**Update Pattern:**
```typescript
// HUD updates every frame during wave phase
this.hud.update(this.player)
this.ui.updateWaveTimer(this.waveTimer)
this.ui.updateStats(this.player)
```

### Menu Screens

**Pause Screen Layout:**
- **Left 2/3**: Inventory and transformation display
- **Right 1/3**: Player statistics and current chimera state
- **Bottom**: Action buttons (Resume, Quit, Settings)
- **Background**: Semi-transparent overlay `rgba(0, 0, 0, 0.7)`

**Level Up Interface:**
- Display 4 random stat upgrade options
- Show remaining level up credits
- Instant application of selected bonuses
- Transition to shop when credits exhausted

**Shop/Transformation Marketplace:**
- Future: Body part selection and preview
- Current: Basic "Go Wave" button to start next wave
- Will integrate transformation preview and compatibility checking

## Visual Systems

### Animation Framework

**Sine Wave Breathing Effects:**
```typescript
// Universal animation pattern
const sineValue = Math.sin(this.animationTime + this.animationOffset)
const widthScale = 1 + (sineValue * amplitude)
const heightScale = 1 - (sineValue * amplitude)
```

**Animation Parameters by Entity:**
- **Player**: Unified character assembly breathing using Canvas transforms, different amplitude/period for moving vs static
- **Enemies**: Individual breathing, always active
- **Unique Offsets**: Prevent synchronized movement across entities

**Player Character Assembly:**
- Canvas save/restore transforms applied to entire character
- All body parts breathe together from character center
- Movement state affects breathing intensity and speed

### Rendering Pipeline

**Draw Order Hierarchy:**
1. **Soma** (drawOrder: 50) - on ground, behind everything
2. **Enemies** (drawOrder: 100) - characters
3. **Player** (drawOrder: 205-220) - player character layers
4. **Projectiles** (drawOrder: 300) - flying above characters
5. **UI Elements** (drawOrder: 400+) - spawn indicators, floating text

**Canvas Management:**
- Single canvas element with 2D rendering context
- Viewport management for different screen sizes
- Clear → Render → Present cycle each frame

**Sprite Scaling Implementation:**
```typescript
// Scale sprites using their native dimensions
const scaledWidth = sprite.naturalWidth * part.scale
const scaledHeight = sprite.naturalHeight * part.scale
renderer.drawImage(sprite, x - scaledWidth/2, y - scaledHeight/2, scaledWidth, scaledHeight)
```

### Floating Text System

**Damage Number Display:**
- Spawned at entity position with upward drift
- Color coding: white (normal), yellow (crit), red (player damage)
- Automatic lifecycle management with fade-out

**Status Feedback Messages:**
- "Level Up!" text on player level advancement
- "Spawn Blocked" text when preventing enemy spawns
- Custom messages for special events

**Animation Pattern:**
```typescript
// Floating text lifecycle
class FloatingText {
  update(deltaTime: number): boolean {
    this.y -= this.speed * deltaTime / 1000 // Drift upward
    this.lifetime -= deltaTime
    return this.lifetime > 0 // Return false when expired
  }
}
```

## Data Management & Architecture Decisions

### CSV Data Structure

**File Organization in `/data/` folder:**
- `bodyparts.csv` - All body part definitions with stats and scaling
- `enemies.csv` - Enemy types and properties (future)
- `xptable.csv` - Experience requirements per level (future)
- `waves.csv` - Wave configuration data (future)

**Body Parts CSV Structure:**
```csv
id,displayName,type,imgFileName,scale,maxHP,hpRegen,moveSpeed,attack,armor,critChance,luck
```

**Design Rationale:**
- **Scale before stats**: Keeps stat columns contiguous for parsing
- **Semantic access**: `row['scale']` instead of `row[4]` for maintainability
- **maxHP naming**: Clear distinction from current HP
- **Extensible**: Easy to add new stats without breaking existing parsing

### Architecture Decisions

**Three-Layer Stats System:**
- **Why**: Simple mental model, easy debugging, performance-friendly caching
- **Alternative Rejected**: Complex stat managers with event systems
- **Benefits**: Clear separation of stat sources, predictable recalculation

**HP vs MaxHP Separation:**
- **Why**: Body parts affect potential, not current state; prevents free healing mid-wave
- **Implementation**: `recalculateStats()` updates totals, `heal()` manages current HP separately
- **Player Experience**: Stat changes don't automatically heal, maintaining challenge

**External Debug UI:**
- **Why**: Doesn't interfere with game rendering, easy to style and interact with
- **Alternative Rejected**: Canvas-based debug overlay
- **Benefits**: Can use HTML form elements, doesn't affect game performance

**CSV-Driven Sprite Scaling:**
- **Why**: Preserves original asset quality, easy content iteration
- **Alternative Rejected**: Fixed 30px sprites for all entities
- **Benefits**: Artists can create optimal resolution assets, designers can tweak scale data-side

**Wave Cleanup System:**
- **Why**: Prevents state leakage, ensures consistent starting conditions
- **Implementation**: Single `cleanup()` method resets everything at wave end
- **Benefits**: Easier debugging, no weird cross-wave interactions

## Debug & Development Tools

### Debug UI System

**External HTML Panel:**
```typescript
// Creates positioned debug panel outside game canvas
const debugPanel = document.createElement('div')
debugPanel.style.cssText = `
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 8px;
`
```

**Real-time Toggle Controls:**
- **Show Bounds**: Checkbox to display collision boundaries
- **Extensible**: Easy to add more debug options (spawn rates, stats, etc.)
- **State Management**: Singleton `DebugSystem` class manages all debug state

### Debug Visualization

**Bounds Display System:**
```typescript
// Conditional debug rendering in entity render methods
if (debug.showBounds) {
  renderer.drawRect(this.x - this.width/2, this.y - this.height/2, 
                   this.width, this.height, 'cyan')
}
```

**Color Coding:**
- **Cyan**: Collision boundaries (enemies, player)
- **Green**: Pickup radius (soma collection)
- **Red**: Damage zones (future)
- **Yellow**: Spawn indicators and debug markers

**Performance Monitoring:**
- Debug rendering only when enabled
- No performance impact when debug UI hidden
- Console logging for major events (level ups, wave transitions)

### Development Patterns

**Object Pooling for Performance:**
```typescript
// Projectile reuse pattern
class ProjectilePool {
  private pool: Projectile[] = []
  
  acquire(): Projectile {
    return this.pool.pop() || new Projectile()
  }
  
  release(projectile: Projectile): void {
    projectile.reset()
    this.pool.push(projectile)
  }
}
```

**Event-Driven Architecture:**
- UI callbacks for game state changes
- Separation between game logic and presentation
- Clean interfaces between systems

**Error Handling & Logging:**
- Console logging for debugging major events
- Graceful degradation when assets missing
- Clear error messages for development

## Game Balance & Configuration

### Difficulty Scaling

**Enemy Count Progression:**
- Target enemy count: 5 active enemies + pre-spawn indicators
- Spawn probability: 30% base, +50% boost when below target
- Missed spawn bonus: +7% per missed spawn when at target

**Spawn Probability Formula:**
```typescript
if (totalEnemyCount < targetEnemyCount) {
  currentSpawnProbability = 0.3 + 0.5 // 80% when below target
} else {
  currentSpawnProbability = Math.min(1.0, 0.3 + missedSpawnBonus)
}
```

**Wave Timing Balance:**
- Early waves: 10-30 seconds (learning/testing)
- Mid waves: 40-60 seconds (standard gameplay)
- Boss waves: 75-90 seconds (challenge encounters)

### Player Progression

**XP Mechanics:**
- Soma collection: 1 XP per soma orb (50-52 orbs per enemy)
- Level up triggers: Configurable XP thresholds
- Level up credits: Levels gained during wave = selectable bonuses

**Stat Bonus Distribution:**
- 4 random options per level up credit
- Each selection: +1 to chosen stat
- MaxHP selection also increases current HP by 1
- Strategic choice between immediate power vs long-term build

**Equipment Progression:**
- Body parts provide flat stat bonuses
- Multiple parts of same type can stack (future)
- Transformation synergies planned for complex builds

## Code Conventions & Patterns

### TypeScript Standards

**Naming Conventions:**
- **Variables/Functions**: `camelCase` (playerHealth, moveSpeed, getCurrentHP)
- **Classes**: `PascalCase` (Player, Enemy, SpawnManager)
- **Constants**: `SCREAMING_SNAKE_CASE` (BASE_MOVE_SPEED, BASE_MAX_HP)
- **Files**: `PascalCase.ts` for classes, `camelCase.ts` for utilities

**Type Safety Patterns:**
```typescript
// Strict interfaces for data contracts
interface GameEntity {
  update(deltaTime: number): void
  render(renderer: Renderer): void
  destroy(): void
}

// Enums for state management
enum GamePhase {
  WAVE = 'wave',
  LEVELUP = 'levelup', 
  SHOP = 'shop'
}
```

### Performance Optimization

**Cached Stat Calculations:**
```typescript
// Only recalculate when sources change, not every frame
private recalculateStats(): void {
  this.totalStats.moveSpeed = this.baseStats.moveSpeed + 
                              this.levelStats.moveSpeed + 
                              this.equipmentStats.moveSpeed
}
```

**Efficient Collision Detection:**
- Use squared distances to avoid expensive sqrt() when possible
- Broad-phase culling for large entity counts (future)
- Spatial partitioning for optimization (future)

**Memory Management:**
- Object pooling for frequently created/destroyed objects
- Proper cleanup of event listeners and references
- Array filtering to remove expired entities

## Platform Considerations

**Tauri Desktop Optimization:**
- Native window management and controls
- File system access for save data (future)
- Platform-specific performance optimizations

**Web Deployment Strategy:**
- Canvas-based rendering works in all modern browsers
- HTML/CSS UI components for responsive design
- Asset loading optimization for web delivery

**Cross-Platform Compatibility:**
- Consistent input handling across platforms
- Responsive canvas sizing for different screen sizes
- Performance scaling based on device capabilities

---

## Development Guidelines & Best Practices

### System Analysis Protocol

**Key Systems to Always Examine Before Implementation:**
1. **Game Core Loop** - WAVE/LEVELUP/SHOP phase transitions and timing
2. **Stats System** - Three-layer architecture (base + levelUp + gear = total)
3. **Body Parts/Equipment** - CSV-driven with stat integration and scaling
4. **UI System** - UnifiedUI with dynamic content switching and callbacks
5. **Animation System** - Sine wave breathing effects with Canvas transforms
6. **Debug System** - External HTML panels with real-time toggles

### Implementation Best Practices

**Before Writing Any Code:**
- Read existing related files (Stats.ts, Player.ts, Game.ts, etc.)
- Check for existing methods that do similar work
- Understand established patterns and data flows
- Look for extension points rather than creating parallel systems

**Integration Over Duplication:**
- Extend existing methods rather than create new ones
- Use established data flows (e.g., CSV → stats → UI)
- Follow existing patterns (e.g., semantic column access with `row['columnName']`)
- Respect the three-layer stats architecture

**Critical Questions to Ask:**
- "Does the stats system already handle this?"
- "Is there an existing UI pattern I should follow?"
- "What would break if I change this system?"
- "Am I reinventing something that already exists?"

### Method Naming Standards

**Good Examples:**
- `recalculateStats()` - Clear action, single responsibility
- `updateGear()` - Concise, uses domain vocabulary
- `heal()` - Simple verb matching the domain

**Bad Examples:**
- `updateGearFromStatsForBodyPart()` - Too verbose, unclear responsibility
- `doStatStuffForPlayer()` - Vague, unprofessional
- `handleTheThing()` - No domain meaning

**Guidelines:**
- Single responsibility principle in names
- Use existing vocabulary from the system
- Prefer domain-specific verbs (`heal` vs `changeHP`)
- Keep method names under 20 characters when possible

### Ownership & Responsibility Rules

**Clear Ownership Patterns:**
- **Player** should always handle its own stats, HP, movement, and body parts
- **Game** manages phases, timing, and coordination between systems
- **SpawnManager** owns enemy spawning logic and pre-spawn indicators
- **UnifiedUI** handles all screen transitions and user input callbacks
- **Stats** class manages stat calculations but never game logic
- **BodyPart** objects are data containers, logic belongs in Player

**Never Cross Boundaries:**
- Game should never directly modify Player.stats - use Player methods
- UI should never directly access game state - use callbacks
- Stats should never know about Player - Player knows about Stats
- SpawnManager should never modify Player - return data for Game to handle

**Examples:**
```typescript
// ✅ Good - Player owns its stats
player.heal(amount)
player.stats.recalculateStats(this.body)

// ❌ Bad - External manipulation
player.stats.currentHP += amount
game.modifyPlayerStats(changes)

// ✅ Good - Clear data flow
const spawnResult = spawnManager.update(deltaTime, player, enemies)
enemies.push(...spawnResult.newEnemies)

// ❌ Bad - Boundary violation
spawnManager.addEnemiesToGame(game)
```

### System Extension Guidelines

**When Working with Stats System:**
- Always use the three-layer approach (base + levelUp + gear)
- Stats change at runtime through player actions, never CSV modification
- Use `getStat()` and `setStat()` methods, not direct property access
- CSV files define the system structure but never change during gameplay

**When Adding to UI System:**
- Follow the UnifiedUI pattern with dynamic content switching
- Add new screens to UIScreen enum and content templates
- Use callback pattern to communicate with Game

**CSV File Policy:**
- **NEVER modify CSV files without explicit developer permission**
- CSV files are configuration data, not runtime data
- bodyparts.csv, stats.csv, etc. define system structure only
- All gameplay changes happen through the code layer, not data files

---

## Development Commands

**Testing**: Launch `npm run dev` and view at localhost (port will be displayed)
**Building**: Standard npm build process through Vite
**Linting**: Check for lint/typecheck commands in package.json

## Current Status

**Working Systems:**
- ✅ Core game loop with three phases
- ✅ Player movement and animation
- ✅ Enemy spawning and AI
- ✅ Combat system with projectiles
- ✅ Three-layer stats system
- ✅ Body parts CSV integration
- ✅ Wave progression and cleanup
- ✅ Debug UI system

**Next Priorities:**
1. Expand body part selection in shop phase
2. Implement transformation preview system
3. Add more enemy types and behaviors
4. Visual polish and particle effects

This guide preserves all architectural decisions, implementation details, and development context needed to continue work on Echoes even with a completely fresh context window.