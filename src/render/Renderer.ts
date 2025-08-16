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

  get context(): CanvasRenderingContext2D {
    return this.ctx
  }

  clear() {
    this.ctx.fillStyle = '#222'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
  }

  present() {
    // Double buffering would go here if needed
  }

  drawRect(x: number, y: number, width: number, height: number, color: string, options?: {
    strokeOnly?: boolean
    lineWidth?: number
  }) {
    if (options?.strokeOnly) {
      this.ctx.strokeStyle = color
      this.ctx.lineWidth = options.lineWidth || 1
      this.ctx.strokeRect(x, y, width, height)
    } else {
      this.ctx.fillStyle = color
      this.ctx.fillRect(x, y, width, height)
    }
  }

  drawCircle(x: number, y: number, radius: number, color: string, lineWidth: number = 0, strokeOnly: boolean = false) {
    this.ctx.beginPath()
    this.ctx.arc(x, y, radius, 0, Math.PI * 2)
    
    if (strokeOnly) {
      this.ctx.strokeStyle = color
      this.ctx.lineWidth = lineWidth
      this.ctx.stroke()
    } else {
      this.ctx.fillStyle = color
      this.ctx.fill()
    }
  }

  // Draw image with optional flipping and scaling
  drawImage(image: HTMLImageElement, x: number, y: number, width?: number, height?: number, flipHorizontal: boolean = false) {
    this.ctx.save()
    
    const drawWidth = width || image.width
    const drawHeight = height || image.height
    
    if (flipHorizontal) {
      this.ctx.scale(-1, 1)
      this.ctx.drawImage(image, -x - drawWidth, y, drawWidth, drawHeight)
    } else {
      this.ctx.drawImage(image, x, y, drawWidth, drawHeight)
    }
    
    this.ctx.restore()
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