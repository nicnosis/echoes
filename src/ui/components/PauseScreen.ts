import { Player } from '../../game/Player'

export class PauseScreen {
  private pauseOverlay: HTMLElement
  private weaponSlots: HTMLElement[]
  private statItems: HTMLElement[]
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
    
    // Get stat items
    this.statItems = Array.from(document.querySelectorAll('.stat-item'))

    // Verify elements exist
    if (!this.pauseOverlay || !this.resumeBtn || !this.restartBtn || !this.mainMenuBtn) {
      throw new Error('Pause screen elements not found in DOM')
    }

    // Set up event listeners
    this.setupEventListeners()
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
    const stats = [
      { label: 'Max HP', value: player.maxHP },
      { label: 'Level', value: player.level },
      { label: 'Move Speed', value: player.actualStats.moveSpeed },
      { label: 'Crit Chance', value: `${player.critChance}%` },
      { label: 'Attack', value: player.attack },
      { label: 'Armor', value: player.armor },
      { label: 'Luck', value: player.luck }
    ]

    // Update each stat item
    this.statItems.forEach((item, index) => {
      if (index < stats.length) {
        const stat = stats[index]
        const label = item.querySelector('.stat-label') as HTMLElement
        const value = item.querySelector('.stat-value') as HTMLElement
        
        if (label && value) {
          label.textContent = stat.label
          value.textContent = stat.value.toString()
        }
      }
    })
  }

  isVisible(): boolean {
    return this.pauseOverlay.classList.contains('active')
  }
} 