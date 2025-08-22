import { Renderer } from '../render/Renderer'

// FloatingText class for displaying damage numbers, level ups, and status messages
export class FloatingText {
    public x: number
    public y: number
    public damage: number
    public color: string
    public timer: number = 0
    public duration: number = 1000
    public velocityY: number = -50
    public text?: string // Optional custom text
    public critical: boolean

    constructor(x: number, y: number, damage: number, critical: boolean = false, text?: string, isPlayerDamage: boolean = false) {
        this.x = x
        this.y = y
        this.damage = damage
        this.critical = critical
        this.color = critical ? '#ffe066' : (isPlayerDamage ? '#ff4444' : '#ffffff');
        this.text = text;
    }

    update(deltaTime: number): boolean {
        this.timer += deltaTime
        this.y += this.velocityY * (deltaTime / 1000)

        return this.timer < this.duration
    }

    render(renderer: Renderer) {
        const fontSize = 18
        const displayText = this.text ? this.text : this.damage.toString()

        // Calculate fade effect - fade in last 30% of duration
        const fadeStartTime = this.duration * 0.7 // Start fading at 70% of lifetime
        const alpha = this.timer > fadeStartTime 
            ? Math.max(0, 1 - ((this.timer - fadeStartTime) / (this.duration - fadeStartTime)))
            : 1.0

        // Get screen coordinates for manual rendering
        const screen = (renderer as any).worldToScreen(this.x, this.y, (renderer as any).cam)
        const ctx = renderer.context
        
        ctx.save()
        ctx.globalAlpha = alpha
        ctx.font = `${fontSize * (renderer as any).cam.zoom}px Arial`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        
        // Draw stroke (off-black outline)
        ctx.strokeStyle = '#1a1a1a' // Off-black
        ctx.lineWidth = 3 * (renderer as any).cam.zoom
        ctx.strokeText(displayText, screen.x, screen.y)
        
        // Draw fill
        ctx.fillStyle = this.color
        ctx.fillText(displayText, screen.x, screen.y)
        
        ctx.restore()
    }
}