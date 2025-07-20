import { Renderer } from '../render/Renderer'
import { InputManager } from '../input/InputManager'
import { Player } from './Player'
import { Enemy } from './Enemy'
import { DamageNumber, XPCrystal } from './DamageNumber'
import { HUD } from '../ui/HUD'

export class Game {
  private canvas: HTMLCanvasElement
  private renderer: Renderer
  private inputManager: InputManager
  private running = false
  private lastTime = 0
  private player: Player
  private enemies: Enemy[] = []
  private damageNumbers: DamageNumber[] = []
  private xpCrystals: XPCrystal[] = []
  private hud: HUD
  private enemySpawnTimer: number = 0
  private enemySpawnInterval: number = 5000 // 5 seconds

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.renderer = new Renderer(canvas)
    this.inputManager = new InputManager()
    this.player = new Player(canvas.width / 2, canvas.height / 2)
    this.hud = new HUD()
    
    // Spawn initial 5 enemies
    this.spawnEnemies(5)
  }

  start() {
    if (this.running) return
    this.running = true
    this.gameLoop(0)
  }

  stop() {
    this.running = false
  }

  private gameLoop = (currentTime: number) => {
    if (!this.running) return

    const deltaTime = currentTime - this.lastTime
    this.lastTime = currentTime

    this.update(deltaTime)
    this.render()

    requestAnimationFrame(this.gameLoop)
  }

  private update(deltaTime: number) {
    this.player.update(deltaTime, this.inputManager.inputState, this.canvas.width, this.canvas.height, this.enemies)
    
    for (const enemy of this.enemies) {
      enemy.update(deltaTime, this.player)
    }

    this.updateXPCrystals(deltaTime)
    this.checkProjectileCollisions()
    this.checkXPCrystalPickup()
    this.updateDamageNumbers(deltaTime)
    this.updateEnemySpawning(deltaTime)
  }

  private checkProjectileCollisions() {
    for (let i = this.player.projectiles.length - 1; i >= 0; i--) {
      const projectile = this.player.projectiles[i]
      const projectileBounds = projectile.getBounds()

      for (let j = this.enemies.length - 1; j >= 0; j--) {
        const enemy = this.enemies[j]
        const enemyBounds = enemy.getBounds()

        if (this.isColliding(projectileBounds, enemyBounds)) {
          this.player.projectiles.splice(i, 1)
          
          const enemyDied = enemy.takeDamage(projectile.damage)
          this.damageNumbers.push(new DamageNumber(
            enemy.x,
            enemy.y,
            projectile.damage
          ))

          if (enemyDied) {
            this.dropXPCrystals(enemy.x, enemy.y)
            this.enemies.splice(j, 1)
          }
          break
        }
      }
    }
  }

  private isColliding(rect1: any, rect2: any): boolean {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y
  }

  private updateDamageNumbers(deltaTime: number) {
    this.damageNumbers = this.damageNumbers.filter(damageNumber => 
      damageNumber.update(deltaTime)
    )
  }

  private render() {
    this.renderer.clear()
    
    this.player.render(this.renderer)
    
    for (const projectile of this.player.projectiles) {
      projectile.render(this.renderer)
    }
    
    for (const enemy of this.enemies) {
      enemy.render(this.renderer)
    }

    for (const crystal of this.xpCrystals) {
      crystal.render(this.renderer)
    }

    for (const damageNumber of this.damageNumbers) {
      damageNumber.render(this.renderer)
    }

    this.hud.render(this.renderer, this.player, this.canvas.width, this.canvas.height)
    
    this.renderer.present()
  }

  private spawnEnemies(count: number) {
    for (let i = 0; i < count; i++) {
      // Spawn enemies away from player
      let x, y
      do {
        x = Math.random() * (this.canvas.width - 64) + 32
        y = Math.random() * (this.canvas.height - 64) + 32
        const dx = x - this.player.x
        const dy = y - this.player.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        if (distance > 100) break // Ensure minimum distance from player
      } while (true)
      
      this.enemies.push(new Enemy(x, y))
    }
  }

  private dropXPCrystals(x: number, y: number) {
    const crystalCount = 3 + Math.floor(Math.random() * 3) // 3-5 crystals
    
    for (let i = 0; i < crystalCount; i++) {
      this.xpCrystals.push(new XPCrystal(x, y))
    }
  }

  private updateXPCrystals(deltaTime: number) {
    const attractionRadius = this.player.pickupRadius * 2 // Attraction starts at 2x pickup radius
    this.xpCrystals.forEach(crystal => 
      crystal.update(deltaTime, this.player.x, this.player.y, attractionRadius)
    )
  }

  private checkXPCrystalPickup() {
    for (let i = this.xpCrystals.length - 1; i >= 0; i--) {
      const crystal = this.xpCrystals[i]
      const dx = crystal.x - this.player.x
      const dy = crystal.y - this.player.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      if (distance <= this.player.pickupRadius) {
        this.player.gainXP(crystal.xpValue)
        this.xpCrystals.splice(i, 1)
      }
    }
  }

  private updateEnemySpawning(deltaTime: number) {
    this.enemySpawnTimer += deltaTime
    
    if (this.enemySpawnTimer >= this.enemySpawnInterval) {
      this.spawnEnemies(5)
      this.enemySpawnTimer = 0
    }
  }
}