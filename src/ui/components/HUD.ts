import { Player } from '../../game/Player'

export class HUD {
  private healthBar: HTMLElement
  private healthFill: HTMLElement
  private healthText: HTMLElement
  private xpBar: HTMLElement
  private xpFill: HTMLElement
  private xpText: HTMLElement
  private levelText: HTMLElement
  private goldText: HTMLElement

  constructor() {
    // Get DOM elements
    this.healthBar = document.querySelector('.health-bar')!
    this.healthFill = document.querySelector('.health-fill')!
    this.healthText = document.querySelector('.health-text')!
    this.xpBar = document.querySelector('.xp-bar')!
    this.xpFill = document.querySelector('.xp-fill')!
    this.xpText = document.querySelector('.xp-text')!
    this.levelText = document.querySelector('.level')!
    this.goldText = document.querySelector('.gold')!

    // Verify all elements exist
    if (!this.healthBar || !this.healthFill || !this.healthText ||
        !this.xpBar || !this.xpFill || !this.xpText ||
        !this.levelText || !this.goldText) {
      throw new Error('HUD elements not found in DOM')
    }
  }

  update(player: Player) {
    // Update health bar
    const healthPercent = Math.max(0, (player.currentHP / player.maxHP) * 100)
    this.healthFill.style.width = `${healthPercent}%`
    this.healthText.textContent = `${player.currentHP}/${player.maxHP}`

    // Update XP bar
    const xpPercent = player.getXPPercentage()
    this.xpFill.style.width = `${xpPercent}%`
    this.xpText.textContent = `${Math.floor(xpPercent)}%`

    // Update level and gold
    this.levelText.textContent = `Lv ${player.level}`
    this.goldText.textContent = `Gold: ${player.gold}`
  }

  // Method to show/hide HUD (for future use)
  show() {
    const hud = document.getElementById('hud')
    if (hud) hud.style.display = 'block'
  }

  hide() {
    const hud = document.getElementById('hud')
    if (hud) hud.style.display = 'none'
  }
} 