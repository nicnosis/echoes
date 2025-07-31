import { Renderer } from '../render/Renderer'

export class Projectile {
    public x: number
    public y: number
    public velocityX: number
    public velocityY: number
    public damage: number
    public size: number
    public color: string

    constructor(x: number, y: number, velocityX: number, velocityY: number, size: number, damage: number, color: string = '#ffffff') {
        this.x = x
        this.y = y
        this.velocityX = velocityX
        this.velocityY = velocityY
        this.size = size
        this.damage = damage
        this.color = color
    }

    update(deltaTime: number) {
        const dt = deltaTime / 1000
        this.x += this.velocityX * dt
        this.y += this.velocityY * dt
    }

    render(renderer: Renderer) {
        renderer.drawRect(
            this.x - this.size / 2,
            this.y - this.size / 2,
            this.size,
            this.size,
            this.color
        )
    }

    getBounds() {
        return {
            x: this.x - this.size / 2,
            y: this.y - this.size / 2,
            width: this.size,
            height: this.size
        }
    }
}