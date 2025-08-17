# Camera System Implementation Guide

## Overview

This document explains how to implement a proper camera/viewport system for FARSiDE SPiRITS to enable zooming and scalable rendering without the messy "multiply everything by worldScale" approach.

## Current State Analysis

**Current Implementation:**
- Game objects use pixel coordinates directly (player.x, player.y)
- Canvas is fixed 800x600 size
- Renderer draws objects at their exact pixel positions
- No camera or viewport system

**Problems with worldScale Approach:**
- Requires multiplying every coordinate by scale factor
- Messy code with scale calculations everywhere
- Hard to maintain and debug
- Couples rendering logic with game logic

## Proposed Solution: Camera Transform System

### Core Concept

Instead of scaling coordinates everywhere, we:
1. Keep game objects in **world coordinates** (unchanged)
2. Add a **camera** that defines view position and zoom
3. Transform coordinates **only in the renderer**
4. Clean separation between game logic and rendering

### Architecture Components

#### 1. Camera Object
```typescript
interface Camera {
  x: number        // Camera center position in world coordinates
  y: number        // Camera center position in world coordinates  
  zoom: number     // Current zoom level (1.0 = normal, 2.0 = 2x bigger)
  targetZoom: number // Target zoom for smooth transitions
}
```

#### 2. Coordinate Transformation
```typescript
// Convert world coordinates to screen pixels
function worldToScreen(worldX: number, worldY: number, camera: Camera): {x: number, y: number} {
  return {
    x: (worldX - camera.x) * camera.zoom + canvas.width / 2,
    y: (worldY - camera.y) * camera.zoom + canvas.height / 2
  }
}
```

#### 3. Rendering Pipeline
```
Game Objects (world coords) → Camera Transform → Screen Coordinates → Canvas Drawing
```

## Implementation Steps

### Step 1: Add Camera to Game.ts

```typescript
export class Game {
  // Add camera property
  private camera = {
    x: 0,
    y: 0, 
    zoom: 2.0,        // Start with 2x zoom for more personality
    targetZoom: 2.0
  }

  // Add camera update to main game loop
  private updateCamera(deltaTime: number): void {
    const followSpeed = 5.0 * deltaTime
    
    // Smooth camera follow player
    this.camera.x += (this.player.x - this.camera.x) * followSpeed
    this.camera.y += (this.player.y - this.camera.y) * followSpeed
    
    // Smooth zoom transitions
    this.camera.zoom += (this.camera.targetZoom - this.camera.zoom) * followSpeed
  }

  // Call updateCamera in main update loop
  update(deltaTime: number): void {
    // ... existing update logic ...
    this.updateCamera(deltaTime)
  }
}
```

### Step 2: Add Transform Methods to Renderer.ts

```typescript
export class Renderer {
  // Add coordinate transformation method
  worldToScreen(worldX: number, worldY: number, camera: any): {x: number, y: number} {
    return {
      x: (worldX - camera.x) * camera.zoom + this.canvas.width / 2,
      y: (worldY - camera.y) * camera.zoom + this.canvas.height / 2
    }
  }

  // Modified drawRect that accepts camera
  drawRectWorld(worldX: number, worldY: number, width: number, height: number, 
                color: string, camera: any): void {
    const screen = this.worldToScreen(worldX, worldY, camera)
    const scaledWidth = width * camera.zoom
    const scaledHeight = height * camera.zoom
    
    this.ctx.fillStyle = color
    this.ctx.fillRect(
      screen.x - scaledWidth/2, 
      screen.y - scaledHeight/2, 
      scaledWidth, 
      scaledHeight
    )
  }

  // Modified drawCircle that accepts camera
  drawCircleWorld(worldX: number, worldY: number, radius: number, 
                  color: string, camera: any): void {
    const screen = this.worldToScreen(worldX, worldY, camera)
    const scaledRadius = radius * camera.zoom
    
    this.ctx.fillStyle = color
    this.ctx.beginPath()
    this.ctx.arc(screen.x, screen.y, scaledRadius, 0, Math.PI * 2)
    this.ctx.fill()
  }
}
```

### Step 3: Update Game Rendering

```typescript
// In Game.ts render method
private render(): void {
  this.renderer.clear()
  
  // Draw player with camera transform
  this.renderer.drawRectWorld(
    this.player.x, this.player.y,
    this.player.width, this.player.height,
    '#4CAF50',
    this.camera
  )
  
  // Draw enemies with camera transform
  this.enemies.forEach(enemy => {
    this.renderer.drawRectWorld(
      enemy.x, enemy.y,
      enemy.width, enemy.height, 
      '#F44336',
      this.camera
    )
  })
  
  // Draw projectiles with camera transform
  this.player.projectiles.forEach(projectile => {
    this.renderer.drawCircleWorld(
      projectile.x, projectile.y,
      projectile.radius,
      '#FFD700',
      this.camera
    )
  })
  
  this.renderer.present()
}
```

### Step 4: Add Responsive Canvas Support

```typescript
// In Game.ts constructor or resize handler
private setupResponsiveCanvas(): void {
  const resizeCanvas = () => {
    const container = this.canvas.parentElement!
    const maxWidth = 1200
    const maxHeight = 900
    
    this.canvas.width = Math.min(container.clientWidth, maxWidth)
    this.canvas.height = Math.min(container.clientHeight, maxHeight)
  }
  
  window.addEventListener('resize', resizeCanvas)
  resizeCanvas() // Initial setup
}
```

## Key Benefits

### 1. Clean Code Separation
- **Game logic**: Uses world coordinates, no rendering concerns
- **Rendering**: Handles all coordinate transformation
- **Camera**: Manages view state independently

### 2. Easy Zoom Control
```typescript
// Zoom in for close-up action
this.camera.targetZoom = 4.0

// Zoom out for tactical overview  
this.camera.targetZoom = 1.0

// Normal view
this.camera.targetZoom = 2.0
```

### 3. Flexible Viewport
- Supports any canvas size (800x600 to 1200x900+)
- Maintains aspect ratio
- Smooth camera movement and zoom transitions

### 4. Future-Proof
- Easy to add camera shake effects
- Simple to implement screen boundaries
- Ready for minimap or multiple viewports

## Migration Strategy

### Phase 1: Foundation
1. Add camera object to Game.ts
2. Add worldToScreen method to Renderer.ts
3. Test with one object (player) to verify transform works

### Phase 2: Full Migration  
4. Update all render calls to use camera-aware methods
5. Remove any existing scaling code
6. Test all game objects render correctly

### Phase 3: Enhancement
7. Add responsive canvas sizing
8. Implement smooth zoom controls
9. Add camera bounds/limits if needed

## Important Notes

### DO NOT:
- ❌ Multiply coordinates by scale factors in game logic
- ❌ Modify Player.x, Enemy.x etc. for rendering
- ❌ Add worldScale parameters everywhere

### DO:
- ✅ Keep game objects in world coordinates
- ✅ Transform coordinates only in renderer
- ✅ Pass camera to rendering methods
- ✅ Use smooth interpolation for camera movement

## Testing Checklist

- [ ] Player renders at correct position with camera
- [ ] Enemies render correctly with zoom
- [ ] Camera follows player smoothly
- [ ] Zoom transitions work without jitter
- [ ] Canvas resizing maintains proper aspect ratio
- [ ] All game objects scale consistently

## Expected Results

After implementation:
- **2x zoom**: Player and enemies appear twice as big, more personality visible
- **Scalable viewport**: Game works from 800x600 up to 1200x900+
- **Smooth camera**: Follows player with natural movement
- **Clean codebase**: No scale multiplication scattered throughout code

This approach provides the zoomed-in personality you want while maintaining clean, maintainable code architecture.

