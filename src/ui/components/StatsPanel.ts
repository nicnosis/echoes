import { Player } from '../../game/Player'
import { loadHTMLTemplate, injectTemplate } from '../utils/templateLoader'

export class StatsPanel {
  // Static method to update stats in any container with proper structure
  static updateStats(container: HTMLElement, player: Player): void {
    const stats = player.getDisplayStats()
    
    // Find and update each stat element within the container
    const updateStat = (statName: string, value: string) => {
      const element = container.querySelector(`.stat-item.${statName} .stat-value`) as HTMLElement
      if (element) {
        element.textContent = value
      } else {
        console.warn(`Stat element not found: .stat-item.${statName} .stat-value`)
      }
    }

    updateStat('maxHP', stats.maxHP.toString())
    updateStat('level', stats.level.toString())
    updateStat('moveSpeed', stats.moveSpeed.toString())
    updateStat('critChance', `${stats.critChance}%`)
    updateStat('attack', stats.attack.toString())
    updateStat('armor', stats.armor.toString())
    updateStat('luck', stats.luck.toString())
  }

  // Static method to load stats panel HTML into a container
  static async loadIntoContainer(container: HTMLElement): Promise<void> {
    try {
      const templateHTML = await loadHTMLTemplate('/src/ui/components/StatsPanel.html')
      injectTemplate(templateHTML, container)
    } catch (error) {
      console.error('Failed to load StatsPanel template:', error)
      throw error
    }
  }
}