import { Renderer } from '../render/Renderer'
import { Player } from '../game/Player'

export class HUD {
  private barWidth: number = 200
  private barHeight: number = 12
  private margin: number = 10

  constructor() {}

  render(renderer: Renderer, player: Player) {
    this.renderHealthBar(renderer, player)
    this.renderXPBar(renderer, player)
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
}