# Echoes - Transformation Roguelike Development Guide

## Project Overview
Echoes is a 2D top-down transformation roguelike built with TypeScript and HTML5 Canvas, packaged as a desktop application using Tauri. The game explores themes of personal transformation through the metaphor of chimeras - hybrid creatures that evolve by acquiring body parts from different animals. Players fight through 21 waves (3 episodes of 7 waves each), transforming their character through meaningful choices that affect both gameplay mechanics and personal identity.

**Core Theme**: Personal transformation through adversity and adaptation
**Target Experience**: Each body part acquisition represents fundamental identity change, not just stat upgrades

## Technology Stack
- **Frontend**: TypeScript, HTML5 Canvas (game world), HTML/CSS (UI overlays)
- **Desktop**: Tauri (Rust backend)
- **Build Tool**: Vite
- **Package Manager**: npm
- **Rendering**: Hybrid approach - Canvas for game world, HTML/CSS for UI

## Game Design & Mechanics

### Wave Structure & Progression
- **Total Waves**: 21 waves organized as 3 episodes of 7 waves each
- **Episode Themes**: Each episode introduces new transformation possibilities
- **Difficulty Scaling**: Enemy count, health, and aggression increase per wave
- **Boss Waves**: Every 7th wave (waves 7, 14, 21) feature special transformation challenges
- **Wave Timer**: Each wave has time limits to maintain pacing

### Transformation System (Core Differentiator)
- **Body Parts**: Head, body, arms, legs, tail (for now)
- **Animal Types**: Bird, frog, cat (to start with)


### Player Progression & Stats
- **Layered Stat System**: Base stats + level bonuses + equipment bonuses = final stats
- **Core Stats**: maxHP, moveSpeed, attack, armor, critChance
- **Stat Calculation**: Performance-optimized caching with recalculation only on changes
- **XP Sources**: Enemy kills, gold pickups, transformation milestones
- **Leveling**: Choose from 4 random stat upgrades with reroll option.

### Shop System (Transformation Marketplace)
<!-- - **Body Part Acquisition**: Replace traditional item shop with transformation choices -->
- **Compatibility Preview**: Visual and mechanical preview of how new parts integrate
- **Lock/Reroll Mechanics**: Strategic choice preservation and exploration
<!-- - **Evolution Advisor**: AI-driven suggestions based on current build and upcoming challenges -->

## Architecture Patterns

### Game State Management
```typescript
class Game {
  private canvas: HTMLCanvasElement
  private renderer: Renderer
  private inputManager: InputManager
  private running: boolean = false
  private lastTime: number = 0
  
  // Core game entities
  private player: Player
  private enemies: Enemy[] = []
  private damageNumbers: DamageNumber[] = []
  private somaList: Soma[] = []
  
  // Game state
  private pauseScreen: PauseScreen
  private spawnManager: SpawnManager
  private lastPlayerLevel: number
  private waveIndex: number = 0
  private waveTimer: number = 0
  private waveData: WaveConfig[]
}
```

### Player Architecture (Layered Stats System)
```typescript
class Player {
  // Base character stats (never change)
  private baseStats = {
    moveSpeed: BASE_MOVE_SPEED,
    maxHP: BASE_MAX_HP,
    attack: BASE_ATTACK,
    armor: BASE_ARMOR,
    critChance: BASE_CRIT
  }
  
  // Permanent gains from leveling up
  private levelStats = {
    moveSpeed: 0,
    maxHP: 0,
    attack: 0,
    armor: 0,
    critChance: 0
  }
  
  // Cached equipment bonuses (recalculated only when equipment changes)
  private equipmentStats = {
    moveSpeed: 0,
    maxHP: 0,
    attack: 0,
    armor: 0,
    critChance: 0
  }
  
  // Final cached values (recalculated only when any source changes)
  public totalStats = {
    moveSpeed: BASE_MOVE_SPEED,
    maxHP: BASE_MAX_HP,
    attack: BASE_ATTACK,
    armor: BASE_ARMOR,
    critChance: BASE_CRIT
  }
  
  // Only recalculate when something changes, NOT every frame
  private recalculateStats() {
    this.totalStats.moveSpeed = this.baseStats.moveSpeed + 
                                 this.levelStats.moveSpeed + 
                                 this.equipmentStats.moveSpeed;
    // ... other stats
  }
}
```

### Entity System
- **Composition-based design** for game objects (Player, Enemy, Projectile)
- **Object pooling** for performance optimization (projectiles, damage numbers)
- **Event-driven architecture** for game events and transformations
- **Common interfaces** for consistent entity behavior

### Rendering Architecture
- **Hybrid Rendering**: Canvas for game world, HTML/CSS for UI overlays
- **Separation of concerns**: Game logic separate from rendering logic
- **Performance optimization**: Viewport culling, sprite atlases, batched operations
- **UI Layering**: Game canvas + HTML overlay for menus and HUD

## Visual Design Philosophy

### Flat/Minimal Interface Design
- **Design Language**: Flat design with minimal visual noise and clean geometry
- **Shape Language**: Square corners, geometric forms, no unnecessary decoration
- **Border Strategy**: Little to no outlines or borders - rely on color and spacing
- **Color Palette**: High contrast with purposeful color usage
  - **Primary**: Gold (#ffd700) for important values and highlights
  - **Background**: Dark grays (#222, #333, #444) for depth hierarchy
  - **Text**: White (#fff) for primary text, gray (#888) for secondary
  - **Borders**: Subtle when necessary (#555, #666)

### UI Component Guidelines
- **Buttons**: Flat rectangles with subtle hover states, no borders
- **Panels**: Clean backgrounds with minimal decoration
- **Icons**: Simple geometric representations of concepts
- **Feedback**: Color changes and animation over decorative elements
- **Layout**: Consistent spacing (10px, 20px multiples), clear visual hierarchy

### Pause Menu Structure
- **Left 2/3**: Inventory and transformation display
- **Right 1/3**: Player statistics and current chimera state
- **Bottom**: Action buttons (Resume, Quit, Settings)
- **Overlay**: Semi-transparent background (rgba(0, 0, 0, 0.7))

## Code Organization & Structure

### Project Structure
```
echoes/
├── src/
│   ├── game/           # Core game logic and entities
│   │   ├── Player.ts   # Player stats, movement, transformation state
│   │   ├── Game.ts     # Main game loop and state management
│   │   ├── Enemy.ts    # Enemy AI and behavior
│   │   ├── Weapon.ts   # Weapon systems and projectiles
│   │   └── SpawnManager.ts # Wave spawning and difficulty
│   ├── input/          # Input handling and management
│   ├── render/         # Canvas rendering and graphics
│   ├── ui/             # HTML/CSS UI components and overlays
│   └── utils/          # Utility functions and helpers
├── src-tauri/          # Tauri desktop app configuration
└── examples/           # Reference materials and assets
```

### Coding Conventions

#### TypeScript Standards
- **Strict mode** configuration with proper type safety
- **Interfaces over types** for object contracts
- **Descriptive naming**: `playerHealth` not `hp`, `totalMoveSpeed` not `speed`
- **Consistent casing**: camelCase for variables/functions, PascalCase for classes

#### Naming Conventions for Stats
- **Constants**: `BASE_MOVE_SPEED`, `BASE_MAX_HP` (screaming snake case)
- **Base values**: `baseStats.moveSpeed` (camelCase in objects)
- **Bonus values**: `levelStats.moveSpeed`, `equipmentStats.moveSpeed`
- **Final values**: `totalStats.moveSpeed` (calculated properties)

#### Performance Patterns
- **Cached calculations**: Only recalculate stats when sources change
- **Object pooling**: For projectiles, damage numbers, particles
- **Efficient collision**: Spatial partitioning for large entity counts
- **Minimal DOM manipulation**: Batch UI updates, avoid per-frame changes

## Development Workflow & Patterns

### Game Loop Optimization
- **requestAnimationFrame** for smooth 60fps gameplay
- **Delta time** for frame-rate independent movement
- **Separate update/render cycles** for clean architecture
- **Performance monitoring** during development

### Entity Management Patterns
```typescript
// Example pattern for game entities
interface GameEntity {
  update(deltaTime: number): void
  render(renderer: Renderer): void
  destroy(): void
}

// Object pooling for performance
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

### Adding New Features
- **Transformations**: Extend body part system in transformation module
- **Enemies**: Create new enemy types with unique behaviors
- **UI Components**: Add to HTML/CSS overlay system
- **Game Mechanics**: Implement in appropriate game logic files

## AI Tool Integration Strategy

### Tool Responsibilities
- **Cursor**: Daily coding, implementation, real-time debugging, syntax help
- **Claude Code**: Architecture review, complex algorithms, performance optimization, testing strategies
- **Manus**: Creative direction, game design decisions, transformation mechanics, project vision

### Development Workflow
1. **Daily Development**: Use Cursor for implementation and immediate problem-solving
2. **Weekly Reviews**: Claude Code for architecture health checks and optimization
3. **Creative Decisions**: Manus for design direction and transformation system evolution
4. **Problem Escalation**: Syntax → Cursor, Technical → Claude Code, Design → Manus

## Performance Considerations

### Game Loop Optimization
- **Limit active entities**: Cap projectiles, enemies, effects
- **Efficient collision detection**: Spatial partitioning, broad-phase culling
- **Minimal garbage collection**: Object pooling, reuse patterns
- **Viewport culling**: Only render visible entities

### Memory Management
- **Proper cleanup**: Remove event listeners, clear references
- **Object pooling**: For frequently created/destroyed objects
- **Texture management**: Efficient sprite atlases and caching
- **State management**: Clean separation of concerns

### Rendering Performance
- **Batch operations**: Group similar rendering calls
- **Canvas optimization**: Minimize state changes, use efficient drawing methods
- **UI separation**: HTML/CSS overlays don't impact game rendering performance
- **Asset loading**: Preload critical assets, lazy load others

## Future Development Considerations

### Transformation System Expansion
- **Additional animal types**: Reptilian (scales, cold-blood), Aquatic (gills, fins)
- **Advanced synergies**: Multi-part combinations with emergent behaviors
- **Evolution trees**: Branching paths based on transformation history
- **Identity crisis mechanics**: Handling conflicting transformation choices

### Platform Scalability
- **Tauri optimization**: Desktop-specific features and performance
- **Web deployment**: Potential browser version with responsive design
- **Cross-platform**: Consistent experience across different environments
- **Save system**: Cloud sync for transformation progress

### Community Features
- **Chimera sharing**: Gallery of unique player transformations
- **Challenge modes**: Specific transformation constraints
- **Leaderboards**: Based on transformation creativity and effectiveness
- **Developer insights**: Commentary on transformation design philosophy

## Known Patterns & Current Implementation

### Current Game State
- ✅ **Basic game loop**: Player movement, enemy spawning, combat
- ✅ **Wave system**: Progressive difficulty with spawn management
- ✅ **Pause functionality**: HTML/CSS overlay system working
- ✅ **Stat system**: Layered architecture with performance caching
- ✅ **Weapon system**: Projectile-based combat with damage numbers
- 🚧 **UI polish**: Transitioning from placeholders to final design
- 📋 **Transformation system**: Core mechanics planned, implementation pending
- 📋 **Shop system**: Will become transformation marketplace

### Immediate Development Priorities
1. **Camera/viewport system**: Scalable rendering for different screen sizes
2. **Shop interface**: Transform into body part marketplace
3. **Transformation preview**: Visual system for chimera combinations
4. **Classical music integration**: Adaptive audio system
5. **Save/load system**: Persistent transformation progress

### Don't Suggest
- **Unity migration**: Committed to web technologies and current architecture
- **Complex frameworks**: Keep implementation simple and maintainable
- **Premature optimization**: Focus on core mechanics first
- **Breaking changes**: Preserve working systems while adding features

---

*This guide should be updated as the transformation system evolves and new patterns emerge. The focus remains on creating meaningful transformation experiences that resonate both mechanically and emotionally.*

