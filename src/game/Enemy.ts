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
    private dying: boolean = false
    private deathTimer: number = 0
    private deathDuration: number = 400 // 500ms death animation
    private originalWidth: number = 45
    private originalHeight: number = 37.5
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
        this.originalWidth = this.width
        this.originalHeight = this.height
        
        // Load crab sprite
        this.sprite = new Image()
        this.sprite.src = '/enemies/nu-crab.png'
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

            // Death visual effects will be handled in render method

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
        // Render shadow first (behind everything)
        this.renderShadow(renderer)
        
        // Calculate breathing animation scaling
        const timeInRadians = (this.animationTime / this.animationPeriod) * 2 * Math.PI
        const sineValue = Math.sin(timeInRadians + this.animationOffset)
        const scaleVariation = 0.12 // ±12%
        const widthScale = 1 + (sineValue * scaleVariation)
        const heightScale = 1 - (sineValue * scaleVariation) // Inverse relationship
        
        // Apply grounded breathing transform (same as player)
        const ctx = renderer.context
        ctx.save()
        
        // Get screen coordinates for camera-aware transform
        const screen = (renderer as any).worldToScreen(this.x, this.y, (renderer as any).cam)
        
        // Transform origin at bottom center of enemy for grounded breathing
        const bottomY = screen.y + (this.height * (renderer as any).cam.zoom) / 2
        ctx.translate(screen.x, bottomY)
        ctx.scale(widthScale, heightScale)
        ctx.translate(-screen.x, -bottomY)
        
        if (this.dying) {
            // Apply death effect - darken and fade the sprite silhouette
            const progress = this.deathTimer / this.deathDuration
            
            // Fade out using native canvas transparency
            const opacity = Math.max(0, 1 - progress * 1.1)
            ctx.globalAlpha = opacity
            
            // Darken to black using CSS filter
            const brightness = Math.max(0, 1 - progress * 1.2)
            ctx.filter = `brightness(${brightness})`
        }
        
        // Draw sprite at screen coordinates with proper enemy dimensions (breathing transform already applied)
        const finalWidth = this.width * (renderer as any).cam.zoom
        const finalHeight = this.height * (renderer as any).cam.zoom
        
        if (this.facingRight) {
            ctx.drawImage(this.sprite, screen.x - finalWidth/2, screen.y - finalHeight/2, finalWidth, finalHeight)
        } else {
            ctx.scale(-1, 1)
            ctx.drawImage(this.sprite, -screen.x - finalWidth/2, screen.y - finalHeight/2, finalWidth, finalHeight)
        }
        
        ctx.restore()

        // Debug: Draw cyan hitbox outline (rendered outside breathing transform)
        if (debug.display.bounds) {
            renderer.drawRect(this.x, this.y, this.width, this.height, 'cyan', { strokeOnly: true, lineWidth: 2 })
        }
    }

    // Render subtle elliptical drop shadow beneath enemy's feet
    private renderShadow(renderer: Renderer): void {
        // Shadow dimensions - wider than tall for natural look
        const shadowWidth = this.width * 0.7
        const shadowHeight = this.height * 0.4
        
        // Shadow position - centered horizontally, at enemy's feet level
        const shadowX = this.x
        const shadowY = this.y + 10
        
        // Subtle shadow with low opacity
        const shadowColor = 'rgba(0, 0, 0, 0.2)' // Very subtle black shadow
        
        // Use renderer's drawEllipse method if available, otherwise fallback to circle
        if ((renderer as any).drawEllipse) {
            // Add subtle blur for soft shadow effect (2px blur)
            (renderer as any).drawEllipse(shadowX, shadowY, shadowWidth / 2, shadowHeight / 2, shadowColor, 0, false, 2)
        } else {
            // Fallback to circle if no ellipse method
            renderer.drawCircle(shadowX, shadowY, shadowWidth / 2, shadowColor)
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