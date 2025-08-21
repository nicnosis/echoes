import { Renderer } from '../render/Renderer'
import { Player } from './Player'

export class PreSpawnIndicator {
    private static readonly SPAWN_DURATION = 1500 // 1500ms countdown
    private static readonly PULSE_SPEED = 0.008 // Fast sine wave speed (higher = faster)
    private static readonly FADE_DURATION = 350 // 350ms fade in/out duration

    public x: number
    public y: number
    public timer: number = PreSpawnIndicator.SPAWN_DURATION
    public pulseTimer: number = 0
    public isActive: boolean = true
    public size: number = 24 // Same as enemy side length (radius * 2)
    
    // Fade animation state
    private fadeState: 'fading-in' | 'active' | 'fading-out' = 'fading-in'
    private fadeTimer: number = 0

    constructor(x: number, y: number) {
        this.x = x
        this.y = y
        this.timer = PreSpawnIndicator.SPAWN_DURATION
        this.pulseTimer = 0
        this.isActive = true
        this.fadeState = 'fading-in'
        this.fadeTimer = 0
    }

    update(deltaTime: number, player: Player): { shouldSpawn: boolean, blocked: boolean, x: number, y: number } {
        if (!this.isActive) return { shouldSpawn: false, blocked: false, x: this.x, y: this.y }

        // Update fade animation
        if (this.fadeState === 'fading-in') {
            this.fadeTimer += deltaTime
            if (this.fadeTimer >= PreSpawnIndicator.FADE_DURATION) {
                this.fadeState = 'active'
                this.fadeTimer = PreSpawnIndicator.FADE_DURATION
            }
        } else if (this.fadeState === 'fading-out') {
            this.fadeTimer -= deltaTime
            if (this.fadeTimer <= 0) {
                this.isActive = false
                return { shouldSpawn: true, blocked: false, x: this.x, y: this.y }
            }
        }

        // Only count down timer when fully active
        if (this.fadeState === 'active') {
            this.timer -= deltaTime
            this.pulseTimer += deltaTime
        }

        // Check if timer expired
        if (this.timer <= 0 && this.fadeState === 'active') {
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
                // No collision, start fade out before spawning
                this.fadeState = 'fading-out'
                return { shouldSpawn: false, blocked: false, x: this.x, y: this.y }
            }
        }

        return { shouldSpawn: false, blocked: false, x: this.x, y: this.y }
    }

    private resetAndMove(player: Player) {
        this.timer = PreSpawnIndicator.SPAWN_DURATION
        this.pulseTimer = 0
        this.fadeState = 'fading-in'
        this.fadeTimer = 0

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

        // Calculate fade progress for opacity and scale
        let fadeProgress = 1
        if (this.fadeState === 'fading-in') {
            fadeProgress = Math.min(1, this.fadeTimer / PreSpawnIndicator.FADE_DURATION)
        } else if (this.fadeState === 'fading-out') {
            fadeProgress = Math.max(0, this.fadeTimer / PreSpawnIndicator.FADE_DURATION)
        }

        // Sine wave pulse effect (only when active)
        const sineValue = Math.sin(this.pulseTimer * PreSpawnIndicator.PULSE_SPEED)
        const normalizedSine = (sineValue + 1) / 2 // Convert from [-1,1] to [0,1]
        
        // Pulse size: 75% to 100% (0.75 to 1.0) - more dramatic
        const baseSizeMultiplier = 0.80 + (normalizedSine * 0.20)
        // Apply fade scale effect
        const sizeMultiplier = baseSizeMultiplier * fadeProgress
        const currentSize = this.size * sizeMultiplier
        
        // Pulse opacity: 50% to 100% (0.5 to 1.0) - more dramatic
        const baseOpacity = 0.5 + (normalizedSine * 0.5)
        // Apply fade opacity effect
        const opacity = baseOpacity * fadeProgress

        // Draw equilateral triangle outline with pulsing size and fade effects
        const height = currentSize * Math.sqrt(3) / 2
        const halfSize = currentSize / 2

        // Use camera-aware rendering
        const ctx = renderer.context
        ctx.save()
        
        // Get screen coordinates from camera transform
        const screen = (renderer as any).worldToScreen(this.x, this.y, (renderer as any).cam)
        const scaledSize = currentSize * (renderer as any).cam.zoom
        const scaledHeight = height * (renderer as any).cam.zoom
        const scaledHalfSize = halfSize * (renderer as any).cam.zoom
        
        ctx.strokeStyle = `rgba(255, 255, 0, ${opacity})` // Yellow with pulsing and fade opacity
        ctx.lineWidth = 2 * (renderer as any).cam.zoom
        ctx.beginPath()

        // Draw triangle: vertex at top, flat side at bottom (using screen coordinates)
        ctx.moveTo(screen.x, screen.y - scaledHeight / 2) // Top vertex
        ctx.lineTo(screen.x - scaledHalfSize, screen.y + scaledHeight / 2) // Bottom left
        ctx.lineTo(screen.x + scaledHalfSize, screen.y + scaledHeight / 2) // Bottom right
        ctx.closePath()
        ctx.stroke()
        ctx.restore()
    }
} 