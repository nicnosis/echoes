import { Player } from '../game/Player'
import { StatsPanel } from './components/StatsPanel'

export class StatsManager {
  private activePanels: Set<StatsPanel> = new Set()
  
  // Register a stats panel to receive updates
  register(panel: StatsPanel) {
    this.activePanels.add(panel)
  }
  
  // Unregister a stats panel
  unregister(panel: StatsPanel) {
    this.activePanels.delete(panel)
  }
  
  // Update all registered panels with current player stats
  updateAll(player: Player) {
    for (const panel of this.activePanels) {
      panel.update(player)
    }
  }
  
  // Clear all registered panels
  clear() {
    this.activePanels.clear()
  }
}