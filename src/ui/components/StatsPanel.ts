// src/ui/components/StatsPanel.ts
import { Player } from '../../game/Player'
import { loadHTMLTemplate } from '../utils/templateLoader'

export class StatsPanel {
    private static instance: StatsPanel
    private templateHTML: string = ''
    private containers: HTMLElement[] = []

    private constructor() { }

    static getInstance(): StatsPanel {
        if (!StatsPanel.instance) {
            StatsPanel.instance = new StatsPanel()
        }
        return StatsPanel.instance
    }

    async initialize(): Promise<void> {
        try {
            this.templateHTML = await loadHTMLTemplate('/src/ui/components/StatsPanel.html')
        } catch (error) {
            console.error('Failed to load StatsPanel template:', error)
            // Fallback to inline HTML
            this.templateHTML = this.getFallbackHTML()
        }
    }

    // Register a container that should display stats
    registerContainer(container: HTMLElement): void {
        console.log('Registering container:', container)
        if (!this.containers.includes(container)) {
            this.containers.push(container)
            container.innerHTML = this.templateHTML
        }
    }

    // Remove a container from updates
    unregisterContainer(container: HTMLElement): void {
        const index = this.containers.indexOf(container)
        if (index > -1) {
            this.containers.splice(index, 1)
        }
    }

    // Update all registered containers with current player stats
    update(player: Player): void {
        const stats = {
            level: player.level,
            // hp: player.currentHP,
            maxHp: player.actualStats.maxHP,
            attack: player.actualStats.attack,
            armor: player.actualStats.armor,
            critChance: `${(player.actualStats.critChance * 100).toFixed(1)}%`,
            moveSpeed: player.actualStats.moveSpeed.toFixed(0)
        }

        this.containers.forEach(container => {
            this.updateContainer(container, stats)
        })
    }

    private updateContainer(container: HTMLElement, stats: any): void {
        // Update HP
        const hpElement = container.querySelector('.stat-item.hp .stat-value') as HTMLElement
        if (hpElement) hpElement.textContent = `${stats.hp}/${stats.maxHp}`

        // Update Level
        const levelElement = container.querySelector('.stat-item.level .stat-value') as HTMLElement
        if (levelElement) levelElement.textContent = stats.level.toString()

        // Update Attack
        const attackElement = container.querySelector('.stat-item.attack .stat-value') as HTMLElement
        if (attackElement) attackElement.textContent = stats.attack.toString()

        // Update Armor
        const armorElement = container.querySelector('.stat-item.armor .stat-value') as HTMLElement
        if (armorElement) armorElement.textContent = stats.armor.toString()

        // Update Crit Chance
        const critElement = container.querySelector('.stat-item.crit .stat-value') as HTMLElement
        if (critElement) critElement.textContent = stats.critChance

        // Update Move Speed
        const speedElement = container.querySelector('.stat-item.speed .stat-value') as HTMLElement
        if (speedElement) speedElement.textContent = stats.moveSpeed

    }

    private getFallbackHTML(): string {
        return `
      <div class="stats-container">
        <div class="stat-item hp">
          <span class="stat-label">HP:</span>
          <span class="stat-value">100/100</span>
        </div>
        <div class="stat-item level">
          <span class="stat-label">Level:</span>
          <span class="stat-value">1</span>
        </div>
        <div class="stat-item attack">
          <span class="stat-label">Attack:</span>
          <span class="stat-value">50</span>
        </div>
        <div class="stat-item armor">
          <span class="stat-label">Armor:</span>
          <span class="stat-value">0</span>
        </div>
        <div class="stat-item crit">
          <span class="stat-label">Crit:</span>
          <span class="stat-value">5.0%</span>
        </div>
        <div class="stat-item speed">
          <span class="stat-label">Speed:</span>
          <span class="stat-value">100</span>
        </div>
        <div class="stat-item luck">
          <span class="stat-label">Luck:</span>
          <span class="stat-value">0</span>
        </div>
      </div>
    `
    }
}