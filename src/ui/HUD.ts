import { Renderer } from '../render/Renderer'
import { Player } from '../game/Player'

export class HUD {
  private barWidth: number = 200
  private barHeight: number = 12
  private margin: number = 10

  constructor() {}

  render(renderer: Renderer, player: Player, canvasWidth?: number, canvasHeight?: number) {
    this.renderHealthBar(renderer, player)
    this.renderXPBar(renderer, player)
    this.renderWeaponCooldowns(renderer, player, canvasWidth || 800, canvasHeight || 600)
  }

  private renderHealthBar(renderer: Renderer, player: Player) {
    const x = this.margin
    const y = this.margin
    
    // Background
    renderer.drawRect(x, y, this.barWidth, this.barHeight, '#333')
    
    // Health bar fill
    const healthPercentage = player.currentHP / player.maxHP
    const fillWidth = this.barWidth * healthPercentage
    renderer.drawRect(x, y, fillWidth, this.barHeight, '#ff0000')
    
    // Health text
    const healthText = `${player.currentHP}/${player.maxHP}`
    renderer.drawText(
      healthText,
      x + this.barWidth + 10,
      y + this.barHeight - 2,
      '#ffffff',
      '14px Arial'
    )
  }

  private renderXPBar(renderer: Renderer, player: Player) {
    const x = this.margin
    const y = this.margin + this.barHeight + 5
    
    // Background
    renderer.drawRect(x, y, this.barWidth, this.barHeight, '#333')
    
    // XP bar fill
    const xpPercentage = player.currentXP / player.xpToNextLevel
    const fillWidth = this.barWidth * xpPercentage
    renderer.drawRect(x, y, fillWidth, this.barHeight, '#8800ff')
    
    // XP percentage text
    const xpText = `${Math.floor(player.getXPPercentage())}%`
    renderer.drawText(
      xpText,
      x + this.barWidth + 10,
      y + this.barHeight - 2,
      '#ffffff',
      '14px Arial'
    )
  }

  private renderWeaponCooldowns(renderer: Renderer, player: Player, canvasWidth: number, canvasHeight: number) {
    const weaponBarWidth = 60
    const weaponBarHeight = 6
    const weaponSpacing = 14
    const startX = this.margin
    const startY = canvasHeight - (6 * weaponSpacing) - this.margin

    for (let i = 0; i < 6; i++) {
      const x = startX + 20
      const y = startY + i * weaponSpacing
      const weapon = player.weapons[i]
      
      // Draw weapon label
      renderer.drawText(
        `w${i + 1}`,
        x - 18,
        y + weaponBarHeight - 1,
        '#ffffff',
        '10px Arial'
      )
      
      // Draw cooldown bar background
      renderer.drawRect(x, y, weaponBarWidth, weaponBarHeight, '#333')
      
      if (weapon) {
        // Draw cooldown bar fill (white when ready, empty when cooling down)
        const cooldownPercentage = weapon.getCooldownPercentage()
        const fillWidth = weaponBarWidth * cooldownPercentage
        renderer.drawRect(x, y, fillWidth, weaponBarHeight, '#ffffff')
        
        // Draw weapon name
        renderer.drawText(
          weapon.name,
          x + weaponBarWidth + 4,
          y + weaponBarHeight - 1,
          '#ffffff',
          '10px Arial'
        )
      }
    }
  }
}