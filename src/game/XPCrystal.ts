import { Renderer } from '../render/Renderer'

export class XPCrystal {
  public x: number
  public y: number
  public radius: number = 5
  public xpValue: number
  public goldValue: number
  public collected: boolean = false
  
  private floatOffset: number = 0
  private floatSpeed: number = 0.002

  constructor(x: number, y: number, xpValue: number = 1, goldValue: number = 1) {
    this.x = x
    this.y = y
    this.xpValue = xpValue
    this.goldValue = goldValue
    this.floatOffset = Math.random() * Math.PI * 2
  }

  update(deltaTime: number) {
    this.floatOffset += this.floatSpeed * deltaTime
  }

  render(renderer: Renderer) {
    if (this.collected) return
    
    const floatY = this.y + Math.sin(this.floatOffset) * 2
    
    // Draw outer glow
    renderer.drawCircle(this.x, floatY, this.radius + 2, '#4400ff')
    
    // Draw crystal core
    renderer.drawCircle(this.x, floatY, this.radius, '#8800ff')
  }

  isInRange(playerX: number, playerY: number, pickupRadius: number): boolean {
    if (this.collected) return false
    
    const dx = this.x - playerX
    const dy = this.y - playerY
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    return distance <= pickupRadius
  }

  collect(): { xp: number, gold: number } {
    if (this.collected) return { xp: 0, gold: 0 }
    
    this.collected = true
    return { xp: this.xpValue, gold: this.goldValue }
  }

  getBounds() {
    return {
      x: this.x - this.radius,
      y: this.y - this.radius,
      width: this.radius * 2,
      height: this.radius * 2
    }
  }
}