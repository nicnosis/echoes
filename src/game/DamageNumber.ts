import { Renderer } from '../render/Renderer'

export class DamageNumber {
  public x: number
  public y: number
  public damage: number
  public color: string
  public timer: number = 0
  public duration: number = 1000
  public velocityY: number = -50
  public text?: string // Optional custom text
  public critical: boolean

  constructor(x: number, y: number, damage: number, critical: boolean = false, text?: string) {
    this.x = x
    this.y = y
    this.damage = damage
    this.critical = critical
    this.color = critical ? '#ffe066' : '#ffffff';
    this.text = text;
  }

  update(deltaTime: number): boolean {
    this.timer += deltaTime
    this.y += this.velocityY * (deltaTime / 1000)
    
    return this.timer < this.duration
  }

  render(renderer: Renderer) {
    const alpha = Math.max(0, 1 - (this.timer / this.duration))
    const fontSize = 16 + (1 - alpha) * 4
    
    renderer.drawText(
      this.text ? this.text : this.damage.toString(),
      this.x,
      this.y,
      this.color.replace('1)', `${alpha})`).replace('0.85)', `${alpha})`),
      `${fontSize}px Arial`
    )
  }
}