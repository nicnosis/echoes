import { Renderer } from '../render/Renderer'
import { Player } from './Player'
import { debug } from '../utils/Debug'

// Base speed constant for reference (same as Player)
const BASE_MOVE_SPEED = 100

export class Enemy {
    public x: number
    public y: number
    public width: number = 45 // 150% of 30 for visibility
    public height: number = 37.5 // 150% of 25 for visibility
    public moveSpeed: number = BASE_MOVE_SPEED * 0.8 // Enemies are slightly slower than player
    public health: number = 3
    public maxHealth: number = 15
    private color: string
    private dying: boolean = false
    private deathTimer: number = 0
    private deathDuration: number = 400 // 500ms death animation
    private originalWidth: number = 45
    private originalHeight: number = 37.5
    private originalColor: string
    private sprite: HTMLImageElement
    private previousX: number
    private facingRight: boolean = true
    private directionDeadZone: number = 2 // Don't change direction within this distance
    
    // Animation properties for subtle breathing effect
    private animationTime: number = 0
    private animationPeriod: number = 750 // Period in milliseconds for full cycle
    private animationOffset: number = Math.random() * Math.PI * 2 // Random start phase

    constructor(x: number, y: number) {
        this.x = x
        this.y = y
        this.previousX = x
        this.color = this.generateRandomRedColor()
        this.originalColor = this.color
        this.originalWidth = this.width
        this.originalHeight = this.height
        
        // Load crab sprite
        this.sprite = new Image()
        this.sprite.src = '/enemies/nu-crab.png'
    }

    private generateRandomRedColor(): string {
        const hueVariation = Math.random() * 60 - 30
        const baseHue = 0 + hueVariation
        const normalizedHue = ((baseHue % 360) + 360) % 360

        const saturation = 80 + Math.random() * 20
        const lightness = 40 + Math.random() * 20

        return `hsla(${normalizedHue}, ${saturation}%, ${lightness}%, 0.85)`
    }

    // Update enemy behavior 
    update(deltaTime: number, player: Player): void {
        const dt = deltaTime / 1000

        // Update animation time for breathing effect
        if (!this.dying) {
            this.animationTime += deltaTime // Track time in milliseconds
        }

        if (this.dying) {
            // Update death animation
            this.deathTimer += deltaTime
            const progress = this.deathTimer / this.deathDuration

            // Shrink size
            this.width = this.originalWidth * (1 - progress)
            this.height = this.originalHeight * (1 - progress)

            // Fade to black
            const colorProgress = Math.min(1, progress)
            const r = Math.floor(255 - 0 * colorProgress) // Red component to black
            const g = Math.floor(0 * colorProgress)   // Green stays 0
            const b = Math.floor(0 * colorProgress)   // Blue stays 0
            this.color = `rgb(${r},${g},${b})`

            return // Don't do normal updates while dying
        }

        // Store previous position for facing direction
        this.previousX = this.x

        const dx = player.x - this.x
        const dy = player.y - this.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        // Move towards player
        if (distance > 0) {
            const moveX = (dx / distance) * this.moveSpeed * dt
            const moveY = (dy / distance) * this.moveSpeed * dt

            this.x += moveX
            this.y += moveY

            // Update facing direction only if outside dead zone to prevent jittering
            if (distance > this.directionDeadZone) {
                this.facingRight = moveX > 0
            }
        }

        // Check collision with player
        this.checkPlayerCollision(player, deltaTime)
    }

    private checkPlayerCollision(player: Player, deltaTime: number) {
        if (this.dying) return // Can't damage player while dying

        // Collision detection moved to Game.checkCollisions()
    }

    render(renderer: Renderer) {
        // Calculate breathing animation scaling
        const timeInRadians = (this.animationTime / this.animationPeriod) * 2 * Math.PI
        const sineValue = Math.sin(timeInRadians + this.animationOffset)
        const scaleVariation = 0.12 // ±12%
        const widthScale = 1 + (sineValue * scaleVariation)
        const heightScale = 1 - (sineValue * scaleVariation) // Inverse relationship
        
        // Calculate scaled dimensions
        const scaledWidth = this.width * widthScale
        const scaledHeight = this.height * heightScale
        
        // Draw crab sprite with scaled dimensions
        const spriteX = this.x - scaledWidth / 2
        const spriteY = this.y - scaledHeight / 2
        renderer.drawImage(this.sprite, spriteX, spriteY, scaledWidth, scaledHeight, !this.facingRight)

        // Debug: Draw cyan hitbox outline (using original dimensions)
        if (debug.showBounds) {
            const hitboxX = this.x - this.width / 2
            const hitboxY = this.y - this.height / 2
            renderer.drawRect(hitboxX, hitboxY, this.width, this.height, 'cyan', { strokeOnly: true, lineWidth: 2 })
        }
    }

    getBounds() {
        return {
            x: this.x - this.width / 2,
            y: this.y - this.height / 2,
            width: this.width,
            height: this.height
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