import { Renderer } from '../render/Renderer'
import { Player } from './Player'

export class PreSpawnIndicator {
    private static readonly SPAWN_DURATION = 1500 // 1500ms countdown
    private static readonly PULSE_SPEED = 0.008 // Fast sine wave speed (higher = faster)

    public x: number
    public y: number
    public timer: number = PreSpawnIndicator.SPAWN_DURATION
    public pulseTimer: number = 0
    public isActive: boolean = true
    public size: number = 24 // Same as enemy side length (radius * 2)

    constructor(x: number, y: number) {
        this.x = x
        this.y = y
        this.timer = PreSpawnIndicator.SPAWN_DURATION
        this.pulseTimer = 0
        this.isActive = true
    }

    update(deltaTime: number, player: Player): { shouldSpawn: boolean, blocked: boolean, x: number, y: number } {
        if (!this.isActive) return { shouldSpawn: false, blocked: false, x: this.x, y: this.y }

        this.timer -= deltaTime
        this.pulseTimer += deltaTime

        // Check if timer expired
        if (this.timer <= 0) {
            // Check collision with player
            const dx = this.x - player.x
            const dy = this.y - player.y
            const distance = Math.sqrt(dx * dx + dy * dy)
            const collisionDistance = this.size / 2 + Math.min(player.width, player.height) / 2

            if (distance < collisionDistance) {
                // Player is in collision, reset and move
                const oldX = this.x
                const oldY = this.y
                this.resetAndMove(player)
                return { shouldSpawn: false, blocked: true, x: oldX, y: oldY }
            } else {
                // No collision, spawn enemy
                this.isActive = false
                return { shouldSpawn: true, blocked: false, x: this.x, y: this.y }
            }
        }

        return { shouldSpawn: false, blocked: false, x: this.x, y: this.y }
    }

    private resetAndMove(player: Player) {
        this.timer = PreSpawnIndicator.SPAWN_DURATION
        this.pulseTimer = 0

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

        // Sine wave pulse effect
        const sineValue = Math.sin(this.pulseTimer * PreSpawnIndicator.PULSE_SPEED)
        const normalizedSine = (sineValue + 1) / 2 // Convert from [-1,1] to [0,1]
        
        // Pulse size: 75% to 100% (0.75 to 1.0) - more dramatic
        const sizeMultiplier = 0.80 + (normalizedSine * 0.20)
        const currentSize = this.size * sizeMultiplier
        
        // Pulse opacity: 50% to 100% (0.5 to 1.0) - more dramatic
        const opacity = 0.5 + (normalizedSine * 0.5)

        // Draw equilateral triangle outline with pulsing size
        const height = currentSize * Math.sqrt(3) / 2
        const halfSize = currentSize / 2

        const ctx = (renderer as any).ctx
        ctx.save()
        ctx.strokeStyle = `rgba(255, 255, 0, ${opacity})` // Yellow with pulsing opacity
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