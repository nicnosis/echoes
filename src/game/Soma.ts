import { Renderer } from '../render/Renderer'

export class Soma {
  public x: number
  public y: number
  public radius: number = 10
  public somaValue: number
  public goldValue: number
  public collected: boolean = false
  
  private floatOffset: number = 0
  private floatSpeed: number = 0.002
  // Appearance properties
  private aspect: number
  private rotation: number
  private alpha: number

  constructor(x: number, y: number, somaValue: number = 1, goldValue: number = 1) {
    this.x = x
    this.y = y
    this.somaValue = somaValue
    this.goldValue = goldValue
    this.floatOffset = Math.random() * Math.PI * 2
    // Assign static appearance
    this.aspect = 1 + Math.random() // 1 to 2
    this.rotation = Math.random() * Math.PI * 2
    this.alpha = 0.4 + Math.random() * 0.3 // 0.4 to 0.7
  }

  update(deltaTime: number) {
    this.floatOffset += this.floatSpeed * deltaTime
  }

  render(renderer: Renderer) {
    if (this.collected) return
    const floatY = this.y + Math.sin(this.floatOffset) * 2
    let width = this.radius * this.aspect
    let height = this.radius * (2 - this.aspect)
    // Enforce a minimum width and height for visibility
    const minSize = 10
    width = Math.max(width, minSize)
    height = Math.max(height, minSize)
    const ctx = (renderer as any).ctx
    ctx.save()
    ctx.globalAlpha = this.alpha
    ctx.translate(this.x, floatY)
    ctx.rotate(this.rotation)
    // Add pinkish glow
    ctx.shadowColor = '#ff66cc'
    ctx.shadowBlur = 24
    ctx.fillStyle = '#ff33cc' // Vibrant pink
    ctx.fillRect(-width / 2, -height / 2, width, height)
    ctx.restore()
  }

  isInRange(playerX: number, playerY: number, pickupRadius: number): boolean {
    if (this.collected) return false
    
    const dx = this.x - playerX
    const dy = this.y - playerY
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    return distance <= pickupRadius
  }

  collect(): { soma: number, gold: number } {
    if (this.collected) return { soma: 0, gold: 0 }
    
    this.collected = true
    return { soma: this.somaValue, gold: this.goldValue }
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