import { Renderer } from '../render/Renderer'

export class Soma {
    public x: number
    public y: number
    public radius: number = 10
    public somaValue: number
    public collected: boolean = false

    private floatOffset: number = 0
    private floatSpeed: number = 0.002
    // Appearance properties
    private aspect: number
    private rotation: number
    private alpha: number

    // Scatter animation properties
    private targetX: number
    private targetY: number
    private startX: number
    private startY: number
    private scatterProgress: number = 0
    private scatterDuration: number = 300 // 300ms
    private scattering: boolean = false

    constructor(x: number, y: number, somaValue: number = 1, targetX?: number, targetY?: number) {
        this.startX = x
        this.startY = y
        this.x = x
        this.y = y
        this.targetX = targetX || x
        this.targetY = targetY || y
        this.somaValue = somaValue
        this.floatOffset = Math.random() * Math.PI * 2
        // Assign static appearance
        this.aspect = 1 + Math.random() // 1 to 2
        // Random rotation in 30-degree increments (0°, 30°, 60°, 90°, 120°, 150°, 180°, 210°, 240°, 270°, 300°, 330°)
        const rotationSteps = Math.floor(Math.random() * 12) // 0-11
        this.rotation = (rotationSteps * 30) * (Math.PI / 180) // Convert to radians
        this.alpha = 0.4 + Math.random() * 0.3 // 0.4 to 0.7

        // Start scatter animation if target position is different
        if (targetX !== undefined && targetY !== undefined && (targetX !== x || targetY !== y)) {
            this.scattering = true
        }
    }

    update(deltaTime: number) {
        // Handle scatter animation only
        if (this.scattering) {
            this.scatterProgress += deltaTime

            if (this.scatterProgress >= this.scatterDuration) {
                // Animation complete
                this.scattering = false
                this.x = this.targetX
                this.y = this.targetY
            } else {
                // Interpolate position with easing
                const t = this.scatterProgress / this.scatterDuration
                const easedT = 1 - Math.pow(1 - t, 3) // Ease out cubic for smooth deceleration

                this.x = this.startX + (this.targetX - this.startX) * easedT
                this.y = this.startY + (this.targetY - this.startY) * easedT
            }
        }
    }

    render(renderer: Renderer) {
        if (this.collected) return
        let width = this.radius * this.aspect
        let height = this.radius * (2 - this.aspect)
        // Enforce a minimum width and height for visibility
        const minSize = 10
        width = Math.max(width, minSize)
        height = Math.max(height, minSize)
        
        // Render with rotation but no expensive effects
        const ctx = renderer.context
        ctx.save()
        
        // Get screen coordinates for rotation transform
        const screen = (renderer as any).worldToScreen(this.x, this.y, (renderer as any).cam)
        const scaledWidth = width * (renderer as any).cam.zoom
        const scaledHeight = height * (renderer as any).cam.zoom
        
        // Apply rotation at screen coordinates
        ctx.translate(screen.x, screen.y)
        ctx.rotate(this.rotation)
        
        // Draw rectangle with camera-scaled dimensions
        ctx.fillStyle = '#ff33cc'
        ctx.fillRect(-scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight)
        
        // Add stroke
        ctx.strokeStyle = '#9BE4F5'
        ctx.lineWidth = 1 * (renderer as any).cam.zoom
        ctx.strokeRect(-scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight)
        
        ctx.restore()
    }

    isInRange(playerX: number, playerY: number, pickupRadius: number): boolean {
        if (this.collected) return false

        const dx = this.x - playerX
        const dy = this.y - playerY
        const distance = Math.sqrt(dx * dx + dy * dy)

        return distance <= pickupRadius
    }

    collect(): { soma: number } {
        if (this.collected) return { soma: 0 }

        this.collected = true
        return { soma: this.somaValue }
    }

    getBounds() {
        return {
            x: this.x - this.radius,
            y: this.y - this.radius,
            width: this.radius * 2,
            height: this.radius * 2
        }
    }
}