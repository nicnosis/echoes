// BodyPart class for the transformation system
export class BodyPart {
    public type: string
    public imgFileName: string
    public stats: Record<string, number>
    public scale: number
    
    // Sprite rendering
    private sprite: HTMLImageElement | null = null
    private spriteLoaded: boolean = false
    
    // Outline sprite (pre-processed)
    private outlineSprite: HTMLCanvasElement | null = null
    private outlineSpriteLoaded: boolean = false
    
    constructor(type: string, imgFileName: string, stats: Record<string, number>, scale: number = 1) {
        this.type = type
        this.imgFileName = imgFileName
        this.stats = stats
        this.scale = scale
        
        // Load sprite
        this.loadSprite()
    }
    
    // Load sprite from bodyparts folder
    private loadSprite(): void {
        this.sprite = new Image()
        this.sprite.onload = () => {
            this.spriteLoaded = true
            console.log(`${this.type} sprite loaded: ${this.imgFileName}`)
            // Generate outline sprite after main sprite loads
            this.generateOutlineSprite()
        }
        this.sprite.onerror = () => {
            console.error(`Failed to load ${this.type} sprite: ${this.imgFileName}`)
            this.spriteLoaded = false
        }
        this.sprite.src = `/bodyparts/${this.imgFileName}`
    }
    
    // Check if sprite is ready to render
    public isLoaded(): boolean {
        return this.spriteLoaded && this.sprite !== null
    }
    
    // Get the loaded sprite
    public getSprite(): HTMLImageElement | null {
        return this.sprite
    }
    
    // Get the outline sprite
    public getOutlineSprite(): HTMLCanvasElement | null {
        return this.outlineSprite
    }
    
    // Check if outline sprite is ready
    public isOutlineLoaded(): boolean {
        return this.outlineSpriteLoaded && this.outlineSprite !== null
    }
    
    // Generate white outline sprite with silhouette dilation
    private generateOutlineSprite(): void {
        if (!this.sprite || !this.spriteLoaded) return
        
        const originalWidth = this.sprite.naturalWidth
        const originalHeight = this.sprite.naturalHeight
        const outlineThickness = 6 // pixels to expand outline
        
        // Use same canvas size as original sprite (no padding)
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        
        canvas.width = originalWidth
        canvas.height = originalHeight
        
        // Draw the original sprite at normal position
        ctx.drawImage(this.sprite, 0, 0)
        
        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data
        const width = canvas.width
        const height = canvas.height
        
        // Create a copy for the outline
        const outlineData = new Uint8ClampedArray(data)
        
        // Clear the outline data first (start with transparent canvas)
        outlineData.fill(0)
        
        // Dilate FROM sprite pixels outward - find all sprite pixels and expand them
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const index = (y * width + x) * 4
                const alpha = data[index + 3]
                
                // If this pixel is part of the sprite (significantly non-transparent)
                if (alpha > 128) { // Only consider pixels that are at least 50% opaque
                    // Expand this sprite pixel outward in all directions
                    for (let dy = -outlineThickness; dy <= outlineThickness; dy++) {
                        for (let dx = -outlineThickness; dx <= outlineThickness; dx++) {
                            // Use distance check for circular outline
                            if (dx * dx + dy * dy > outlineThickness * outlineThickness) continue
                            
                            const nx = x + dx
                            const ny = y + dy
                            
                            // Skip if out of bounds
                            if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue
                            
                            const targetIndex = (ny * width + nx) * 4
                            
                            // Only set outline pixel if target location is transparent
                            if (data[targetIndex + 3] === 0) {
                                outlineData[targetIndex] = 255     // Red = white
                                outlineData[targetIndex + 1] = 255 // Green = white
                                outlineData[targetIndex + 2] = 255 // Blue = white
                                outlineData[targetIndex + 3] = 255 // Full opacity
                            }
                        }
                    }
                }
            }
        }
        
        // Put the dilated outline data back
        const outlineImageData = new ImageData(outlineData, width, height)
        ctx.putImageData(outlineImageData, 0, 0)
        
        this.outlineSprite = canvas
        this.outlineSpriteLoaded = true
        console.log(`${this.type} outline sprite generated with dilation`)
    }
}

// Hard-coded positions for body part nodes (relative to player center) with draw order
export const BODY_POSITIONS = {
    arms: { x: 0, y: -5, drawOrder: 205 },
    torso: { x: 0, y: 0, drawOrder: 210 },
    head: { x: 0, y: -20, drawOrder: 220 },
    legs: { x: 0, y: 15, drawOrder: 215 }
}