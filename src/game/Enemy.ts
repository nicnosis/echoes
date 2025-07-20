import { Renderer } from '../render/Renderer'
import { Player } from './Player'

export class Enemy {
  public x: number
  public y: number
  public radius: number = 12
  public speed: number = 100
  public health: number = 15
  public maxHealth: number = 15
  private color: string

  constructor(x: number, y: number) {
    this.x = x
    this.y = y
    this.color = this.generateRandomRedColor()
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

    const dx = player.x - this.x
    const dy = player.y - this.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    // Move towards player
    if (distance > 0) {
      const moveX = (dx / distance) * this.speed * dt
      const moveY = (dy / distance) * this.speed * dt
      
      this.x += moveX
      this.y += moveY
    }

    // Check collision with player
    this.checkPlayerCollision(player)
  }

  private checkPlayerCollision(player: Player) {
    const dx = this.x - player.x
    const dy = this.y - player.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    if (distance < this.radius + player.radius) {
      player.takeDamage(1)
    }
  }

  render(renderer: Renderer) {
    renderer.drawCircle(this.x, this.y, this.radius, this.color)
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
    this.health -= damage
    return this.health <= 0
  }
}