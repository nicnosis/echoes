import { Renderer } from '../render/Renderer'
import { InputManager } from '../input/InputManager'
import { Player } from './Player'
import { Enemy } from './Enemy'
import { Soma } from './Soma'
import { SpawnManager } from './SpawnManager'
import { UnifiedUI, UIScreen } from '../ui/components/UnifiedUI'
import { HUD } from '../ui/components/HUD'
import { FloatingText } from './FloatingText'

enum GamePhase {
  WAVE = 'wave',
  LEVELUP = 'levelup',
  SHOP = 'shop'
}

export class Game {
  // Core systems
  private canvas: HTMLCanvasElement
  private renderer: Renderer
  private inputManager: InputManager
  
  // Game state
  private gamePhase: GamePhase = GamePhase.WAVE
  private paused: boolean = false
  private running: boolean = false
  
  // Wave state
  private waveIndex: number = 0
  private waveTimer: number = 0
  private waveLevelStartedAt: number = 0
  private levelUpCredits: number = 0
  
  // Game objects
  private player: Player
  private enemies: Enemy[] = []
  private somaList: Soma[] = []
  private floatingTexts: FloatingText[] = []
  
  // Systems
  private spawnManager: SpawnManager
  
  // UI - Single unified interface
  private ui: UnifiedUI
  
  // HUD for wave gameplay
  private hud: HUD
  
  // Game loop timing
  private lastTime: number = 0

  // Wave configuration (keeping existing timings)
  private waveData = [
    { wave: 1, duration: 10 }, //its 20 but i want to test it out
    { wave: 2, duration: 10 }, //its 25 but i want to test it out
    { wave: 3, duration: 30 },
    { wave: 4, duration: 35 },
    { wave: 5, duration: 40 },
    { wave: 6, duration: 50 },
    { wave: 7, duration: 60 },
    { wave: 8, duration: 60 },
    { wave: 9, duration: 60 },
    { wave: 10, duration: 60 },
    { wave: 11, duration: 60 },
    { wave: 12, duration: 60 },
    { wave: 13, duration: 60 },
    { wave: 14, duration: 75 },
    { wave: 15, duration: 60 },
    { wave: 16, duration: 60 },
    { wave: 17, duration: 60 },
    { wave: 18, duration: 60 },
    { wave: 19, duration: 60 },
    { wave: 20, duration: 60 },
    { wave: 21, duration: 90 }
  ]

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.renderer = new Renderer(canvas)
    this.inputManager = new InputManager()
    
    // Initialize player
    this.player = new Player(canvas.width / 2, canvas.height / 2)
    
    // Initialize systems
    this.spawnManager = new SpawnManager(canvas.width, canvas.height)
    
    // Initialize unified UI
    this.ui = new UnifiedUI()
    
    // Initialize HUD
    this.hud = new HUD()
    
    // Connect UI event handlers
    this.setupUICallbacks()
    
    // Setup input listeners
    this.setupEventListeners()
    
    console.log('🎮 Game initialized with unified UI and HUD')
  }

  // =============================================================================
  // UI CALLBACK SETUP
  // =============================================================================

  private setupUICallbacks(): void {
    // Level up selection callback
    this.ui.onLevelUpSelection = (statBonus: Record<string, number>) => {
      this.onLevelUpSelection(statBonus)
    }
    
    // Shop "Go Wave" callback
    this.ui.onGoWave = () => {
      this.onGoWaveClicked()
    }
    
    // Pause resume callback
    this.ui.onResume = () => {
      this.onPauseToggle()
    }
  }

  // =============================================================================
  // MAIN GAME LOOP
  // =============================================================================

  start(): void {
    this.running = true
    this.beginWave()
    this.gameLoop(0)
    console.log('🚀 Game started')
  }

  private gameLoop = (currentTime: number): void => {
    if (!this.running) return

    const deltaTime = currentTime - this.lastTime
    this.lastTime = currentTime

    this.update(deltaTime)
    this.render()
    
    requestAnimationFrame(this.gameLoop)
  }

  private update(deltaTime: number): void {
    if (this.paused) return
    
    // Phase-based update logic
    switch (this.gamePhase) {
      case GamePhase.WAVE:
        this.updateWave(deltaTime)
        break
      case GamePhase.LEVELUP:
        this.updateLevelUp(deltaTime)
        break
      case GamePhase.SHOP:
        this.updateShop(deltaTime)
        break
    }
  }

  private render(): void {
    // Clear canvas
    this.renderer.clear()
    
    // Render game objects in draw order
    // Soma (drawOrder: 50) - on ground, behind everything
    this.somaList.forEach(soma => soma.render(this.renderer))
    
    // Enemies (drawOrder: 100)
    this.enemies.forEach(enemy => enemy.render(this.renderer))
    
    // Player (drawOrder: 205-220)
    this.player.render(this.renderer)
    
    // Projectiles (drawOrder: 300) - flying above characters
    for (const projectile of this.player.projectiles) {
      projectile.render(this.renderer)
    }
    
    // Spawn manager indicators (should be high like debug)
    this.spawnManager.render(this.renderer)
    
    // Render floating texts
    this.floatingTexts.forEach(floatingText => floatingText.render(this.renderer))
    
    // Render wave timer during wave phase
    if (this.gamePhase === GamePhase.WAVE && this.waveIndex < this.waveData.length) {
      const timerText = `Wave ${this.waveData[this.waveIndex].wave}: ${Math.ceil(this.waveTimer)}s`
      this.renderer.drawText(
        timerText,
        this.canvas.width / 2 - 80,
        48,
        '#fff',
        'bold 36px Arial'
      )
    }
    
    // UI is handled by HTML/CSS overlays via UnifiedUI
    this.renderer.present()
  }

  // =============================================================================
  // PHASE-SPECIFIC UPDATE METHODS
  // =============================================================================

  private updateWave(deltaTime: number): void {
    // Update wave timer - deltaTime is already in milliseconds
    this.waveTimer -= deltaTime / 1000
    this.ui.updateWaveTimer(this.waveTimer)
    
    // Spawn enemies using the spawn manager
    const spawnResult = this.spawnManager.update(deltaTime, this.player, this.enemies)
    this.enemies.push(...spawnResult.newEnemies)
    
    // Create floating text for blocked spawns
    spawnResult.blockedSpawns.forEach(blockedSpawn => {
      this.floatingTexts.push(new FloatingText(blockedSpawn.x, blockedSpawn.y - 20, 0, false, 'Spawn Blocked'))
    })
    
    // Update game objects
    this.updateEnemies(deltaTime)
    this.updateSoma(deltaTime)
    this.updateFloatingTexts(deltaTime)
    this.player.update(deltaTime, this.inputManager.inputState, this.canvas.width, this.canvas.height, this.enemies)
    
    // Update HUD during wave gameplay
    this.hud.update(this.player)
    
    // Check collisions
    this.checkCollisions()
    
    // Check wave end condition
    if (this.waveTimer <= 0) {
      this.endWave()
    }
  }

  private updateLevelUp(deltaTime: number): void {
    // Level up screen handles its own logic via UnifiedUI
    // Player cannot move during level up
    // Only update damage flash and invulnerability timers
    if (this.player.damageFlashTimer > 0) {
      this.player.damageFlashTimer -= deltaTime
    }
    if (this.player.invulnerabilityTimer > 0) {
      this.player.invulnerabilityTimer -= deltaTime
      if (this.player.invulnerabilityTimer <= 0) {
        this.player.isInvulnerable = false
      }
    }
  }

  private updateShop(deltaTime: number): void {
    // Shop screen handles its own logic via UnifiedUI  
    // Player cannot move during shop
    // Only update damage flash and invulnerability timers
    if (this.player.damageFlashTimer > 0) {
      this.player.damageFlashTimer -= deltaTime
    }
    if (this.player.invulnerabilityTimer > 0) {
      this.player.invulnerabilityTimer -= deltaTime
      if (this.player.invulnerabilityTimer <= 0) {
        this.player.isInvulnerable = false
      }
    }
  }

  // =============================================================================
  // CLEANUP METHODS
  // =============================================================================

  // Comprehensive cleanup of all game objects at wave end
  private cleanup(): void {
    // Reset player position to center
    this.player.x = this.canvas.width / 2
    this.player.y = this.canvas.height / 2
    
    // Clear all game objects
    this.enemies = []
    this.somaList = []
    this.floatingTexts = []
    
    // Clear spawn manager indicators and reset state
    this.spawnManager.cleanup()
    
    // Clear any projectiles
    this.player.projectiles = []
    
    console.log('🧹 Game objects cleaned up')
  }

  // =============================================================================
  // PHASE TRANSITION METHODS
  // =============================================================================

  private beginWave(): void {
    console.log(`🌊 Starting Wave ${this.waveIndex + 1}`)
    
    // Set phase
    this.gamePhase = GamePhase.WAVE
    
    // Initialize wave state
    this.waveLevelStartedAt = this.player.stats.level
    this.waveTimer = this.getWaveDuration(this.waveIndex)
    
    // Recalculate stats and heal to full for wave start
    this.player.stats.recalculateStats(this.player.body)
    this.player.heal()
    
    // Configure spawn manager for this wave (assuming this method exists)
    // this.spawnManager.configureWave(this.waveIndex)
    
    // Update UI - hide all menus, show HUD
    this.ui.hide()
    this.ui.showHUD()
    this.ui.updateWaveInfo(this.waveIndex + 1, this.waveTimer)
    this.ui.updateStats(this.player)
    
    console.log(`⏱️ Wave duration: ${this.waveTimer}s, Starting level: ${this.waveLevelStartedAt}`)
  }

  private endWave(): void {
    console.log(`✅ Wave ${this.waveIndex + 1} completed`)
    
    // Calculate level up credits before cleanup
    const currentLevel = this.player.stats.level
    this.levelUpCredits = currentLevel - this.waveLevelStartedAt
    
    // Comprehensive cleanup of all game objects
    this.cleanup()
    
    // Recalculate stats and heal to full for wave end
    this.player.stats.recalculateStats(this.player.body)
    this.player.heal()
    
    console.log(`📊 Level ups gained: ${this.levelUpCredits}`)
    
    // Determine next phase
    if (this.levelUpCredits > 0) {
      this.beginLevelUp()
    } else {
      this.beginShop()
    }
  }

  private beginLevelUp(): void {
    console.log(`📈 Level Up Phase (${this.levelUpCredits} credits remaining)`)
    
    // Set phase
    this.gamePhase = GamePhase.LEVELUP
    
    // Switch to level up UI
    this.ui.switchUI(UIScreen.LEVELUP)
    this.ui.updateLevelUpInfo(this.levelUpCredits)
    this.ui.updateStats(this.player)
  }

  private beginShop(): void {
    console.log(`🛒 Shop Phase (preparing for Wave ${this.waveIndex + 2})`)
    
    // Set phase
    this.gamePhase = GamePhase.SHOP
    
    // Switch to shop UI
    this.ui.switchUI(UIScreen.SHOP)
    this.ui.updateShopInfo(this.waveIndex + 2, this.player.stats.getStat('soma') || 0)
    this.ui.updateStats(this.player)
  }

  // =============================================================================
  // GAME OBJECT UPDATE METHODS
  // =============================================================================

  private updateEnemies(deltaTime: number): void {
    this.enemies.forEach(enemy => {
      enemy.update(deltaTime, this.player)
    })
    
    // Remove enemies that have completed their death animation
    this.enemies = this.enemies.filter(enemy => !enemy.isDeathAnimationComplete())
  }

  private updateSoma(deltaTime: number): void {
    const attractionRadius = this.player.pickupRadius // Attraction starts at pickup radius
    
    this.somaList.forEach(soma => {
      soma.update(deltaTime) // Update scatter animation

      const dx = this.player.x - soma.x
      const dy = this.player.y - soma.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      if (!soma.collected && distance <= attractionRadius) {
        // Attract Soma to player center
        const attractionForce = 600
        const dt = deltaTime / 1000
        const dirX = dx / (distance || 1)
        const dirY = dy / (distance || 1)
        soma.x += dirX * attractionForce * dt
        soma.y += dirY * attractionForce * dt
      }
    })
    
    // Remove collected soma (no expiration mechanism in Soma class)
    this.somaList = this.somaList.filter(soma => !soma.collected)
  }

  private updateFloatingTexts(deltaTime: number): void {
    // Update floating texts and remove expired ones
    this.floatingTexts = this.floatingTexts.filter(floatingText => floatingText.update(deltaTime))
  }

  private checkCollisions(): void {
    // Player vs Soma (collection) - using existing logic from old game
    for (let i = this.somaList.length - 1; i >= 0; i--) {
      const soma = this.somaList[i]
      const dx = soma.x - this.player.x
      const dy = soma.y - this.player.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      if (!soma.collected && distance <= 8) { // 8px threshold for center
        const { soma: somaValue } = soma.collect()
        const leveledUp = this.player.gainXP(somaValue)
        
        // Increment soma currency (core stat)
        const currentSoma = this.player.stats.getStat('soma') || 0
        this.player.stats.setBaseStat('soma', currentSoma + somaValue)
        this.somaList.splice(i, 1)
        
        // Update UI after collecting soma
        this.ui.updateStats(this.player)
        
        // Only log level ups, not every soma pickup
        if (leveledUp) {
          console.log(`🎉 LEVEL UP! Now level ${this.player.stats.level}`)
          // Create floating text for level up
          this.floatingTexts.push(new FloatingText(this.player.x, this.player.y - 30, 0, false, 'Level Up!'))
        }
      }
    }
    
    // Player projectiles vs Enemies
    this.checkProjectileCollisions()
    
    // Player vs Enemies (damage)
    this.enemies.forEach(enemy => {
      if (enemy.isDying()) return // Can't damage player while dying
      
      // Rectangle collision detection  
      const enemyLeft = enemy.x - enemy.width / 2
      const enemyRight = enemy.x + enemy.width / 2
      const enemyTop = enemy.y - enemy.height / 2
      const enemyBottom = enemy.y + enemy.height / 2

      const playerLeft = this.player.x - this.player.width / 2
      const playerRight = this.player.x + this.player.width / 2
      const playerTop = this.player.y - this.player.height / 2
      const playerBottom = this.player.y + this.player.height / 2

      if (enemyLeft < playerRight && enemyRight > playerLeft &&
          enemyTop < playerBottom && enemyBottom > playerTop) {
        // Check damage cooldown
        const currentTime = Date.now()
        if (currentTime - enemy.lastDamageTime >= enemy.damageCooldown) {
          // Get actual damage dealt (0 if blocked/dodged, actual amount if dealt)
          const damageDealt = this.player.takeDamage(1)
          
          if (damageDealt > 0) {
            console.log(`Player took ${damageDealt} damage! Creating floating text`)
            // Create floating text for player damage
            this.floatingTexts.push(new FloatingText(this.player.x, this.player.y - 30, damageDealt, false, undefined, true))
          }
          
          enemy.lastDamageTime = currentTime
        }
      }
    })
    
    // TODO: Enemy projectiles vs Player
  }

  // =============================================================================
  // EVENT HANDLERS (called by UnifiedUI)
  // =============================================================================

  public onLevelUpSelection(statBonus: Record<string, number>): void {
    console.log(`📈 Level up selection:`, statBonus)
    
    // Apply stat bonus using player's selectLevelUpBonus method
    // Convert our statBonus format to the player's expected format
    const statKeys = Object.keys(statBonus)
    if (statKeys.length > 0) {
      const statName = statKeys[0] // Take the first stat
      this.player.selectLevelUpBonus(statName)
    }
    
    // Decrement credits
    this.levelUpCredits--
    
    // Update UI
    this.ui.updateStats(this.player)
    
    // Check if level up phase is complete
    if (this.levelUpCredits <= 0) {
      this.levelUpCredits = 0
      this.beginShop()
    } else {
      // Update level up screen with remaining credits
      this.ui.updateLevelUpInfo(this.levelUpCredits)
    }
  }

  public onGoWaveClicked(): void {
    console.log(`🚀 Starting next wave`)
    
    this.waveIndex++
    this.beginWave()
  }

  public onPauseToggle(): void {
    this.paused = !this.paused
    
    if (this.paused) {
      this.ui.switchUI(UIScreen.PAUSE)
      this.ui.updateStats(this.player)
      console.log('⏸️ Game paused')
    } else {
      this.ui.hide()
      this.ui.showHUD()
      console.log('▶️ Game resumed')
    }
  }

  private checkProjectileCollisions(): void {
    for (let i = this.player.projectiles.length - 1; i >= 0; i--) {
      const projectile = this.player.projectiles[i]
      // Use center-based collision for 'fully inside' logic
      for (let j = this.enemies.length - 1; j >= 0; j--) {
        const enemy = this.enemies[j]
        if (enemy.isDying()) continue // Skip dying enemies

        const dx = projectile.x - enemy.x
        const dy = projectile.y - enemy.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        const enemyRadius = Math.min(enemy.width, enemy.height) / 2 // Use smaller dimension as radius
        if (distance <= enemyRadius - projectile.size / 2) {
          this.player.projectiles.splice(i, 1)
          // Critical hit logic
          let isCrit = false
          let damage = projectile.damage
          const critChance = this.player.stats.getStat('critChance') || 0
          if (Math.random() * 100 < critChance) {
            isCrit = true
            damage *= 2
          }
          const enemyDied = enemy.takeDamage(damage)
          
          // Create floating text for enemy damage
          this.floatingTexts.push(new FloatingText(enemy.x, enemy.y - 20, damage, isCrit))
          
          if (enemyDied) {
            this.dropSoma(enemy.x, enemy.y)
          }
          break
        }
      }
    }
  }

  private dropSoma(x: number, y: number): void {
    // Create soma drops when enemies die
    const somaCount = 50 + Math.floor(Math.random() * 3) // 50-52 Soma
    const angleStep = (Math.PI * 2) / somaCount
    const baseAngle = Math.random() * Math.PI * 2
    
    for (let i = 0; i < somaCount; i++) {
      // Spread in a small arc/circle with random offset
      const angle = baseAngle + i * angleStep + (Math.random() - 0.5) * 0.4
      const distance = 20 + Math.random() * 10
      const targetX = x + Math.cos(angle) * distance
      const targetY = y + Math.sin(angle) * distance
      // Create Soma with scatter animation from center to target position
      this.somaList.push(new Soma(x, y, 1, targetX, targetY))
    }
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  private getWaveDuration(waveIndex: number): number {
    // Use existing wave data if available, otherwise use formula
    if (waveIndex < this.waveData.length) {
      return this.waveData[waveIndex].duration
    }
    // Fallback formula: 30 seconds base + 5 seconds per wave
    return 30 + (waveIndex * 5)
  }

  private cleanupSoma(): void {
    // For now, just remove all remaining soma
    // TODO: Could auto-collect remaining soma with reduced value
    this.somaList = []
  }

  private checkCollision(obj1: any, obj2: any): boolean {
    // Simple circular collision detection
    const dx = obj1.x - obj2.x
    const dy = obj1.y - obj2.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    const minDistance = (obj1.radius || 20) + (obj2.radius || 10)
    
    return distance < minDistance
  }

  private setupEventListeners(): void {
    // Escape key for pause - only during wave phase
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape' && this.gamePhase === GamePhase.WAVE) {
        this.onPauseToggle()
      }
    })
  }

  // =============================================================================
  // PUBLIC GETTERS (for debugging/external access)
  // =============================================================================

  public getCurrentPhase(): GamePhase {
    return this.gamePhase
  }

  public getWaveIndex(): number {
    return this.waveIndex
  }

  public getWaveTimer(): number {
    return this.waveTimer
  }

  public getPlayer(): Player {
    return this.player
  }

  public isPaused(): boolean {
    return this.paused
  }
}