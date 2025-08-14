import { Renderer } from '../render/Renderer'
import { Player } from './Player'

// Base speed constant for reference (same as Player)
const BASE_MOVE_SPEED = 100

export class Enemy {
    public x: number
    public y: number
    public width: number = 30
    public height: number = 25 // Scaled proportionally from 150x125
    public moveSpeed: number = BASE_MOVE_SPEED * 0.8 // Enemies are slightly slower than player
    public health: number = 3
    public maxHealth: number = 15
    private color: string
    private dying: boolean = false
    private deathTimer: number = 0
    private deathDuration: number = 400 // 500ms death animation
    private originalWidth: number = 30
    private originalHeight: number = 25
    private originalColor: string
    private lastDamageTime: number = 0
    private damageCooldown: number = 1000 // 1 second cooldown between damage
    private sprite: HTMLImageElement
    private previousX: number
    private facingRight: boolean = true
    private directionDeadZone: number = 2 // Don't change direction within this distance

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
        this.sprite.src = '/enemies/crab.png'
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

        // Rectangle collision detection
        const enemyLeft = this.x - this.width / 2
        const enemyRight = this.x + this.width / 2
        const enemyTop = this.y - this.height / 2
        const enemyBottom = this.y + this.height / 2

        const playerLeft = player.x - player.radius
        const playerRight = player.x + player.radius
        const playerTop = player.y - player.radius
        const playerBottom = player.y + player.radius

        if (enemyLeft < playerRight && enemyRight > playerLeft &&
            enemyTop < playerBottom && enemyBottom > playerTop) {
            // Check damage cooldown
            const currentTime = Date.now()
            if (currentTime - this.lastDamageTime >= this.damageCooldown) {
                player.takeDamage(1)
                this.lastDamageTime = currentTime
            }
        }
    }

    render(renderer: Renderer) {
        // Draw crab sprite
        const spriteX = this.x - this.width / 2
        const spriteY = this.y - this.height / 2
        renderer.drawImage(this.sprite, spriteX, spriteY, this.width, this.height, !this.facingRight)

        // Draw cyan hitbox outline for debugging
        renderer.drawRectStroke(spriteX, spriteY, this.width, this.height, 'cyan', 2)
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