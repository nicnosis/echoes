import { Renderer } from '../render/Renderer'
import { InputManager } from '../input/InputManager'
import { Player } from './Player'
import { Enemy } from './Enemy'
import { DamageNumber } from './DamageNumber'
import { Soma } from './Soma'
import { HUD } from '../ui/components/HUD'
import { PauseScreen } from '../ui/components/PauseScreen'
import { LevelUpScreen, LevelUpChoice } from '../ui/components/LevelUpScreen'
import { SpawnManager } from './SpawnManager'

export class Game {
  private canvas: HTMLCanvasElement
  private renderer: Renderer
  private inputManager: InputManager
  private running = false
  private lastTime = 0
  private player: Player
  private enemies: Enemy[] = []
  private damageNumbers: DamageNumber[] = []
  private somaList: Soma[] = []
  private hud: HUD
  private pauseScreen: PauseScreen
  private levelUpScreen: LevelUpScreen
  private spawnManager: SpawnManager
  
  private levelsGained: number = 0;
  private waveStartLevel: number = 0;
  private waveIndex: number = 0;
  private waveTimer: number = 0;
  private levelsToProcess: number = 0;
  private isLevelUpActive: boolean = false;
  private waveData = [
    { wave: 1, duration: 10 }, //its 20 but i want to test it out
    { wave: 2, duration: 25 },
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
  ];
  private paused: boolean = false;
  
  // Game state structure
  public gameState = {
    currentWave: 1,
    maxWaves: 21,
    enemies: [] as Enemy[],
    pickups: [] as Soma[],
    gamePhase: 'combat' as 'combat' | 'shop' | 'levelup',
    shopState: {
      items: [],
      lockedItems: [],
      rerollCost: 10
    }
  }

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.renderer = new Renderer(canvas)
    this.inputManager = new InputManager()
    this.player = new Player(canvas.width / 2, canvas.height / 2)
    this.hud = new HUD()
    this.pauseScreen = new PauseScreen()
    this.levelUpScreen = new LevelUpScreen()
    this.spawnManager = new SpawnManager(canvas.width, canvas.height)
    
    // No initial enemies - let the spawn manager handle spawning
    this.levelsGained = 0;
    this.waveIndex = 0;
    this.waveTimer = this.waveData[0].duration;
    
    // Start first wave
    this.startWave();
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape') {
        this.togglePause();
      }
    });
    
    // Listen for restart event from pause screen
    window.addEventListener('gameRestart', () => {
      this.restart();
    });
  }

  start() {
    if (this.running) return
    this.running = true
    this.gameLoop(0)
  }

  stop() {
    this.running = false
  }

  togglePause() {
    this.paused = !this.paused;
    if (this.paused) {
      this.pauseScreen.show();
      this.pauseScreen.update(this.player);
    } else {
      this.pauseScreen.hide();
    }
  }

  restart() {
    // Reset game state
    this.player = new Player(this.canvas.width / 2, this.canvas.height / 2)
    this.enemies = []
    this.damageNumbers = []
    this.somaList = []
    this.levelsGained = 0
    this.waveStartLevel = 0
    this.waveIndex = 0
    this.waveTimer = this.waveData[0].duration
    this.paused = false
    this.isLevelUpActive = false
    this.levelsToProcess = 0
    
    // Hide UI screens
    this.pauseScreen.hide()
    this.levelUpScreen.hide()
    
    // Reset spawn manager
    this.spawnManager = new SpawnManager(this.canvas.width, this.canvas.height)
    
    // Start first wave
    this.startWave()
  }



  private gameLoop = (currentTime: number) => {
    if (!this.running) return

    const deltaTime = currentTime - this.lastTime
    this.lastTime = currentTime

    if (!this.paused && !this.isLevelUpActive) {
      this.update(deltaTime)
    }
    this.render()

    requestAnimationFrame(this.gameLoop)
  }

  private update(deltaTime: number) {
    const prevLevel = this.player.level;
    console.log(`🎮 Player HP: ${this.player.currentHP}, Flash Timer: ${this.player.damageFlashTimer > 0 ? 'FLASHING ⚡' : 'normal'}`);
    this.player.update(deltaTime, this.inputManager.inputState, this.canvas.width, this.canvas.height, this.enemies)
    
    for (const enemy of this.enemies) {
      enemy.update(deltaTime, this.player)
    }
    
    // Process damage events from player
    const damageEvents = this.player.getDamageEvents()
    for (const event of damageEvents) {
      console.log(`💥 PLAYER DAMAGE EVENT! Creating damage number: -${event.amount} at (${this.player.x}, ${this.player.y - this.player.radius - 20})`);
      console.log(`📊 Damage numbers before: ${this.damageNumbers.length}`);
      this.damageNumbers.push(new DamageNumber(
        this.player.x,
        this.player.y - this.player.radius - 20,
        event.amount,
        false, // not a crit
        `-${event.amount}`,
        true // is player damage (red)
      ));
      console.log(`📊 Damage numbers after: ${this.damageNumbers.length}`);
    }
    // Check if player leveled up this frame
    const currentLevel = this.player.level;
    if (currentLevel > this.waveStartLevel + this.levelsGained) {
      this.levelsGained++;
      this.damageNumbers.push(new DamageNumber(
        this.player.x,
        this.player.y - this.player.radius - 30,
        0,
        false, // not a crit
        'Level Up!'
      ));
    }

    // Remove enemies that have completed their death animation
    this.enemies = this.enemies.filter(enemy => !enemy.isDeathAnimationComplete())

    this.updateSoma(deltaTime)
    this.checkProjectileCollisions()
    this.checkSomaPickup()
    this.updateDamageNumbers(deltaTime)
    
    // Update HUD
    this.hud.update(this.player)
    
    // Use new spawn manager (only if wave timer hasn't ended)
    if (this.waveTimer > 0) {
      const newEnemies = this.spawnManager.update(deltaTime, this.player, this.enemies)
      this.enemies.push(...newEnemies)
    }
    
    // Debug logging for spawn system
    const totalEnemies = this.spawnManager.getCurrentTotalEnemyCount(this.enemies)
    const spawnProb = this.spawnManager.getCurrentSpawnProbability()
    const missedBonus = this.spawnManager.getMissedSpawnBonus()
    console.log(`🎯 Spawn System: ${totalEnemies} total enemies, ${spawnProb.toFixed(2)} spawn probability, ${missedBonus.toFixed(2)} missed bonus`)
    // Update wave timer and check for wave end
    if (this.waveIndex < this.waveData.length && !this.isLevelUpActive) {
      this.waveTimer -= deltaTime / 1000;
      if (this.waveTimer < 0) {
        this.waveTimer = 0;
      }
      this.checkWaveEnd();
    }
    
    // Debug: Log player level and XP occasionally
    if (Math.random() < 0.01) { // ~1% chance per frame
      console.log(`🎯 Player Level: ${this.player.level}, XP: ${this.player.currentXP}/${this.player.xpToNextLevel}, Levels Gained: ${this.levelsGained}`);
    }
  }

  private checkProjectileCollisions() {
    for (let i = this.player.projectiles.length - 1; i >= 0; i--) {
      const projectile = this.player.projectiles[i]
      // Use center-based collision for 'fully inside' logic
      for (let j = this.enemies.length - 1; j >= 0; j--) {
        const enemy = this.enemies[j]
        if (enemy.isDying()) continue // Skip dying enemies
        
        const dx = projectile.x - enemy.x;
        const dy = projectile.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance <= enemy.radius - projectile.size / 2) {
          this.player.projectiles.splice(i, 1)
          // Critical hit logic
          let isCrit = false;
          let damage = projectile.damage;
          if (Math.random() * 100 < this.player.critChance) {
            isCrit = true;
            damage *= 2;
          }
          const enemyDied = enemy.takeDamage(damage)
          this.damageNumbers.push(new DamageNumber(
            enemy.x,
            enemy.y,
            damage,
            isCrit
          ))
          if (enemyDied) {
            this.dropSoma(enemy.x, enemy.y)
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

    for (const soma of this.somaList) {
      soma.render(this.renderer)
    }

    // Render spawn manager (pre-spawn indicators)
    this.spawnManager.render(this.renderer)

    console.log(`🎯 Rendering ${this.damageNumbers.length} damage numbers this frame`);
    for (const damageNumber of this.damageNumbers) {
      damageNumber.render(this.renderer)
    }

    // HUD is now handled by HTML/CSS overlay
    
    // Draw wave timer at top center
    if (this.waveIndex < this.waveData.length) {
      const timerText = `Wave ${this.waveData[this.waveIndex].wave}: ${Math.ceil(this.waveTimer)}s`;
      this.renderer.drawText(
        timerText,
        this.canvas.width / 2 - 80,
        48,
        '#fff',
        'bold 36px Arial'
      );
    }
    // Pause screen is handled by HTML/CSS overlay
    this.renderer.present()
  }





  private dropSoma(x: number, y: number) {
    const somaCount = 3 + Math.floor(Math.random() * 3) // 3-5 Soma
    const angleStep = (Math.PI * 2) / somaCount;
    const baseAngle = Math.random() * Math.PI * 2;
    for (let i = 0; i < somaCount; i++) {
      // Spread in a small arc/circle with random offset
      const angle = baseAngle + i * angleStep + (Math.random() - 0.5) * 0.4;
      const distance = 20 + Math.random() * 10;
      const targetX = x + Math.cos(angle) * distance;
      const targetY = y + Math.sin(angle) * distance;
      // Create Soma with scatter animation from center to target position
      this.somaList.push(new Soma(x, y, 1, 1, targetX, targetY));
    }
  }

  private updateSoma(deltaTime: number) {
    const attractionRadius = this.player.pickupRadius // Attraction starts at pickup radius
    this.somaList.forEach(soma => {
      soma.update(deltaTime); // Update scatter animation
      
      const dx = this.player.x - soma.x;
      const dy = this.player.y - soma.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (!soma.collected && distance <= attractionRadius) {
        // Attract Soma to player center
        const attractionForce = 600;
        const dt = deltaTime / 1000;
        const dirX = dx / (distance || 1);
        const dirY = dy / (distance || 1);
        soma.x += dirX * attractionForce * dt;
        soma.y += dirY * attractionForce * dt;
      }
    });
  }

  private checkSomaPickup() {
    for (let i = this.somaList.length - 1; i >= 0; i--) {
      const soma = this.somaList[i];
      const dx = soma.x - this.player.x;
      const dy = soma.y - this.player.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (!soma.collected && distance <= 8) { // 8px threshold for center
        const { soma: somaValue, gold } = soma.collect();
        this.player.gainXP(somaValue);
        this.player.gainGold(gold);
        this.somaList.splice(i, 1);
      }
    }
  }

  // Wave management methods
  private startWave() {
    if (this.waveIndex < this.waveData.length) {
      this.waveStartLevel = this.player.level;
      this.levelsGained = 0;
      this.waveTimer = this.waveData[this.waveIndex].duration;
      // SpawnManager handles spawning automatically, no need to call startWave
    }
  }

  private endWave() {
    // Check for level ups
    console.log(`🎯 Wave ended! Player level: ${this.player.level}, Levels gained: ${this.levelsGained}`);
    
    if (this.levelsGained > 0) {
      console.log(`🎯 Showing level up screen for ${this.levelsGained} levels`);
      this.levelsToProcess = this.levelsGained;
      this.isLevelUpActive = true;
      this.levelUpScreen.show(this.levelsGained, (choice: LevelUpChoice) => {
        this.handleLevelUpChoice(choice);
      }, () => {
        this.handleContinueToNextWave();
      });
    } else {
      console.log(`🎯 No level ups, going to next wave`);
      // No level ups, go to next wave
      this.nextWave();
    }
  }

  private handleLevelUpChoice(choice: LevelUpChoice) {
    this.player.levelUpWithChoice(choice.stat);
    this.levelsToProcess--;
    
    if (this.levelsToProcess <= 0) {
      // All level ups processed, show continue button
      this.levelUpScreen.showContinueButton();
    }
  }
  
  private handleContinueToNextWave() {
    this.isLevelUpActive = false;
    this.levelUpScreen.hide();
    this.nextWave();
  }

  private nextWave() {
    this.waveIndex++;
    if (this.waveIndex < this.waveData.length) {
      this.startWave();
    } else {
      // Game completed
      console.log('Game completed!');
      this.stop();
    }
  }

  // Check if wave should end
  private checkWaveEnd() {
    if (this.waveTimer <= 0) {
      this.endWave();
    }
  }
}