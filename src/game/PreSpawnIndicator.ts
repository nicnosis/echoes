import { Renderer } from '../render/Renderer'
import { Player } from './Player'

export class PreSpawnIndicator {
  private static readonly SPAWN_DURATION = 1500 // 1500ms countdown
  private static readonly FLASH_INTERVAL = 150 // Flash every 150ms
  
  public x: number
  public y: number
  public timer: number = PreSpawnIndicator.SPAWN_DURATION
  public flashTimer: number = 0
  public isActive: boolean = true
  public size: number = 24 // Same as enemy side length (radius * 2)

  constructor(x: number, y: number) {
    this.x = x
    this.y = y
    this.timer = PreSpawnIndicator.SPAWN_DURATION
    this.flashTimer = 0
    this.isActive = true
  }

  update(deltaTime: number, player: Player): boolean {
    if (!this.isActive) return false

    this.timer -= deltaTime
    this.flashTimer += deltaTime

    // Check if timer expired
    if (this.timer <= 0) {
      // Check collision with player
      const dx = this.x - player.x
      const dy = this.y - player.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      const collisionDistance = this.size / 2 + player.radius

      if (distance < collisionDistance) {
        // Player is in collision, reset and move
        this.resetAndMove(player)
        return false
      } else {
        // No collision, spawn enemy
        this.isActive = false
        return true
      }
    }

    return false
  }

  private resetAndMove(player: Player) {
    this.timer = PreSpawnIndicator.SPAWN_DURATION
    this.flashTimer = 0
    
    // Move to new random location
    const newLocation = this.generateRandomLocation(player)
    this.x = newLocation.x
    this.y = newLocation.y
  }

  private generateRandomLocation(player: Player): { x: number, y: number } {
    // For now, use a simple approach - just move to a random location
    // The SpawnManager will handle proper location generation
    const x = 100 + Math.random() * 600
    const y = 100 + Math.random() * 400
    return { x, y }
  }

  render(renderer: Renderer) {
    if (!this.isActive) return

    // Flash effect - only render when flashTimer is in visible phase
    const flashPhase = Math.floor(this.flashTimer / PreSpawnIndicator.FLASH_INTERVAL) % 2
    if (flashPhase === 0) return // Skip rendering during "off" phase

    // Draw equilateral triangle outline
    const height = this.size * Math.sqrt(3) / 2
    const halfSize = this.size / 2

    const ctx = (renderer as any).ctx
    ctx.save()
    ctx.strokeStyle = '#ffff00' // Yellow
    ctx.lineWidth = 2
    ctx.beginPath()
    
    // Draw triangle: vertex at top, flat side at bottom
    ctx.moveTo(this.x, this.y - height / 2) // Top vertex
    ctx.lineTo(this.x - halfSize, this.y + height / 2) // Bottom left
    ctx.lineTo(this.x + halfSize, this.y + height / 2) // Bottom right
    ctx.closePath()
    ctx.stroke()
    ctx.restore()
  }
} 