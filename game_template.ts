import { Renderer } from '../render/Renderer'
import { InputManager } from '../input/InputManager'
import { Player } from './Player'
import { Enemy } from './Enemy'
import { Soma } from './Soma'
import { SpawnManager } from './SpawnManager'
import { UnifiedUI, UIScreen } from '../ui/components/UnifiedUI'

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
  
  // Systems
  private spawnManager: SpawnManager
  
  // UI - Single unified interface
  private ui: UnifiedUI

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
    
    // Connect UI event handlers
    this.setupUICallbacks()
    
    // Setup input listeners
    this.setupEventListeners()
    
    console.log('🎮 Game initialized with unified UI')
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
    this.gameLoop()
    console.log('🚀 Game started')
  }

  private gameLoop(): void {
    if (!this.running) return

    const deltaTime = 1/60 // 60 FPS
    
    this.update(deltaTime)
    this.render()
    
    requestAnimationFrame(() => this.gameLoop())
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
    
    // Render game objects (always visible)
    this.renderer.renderPlayer(this.player)
    this.enemies.forEach(enemy => this.renderer.renderEnemy(enemy))
    this.somaList.forEach(soma => this.renderer.renderSoma(soma))
    
    // UI is handled by HTML/CSS overlays via UnifiedUI
  }

  // =============================================================================
  // PHASE-SPECIFIC UPDATE METHODS
  // =============================================================================

  private updateWave(deltaTime: number): void {
    // Update wave timer
    this.waveTimer -= deltaTime
    this.ui.updateWaveTimer(this.waveTimer)
    
    // Spawn enemies
    this.spawnManager.update(deltaTime, this.enemies)
    
    // Update game objects
    this.updateEnemies(deltaTime)
    this.updateSoma(deltaTime)
    this.player.update(deltaTime)
    
    // Check collisions
    this.checkCollisions()
    
    // Check wave end condition
    if (this.waveTimer <= 0) {
      this.endWave()
    }
  }

  private updateLevelUp(deltaTime: number): void {
    // Level up screen handles its own logic via UnifiedUI
    // Player can still move around during level up
    this.player.update(deltaTime)
  }

  private updateShop(deltaTime: number): void {
    // Shop screen handles its own logic via UnifiedUI
    // Player can still move around during shop
    this.player.update(deltaTime)
  }

  // =============================================================================
  // PHASE TRANSITION METHODS
  // =============================================================================

  private beginWave(): void {
    console.log(`🌊 Starting Wave ${this.waveIndex + 1}`)
    
    // Set phase
    this.gamePhase = GamePhase.WAVE
    
    // Initialize wave state
    this.waveLevelStartedAt = this.player.stats.total.level
    this.waveTimer = this.getWaveDuration(this.waveIndex)
    
    // Reset player health to full (don't modify base stats!)
    this.player.stats.hp = this.player.stats.total.maxHP
    this.player.stats.updateAllStats()
    
    // Clear game objects
    this.enemies = []
    this.somaList = []
    
    // Configure spawn manager for this wave
    this.spawnManager.configureWave(this.waveIndex)
    
    // Update UI - hide all menus, show HUD
    this.ui.hide()
    this.ui.showHUD()
    this.ui.updateWaveInfo(this.waveIndex + 1, this.waveTimer)
    this.ui.updateStats(this.player.stats.total)
    
    console.log(`⏱️ Wave duration: ${this.waveTimer}s, Starting level: ${this.waveLevelStartedAt}`)
  }

  private endWave(): void {
    console.log(`✅ Wave ${this.waveIndex + 1} completed`)
    
    // Cleanup remaining objects
    this.cleanupSoma()
    this.enemies = []
    
    // Calculate level up credits
    const currentLevel = this.player.stats.total.level
    this.levelUpCredits = currentLevel - this.waveLevelStartedAt
    
    // Reset player health to full
    this.player.stats.hp = this.player.stats.total.maxHP
    this.player.stats.updateAllStats()
    
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
    
    // Update all stats
    this.player.stats.updateAllStats()
    
    // Switch to level up UI
    this.ui.switchUI(UIScreen.LEVELUP)
    this.ui.updateLevelUpInfo(this.levelUpCredits)
    this.ui.updateStats(this.player.stats.total)
  }

  private beginShop(): void {
    console.log(`🛒 Shop Phase (preparing for Wave ${this.waveIndex + 2})`)
    
    // Set phase
    this.gamePhase = GamePhase.SHOP
    
    // Update all stats
    this.player.stats.updateAllStats()
    
    // Switch to shop UI
    this.ui.switchUI(UIScreen.SHOP)
    this.ui.updateShopInfo(this.waveIndex + 2, this.player.stats.total.soma)
    this.ui.updateStats(this.player.stats.total)
  }

  // =============================================================================
  // GAME OBJECT UPDATE METHODS
  // =============================================================================

  private updateEnemies(deltaTime: number): void {
    this.enemies.forEach(enemy => {
      enemy.update(deltaTime, this.player)
    })
    
    // Remove dead enemies
    this.enemies = this.enemies.filter(enemy => enemy.isAlive())
  }

  private updateSoma(deltaTime: number): void {
    this.somaList.forEach(soma => {
      soma.update(deltaTime)
    })
    
    // Remove expired soma
    this.somaList = this.somaList.filter(soma => !soma.isExpired())
  }

  private checkCollisions(): void {
    // Player vs Soma (collection)
    this.somaList.forEach((soma, index) => {
      if (this.checkCollision(this.player, soma)) {
        // Collect soma
        const somaValue = soma.getValue()
        const leveledUp = this.player.stats.gainXP(somaValue)
        
        // Remove collected soma
        this.somaList.splice(index, 1)
        
        // Update UI
        this.ui.updateStats(this.player.stats.total)
        
        // console.log(`💎 Collected ${somaValue} soma${leveledUp ? ' - LEVEL UP!' : ''}`)
      }
    })
    
    // Player vs Enemies (damage)
    this.enemies.forEach(enemy => {
      if (this.checkCollision(this.player, enemy)) {
        // Apply damage to player
        const damage = enemy.getDamage()
        this.player.takeDamage(damage)
        
        // Update UI
        this.ui.updateStats(this.player.stats.total)
        
        console.log(`💥 Player took ${damage} damage`)
      }
    })
    
    // TODO: Player weapons vs Enemies
    // TODO: Enemy projectiles vs Player
  }

  // =============================================================================
  // EVENT HANDLERS (called by UnifiedUI)
  // =============================================================================

  public onLevelUpSelection(statBonus: Record<string, number>): void {
    console.log(`📈 Level up selection:`, statBonus)
    
    // Apply stat bonus
    this.player.stats.addLevelUpStats(statBonus)
    
    // Decrement credits
    this.levelUpCredits--
    
    // Update UI
    this.ui.updateStats(this.player.stats.total)
    
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
      this.ui.updateStats(this.player.stats.total)
      console.log('⏸️ Game paused')
    } else {
      this.ui.hide()
      this.ui.showHUD()
      console.log('▶️ Game resumed')
    }
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  private getWaveDuration(waveIndex: number): number {
    // Simple formula: 30 seconds base + 5 seconds per wave
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
    // Escape key for pause
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape') {
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

