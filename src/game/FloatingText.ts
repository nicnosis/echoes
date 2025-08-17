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
        // NO ALPHA - just draw solid color text to test if alpha is the issue
        const fontSize = 18 // Fixed size for testing
        const displayText = this.text ? this.text : this.damage.toString()

        // Use pure world coordinates - let renderer handle camera transform
        renderer.drawText(
            displayText,
            this.x,
            this.y,
            this.color, // No alpha modification
            `${fontSize}px Arial`
        )
    }
}