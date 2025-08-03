import { Renderer } from '../render/Renderer'
import { InputManager } from '../input/InputManager'
import { Player } from './Player'
import { Enemy } from './Enemy'
import { DamageNumber } from './DamageNumber'
import { Soma } from './Soma'
import { HUD } from '../ui/components/HUD'
import { PauseScreen } from '../ui/components/PauseScreen'
import { LevelUpScreen, LevelUpChoice } from '../ui/components/LevelUpScreen'
import { ShopScreen } from '../ui/components/ShopScreen'
import { StatsPanel } from '../ui/components/StatsPanel'
import { SpawnManager } from './SpawnManager'
import { DebugSystem } from '../utils/Debug'

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
    private shopScreen!: ShopScreen
    private spawnManager: SpawnManager
    private statsPanel: StatsPanel
    private debugSystem: DebugSystem

    private levelsGained: number = 0;
    private waveStartLevel: number = 0;
    private waveIndex: number = 0;
    private waveTimer: number = 0;
    private levelsToProcess: number = 0;
    private currentSelection: number = 0;
    private isLevelUpActive: boolean = false;
    private isShopActive: boolean = false;
   
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
        this.shopScreen = new ShopScreen()
        this.statsPanel = StatsPanel.getInstance()
        this.spawnManager = new SpawnManager(canvas.width, canvas.height)
        this.debugSystem = new DebugSystem()
        
        // ===== DEBUG SYSTEM INITIALIZATION =====
        // Initialize debug system with callbacks and global variables
        this.debugSystem.initialize(
            () => this.restart(), // Q key callback
            () => { this.waveTimer = 0; } // E key callback
        );
        this.debugSystem.setupGlobalDebug(this.player, this);

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

        // ===== DEBUG SYSTEM =====
        // This creates global debug variables accessible from browser console
        // To disable debugging, comment out or remove this entire section
        // 
        // Usage from browser console:
        // - myPlayer - Direct access to player instance
        // - myEnemies - Array of current enemies
        // - myGame - Game instance
        (window as any).myPlayer = this.player;
        // (window as any).myEnemies = this.enemies;
        (window as any).myGame = this;

        // console.log('🔧 Debug system initialized! Global variables available:');
        // console.log('  - myPlayer - Player instance');
        // console.log('  - myEnemies - Array of enemies');
        // console.log('  - myGame - Game instance');
        // console.log('📖 Try typing "myPlayer" in console to see player object');
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
        // Only allow pause during active combat (not during shop, level up, or other screens)
        if (this.isShopActive || this.isLevelUpActive) {
            console.log('⏸️ Pause blocked: not in combat state');
            return;
        }

        this.paused = !this.paused;
        if (this.paused) {
            //   console.log('⏸️ Game paused');
            this.pauseScreen.show();
            // Update stats when showing pause screen
            this.updateAllStats()
            this.pauseScreen.update(this.player);
        } else {
            //   console.log('▶️ Game resumed');
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
        this.isShopActive = false
        this.levelsToProcess = 0
        this.currentSelection = 0

        // Hide UI screens
        this.pauseScreen.hide()
        this.levelUpScreen.hide()
        this.shopScreen.hide()

        // Reset spawn manager
        this.spawnManager = new SpawnManager(this.canvas.width, this.canvas.height)

        // Update global debug variables with new instances
        this.debugSystem.setupGlobalDebug(this.player, this);

        // Start first wave
        this.startWave()
    }



    private gameLoop = (currentTime: number) => {
        if (!this.running) return

        const deltaTime = currentTime - this.lastTime
        this.lastTime = currentTime

        if (!this.paused && !this.isLevelUpActive && !this.isShopActive) {
            this.update(deltaTime)
        }
        this.render()

        requestAnimationFrame(this.gameLoop)
    }

    private update(deltaTime: number) {
        // ===== DEBUG SYSTEM UPDATE =====
        // Update debug system with current game state
        const isCombatPhase = !this.isShopActive && !this.isLevelUpActive && !this.paused;
        this.debugSystem.update(deltaTime, isCombatPhase);
        
        const prevLevel = this.player.stats.level;
        // console.log(`🎮 Player HP: ${this.player.currentHP}, Flash Timer: ${this.player.damageFlashTimer > 0 ? 'FLASHING ⚡' : 'normal'}`);
        this.player.update(deltaTime, this.inputManager.inputState, this.canvas.width, this.canvas.height, this.enemies)

        for (const enemy of this.enemies) {
            enemy.update(deltaTime, this.player)
        }

        // Process damage events from player
        const damageEvents = this.player.getDamageEvents()
        for (const event of damageEvents) {
            this.damageNumbers.push(new DamageNumber(
                this.player.x,
                this.player.y - this.player.radius - 20,
                event.amount,
                false, // not a crit
                `-${event.amount}`,
                true // is player damage (red)
            ));
        }
        // Clear damage events after processing them
        this.player.clearDamageEvents()
        // Check if player leveled up this frame
        const currentLevel = this.player.stats.level;
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

        // Update shop screen if active
        if (this.isShopActive) {
            // console.log(`🎯 Updating shop screen, player stats - Max HP: ${this.player.maxHP}, Level: ${this.player.level}`)
            this.shopScreen.update(this.player)
            // TODO: Add this.updateAllStats() after each shop purchase when implemented
        }

        // Update pause screen if active (continuously while paused)
        if (this.paused) {
            this.pauseScreen.update(this.player)
        }

        // Use new spawn manager (only if wave timer hasn't ended)
        if (this.waveTimer > 0) {
            const newEnemies = this.spawnManager.update(deltaTime, this.player, this.enemies)
            this.enemies.push(...newEnemies)
        }

        // Debug logging for spawn system
        const totalEnemies = this.spawnManager.getCurrentTotalEnemyCount(this.enemies)
        const spawnProb = this.spawnManager.getCurrentSpawnProbability()
        const missedBonus = this.spawnManager.getMissedSpawnBonus()
        // console.log(`🎯 Spawn System: ${totalEnemies} total enemies, ${spawnProb.toFixed(2)} spawn probability, ${missedBonus.toFixed(2)} missed bonus`)
        // Update wave timer and check for wave end
        if (this.waveIndex < this.waveData.length && !this.isLevelUpActive) {
            this.waveTimer -= deltaTime / 1000;
            if (this.waveTimer < 0) {
                this.waveTimer = 0;
            }
            this.checkWaveEnd();
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
                    const critChance = this.player.stats.total.critChance || 0;
                    if (Math.random() * 100 < critChance) {
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

        // console.log(`🎯 Rendering ${this.damageNumbers.length} damage numbers this frame`);
        for (const damageNumber of this.damageNumbers) {
            damageNumber.render(this.renderer)
        }

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
        // DEBUG putting soma high right now to test.
        const somaCount = 50 + Math.floor(Math.random() * 3) // 3-5 Soma
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
                const leveledUp = this.player.gainXP(somaValue);
                if (leveledUp) {
                    this.levelsGained++;
                }
                this.player.gainGold(gold);
                this.somaList.splice(i, 1);
            }
        }
    }

    // Wave management methods
    private startWave() {
        if (this.waveIndex < this.waveData.length) {
            this.waveStartLevel = this.player.stats.level;
            this.levelsGained = 0;
            this.waveTimer = this.waveData[this.waveIndex].duration;
            
            // Reset HP to max at wave start
            this.player.stats.setCurrentHP(this.player.stats.getMaxHP())
            
            // SpawnManager handles spawning automatically, no need to call startWave
            
            // Update stats at start of wave
            this.updateAllStats()
        }
    }

    private async endWave() {
        // Reset HP to max at wave end
        this.player.stats.setCurrentHP(this.player.stats.getMaxHP())
        
        // Update stats at end of wave
        this.updateAllStats()
        
        // Check for level ups
        console.log(`🎯 Wave ended! Player level: ${this.player.stats.level}, Levels gained: ${this.levelsGained}`);

        if (this.levelsGained > 0) {
            console.log(`🎯 Showing level up screen for ${this.levelsGained} levels`);
            this.levelsToProcess = this.levelsGained;
            this.currentSelection = 0;
            this.isLevelUpActive = true;
            this.levelUpScreen.show(this.levelsGained, (choice: LevelUpChoice) => {
                this.handleLevelUpChoice(choice);
            }, () => {
                this.handleContinueToShop();
            });
        } else {
            console.log(`🎯 No level ups, going to shop`);
            // No level ups, go to shop
            await this.showShop();
        }
    }

    private handleLevelUpChoice(choice: LevelUpChoice) {
        this.player.selectLevelUpBonus(choice.stat);
        this.levelsToProcess--;
        this.currentSelection++;

        // Update stats after level up choice
        this.updateAllStats()

        if (this.levelsToProcess <= 0) {
            // All level ups processed, auto-proceed to shop
            this.handleContinueToShop();
        } else {
            // Update the title to show current selection progress
            this.levelUpScreen.updateTitle(this.currentSelection + 1, this.levelsGained);
        }
    }

    private async handleContinueToShop() {
        this.isLevelUpActive = false;
        this.levelUpScreen.hide();
        await this.showShop();
    }

    private async showShop() {
        console.log(`🎯 Showing shop for wave ${this.waveIndex + 1}`);
        this.isShopActive = true;
        
        // Update stats at beginning of shop
        this.updateAllStats()
        
        await this.shopScreen.show(this.waveIndex + 1, () => {
            this.handleContinueToNextWave();
        });
    }

    private handleContinueToNextWave() {
        this.isShopActive = false;
        this.shopScreen.hide();
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

    // Helper method to update all stats displays
    private updateAllStats() {
        this.statsPanel.update(this.player)
    }

    // Check if wave should end
    private checkWaveEnd() {
        if (this.waveTimer <= 0) {
            this.endWave();
        }
    }
}