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
        this.rotation = Math.random() * Math.PI * 2
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
        const ctx = (renderer as any).ctx
        ctx.save()
        ctx.globalAlpha = this.alpha
        ctx.translate(this.x, this.y)
        ctx.rotate(this.rotation)
        // Add pinkish glow
        ctx.shadowColor = '#ff66cc'
        ctx.shadowBlur = 24
        ctx.fillStyle = '#ff33cc' // Vibrant pink
        ctx.fillRect(-width / 2, -height / 2, width, height)
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