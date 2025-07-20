import { InputState } from '../input/InputManager'
import { Renderer } from '../render/Renderer'
import { Projectile } from './Projectile'
import { Weapon } from './Weapon'
import { Enemy } from './Enemy'

export class Player {
  public x: number
  public y: number
  public radius: number = 15
  public speed: number = 200
  
  // Health system
  public maxHP: number = 10
  public currentHP: number = 10
  
  // XP system
  public level: number = 0
  public currentXP: number = 0
  public xpToNextLevel: number = 100
  
  // Damage system
  public damageCooldown: number = 0
  public damageCooldownDuration: number = 500
  
  // Visual effects
  public damageFlashTimer: number = 0
  public damageFlashDuration: number = 1200
  
  // Weapons and projectiles
  public weapons: Weapon[] = []
  public maxWeapons: number = 6
  public projectiles: Projectile[] = []
  
  // Pickup radius
  public pickupRadius: number

  constructor(x: number, y: number) {
    this.x = x
    this.y = y
    
    // Create dual wands
    this.weapons.push(new Weapon('wand', 500, 50, 10)) // Weapon range of 50
    this.weapons.push(new Weapon('wand', 500, 50, 10))
    
    // Pickup radius is 2/3 of weapon range
    this.pickupRadius = 50 * (2/3)
  }

  update(deltaTime: number, inputState: InputState, canvasWidth: number, canvasHeight: number, enemies: Enemy[]) {
    // Update timers
    if (this.damageCooldown > 0) {
      this.damageCooldown -= deltaTime
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
    
    // Apply movement with bounds checking
    const moveSpeed = this.speed * dt
    this.x += dx * moveSpeed
    this.y += dy * moveSpeed
    
    // Keep player in bounds
    this.x = Math.max(this.radius, Math.min(canvasWidth - this.radius, this.x))
    this.y = Math.max(this.radius, Math.min(canvasHeight - this.radius, this.y))

    this.updateWeapons(deltaTime, enemies)
    this.updateProjectiles(deltaTime, canvasWidth, canvasHeight)
  }

  private updateWeapons(deltaTime: number, enemies: Enemy[]) {
    this.weapons.forEach(weapon => {
      weapon.update(deltaTime)
      
      // Find closest enemy within range
      const target = this.findClosestEnemyInRange(weapon, enemies)
      
      // Only fire if there's a valid target
      if (target && weapon.canFire()) {
        const projectile = weapon.fire(this.x, this.y, target.x, target.y)
        if (projectile) {
          this.projectiles.push(projectile)
        }
      }
    })
  }

  private findClosestEnemyInRange(weapon: Weapon, enemies: Enemy[]): Enemy | null {
    let closestEnemy: Enemy | null = null
    let closestDistance = Infinity

    for (const enemy of enemies) {
      const dx = enemy.x - this.x
      const dy = enemy.y - this.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance <= weapon.range && distance < closestDistance) {
        closestEnemy = enemy
        closestDistance = distance
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
    
    // Draw player as a circle with damage flash color
    renderer.drawCircle(this.x, this.y, this.radius, this.getColor())
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
    if (this.damageCooldown > 0) return false
    
    this.currentHP = Math.max(0, this.currentHP - amount)
    this.damageCooldown = this.damageCooldownDuration
    this.damageFlashTimer = this.damageFlashDuration
    
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

  getColor(): string {
    if (this.damageFlashTimer > 0) {
      // Fade from yellow back to blue over damage flash duration
      const flashProgress = 1 - (this.damageFlashTimer / this.damageFlashDuration)
      const yellowIntensity = Math.max(0, 1 - flashProgress)
      
      // Interpolate between yellow (255,255,0) and blue (0,100,255)
      const r = Math.floor(255 * yellowIntensity)
      const g = Math.floor(255 * yellowIntensity + 100 * (1 - yellowIntensity))
      const b = Math.floor(255 * (1 - yellowIntensity))
      
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
}