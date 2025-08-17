export class Renderer {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private cam: any = null

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Could not get 2D canvas context')
    }
    this.ctx = ctx
  }

  setCamera(camera: any) {
    this.cam = camera
  }

  get context(): CanvasRenderingContext2D {
    return this.ctx
  }

  // Transform world coordinates to screen pixels using camera
  worldToScreen(worldX: number, worldY: number, camera: any): {x: number, y: number} {
    return {
      x: (worldX - camera.x) * camera.zoom + this.canvas.width / 2,
      y: (worldY - camera.y) * camera.zoom + this.canvas.height / 2
    }
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
    if (this.cam) {
      const screen = this.worldToScreen(x, y, this.cam)
      const scaledWidth = width * this.cam.zoom
      const scaledHeight = height * this.cam.zoom
      
      if (options?.strokeOnly) {
        this.ctx.strokeStyle = color
        this.ctx.lineWidth = (options.lineWidth || 1) * this.cam.zoom
        this.ctx.strokeRect(screen.x - scaledWidth/2, screen.y - scaledHeight/2, scaledWidth, scaledHeight)
      } else {
        this.ctx.fillStyle = color
        this.ctx.fillRect(screen.x - scaledWidth/2, screen.y - scaledHeight/2, scaledWidth, scaledHeight)
      }
    } else {
      // Fallback to old behavior if no camera set
      if (options?.strokeOnly) {
        this.ctx.strokeStyle = color
        this.ctx.lineWidth = options.lineWidth || 1
        this.ctx.strokeRect(x, y, width, height)
      } else {
        this.ctx.fillStyle = color
        this.ctx.fillRect(x, y, width, height)
      }
    }
  }

  drawCircle(x: number, y: number, radius: number, color: string, lineWidth: number = 0, strokeOnly: boolean = false) {
    if (this.cam) {
      const screen = this.worldToScreen(x, y, this.cam)
      const scaledRadius = radius * this.cam.zoom
      
      this.ctx.beginPath()
      this.ctx.arc(screen.x, screen.y, scaledRadius, 0, Math.PI * 2)
      
      if (strokeOnly) {
        this.ctx.strokeStyle = color
        this.ctx.lineWidth = lineWidth * this.cam.zoom
        this.ctx.stroke()
      } else {
        this.ctx.fillStyle = color
        this.ctx.fill()
      }
    } else {
      // Fallback to old behavior if no camera set
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
  }

  // Draw image with optional flipping and scaling
  drawImage(image: HTMLImageElement, x: number, y: number, width?: number, height?: number, flipHorizontal: boolean = false) {
    this.ctx.save()
    
    if (this.cam) {
      const screen = this.worldToScreen(x, y, this.cam)
      const drawWidth = (width || image.width) * this.cam.zoom
      const drawHeight = (height || image.height) * this.cam.zoom
      
      if (flipHorizontal) {
        this.ctx.scale(-1, 1)
        this.ctx.drawImage(image, -screen.x - drawWidth/2, screen.y - drawHeight/2, drawWidth, drawHeight)
      } else {
        this.ctx.drawImage(image, screen.x - drawWidth/2, screen.y - drawHeight/2, drawWidth, drawHeight)
      }
    } else {
      // Fallback to old behavior if no camera set
      const drawWidth = width || image.width
      const drawHeight = height || image.height
      
      if (flipHorizontal) {
        this.ctx.scale(-1, 1)
        this.ctx.drawImage(image, -x - drawWidth, y, drawWidth, drawHeight)
      } else {
        this.ctx.drawImage(image, x, y, drawWidth, drawHeight)
      }
    }
    
    this.ctx.restore()
  }

  // Draw text with proper alpha handling
  drawText(text: string, x: number, y: number, color: string = '#fff', font: string = '16px Arial') {
    this.ctx.save()
    
    if (this.cam) {
      const screen = this.worldToScreen(x, y, this.cam)
      
      // Extract alpha from rgba color if present
      if (color.includes('rgba(')) {
        const alphaMatch = color.match(/rgba\([^,]+,[^,]+,[^,]+,([^)]+)\)/)
        if (alphaMatch) {
          const alpha = parseFloat(alphaMatch[1])
          this.ctx.globalAlpha = alpha
          const rgbColor = color.replace(/rgba\(([^,]+,[^,]+,[^,]+),[^)]+\)/, 'rgb($1)')
          this.ctx.fillStyle = rgbColor
        } else {
          this.ctx.fillStyle = color
        }
      } else {
        this.ctx.fillStyle = color
      }
      
      // Scale font size with camera zoom
      const scaledFont = font.replace(/(\d+)px/, (match, size) => `${parseInt(size) * this.cam.zoom}px`)
      this.ctx.font = scaledFont
      this.ctx.fillText(text, screen.x, screen.y)
    } else {
      // Fallback to old behavior if no camera set
      // Extract alpha from rgba color if present
      if (color.includes('rgba(')) {
        const alphaMatch = color.match(/rgba\([^,]+,[^,]+,[^,]+,([^)]+)\)/)
        if (alphaMatch) {
          const alpha = parseFloat(alphaMatch[1])
          this.ctx.globalAlpha = alpha
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
    }
    
    this.ctx.restore()
  }

  // Debug grid to visualize coordinate system
  drawDebugGrid() {
    if (!this.cam) return
    
    this.ctx.save()
    const gridSize = 100 // 100 world units
    const canvasWidth = this.canvas.width
    const canvasHeight = this.canvas.height
    
    // Game world boundaries (assuming 1200x900 world coordinates)
    const gameWorldWidth = 1200
    const gameWorldHeight = 900
    
    // Draw red game area boundary
    this.ctx.strokeStyle = 'red'
    this.ctx.lineWidth = 2
    
    // Top-left corner of game area is at world (0, 0)
    // Bottom-right corner is at world (1200, 900)
    const topLeft = this.worldToScreen(0, 0, this.cam)
    const topRight = this.worldToScreen(gameWorldWidth, 0, this.cam)
    const bottomLeft = this.worldToScreen(0, gameWorldHeight, this.cam)
    const bottomRight = this.worldToScreen(gameWorldWidth, gameWorldHeight, this.cam)
    
    this.ctx.beginPath()
    this.ctx.moveTo(topLeft.x, topLeft.y)
    this.ctx.lineTo(topRight.x, topRight.y)
    this.ctx.lineTo(bottomRight.x, bottomRight.y)
    this.ctx.lineTo(bottomLeft.x, bottomLeft.y)
    this.ctx.closePath()
    this.ctx.stroke()
    
    // Grid lines (white, only within game boundaries)
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
    this.ctx.lineWidth = 1
    this.ctx.font = '12px monospace'
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
    
    // Only draw grid lines within the game world bounds (0 to 1200, 0 to 900)
    const startX = Math.max(0, Math.floor(0 / gridSize) * gridSize)
    const endX = Math.min(gameWorldWidth, Math.ceil(gameWorldWidth / gridSize) * gridSize)
    const startY = Math.max(0, Math.floor(0 / gridSize) * gridSize)
    const endY = Math.min(gameWorldHeight, Math.ceil(gameWorldHeight / gridSize) * gridSize)
    
    // Draw vertical lines
    for (let x = startX; x <= endX; x += gridSize) {
      const topScreen = this.worldToScreen(x, 0, this.cam)
      const bottomScreen = this.worldToScreen(x, gameWorldHeight, this.cam)
      this.ctx.beginPath()
      this.ctx.moveTo(topScreen.x, topScreen.y)
      this.ctx.lineTo(bottomScreen.x, bottomScreen.y)
      this.ctx.stroke()
    }
    
    // Draw horizontal lines
    for (let y = startY; y <= endY; y += gridSize) {
      const leftScreen = this.worldToScreen(0, y, this.cam)
      const rightScreen = this.worldToScreen(gameWorldWidth, y, this.cam)
      this.ctx.beginPath()
      this.ctx.moveTo(leftScreen.x, leftScreen.y)
      this.ctx.lineTo(rightScreen.x, rightScreen.y)
      this.ctx.stroke()
    }
    
    // Draw grid labels (only within game boundaries, excluding the boundary lines)
    for (let x = startX; x < endX; x += gridSize) {
      for (let y = startY; y < endY; y += gridSize) {
        const screen = this.worldToScreen(x, y, this.cam)
        const gridX = x / gridSize
        const gridY = y / gridSize
        this.ctx.fillText(`${gridX},${gridY}`, screen.x + 5, screen.y + 15)
      }
    }
    
    this.ctx.restore()
  }

}