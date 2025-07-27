import { Renderer } from '../render/Renderer'
import { InputManager } from '../input/InputManager'
import { Player } from './Player'
import { Enemy } from './Enemy'
import { DamageNumber } from './DamageNumber'
import { Soma } from './Soma'
import { HUD } from '../ui/HUD'
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
  private spawnManager: SpawnManager

  private lastPlayerLevel: number;
  private waveIndex: number = 0;
  private waveTimer: number = 0;
  private waveData = [
    { wave: 1, duration: 20 },
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

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.renderer = new Renderer(canvas)
    this.inputManager = new InputManager()
    this.player = new Player(canvas.width / 2, canvas.height / 2)
    this.hud = new HUD()
    this.spawnManager = new SpawnManager(canvas.width, canvas.height)
    
    // No initial enemies - let the spawn manager handle spawning
    this.lastPlayerLevel = this.player.level;
    this.waveIndex = 0;
    this.waveTimer = this.waveData[0].duration;
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape') {
        this.paused = !this.paused;
      }
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

  private gameLoop = (currentTime: number) => {
    if (!this.running) return

    const deltaTime = currentTime - this.lastTime
    this.lastTime = currentTime

    if (!this.paused) {
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
    if (this.player.level > this.lastPlayerLevel) {
      this.damageNumbers.push(new DamageNumber(
        this.player.x,
        this.player.y - this.player.radius - 30,
        0,
        false, // not a crit
        'Level Up!'
      ));
    }
    this.lastPlayerLevel = this.player.level;

    // Remove enemies that have completed their death animation
    this.enemies = this.enemies.filter(enemy => !enemy.isDeathAnimationComplete())

    this.updateSoma(deltaTime)
    this.checkProjectileCollisions()
    this.checkSomaPickup()
    this.updateDamageNumbers(deltaTime)
    
    // Use new spawn manager
    const newEnemies = this.spawnManager.update(deltaTime, this.player, this.enemies)
    this.enemies.push(...newEnemies)
    
    // Debug logging for spawn system
    const totalEnemies = this.spawnManager.getCurrentTotalEnemyCount(this.enemies)
    const spawnProb = this.spawnManager.getCurrentSpawnProbability()
    const missedBonus = this.spawnManager.getMissedSpawnBonus()
    console.log(`🎯 Spawn System: ${totalEnemies} total enemies, ${spawnProb.toFixed(2)} spawn probability, ${missedBonus.toFixed(2)} missed bonus`)
    // Update wave timer
    if (this.waveIndex < this.waveData.length) {
      this.waveTimer -= deltaTime / 1000;
      if (this.waveTimer < 0) {
        this.waveTimer = 0;
        // For now, do nothing when timer reaches zero
      }
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

    this.hud.render(this.renderer, this.player, this.canvas.width, this.canvas.height)
    
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
    // Pause overlay
    if (this.paused) {
      this.drawPauseOverlay();
    }
    this.renderer.present()
  }

  private drawPauseOverlay() {
    const ctx = (this.renderer as any).ctx;
    ctx.save();
    
    // Dim background
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.globalAlpha = 1.0;
    
    // Smaller pause title
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', this.canvas.width / 2, 40);
    
    // Main container dimensions - 95% width
    const containerWidth = this.canvas.width * 0.95;
    const containerX = (this.canvas.width - containerWidth) / 2;
    const containerY = 70;
    const containerHeight = this.canvas.height - 140;
    
    // Draw main container background
    ctx.fillStyle = '#222';
    ctx.fillRect(containerX, containerY, containerWidth, containerHeight);
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 2;
    ctx.strokeRect(containerX, containerY, containerWidth, containerHeight);
    
    // Left section (80% for weapons and items)
    const leftWidth = containerWidth * 0.8;
    const leftHeight = containerHeight - 80; // Leave space for buttons
    const leftX = containerX + 20;
    const leftY = containerY + 20;
    
    // Right section (20% for stats)
    const rightWidth = containerWidth * 0.2 - 40;
    const rightHeight = leftHeight;
    const rightX = leftX + leftWidth + 20;
    const rightY = leftY;
    
    this.drawWeaponsSection(ctx, leftX, leftY, leftWidth, leftHeight * 0.4);
    this.drawItemsSection(ctx, leftX, leftY + leftHeight * 0.4 + 10, leftWidth, leftHeight * 0.6 - 10);
    this.drawStatsSection(ctx, rightX, rightY, rightWidth, rightHeight);
    this.drawBottomButtons(ctx, containerX, containerY + containerHeight - 60, containerWidth, 40);
    
    ctx.restore();
  }

  private drawWeaponsSection(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('WEAPONS', x, y + 18);
    
    const cellSize = 50;
    const cellSpacing = 10;
    const startX = x + 10;
    const startY = y + 30;
    
    for (let i = 0; i < 6; i++) {
      const cellX = startX + i * (cellSize + cellSpacing);
      
      // Cell background
      ctx.fillStyle = '#444';
      ctx.fillRect(cellX, startY, cellSize, cellSize);
      ctx.strokeStyle = '#666';
      ctx.lineWidth = 1;
      ctx.strokeRect(cellX, startY, cellSize, cellSize);
      
      // Placeholder text - white and left-aligned
      ctx.fillStyle = '#fff';
      ctx.font = '12px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`W${i + 1}`, cellX + 4, startY + 16);
    }
  }

  private drawItemsSection(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('ITEMS', x, y + 18);
    
    const cellSize = 40;
    const cellSpacing = 8;
    const startX = x + 10;
    const startY = y + 30;
    const cols = Math.floor((width - 20) / (cellSize + cellSpacing));
    const rows = Math.floor((height - 40) / (cellSize + cellSpacing));
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const cellX = startX + col * (cellSize + cellSpacing);
        const cellY = startY + row * (cellSize + cellSpacing);
        
        // Cell background
        ctx.fillStyle = '#444';
        ctx.fillRect(cellX, cellY, cellSize, cellSize);
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1;
        ctx.strokeRect(cellX, cellY, cellSize, cellSize);
        
        // No text for item cells - left empty as requested
      }
    }
  }

  private drawStatsSection(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
    // Dark background with 0.6 opacity for stats pane
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = '#000';
    ctx.fillRect(x - 10, y - 10, width + 20, height + 20);
    ctx.globalAlpha = 1.0;
    
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('STATS', x, y + 18);
    
    const lineHeight = 28;
    const startY = y + 40;
    
    const stats = [
      { icon: '❤️', label: 'Max HP', value: this.player.maxHP },
      { icon: '⚡', label: 'Level', value: this.player.level },
      { icon: '🏃', label: 'Move Speed', value: 100 },
      { icon: '💥', label: 'Crit Chance', value: '5%' },
      { icon: '⚔️', label: 'Attack', value: 10 },
      { icon: '🛡️', label: 'Armor', value: 0 },
      { icon: '🍀', label: 'Luck', value: 0 }
    ];
    
    ctx.font = '12px Arial';
    ctx.fillStyle = '#fff';
    
    for (let i = 0; i < stats.length; i++) {
      const stat = stats[i];
      const yPos = startY + i * lineHeight;
      
      // Draw icon
      ctx.fillText(stat.icon, x, yPos);
      
      // Draw stat text (adjusted to fit within container)
      const statText = `${stat.label}: ${stat.value}`;
      ctx.fillText(statText, x + 20, yPos);
    }
  }

  private drawBottomButtons(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
    const buttonWidth = 120;
    const buttonHeight = 30;
    const buttonSpacing = 20;
    // Left-align buttons with item cells (x + 30 to match item cell alignment)
    const startX = x + 30;
    
    const buttons = ['RESUME', 'RESTART', 'MAIN MENU'];
    
    for (let i = 0; i < buttons.length; i++) {
      const buttonX = startX + i * (buttonWidth + buttonSpacing);
      const buttonY = y + (height - buttonHeight) / 2;
      
      // Button background
      ctx.fillStyle = i === 0 ? '#4a4a4a' : '#3a3a3a';
      ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
      ctx.strokeStyle = '#666';
      ctx.lineWidth = 1;
      ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);
      
      // Button text
      ctx.fillStyle = '#fff';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(buttons[i], buttonX + buttonWidth / 2, buttonY + buttonHeight / 2 + 4);
    }
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


}