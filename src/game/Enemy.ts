import { Renderer } from '../render/Renderer'
import { Player } from './Player'

// Base speed constant for reference (same as Player)
const BASE_MOVE_SPEED = 100

export class Enemy {
  public x: number
  public y: number
  public radius: number = 12
  public moveSpeed: number = BASE_MOVE_SPEED * 0.8 // Enemies are slightly slower than player
  public health: number = 3
  public maxHealth: number = 15
  private color: string
  private dying: boolean = false
  private deathTimer: number = 0
  private deathDuration: number = 400 // 500ms death animation
  private originalRadius: number = 12
  private originalColor: string

  constructor(x: number, y: number) {
    this.x = x
    this.y = y
    this.color = this.generateRandomRedColor()
    this.originalColor = this.color
    this.originalRadius = this.radius
  }

  private generateRandomRedColor(): string {
    const hueVariation = Math.random() * 60 - 30
    const baseHue = 0 + hueVariation
    const normalizedHue = ((baseHue % 360) + 360) % 360
    
    const saturation = 80 + Math.random() * 20
    const lightness = 40 + Math.random() * 20
    
    return `hsla(${normalizedHue}, ${saturation}%, ${lightness}%, 0.85)`
  }

  update(deltaTime: number, player: Player) {
    const dt = deltaTime / 1000

    if (this.dying) {
      // Update death animation
      this.deathTimer += deltaTime
      const progress = this.deathTimer / this.deathDuration
      
      // Shrink radius
      this.radius = this.originalRadius * (1 - progress)
      
      // Fade to black
      const colorProgress = Math.min(1, progress)
      const r = Math.floor(255 - 0 * colorProgress) // Red component to black
      const g = Math.floor(0 * colorProgress)   // Green stays 0
      const b = Math.floor(0 * colorProgress)   // Blue stays 0
      this.color = `rgb(${r},${g},${b})`
      
      return // Don't do normal updates while dying
    }

    const dx = player.x - this.x
    const dy = player.y - this.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    // Move towards player
    if (distance > 0) {
      const moveX = (dx / distance) * this.moveSpeed * dt
      const moveY = (dy / distance) * this.moveSpeed * dt
      
      this.x += moveX
      this.y += moveY
    }

    // Check collision with player
    this.checkPlayerCollision(player)
  }

  private checkPlayerCollision(player: Player) {
    if (this.dying) return // Can't damage player while dying
    
    const dx = this.x - player.x
    const dy = this.y - player.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    if (distance < this.radius + player.radius) {
      player.takeDamage(1)
    }
  }

  render(renderer: Renderer) {
    renderer.drawRect(this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2, this.color)
  }

  getBounds() {
    return {
      x: this.x - this.radius,
      y: this.y - this.radius,
      width: this.radius * 2,
      height: this.radius * 2
    }
  }

  takeDamage(damage: number): boolean {
    if (this.dying) return false // Already dying
    
    this.health -= damage
    if (this.health <= 0) {
      this.startDeathAnimation()
      return true
    }
    return false
  }

  private startDeathAnimation() {
    this.dying = true
    this.deathTimer = 0
  }

  public isDying(): boolean {
    return this.dying
  }

  public isDeathAnimationComplete(): boolean {
    return this.dying && this.deathTimer >= this.deathDuration
  }
}