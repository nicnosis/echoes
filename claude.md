# Echoes - Transformation Roguelike Development Guide

## Table of Contents

1. [Project Overview](#project-overview)
2. [Core Game Systems](#core-game-systems)
3. [Visual Systems & Rendering](#visual-systems--rendering)
4. [Camera & Coordinate Systems](#camera--coordinate-systems)
5. [UI Systems](#ui-systems)
6. [Body Parts & Equipment](#body-parts--equipment)
7. [Data Management](#data-management)
8. [Debug & Development Tools](#debug--development-tools)
9. [Architecture Decisions](#architecture-decisions)
10. [Development Guidelines](#development-guidelines)
11. [Current Status](#current-status)

---

# Project Overview

**Echoes** is a 2D top-down transformation roguelike where players fight through 21 waves as chimeras, acquiring body parts from different animals to fundamentally change their identity and gameplay mechanics. Each transformation represents meaningful personal change, not just stat upgrades.

## Technology Stack
- **Frontend**: TypeScript, HTML5 Canvas (game world), HTML/CSS (UI overlays)
- **Desktop**: Tauri (Rust backend)
- **Build Tool**: Vite
- **Package Manager**: npm

## Hybrid Rendering Approach
- **Canvas**: Game world rendering (entities, animations, effects)
- **HTML/CSS**: UI overlays (menus, HUD, debug panels)
- Performance-optimized with clear separation of concerns

## Project Structure
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

---

# Core Game Systems

## Game Loop & Phases

### GamePhase Management
```typescript
enum GamePhase {
  WAVE = 'wave',     // Combat gameplay
  LEVELUP = 'levelup', // Levelup bonus selection
  SHOP = 'shop'      // Gear/Items Marketplace
}
```

### Main Game Loop Structure
- `requestAnimationFrame` for smooth 60fps
- Delta time for frame-rate independent movement
- Separate update/render cycles for clean architecture
- Phase-specific update logic with paused state handling
- **Critical Update Order**: Player updates → Camera updates (prevents 1-frame lag jerk)

### Wave System (21 Total Waves)
- Wave durations defined in `Game.ts` waveData array
- Waves 1-2: 10s (testing), 3-6: 30-50s, 7-21: 60-90s
- Boss waves every 7th wave (7, 14, 21) with special mechanics
- Wave cleanup resets all game objects between waves

### Phase Transitions
1. **Wave End** → Calculate level up credits → Level up phase OR Shop phase
2. **Level Up** → Spend credits on stat bonuses → Shop phase (when credits exhausted)
3. **Shop** → Select body parts/transformations → Next wave

## Player System

### Movement & Input
- WASD movement with configurable speed
- Mouse-based aiming and firing
- Collision detection using rectangular bounds
- Movement affects breathing amplitude and period

### Breathing Animation System
```typescript
// Player animation during movement with unified assembly breathing
const amplitude = this.isMoving ? 0.09 : 0.075 // ±9% moving, ±7.5% static
const period = this.isMoving ? 550 : 1000 // 550ms moving, 1000ms static
```
- **Grounded Breathing**: Transform origin at bottom center, feet stay planted
- **Unified Assembly**: All body parts breathe together as one unit
- **Performance**: Simple sine wave calculation per frame

### Health & Damage
- Invulnerability timer prevents damage spam
- Damage flash visual feedback
- `takeDamage(amount)` returns actual damage dealt (0 if blocked)
- Healing separate from stat recalculation

## Enemy System

### AI & Movement
- Simple AI: move toward player with configurable speed
- Basic pathfinding (no obstacles currently)
- Death animation with lifecycle management

### Breathing Animation
```typescript
// Enemies always animate with grounded breathing
const sineValue = Math.sin(this.animationTime + this.animationOffset)
const scaleVariation = 0.12 // ±12% scale
```
- **Grounded Breathing**: Same bottom-up breathing as player
- **Always Active**: Continuous breathing animation
- **Unique Timing**: Each enemy has random `animationOffset` to prevent synchronization

### Spawn Management
- **SpawnManager** handles probability-based spawning
- **PreSpawnIndicators** telegraph enemy spawns 2 seconds in advance
- **Spawn Blocking**: Player can prevent spawns by standing on indicators
- **Balancing**: Target enemy count (5) with probability boost when below target

## Stats System (Three-Layer Architecture)

### Core Philosophy: `base + levelUp + gear = total`

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

### Critical Separation Principles
- **HP vs MaxHP**: Body parts provide `maxHP` bonuses, not instant healing
- **Stat Recalculation vs Healing**: `recalculateStats()` updates totals, `heal()` manages current HP
- **Performance**: Cached calculations, only recalculate when gear/level changes

---

# Visual Systems & Rendering

## Camera System

### Camera-Driven Rendering Pipeline
```typescript
// Camera object with 1.5x zoom for enhanced visual personality
private cam = {
  x: 0,        // World coordinates - follows player
  y: 0,        // World coordinates - follows player  
  zoom: 1.5,   // 1.5x zoom for more visual personality
  targetZoom: 1.5
}
```

### Core Coordinate System
- **World Coordinates**: All game entities use pure world coordinates (player.x, enemy.x, etc.)
- **Camera Transform**: Renderer automatically transforms world → screen coordinates
- **Screen Coordinates**: Final pixel positions on 1200x900 canvas
- **Lockstep Following**: Camera follows player with no lag for responsive feel

### Coordinate Transformation
```typescript
// Renderer.worldToScreen() - core transformation method
worldToScreen(worldX: number, worldY: number, camera: any): {x: number, y: number} {
  return {
    x: (worldX - camera.x) * camera.zoom + this.canvas.width / 2,
    y: (worldY - camera.y) * camera.zoom + this.canvas.height / 2
  }
}
```

## Animation Framework

### Unified Character Breathing System
```typescript
// Player breathes as single assembly from bottom-up (grounded breathing)
const screen = renderer.worldToScreen(this.x, this.y, camera)
const bottomY = screen.y + (this.height * camera.zoom) / 2

ctx.translate(screen.x, bottomY)
ctx.scale(widthScale, heightScale)  // Apply breathing transform
ctx.translate(-screen.x, -bottomY)

// All body parts rendered within this transform
```

### Animation Parameters by Entity
- **Player**: Unified assembly breathing from feet up, amplitude varies with movement
- **Enemies**: Grounded breathing from feet up, always active, ±12% scale variation
- **Breathing Isolation**: Debug elements, hitboxes, and UI render outside breathing transforms

## Rendering Pipeline

### Canvas Setup
- **Resolution**: 1200x900 canvas (upgraded from 800x600)
- **Zoom Level**: 1.5x for enhanced visual personality and detail
- **Coordinate System**: Pure world coordinates with camera transformation

### Render Method Architecture
```typescript
private render(): void {
  this.renderer.clear()
  this.renderer.setCamera(this.cam)  // Set camera for frame
  
  // Draw order: Debug grid → Soma → Enemies → Player → Projectiles → UI
  if (debug.showBounds) this.renderer.drawDebugGrid()
  // ... render game objects using world coordinates
}
```

### Draw Order Hierarchy
1. **Debug Grid** (drawOrder: 1) - coordinate visualization, renders beneath all
2. **Soma** (drawOrder: 50) - pickup items on ground
3. **Enemies** (drawOrder: 100) - enemy characters  
4. **Player** (drawOrder: 205-220) - player character assembly
5. **Projectiles** (drawOrder: 300) - flying objects above characters
6. **UI Elements** (drawOrder: 400+) - spawn indicators, floating text

### Camera-Aware Rendering
- All `renderer.drawRect()`, `drawCircle()`, `drawImage()` methods automatically apply camera transform
- Entities pass world coordinates, renderer handles screen positioning and scaling
- Manual screen coordinate calculation eliminated from entity classes

---

# Camera & Coordinate Systems

## Camera Architecture

### Design Philosophy
- **World Coordinates**: Game logic operates in consistent world space
- **Camera Transform**: Single transformation point in renderer
- **No Manual Scaling**: Entities never calculate screen coordinates directly

### Camera Configuration
- **1.5x Zoom**: Enhances visual personality without performance impact
- **Lockstep Following**: Camera.x/y = player.x/y (no smoothing lag)
- **Canvas Size**: 1200x900 for more visual real estate

### Rendering Flow
```
Game Objects (world coords) → Camera Transform → Screen Coordinates → Canvas Drawing
```

## Coordinate Transformation Rules

### Entity Rendering Pattern
```typescript
// ✅ CORRECT: Let renderer handle camera transform
renderer.drawImage(sprite, this.x, this.y, width, height, flip)

// ❌ WRONG: Manual coordinate calculation
const screenX = (this.x - camera.x) * camera.zoom + canvas.width/2
```

### Mixed Rendering (Special Cases)
- **Soma**: Uses manual screen transforms for rotation effects
- **PreSpawnIndicator**: Uses camera-aware screen coordinates for triangle drawing
- **FloatingText**: Pure world coordinates, camera handles positioning

## Canvas & Viewport Management

### Fixed Layout Strategy
- **Non-Responsive**: Prevents DevTools layout shifts and maintains consistent experience
- **CSS Variables**: `--canvas-width: 1200px`, `--canvas-height: 900px`
- **Centered Layout**: Game container centered in viewport with fixed dimensions

### HTML/CSS UI Overlay
- **Wave Timer**: HTML positioned at top-center, outside canvas rendering
- **HUD Elements**: HTML overlays for health, XP, stats (not canvas-rendered)
- **Menu Screens**: HTML-based pause, level up, shop interfaces

---

# UI Systems

## Unified UI Architecture

### UIScreen Management
```typescript
enum UIScreen {
  PAUSE = 'pause',
  LEVELUP = 'levelup',
  SHOP = 'shop'
}
```

### HTML Overlay Strategy
- Game canvas renders independently of UI
- HTML overlays positioned absolutely over canvas
- Phase-specific UI displays with callback patterns
- `UnifiedUI` class manages all screen transitions

### Callback Pattern
```typescript
// Game.ts registers callbacks with UI
this.ui.onLevelUpSelection = (statBonus) => this.onLevelUpSelection(statBonus)
this.ui.onGoWave = () => this.onGoWaveClicked()
this.ui.onResume = () => this.onPauseToggle()
```

## HUD System

### Real-time Display Elements
- **Health Bar**: Current HP / Max HP with visual bar
- **Wave Timer**: Countdown timer with wave number (HTML overlay)
- **Stats Display**: Key stats during gameplay
- **XP/Level Info**: Current level and experience

### Update Pattern
```typescript
// HUD updates every frame during wave phase
this.hud.update(this.player)
this.updateWaveTimerDisplay() // Updates HTML element
this.ui.updateStats(this.player)
```

---

# Body Parts & Equipment

## Body Part System

### CSV Data Structure
```csv
id,displayName,type,imgFileName,scale,maxHP,hpRegen,moveSpeed,attack,armor,critChance,luck
turtletorso,Turtle Shell,torso,turtle-shell.png,1.5,15,0,0,0,5,0,0
froghead,Frog Head,head,frog-head.png,1.0,0,0,0,0,0,0,0
```

### Key Design Principles
- **Scale Column Before Stats**: Keeps all stat columns contiguous for parsing
- **Semantic Access**: Use `row['columnName']` instead of array indices
- **maxHP vs hp**: Body parts affect maximum potential, not current state
- **Native Resolution Scaling**: `sprite.naturalWidth * scale` preserves asset quality

### Stat Integration
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

## Equipment Integration

### Current Implementation
- Player has `body: BodyPart[]` array representing equipped parts
- `stats.recalculateStats(bodyParts)` updates gear bonuses
- Visual representation through sprite scaling and positioning

### Default Configuration
- **Default Torso**: Turtle shell (150% scale, +15 maxHP, +5 armor)
- **Default Head**: Frog head (100% scale, no stat bonuses)
- More body parts defined in `/data/bodyparts.csv`

---

# Data Management

## CSV Data Structure

### File Organization in `/data/` folder
- `bodyparts.csv` - All body part definitions with stats and scaling
- `enemies.csv` - Enemy types and properties (future)
- `xptable.csv` - Experience requirements per level (future)
- `waves.csv` - Wave configuration data (future)

### Body Parts CSV Structure
```csv
id,displayName,type,imgFileName,scale,maxHP,hpRegen,moveSpeed,attack,armor,critChance,luck
```

### Design Rationale
- **Scale before stats**: Keeps stat columns contiguous for parsing
- **Semantic access**: `row['scale']` instead of `row[4]` for maintainability
- **maxHP naming**: Clear distinction from current HP
- **Extensible**: Easy to add new stats without breaking existing parsing

---

# Debug & Development Tools

## Debug UI System

### External HTML Panel
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

### Debug Controls
- **`debug.showBounds`** - Show collision boundaries and coordinate grid
- **`debug.playerBreathe`** - Toggle player breathing animation (for testing camera issues)

### Real-time Toggle Controls
- **Show Bounds**: Checkbox to display collision boundaries
- **Player Breathe**: Checkbox to enable/disable breathing animation
- **Extensible**: Easy to add more debug options (spawn rates, stats, etc.)
- **State Management**: Singleton `DebugSystem` class manages all debug state

## Debug Visualization System

### Debug Grid
- Visualizes world coordinate system with 100-unit grid squares
- Red boundary shows 1200x900 game world limits
- Grid labels show coordinate positions for debugging
- Renders beneath all game objects for reference

### Bounds Display
- **Cyan**: Entity collision boundaries (hitboxes)
- **Pink**: Body part attachment points and positions
- **Green**: Pickup and interaction radius circles
- **Yellow**: Spawn indicators and timing displays

### Coordinate System Debugging
```typescript
// Debug grid helps visualize camera transforms
drawDebugGrid() {
  // Grid lines every 100 world units
  // Labels show world coordinates
  // Red boundary marks game world edges (0,0 to 1200,900)
}
```

### Camera Jerk Debugging
- **Symptom**: Visual "snap" or jerk when starting/stopping movement
- **Cause**: Camera updating before player position in game loop (1-frame lag)
- **Solution**: Update player first, then camera in same frame
- **Debug Method**: Log player position changes to identify frame timing issues

---

# Architecture Decisions

## Three-Layer Stats System
- **Why**: Simple mental model, easy debugging, performance-friendly caching
- **Alternative Rejected**: Complex stat managers with event systems
- **Benefits**: Clear separation of stat sources, predictable recalculation

## HP vs MaxHP Separation
- **Why**: Body parts affect potential, not current state; prevents free healing mid-wave
- **Implementation**: `recalculateStats()` updates totals, `heal()` manages current HP separately
- **Player Experience**: Stat changes don't automatically heal, maintaining challenge

## Camera System Architecture
- **Why**: Clean separation between game logic and rendering, consistent 1.5x zoom for personality
- **Alternative Rejected**: Manual worldScale multiplication throughout codebase
- **Benefits**: Pure world coordinates, single transform point, easy zoom control

## Bottom-Up Player Breathing
- **Why**: Natural grounded character animation, feet stay planted
- **Implementation**: Canvas transform origin at player bottom, unified assembly breathing
- **Player Experience**: Character feels grounded and alive, not floating

## Pure World Coordinates
- **Why**: Eliminates coordinate transformation bugs, clean entity code
- **Alternative Rejected**: Mixed coordinate systems per entity
- **Benefits**: Consistent rendering, easier debugging, camera system flexibility

## Game Loop Update Order
- **Why**: Camera must update AFTER player position changes to prevent 1-frame lag jerk
- **Critical Order**: Player updates → Camera updates (not camera first)
- **Problem Avoided**: Visual "jerk" effect when starting/stopping movement due to camera lag

## External Debug UI
- **Why**: Doesn't interfere with game rendering, easy to style and interact with
- **Alternative Rejected**: Canvas-based debug overlay
- **Benefits**: Can use HTML form elements, doesn't affect game performance

## CSV-Driven Sprite Scaling
- **Why**: Preserves original asset quality, easy content iteration
- **Alternative Rejected**: Fixed 30px sprites for all entities
- **Benefits**: Artists can create optimal resolution assets, designers can tweak scale data-side

## Wave Cleanup System
- **Why**: Prevents state leakage, ensures consistent starting conditions
- **Implementation**: Single `cleanup()` method resets everything at wave end
- **Benefits**: Easier debugging, no weird cross-wave interactions

---

# Development Guidelines

## System Analysis Protocol

### Key Systems to Always Examine Before Implementation
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

## Code Conventions & Patterns

### TypeScript Standards
- **Variables/Functions**: `camelCase` (playerHealth, moveSpeed, getCurrentHP)
- **Classes**: `PascalCase` (Player, Enemy, SpawnManager)
- **Constants**: `SCREAMING_SNAKE_CASE` (BASE_MOVE_SPEED, BASE_MAX_HP)
- **Files**: `PascalCase.ts` for classes, `camelCase.ts` for utilities

### Table of Contents Adherence
- **ALWAYS respect existing table of contents** in TypeScript files when they exist
- Before adding new methods/sections, check the table of contents structure
- Place new code in the appropriate existing section that matches its purpose
- If reorganization is needed, **consult with the user first** before moving sections
- Table of contents and actual code sections must always match up
- Examples:
  - Rendering methods belong in section 3. RENDERING
  - Combat methods belong in section 4. COMBAT & DAMAGE
  - Utility methods belong in section 7. UTILITY METHODS
- Never create arbitrary new sections like "6.5" - use existing sections or ask to reorganize

### CSV File Policy
- **NEVER modify CSV files without explicit developer permission**
- CSV files are configuration data, not runtime data
- bodyparts.csv, stats.csv, etc. define system structure only
- All gameplay changes happen through the code layer, not data files

---

# Current Status

## Working Systems
- ✅ Core game loop with three phases
- ✅ Camera system with smooth 1.5x zoom (no jerk)
- ✅ Unified grounded breathing for player and enemies
- ✅ Enemy spawning and AI with pre-spawn indicators
- ✅ Combat system with projectiles and critical hits
- ✅ Three-layer stats system with CSV integration
- ✅ Body parts system with visual scaling and stat bonuses
- ✅ Wave progression with comprehensive cleanup
- ✅ Debug visualization with bounds and coordinate grid
- ✅ HTML/CSS UI overlay system with wave timer

## Next Priorities
1. Expand body part selection in shop phase
2. Implement transformation preview system
3. Add more enemy types and behaviors
4. Visual polish and particle effects

## Development Commands
- **Testing**: Launch `npm run dev` and view at localhost (port will be displayed)
- **Building**: Standard npm build process through Vite
- **Linting**: Check for lint/typecheck commands in package.json

---

This guide preserves all architectural decisions, implementation details, and development context needed to continue work on Echoes even with a completely fresh context window.