import { Player } from '../../game/Player'
import { StatsPanel } from './StatsPanel'

export class PauseScreen {
  private pauseOverlay: HTMLElement
  private weaponSlots: HTMLElement[]
  private statsPanel: StatsPanel
  private resumeBtn: HTMLElement
  private restartBtn: HTMLElement
  private mainMenuBtn: HTMLElement

  constructor() {
    // Get DOM elements
    this.pauseOverlay = document.getElementById('pause-overlay')!
    this.resumeBtn = document.getElementById('resume-btn')!
    this.restartBtn = document.getElementById('restart-btn')!
    this.mainMenuBtn = document.getElementById('main-menu-btn')!
    
    // Get weapon slots
    this.weaponSlots = Array.from(document.querySelectorAll('.weapon-slot'))
    
    // Initialize StatsPanel with the stats section container
    const statsContainer = document.querySelector('.pause.stats-panel')! as HTMLElement
    if (!statsContainer) {
      throw new Error('Stats section not found in pause overlay')
    }
    
    // Clear existing content and create StatsPanel
    statsContainer.innerHTML = ''
    this.statsPanel = new StatsPanel(statsContainer)
    this.initializeStatsPanel()

    // Verify elements exist
    if (!this.pauseOverlay || !this.resumeBtn || !this.restartBtn || !this.mainMenuBtn) {
      throw new Error('Pause screen elements not found in DOM')
    }

    // Set up event listeners
    this.setupEventListeners()
  }
  
  private async initializeStatsPanel() {
    try {
      await this.statsPanel.load()
    } catch (error) {
      console.error('Failed to initialize StatsPanel in PauseScreen:', error)
    }
  }

  private setupEventListeners() {
    this.resumeBtn.addEventListener('click', () => {
      this.hide()
    })

    this.restartBtn.addEventListener('click', () => {
      // This will be handled by the Game class
      this.hide()
      // Dispatch custom event for restart
      window.dispatchEvent(new CustomEvent('gameRestart'))
    })

    this.mainMenuBtn.addEventListener('click', () => {
      // This will be handled later
      console.log('Main menu clicked')
    })
  }

  show() {
    this.pauseOverlay.classList.add('active')
  }

  hide() {
    this.pauseOverlay.classList.remove('active')
  }

  update(player: Player) {
    // Update weapon slots
    this.updateWeaponSlots(player)
    
    // Update stats
    this.updateStats(player)
  }

  private updateWeaponSlots(player: Player) {
    // Clear all slots
    this.weaponSlots.forEach((slot, index) => {
      if (index < player.weapons.length) {
        const weapon = player.weapons[index]
        slot.textContent = weapon.name
        slot.classList.add('filled')
      } else {
        slot.textContent = 'Empty'
        slot.classList.remove('filled')
      }
    })
  }

  private updateStats(player: Player) {
    this.statsPanel.update(player)
  }

  isVisible(): boolean {
    return this.pauseOverlay.classList.contains('active')
  }
} 