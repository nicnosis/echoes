import { Renderer } from '../render/Renderer'

export class DamageNumber {
  public x: number
  public y: number
  public damage: number
  public color: string
  public timer: number = 0
  public duration: number = 1000
  public velocityY: number = -50

  constructor(x: number, y: number, damage: number, color: string = '#ffff00') {
    this.x = x
    this.y = y
    this.damage = damage
    this.color = color
  }

  update(deltaTime: number): boolean {
    this.timer += deltaTime
    this.y += this.velocityY * (deltaTime / 1000)
    
    return this.timer < this.duration
  }

  render(renderer: Renderer) {
    const alpha = Math.max(0, 1 - (this.timer / this.duration))
    const fontSize = 16 + (1 - alpha) * 4
    
    renderer.drawText(
      this.damage.toString(),
      this.x,
      this.y,
      `rgba(255, 255, 0, ${alpha})`,
      `${fontSize}px Arial`
    )
  }
}

export class XPCrystal {
  public x: number
  public y: number
  public size: number = 4
  public xpValue: number = 1
  public color: string = '#ff00ff'
  public velocityX: number
  public velocityY: number
  public friction: number = 0.95

  constructor(x: number, y: number) {
    this.x = x
    this.y = y
    
    // Random initial velocity
    const angle = Math.random() * Math.PI * 2
    const speed = 50 + Math.random() * 50
    this.velocityX = Math.cos(angle) * speed
    this.velocityY = Math.sin(angle) * speed
  }

  update(deltaTime: number, playerX?: number, playerY?: number, attractionRadius?: number) {
    const dt = deltaTime / 1000
    
    // Check if player position is provided and crystal is within attraction radius
    if (playerX !== undefined && playerY !== undefined && attractionRadius !== undefined) {
      const dx = playerX - this.x
      const dy = playerY - this.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      if (distance <= attractionRadius && distance > 0) {
        // Apply strong attraction force towards player
        const attractionForce = 300 // Attraction strength
        const dirX = dx / distance
        const dirY = dy / distance
        
        this.velocityX = dirX * attractionForce
        this.velocityY = dirY * attractionForce
      } else {
        // Apply friction when not in attraction range
        this.velocityX *= this.friction
        this.velocityY *= this.friction
      }
    } else {
      // Apply friction when no player data provided
      this.velocityX *= this.friction
      this.velocityY *= this.friction
    }
    
    // Apply movement
    this.x += this.velocityX * dt
    this.y += this.velocityY * dt
  }

  render(renderer: Renderer) {
    renderer.drawRect(
      this.x - this.size / 2,
      this.y - this.size / 2,
      this.size,
      this.size,
      this.color
    )
  }

  getBounds() {
    return {
      x: this.x - this.size / 2,
      y: this.y - this.size / 2,
      width: this.size,
      height: this.size
    }
  }
}