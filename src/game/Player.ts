import { InputState } from '../input/InputManager'
import { Renderer } from '../render/Renderer'
import { Projectile } from './Projectile'
import { Weapon } from './Weapon'
import { Enemy } from './Enemy'
import { Stats } from './stats/Stats'
import { XPTable } from './stats/XPTable'
import { BodyPart, BODY_POSITIONS } from './BodyPart'
import { BodyPartLoader } from './BodyPartLoader'
import { debug } from '../utils/Debug'

/**
 * Player class for the Echoes roguelike game
 * 
 * TABLE OF CONTENTS:
 * 1. INITIALIZATION
 * 2. UPDATE METHODS  
 * 3. RENDERING
 * 4. COMBAT & DAMAGE
 * 5. STATS, XP & LEVELING
 * 6. EQUIPMENT MANAGEMENT
 * 7. UTILITY METHODS
 */
export class Player {
    public x: number
    public y: number
    public width: number = 30  // was radius * 2
    public height: number = 30 // was radius * 2

    // Simple stats system - just add numbers!
    public stats: Stats

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

    // Pickup radius
    public pickupRadius: number = 50

    // Damage event system
    private damageEvents: Array<{ amount: number, timestamp: number }> = []

    // Equipment system
    public equippedItems: any[] = [] // Will be properly typed later

    // Body parts system
    public body: BodyPart[] = []

    // Facing direction
    public facingRight: boolean = true

    // Movement animation properties
    private animationTime: number = 0
    private animationOffset: number = Math.random() * Math.PI * 2 // Random start phase
    private isMoving: boolean = false

    constructor(x: number, y: number) {
        this.x = x
        this.y = y

        // Initialize simple stats system
        this.stats = new Stats()
        this.initStats()

        // Create dual wands
        this.weapons.push(new Weapon('wand', 500, 100, 5))

        // Initialize default body parts (async)
        this.initializeBodyParts()
    }

    // =============================================================================
    // INITIALIZATION
    // =============================================================================

    // Initialize stats system
    private async initStats(): Promise<void> {
        await this.stats.loadFromCSV()
        await this.initializeBodyParts()
    }

    // Initialize default body parts from CSV
    private async initializeBodyParts(): Promise<void> {
        // Load body parts from CSV
        await BodyPartLoader.loadBodyParts()

        // Get specific body parts by ID
        const frogHead = BodyPartLoader.getBodyPart('froghead')
        const torso = BodyPartLoader.getBodyPart('turtletorso')

        // Initialize body parts
        this.body = []
        if (torso) this.body.push(torso)
        if (frogHead) this.body.push(frogHead)

        // Verify all parts loaded, recalculate stats, heal to max
        console.log('Loaded body parts:', this.body.map(bp => bp.type).join(', '))
        this.stats.recalculateStats(this.body)
        this.heal()
    }

    // =============================================================================
    // End section 1. INITIALIZATION
    // =============================================================================

    // =============================================================================
    // 2. UPDATE METHODS
    // =============================================================================

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
        const moveSpeedBonus = this.stats.getStat('moveSpeed')
        const effectiveMoveSpeed = naturalSpeed * (1 + (moveSpeedBonus / 100))

        // Calculate movement direction
        let dx = 0
        let dy = 0

        if (inputState.up) dy -= 1
        if (inputState.down) dy += 1
        if (inputState.left) {
            dx -= 1
            this.facingRight = false
        }
        if (inputState.right) {
            dx += 1
            this.facingRight = true
        }

        // Normalize diagonal movement
        if (dx !== 0 && dy !== 0) {
            dx *= 0.707 // 1/sqrt(2) ≈ 0.707
            dy *= 0.707
        }

        // Apply movement
        this.x += dx * effectiveMoveSpeed * (deltaTime / 1000)
        this.y += dy * effectiveMoveSpeed * (deltaTime / 1000)

        // Keep player in bounds
        this.x = Math.max(this.width / 2, Math.min(canvasWidth - this.width / 2, this.x))
        this.y = Math.max(this.height / 2, Math.min(canvasHeight - this.height / 2, this.y))

        // Update movement animation
        this.updateMovementAnimation(deltaTime, dx, dy)

        // Update weapons and projectiles
        this.updateWeapons(deltaTime, enemies)
        this.updateProjectiles(deltaTime, canvasWidth, canvasHeight)


    }

    // Update movement animation based on player movement
    private updateMovementAnimation(deltaTime: number, dx: number, dy: number) {
        this.isMoving = dx !== 0 || dy !== 0
        
        // Always update animation time for breathing effect
        this.animationTime += deltaTime
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

    private findClosestEnemyInRange(weapon: Weapon, enemies: Enemy[]): Enemy | null {
        let closestEnemy: Enemy | null = null
        let closestDistance = Infinity

        enemies.forEach(enemy => {
            // Skip dying enemies
            if (enemy.isDying()) return

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

    // =============================================================================
    // End section 2. UPDATE METHODS
    // =============================================================================

    // =============================================================================
    // 3. RENDERING
    // =============================================================================
    render(renderer: Renderer) {
        // Debug: Draw cyan hitbox outline
        if (debug.showBounds) {
            renderer.drawRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height, '#00ffff', { strokeOnly: true, lineWidth: 2 })
        }

        // Render body parts with unified breathing animation
        const amplitude = this.isMoving ? 0.09 : 0.075 // ±9% moving, ±7.5% static
        const period = this.isMoving ? 550 : 1000 // 550ms moving, 1000ms static
        const timeInRadians = (this.animationTime / period) * 2 * Math.PI
        const sineValue = Math.sin(timeInRadians + this.animationOffset)
        const widthScale = 1 + (sineValue * amplitude)
        const heightScale = 1 - (sineValue * amplitude)

        // Apply breathing transform to entire character (scale from bottom)
        const ctx = renderer.context
        ctx.save()
        
        // Transform origin at bottom center of player for grounded breathing
        const bottomY = this.y + this.height / 2
        ctx.translate(this.x, bottomY)
        ctx.scale(widthScale, heightScale)
        ctx.translate(-this.x, -bottomY)

        // Render body parts in draw order
        const sortedBodyParts = this.body
            .map(bodyPart => ({
                bodyPart,
                position: BODY_POSITIONS[bodyPart.type as keyof typeof BODY_POSITIONS]
            }))
            .filter(item => item.position)
            .sort((a, b) => a.position.drawOrder - b.position.drawOrder)

        sortedBodyParts.forEach(({ bodyPart, position }) => {
            this.renderBodyPart(renderer, bodyPart, position)
        })

        ctx.restore()

        // Debug: Render weapon ranges and pickup radius
        if (debug.showBounds) {
            this.weapons.forEach(weapon => {
                renderer.drawCircle(this.x, this.y, weapon.range, '#ffffff', 1, true)
            })
            renderer.drawCircle(this.x, this.y, this.pickupRadius, '#00ff00', 1, true)
        }

        // Render projectiles
        this.projectiles.forEach(projectile => {
            projectile.render(renderer)
        })
    }

    // Render a single body part
    private renderBodyPart(renderer: Renderer, bodyPart: BodyPart, position: any): void {
        const worldX = this.x + position.x
        const worldY = this.y + position.y

        if (bodyPart.isLoaded()) {
            const sprite = bodyPart.getSprite()
            if (sprite) {
                const finalWidth = sprite.naturalWidth * bodyPart.scale
                const finalHeight = sprite.naturalHeight * bodyPart.scale
                const spriteX = worldX - finalWidth / 2
                const spriteY = worldY - finalHeight / 2

                // Apply damage flash effect
                if (this.damageFlashTimer > 0) {
                    const flashCtx = renderer.context
                    flashCtx.save()
                    renderer.drawImage(sprite, spriteX, spriteY, finalWidth, finalHeight, !this.facingRight)
                    flashCtx.globalCompositeOperation = 'multiply'
                    flashCtx.fillStyle = '#ff6666'
                    flashCtx.fillRect(spriteX, spriteY, finalWidth, finalHeight)
                    flashCtx.restore()
                } else {
                    renderer.drawImage(sprite, spriteX, spriteY, finalWidth, finalHeight, !this.facingRight)
                }
            }
        }

        // Debug: Pink circle for body part position
        if (debug.showBounds) {
            renderer.drawCircle(worldX, worldY, 4, '#ff69b4', 2, true)
        }
    }

    // =============================================================================
    // End section 3. RENDERING
    // =============================================================================

    // =============================================================================
    // 4. COMBAT & DAMAGE
    // =============================================================================

    // Take damage and return actual damage dealt (0 if blocked)
    takeDamage(amount: number = 1): number {
        if (this.isInvulnerable) {
            return 0
        }

        // Apply armor reduction
        const armor = this.stats.getStat('armor')
        const damageReduction = armor / 100 // Convert percentage to decimal
        const finalDamage = Math.max(1, amount * (1 - damageReduction))

        // Check for dodge
        const dodgeChance = this.stats.getStat('dodge')
        if (Math.random() * 100 < dodgeChance) {
            return 0 // Dodged!
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



        return finalDamage
    }

    // Damage calculation with percentage multiplier and crit chance
    private calculateDamage(): number {
        // Get base damage from weapon (assumes player has at least one weapon)
        const weaponBaseDamage = this.weapons.length > 0 ? this.weapons[0].damage : 5
        
        // Get damage percentage bonus from stats
        const damageBonus = this.stats.getStat('damage') // This is a percentage (e.g., 10 = 10%)
        const critChance = this.stats.getStat('critChance')
        
        // Calculate final damage: baseDamage * (1 + bonusPercentage/100)
        const finalDamage = weaponBaseDamage * (1 + damageBonus / 100)

        // Check for critical hit
        if (Math.random() * 100 < critChance) {
            return Math.round(finalDamage * 2) // Critical hit does double damage
        }

        return Math.round(finalDamage)
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

    // =============================================================================
    // End section 4. COMBAT & DAMAGE
    // =============================================================================

    // =============================================================================
    // 5. STATS, XP & LEVELING
    // =============================================================================

    gainXP(amount: number): boolean {
        const currentXP = this.stats.xp
        const currentLevel = this.stats.level
        const newXP = currentXP + amount

        // Update XP
        this.stats.xp = newXP

        // Check for level up using XP table
        const xpRequired = XPTable.getTotalXPForLevel(currentLevel + 1)

        if (newXP >= xpRequired) {
            // Level up!
            this.stats.addLevelUpStat('level', 1)
            this.stats.addLevelUpStat('maxHP', 1) // Auto-gain 1 maxHP per level
            
            // Also increase current HP by 1 to match the maxHP increase
            const currentHP = this.stats.getCurrentHP()
            this.stats.setCurrentHP(currentHP + 1)
            
            return true // Level up occurred
        }

        return false
    }

    // Level up bonus selection
    selectLevelUpBonus(stat: 'maxHP' | 'damage' | 'armor' | 'moveSpeed') {
        const bonusAmount = 5 // Base bonus amount
        this.stats.addLevelUpStat(stat, bonusAmount)
    }

    // Heal player by amount or to full if no argument
    heal(amount?: number): void {
        const currentHP = this.stats.getCurrentHP()
        const maxHP = this.stats.getMaxHP()
        
        if (amount === undefined) {
            // No argument = heal to full
            this.stats.setCurrentHP(maxHP)
        } else {
            // Heal specific amount, capped at maxHP
            const newHP = Math.min(currentHP + amount, maxHP)
            this.stats.setCurrentHP(newHP)
        }
    }

    // Get display stats for UI
    getDisplayStats() {
        return this.stats.getDisplayStats()
    }

    // Convenient getters for commonly used stats
    get currentHP() { return this.stats.getCurrentHP() }
    get maxHP() { return this.stats.getMaxHP() }
    get moveSpeed() {
        // naturalSpeed is the base movement speed without any stat bonuses
        // This is different from stats.base.moveSpeed which is the starting value of the moveSpeed stat
        const naturalSpeed = 150
        const moveSpeedBonus = this.stats.getStat('moveSpeed')
        return naturalSpeed * (1 + (moveSpeedBonus / 100))
    }
    get level() { return this.stats.level }
    get xp() { return this.stats.xp }
    get soma() { return this.stats.getStat('soma') }

    // =============================================================================
    // End section 5. STATS, XP & LEVELING
    // =============================================================================

    // =============================================================================
    // 6. EQUIPMENT MANAGEMENT
    // =============================================================================

    // Replace a body part and update stats (for transformation system)
    replaceBodyPart(oldPart: BodyPart | null, newPart: BodyPart): void {
        // Find and remove old part from body array
        if (oldPart) {
            const index = this.body.findIndex(part => part.type === oldPart.type)
            if (index !== -1) {
                this.body.splice(index, 1)
            }
        }

        // Add new part to body array
        this.body.push(newPart)

        // Update gear stats from body parts
        this.stats.updateGear(this.body)
        
        console.log(`Replaced ${oldPart?.type || 'empty slot'} with ${newPart.type}`)
    }

    // Get current body part by type
    getBodyPart(type: string): BodyPart | null {
        return this.body.find(part => part.type === type) || null
    }

    equipItem(itemStats: Record<string, number>) {
        // Add item stats to gear layer
        Object.entries(itemStats).forEach(([stat, value]) => {
            this.stats.gear[stat] = (this.stats.gear[stat] || 0) + value
        })
        this.equippedItems.push(itemStats) // Track equipped items
    }

    unequipItem(itemStats: Record<string, number>) {
        // Remove item stats from gear layer
        Object.entries(itemStats).forEach(([stat, value]) => {
            this.stats.gear[stat] = (this.stats.gear[stat] || 0) - value
        })
        // Remove from equipped items list
        const index = this.equippedItems.findIndex(item =>
            JSON.stringify(item) === JSON.stringify(itemStats)
        )
        if (index !== -1) {
            this.equippedItems.splice(index, 1)
        }
    }

    // =============================================================================
    // End section 6. EQUIPMENT MANAGEMENT
    // =============================================================================

    // =============================================================================
    // 7. UTILITY METHODS
    // =============================================================================

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
            left: this.x - this.width / 2,
            right: this.x + this.width / 2,
            top: this.y - this.height / 2,
            bottom: this.y + this.height / 2
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

    // =============================================================================
    // End section 7. UTILITY METHODS
    // =============================================================================
}