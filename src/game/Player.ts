import { InputState } from '../input/InputManager'
import { Renderer } from '../render/Renderer'
import { Projectile } from './Projectile'
import { Weapon } from './Weapon'
import { Enemy } from './Enemy'

// Base stat constants
const BASE_MOVE_SPEED = 150
const BASE_MAX_HP = 10
const BASE_ATTACK = 0
const BASE_ARMOR = 0
const BASE_CRIT = 5
const PERCENT = 0.01

export class Player {
  public x: number
  public y: number
  public radius: number = 15
  
  // Base character stats (never change)
  private baseStats = {
    moveSpeed: BASE_MOVE_SPEED,
    maxHP: BASE_MAX_HP,
    attack: BASE_ATTACK,
    armor: BASE_ARMOR,
    critChance: BASE_CRIT
  }
  
  // Permanent gains from leveling up
  private levelStats = {
    moveSpeed: 0,
    maxHP: 0,
    attack: 0,
    armor: 0,
    critChance: 0
  }
  
  // Cached equipment bonuses (recalculated only when equipment changes)
  private equipmentStats = {
    moveSpeed: 0,
    maxHP: 0,
    attack: 0,
    armor: 0,
    critChance: 0
  }
  
  // Actual cached values (recalculated only when any source changes)
  public actualStats = {
    moveSpeed: BASE_MOVE_SPEED,
    maxHP: BASE_MAX_HP,
    attack: BASE_ATTACK,
    armor: BASE_ARMOR,
    critChance: BASE_CRIT
  }
  
  // Player state structure
  public playerState = {
    position: { x: 0, y: 0 },
    stats: {
      hp: BASE_MAX_HP,
      maxHp: BASE_MAX_HP,
      attack: BASE_ATTACK,
      defense: BASE_ARMOR,
      critChance: BASE_CRIT * PERCENT,
      movementSpeed: BASE_MOVE_SPEED
    },
    level: 0,
    xp: 0,
    xpToNext: 100,
    gold: 0,
    inventory: []
  }
  
  // Legacy properties for compatibility (will be removed)
  public maxHP: number = BASE_MAX_HP
  public currentHP: number = BASE_MAX_HP
  public level: number = 0
  public currentXP: number = 0
  public xpToNextLevel: number = 100
  public gold: number = 0
  public attack: number = 0
  public armor: number = 0
  public critChance: number = 5
  public moveSpeedStat: number = 0
  
  // Damage system
  public isInvulnerable: boolean = false
  public invulnerabilityTimer: number = 0
  public invulnerabilityDuration: number = 500
  
  // Visual effects
  public damageFlashTimer: number = 0
  public damageFlashDuration: number = 1200
  
  // Weapons and projectiles
  public weapons: Weapon[] = []
  public maxWeapons: number = 6
  public projectiles: Projectile[] = []
  private currentWeaponIndex: number = 0
  
  // Pickup radius
  public pickupRadius: number = 50
  public luck: number = 0

  // Damage event system
  private damageEvents: Array<{amount: number, timestamp: number}> = []
  
  // Equipment system
  public equippedItems: any[] = [] // Will be properly typed later

  constructor(x: number, y: number) {
    this.x = x
    this.y = y
    this.playerState.position.x = x
    this.playerState.position.y = y
    
    // Create dual wands
    this.weapons.push(new Weapon('wand', 500, 100, 5))
    
    // Initialize stats
    this.recalculateStats()
    this.syncLegacyProperties()
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
    const dt = deltaTime / 1000
    let dx = 0
    let dy = 0
    
    if (inputState.left) dx -= 1
    if (inputState.right) dx += 1
    if (inputState.up) dy -= 1
    if (inputState.down) dy += 1
    
    // Normalize diagonal movement
    if (dx !== 0 && dy !== 0) {
      dx *= 0.707 // 1/sqrt(2)
      dy *= 0.707
    }
    
    // Calculate effective move speed with stat bonus
    const effectiveMoveSpeed = this.actualStats.moveSpeed
    const moveSpeed = effectiveMoveSpeed * dt
    this.x += dx * moveSpeed
    this.y += dy * moveSpeed
    
    // Keep player in bounds
    this.x = Math.max(this.radius, Math.min(canvasWidth - this.radius, this.x))
    this.y = Math.max(this.radius, Math.min(canvasHeight - this.radius, this.y))
    
    // Sync position with player state
    this.updatePosition()

    this.updateWeapons(deltaTime, enemies)
    this.updateProjectiles(deltaTime, canvasWidth, canvasHeight)
  }

  private updateWeapons(deltaTime: number, enemies: Enemy[]) {
    // Update all weapons
    this.weapons.forEach(weapon => {
      weapon.update(deltaTime)
    })
    if (this.weapons.length === 0) return

    // Track how much damage will be dealt to each enemy this frame
    const enemyDamageMap = new Map<Enemy, number>()
    // Copy of enemies array for targeting
    const availableEnemies = enemies.slice()

    for (let w = 0; w < this.weapons.length; w++) {
      const weapon = this.weapons[w]
      if (!weapon.canFire()) continue

      // Find the best target: one that will not be overkilled
      let bestTarget: Enemy | null = null
      let bestTargetHPLeft = Infinity
      for (const enemy of availableEnemies) {
        // Calculate how much damage this enemy will take from already assigned weapons
        const pendingDamage = enemyDamageMap.get(enemy) || 0
        const hpLeft = enemy.health - pendingDamage
        // Only target if weapon can reach and enemy will survive at least 1 damage
        const dx = enemy.x - this.x
        const dy = enemy.y - this.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        const edgeDistance = Math.max(0, distance - enemy.radius)
        if (edgeDistance <= weapon.range && hpLeft > 0 && hpLeft < bestTargetHPLeft) {
          bestTarget = enemy
          bestTargetHPLeft = hpLeft
        }
      }
      if (bestTarget) {
        // Assign this weapon to attack this enemy
        const projectile = weapon.fire(this.x, this.y, bestTarget.x, bestTarget.y)
        if (projectile) {
          this.projectiles.push(projectile)
          // Track the damage
          enemyDamageMap.set(bestTarget, (enemyDamageMap.get(bestTarget) || 0) + weapon.damage)
        }
      }
    }
  }

  private findNextAvailableWeapon(): { weapon: Weapon | null, index: number } {
    // Start from the next weapon and cycle through all weapons
    for (let i = 1; i < this.weapons.length; i++) {
      const weaponIndex = (this.currentWeaponIndex + i) % this.weapons.length
      const weapon = this.weapons[weaponIndex]
      
      if (weapon.canFire()) {
        return { weapon, index: weaponIndex }
      }
    }
    
    return { weapon: null, index: -1 }
  }

  private findClosestEnemyInRange(weapon: Weapon, enemies: Enemy[]): Enemy | null {
    let closestEnemy: Enemy | null = null
    let closestDistance = Infinity

    for (const enemy of enemies) {
      const dx = enemy.x - this.x
      const dy = enemy.y - this.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      const edgeDistance = Math.max(0, distance - enemy.radius)
      if (edgeDistance <= weapon.range && edgeDistance < closestDistance) {
        closestEnemy = enemy
        closestDistance = edgeDistance
      }
    }

    return closestEnemy
  }

  private updateProjectiles(deltaTime: number, canvasWidth: number, canvasHeight: number) {
    this.projectiles = this.projectiles.filter(projectile => {
      projectile.update(deltaTime)
      return projectile.y > -10 && projectile.y < canvasHeight + 10 && 
             projectile.x > -10 && projectile.x < canvasWidth + 10
    })
  }

  render(renderer: Renderer) {
    // Draw pickup radius
    this.renderPickupRadius(renderer)
    
    // Draw weapon range circle (first weapon only for now)
    if (this.weapons.length > 0) {
      this.renderWeaponRange(renderer, this.weapons[0])
    }
    
    // Draw player as a square with damage flash color
    renderer.drawRect(this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2, this.getColor())
  }

  private renderWeaponRange(renderer: Renderer, weapon: Weapon) {
    const ctx = (renderer as any).ctx
    ctx.save()
    ctx.globalAlpha = 0.5
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(this.x, this.y, weapon.range, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()
  }

  private renderPickupRadius(renderer: Renderer) {
    const ctx = (renderer as any).ctx
    ctx.save()
    ctx.globalAlpha = 0.3
    ctx.strokeStyle = '#8800ff'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.pickupRadius, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()
  }

  takeDamage(amount: number = 1): boolean {
    console.log(`⚔️  Player.takeDamage called! Amount: ${amount}, Current HP: ${this.currentHP}, Invulnerable: ${this.isInvulnerable}`);
    if (this.isInvulnerable) {
      console.log(`🛡️ Damage blocked by invulnerability! Remaining: ${this.invulnerabilityTimer}ms`);
      return false
    }
    
    console.log(`💔 Player taking ${amount} damage! HP: ${this.currentHP} -> ${this.currentHP - amount}`);
    this.currentHP = Math.max(0, this.currentHP - amount)
    this.isInvulnerable = true
    this.invulnerabilityTimer = this.invulnerabilityDuration
    this.damageFlashTimer = this.damageFlashDuration
    
    // Queue damage event for damage number display
    this.damageEvents.push({amount, timestamp: Date.now()})
    
    console.log(`⚡ Invulnerability started: ${this.invulnerabilityTimer}ms`);
    
    return true
  }

  gainXP(amount: number) {
    this.currentXP += amount
    
    while (this.currentXP >= this.xpToNextLevel) {
      this.currentXP -= this.xpToNextLevel
      this.level++
      // XP requirement could scale here if needed
    }
  }

  gainGold(amount: number) {
    this.gold += amount;
  }

  getColor(): string {
    if (this.isInvulnerable) {
      return '#00ffff' // Bright cyan when invulnerable
    }
    
    if (this.damageFlashTimer > 0) {
      // Fade from orange back to blue over damage flash duration
      const flashProgress = 1 - (this.damageFlashTimer / this.damageFlashDuration)
      const orangeIntensity = Math.max(0, 1 - flashProgress)
      // Interpolate between orange (255,140,0) and blue (0,100,255)
      const r = Math.floor(255 * orangeIntensity)
      const g = Math.floor(140 * orangeIntensity + 100 * (1 - orangeIntensity))
      const b = Math.floor(0 * orangeIntensity + 255 * (1 - orangeIntensity))
      return `rgb(${r},${g},${b})`
    }
    return '#0064ff' // Default blue
  }

  isDead(): boolean {
    return this.currentHP <= 0
  }

  getXPPercentage(): number {
    return (this.currentXP / this.xpToNextLevel) * 100
  }

  getBounds() {
    return {
      x: this.x - this.radius,
      y: this.y - this.radius,
      width: this.radius * 2,
      height: this.radius * 2
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

  // Get and clear damage events for processing
  getDamageEvents(): Array<{amount: number, timestamp: number}> {
    const events = [...this.damageEvents]
    this.damageEvents = []
    return events
  }

  // Helper to recalculate all stats
  private recalculateStats() {
    this.actualStats.moveSpeed = this.baseStats.moveSpeed + this.levelStats.moveSpeed + this.equipmentStats.moveSpeed
    this.actualStats.maxHP = this.baseStats.maxHP + this.levelStats.maxHP + this.equipmentStats.maxHP
    this.actualStats.attack = this.baseStats.attack + this.levelStats.attack + this.equipmentStats.attack
    this.actualStats.armor = this.baseStats.armor + this.levelStats.armor + this.equipmentStats.armor
    this.actualStats.critChance = this.baseStats.critChance + this.levelStats.critChance + this.equipmentStats.critChance
  }

  // Helper to sync legacy properties with new stat system
  private syncLegacyProperties() {
    this.maxHP = this.actualStats.maxHP
    this.currentHP = this.playerState.stats.hp
    this.level = this.playerState.level
    this.currentXP = this.playerState.xp
    this.xpToNextLevel = this.playerState.xpToNext
    this.gold = this.playerState.gold
    this.attack = this.actualStats.attack
    this.armor = this.actualStats.armor
    this.critChance = this.actualStats.critChance * 100 // Convert to percent
    this.moveSpeedStat = this.levelStats.moveSpeed // This is the stat that modifies base speed
  }
  
  // Called when equipment changes
  updateEquipmentStats() {
    this.equipmentStats = { moveSpeed: 0, maxHP: 0, attack: 0, armor: 0, critChance: 0 }
    
    // Sum all equipped items once
    for (const item of this.equippedItems) {
      if (item.bonuses) {
        this.equipmentStats.moveSpeed += item.bonuses.moveSpeed || 0
        this.equipmentStats.maxHP += item.bonuses.maxHP || 0
        this.equipmentStats.attack += item.bonuses.attack || 0
        this.equipmentStats.armor += item.bonuses.armor || 0
        this.equipmentStats.critChance += item.bonuses.critChance || 0
      }
    }
    
    this.recalculateStats()
    this.syncLegacyProperties()
  }
  
  // Called on level up
  levelUp() {
    this.levelStats.moveSpeed += 2 // Example level bonus
    this.levelStats.maxHP += 5
    this.levelStats.attack += 1
    this.levelStats.armor += 1
    this.levelStats.critChance += 1
    
    this.recalculateStats()
    this.syncLegacyProperties()
  }
  
  // Update player state position
  updatePosition() {
    this.playerState.position.x = this.x
    this.playerState.position.y = this.y
  }
}