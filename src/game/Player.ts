import { InputState } from '../input/InputManager'
import { Renderer } from '../render/Renderer'
import { Projectile } from './Projectile'
import { Weapon } from './Weapon'
import { Enemy } from './Enemy'
import { StatsManager } from './stats/StatsManager'
import { XPTable } from './stats/XPTable'
import { BodyPart, BODY_POSITIONS } from './BodyPart'
import { BodyPartLoader } from './BodyPartLoader'

export class Player {
    public x: number
    public y: number
    public width: number = 30  // was radius * 2
    public height: number = 30 // was radius * 2

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
    
    // Sprite rendering
    private torsoSprite: HTMLImageElement | null = null
    private spriteLoaded: boolean = false
    
    // Body parts system
    public body: BodyPart[] = []
    
    // Facing direction
    public facingRight: boolean = true

    constructor(x: number, y: number) {
        this.x = x
        this.y = y

        // Initialize unified stats system
        this.stats = new StatsManager()

        // Create dual wands
        this.weapons.push(new Weapon('wand', 500, 100, 5))
        
        // Load torso sprite
        this.loadTorsoSprite()
        
        // Initialize default body parts (async)
        this.initializeBodyParts()
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

    render(renderer: Renderer) {
        // Draw cyan hitbox outline (box) - stroke only (drawOrder: 950)
        renderer.drawRectStroke(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height, '#00ffff', 2)
        
        // Render body part sprites and debug nodes
        this.renderBodyPartNodes(renderer)

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

    // Take damage and return actual damage dealt (0 if blocked)
    takeDamage(amount: number = 1): number {
        if (this.isInvulnerable) {
            return 0
        }

        // Apply armor reduction
        const armor = this.stats.total.armor || 0
        const damageReduction = armor / 100 // Convert percentage to decimal
        const finalDamage = Math.max(1, amount * (1 - damageReduction))

        // Check for dodge
        const dodgeChance = this.stats.total.dodge || 0
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

    gainXP(amount: number) {
        const leveledUp = this.stats.gainXP(amount)
        if (leveledUp) {
            // Level up occurred - this will be handled by Game.ts
            return true
        }
        return false
    }
    
    // Load torso sprite from public folder
    private loadTorsoSprite(): void {
        this.torsoSprite = new Image()
        this.torsoSprite.onload = () => {
            this.spriteLoaded = true
            console.log('Player torso sprite loaded successfully')
        }
        this.torsoSprite.onerror = () => {
            console.error('Failed to load player torso sprite')
            this.spriteLoaded = false
        }
        this.torsoSprite.src = '/bodyparts/torso.png'
    }
    
    // Initialize default body parts from CSV
    private async initializeBodyParts(): Promise<void> {
        // Load body parts from CSV
        await BodyPartLoader.loadBodyParts()
        
        // Get specific body parts by ID
        const frogHead = BodyPartLoader.getBodyPart('froghead')
        const torso = BodyPartLoader.getBodyPart('torso')
        const frogArms = BodyPartLoader.getBodyPart('frogarms')
        
        this.body = []
        if (frogArms) this.body.push(frogArms)
        if (torso) this.body.push(torso)
        if (frogHead) this.body.push(frogHead)
        
        console.log('Initialized body parts from CSV:', this.body.map(bp => `${bp.type} (${Object.keys(bp.stats).length} stats)`).join(', '))
        
        // Log the actual stats for debugging
        this.body.forEach(part => {
            console.log(`${part.type} stats:`, part.stats)
        })
    }
    
    // Render body part sprites and debug nodes in draw order
    private renderBodyPartNodes(renderer: Renderer): void {
        // Create array of body parts with their positions and sort by drawOrder
        const sortedBodyParts = this.body
            .map(bodyPart => ({
                bodyPart,
                position: BODY_POSITIONS[bodyPart.type as keyof typeof BODY_POSITIONS]
            }))
            .filter(item => item.position)
            .sort((a, b) => a.position.drawOrder - b.position.drawOrder)

        // Render each body part in draw order
        sortedBodyParts.forEach(({ bodyPart, position }) => {
            this.renderBodyPart(renderer, bodyPart, position)
        })
    }

    // Render a single body part (with special handling for arms)
    private renderBodyPart(renderer: Renderer, bodyPart: BodyPart, position: any): void {
        if (bodyPart.type === 'arms') {
            // Render arms symmetrically at left and right positions
            this.renderArmSprite(renderer, bodyPart, this.x - 15, this.y + position.y) // Left arm
            this.renderArmSprite(renderer, bodyPart, this.x + 15, this.y + position.y) // Right arm
            
            // Debug circles for both arms (drawOrder: 960)
            renderer.drawCircle(this.x - 15, this.y + position.y, 4, '#ff69b4', 2, true)
            renderer.drawCircle(this.x + 15, this.y + position.y, 4, '#ff69b4', 2, true)
        } else {
            // Regular single body part
            const worldX = this.x + position.x
            const worldY = this.y + position.y
            
            this.renderSingleSprite(renderer, bodyPart, worldX, worldY)
            
            // Debug circle (drawOrder: 960)
            renderer.drawCircle(worldX, worldY, 4, '#ff69b4', 2, true)
        }
    }

    // Render arm sprite at specific position
    private renderArmSprite(renderer: Renderer, bodyPart: BodyPart, x: number, y: number): void {
        if (bodyPart.isLoaded()) {
            const sprite = bodyPart.getSprite()
            if (sprite) {
                this.renderSingleSprite(renderer, bodyPart, x, y)
            }
        }
    }

    // Render a sprite at given world coordinates
    private renderSingleSprite(renderer: Renderer, bodyPart: BodyPart, worldX: number, worldY: number): void {
        if (bodyPart.isLoaded()) {
            const sprite = bodyPart.getSprite()
            if (sprite) {
                const spriteSize = 30
                const spriteX = worldX - spriteSize / 2
                const spriteY = worldY - spriteSize / 2
                
                // Apply damage flash effect
                if (this.damageFlashTimer > 0) {
                    renderer.ctx.save()
                    renderer.drawImage(sprite, spriteX, spriteY, spriteSize, spriteSize, !this.facingRight)
                    // Use multiply blend mode for red tint
                    renderer.ctx.globalCompositeOperation = 'multiply'
                    renderer.ctx.fillStyle = '#ff6666'
                    renderer.ctx.fillRect(spriteX, spriteY, spriteSize, spriteSize)
                    renderer.ctx.restore()
                } else {
                    renderer.drawImage(sprite, spriteX, spriteY, spriteSize, spriteSize, !this.facingRight)
                }
            }
        }
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
    get soma() { return this.stats.total.soma || 0 }

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