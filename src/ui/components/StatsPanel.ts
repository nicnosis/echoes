// src/ui/components/StatsPanel.ts
import { Player } from '../../game/Player'
import { loadHTMLTemplate } from '../utils/templateLoader'

export class StatsPanel {
    private static instance: StatsPanel
    private templateHTML: string = ''
    private container: HTMLElement | null = null

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

    // Set the single container for this stats panel (UnifiedUI approach)
    setContainer(container: HTMLElement): void {
        this.container = container
        container.innerHTML = this.templateHTML
        console.log('✅ StatsPanel initialized with single container')
    }

    // Update the single container with current player stats
    update(player: Player): void {
        if (!this.container) {
            console.warn('StatsPanel: No container set for updates')
            return
        }

        // Update the single container directly
        player.stats.updateMasterStatsPanel(this.container)
    }

    // Get the container (for other components to use)
    getContainer(): HTMLElement | null {
        return this.container
    }

    private getFallbackHTML(): string {
        return `
      <div class="stats-container">
        <div class="stat-item level">
          <span class="stat-name">Level</span>
          <span class="stat-value">0</span>
        </div>
        <div class="stat-item maxHP">
          <span class="stat-name">Max HP</span>
          <span class="stat-value">10</span>
        </div>
        <div class="stat-item hpRegen">
          <span class="stat-name">HP Regeneration</span>
          <span class="stat-value">5</span>
        </div>
        <div class="stat-item lifeSteal">
          <span class="stat-name">Lifesteal</span>
          <span class="stat-value">0</span>
        </div>
        <div class="stat-item damage">
          <span class="stat-name">Damage</span>
          <span class="stat-value">0.0%</span>
        </div>
        <div class="stat-item red">
          <span class="stat-name">Red</span>
          <span class="stat-value">0</span>
        </div>
        <div class="stat-item green">
          <span class="stat-name">Green</span>
          <span class="stat-value">0</span>
        </div>
        <div class="stat-item blue">
          <span class="stat-name">Blue</span>
          <span class="stat-value">0</span>
        </div>
        <div class="stat-item yellow">
          <span class="stat-name">Yellow</span>
          <span class="stat-value">0</span>
        </div>
        <div class="stat-item attackSpeed">
          <span class="stat-name">Attack Speed</span>
          <span class="stat-value">0.0%</span>
        </div>
        <div class="stat-item critChance">
          <span class="stat-name">Crit</span>
          <span class="stat-value">0</span>
        </div>
        <div class="stat-item range">
          <span class="stat-name">Range</span>
          <span class="stat-value">0</span>
        </div>
        <div class="stat-item armor">
          <span class="stat-name">Armor</span>
          <span class="stat-value">0</span>
        </div>
        <div class="stat-item dodge">
          <span class="stat-name">Dodge</span>
          <span class="stat-value">0.0%</span>
        </div>
        <div class="stat-item moveSpeed">
          <span class="stat-name">Speed</span>
          <span class="stat-value">0.0%</span>
        </div>
      </div>
    `
    }
}