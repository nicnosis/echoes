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
        const alpha = Math.max(0, 1 - (this.timer / this.duration))
        const fontSize = 16 + (1 - alpha) * 4

        // Handle alpha for different color formats
        let colorWithAlpha = this.color
        if (this.color.startsWith('#')) {
            // Convert hex to rgba with alpha
            const hex = this.color.slice(1)
            const r = parseInt(hex.slice(0, 2), 16)
            const g = parseInt(hex.slice(2, 4), 16)
            const b = parseInt(hex.slice(4, 6), 16)
            colorWithAlpha = `rgba(${r}, ${g}, ${b}, ${alpha})`
        } else if (this.color.includes('1)') || this.color.includes('0.85)')) {
            // Handle existing rgba/hsla colors
            colorWithAlpha = this.color.replace('1)', `${alpha})`).replace('0.85)', `${alpha})`)
        } else {
            // Default case - assume it's a named color or rgb
            colorWithAlpha = this.color
        }

        const displayText = this.text ? this.text : this.damage.toString();

        renderer.drawText(
            displayText,
            this.x,
            this.y,
            colorWithAlpha,
            `${fontSize}px Arial`
        )
    }
}