import { Projectile } from './Projectile'

export class Weapon {
    public name: string
    public cooldown: number
    public range: number
    public damage: number
    private lastFireTime: number = 0

    constructor(name: string, cooldown: number, range: number, damage: number) {
        this.name = name
        this.cooldown = cooldown
        this.range = range
        this.damage = damage
    }

    update(deltaTime: number) {
        this.lastFireTime += deltaTime
    }

    canFire(): boolean {
        return this.lastFireTime >= this.cooldown
    }

    getCooldownPercentage(): number {
        return Math.min(1, this.lastFireTime / this.cooldown)
    }

    fire(playerX: number, playerY: number, targetX: number, targetY: number, damage?: number): Projectile | null {
        if (!this.canFire()) {
            return null
        }

        this.lastFireTime = 0

        // Calculate direction to target
        const dx = targetX - playerX
        const dy = targetY - playerY
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance === 0) return null

        // Normalize direction and apply projectile speed
        const projectileSpeed = 400
        const velocityX = (dx / distance) * projectileSpeed
        const velocityY = (dy / distance) * projectileSpeed

        // Use provided damage or fall back to weapon's base damage
        const finalDamage = damage || this.damage

        // Create a wand projectile (white square)
        const projectile = new Projectile(
            playerX,
            playerY,
            velocityX,
            velocityY,
            5, // Size
            finalDamage,
            '#ffffff'
        )

        return projectile
    }
}