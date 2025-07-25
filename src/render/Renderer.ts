export class Renderer {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Could not get 2D canvas context')
    }
    this.ctx = ctx
  }

  clear() {
    this.ctx.fillStyle = '#222'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
  }

  present() {
    // Double buffering would go here if needed
  }

  drawRect(x: number, y: number, width: number, height: number, color: string) {
    this.ctx.fillStyle = color
    this.ctx.fillRect(x, y, width, height)
  }

  drawRectWithOpacity(x: number, y: number, width: number, height: number, color: string) {
    this.ctx.fillStyle = color
    this.ctx.fillRect(x, y, width, height)
  }

  drawCircle(x: number, y: number, radius: number, color: string) {
    this.ctx.fillStyle = color
    this.ctx.beginPath()
    this.ctx.arc(x, y, radius, 0, Math.PI * 2)
    this.ctx.fill()
  }

  // Draw text with proper alpha handling
  drawText(text: string, x: number, y: number, color: string = '#fff', font: string = '16px Arial') {
    this.ctx.save()
    
    // Extract alpha from rgba color if present
    if (color.includes('rgba(')) {
      const alphaMatch = color.match(/rgba\([^,]+,[^,]+,[^,]+,([^)]+)\)/)
      if (alphaMatch) {
        const alpha = parseFloat(alphaMatch[1])
        this.ctx.globalAlpha = alpha
        // Convert rgba to rgb for fillStyle
        const rgbColor = color.replace(/rgba\(([^,]+,[^,]+,[^,]+),[^)]+\)/, 'rgb($1)')
        this.ctx.fillStyle = rgbColor
      } else {
        this.ctx.fillStyle = color
      }
    } else {
      this.ctx.fillStyle = color
    }
    
    this.ctx.font = font
    this.ctx.fillText(text, x, y)
    this.ctx.restore()
  }
}