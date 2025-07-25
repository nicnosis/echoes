import { Renderer } from '../render/Renderer'
import { InputManager } from '../input/InputManager'
import { Player } from './Player'
import { Enemy } from './Enemy'
import { DamageNumber } from './DamageNumber'
import { Soma } from './Soma'
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
  private somaList: Soma[] = []
  private hud: HUD
  private enemySpawnTimer: number = 0
  private enemySpawnInterval: number = 5000 // 5 seconds
  private lastPlayerHP: number
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
    
    // Spawn initial 5 enemies
    this.spawnEnemies(5)
    this.lastPlayerHP = this.player.currentHP
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
    const prevHP = this.player.currentHP;
    const prevLevel = this.player.level;
    this.player.update(deltaTime, this.inputManager.inputState, this.canvas.width, this.canvas.height, this.enemies)
    if (this.player.currentHP < prevHP) {
      const dmg = prevHP - this.player.currentHP;
      this.damageNumbers.push(new DamageNumber(
        this.player.x,
        this.player.y - this.player.radius - 10,
        dmg,
        false, // not a crit
        `-${dmg}`
      ));
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
    this.lastPlayerHP = this.player.currentHP;
    
    for (const enemy of this.enemies) {
      enemy.update(deltaTime, this.player)
    }

    this.updateSoma(deltaTime)
    this.checkProjectileCollisions()
    this.checkSomaPickup()
    this.updateDamageNumbers(deltaTime)
    this.updateEnemySpawning(deltaTime)
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
        const dx = projectile.x - enemy.x;
        const dy = projectile.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance <= enemy.radius - projectile.size / 2) {
          this.player.projectiles.splice(i, 1)
          const enemyDied = enemy.takeDamage(projectile.damage)
          this.damageNumbers.push(new DamageNumber(
            enemy.x,
            enemy.y,
            projectile.damage,
            false // not a crit for now
          ))
          if (enemyDied) {
            this.dropSoma(enemy.x, enemy.y)
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

    for (const soma of this.somaList) {
      soma.render(this.renderer)
    }

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
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.globalAlpha = 1.0;
    // Pause title
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Paused', this.canvas.width / 2, 120);
    // Stats panel
    ctx.font = '24px Arial';
    ctx.textAlign = 'left';
    const panelX = this.canvas.width / 2 - 200;
    const panelY = 180;
    const lineHeight = 38;
    const stats = [
      [`Max HP`, this.player.maxHP],
      [`Level`, this.player.level],
      [`Movement Speed`, 0],
      [`Crit Chance`, '5%'],
      [`Player Attack`, 0],
      [`Player Armor`, 0],
      [`Luck`, 0],
    ];
    ctx.fillStyle = '#fff';
    for (let i = 0; i < stats.length; i++) {
      ctx.fillText(`${stats[i][0]}: ${stats[i][1]}`, panelX, panelY + i * lineHeight);
    }
    ctx.restore();
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

  private dropSoma(x: number, y: number) {
    const somaCount = 3 + Math.floor(Math.random() * 3) // 3-5 Soma
    const angleStep = (Math.PI * 2) / somaCount;
    const baseAngle = Math.random() * Math.PI * 2;
    for (let i = 0; i < somaCount; i++) {
      // Spread in a small arc/circle with random offset
      const angle = baseAngle + i * angleStep + (Math.random() - 0.5) * 0.4;
      const distance = 20 + Math.random() * 10;
      const sx = x + Math.cos(angle) * distance;
      const sy = y + Math.sin(angle) * distance;
      this.somaList.push(new Soma(sx, sy));
    }
  }

  private updateSoma(deltaTime: number) {
    const attractionRadius = this.player.pickupRadius // Attraction starts at pickup radius
    this.somaList.forEach(soma => {
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

  private updateEnemySpawning(deltaTime: number) {
    this.enemySpawnTimer += deltaTime
    
    if (this.enemySpawnTimer >= this.enemySpawnInterval) {
      this.spawnEnemies(5)
      this.enemySpawnTimer = 0
    }
  }
}