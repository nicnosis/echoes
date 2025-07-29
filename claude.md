# Echoes - Game Development Guide

## Project Overview
Echoes is a 2D top-down shooter game built with TypeScript and HTML5 Canvas, packaged as a desktop application using Tauri. The game features real-time combat, enemy spawning, weapon systems, and a pause menu interface.

## Technology Stack
- **Frontend**: TypeScript, HTML5 Canvas, CSS3
- **Desktop**: Tauri (Rust backend)
- **Build Tool**: Vite
- **Package Manager**: npm

## Project Structure
```
echoes/
├── src/
│   ├── game/           # Core game logic and entities
│   ├── input/          # Input handling and management
│   ├── render/         # Canvas rendering and graphics
│   ├── ui/             # User interface components
│   └── utils/          # Utility functions and helpers
├── src-tauri/          # Tauri desktop app configuration
└── examples/           # Reference materials and assets
```

## Architecture Patterns

### Game Loop
- Uses `requestAnimationFrame` for smooth 60fps gameplay
- Separate update and render cycles
- Frame-rate independent movement using delta time
- Game state management centralized in `Game.ts`

### Entity System
- Composition-based design for game objects
- Common interfaces for game entities (Player, Enemy, Projectile)
- Object pooling for performance optimization
- Event-driven architecture for game events

### Rendering
- Canvas-based rendering in `Renderer.ts`
- Separation of game logic from rendering logic
- Efficient sprite and animation management
- UI rendering separate from game world rendering

## Coding Conventions

### TypeScript
- Use strict mode configuration
- Prefer interfaces over types for object contracts
- Use descriptive variable and function names
- Implement proper type safety for game objects

### Code Organization
- Keep game logic in `src/game/`
- UI components in `src/ui/components/`
- Styles in `src/ui/styles/`
- Input handling in `src/input/`
- Rendering logic in `src/render/`

### Naming Conventions
- Use camelCase for variables and functions
- Use PascalCase for classes and interfaces
- Use descriptive names (e.g., `playerHealth` not `hp`)
- Use consistent prefixes for related functionality

## Game Development Patterns

### Entity Management
```typescript
// Example pattern for game entities
class GameEntity {
  update(deltaTime: number): void {
    // Update logic here
  }
  
  render(renderer: Renderer): void {
    // Render logic here
  }
}
```

### Object Pooling
- Implement for projectiles and enemies
- Reuse objects to avoid garbage collection
- Reset object state when returning to pool

### Collision Detection
- Use spatial partitioning for performance
- Implement efficient collision algorithms
- Separate collision detection from collision response

## UI/UX Design Principles

### Visual Design
- **Theme**: Dark theme with high contrast
- **Primary Color**: Gold (#ffd700) for important values
- **Background**: Dark grays (#222, #333, #444)
- **Borders**: Subtle borders (#555, #666)
- **Text**: White (#fff) for primary text, gray (#888) for secondary

### Layout Guidelines
- Use consistent spacing (10px, 20px multiples)
- Responsive design for different screen sizes
- Clear visual hierarchy with font weights
- Proper contrast ratios for accessibility

### Pause Menu Structure
- **Left 2/3**: Inventory and weapons display
- **Right 1/3**: Player statistics
- **Bottom**: Action buttons (Resume, Quit, etc.)
- **Overlay**: Semi-transparent background (rgba(0, 0, 0, 0.7))

## Performance Considerations

### Game Loop Optimization
- Limit active projectiles and enemies
- Use efficient collision detection algorithms
- Minimize DOM manipulation during game loop
- Implement object pooling for frequently created objects

### Rendering Optimization
- Batch similar rendering operations
- Use efficient sprite atlases
- Implement viewport culling
- Optimize canvas operations

### Memory Management
- Properly dispose of unused objects
- Avoid memory leaks in event listeners
- Use object pooling for frequently allocated objects
- Monitor memory usage in development

## Development Workflow

### Adding New Features
1. **Weapons**: Extend the `Weapon` class
2. **Enemies**: Create new enemy types in `Enemy.ts`
3. **UI Components**: Add to `src/ui/components/`
4. **Game Mechanics**: Implement in appropriate game files

### Testing Guidelines
- Test game balance frequently
- Verify performance on target hardware
- Test UI responsiveness across screen sizes
- Validate collision detection accuracy

### Common Development Tasks
- **Adding Weapons**: Extend `Weapon` class and update weapon selection
- **Enemy Spawning**: Modify `SpawnManager` for new enemy types
- **UI Updates**: Add components to pause menu or HUD
- **Game Balance**: Adjust damage, health, and spawn rates

## Known Patterns and Conventions

### Damage System
- Use `DamageNumber` class for visual feedback
- Implement damage calculation in weapon classes
- Display damage numbers with proper positioning

### Spawning System
- Use `SpawnManager` for enemy spawning
- Implement `PreSpawnIndicator` for visual cues
- Manage spawn timing and difficulty scaling

### Input Handling
- Centralized input management in `InputManager`
- Support for keyboard and mouse input
- Proper input event handling and cleanup

## File-Specific Guidelines

### Game.ts
- Main game loop and state management
- Coordinate between different game systems
- Handle game pause/resume functionality

### Player.ts
- Player movement and health management
- Weapon handling and switching
- Player-specific game mechanics

### Enemy.ts
- Enemy AI and behavior patterns
- Health and damage handling
- Movement and attack patterns

### Weapon.ts
- Weapon-specific logic and behavior
- Projectile creation and management
- Damage calculation and effects

## Future Development Considerations

### Scalability
- Design for easy addition of new content
- Maintainable code structure for team development
- Modular architecture for feature expansion

### Platform Considerations
- Tauri desktop app optimization
- Potential web deployment considerations
- Cross-platform compatibility

### Performance Targets
- Maintain 60fps on target hardware
- Efficient memory usage
- Smooth gameplay experience

## Debugging and Development Tools

### Console Logging
- Use descriptive log messages
- Implement debug modes for development
- Log performance metrics when needed

### Visual Debugging
- Implement debug rendering for collision boxes
- Show performance metrics in development
- Visual indicators for game state

---

*This guide should be updated as the project evolves and new patterns emerge.* 