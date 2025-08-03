import { InputState } from '../input/InputManager'
import { Renderer } from '../render/Renderer'
import { Projectile } from './Projectile'
import { Weapon } from './Weapon'
import { Enemy } from './Enemy'
import { StatsManager } from './stats/StatsManager'
import { XPTable } from './stats/XPTable'

export class Player {
    public x: number
    public y: number
    public radius: number = 15

    // Unified stats system - ALL stats go through this
    public stats: StatsManager

    // Damage system
    public isInvulnerable: boolean = false
    public invulnerabilityTimer: number = 0
    public invulnerabilityDuration: number = 500

    // Visual effects
    public damageFlashTimer: number = 0
    public damageFlashDuration: number = 500

    // Weapons and projectiles
    public weapons: Weapon[] = []
    public maxWeapons: number = 6
    public projectiles: Projectile[] = []
    private currentWeaponIndex: number = 0

    // Pickup radius
    public pickupRadius: number = 50

    // Damage event system
    private damageEvents: Array<{ amount: number, timestamp: number }> = []

    // Equipment system
    public equippedItems: any[] = [] // Will be properly typed later

    constructor(x: number, y: number) {
        this.x = x
        this.y = y

        // Initialize unified stats system
        this.stats = new StatsManager()

        // Create dual wands
        this.weapons.push(new Weapon('wand', 500, 100, 5))
    }

    update(deltaTime: number, inputState: InputState, canvasWidth: number, canvasHeight: number, enemies: Enemy[]) {
        // Update timers
        if (this.invulnerabilityTimer > 0) {
            this.invulnerabilityTimer -= deltaTime
            if (this.invulnerabilityTimer <= 0) {
                this.isInvulnerable = false
            }
        }

        if (this.damageFlashTimer > 0) {
            this.damageFlashTimer -= deltaTime
        }

        // Movement
        const naturalSpeed = 150
        const moveSpeedBonus = this.stats.total.moveSpeed || 0
        const effectiveMoveSpeed = naturalSpeed * (1 + (moveSpeedBonus / 100))
        
        // Calculate movement direction
        let dx = 0
        let dy = 0
        
        if (inputState.up) dy -= 1
        if (inputState.down) dy += 1
        if (inputState.left) dx -= 1
        if (inputState.right) dx += 1
        
        // Normalize diagonal movement
        if (dx !== 0 && dy !== 0) {
            dx *= 0.707 // 1/sqrt(2) ≈ 0.707
            dy *= 0.707
        }
        
        // Apply movement
        this.x += dx * effectiveMoveSpeed * (deltaTime / 1000)
        this.y += dy * effectiveMoveSpeed * (deltaTime / 1000)

        // Keep player in bounds
        this.x = Math.max(this.radius, Math.min(canvasWidth - this.radius, this.x))
        this.y = Math.max(this.radius, Math.min(canvasHeight - this.radius, this.y))

        // Update weapons and projectiles
        this.updateWeapons(deltaTime, enemies)
        this.updateProjectiles(deltaTime, canvasWidth, canvasHeight)


    }

    private updateWeapons(deltaTime: number, enemies: Enemy[]) {
        this.weapons.forEach(weapon => {
            weapon.update(deltaTime)

            if (weapon.canFire()) {
                const target = this.findClosestEnemyInRange(weapon, enemies)
                if (target) {
                    const damage = this.calculateDamage()
                    const projectile = weapon.fire(this.x, this.y, target.x, target.y, damage)
                    if (projectile) {
                        this.projectiles.push(projectile)
                    }
                }
            }
        })
    }

    private findNextAvailableWeapon(): { weapon: Weapon | null, index: number } {
        for (let i = 0; i < this.weapons.length; i++) {
            const weapon = this.weapons[i]
            if (weapon.canFire()) {
                return { weapon, index: i }
            }
        }
        return { weapon: null, index: -1 }
    }

    private findClosestEnemyInRange(weapon: Weapon, enemies: Enemy[]): Enemy | null {
        let closestEnemy: Enemy | null = null
        let closestDistance = Infinity

        enemies.forEach(enemy => {
            const distance = Math.sqrt((enemy.x - this.x) ** 2 + (enemy.y - this.y) ** 2)
            if (distance <= weapon.range && distance < closestDistance) {
                closestDistance = distance
                closestEnemy = enemy
            }
        })

        return closestEnemy
    }

    private updateProjectiles(deltaTime: number, canvasWidth: number, canvasHeight: number) {
        this.projectiles = this.projectiles.filter(projectile => {
            projectile.update(deltaTime)
            return !projectile.isDead() && 
                   projectile.x >= 0 && projectile.x <= canvasWidth &&
                   projectile.y >= 0 && projectile.y <= canvasHeight
        })
    }

    render(renderer: Renderer) {
        // Render player with damage flash effect
        const color = this.damageFlashTimer > 0 ? '#ff0000' : this.getColor()
        renderer.drawRect(this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2, color)

        // Render weapon ranges
        this.weapons.forEach(weapon => {
            this.renderWeaponRange(renderer, weapon)
        })

        // Render pickup radius
        this.renderPickupRadius(renderer)

        // Render projectiles
        this.projectiles.forEach(projectile => {
            projectile.render(renderer)
        })
    }

    private renderWeaponRange(renderer: Renderer, weapon: Weapon) {
        renderer.drawCircle(this.x, this.y, weapon.range, '#ffffff', 1, true)
    }

    private renderPickupRadius(renderer: Renderer) {
        renderer.drawCircle(this.x, this.y, this.pickupRadius, '#00ff00', 1, true)
    }

    takeDamage(amount: number = 1): boolean {
        if (this.isInvulnerable) {
            return false
        }

        // Apply armor reduction
        const armor = this.stats.total.armor || 0
        const damageReduction = armor / 100 // Convert percentage to decimal
        const finalDamage = Math.max(1, amount * (1 - damageReduction))

        // Check for dodge
        const dodgeChance = this.stats.total.dodge || 0
        if (Math.random() * 100 < dodgeChance) {
            return false // Dodged!
        }

        const currentHP = this.stats.getCurrentHP()
        this.stats.setCurrentHP(currentHP - finalDamage)

        // Set invulnerability
        this.isInvulnerable = true
        this.invulnerabilityTimer = this.invulnerabilityDuration

        // Set damage flash
        this.damageFlashTimer = this.damageFlashDuration

        // Record damage event ONLY when damage is actually taken
        this.damageEvents.push({
            amount: finalDamage,
            timestamp: Date.now()
        })



        return true
    }

    gainXP(amount: number) {
        const leveledUp = this.stats.gainXP(amount)
        if (leveledUp) {
            // Level up occurred - this will be handled by Game.ts
            return true
        }
        return false
    }

    gainGold(amount: number) {
        // Gold is now handled through stats if needed, or can be separate
        // For now, keeping it simple
    }

    getColor(): string {
        // Color based on elemental stats
        const red = this.stats.total.red || 0
        const green = this.stats.total.green || 0
        const blue = this.stats.total.blue || 0
        const yellow = this.stats.total.yellow || 0

        // Simple color calculation based on dominant element
        if (red > green && red > blue && red > yellow) return '#ff4444'
        if (green > red && green > blue && green > yellow) return '#44ff44'
        if (blue > red && blue > green && blue > yellow) return '#4444ff'
        if (yellow > red && yellow > green && yellow > blue) return '#ffff44'

        return '#ffffff' // Default white
    }

    isDead(): boolean {
        return this.stats.getCurrentHP() <= 0
    }

    getXPPercentage(): number {
        const currentXP = this.stats.xp
        const currentLevel = this.stats.level
        return XPTable.getXPProgressInLevel(currentLevel, currentXP)
    }

    getBounds() {
        return {
            left: this.x - this.radius,
            right: this.x + this.radius,
            top: this.y - this.radius,
            bottom: this.y + this.radius
        }
    }

    addWeapon(weapon: Weapon): boolean {
        if (this.weapons.length < this.maxWeapons) {
            this.weapons.push(weapon)
            return true
        }
        return false
    }

    getPosition() {
        return { x: this.x, y: this.y }
    }

    getDamageEvents(): Array<{ amount: number, timestamp: number }> {
        const now = Date.now()
        this.damageEvents = this.damageEvents.filter(event => 
            now - event.timestamp < 2000 // Keep events for 2 seconds
        )
        return this.damageEvents
    }

    clearDamageEvents(): void {
        this.damageEvents = []
    }

    // Convenient getters for commonly used stats
    get currentHP() { return this.stats.getCurrentHP() }
    get maxHP() { return this.stats.getMaxHP() }
    get moveSpeed() { 
        // naturalSpeed is the base movement speed without any stat bonuses
        // This is different from stats.base.moveSpeed which is the starting value of the moveSpeed stat
        const naturalSpeed = 150
        const moveSpeedBonus = this.stats.total.moveSpeed || 0
        return naturalSpeed * (1 + (moveSpeedBonus / 100))
    }
    get level() { return this.stats.level }
    get xp() { return this.stats.xp }

    // Level up bonus selection
    selectLevelUpBonus(stat: 'maxHP' | 'damage' | 'armor' | 'moveSpeed') {
        const bonusAmount = 5 // Base bonus amount
        
        switch (stat) {
            case 'maxHP':
                this.stats.addLevelUpStats({ maxHP: bonusAmount })
                break
            case 'damage':
                this.stats.addLevelUpStats({ damage: bonusAmount })
                break
            case 'armor':
                this.stats.addLevelUpStats({ armor: bonusAmount })
                break
            case 'moveSpeed':
                this.stats.addLevelUpStats({ moveSpeed: bonusAmount })
                break
        }
    }

    // Equipment management
    equipItem(itemStats: Record<string, number>) {
        this.stats.equipItem(itemStats)
        this.equippedItems.push(itemStats) // Track equipped items
    }

    unequipItem(itemStats: Record<string, number>) {
        this.stats.unequipItem(itemStats)
        // Remove from equipped items list
        const index = this.equippedItems.findIndex(item => 
            JSON.stringify(item) === JSON.stringify(itemStats)
        )
        if (index !== -1) {
            this.equippedItems.splice(index, 1)
        }
    }

    // Damage calculation with crit chance
    private calculateDamage(): number {
        const baseDamage = this.stats.total.damage || 0
        const critChance = this.stats.total.critChance || 0
        
        // Check for critical hit
        if (Math.random() * 100 < critChance) {
            return baseDamage * 2 // Critical hit does double damage
        }
        
        return baseDamage
    }

    // Get display stats for UI
    getDisplayStats() {
        return this.stats.getDisplayStats()
    }
}